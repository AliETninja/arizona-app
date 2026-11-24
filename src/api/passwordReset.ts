import { z } from "zod";
import { apiRequest } from "./client";

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().pipe(z.email("Informe um e-mail válido.").max(254)),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

export type RequestPasswordResetOutput = { message: string };

export const postRequestPasswordReset = (body: RequestPasswordResetInput) =>
  apiRequest<RequestPasswordResetOutput>({
    method: "POST",
    path: "auth/request_password_reset",
    body: requestPasswordResetSchema.parse(body),
    fallbackError: "Não foi possível solicitar a redefinição.",
  });
