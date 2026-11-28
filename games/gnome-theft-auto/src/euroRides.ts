// The European rides (E29, docs/roadmaps/gta-batch-3/E29/contracts.md): the five small city vehicles of the European yard,
// where traffic should be mostly them (the zone), and the achievements for driving them.
import { recordRideIn, type RideStorage } from './oddRides';
import type { VehicleKind } from './types';

export const EURO_RIDES: readonly VehicleKind[] = ['euro-hatch', 'deux-pots', 'wespa', 'baguette-trike', 'crepe-van'];
export const EURO_RIDES_KEY = 'gta-euro-rides-v1';
/** Achievements (packages/achievements catalog.ts): drive all five, drive the trike, drive the hatch. */
export const GRAND_TOUR = 'gta-grand-tour';
export const BAGUETTE_RUN = 'gta-baguette-run';
export const PETIT_POIS = 'gta-petit-pois';

/** True where traffic is European (E28/E30 register the European yard's area). Default: nowhere. */
export type EuroZone = (x: number, z: number) => boolean;
let zone: EuroZone = () => false;

/** Register the European zone (call once at world build; a later call replaces it). */
export function setEuroZone(pred: EuroZone): void {
  zone = pred;
}

/** True when (x, z) is inside the European zone. */
export function euroZoneAt(x: number, z: number): boolean {
  return zone(x, z);
}

/** Remember that the player drove `kind`: true only the first time ever for a EURO_RIDES kind (same rules as recordOddRide). */
export function recordEuroRide(kind: VehicleKind, storage: RideStorage | null): boolean {
  return recordRideIn(EURO_RIDES, EURO_RIDES_KEY, euroMemory, kind, storage);
}
const euroMemory = new Set<string>();

/** The achievement ids to unlock (once each) and increment when the player first drives `kind`; used by app.ts. */
export function euroRideAchievements(kind: VehicleKind): { unlock: string[]; increment: string[] } {
  const unlock: string[] = [];
  if (kind === 'baguette-trike') unlock.push(BAGUETTE_RUN);
  if (kind === 'euro-hatch') unlock.push(PETIT_POIS);
  return { unlock, increment: [GRAND_TOUR] };
}
