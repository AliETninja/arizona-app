import { z } from "zod";
import { apiRequest } from "./client";

export type UserRole = "admin" | "company" | "customer" | "driver" | "user";

export type User = {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
};

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const postLogin = (body: LoginInput) =>
  apiRequest<{ user: User; sessionToken: string }>({
    method: "POST",
    path: "auth/login_with_password",
    body: loginSchema.parse(body),
    fallbackError: "Não foi possível entrar. Tente novamente.",
  });

export const getSession = (signal?: AbortSignal) =>
  apiRequest<{ user: User }>({
    method: "GET",
    path: "auth/session",
    signal,
    fallbackError: "Não foi possível entrar. Tente novamente.",
  });

export const postLogout = () =>
  apiRequest<Record<string, unknown>>({
    method: "POST",
    path: "auth/logout",
    fallbackError: "Não foi possível entrar. Tente novamente.",
  });
