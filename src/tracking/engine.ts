import { AppState } from "react-native";
import * as Location from "expo-location";
import { ApiError, parseApiJson } from "@/api/client";
import { tripSchema } from "@/api/trip";
import type { TripInput, TripOutput } from "@/api/trip";
import { apiBaseUrl } from "@/config/environment";
import { isTerminalStage } from "@/domain/tripStages";
import { colors } from "@/theme/colors";
import {
  accessError,
  activeMessage,
  batchSize,
  fatalError,
  foregroundTickMs,
  maxFixAgeMs,
  movingSampleMs,
  movingSpeedMs,
  nativeIntervalMs,
  queueLimit,
  requestTimeoutMs,
  sampleMessage,
  staleLocalMs,
  stoppedSampleMs,
  texts,
  trackingTaskName,
} from "./constants";
import {
  buildPoint,
  ensureForegroundPermission,
  ensureNotificationPermission,
  readBattery,
  readInitialPoint,
  requestBackgroundPermission,
} from "./device";
import {
  freshPoint,
  readMonitor,
  readQueue,
  readState,
  removeQueue,
  writeMonitor,
  writeQueue,
  writeState,
} from "./storage";
import type { Monitor, QueuedPoint } from "./storage";

export type TrackingState = {
  tripId: string | null;
  active: boolean;
  busy: boolean;
  message: string;
  queued: number;
  lastSent: number | null;
  lastSample: number;
  lastMoving: boolean | null;
};

const initialState: TrackingState = {
  tripId: null,
  active: false,
  busy: false,
  message: texts.waiting,
  queued: 0,
  lastSent: null,
  lastSample: 0,
  lastMoving: null,
};

let state: TrackingState = initialState;
let monitor: Monitor | null = null;
let queue: QueuedPoint[] = [];
let loaded: Promise<boolean> | null = null;
let sending = false;
let starting = false;
let resuming = false;
let timer: ReturnType<typeof setInterval> | null = null;
let chain: Promise<void> = Promise.resolve();

const stateListeners = new Set<() => void>();
const tripListeners = new Set<() => void>();

export const getTrackingState = () => state;

export function subscribeTracking(listener: () => void) {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

export function subscribeTripChange(listener: () => void) {
  tripListeners.add(listener);
  return () => {
    tripListeners.delete(listener);
  };
}

const notifyTrip = () => tripListeners.forEach((listener) => listener());

function update(patch: Partial<TrackingState>) {
  state = { ...state, ...patch };
  stateListeners.forEach((listener) => listener());
  void writeState({
    tripId: state.tripId,
    active: state.active,
    message: state.message,
    queued: state.queued,
    lastSent: state.lastSent,
    lastSample: state.lastSample,
    lastMoving: state.lastMoving,
  });
}

async function hydrate() {
  const stored = await readMonitor();
  if (!stored.ok) return false;
  monitor = stored.monitor;
  const persisted = await readState();
  if (persisted?.tripId) {
    queue = await readQueue(persisted.tripId);
    state = {
      ...state,
      ...persisted,
      active: persisted.active && monitor?.tripId === persisted.tripId,
      message: persisted.message || texts.waiting,
      queued: queue.length,
    };
    stateListeners.forEach((listener) => listener());
  }
  return true;
}

function ensureReady() {
  loaded ??= hydrate().then(
    (ok) => {
      if (!ok) loaded = null;
      return ok;
    },
    () => {
      loaded = null;
      return false;
    },
  );
  return loaded;
}

async function send(input: TripInput, apiUrl?: string): Promise<TripOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    let response: Response;
    let text: string;
    try {
      response = await fetch(
        (apiUrl || monitor?.apiUrl || apiBaseUrl()) + "/trip",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tripSchema.parse(input)),
          signal: controller.signal,
        },
      );
      text = await response.text();
    } catch {
      throw new Error(texts.noConnection);
    }
    let data: (TripOutput & { error?: unknown; message?: unknown }) | null =
      null;
    try {
      data = text ? parseApiJson(text) : null;
    } catch {
      data = null;
    }
    if (!response.ok)
      throw new ApiError(
        (typeof data?.error === "string" && data.error) ||
          (typeof data?.message === "string" && data.message) ||
          texts.sendUnavailable,
        response.status,
      );
    return data ?? {};
  } finally {
    clearTimeout(timeout);
  }
}

async function nativeRunning() {
  try {
    return await Location.hasStartedLocationUpdatesAsync(trackingTaskName);
  } catch {
    return false;
  }
}

async function startNative() {
  if (await nativeRunning()) return;
  await Location.startLocationUpdatesAsync(trackingTaskName, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: nativeIntervalMs,
    distanceInterval: 0,
    activityType: Location.ActivityType.AutomotiveNavigation,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: texts.notificationTitle,
      notificationBody: texts.notificationBody,
      notificationColor: colors.primary,
      killServiceOnDestroy: false,
    },
  });
}

async function stopNative() {
  try {
    if (await nativeRunning())
      await Location.stopLocationUpdatesAsync(trackingTaskName);
  } catch {
    return;
  }
}

function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    void flushQueue();
    if (
      state.active &&
      state.lastSample &&
      Date.now() - state.lastSample > staleLocalMs &&
      state.message !== texts.stale
    )
      update({ message: texts.stale });
  }, foregroundTickMs);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function persistQueue() {
  if (state.tripId) await writeQueue(state.tripId, queue);
  if (state.queued !== queue.length) update({ queued: queue.length });
}

async function halt(clearQueue: boolean) {
  const tripId = state.tripId;
  update({
    active: false,
    lastMoving: null,
    ...(clearQueue ? { queued: 0 } : {}),
  });
  if (clearQueue) {
    queue = [];
    if (tripId) await removeQueue(tripId);
  }
  stopTimer();
  await stopNative();
}

async function disableOnServer(token: string) {
  try {
    await send({ action: "tracking", token, enabled: false, consent: false });
  } catch {
    return;
  }
}

async function sensorError(text: string) {
  const token = monitor?.token;
  await halt(true);
  update({ message: text });
  if (token) await disableOnServer(token);
  notifyTrip();
}

export async function flushQueue() {
  if (!(await ensureReady())) return;
  if (!state.active || sending || !monitor || !queue.length) return;
  sending = true;
  try {
    while (state.active && monitor) {
      queue = queue.filter((point) => freshPoint(point));
      const batch = queue.slice(0, batchSize);
      if (!batch.length) {
        await persistQueue();
        break;
      }
      await send({ action: "positions", token: monitor.token, points: batch });
      const sent = new Set(batch.map((point) => point.id));
      queue = queue.filter((point) => !sent.has(point.id));
      await persistQueue();
      update({
        lastSent: Date.now(),
        message: queue.length ? texts.syncing : texts.received,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : texts.noConnection;
    if (fatalError.test(message)) {
      await halt(true);
      update({ message });
      notifyTrip();
    } else if (state.active) update({ message: texts.offline });
  } finally {
    sending = false;
  }
}

async function sample(location: Location.LocationObject) {
  if (!state.active) return;
  if (location.mocked) {
    if (state.message !== texts.mocked) update({ message: texts.mocked });
    return;
  }
  const time = location.timestamp || Date.now();
  if (Date.now() - time > maxFixAgeMs) return;
  const moving = (location.coords.speed ?? 0) >= movingSpeedMs;
  const changed = state.lastMoving !== null && state.lastMoving !== moving;
  const minimum = moving ? movingSampleMs : stoppedSampleMs;
  if (!changed && time < state.lastSample + minimum) return;

  const battery = await readBattery();
  if (!battery) {
    await sensorError(texts.batteryRequired);
    return;
  }
  if (!state.active) return;
  const point = buildPoint({ ...location, timestamp: time }, battery);
  if (!point) {
    update({ lastMoving: moving, lastSample: time });
    return;
  }
  queue = [...queue, point].slice(-queueLimit);
  if (state.tripId) await writeQueue(state.tripId, queue);
  update({
    lastMoving: moving,
    lastSample: time,
    queued: queue.length,
    message: sampleMessage(moving, battery.percentage, battery.charging),
  });
}

export function handleLocations(
  locations: Location.LocationObject[],
  failed: boolean,
) {
  chain = chain
    .then(async () => {
      if (!(await ensureReady())) return;
      if (!state.active || !monitor) {
        if (!starting) await stopNative();
        return;
      }
      if (failed) {
        await sensorError(texts.locationUnavailable);
        return;
      }
      const ordered = [...locations].sort((a, b) => a.timestamp - b.timestamp);
      for (const location of ordered) await sample(location);
      await flushQueue();
    })
    .catch(() => undefined);
  return chain;
}

export async function startTracking(input: {
  token: string;
  tripId: string;
  operationConsent?: boolean;
}) {
  if (!(await ensureReady())) return false;
  if (starting || state.active) return false;
  starting = true;
  const previous = state.tripId;
  if (previous && previous !== input.tripId) {
    queue = [];
    await removeQueue(previous);
  }
  update({
    tripId: input.tripId,
    busy: true,
    message: texts.starting,
    ...(previous !== input.tripId
      ? { queued: 0, lastSent: null, lastSample: 0, lastMoving: null }
      : {}),
  });
  const apiUrl = apiBaseUrl();
  try {
    const battery = await readBattery();
    if (!battery) throw new Error(texts.batteryUnreadable);
    await ensureNotificationPermission();
    await ensureForegroundPermission();
    await requestBackgroundPermission();
    const firstPoint = await readInitialPoint(battery);
    await send(
      {
        action: "tracking",
        token: input.token,
        enabled: true,
        consent: true,
        operationConsent: input.operationConsent === true,
        firstPoint,
      },
      apiUrl,
    );
    monitor = { token: input.token, tripId: input.tripId, apiUrl };
    await writeMonitor(monitor);
    queue = await readQueue(input.tripId);
    const recordedAt = new Date(firstPoint.recordedAt).getTime();
    update({
      active: true,
      lastSample: recordedAt,
      lastSent: recordedAt,
      lastMoving: null,
      queued: queue.length,
      message: activeMessage(battery.percentage, battery.charging),
    });
    try {
      await startNative();
    } catch {
      throw new Error(texts.locationUnavailable);
    }
    startTimer();
    notifyTrip();
    void flushQueue();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : texts.startFailed;
    await halt(error instanceof ApiError && fatalError.test(message));
    update({ message: message || texts.startFailed });
    await disableOnServer(input.token);
    return false;
  } finally {
    starting = false;
    update({ busy: false });
  }
}

export async function finishTracking() {
  await ensureReady();
  monitor = null;
  await writeMonitor(null);
  await halt(true);
}

export async function attachTripToken(token: string, tripId: string) {
  if (!(await ensureReady())) return;
  if (!monitor || monitor.tripId !== tripId || monitor.token === token) return;
  monitor = { ...monitor, token };
  await writeMonitor(monitor);
}

export async function storedMonitor() {
  await ensureReady();
  return monitor;
}

export async function resumeTracking() {
  if (!(await ensureReady()) || !monitor || resuming || starting) return;
  resuming = true;
  try {
    const entry = monitor;
    const running = await nativeRunning();
    const healthy = state.active && state.tripId === entry.tripId && running;
    if (healthy) {
      startTimer();
      void flushQueue();
    }
    let detail: TripOutput["detail"];
    try {
      detail = (await send({ action: "read", token: entry.token })).detail;
    } catch (error) {
      if (accessError.test(error instanceof Error ? error.message : "")) {
        await finishTracking();
        notifyTrip();
      }
      return;
    }
    if (monitor?.token !== entry.token) return;
    const trip = detail?.trip;
    if (!trip || detail?.role !== "driver" || isTerminalStage(trip.stage)) {
      await finishTracking();
      notifyTrip();
      return;
    }
    if (healthy || !trip.acceptedAt || !trip.consentAt) return;
    if (AppState.currentState !== "active") return;
    if (state.active) update({ active: false });
    await startTracking({ token: entry.token, tripId: entry.tripId });
  } finally {
    resuming = false;
  }
}
