import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { TripDetail, TripRecord } from "@/api/tripTypes";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import {
  formatAccuracyMeters,
  formatCep,
  formatSpeedKmh,
  formatTripTime,
} from "@/domain/format";
import { stageLabels, stageOrder, tripSignal } from "@/domain/tripStages";
import { colors, radius, spacing, typography } from "@/theme/colors";
import { readCityData } from "./route";

type Props = { detail: TripDetail; now: number };

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function Step({
  title,
  text,
  state,
  icon,
}: {
  title?: string;
  text: string;
  state: "current" | "done" | "idle";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.step}>
      <View style={[styles.bullet, state !== "idle" && styles.bulletDone]}>
        {state === "current" ? (
          <View style={styles.bulletDot} />
        ) : icon || state === "done" ? (
          <Ionicons
            name={icon ?? "checkmark"}
            size={12}
            color={state === "done" ? colors.primaryForeground : colors.primary}
          />
        ) : null}
      </View>
      <View style={styles.stepBody}>
        {title ? <Text style={styles.stepTitle}>{title}</Text> : null}
        <Text style={styles.stepText}>{text}</Text>
      </View>
    </View>
  );
}

function CityTimeline({ trip, now }: { trip: TripRecord; now: number }) {
  const data = readCityData(trip.cityData);
  const visits = data?.visits ?? [];
  const last = visits[visits.length - 1];
  const positionAt = trip.positionAt
    ? new Date(trip.positionAt).getTime()
    : null;
  const current =
    !!last &&
    trip.trackingEnabled &&
    trip.stage === "transito" &&
    data?.status === "ready" &&
    positionAt != null &&
    data.matchedAt === new Date(positionAt).toISOString() &&
    now - positionAt <= 120000 &&
    now >= positionAt;
  return (
    <>
      <Step
        icon="location-outline"
        state="idle"
        title="Cidades no trajeto"
        text={
          data?.status === "unavailable"
            ? "Identificação do município temporariamente indisponível"
            : !visits.length
              ? "Aguardando localização após a saída do carregamento"
              : "Municípios identificados pelo GPS, na ordem da viagem"
        }
      />
      {visits.map((visit, index) => {
        const active = current && index === visits.length - 1;
        return (
          <Step
            key={visit.firstAt + "-" + index}
            state={active ? "current" : "done"}
            title={
              (active ? "Passando por " : "Passagem por ") +
              visit.city +
              " / " +
              visit.uf
            }
            text={
              formatTripTime(new Date(visit.firstAt)) +
              " · primeiro GPS identificado no município"
            }
          />
        );
      })}
      {last && !current ? (
        <Step
          state="idle"
          text={
            "Última cidade identificada: " +
            last.city +
            " / " +
            last.uf +
            ". A posição atual depende de um novo GPS identificado."
          }
        />
      ) : null}
    </>
  );
}

function Meta({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={15} color={colors.primary} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

export function TripDetailCard({ detail, now }: Props) {
  const trip = detail.trip;
  return (
    <Card>
      <View style={styles.top}>
        <Text style={styles.reference}>
          {trip.reference} · {trip.vehicle}
        </Text>
        <Text style={styles.plate}>{trip.plate}</Text>
        <Badge label={stageLabels[trip.stage]} variant="secondary" />
      </View>

      <View style={styles.person}>
        {detail.driverPhotoUrl ? (
          <Image
            source={{ uri: detail.driverPhotoUrl }}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel={trip.driver}
          />
        ) : (
          <View style={[styles.photo, styles.photoFallback]}>
            <Text style={styles.photoInitials}>{initials(trip.driver)}</Text>
          </View>
        )}
        <View style={styles.personBody}>
          <Text style={styles.personName}>{trip.driver}</Text>
          <Text style={styles.personClient}>{trip.client}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={15} color={colors.primary} />
          <View style={styles.routeBody}>
            <Text style={styles.small}>COLETA</Text>
            <Text style={styles.routeText}>{trip.origin}</Text>
            <Text style={styles.small}>CEP: {formatCep(trip.pickupCep)}</Text>
          </View>
        </View>
        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={15} color={colors.primary} />
          <View style={styles.routeBody}>
            <Text style={styles.small}>ENTREGA</Text>
            <Text style={styles.routeText}>{trip.destination}</Text>
            <Text style={styles.small}>CEP: {formatCep(trip.deliveryCep)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.meta}>
        <Meta
          icon="cube-outline"
          text={trip.cargo + " · " + trip.weightTons + " t"}
        />
        <Meta icon="radio-outline" text={tripSignal(trip, now)} />
        <Meta
          icon="time-outline"
          text={"Último GPS: " + formatTripTime(trip.positionAt)}
        />
        {trip.positionAt ? (
          <Text style={styles.small}>
            Precisão: {formatAccuracyMeters(trip.accuracy)} · Velocidade
            registrada: {formatSpeedKmh(trip.speed)}
          </Text>
        ) : null}
      </View>

      <View style={styles.timeline}>
        {stageOrder
          .filter(
            (stage) =>
              stage !== "descarga" ||
              trip.stage === "descarga" ||
              detail.events.some((event) => event.stage === "descarga"),
          )
          .map((stage) => {
            const event = [...detail.events]
              .reverse()
              .find((item) => item.stage === stage);
            const current = trip.stage === stage;
            return (
              <Fragment key={stage}>
                <Step
                  state={current ? "current" : event ? "done" : "idle"}
                  title={stageLabels[stage]}
                  text={
                    event
                      ? formatTripTime(event.recordedAt)
                      : "Aguardando registro"
                  }
                />
                {stage === "transito" ? (
                  <CityTimeline trip={trip} now={now} />
                ) : null}
              </Fragment>
            );
          })}
      </View>

      {trip.stage === "cancelada" ? (
        <Text style={styles.cancelled}>
          Viagem cancelada · rastreamento encerrado
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { gap: spacing.xs },
  reference: { ...typography.small, color: colors.mutedForeground },
  plate: { ...typography.title, color: colors.foreground },
  person: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  photo: { width: 48, height: 48, borderRadius: radius.full },
  photoFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  photoInitials: { ...typography.bodyStrong, color: colors.accentForeground },
  personBody: { flex: 1 },
  personName: { ...typography.bodyStrong, color: colors.foreground },
  personClient: { ...typography.small, color: colors.mutedForeground },
  route: { gap: spacing.md },
  routeRow: { flexDirection: "row", gap: spacing.sm },
  routeBody: { flex: 1, gap: 2 },
  routeText: { ...typography.body, color: colors.foreground },
  small: { ...typography.caption, color: colors.mutedForeground },
  meta: { gap: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaText: { ...typography.small, flex: 1, color: colors.foreground },
  timeline: { gap: spacing.md },
  step: { flexDirection: "row", gap: spacing.sm + 4 },
  bullet: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  bulletDone: { borderColor: colors.primary, backgroundColor: colors.primary },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryForeground,
  },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: { ...typography.bodyStrong, color: colors.foreground },
  stepText: { ...typography.small, color: colors.mutedForeground },
  cancelled: { ...typography.small, color: colors.error },
});
