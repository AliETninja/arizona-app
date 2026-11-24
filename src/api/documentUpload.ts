import { z } from "zod";
import { apiRequest } from "./client";

export const documentKinds = [
  "selfie",
  "cnh",
  "vehicle",
  "antt",
  "residence",
] as const;

export type DocumentKind = (typeof documentKinds)[number];

export const documentLabels: Record<DocumentKind, string> = {
  selfie: "Foto de perfil tirada na hora",
  cnh: "CNH",
  vehicle: "Documentação completa do caminhão",
  antt: "ANTT / RNTRC",
  residence: "Comprovante de residência do cadastro ANTT",
};

export const documentContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

export const documentUploadSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("selfie-init") }),
  z.object({
    action: z.literal("managed-init"),
    email: z
      .string()
      .trim()
      .pipe(z.email().max(180))
      .transform((value) => value.toLowerCase()),
  }),
  z.object({
    action: z.literal("init"),
    email: z
      .string()
      .trim()
      .pipe(z.email().max(180))
      .transform((value) => value.toLowerCase()),
  }),
  z.object({
    action: z.literal("upload"),
    token: z.string().regex(/^[a-f0-9]{64}$/),
    kind: z.enum(documentKinds),
    name: z.string().min(1).max(180),
    contentType: z.enum(documentContentTypes),
    sizeBytes: z.number().int().positive().max(10485760),
    capturedAt: z.date().optional(),
    source: z.literal("camera").optional(),
  }),
]);

export type DocumentUploadInput = z.input<typeof documentUploadSchema>;

export type DocumentUploadOutput = {
  token?: string;
  id?: string;
  presignedUrl?: string;
  headers?: Record<string, string>;
};

export const postDocumentUpload = (body: DocumentUploadInput) =>
  apiRequest<DocumentUploadOutput>({
    method: "POST",
    path: "document_upload",
    body: documentUploadSchema.parse(body),
    fallbackError: "Não foi possível enviar o documento.",
  });

export const startSelfieUpload = () =>
  postDocumentUpload({ action: "selfie-init" });

export const requestSelfieUpload = (input: {
  token: string;
  sizeBytes: number;
  capturedAt: Date;
}) =>
  postDocumentUpload({
    action: "upload",
    token: input.token,
    kind: "selfie",
    name: "selfie-primeiro-acesso.jpg",
    contentType: "image/jpeg",
    sizeBytes: input.sizeBytes,
    source: "camera",
    capturedAt: input.capturedAt,
  });

export const selfieUploadFailed =
  "Não foi possível enviar a selfie. Confira sua internet e tente novamente.";

export const selfieTooOld = "Tire uma nova selfie pela câmera do aplicativo.";

export async function putFileToPresignedUrl(
  fileUri: string,
  presignedUrl: string,
  headers?: Record<string, string>,
) {
  const file = await fetch(fileUri);
  const blob = await file.blob();
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers,
    body: blob,
  });
  if (!response.ok) throw new Error(selfieUploadFailed);
}
