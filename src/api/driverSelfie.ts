import { apiRequest } from "./client";

export type DriverSelfieStatus = {
  needsSelfie: boolean;
  registrationOrigin: "central" | "self";
  submittedAt: Date | null;
};

export const postDriverSelfieStatus = () =>
  apiRequest<DriverSelfieStatus>({
    method: "POST",
    path: "driver_selfie",
    body: { action: "status" },
    fallbackError: "Não foi possível consultar a selfie.",
  });
