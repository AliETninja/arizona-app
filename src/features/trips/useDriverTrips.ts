import { useQuery } from "@tanstack/react-query";
import { listDriverTrips } from "@/api/driverPortal";
import { tripsPollMs, usePolling } from "@/hooks/usePolling";
import { useAuth } from "@/session/AuthProvider";

export function useDriverTrips() {
  const { state } = useAuth();
  const userId = state.type === "signedIn" ? state.user.id : 0;
  const refetchInterval = usePolling(tripsPollMs);
  return useQuery({
    queryKey: ["driver-portal", userId],
    queryFn: listDriverTrips,
    refetchInterval,
  });
}
