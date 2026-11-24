import { acceptDriverTrip } from "@/api/driverPortal";
import { readTrip } from "@/api/trip";
import { isTripToken } from "@/domain/tripToken";
import { storedMonitor } from "@/tracking/engine";

export async function openDriverTrip(id: string): Promise<string> {
  try {
    const stored = await storedMonitor();
    if (stored?.tripId === id && isTripToken(stored.token)) {
      const result = await readTrip(stored.token);
      if (result.detail?.role === "driver" && result.detail.trip.id === id)
        return stored.token;
    }
  } catch {
    void 0;
  }
  const { driverToken } = await acceptDriverTrip(id);
  if (!isTripToken(driverToken)) throw new Error("Link de acesso inválido.");
  return driverToken;
}
