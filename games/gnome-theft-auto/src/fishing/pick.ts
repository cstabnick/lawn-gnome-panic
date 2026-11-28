// Fishing: who bites (weighted by water, region, time, weather, bait, rod and hot spot), how big, and how soon. Pure.
import { FISH_SPECIES, FISH_SPOTS } from './species';
import { FISH, RARITY_WEIGHT } from './types';
import { weatherAt as skyAt } from '../weather';
import type { BaitDef, FishSpecies, FishSpot, FishWater, FishWeather, RegionId, TimeLabel } from './types';

export interface PickCtx {
  water: FishWater;
  region: RegionId;
  time: TimeLabel;
  weather: FishWeather;
  bait: BaitDef;
  rodTier: number;
  /** The hot spot the bobber is in, or null. */
  spot: FishSpot | null;
}

/**
 * The fishing weather at a region and time. Frostbite Fells is always 'snow' (frost glaze stays on the ice). Else the
 * real weather from src/weather/: snow or rain above intensity 0.15, or mist. Else Loch Moss at Dawn or Morning is 'mist'
 * (the old morning mist). Else 'clear' ('cloud' counts as clear).
 */
export function weatherAt(region: RegionId, time: TimeLabel): FishWeather {
  if (region === 'frostbite-fells') return 'snow';
  const w = skyAt(region);
  if (w.kind === 'snow' && w.intensity > 0.15) return 'snow';
  if (w.kind === 'rain' && w.intensity > 0.15) return 'rain';
  if (w.kind === 'mist') return 'mist';
  if (region === 'loch-moss' && (time === 'Dawn' || time === 'Morning')) return 'mist';
  return 'clear';
}

/** The relative chance of `s` biting in `c` (0 = never). */
export function fishWeight(s: FishSpecies, c: PickCtx): number {
  if (!s.waters.includes(c.water)) return 0;
  if (s.regions && !s.regions.includes(c.region)) return 0;
  if (c.rodTier < s.minRod) return 0;
  if (s.spot && c.spot?.id !== s.spot) return 0;
  let w = RARITY_WEIGHT[s.rarity] *
    (s.times?.[c.time] ?? 1) *
    (s.weather?.[c.weather] ?? 1) *
    (s.baits?.[c.bait.id] ?? 1);
  if (s.rarity === 'rare' || s.rarity === 'mythic') {
    w *= c.bait.rareBonus;
    if (c.spot !== null) w *= FISH.hotspotRare;
  }
  return w;
}

/** A weighted pick from `list` (default FISH_SPECIES), or null when every weight is 0. */
export function pickFish(c: PickCtx, rnd: () => number, list: readonly FishSpecies[] = FISH_SPECIES): FishSpecies | null {
  let sum = 0;
  for (const s of list) sum += fishWeight(s, c);
  if (sum <= 0) return null;
  const r = rnd() * sum;
  let acc = 0;
  let last: FishSpecies | null = null;
  for (const s of list) {
    const w = fishWeight(s, c);
    if (w <= 0) continue;
    last = s;
    acc += w;
    if (r < acc) return s;
  }
  // Float rounding can leave r just past the total: take the last species that could bite.
  return last;
}

/** A length in whole cm inside s.size, big ones rarer. */
export function rollSize(s: FishSpecies, rnd: () => number): number {
  return Math.round(s.size[0] + (s.size[1] - s.size[0]) * Math.pow(rnd(), 1.6));
}

/** Seconds until the next bite. */
export function biteDelay(bait: BaitDef, hotspot: boolean, rnd: () => number): number {
  return (FISH.biteMin + rnd() * (FISH.biteMax - FISH.biteMin)) * bait.biteSpeed * (hotspot ? FISH.hotspotBite : 1);
}

/** The hot spot within FISH.spotRadius of (x, z), or null. */
export function spotAt(x: number, z: number): FishSpot | null {
  for (const spot of FISH_SPOTS) {
    if (Math.hypot(x - spot.x, z - spot.z) <= FISH.spotRadius) return spot;
  }
  return null;
}
