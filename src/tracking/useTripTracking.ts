import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import "./registerTrackingTask";
import { texts } from "./constants";
import {
  attachTripToken,
  finishTracking,
  getTrackingState,
  startTracking,
  subscribeTracking,
  subscribeTripChange,
} from "./engine";

export const tripDetailKey = (token: string) => ["public-trip", token];
export const driverTripsKey = ["driver-portal"];

export function useTripTracking(token: string, tripId: string, enabled = true) {
  const state = useSyncExternalStore(
    subscribeTracking,
    getTrackingState,
    getTrackingState,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    if (enabled && token) void attachTripToken(token, tripId);
  }, [enabled, token, tripId]);

  useEffect(
    () =>
      subscribeTripChange(() => {
        void queryClient.invalidateQueries({ queryKey: tripDetailKey(token) });
        void queryClient.invalidateQueries({ queryKey: driverTripsKey });
      }),
    [queryClient, token],
  );

  const own = state.tripId === tripId;
  const blocked = !own && (state.active || state.busy);

  const start = useCallback(
    async (operationConsent = false) => {
      if (blocked || !token) return false;
      return startTracking({ token, tripId, operationConsent });
    },
    [blocked, token, tripId],
  );

  const halt = useCallback(async () => {
    if (getTrackingState().tripId === tripId) await finishTracking();
  }, [tripId]);

  return useMemo(
    () => ({
      active: own && state.active,
      busy: blocked || (own && state.busy),
      message: blocked ? texts.otherTrip : own ? state.message : texts.waiting,
      queued: own ? state.queued : 0,
      lastSent: own && state.lastSent ? new Date(state.lastSent) : null,
      start,
      halt,
    }),
    [own, blocked, state, start, halt],
  );
}
