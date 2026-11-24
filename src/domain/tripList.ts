import type {
  TripDetail,
  TripEvent,
  TripPoint,
  TripRecord,
} from "@/api/tripTypes";

export type TripMessage = {
  trip?: TripRecord;
  deletedId?: string;
  point?: TripPoint;
  event?: TripEvent;
};

export function mergeTripList(prev: TripRecord[], message: TripMessage) {
  if (message.deletedId) return prev.filter((t) => t.id !== message.deletedId);
  const trip = message.trip;
  if (!trip) return prev;
  return prev.some((t) => t.id === trip.id)
    ? prev.map((t) => (t.id === trip.id ? trip : t))
    : [trip, ...prev].slice(0, 1000);
}

export function mergeTripDetail(
  prev: TripDetail | undefined,
  message: TripMessage,
) {
  if (message.deletedId === prev?.trip.id) return undefined;
  const trip = message.trip;
  if (!prev || !trip || prev.trip.id !== trip.id) return prev;
  return {
    ...prev,
    trip,
    points: message.point
      ? [
          ...prev.points.filter((p) => p.id !== message.point!.id),
          message.point,
        ]
          .sort(
            (a, b) =>
              new Date(a.recordedAt).getTime() -
              new Date(b.recordedAt).getTime(),
          )
          .slice(-500)
      : prev.points,
    events: message.event
      ? [
          ...prev.events.filter((e) => e.id !== message.event!.id),
          message.event,
        ]
      : prev.events,
  };
}
