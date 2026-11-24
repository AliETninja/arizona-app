import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, Polyline } from "react-native-maps";
import type { LatLng, Region } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { TripPoint, TripRecord } from "@/api/tripTypes";
import { Button } from "@/components/Button";
import { formatCep } from "@/domain/format";
import { tripSignal } from "@/domain/tripStages";
import { colors, radius, spacing, tints, typography } from "@/theme/colors";
import { readDetour, readPlannedRoute, thinPath } from "./route";

type Props = { trip: TripRecord; points: TripPoint[]; now: number };

const brazil: Region = {
  latitude: -14.2,
  longitude: -51.9,
  latitudeDelta: 42,
  longitudeDelta: 42,
};
const routeBlue = "#2563eb";
const routeRed = "#dc2626";
const pickupGreen = "#16a34a";
const padding = { top: 60, right: 50, bottom: 60, left: 50 };

const toLatLng = (point: [number, number]): LatLng => ({
  latitude: point[0],
  longitude: point[1],
});

const kilometers = (meters: number) =>
  (meters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function truckLabel(driver: string, plate: string) {
  const firstName = driver.trim().split(/\s+/u)[0] || "Motorista";
  return firstName + " · " + (plate.trim().toUpperCase() || "Sem placa");
}

function Stop({
  coordinate,
  color,
  title,
}: {
  coordinate: LatLng;
  color: string;
  title: string;
}) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View style={[styles.stop, { backgroundColor: color }]} />
    </Marker>
  );
}

export function TripMap({ trip, points, now }: Props) {
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [following, setFollowing] = useState(true);
  const centered = useRef(false);
  const [fitted, setFitted] = useState<LatLng[] | null>(null);

  const { routeData, detourData, pickupCep, deliveryCep, origin, destination } =
    trip;
  const planned = useMemo(
    () =>
      readPlannedRoute({
        routeData,
        pickupCep,
        deliveryCep,
        origin,
        destination,
      }),
    [routeData, pickupCep, deliveryCep, origin, destination],
  );
  const detour = useMemo(
    () => readDetour(detourData, planned),
    [detourData, planned],
  );
  const plannedPath = useMemo(
    () => (planned ? thinPath(planned.path).map(toLatLng) : []),
    [planned],
  );
  const detourPath = useMemo(
    () =>
      detour?.status === "ready" && detour.path
        ? thinPath(detour.path).map(toLatLng)
        : [],
    [detour],
  );
  const trail = useMemo(
    () =>
      points.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    [points],
  );

  const hasPosition =
    trip.latitude != null && trip.longitude != null && !!trip.positionAt;
  const latitude = trip.latitude ?? 0;
  const longitude = trip.longitude ?? 0;
  const signal = tripSignal(trip, now);
  const recent = signal === "GPS recente";
  const age = trip.positionAt
    ? Math.max(
        0,
        Math.floor((now - new Date(trip.positionAt).getTime()) / 60000),
      )
    : null;

  if (plannedPath.length && fitted !== plannedPath) {
    setFitted(plannedPath);
    setFollowing(false);
  }

  useEffect(() => {
    if (!ready || !plannedPath.length) return;
    map.current?.fitToCoordinates(plannedPath, {
      edgePadding: padding,
      animated: false,
    });
    centered.current = true;
  }, [ready, plannedPath]);

  useEffect(() => {
    if (!ready || !hasPosition) return;
    if (centered.current && !following) return;
    map.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      centered.current ? 700 : 0,
    );
    centered.current = true;
  }, [ready, hasPosition, latitude, longitude, following]);

  const showBrazil = () => {
    setFollowing(false);
    map.current?.animateToRegion(brazil, 500);
  };
  const follow = () => {
    if (!hasPosition) return;
    setFollowing(true);
    map.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      500,
    );
  };
  const fit = () => {
    const coordinates = [...plannedPath, ...detourPath, ...trail];
    if (hasPosition) coordinates.push({ latitude, longitude });
    if (!coordinates.length) return;
    setFollowing(false);
    map.current?.fitToCoordinates(coordinates, {
      edgePadding: padding,
      animated: true,
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>
          ROTA PREVISTA · <Text style={{ color: routeBlue }}>━</Text> azul{" "}
          <Text style={{ color: routeRed }}>━</Text> alternativa vermelha{" "}
          <Text style={{ color: tints.featured }}>━</Text> histórico GPS
        </Text>
        <Text style={styles.summaryText}>
          {planned?.origin
            ? "Origem: primeiro GPS do veículo"
            : "Origem: aguardando o primeiro GPS"}{" "}
          → Carregamento: {trip.origin} · {formatCep(trip.pickupCep)} →
          Descarga: {trip.destination} · {formatCep(trip.deliveryCep)}
        </Text>
        <Text style={styles.summarySmall}>
          {planned
            ? kilometers(planned.distance) +
              " km · " +
              (planned.source === "TomTom Fastest"
                ? "Rota comum mais rápida · Carros e caminhões · Sem filtros de medidas, peso ou eixos."
                : "Rota planejada salva anteriormente.")
            : "A empresa precisa conferir os pontos e os dados do veículo em Conferir endereços e pontos da rota."}
        </Text>
      </View>

      {detour ? (
        <View style={styles.deviation}>
          <Ionicons name="warning-outline" size={18} color={colors.error} />
          <View style={styles.deviationBody}>
            <Text style={styles.deviationTitle}>
              VEÍCULO FORA DA ROTA PREVISTA
            </Text>
            <Text style={styles.summaryText}>
              {detour.status === "ready"
                ? "Nova rota em vermelho: posição do veículo → destino da entrega."
                : detour.status === "pending"
                  ? "Calculando rota mais rápida para este veículo até a entrega…"
                  : "Não foi possível calcular a rota alternativa agora. O aviso de desvio continua ativo; uma nova tentativa ocorrerá com GPS válido."}
            </Text>
            <Text style={styles.summarySmall}>
              A rota azul original permanece visível.
              {detour.distance != null
                ? " · Alternativa: " + kilometers(detour.distance) + " km"
                : ""}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.box}>
        <MapView
          ref={map}
          style={styles.map}
          initialRegion={brazil}
          onMapReady={() => setReady(true)}
          onPanDrag={() => {
            if (following) setFollowing(false);
          }}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          accessibilityLabel="Localização e histórico GPS do veículo"
        >
          {plannedPath.length ? (
            <>
              <Polyline
                coordinates={plannedPath}
                strokeColor="#ffffff"
                strokeWidth={9}
              />
              <Polyline
                coordinates={plannedPath}
                strokeColor={routeBlue}
                strokeWidth={5}
              />
            </>
          ) : null}
          {detourPath.length ? (
            <>
              <Polyline
                coordinates={detourPath}
                strokeColor="#ffffff"
                strokeWidth={9}
              />
              <Polyline
                coordinates={detourPath}
                strokeColor={routeRed}
                strokeWidth={5}
              />
            </>
          ) : null}
          {trail.length > 1 ? (
            <Polyline
              coordinates={trail}
              strokeColor={tints.featured}
              strokeWidth={4}
            />
          ) : null}
          {planned?.origin ? (
            <Stop
              coordinate={toLatLng(planned.origin)}
              color={routeBlue}
              title="Origem · primeiro GPS"
            />
          ) : null}
          {planned ? (
            <>
              <Stop
                coordinate={toLatLng(planned.pickup)}
                color={pickupGreen}
                title={
                  "Carregamento · " +
                  (planned.locations?.pickup.address ||
                    formatCep(planned.pickupCep))
                }
              />
              <Stop
                coordinate={toLatLng(planned.delivery)}
                color={routeRed}
                title={
                  "Descarga · " +
                  (planned.locations?.delivery.address ||
                    formatCep(planned.deliveryCep))
                }
              />
            </>
          ) : null}
          {hasPosition && trip.accuracy != null && trip.accuracy > 0 ? (
            <Circle
              center={{ latitude, longitude }}
              radius={trip.accuracy}
              strokeColor={tints.featured}
              strokeWidth={1}
              fillColor="rgba(202, 162, 77, 0.09)"
            />
          ) : null}
          {hasPosition ? (
            <Marker
              coordinate={{ latitude, longitude }}
              title={truckLabel(trip.driver, trip.plate)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={10}
            >
              <View style={styles.truck}>
                <MaterialCommunityIcons
                  name="truck"
                  size={20}
                  color={colors.primaryForeground}
                />
              </View>
            </Marker>
          ) : null}
        </MapView>

        <View style={styles.status} pointerEvents="none">
          <View
            style={[
              styles.dot,
              { backgroundColor: recent ? colors.success : colors.warning },
            ]}
          />
          <Text style={styles.statusText}>{signal}</Text>
          {hasPosition ? (
            <Text style={styles.statusSmall}>
              {following ? "Seguindo veículo" : "Exploração livre"}
            </Text>
          ) : null}
        </View>

        {detour ? (
          <View style={styles.mapDeviation} pointerEvents="none">
            <Ionicons name="warning-outline" size={14} color={colors.error} />
            <Text style={styles.mapDeviationText}>
              FORA DA ROTA ·{" "}
              {detour.status === "ready"
                ? "Alternativa em vermelho"
                : detour.status === "pending"
                  ? "Calculando alternativa…"
                  : "Alternativa indisponível"}
            </Text>
          </View>
        ) : null}

        {!hasPosition ? (
          <View style={styles.wait} pointerEvents="none">
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.waitText}>
              Aguardando o aceite com GPS. A rota aparece após a empresa
              conferir os pontos de carregamento e descarga.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          label="Brasil inteiro"
          icon="map-outline"
          variant="secondary"
          size="sm"
          onPress={showBrazil}
        />
        <Button
          label="Seguir veículo"
          icon="locate-outline"
          variant="secondary"
          size="sm"
          disabled={!hasPosition}
          onPress={follow}
        />
        <Button
          label="Ver rota completa"
          icon="git-branch-outline"
          variant="secondary"
          size="sm"
          disabled={!planned && !trail.length && !hasPosition}
          onPress={fit}
        />
      </View>

      {hasPosition ? (
        <View style={styles.telemetry}>
          <View style={styles.cell}>
            <Text style={styles.cellValue}>{trip.plate}</Text>
            <Text style={styles.cellLabel}>{trip.driver}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>ÚLTIMO GPS</Text>
            <Text style={styles.cellValue}>
              {age == null || age === 0
                ? "Agora"
                : age < 60
                  ? age + " min atrás"
                  : age < 1440
                    ? Math.floor(age / 60) + " h atrás"
                    : Math.floor(age / 1440) + " d atrás"}
            </Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.cellLabel}>PRECISÃO</Text>
            <Text style={styles.cellValue}>
              {trip.accuracy == null
                ? "-"
                : "± " + Math.round(trip.accuracy) + " m"}
            </Text>
          </View>
          <Text style={styles.legend}>
            Histórico GPS · {points.length} pontos
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  summary: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    backgroundColor: colors.card,
  },
  summaryTitle: { ...typography.eyebrow, color: colors.foreground },
  summaryText: { ...typography.small, color: colors.foreground },
  summarySmall: { ...typography.caption, color: colors.mutedForeground },
  deviation: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: tints.errorBorder,
    borderRadius: radius.base,
    backgroundColor: tints.error,
  },
  deviationBody: { flex: 1, gap: spacing.xs },
  deviationTitle: { ...typography.eyebrow, color: colors.error },
  box: {
    height: 360,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    backgroundColor: colors.muted,
  },
  map: { flex: 1 },
  stop: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  truck: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: colors.primary,
  },
  status: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  statusText: { ...typography.small, fontWeight: "600" },
  statusSmall: { ...typography.caption, color: colors.mutedForeground },
  mapDeviation: {
    position: "absolute",
    top: spacing.sm + 36,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: tints.error,
  },
  mapDeviationText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.error,
  },
  wait: {
    position: "absolute",
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderRadius: radius.base,
    backgroundColor: colors.card,
  },
  waitText: { ...typography.small, flex: 1, color: colors.foreground },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  telemetry: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    backgroundColor: colors.card,
  },
  cell: { gap: 2 },
  cellLabel: { ...typography.caption, color: colors.mutedForeground },
  cellValue: { ...typography.bodyStrong, color: colors.foreground },
  legend: { ...typography.caption, color: colors.mutedForeground },
});
