// Free ride is a race: from the spawn at the top of the mountain to the aether gate at the bottom, as fast as you can.
// Pure: the clock counts simulation time (so pausing, the trick book and slow frames never cost you), physics events
// drive it. Through the gate the run is timed and a new one starts at once (the gate warps you back to the top).
import type { PhysEvent } from './config';

export interface RaceFinish {
  /** Seconds from the start to the gate. */
  time: number;
  /** Best time before this run (null: the first finish). */
  prevBest: number | null;
  newBest: boolean;
  /** Bails (and falls off the mountain) this run. */
  bails: number;
}

export interface Race {
  /** Seconds into the current run. */
  readonly time: number;
  readonly best: number | null;
  /** Bails and falls this run. */
  readonly bails: number;
  /** Add one simulation step to the clock. */
  tick(dt: number): void;
  /**
   * Feed every physics event; returns the result when this one finished a run. Only a gate reached after riding down
   * to the last run counts (a warp from anywhere else just starts the clock again).
   */
  event(e: PhysEvent): RaceFinish | null;
  /** Start the clock again from 0 (back at the top). */
  restart(): void;
}

/** runs: how many runs the mountain has (World.islands.length). */
export function createRace(runs: number, best: number | null = null): Race {
  let time = 0;
  let bails = 0;
  let bestT = best;
  let furthest = 0;
  return {
    get time() { return time; },
    get best() { return bestT; },
    get bails() { return bails; },
    tick(dt) {
      time += dt;
    },
    event(e) {
      if (e.e === 'bail' || e.e === 'skyfall') bails++;
      if (e.e === 'island') furthest = Math.max(furthest, e.id);
      if (e.e !== 'warp') return null;
      const rode = furthest >= runs - 1;
      furthest = 0;
      if (!rode) {
        time = 0;
        bails = 0;
        return null;
      }
      const prevBest = bestT;
      const newBest = prevBest === null || time < prevBest;
      if (newBest) bestT = time;
      const r: RaceFinish = { time, prevBest, newBest, bails };
      time = 0;
      bails = 0;
      return r;
    },
    restart() {
      time = 0;
      bails = 0;
      furthest = 0;
    },
  };
}

/** m:ss.cc */
export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(2).padStart(5, '0')}`;
}
