import type { VehicleKind } from './types';

/** The odd rides "Sunday Driver" counts (packages/achievements catalog.ts, gta-sunday-driver). */
export const ODD_RIDES: readonly VehicleKind[] = ['pot-rod', 'lawn-roller', 'teacup-trundler', 'barrow-buggy'];
export const ODD_RIDES_KEY = 'gta-odd-rides-v1';
export const SUNDAY_DRIVER = 'gta-sunday-driver';

export interface RideStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }

/** Used when storage is missing or throws: the odd rides driven on this page. */
const memoryDriven = new Set<string>();

/** Parse the stored set; anything that is not a JSON array of strings counts as empty. */
function parseDriven(raw: string | null): Set<string> {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Remember that the player drove `kind`. True only the first time ever for an ODD_RIDES kind
 *  (the set is a JSON array of kinds under ODD_RIDES_KEY; garbage counts as empty; a throwing or null storage
 *  keeps a per-module in-memory set instead). */
export function recordOddRide(kind: VehicleKind, storage: RideStorage | null): boolean {
  return recordRideIn(ODD_RIDES, ODD_RIDES_KEY, memoryDriven, kind, storage);
}

/** The same rules for any list of kinds: `kinds` stored as a JSON array under `key`, `memory` when storage fails (euroRides.ts). */
export function recordRideIn(
  kinds: readonly VehicleKind[], key: string, memory: Set<string>, kind: VehicleKind, storage: RideStorage | null,
): boolean {
  if (!kinds.includes(kind)) return false;
  if (storage) {
    try {
      const known = parseDriven(storage.getItem(key));
      if (known.has(kind)) return false;
      known.add(kind);
      storage.setItem(key, JSON.stringify([...known]));
      return true;
    } catch {
      // Storage is unavailable: fall through to the in-memory set.
    }
  }
  if (memory.has(kind)) return false;
  memory.add(kind);
  return true;
}
