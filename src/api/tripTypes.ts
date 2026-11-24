export type TripStage =
  | "aguardando"
  | "cancelada"
  | "carregando"
  | "coleta"
  | "concluida"
  | "descarga"
  | "entrega"
  | "transito";

export type TripRecord = {
  acceptedAt: Date | null;
  accuracy: number | null;
  agreementData: string | null;
  batteryCharging: boolean | null;
  batteryPercentage: number | null;
  batteryReportedAt?: Date | null;
  batterySource?: "device" | "manual" | string;
  cargo: string;
  cityData?: string | null;
  client: string;
  clientLinkExpiresAt: Date | null;
  clientLinkVersion: string;
  companyUserId: number | null;
  consentAt: Date | null;
  createdAt: Date;
  deliveryCep: string | null;
  destination: string;
  detourData: string | null;
  driver: string;
  driverUserId: number | null;
  id: string;
  latitude: number | null;
  linkExpiresAt: Date;
  linkVersion: string;
  longitude: number | null;
  mapHeading?: number | null;
  operationConsentAt?: Date | null;
  operationConsentVersion?: string | null;
  origin: string;
  phone: string;
  pickupCep: string | null;
  plate: string;
  positionAt: Date | null;
  reference: string;
  routeData: string | null;
  speed: number | null;
  stage: TripStage;
  tollData?: string | null;
  trackingEnabled: boolean;
  updatedAt: Date;
  vehicle: string;
  weightTons: number;
};

export type TripPoint = {
  accuracy: number;
  batteryCharging: boolean | null;
  batteryPercentage: number | null;
  batteryReportedAt?: Date | null;
  batterySource?: string;
  id: string;
  latitude: number;
  longitude: number;
  municipality?: string | null;
  municipalityUf?: string | null;
  receivedAt: Date;
  recordedAt: Date;
  speed: number | null;
  tripId: string;
};

export type TripEvent = {
  id: string;
  recordedAt: Date;
  stage: TripStage;
  tripId: string;
};

export type TripStopAlert = {
  id: string;
  tripId: string;
  startedAt: Date;
  detectedAt: Date;
  endedAt: Date | null;
  latitude: number;
  longitude: number;
};

export type TripDetail = {
  driverPhotoUrl?: string | null;
  stopAlerts?: TripStopAlert[];
  trip: TripRecord;
  points: TripPoint[];
  events: TripEvent[];
  role: "owner" | "driver" | "client";
};
