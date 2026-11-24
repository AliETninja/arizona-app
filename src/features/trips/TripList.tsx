import { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { TripRecord } from "@/api/tripTypes";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ListScreen } from "@/components/ListScreen";
import {
  isActiveTrip,
  isHistoryTrip,
  isTerminalStage,
  stageLabels,
} from "@/domain/tripStages";
import { colors, spacing, typography } from "@/theme/colors";
import { tripHref } from "@/navigation/routes";
import { useDriverTrips } from "./useDriverTrips";

type Mode = "corridas" | "historico";

type Props = { mode: Mode; title: string; subtitle: string };

const mono = Platform.select({ ios: "Menlo", default: "monospace" });

const copy = {
  corridas: {
    heading: "Viagens atribuídas",
    text: "A empresa responsável vincula cada corrida à sua conta.",
    emptyTitle: "Nenhuma corrida atribuída",
    emptyText:
      "Quando uma empresa vincular uma viagem ao seu cadastro, ela aparecerá aqui.",
  },
  historico: {
    heading: "Corridas concluídas",
    text: "Somente corridas realizadas com sucesso.",
    emptyTitle: "Nenhuma corrida no histórico",
    emptyText: "As corridas concluídas com sucesso aparecerão aqui.",
  },
};

function actionLabel(trip: TripRecord) {
  if (isTerminalStage(trip.stage)) return "Viagem encerrada";
  if (!trip.acceptedAt) return "Ver e aceitar corrida";
  return trip.trackingEnabled ? "Abrir viagem" : "Retomar corrida";
}

function TripCard({ trip }: { trip: TripRecord }) {
  const router = useRouter();
  const ended = isTerminalStage(trip.stage);
  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.flex}>
          <Text style={styles.reference}>{trip.reference}</Text>
          <Text style={styles.stage}>{stageLabels[trip.stage]}</Text>
        </View>
        <MaterialCommunityIcons name="truck" size={21} color={colors.primary} />
      </View>
      <View>
        <View style={styles.routeRow}>
          <Ionicons name="location-outline" size={15} color={colors.primary} />
          <Text style={styles.routeText}>{trip.origin}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <Ionicons
            name="checkmark-circle-outline"
            size={15}
            color={colors.primary}
          />
          <Text style={styles.routeText}>{trip.destination}</Text>
        </View>
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          <Text style={styles.plate}>{trip.plate}</Text>
          {" · " + trip.vehicle}
        </Text>
        <Text style={styles.metaText}>{trip.client}</Text>
      </View>
      <Button
        label={actionLabel(trip)}
        disabled={ended}
        onPress={() => router.push(tripHref(trip.id))}
      />
    </Card>
  );
}

export function TripList({ mode, title, subtitle }: Props) {
  const trips = useDriverTrips();
  const [pulling, setPulling] = useState(false);
  const text = copy[mode];
  const visible = (trips.data ?? []).filter(
    mode === "historico" ? isHistoryTrip : isActiveTrip,
  );

  const pull = useCallback(async () => {
    setPulling(true);
    try {
      await trips.refetch();
    } finally {
      setPulling(false);
    }
  }, [trips]);

  const header = (
    <View style={styles.title}>
      <View style={styles.flex}>
        <Text style={styles.heading}>{text.heading}</Text>
        <Text style={styles.headingText}>{text.text}</Text>
      </View>
      <Button
        label="Atualizar"
        icon="refresh"
        variant="outline"
        size="sm"
        onPress={() => trips.refetch()}
      />
    </View>
  );

  const empty = trips.isPending ? (
    <View style={styles.skeleton} />
  ) : trips.error ? (
    <Text style={styles.error}>{trips.error.message}</Text>
  ) : (
    <EmptyState
      title={text.emptyTitle}
      text={text.emptyText}
      icon="car-outline"
    />
  );

  return (
    <ListScreen
      title={title}
      subtitle={subtitle}
      header={header}
      data={trips.isPending || trips.error ? [] : visible}
      keyExtractor={(trip) => trip.id}
      renderItem={({ item }) => <TripCard trip={item} />}
      ListEmptyComponent={empty}
      refreshing={pulling}
      onRefresh={pull}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  flex: { flex: 1 },
  title: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 2,
  },
  heading: { fontSize: 19, fontWeight: "600", color: colors.foreground },
  headingText: {
    ...typography.small,
    color: colors.mutedForeground,
    marginTop: 5,
  },
  skeleton: {
    height: 220,
    borderRadius: 10,
    backgroundColor: colors.muted,
  },
  error: { fontSize: 13, color: colors.error },
  top: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  reference: {
    fontFamily: mono,
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  stage: { fontSize: 10, color: colors.mutedForeground },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  routeText: { flex: 1, fontSize: 12, color: colors.foreground },
  routeLine: {
    width: 1,
    height: 18,
    marginVertical: 5,
    marginLeft: 7,
    backgroundColor: colors.border,
  },
  meta: { gap: 4 },
  metaText: { fontSize: 11, color: colors.mutedForeground },
  plate: { fontFamily: mono, color: colors.foreground },
});
