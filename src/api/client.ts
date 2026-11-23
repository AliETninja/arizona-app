import { apiBaseUrl } from "@/config/environment";
import { sessionToken } from "@/session/token";

const isoDate =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export type ApiMethod = "GET" | "POST";

export type ApiRequestOptions = {
  method: ApiMethod;
  path: string;
  body?: unknown;
  signal?: AbortSignal;
  fallbackError: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const apiUrl = (path: string) =>
  apiBaseUrl + "/" + path.replace(/^\/+/, "");

export function parseApiJson<T>(text: string): T {
  return JSON.parse(text, (_key, value) =>
    typeof value === "string" && isoDate.test(value) ? new Date(value) : value,
  ) as T;
}

export function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = sessionToken.get();
  if (token) headers.Authorization = "Bearer " + token;
  return headers;
}

function readBody(text: string): Record<string, unknown> | null {
  if (!text) return null;
  try {
    return parseApiJson<Record<string, unknown>>(text);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  const response = await fetch(apiUrl(options.path), {
    method: options.method,
    headers: apiHeaders(),
    signal: options.signal,
    body:
      options.method === "GET" ? undefined : JSON.stringify(options.body ?? {}),
  });
  const data = readBody(await response.text());
  if (!response.ok) {
    const message =
      (typeof data?.error === "string" && data.error) ||
      (typeof data?.message === "string" && data.message) ||
      options.fallbackError;
    throw new ApiError(
      message,
      response.status,
      typeof data?.code === "string" ? data.code : undefined,
    );
  }
  if (!data) throw new ApiError(options.fallbackError, response.status);
  return data as T;
}
