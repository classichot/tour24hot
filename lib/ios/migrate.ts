import type { IosState, TripFile } from "./types";

/**
 * Forward-only migration for workspaces saved by earlier builds (MIG05: idempotent, never duplicates).
 * Unknown values stay empty rather than being invented (MIG02).
 */
export function migrateTrip(t: TripFile): TripFile {
  return {
    ...t,
    reservations: t.reservations ?? [],
    guests: t.guests ?? [],
    guestsVersion: t.guestsVersion ?? 1,
    documents: t.documents ?? [],
    incidents: t.incidents ?? [],
    changes: t.changes ?? [],
    itinerary: t.itinerary.map((d) => ({ ...d, services: d.services.map((s) => ({ ...s, specVersion: s.specVersion ?? 1 })) })),
  };
}

export function migrateState(s: IosState): IosState {
  return { ...s, trips: s.trips.map(migrateTrip) };
}
