// Mole jobs (E17 issue J1): pure rules for the four Loamdeep jobs. No DOM, no three.js. Every function returns a NEW
// object (the argument is never mutated).
import { LOAMDEEP, LAMP_TUNNELS, HALL_NAMES } from '../config';
import type { HallId, LampTunnelId, MoleJobId } from '../config';

/** Tuning per job: units in a shift, seconds allowed, Acorns per unit at 3 stars. */
export interface MoleJobDef { id: MoleJobId; name: string; units: number; seconds: number; payPerUnit: number; blurb: string }
export const MOLE_JOBS: Readonly<Record<MoleJobId, MoleJobDef>> = {
  roots: {
    id: 'roots', name: 'Root Run', units: 4, seconds: 150, payPerUnit: 14,
    blurb: 'Carry bundles from Rootway Hall to whichever hall is short. Gently. They are someone\'s supper.',
  },
  lamps: {
    id: 'lamps', name: 'Lamplighter', units: 4, seconds: 75, payPerUnit: 8,
    blurb: 'Light every lamp down one tunnel before the taper burns out.',
  },
  post: {
    id: 'post', name: 'Post Sorting', units: 10, seconds: 60, payPerUnit: 4,
    blurb: 'Sort the post into the right pigeonholes for Mister Sift.',
  },
  dig: {
    id: 'dig', name: 'Dig a Nook', units: 3, seconds: 90, payPerUnit: 15,
    blurb: 'Dig three tidy nooks in Hearth Hall\'s wall. Not too shallow. Not so deep the ceiling joins you.',
  },
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
  /** Root Run: the hall the last bundle went to (no hall twice in a row). */
  lastTo?: Exclude<HallId, 'rootway'> | null;
  /** Lamplighter: the tunnel being lit this shift and which of its lamps are lit. */
  tunnel: LampTunnelId | null;
  lit: boolean[];
  over: boolean;
}

type RootHall = Exclude<HallId, 'rootway'>;
const ROOT_HALLS = Object.keys(LOAMDEEP.spots.rootDrops) as RootHall[];

/** Start a shift. `rand` returns 0..1 (Math.random in the game, seeded in tests). */
export function startShift(job: MoleJobId, rand: () => number): MoleShift {
  const base: MoleShift = { job, left: MOLE_JOBS[job].seconds, done: 0, misses: 0, rootTo: null, tunnel: null, lit: [], over: false };
  if (job === 'lamps') {
    const tunnel = LAMP_TUNNELS[Math.min(LAMP_TUNNELS.length - 1, Math.floor(rand() * LAMP_TUNNELS.length))];
    return { ...base, tunnel, lit: [false, false, false, false] };
  }
  return base;
}

/** Advance the clock; marks the shift over when time runs out. */
export function tickShift(s: MoleShift, dt: number): MoleShift {
  return { ...s, left: Math.max(0, s.left - dt), over: s.over || s.left - dt <= 0 };
}

/**
 * Root Run: pick the hall the next bundle goes to (only when carrying nothing and the shift is running). Never the
 * same hall as the last drop.
 */
export function takeRoots(s: MoleShift, rand: () => number): MoleShift {
  if (s.job !== 'roots' || s.rootTo !== null || s.over) return s;
  const candidates = ROOT_HALLS.filter((h) => h !== s.lastTo);
  const idx = Math.min(candidates.length - 1, Math.floor(rand() * candidates.length));
  return { ...s, rootTo: candidates[idx] };
}

/** Root Run: drop the bundle at `hall`. Any hall but the one it is for changes nothing (same object returned). */
export function dropRoots(s: MoleShift, hall: RootHall): MoleShift {
  if (s.job !== 'roots' || s.over || s.rootTo === null || hall !== s.rootTo) return s;
  const done = s.done + 1;
  return { ...s, done, lastTo: s.rootTo, rootTo: null, over: done >= MOLE_JOBS.roots.units };
}

/** Lamplighter: light lamp `i` (0..3). Lighting an already lit lamp changes nothing. */
export function lightLamp(s: MoleShift, i: number): MoleShift {
  if (s.job !== 'lamps' || s.over || !Number.isInteger(i) || i < 0 || i >= 4 || s.lit[i]) return s;
  const lit = s.lit.slice();
  lit[i] = true;
  const done = lit.filter(Boolean).length;
  return { ...s, lit, done, over: done >= 4 };
}

/** Post Sorting: the sorting game ended with `sorted` parcels in the right holes and `misses` wrong ones. */
export function recordSorting(s: MoleShift, sorted: number, misses: number): MoleShift {
  if (s.job !== 'post') return s;
  return { ...s, done: Math.min(Math.max(0, sorted), MOLE_JOBS.post.units), misses: Math.max(0, misses), over: true };
}

/** Dig a Nook: one dig finished, good (a nook) or bad (it collapsed). */
export function recordNook(s: MoleShift, good: boolean): MoleShift {
  if (s.job !== 'dig' || s.over) return s;
  const done = good ? s.done + 1 : s.done;
  const misses = good ? s.misses : s.misses + 1;
  return { ...s, done, misses, over: done + misses >= MOLE_JOBS.dig.units };
}

/** Stars 1..5 for a finished shift (0 when nothing was done). */
export function shiftStars(s: MoleShift): number {
  if (s.done === 0) return 0;
  const def = MOLE_JOBS[s.job];
  const frac = s.done / def.units;
  let stars = 1 + Math.floor(frac * 3);
  if (frac === 1 && s.left >= def.seconds * 0.25) stars += 1;
  stars -= Math.floor(s.misses / 2);
  return Math.min(5, Math.max(1, stars));
}

/** Acorns for a finished shift. */
export function shiftPay(s: MoleShift): number {
  if (s.done === 0) return 0;
  return Math.round((s.done * MOLE_JOBS[s.job].payPerUnit * shiftStars(s)) / 3);
}

function clock(seconds: number): string {
  const sec = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/** The HUD strip text, e.g. "Root Run 2/4 · to Hearth Hall · 1:41". */
export function jobLine(s: MoleShift): string {
  const def = MOLE_JOBS[s.job];
  const parts: string[] = [def.name];
  if (s.job !== 'post') parts.push(`${s.done}/${def.units}`);
  if (s.job === 'roots') {
    if (s.rootTo) {
      const name = HALL_NAMES[s.rootTo];
      parts.push(`to ${name.charAt(0).toUpperCase()}${name.slice(1)}`);
    } else {
      parts.push('fetch roots');
    }
  }
  parts.push(clock(s.left));
  return parts.join(' · ');
}
