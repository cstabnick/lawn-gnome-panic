// Per-region traffic mix: each outer region gets its own character in the wide-area traffic (traffic.ts pickKind).
// Only land vehicles: no boats, aircraft or sled/tow rides.
import type { RegionId } from '../levels';
import type { VehicleKind } from '../types';

export interface RegionMix {
  /** Chance that a new car in this region is picked from `kinds` instead of the district mix. */
  chance: number;
  /** The kinds to pick from (repeat a kind to weight it). */
  kinds: readonly VehicleKind[];
}

/** Per region: with probability `chance` a new car there is picked from `kinds` (repeat a kind to weight it). */
export const REGION_TRAFFIC: Readonly<Partial<Record<RegionId, RegionMix>>> = {
  // Trellisdown and the estates: golf carts, lowriders and the Euro rides.
  'west-estates': {
    chance: 0.5,
    kinds: ['golf-cart', 'golf-cart', 'lowrider', 'deux-pots', 'euro-hatch', 'shell-camper'],
  },
  // Snowcap Rise: campers and the rough stuff.
  'north-highlands': {
    chance: 0.45,
    kinds: ['shell-camper', 'shell-camper', 'dirt-bike', 'ride-on', 'zero-turn'],
  },
  // Saltbucket Shore: the cone vans and the seaside scooters.
  'south-shore': {
    chance: 0.45,
    kinds: ['cone-van', 'cone-van', 'shell-camper', 'wespa', 'golf-cart', 'push-bike'],
  },
  // The Unmown: the rangers keep to their buggies.
  'the-unmown': {
    chance: 0.6,
    kinds: ['ranger-buggy', 'ranger-buggy', 'ranger-buggy', 'push-bike'],
  },
  // The flats: a light touch of buggies and dirt bikes.
  'dust-flats': {
    chance: 0.2,
    kinds: ['barrow-buggy', 'dirt-bike'],
  },
};

/**
 * The mixed kind for a new car in `region`, or null when the region has no mix or the roll misses.
 * r1 and r2 are rolls in [0, 1): r1 decides whether the mix applies, r2 picks the kind.
 */
export function regionMixKind(region: RegionId, r1: number, r2: number): VehicleKind | null {
  const mix = REGION_TRAFFIC[region];
  if (!mix || mix.kinds.length === 0 || r1 >= mix.chance) return null;
  return mix.kinds[Math.min(mix.kinds.length - 1, Math.floor(r2 * mix.kinds.length))];
}
