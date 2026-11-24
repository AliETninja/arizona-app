export const trackingTaskName = "arizona-trip-location";

export const monitorKey = "arizona-active-monitor";
export const stateKey = "arizona-gps-state";
export const queueKey = (tripId: string) => "arizona-gps-" + tripId;

export const movingSpeedMs = 1.5;
export const movingSampleMs = 15000;
export const stoppedSampleMs = 60000;
export const staleLocalMs = 180000;
export const maxFixAgeMs = 60000;
export const queueLimit = 1000;
export const queueMaxAgeMs = 86400000;
export const batchSize = 100;
export const foregroundTickMs = 10000;
export const requestTimeoutMs = 20000;
export const firstFixTimeoutMs = 30000;
export const nativeIntervalMs = 5000;

export const fatalError =
  /encerrada|revogado|expirado|inválido|pausado|fora do período|autorize|permite apenas|bateria/i;
export const accessError = /inválido|expirado|revogado/i;

export const texts = {
  waiting: "Aguardando aceite da corrida.",
  otherTrip:
    "Outra corrida está sendo monitorada neste celular. Conclua a corrida atual.",
  starting: "Obtendo o GPS para iniciar o monitoramento obrigatório…",
  startFailed: "Não foi possível iniciar o GPS.",
  batteryUnreadable: "Não foi possível ler a bateria do celular.",
  batteryRequired:
    "Não foi possível ler a bateria do celular. A bateria é um dado obrigatório do monitoramento; use o app instalado e permita o funcionamento normal do aparelho.",
  notifications:
    "Autorize as notificações nas configurações do celular para iniciar o GPS em segundo plano.",
  locationDenied: "Autorize a localização do celular para aceitar a corrida.",
  locationUnavailable:
    "Permissão de localização indisponível. Autorize nas configurações do celular.",
  noFix: "GPS sem posição atual. Verifique as permissões e tente novamente.",
  fixRejected: "O aceite precisa de uma posição atual e real do celular.",
  mocked: "Localização simulada foi recusada.",
  stale:
    "GPS sem posição recente. Verifique se a localização do celular continua ativada.",
  offline:
    "Sem internet. GPS e bateria continuam sendo registrados e serão enviados quando a conexão voltar.",
  noConnection: "Sem conexão com o servidor.",
  sendUnavailable: "Envio de GPS indisponível.",
  syncing: "Sincronizando posições salvas…",
  received: "Posição e bateria recebidas pela central.",
  notificationTitle: "Arizona Log · Viagem ativa",
  notificationBody:
    "GPS e bateria estão sendo compartilhados durante esta viagem.",
};

export const activeMessage = (percentage: number, charging: boolean | null) =>
  "Monitoramento obrigatório ativo. Bateria: " +
  percentage +
  "%" +
  (charging ? " · carregando" : "") +
  ".";

export const sampleMessage = (
  moving: boolean,
  percentage: number,
  charging: boolean | null,
) =>
  (moving
    ? "GPS ativo · envio a cada ~15 s em movimento."
    : "GPS ativo · veículo parado, frequência reduzida.") +
  " Bateria: " +
  percentage +
  "%" +
  (charging ? " · carregando" : "") +
  ".";
