import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "@/api/negotiations";
import { negotiationsPollMs, useAppActive } from "@/hooks/usePolling";
import { useChatUserId } from "./useChatUser";

export const notificationsKey = (userId: number) => [
  "chat-notifications",
  userId,
];

export function useUnreadCount() {
  const userId = useChatUserId();
  const active = useAppActive();
  const query = useQuery({
    queryKey: notificationsKey(userId),
    queryFn: listNotifications,
    enabled: userId > 0,
    retry: false,
    refetchInterval: active ? negotiationsPollMs : false,
  });
  return query.data?.unreadCount ?? 0;
}
