import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "expo-router";

export const tripsPollMs = 10000;
export const negotiationsPollMs = 20000;
export const offersPollMs = 20000;
export const slowPollMs = 60000;

export function useAppActive() {
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) =>
      setActive(next === "active"),
    );
    return () => subscription.remove();
  }, []);
  return active;
}

export function usePolling(intervalMs: number, enabled = true): number | false {
  const active = useAppActive();
  const focused = useIsFocused();
  return enabled && active && focused ? intervalMs : false;
}
