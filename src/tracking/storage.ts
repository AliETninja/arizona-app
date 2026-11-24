import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { tripPointSchema } from "@/api/trip";
import { isTripToken } from "@/domain/tripToken";
import { monitorKey, queueKey, queueMaxAgeMs, stateKey } from "./constants";

export type Monitor = { token: string; tripId: string; apiUrl?: string };

export type QueuedPoint = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  batteryPercentage: number;
  batteryCharging: boolean | null;
  batterySource: "device";
  batteryReportedAt: string;
  recordedAt: string;
};

export type PersistedState = {
  tripId: string | null;
  active: boolean;
  message: string;
  queued: number;
  lastSent: number | null;
  lastSample: number;
  lastMoving: boolean | null;
};

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const tripIdPattern = /^[a-f0-9-]{36}$/;

export const isTripId = (value: unknown): value is string =>
  typeof value === "string" && tripIdPattern.test(value);

export const freshPoint = (point: QueuedPoint, now = Date.now()) =>
  new Date(point.recordedAt).getTime() > now - queueMaxAgeMs;

export async function readMonitor(): Promise<{
  ok: boolean;
  monitor: Monitor | null;
}> {
  let raw: string | null;
  try {
    raw = await SecureStore.getItemAsync(monitorKey, secureOptions);
  } catch {
    return { ok: false, monitor: null };
  }
  try {
    const entry = JSON.parse(raw || "null") as Partial<Monitor> | null;
    if (entry && isTripToken(entry.token) && isTripId(entry.tripId))
      return {
        ok: true,
        monitor: {
          token: entry.token,
          tripId: entry.tripId,
          apiUrl: typeof entry.apiUrl === "string" ? entry.apiUrl : undefined,
        },
      };
  } catch {
    return { ok: true, monitor: null };
  }
  return { ok: true, monitor: null };
}

export async function writeMonitor(monitor: Monitor | null) {
  try {
    if (monitor)
      await SecureStore.setItemAsync(
        monitorKey,
        JSON.stringify(monitor),
        secureOptions,
      );
    else await SecureStore.deleteItemAsync(monitorKey, secureOptions);
  } catch {
    return;
  }
}

export async function readQueue(tripId: string): Promise<QueuedPoint[]> {
  try {
    const parsed: unknown = JSON.parse(
      (await AsyncStorage.getItem(queueKey(tripId))) || "[]",
    );
    if (!Array.isArray(parsed)) return [];
    return (parsed as QueuedPoint[]).filter(
      (point) => tripPointSchema.safeParse(point).success && freshPoint(point),
    );
  } catch {
    return [];
  }
}

export async function writeQueue(tripId: string, queue: QueuedPoint[]) {
  try {
    await AsyncStorage.setItem(queueKey(tripId), JSON.stringify(queue));
  } catch {
    return;
  }
}

export async function removeQueue(tripId: string) {
  try {
    await AsyncStorage.removeItem(queueKey(tripId));
  } catch {
    return;
  }
}

export async function readState(): Promise<PersistedState | null> {
  try {
    const value = JSON.parse(
      (await AsyncStorage.getItem(stateKey)) || "null",
    ) as Partial<PersistedState> | null;
    if (!value || typeof value !== "object") return null;
    return {
      tripId: isTripId(value.tripId) ? value.tripId : null,
      active: value.active === true,
      message: typeof value.message === "string" ? value.message : "",
      queued: typeof value.queued === "number" ? value.queued : 0,
      lastSent: typeof value.lastSent === "number" ? value.lastSent : null,
      lastSample: typeof value.lastSample === "number" ? value.lastSample : 0,
      lastMoving:
        typeof value.lastMoving === "boolean" ? value.lastMoving : null,
    };
  } catch {
    return null;
  }
}

export async function writeState(state: PersistedState) {
  try {
    await AsyncStorage.setItem(stateKey, JSON.stringify(state));
  } catch {
    return;
  }
}
