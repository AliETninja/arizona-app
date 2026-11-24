import { z } from "zod";
import { apiRequest } from "./client";
import type { TripDetail } from "./tripTypes";

export const tripToken = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Link de acesso inválido.");

export const tripPointSchema = z.object({
  id: z.guid(),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  accuracy: z.number().finite().min(0).max(10000),
  speed: z.number().finite().min(0).max(100).nullable(),
  batteryPercentage: z.number().int().min(0).max(100),
  batteryCharging: z.boolean().nullable().optional(),
  batterySource: z.enum(["device", "manual"]).default("device"),
  batteryReportedAt: z.coerce.date().nullable().optional(),
  recordedAt: z.coerce.date(),
});

export const tripSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("read"), token: tripToken }),
  z.object({
    action: z.literal("tracking"),
    token: tripToken,
    enabled: z.boolean(),
    consent: z.boolean(),
    operationConsent: z.boolean().optional(),
    firstPoint: tripPointSchema.optional(),
  }),
  z.object({
    action: z.literal("stage"),
    token: tripToken,
    stage: z.enum([
      "coleta",
      "carregando",
      "transito",
      "entrega",
      "descarga",
      "concluida",
    ]),
  }),
  z.object({
    action: z.literal("positions"),
    token: tripToken,
    points: z.array(tripPointSchema).min(1).max(100),
  }),
]);

export type TripPointInput = z.input<typeof tripPointSchema>;
export type TripInput = z.input<typeof tripSchema>;
export type TripOutput = { detail?: TripDetail; accepted?: number };

export const postTrip = (body: TripInput, signal?: AbortSignal) =>
  apiRequest<TripOutput>({
    method: "POST",
    path: "trip",
    body: tripSchema.parse(body),
    signal,
    fallbackError: "Não foi possível acessar a viagem.",
  });

export const readTrip = (token: string, signal?: AbortSignal) =>
  postTrip({ action: "read", token }, signal);

export const setTripTracking = (input: {
  token: string;
  enabled: boolean;
  consent: boolean;
  operationConsent?: boolean;
  firstPoint?: TripPointInput;
}) => postTrip({ action: "tracking", ...input });

export const sendTripPositions = (token: string, points: TripPointInput[]) =>
  postTrip({ action: "positions", token, points });
