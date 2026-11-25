// Mole jobs (E17 issue J1): pure rules for the four Loamdeep jobs. STUB: the J1 worker replaces the bodies, keeping
// every exported signature.
import type { HallId, LampTunnelId, MoleJobId } from '../config';

/** Tuning per job: units in a shift, seconds allowed, Acorns per unit at 3 stars. */
export interface MoleJobDef { id: MoleJobId; name: string; units: number; seconds: number; payPerUnit: number; blurb: string }
export const MOLE_JOBS: Readonly<Record<MoleJobId, MoleJobDef>> = {
  roots: { id: 'roots', name: 'Root Run', units: 4, seconds: 150, payPerUnit: 14, blurb: '' },
  lamps: { id: 'lamps', name: 'Lamplighter', units: 4, seconds: 75, payPerUnit: 8, blurb: '' },
  post: { id: 'post', name: 'Post Sorting', units: 10, seconds: 60, payPerUnit: 4, blurb: '' },
  dig: { id: 'dig', name: 'Dig a Nook', units: 3, seconds: 90, payPerUnit: 15, blurb: '' },
};

/** A shift in progress. `done` counts units finished; `misses` counts mistakes (wrong pigeonhole, a collapsed nook). */
export interface MoleShift {
  job: MoleJobId;
  /** Seconds left. */
  left: number;
  done: number;
  misses: number;
  /** Root Run: the hall the current bundle goes to (null = go and pick one up). */
  rootTo: Exclude<HallId, 'rootway'> | null;
  /** Lamplighter: the tunnel being lit this shift and which of its lamps are lit. */
  tunnel: LampTunnelId | null;
  lit: boolean[];
  over: boolean;
}

/** Start a shift. `rand` returns 0..1 (Math.random in the game, seeded in tests). */
export function startShift(job: MoleJobId, _rand: () => number): MoleShift {
  return { job, left: MOLE_JOBS[job].seconds, done: 0, misses: 0, rootTo: null, tunnel: null, lit: [], over: false };
}

/** Advance the clock; marks the shift over when time runs out. */
export function tickShift(s: MoleShift, dt: number): MoleShift {
  return { ...s, left: Math.max(0, s.left - dt), over: s.over || s.left - dt <= 0 };
}

/** Stars 0..5 for a finished shift. */
export function shiftStars(_s: MoleShift): number {
  return 0;
}

/** Acorns for a finished shift. */
export function shiftPay(_s: MoleShift): number {
  return 0;
}
