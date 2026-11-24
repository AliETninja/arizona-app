import type { TripStage } from "@/api/tripTypes";

export type { TripStage };

export const stageOrder: TripStage[] = [
  "aguardando",
  "coleta",
  "carregando",
  "transito",
  "entrega",
  "descarga",
  "concluida",
];

export const stageLabels: Record<TripStage, string> = {
  aguardando: "Aguardando aceite",
  coleta: "A caminho da coleta",
  carregando: "No local de carregamento",
  transito: "Em trânsito",
  entrega: "No destino da entrega",
  descarga: "Em descarga",
  concluida: "Entrega concluída",
  cancelada: "Cancelada",
};

export const isTerminalStage = (stage: TripStage) =>
  stage === "concluida" || stage === "cancelada";

export const isHistoryTrip = (trip: { stage: TripStage }) =>
  trip.stage === "concluida";

export const isActiveTrip = (trip: { stage: TripStage }) =>
  !isTerminalStage(trip.stage);

export const staleSignalMs = 180000;

export function tripSignal(
  trip: {
    positionAt: Date | string | null;
    trackingEnabled: boolean;
    stage: TripStage;
  },
  now = Date.now(),
) {
  if (isTerminalStage(trip.stage)) return "Encerrado";
  if (trip.stage === "aguardando" && !trip.positionAt) return "Aguardando GPS";
  if (!trip.trackingEnabled) return "GPS pausado";
  if (!trip.positionAt) return "Aguardando GPS";
  return now - new Date(trip.positionAt).getTime() > staleSignalMs
    ? "Sinal desatualizado"
    : "GPS recente";
}
