// Pure leash-zone helpers: determines boss ranks and whether a point lies inside an entity's leash boundary.
import { TUNING, type LeashArea, type Rank } from './config';

/** True for any boss-tier enemy rank whose targets are strictly bound by its leash zone. */
export function isBossRank(rank: Rank): boolean {
  return rank === 'miniboss' || rank === 'boss' || rank === 'worldboss' || rank === 'final';
}

/** True when `(x, z)` is within the entity's authored `leash` circle, or `TUNING.leashRange` of `home`. */
export function isWithinLeash(e: { home: { x: number; z: number }; leash?: LeashArea }, x: number, z: number): boolean {
  const cx = e.leash ? e.leash.x : e.home.x;
  const cz = e.leash ? e.leash.z : e.home.z;
  const r = e.leash ? e.leash.r : TUNING.leashRange;
  return Math.hypot(x - cx, z - cz) <= r;
}

/** A returning enemy with no progress toward home for this long is treated as stuck and snapped home. */
export const RETURN_STALL_SECONDS = 6;
/** Distance (world metres) a returning enemy must gain on its best-so-far distance to count as progress. */
export const RETURN_PROGRESS_EPSILON = 0.2;

export interface ReturnTrack {
  /** Closest distance to home reached so far on this walk-back (Infinity before the first frame). */
  best: number;
  /** Seconds since the enemy last got meaningfully closer to home. */
  stall: number;
}

/** Advances the walk-home progress tracker by one frame. `stuck` is true once the stall timer reaches RETURN_STALL_SECONDS. */
export function trackReturn(prev: ReturnTrack, homeDist: number, dt: number): ReturnTrack & { stuck: boolean } {
  if (homeDist < prev.best - RETURN_PROGRESS_EPSILON) return { best: homeDist, stall: 0, stuck: false };
  const stall = prev.stall + dt;
  return { best: prev.best, stall, stuck: stall >= RETURN_STALL_SECONDS };
}
