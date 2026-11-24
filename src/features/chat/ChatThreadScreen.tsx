import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  listMessages,
  markNotificationsRead,
  sendMessage,
} from "@/api/negotiations";
import type { ChatMessage } from "@/api/negotiations";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { formatDayMonthTime } from "@/domain/format";
import { groupNegotiations, negotiationTimeline } from "@/domain/negotiations";
import type { NegotiationEntry } from "@/domain/negotiations";
import { negotiationsPollMs, useAppActive } from "@/hooks/usePolling";
import { tripHref } from "@/navigation/routes";
import { colors, radius, spacing, tints } from "@/theme/colors";
import { ChatIdentity } from "./ChatIdentity";
import { FreightCard } from "./FreightCard";
import { useChatUserId } from "./useChatUser";
import { threadsKey, useThreads } from "./useThreads";
import { notificationsKey } from "./useUnreadCount";

const pendingPrefix = "pending-";

const errorText = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "Não foi possível acessar a conversa.";

export function ChatThreadScreen() {
  const params = useLocalSearchParams<{ opportunityId: string }>();
  const opportunityId = Array.isArray(params.opportunityId)
    ? params.opportunityId[0]
    : params.opportunityId;
  const userId = useChatUserId();
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const appActive = useAppActive();
  const reading = focused && appActive;

  const [chosen, setChosen] = useState({
    param: opportunityId,
    id: opportunityId,
  });
  const selectedId = chosen.param === opportunityId ? chosen.id : opportunityId;
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [olderState, setOlderState] = useState<{
    groupId: string;
    items: ChatMessage[];
    more: boolean | null;
  }>({ groupId: "", items: [], more: null });
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState<string | null>(null);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const list = useRef<FlatList<NegotiationEntry>>(null);
  const readIds = useRef(new Set<string>());

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardShown(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardShown(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const threads = useThreads(userId);
  const groups = useMemo(
    () => groupNegotiations(threads.data || []),
    [threads.data],
  );
  const group = groups.find((g) =>
    g.offers.some((t) => t.opportunityId === selectedId),
  );
  const active = threads.data?.find((t) => t.opportunityId === selectedId);
  const groupId = group?.id || opportunityId;
  const peer = group?.latest || active;

  const messagesKey = ["chat-messages", userId, groupId];
  const messages = useQuery({
    queryKey: messagesKey,
    queryFn: () =>
      listMessages({
        opportunityId: selectedId,
        driverUserId: userId,
        group: true,
      }),
    enabled: userId > 0 && !!selectedId,
    refetchInterval: reading ? negotiationsPollMs : false,
    placeholderData: (previous) => previous,
  });

  const older = useMemo(
    () => (olderState.groupId === groupId ? olderState.items : []),
    [olderState, groupId],
  );
  const moreOlder = olderState.groupId === groupId ? olderState.more : null;

  const peerName =
    peer?.companyName || messages.data?.company?.name || "Empresa anunciante";
  const peerImage = peer?.companyLogoUrl || messages.data?.company?.logoUrl;

  const stored = useMemo(
    () =>
      [
        ...new Map(
          [...older, ...(messages.data?.messages || [])].map((m) => [m.id, m]),
        ).values(),
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
          a.id.localeCompare(b.id),
      ),
    [older, messages.data],
  );

  const entries = useMemo(
    () =>
      negotiationTimeline(group?.offers || [], [...stored, ...pending])
        .slice()
        .reverse(),
    [group, stored, pending],
  );

  const showOlder =
    (moreOlder ?? messages.data?.hasMore) === true && stored.length > 0;

  const loadOlder = async () => {
    const first = stored[0];
    if (!first || loadingOlder) return;
    const requested = groupId;
    setLoadingOlder(true);
    setOlderError(null);
    try {
      const result = await listMessages({
        opportunityId: selectedId,
        driverUserId: userId,
        group: true,
        before: { createdAt: new Date(first.createdAt), id: first.id },
      });
      if (requested !== groupId) return;
      setOlderState({
        groupId,
        items: [...(result.messages || []), ...older],
        more: !!result.hasMore,
      });
    } catch (error) {
      setOlderError(errorText(error));
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    if (!reading) return;
    const ids = stored
      .filter((m) => m.senderUserId !== userId && !readIds.current.has(m.id))
      .map((m) => m.id);
    for (let i = 0; i < ids.length; i += 200) {
      const batch = ids.slice(i, i + 200);
      batch.forEach((id) => readIds.current.add(id));
      markNotificationsRead(batch)
        .then(() =>
          qc.invalidateQueries({ queryKey: notificationsKey(userId) }),
        )
        .catch(() => batch.forEach((id) => readIds.current.delete(id)));
    }
  }, [stored, userId, reading, qc]);

  const scrollToNewest = useCallback(() => {
    list.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const lastId = stored[stored.length - 1]?.id;
  const lastSender = stored[stored.length - 1]?.senderUserId;
  const seenLast = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (seenLast.current !== undefined && lastId !== seenLast.current)
      if (lastSender === userId) scrollToNewest();
    seenLast.current = lastId;
  }, [lastId, lastSender, userId, scrollToNewest]);

  const [sending, setSending] = useState(false);

  const submit = async () => {
    const text = body.trim();
    if (!text || sending || !selectedId) return;
    const id = pendingPrefix + Date.now();
    setSending(true);
    setSendError(null);
    setBody("");
    setPending([
      {
        id,
        senderUserId: userId,
        body: text,
        createdAt: new Date(),
        opportunityId: selectedId,
        reference: active?.reference,
      },
    ]);
    setTimeout(scrollToNewest, 50);
    try {
      await sendMessage({
        opportunityId: selectedId,
        driverUserId: userId,
        body: text,
      });
    } catch (error) {
      setPending([]);
      setBody((current) => current || text);
      setSendError(errorText(error));
      setSending(false);
      return;
    }
    try {
      await Promise.all([
        qc.refetchQueries({ queryKey: ["chat-messages", userId] }),
        qc.invalidateQueries({ queryKey: threadsKey(userId) }),
        qc.invalidateQueries({ queryKey: ["driver-offers", userId] }),
      ]);
    } catch {}
    setPending([]);
    setSending(false);
  };

  const openTrip = (tripId: string) => router.push(tripHref(tripId));

  const choose = (id: string) => {
    setChosen({ param: opportunityId, id });
    setBody("");
    setSendError(null);
  };

  const renderItem = ({ item }: { item: NegotiationEntry }) => {
    if (item.type === "offer")
      return (
        <FreightCard
          offer={item.offer}
          selected={item.offer.opportunityId === selectedId}
          onSelect={() => choose(item.offer.opportunityId)}
          onOpen={() => openTrip(item.offer.tripId!)}
        />
      );
    const m = item.message;
    const mine = m.senderUserId === userId;
    const isPending = m.id.startsWith(pendingPrefix);
    return (
      <View
        style={[
          styles.bubble,
          mine ? styles.mine : styles.theirs,
          isPending && styles.sending,
        ]}
      >
        <Text style={styles.small}>
          {mine ? "Você" : peerName}
          {m.reference ? " · " + m.reference : ""}
        </Text>
        {m.origin && m.destination ? (
          <Text style={styles.route}>
            {m.origin} → {m.destination}
          </Text>
        ) : null}
        <Text style={styles.text}>{m.body}</Text>
        <Text style={styles.small}>
          {isPending ? "Enviando…" : formatDayMonthTime(m.createdAt)}
        </Text>
      </View>
    );
  };

  const empty =
    messages.isPending && !messages.data ? (
      <View style={styles.center}>
        <Spinner />
        <Text style={styles.muted}>Carregando mensagens…</Text>
      </View>
    ) : messages.isError && !messages.data ? (
      <Text style={styles.error}>{errorText(messages.error)}</Text>
    ) : (
      <Text style={styles.emptyText}>
        Nenhuma mensagem ainda. Comece a conversa abaixo.
      </Text>
    );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <View style={styles.headerBody}>
          <ChatIdentity name={peerName} image={peerImage} large />
          <Text style={styles.muted}>
            Novas negociações aparecem no histórico abaixo.
          </Text>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={list}
          inverted
          data={entries}
          keyExtractor={(entry) => entry.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={styles.content}
          ListEmptyComponent={<View style={styles.flipped}>{empty}</View>}
          ListFooterComponent={
            <View style={styles.footer}>
              {showOlder ? (
                <Button
                  size="sm"
                  variant="outline"
                  loading={loadingOlder}
                  label={
                    loadingOlder
                      ? "Carregando…"
                      : "Carregar mensagens anteriores"
                  }
                  onPress={loadOlder}
                />
              ) : null}
              {olderError ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  {olderError}
                </Text>
              ) : null}
            </View>
          }
        />
        {sendError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {sendError}
          </Text>
        ) : null}
        <View
          style={[
            styles.composer,
            {
              paddingBottom: keyboardShown
                ? spacing.sm
                : insets.bottom + spacing.sm,
            },
          ]}
        >
          <TextInput
            accessibilityLabel="Mensagem da negociação"
            placeholder={
              active
                ? "Mensagem sobre " + active.reference + "…"
                : "Escreva sua mensagem…"
            }
            placeholderTextColor={colors.mutedForeground}
            maxLength={2000}
            multiline
            value={body}
            onChangeText={setBody}
            style={styles.input}
          />
          <Button
            icon="send"
            size="sm"
            label={sending ? "Enviando…" : "Enviar"}
            disabled={!body.trim() || sending}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerBody: { flex: 1, gap: 7 },
  content: { padding: spacing.md, gap: 12 },
  footer: { gap: spacing.sm, alignItems: "stretch" },
  flipped: { transform: [{ scaleY: -1 }] },
  center: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  bubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.card },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
    borderColor: tints.featured + "60",
  },
  sending: { opacity: 0.6 },
  small: { fontSize: 11, color: colors.mutedForeground },
  route: { fontSize: 11, color: colors.mutedForeground, marginTop: 5 },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.foreground,
    marginVertical: 7,
  },
  muted: { fontSize: 12, color: colors.mutedForeground },
  emptyText: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    color: colors.mutedForeground,
    padding: 35,
  },
  error: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
});
