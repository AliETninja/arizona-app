import { z } from "zod";
import type { TripRecord } from "@/api/tripTypes";

const coordinate = z.tuple([
  z.number().min(-34).max(6),
  z.number().min(-75).max(-28),
]);

const location = z.object({
  point: coordinate,
  address: z.string(),
  cep: z.string(),
});

const plannedRouteSchema = z.object({
  pickupCep: z.string(),
  deliveryCep: z.string(),
  pickup: coordinate,
  delivery: coordinate,
  origin: coordinate.nullable(),
  path: z.array(coordinate).min(2).max(50000),
  distance: z.number().nonnegative(),
  calculatedAt: z.string(),
  source: z.enum(["OSRM", "TomTom Truck", "TomTom Fastest"]),
  locations: z.object({ pickup: location, delivery: location }).optional(),
  locationVersion: z.literal(2).optional(),
});

const detourSchema = z.object({
  requestId: z.string(),
  status: z.enum(["pending", "ready", "unavailable"]),
  source: z.enum(["TomTom Truck", "TomTom Fastest"]).optional(),
  path: z.array(coordinate).min(2).max(50000).optional(),
  distance: z.number().nonnegative().optional(),
});

const cityDataSchema = z.object({
  status: z.enum(["ready", "unavailable"]),
  visits: z
    .array(
      z.object({
        city: z.string(),
        uf: z.string(),
        firstAt: z.string(),
        lastAt: z.string(),
      }),
    )
    .max(1000),
  matchedAt: z.string().optional(),
});

export type PlannedRoute = z.infer<typeof plannedRouteSchema>;
export type Detour = z.infer<typeof detourSchema>;
export type CityData = z.infer<typeof cityDataSchema>;

function read<T>(schema: z.ZodType<T>, value: string | null | undefined) {
  try {
    const parsed = schema.safeParse(JSON.parse(value || "null"));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const clean = (value: string | null | undefined) =>
  (value || "").trim().replace(/\s+/g, " ");

export type RouteInput = Pick<
  TripRecord,
  "routeData" | "pickupCep" | "deliveryCep" | "origin" | "destination"
>;

function confirmed(route: PlannedRoute, trip: RouteInput) {
  const locations = route.locations;
  return (
    route.locationVersion === 2 &&
    route.source !== "OSRM" &&
    !!locations &&
    locations.pickup.cep === trip.pickupCep &&
    locations.delivery.cep === trip.deliveryCep &&
    clean(locations.pickup.address) === clean(trip.origin) &&
    clean(locations.delivery.address) === clean(trip.destination) &&
    JSON.stringify(route.pickup) === JSON.stringify(locations.pickup.point) &&
    JSON.stringify(route.delivery) === JSON.stringify(locations.delivery.point)
  );
}

export function readPlannedRoute(trip: RouteInput): PlannedRoute | null {
  const route = read(plannedRouteSchema, trip.routeData);
  return route && confirmed(route, trip) ? route : null;
}

export function readDetour(
  detourData: string | null,
  planned: PlannedRoute | null,
): Detour | null {
  const detour = planned ? read(detourSchema, detourData) : null;
  if (!detour) return null;
  return detour.status === "ready" && !detour.source ? null : detour;
}

export const readCityData = (value: string | null | undefined) =>
  read(cityDataSchema, value);

export function thinPath(path: [number, number][], limit = 1500) {
  if (path.length <= limit) return path;
  const step = Math.ceil(path.length / limit);
  const result = path.filter((_point, index) => index % step === 0);
  const last = path[path.length - 1];
  if (result[result.length - 1] !== last) result.push(last);
  return result;
}
