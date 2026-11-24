import { z } from "zod";
import { apiRequest } from "./client";
import type { TripRecord } from "./tripTypes";

export const driverPortalSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("accept"), id: z.guid() }),
]);

export type DriverPortalInput = z.infer<typeof driverPortalSchema>;

export type DriverPortalOutput = {
  trips?: TripRecord[];
  driverToken?: string;
};

export const postDriverPortal = (body: DriverPortalInput) =>
  apiRequest<DriverPortalOutput>({
    method: "POST",
    path: "driver_portal",
    body: driverPortalSchema.parse(body),
    fallbackError: "Não foi possível acessar suas viagens.",
  });

export const listDriverTrips = async () =>
  (await postDriverPortal({ action: "list" })).trips ?? [];

export const acceptDriverTrip = (id: string) =>
  postDriverPortal({ action: "accept", id });
