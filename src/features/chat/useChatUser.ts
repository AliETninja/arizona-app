import { useAuth } from "@/session/AuthProvider";

export function useChatUserId() {
  const { state } = useAuth();
  return state.type === "signedIn" ? state.user.id : 0;
}
