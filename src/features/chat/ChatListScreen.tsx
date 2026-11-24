import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { negotiationHref } from "@/navigation/routes";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/ErrorState";
import { ListScreen } from "@/components/ListScreen";
import { Spinner } from "@/components/Spinner";
import { groupNegotiations } from "@/domain/negotiations";
import type { NegotiationGroup } from "@/domain/negotiations";
import { colors, radius, spacing } from "@/theme/colors";
import { ChatIdentity } from "./ChatIdentity";
import { useChatUserId } from "./useChatUser";
import { notificationsKey } from "./useUnreadCount";
import { useThreads } from "./useThreads";

export function ChatListScreen() {
  const userId = useChatUserId();
  const router = useRouter();
  const qc = useQueryClient();
  const threads = useThreads(userId);
  const groups = useMemo(
    () => groupNegotiations(threads.data || []),
    [threads.data],
  );

  const refresh = () => {
    void threads.refetch();
    void qc.invalidateQueries({ queryKey: notificationsKey(userId) });
  };

  const open = (group: NegotiationGroup) =>
    router.push(negotiationHref(group.latest.opportunityId));

  return (
    <ListScreen
      title="Chat de negociação"
      subtitle="Cada empresa tem seu próprio chat. Todos os anúncios entre vocês aparecem na mesma conversa."
      data={groups}
      keyExtractor={(group) => group.id}
      refreshing={threads.isRefetching && !threads.isPending}
      onRefresh={refresh}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => open(item)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <ChatIdentity
            name={item.latest.companyName || "Empresa anunciante"}
            image={item.latest.companyLogoUrl}
          />
          <Text style={styles.meta}>
            {item.offers.length} anúncio{item.offers.length === 1 ? "" : "s"} ·{" "}
            {item.latest.reference}
          </Text>
          <Text style={styles.preview} numberOfLines={1}>
            {item.latest.message}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        threads.isPending ? (
          <View style={styles.center}>
            <Spinner />
            <Text style={styles.muted}>Carregando conversas…</Text>
          </View>
        ) : threads.isError ? (
          <ErrorState message={threads.error.message} onRetry={refresh} />
        ) : (
          <Text style={styles.empty}>
            Abra uma viagem disponível para iniciar uma negociação.
          </Text>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 7,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.8 },
  meta: { fontSize: 11, color: colors.mutedForeground },
  preview: { fontSize: 11, color: colors.mutedForeground },
  center: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  empty: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.mutedForeground,
    padding: 10,
  },
  muted: { fontSize: 13, color: colors.mutedForeground },
});
