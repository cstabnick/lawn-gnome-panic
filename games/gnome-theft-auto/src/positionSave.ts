// Where the gnome last stood: the localStorage key gta-position-v1 (in GTA_SAVE_KEYS, so the cloud save mirrors it; the
// newer side wins). app.ts writes it every few seconds and restores it on start. A spot that is no longer fine (off the
// map, under water, an interior that was removed) falls back to the start spawn (validatePosition returns null).
import { notifySaveChanged } from './saveHook';

export const POSITION_KEY = 'gta-position-v1';

export interface SavedPosition { v: 1; x: number; z: number; yaw: number; interior?: string; t: number }

export function encodePosition(p: Omit<SavedPosition, 'v' | 't'>, now: number = Date.now()): string {
  const out: SavedPosition = { v: 1, x: p.x, z: p.z, yaw: p.yaw, t: now };
  if (p.interior) out.interior = p.interior;
  return JSON.stringify(out);
}

/** The saved record, or null on bad JSON, a wrong shape or any non-finite number. */
export function decodePosition(raw: string | null): SavedPosition | null {
  if (!raw) return null;
  let d: unknown;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!d || typeof d !== 'object') return null;
  const o = d as Record<string, unknown>;
  if (o.v !== 1) return null;
  for (const k of ['x', 'z', 'yaw']) if (typeof o[k] !== 'number' || !Number.isFinite(o[k] as number)) return null;
  const t = typeof o.t === 'number' && Number.isFinite(o.t) ? o.t : 0;
  const out: SavedPosition = { v: 1, x: o.x as number, z: o.z as number, yaw: o.yaw as number, t };
  if (typeof o.interior === 'string' && o.interior) out.interior = o.interior;
  return out;
}

/** Where to start: the saved spot if it is fine, else null (the caller uses world.spawn). */
export function validatePosition(p: SavedPosition | null, w: {
  half: number; isWater(x: number, z: number): boolean; interiorExists(id: string): boolean;
}): SavedPosition | null {
  if (!p) return null;
  const lim = w.half - 5;
  if (!(Math.abs(p.x) <= lim && Math.abs(p.z) <= lim)) return null;
  if (w.isWater(p.x, p.z)) return null;
  const out: SavedPosition = { v: 1, x: p.x, z: p.z, yaw: p.yaw, t: p.t };
  if (p.interior && w.interiorExists(p.interior)) out.interior = p.interior;
  return out;
}

/** The saved record from storage (localStorage by default). Never throws. */
export function readPosition(storage?: Pick<Storage, 'getItem'>): SavedPosition | null {
  try {
    const s = storage ?? globalThis.localStorage;
    return decodePosition(s.getItem(POSITION_KEY));
  } catch {
    return null;
  }
}

/** Save the spot (localStorage by default) and tell the cloud save. Never throws. */
export function writePosition(p: Omit<SavedPosition, 'v' | 't'>, storage?: Pick<Storage, 'setItem'>): void {
  try {
    const s = storage ?? globalThis.localStorage;
    s.setItem(POSITION_KEY, encodePosition(p));
  } catch {
    // storage full or blocked: the spot is simply not kept
    return;
  }
  notifySaveChanged();
}
