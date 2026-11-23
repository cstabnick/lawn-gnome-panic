// Birding: which species turns up where and when. Pure: no allocation per call beyond the result.
import { RARITY_WEIGHT, type BirdSpecies, type RegionId, type TimeLabel, type Wind } from './types';

/** The wind at `time` seconds: a slow deterministic cycle. */
export function windAt(time: number): Wind {
  const s = Math.sin((time * 2 * Math.PI) / 240) + 0.5 * Math.sin((time * 2 * Math.PI) / 97 + 1);
  if (s < -0.45) return 'calm';
  if (s > 0.6) return 'blustery';
  return 'breezy';
}

/** Spawn weight of a species here and now (0 = cannot appear). */
export function speciesWeight(s: BirdSpecies, region: RegionId, label: TimeLabel, wind: Wind): number {
  return RARITY_WEIGHT[s.rarity] * (s.regions[region] ?? 0) * (s.time[label] ?? 0) * s.wind[wind] * (s.ambient ? 1.5 : 1);
}

/** A species picked by weight, or null when every weight is 0. */
export function pickSpecies(birds: readonly BirdSpecies[], region: RegionId, label: TimeLabel, wind: Wind, rnd: () => number): BirdSpecies | null {
  let total = 0;
  for (let i = 0; i < birds.length; i++) total += speciesWeight(birds[i], region, label, wind);
  if (total <= 0) return null;

  let target = rnd() * total;
  let last: BirdSpecies | null = null;
  for (let i = 0; i < birds.length; i++) {
    const w = speciesWeight(birds[i], region, label, wind);
    if (w <= 0) continue;
    last = birds[i];
    if (target < w) return birds[i];
    target -= w;
  }
  // Float rounding can leave a sliver of target past the last weight: take the last species that could appear.
  return last;
}

/** A flock size in s.flock (inclusive). */
export function flockSize(s: BirdSpecies, rnd: () => number): number {
  const [lo, hi] = s.flock;
  const n = lo + Math.floor(rnd() * (hi - lo + 1));
  return Math.min(hi, Math.max(lo, n));
}

/** The wind's name for the birding HUD. */
export function wildName(w: Wind): string {
  if (w === 'calm') return 'Calm';
  if (w === 'blustery') return 'Blustery';
  return 'Breezy';
}
