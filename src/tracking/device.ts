import { Platform } from "react-native";
import { uuid } from "expo";
import * as Battery from "expo-battery";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { tripPointSchema } from "@/api/trip";
import { firstFixTimeoutMs, maxFixAgeMs, texts } from "./constants";
import type { QueuedPoint } from "./storage";

export type BatteryReading = {
  percentage: number;
  charging: boolean | null;
  reportedAt: Date;
};

export async function readBattery(): Promise<BatteryReading | null> {
  try {
    const power = await Battery.getPowerStateAsync();
    const level = power.batteryLevel;
    if (typeof level !== "number" || !Number.isFinite(level) || level < 0)
      return null;
    const state = power.batteryState;
    return {
      percentage: Math.min(100, Math.round(level * 100)),
      charging:
        state === Battery.BatteryState.CHARGING ||
        state === Battery.BatteryState.FULL
          ? true
          : state === Battery.BatteryState.UNPLUGGED
            ? false
            : null,
      reportedAt: new Date(),
    };
  } catch {
    return null;
  }
}

export function buildPoint(
  location: Location.LocationObject,
  battery: BatteryReading,
): QueuedPoint | null {
  const speed = location.coords.speed;
  const point = {
    id: uuid.v4(),
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    speed: speed != null && speed >= 0 ? speed : null,
    batteryPercentage: battery.percentage,
    batteryCharging: battery.charging,
    batterySource: "device" as const,
    batteryReportedAt: battery.reportedAt.toISOString(),
    recordedAt: new Date(location.timestamp).toISOString(),
  };
  return tripPointSchema.safeParse(point).success
    ? (point as QueuedPoint)
    : null;
}

export async function ensureNotificationPermission() {
  if (Platform.OS !== "android") return;
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted)
    permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error(texts.notifications);
}

export async function ensureForegroundPermission() {
  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted)
    permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error(texts.locationDenied);
}

export async function requestBackgroundPermission() {
  try {
    let permission = await Location.getBackgroundPermissionsAsync();
    if (!permission.granted && permission.canAskAgain)
      permission = await Location.requestBackgroundPermissionsAsync();
    return permission.granted;
  } catch {
    return false;
  }
}

function currentFix(): Promise<Location.LocationObject> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(texts.noFix)),
      firstFixTimeoutMs,
    );
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    }).then(
      (location) => {
        clearTimeout(timer);
        resolve(location);
      },
      () => {
        clearTimeout(timer);
        reject(new Error(texts.noFix));
      },
    );
  });
}

export async function readInitialPoint(
  battery: BatteryReading,
): Promise<QueuedPoint> {
  await ensureForegroundPermission();
  const location = await currentFix();
  if (location.mocked || Date.now() - location.timestamp > maxFixAgeMs)
    throw new Error(texts.fixRejected);
  const point = buildPoint(location, battery);
  if (!point) throw new Error(texts.fixRejected);
  return point;
}
