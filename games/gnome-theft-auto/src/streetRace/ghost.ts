// E26: time-trial ghosts: record the player's run, replay the best one. Pure (no three.js; the mesh is ghostView.ts).
// Ghosts stay on this device ('gta-race-ghosts-v1', not cloud-saved: they are big).
import type { TrackId } from '../raceTrack/tracks';
import type { VehicleKind } from '../types';
import { angleDiff } from '../collide';

export const GHOST_KEY = 'gta-race-ghosts-v1';
/** Samples per second. */
export const GHOST_HZ = 5;

export interface GhostTrace {
  trackId: TrackId;
  vehicle: VehicleKind;
  /** Finish time, s. */
  time: number;
  hz: number;
  /** Per sample, flattened: x, y, z in decimetres (integers) and yaw as 0..255. Sample k is at t = k / hz. */
  pts: number[];
}

export interface GhostRecorder {
  reset(): void;
  /** Feed every frame; it keeps one sample per 1/hz s of race time `t`. */
  sample(t: number, x: number, y: number, z: number, yaw: number): void;
  finish(trackId: TrackId, vehicle: VehicleKind, time: number): GhostTrace;
}

function yawByte(yaw: number): number {
  const turns = (((yaw / (Math.PI * 2)) % 1) + 1) % 1;
  return Math.round(turns * 256) % 256;
}

export function createGhostRecorder(hz = GHOST_HZ): GhostRecorder {
  let pts: number[] = [];
  let next = 0;
  return {
    reset: () => {
      pts = [];
      next = 0;
    },
    sample: (t, x, y, z, yaw) => {
      while (t >= next / hz) {
        pts.push(Math.round(x * 10), Math.round(y * 10), Math.round(z * 10), yawByte(yaw));
        next++;
      }
    },
    finish: (trackId, vehicle, time) => ({ trackId, vehicle, time, hz, pts: pts.slice() }),
  };
}

/** Where the ghost is at race time t (linear between samples, yaw the short way round), or null past its end / empty. */
export function ghostPose(g: GhostTrace, t: number): { x: number; y: number; z: number; yaw: number } | null {
  const n = Math.floor(g.pts.length / 4);
  if (n === 0 || t < 0 || t > g.time) return null;
  const f = t * g.hz;
  const k0 = Math.min(Math.floor(f), n - 1);
  const k1 = Math.min(k0 + 1, n - 1);
  const frac = k0 === k1 ? 0 : Math.min(1, Math.max(0, f - k0));
  const a = k0 * 4;
  const b = k1 * 4;
  const lerp = (i: number) => (g.pts[a + i] + (g.pts[b + i] - g.pts[a + i]) * frac) / 10;
  const yaw0 = (g.pts[a + 3] / 256) * Math.PI * 2;
  const yaw1 = (g.pts[b + 3] / 256) * Math.PI * 2;
  const yawRaw = yaw0 + angleDiff(yaw1, yaw0) * frac;
  // Normalise to [-PI, PI).
  const yaw = ((((yawRaw + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return { x: lerp(0), y: lerp(1), z: lerp(2), yaw };
}

/** The browser's localStorage, or null when absent or blocked (the access itself can throw). */
function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readMap(storage: Pick<Storage, 'getItem'>): Record<string, unknown> | null {
  try {
    const raw = storage.getItem(GHOST_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isTrace(v: unknown, trackId: TrackId): v is GhostTrace {
  if (!v || typeof v !== 'object') return false;
  const g = v as Record<string, unknown>;
  if (g.trackId !== trackId || typeof g.vehicle !== 'string') return false;
  if (typeof g.time !== 'number' || !Number.isFinite(g.time)) return false;
  if (typeof g.hz !== 'number' || !Number.isInteger(g.hz) || g.hz <= 0) return false;
  if (!Array.isArray(g.pts) || g.pts.length % 4 !== 0) return false;
  return g.pts.every((p) => typeof p === 'number' && Number.isInteger(p));
}

/** The stored ghost for a track (null when none or unreadable). */
export function loadGhost(
  trackId: TrackId,
  storage: Pick<Storage, 'getItem'> | null = defaultStorage(),
): GhostTrace | null {
  if (!storage) return null;
  const map = readMap(storage);
  const entry = map?.[trackId];
  return isTrace(entry, trackId) ? entry : null;
}

/** Store a ghost (replaces the track's previous one). Never throws. */
export function saveGhost(
  g: GhostTrace,
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = defaultStorage(),
): void {
  if (!storage) return;
  try {
    const map = readMap(storage) ?? {};
    map[g.trackId] = g;
    storage.setItem(GHOST_KEY, JSON.stringify(map));
  } catch {
    // Quota or blocked storage: the ghost just is not kept.
  }
}
