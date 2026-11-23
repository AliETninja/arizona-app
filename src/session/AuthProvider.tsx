import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { getSession, postLogin, postLogout } from "@/api/auth";
import type { LoginInput, User } from "@/api/auth";
import { sessionToken } from "./token";

type AuthState =
  | { type: "loading" }
  | { type: "unavailable" }
  | { type: "signedOut" }
  | { type: "signedIn"; user: User };

type AuthContextValue = {
  state: AuthState;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
};

export const driverOnlyMessage =
  "Este aplicativo é exclusivo para caminhoneiros.";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ type: "loading" });
  const [attempt, setAttempt] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const token = await sessionToken.load();
      if (!token) {
        if (active) setState({ type: "signedOut" });
        return;
      }
      try {
        const { user } = await getSession();
        if (!active) return;
        if (user.role !== "driver") {
          await sessionToken.clear();
          setState({ type: "signedOut" });
          return;
        }
        setState({ type: "signedIn", user });
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          await sessionToken.clear();
          setState({ type: "signedOut" });
          return;
        }
        setState({ type: "unavailable" });
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, [attempt]);

  const signIn = useCallback(async (input: LoginInput) => {
    const result = await postLogin(input);
    await sessionToken.set(result.sessionToken);
    if (result.user.role !== "driver") {
      try {
        await postLogout();
      } catch {
        await sessionToken.clear();
      }
      await sessionToken.clear();
      throw new ApiError(driverOnlyMessage, 403);
    }
    setState({ type: "signedIn", user: result.user });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await postLogout();
    } catch {
      setState({ type: "signedOut" });
    }
    await sessionToken.clear();
    queryClient.clear();
    setState({ type: "signedOut" });
  }, [queryClient]);

  const retry = useCallback(() => {
    setState({ type: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signOut, retry }),
    [state, signIn, signOut, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider ausente");
  return value;
}
