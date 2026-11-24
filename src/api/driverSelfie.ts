import { z } from "zod";
import { apiRequest } from "./client";

export const driverSelfieSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status") }),
  z.object({
    action: z.literal("save"),
    token: z.string().regex(/^[a-f0-9]{64}$/),
    id: z.guid(),
  }),
]);

export type DriverSelfieInput = z.infer<typeof driverSelfieSchema>;

export type DriverSelfieStatus = {
  needsSelfie: boolean;
  registrationOrigin: "central" | "self";
  submittedAt: Date | null;
};

export const postDriverSelfie = (body: DriverSelfieInput) =>
  apiRequest<DriverSelfieStatus>({
    method: "POST",
    path: "driver_selfie",
    body: driverSelfieSchema.parse(body),
    fallbackError: "Não foi possível consultar a selfie.",
  });

export const postDriverSelfieStatus = () =>
  postDriverSelfie({ action: "status" });

export const saveDriverSelfie = (token: string, id: string) =>
  postDriverSelfie({ action: "save", token, id });
