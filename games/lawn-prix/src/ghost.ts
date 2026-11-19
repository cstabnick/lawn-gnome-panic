// Ghost time trials: record a run, replay it as a translucent racer. Pure data, no three.js and no DOM.
//
// A GhostRun is the unit of exchange: one finished 3-lap run on one course and vehicle, as versioned plain JSON.
// Today it lives in localStorage (ghostStore.ts). A global leaderboard would store the same JSON behind a different
// GhostStore, so keep this format small, versioned and validated on the way in (parseGhostRun).
import type { CourseId, KartState, VehicleId } from './config';
import { VEHICLES } from './config';
import { COURSES } from './courses';

export const GHOST_VERSION = 1;
/** Samples per second of race time. 20 Hz interpolated looks smooth and keeps a 3-lap run near 30 KB of JSON. */
export const GHOST_HZ = 20;
/** Numbers per sample: x (cm), z (cm), heading (mrad), packed flags. */
const FIELDS = 4;
/** A run longer than this is not a plausible 3-lap run: refuse it (storage and leaderboard size guard). */
const MAX_TOTAL_MS = 10 * 60 * 1000;
const MAX_SAMPLES = (MAX_TOTAL_MS / 1000) * GHOST_HZ + 8;

export interface GhostRun {
  v: typeof GHOST_VERSION;
  course: CourseId;
  vehicle: VehicleId;
  laps: number;
  /** Finish time, ms (the number a leaderboard ranks). */
  totalMs: number;
  /** Time of each lap, ms. Sums to totalMs. */
  lapMs: number[];
  /** Mower colour, 0xRRGGBB. */
  color: number;
  /** The player's gnome look code (`g1.…`), or null when they had no custom gnome. */
  gnome: string | null;
  /** Player's display name. */
  name: string;
  /** RFC 3339 timestamp of the run. */
  at: string;
  hz: number;
  /** Flat: FIELDS numbers per sample, sample i taken at race time i / hz. */
  samples: number[];
}

// ------------------------------------------------------------------ packed flags
// bit0 boosting, bit1 hopping, bit2 spinning out, bit3 off track, bits4-5 drift (0 none, 1 right, 2 left), bits6-9 steer (0..14).

const STEER_STEPS = 7;

function packFlags(k: Readonly<KartState>): number {
  const drift = k.drift > 0 ? 1 : k.drift < 0 ? 2 : 0;
  const steer = Math.round((Math.min(1, Math.max(-1, k.st)) + 1) * STEER_STEPS);
  return (k.boost > 0 ? 1 : 0) | (k.hop > 0 ? 2 : 0) | (k.spin > 0 ? 4 : 0) | (k.off ? 8 : 0) | (drift << 4) | (steer << 6);
}

// ------------------------------------------------------------------ recorder

export interface GhostRecorder {
  /** Call once per sim step with the player's kart and the race time after that step. */
  push(k: Readonly<KartState>, t: number): void;
  /** Number of samples so far. */
  readonly count: number;
  /** The finished run, or null when the kart has not finished (or the run is implausible). */
  finish(info: { course: CourseId; vehicle: VehicleId; laps: number; lapTimes: readonly number[]; fin: number | null;
    color: number; gnome: string | null; name: string; at: string }): GhostRun | null;
}

export function createRecorder(): GhostRecorder {
  const samples: number[] = [];
  let stopped = false;
  return {
    push(k, t) {
      if (stopped) return;
      // One sample per 1/hz of race time (a sim step is shorter than a sample, so at most one is due).
      while (t + 1e-9 >= samples.length / FIELDS / GHOST_HZ) {
        // "+ 0" turns -0 into 0, so a run is the same after a JSON round trip.
        samples.push(Math.round(k.x * 100) + 0, Math.round(k.z * 100) + 0, Math.round(k.h * 1000) + 0, packFlags(k));
        if (samples.length / FIELDS >= MAX_SAMPLES) {
          stopped = true;
          return;
        }
      }
      if (k.fin !== null) stopped = true; // the run ends at the line; the ghost parks there
    },
    get count() {
      return samples.length / FIELDS;
    },
    finish(info) {
      if (info.fin === null || samples.length / FIELDS >= MAX_SAMPLES) return null;
      const totalMs = Math.round(info.fin * 1000);
      // lapTimes are the race times at each line crossing; lapMs are the differences.
      const lapMs: number[] = [];
      let prev = 0;
      for (const t of info.lapTimes) {
        const ms = Math.round(t * 1000);
        lapMs.push(ms - prev);
        prev = ms;
      }
      const run: GhostRun = { v: GHOST_VERSION, course: info.course, vehicle: info.vehicle, laps: info.laps, totalMs,
        lapMs, color: info.color, gnome: info.gnome, name: info.name, at: info.at, hz: GHOST_HZ, samples: samples.slice() };
      return parseGhostRun(run);
    },
  };
}

// ------------------------------------------------------------------ playback

/** Where the ghost is at race time t. Fills out (a KartState the racer view can draw) and returns it. */
export function poseAt(run: GhostRun, t: number, out: KartState): KartState {
  const n = run.samples.length / FIELDS;
  const f = Math.max(0, t) * run.hz;
  const i = Math.min(n - 1, Math.floor(f));
  const j = Math.min(n - 1, i + 1);
  const a = i * FIELDS;
  const b = j * FIELDS;
  const u = i === j ? 0 : Math.min(1, f - i);
  const s = run.samples;
  out.vehicle = run.vehicle;
  out.x = (s[a] + (s[b] - s[a]) * u) / 100;
  out.z = (s[a + 1] + (s[b + 1] - s[a + 1]) * u) / 100;
  // Heading: the short way round (samples are not wrapped, but a steady spin crosses +-PI between two samples).
  let dh = (s[b + 2] - s[a + 2]) / 1000;
  dh = dh - Math.round(dh / (2 * Math.PI)) * 2 * Math.PI;
  out.h = s[a + 2] / 1000 + dh * u;
  out.vx = i === j ? 0 : ((s[b] - s[a]) / 100) * run.hz;
  out.vz = i === j ? 0 : ((s[b + 1] - s[a + 1]) / 100) * run.hz;
  const flags = s[a + 3];
  out.boost = flags & 1 ? 1 : 0;
  out.hop = flags & 2 ? 0.1 : 0;
  out.spin = flags & 4 ? 1 : 0;
  out.off = (flags & 8) !== 0;
  const drift = (flags >> 4) & 3;
  out.drift = drift === 1 ? 1 : drift === 2 ? -1 : 0;
  out.charge = 0;
  out.st = ((flags >> 6) & 15) / STEER_STEPS - 1;
  return out;
}

/** True once t is past the end of the recorded run (the ghost is parked on the line). */
export function ghostDone(run: GhostRun, t: number): boolean {
  return t * run.hz >= run.samples.length / FIELDS - 1;
}

/** Race times (s) at the end of each lap of the run: the splits to compare a live run against. */
export function splitTimes(run: GhostRun): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const ms of run.lapMs) {
    acc += ms;
    out.push(acc / 1000);
  }
  return out;
}

// ------------------------------------------------------------------ validation

function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Validates untrusted JSON (storage, or later a server) into a GhostRun, or null. Never throws. */
export function parseGhostRun(raw: unknown): GhostRun | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== GHOST_VERSION) return null;
  if (typeof r.course !== 'string' || !(r.course in COURSES)) return null;
  if (typeof r.vehicle !== 'string' || !(r.vehicle in VEHICLES)) return null;
  if (!isInt(r.laps) || r.laps < 1 || r.laps > 10) return null;
  if (!isInt(r.totalMs) || r.totalMs <= 0 || r.totalMs > MAX_TOTAL_MS) return null;
  if (!Array.isArray(r.lapMs) || r.lapMs.length !== r.laps || !r.lapMs.every((x) => isInt(x) && x > 0)) return null;
  if (!isInt(r.color) || typeof r.name !== 'string' || typeof r.at !== 'string') return null;
  if (r.gnome !== null && typeof r.gnome !== 'string') return null;
  if (!isInt(r.hz) || r.hz < 1 || r.hz > 60) return null;
  if (!Array.isArray(r.samples) || r.samples.length % FIELDS !== 0 || r.samples.length < 2 * FIELDS) return null;
  if (r.samples.length / FIELDS > MAX_SAMPLES) return null;
  if (!r.samples.every(isInt)) return null;
  return {
    v: GHOST_VERSION, course: r.course as CourseId, vehicle: r.vehicle as VehicleId, laps: r.laps, totalMs: r.totalMs,
    lapMs: r.lapMs as number[], color: r.color, gnome: r.gnome as string | null, name: r.name.slice(0, 40),
    at: r.at, hz: r.hz, samples: r.samples as number[],
  };
}

/** Whether run beats best (a faster total), or there is no best yet. */
export function isBetter(run: Pick<GhostRun, 'totalMs'>, best: Pick<GhostRun, 'totalMs'> | null): boolean {
  return best === null || run.totalMs < best.totalMs;
}
