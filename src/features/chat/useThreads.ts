import { useQuery } from "@tanstack/react-query";
import { postNegotiations } from "@/api/negotiations";
import type { Thread } from "@/api/negotiations";
import { negotiationsPollMs, usePolling } from "@/hooks/usePolling";

async function fetchAllThreads() {
  const all: Thread[] = [];
  let offset = 0;
  while (true) {
    const result = await postNegotiations({ action: "threads", offset });
    all.push(...(result.threads || []));
    if (!result.hasMore || !result.threads?.length) break;
    offset += result.threads.length;
  }
  return all;
}

export const threadsKey = (userId: number) => ["chat-threads", userId];

export function useThreads(userId: number) {
  const interval = usePolling(negotiationsPollMs, userId > 0);
  return useQuery({
    queryKey: threadsKey(userId),
    queryFn: fetchAllThreads,
    enabled: userId > 0,
    refetchInterval: interval,
  });
}
