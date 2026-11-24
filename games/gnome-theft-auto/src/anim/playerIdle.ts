// The player's gnome fidgets when left standing (round 3): after IDLE_DELAY seconds with no input it plays a small bit
// (checks its watch, pats its pockets, yawns at night, shivers in the Fells), then waits a while before the next.
import type { BiomeId } from '../types';
import type { AnimId } from './types';

/** Seconds of standing still before the first fidget, and the gap between fidgets after that. */
export const IDLE_DELAY = 8;
export const IDLE_GAP = 6;

const POOL: readonly AnimId[] = [
  'look-around', 'check-watch', 'pat-pockets', 'scratch-head', 'stretch', 'tap-foot', 'dust-hat', 'hands-on-hips',
  'tie-shoe', 'count-acorns', 'idle-swagger',
];

type Rand = () => number;

/** Which fidget to play: the place and the time first, then the general pool. */
export function pickFidget(biome: BiomeId | string, night: number, r: Rand = Math.random): AnimId {
  const roll = r();
  if (biome === 'tundra' && roll < 0.5) return 'shiver-fells';
  if (biome === 'desert' && roll < 0.5) return 'sweat-heat';
  if (night > 0.6 && roll < 0.4) return r() < 0.5 ? 'yawn' : 'idle-sleepy';
  return POOL[Math.floor(r() * POOL.length) % POOL.length];
}

export interface IdleFidget {
  /** Every frame. `still`: on foot, no input, nothing else playing. Returns an id to play now, or null. */
  update(dt: number, still: boolean, biome: BiomeId | string, night: number): AnimId | null;
}

export function createIdleFidget(r: Rand = Math.random): IdleFidget {
  let t = 0;
  let next = IDLE_DELAY;
  return {
    update(dt, still, biome, night) {
      if (!still) {
        t = 0;
        next = IDLE_DELAY;
        return null;
      }
      t += dt;
      if (t < next) return null;
      t = 0;
      next = IDLE_GAP + r() * IDLE_GAP;
      return pickFidget(biome, night, r);
    },
  };
}
