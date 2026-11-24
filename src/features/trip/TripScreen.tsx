import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { readTrip } from "@/api/trip";
import type { TripDetail } from "@/api/tripTypes";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Spinner } from "@/components/Spinner";
import { webBaseUrl } from "@/config/environment";
import { formatCoordinate } from "@/domain/format";
import { isTerminalStage, stageLabels } from "@/domain/tripStages";
import { tripsPollMs, usePolling } from "@/hooks/usePolling";
import { accessError } from "@/tracking/constants";
import { isTripId } from "@/tracking/storage";
import { tripDetailKey, useTripTracking } from "@/tracking/useTripTracking";
import { colors, radius, spacing, typography } from "@/theme/colors";
import { openDriverTrip } from "./openDriverTrip";
import { TripDetailCard } from "./TripDetailCard";
import { TripMap } from "./TripMap";
import { TripTrackingCard } from "./TripTrackingCard";

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Notice({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry?: () => void;
}) {
  return (
    <Card style={styles.notice}>
      <Text accessibilityRole="header" style={styles.noticeTitle}>
        {title}
      </Text>
      <Text style={styles.noticeText}>{text}</Text>
      {onRetry ? (
        <Button
          label="Tentar novamente"
          icon="refresh"
          variant="outline"
          onPress={onRetry}
        />
      ) : null}
    </Card>
  );
}

function LiveTrip({
  detail,
  token,
  now,
  online,
  error,
  refresh,
}: {
  detail: TripDetail;
  token: string;
  now: number;
  online: boolean;
  error: string | null;
  refresh: () => void;
}) {
  const trip = detail.trip;
  const driver = detail.role === "driver";
  const [agreed, setAgreed] = useState(false);
  const resumeAttempt = useRef(false);
  const gps = useTripTracking(token, trip.id, driver);
  const ended = isTerminalStage(trip.stage);
  const { active, busy, start, halt } = gps;
  const resumable = driver && !ended && !!trip.acceptedAt && !!trip.consentAt;

  useEffect(() => {
    if (resumable && !active && !busy && !resumeAttempt.current) {
      resumeAttempt.current = true;
      void start();
    }
  }, [resumable, active, busy, start]);

  useEffect(() => {
    if (ended && active) void halt();
  }, [ended, active, halt]);

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.reference}>
          {trip.reference} · {trip.plate}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          {driver
            ? "Sua viagem, do início ao fim."
            : "Sua carga está a caminho."}
        </Text>
        <Text style={styles.subtitle}>
          {trip.client} · {trip.origin} → {trip.destination}
        </Text>
        <View style={styles.status}>
          <View
            style={[
              styles.dot,
              { backgroundColor: online ? colors.success : colors.warning },
            ]}
          />
          <Text style={styles.statusText}>
            {online ? "Conectado" : "Sem atualização ao vivo"}
          </Text>
        </View>
      </View>

      {driver ? (
        <TripTrackingCard
          trip={trip}
          ended={ended}
          gps={gps}
          agreed={agreed}
          onAgree={setAgreed}
          onAccept={() => void start(true)}
        />
      ) : null}

      <TripMap trip={trip} points={detail.points} now={now} />

      <View style={styles.telemetry}>
        <Text style={styles.telemetryText}>
          {trip.positionAt
            ? formatCoordinate(trip.latitude) +
              ", " +
              formatCoordinate(trip.longitude)
            : "Aguardando a primeira posição do celular."}
        </Text>
        <Button
          label="Atualizar"
          icon="refresh"
          variant="ghost"
          size="sm"
          onPress={refresh}
        />
      </View>

      {driver && !ended ? (
        <Card>
          <Text style={styles.eyebrow}>ETAPAS AUTOMÁTICAS PELO GPS</Text>
          <Text style={styles.sectionTitle}>{stageLabels[trip.stage]}</Text>
          <Text style={styles.sectionText}>
            Após o aceite, o GPS identifica o deslocamento, a presença no
            carregamento e a chegada ao destino cadastrado. Você não precisa
            confirmar etapas. A empresa responsável finaliza a corrida após a
            descarga.
          </Text>
        </Card>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      <TripDetailCard detail={detail} now={now} />

      {driver &&
      !ended &&
      (trip.stage === "entrega" || trip.stage === "descarga") ? (
        <Card>
          <Text style={styles.sectionTitle}>
            Aguardando finalização pela empresa
          </Text>
          <Text style={styles.sectionText}>
            A empresa responsável pelo monitoramento confirma a conclusão da
            corrida. O GPS continua ativo até essa confirmação.
          </Text>
        </Card>
      ) : null}
    </>
  );
}

export function TripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tripId: string }>();
  const tripId = (
    Array.isArray(params.tripId) ? params.tripId[0] : params.tripId || ""
  ).toLowerCase();
  const valid = isTripId(tripId);
  const now = useNow();
  const interval = usePolling(tripsPollMs);

  const access = useQuery({
    queryKey: ["driver-trip-access", tripId],
    queryFn: () => openDriverTrip(tripId),
    enabled: valid,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  const token = access.data || "";
  const live = useQuery({
    queryKey: tripDetailKey(token),
    queryFn: async ({ signal }) => {
      const detail = (await readTrip(token, signal)).detail;
      if (!detail) throw new Error("Não foi possível acessar a viagem.");
      return detail;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    refetchOnMount: "always",
    refetchInterval: interval,
  });

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };
  const revoked = !!live.error && accessError.test(live.error.message);
  const failure = access.error || (!live.data || revoked ? live.error : null);
  const retry = () => {
    if (access.error || revoked) void access.refetch();
    else void live.refetch();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={back}
        >
          <Ionicons name="chevron-back" size={26} color={colors.foreground} />
        </Pressable>
        <Text style={styles.eyebrow}>APP DO MOTORISTA</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={live.isRefetching && !live.isFetchedAfterMount}
            onRefresh={() => void live.refetch()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!valid ? (
          <Notice
            title="Abra o link da viagem"
            text="Peça à central Arizona Log o seu link de acesso."
          />
        ) : failure ? (
          <Notice
            title="Acesso à viagem indisponível"
            text={failure.message}
            onRetry={retry}
          />
        ) : live.data ? (
          <LiveTrip
            key={live.data.trip.id}
            detail={live.data}
            token={token}
            now={now}
            online={!live.isError}
            error={live.error ? live.error.message : null}
            refresh={() => void live.refetch()}
          />
        ) : (
          <View style={styles.loading}>
            <Spinner size="lg" />
          </View>
        )}
        <Text style={styles.footer}>
          Arizona Log Transportes ·{" "}
          <Text
            accessibilityRole="link"
            style={styles.link}
            onPress={() =>
              void WebBrowser.openBrowserAsync(webBaseUrl() + "/privacidade")
            }
          >
            Privacidade e localização
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  eyebrow: { ...typography.eyebrow, color: colors.primary },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  loading: { height: 450, alignItems: "center", justifyContent: "center" },
  notice: { alignItems: "flex-start" },
  noticeTitle: { ...typography.heading, color: colors.foreground },
  noticeText: { ...typography.body, color: colors.mutedForeground },
  heading: { gap: spacing.xs },
  reference: { ...typography.eyebrow, color: colors.primary },
  title: { ...typography.title, color: colors.foreground },
  subtitle: { ...typography.small, color: colors.mutedForeground },
  status: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  statusText: { ...typography.small, color: colors.foreground },
  telemetry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  telemetryText: {
    ...typography.small,
    flex: 1,
    color: colors.mutedForeground,
  },
  sectionTitle: { ...typography.heading, color: colors.foreground },
  sectionText: { ...typography.small, color: colors.mutedForeground },
  errorText: { ...typography.small, color: colors.error },
  footer: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  link: { color: colors.primary, textDecorationLine: "underline" },
});
