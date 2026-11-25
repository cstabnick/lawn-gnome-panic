// E31 living world: the watches behind its achievements. Pure: no three.js, no DOM. living/runtime.ts feeds them the
// player each frame and turns their answers into unlocks / increments. Progress is saved per browser under
// LIVING_KEY so a counted hide, place or ride is never counted twice.
import { BOARDWALK, HIDE_INSIDE_R, NEW_RIDES, OFF_BEATEN_PLACES, UNMOWN_HIDES } from './config';
import type { VehicleKind } from '../types';

export const LIVING_KEY = 'gta-living-v1';

export interface LivingSave { hides: string[]; places: string[]; rides: string[]; birds: string[] }

export interface LivingProgress {
  data(): Readonly<LivingSave>;
  /** Adds `id` to the list; true only the first time. */
  add(list: keyof LivingSave, id: string): boolean;
}

export function createLivingProgress(storage?: Pick<Storage, 'getItem' | 'setItem'> | null): LivingProgress {
  const d: LivingSave = { hides: [], places: [], rides: [], birds: [] };
  try {
    const raw = storage?.getItem(LIVING_KEY);
    const o = raw ? (JSON.parse(raw) as Partial<Record<keyof LivingSave, unknown>>) : {};
    for (const k of Object.keys(d) as (keyof LivingSave)[]) {
      const v = o[k];
      if (Array.isArray(v)) d[k] = v.filter((x): x is string => typeof x === 'string');
    }
  } catch { /* garbage: start empty */ }
  return {
    data: () => d,
    add(list, id) {
      if (d[list].includes(id)) return false;
      d[list].push(id);
      try { storage?.setItem(LIVING_KEY, JSON.stringify(d)); } catch { /* memory only */ }
      return true;
    },
  };
}

/** The hide the player stands in (on foot), or null. */
export function hideAt(x: number, z: number): string | null {
  for (const h of UNMOWN_HIDES) if (Math.hypot(x - h.x, z - h.z) <= HIDE_INSIDE_R) return h.id;
  return null;
}

/** The hamlet / High Tarn the player is in, or null. */
export function placeAt(x: number, z: number): string | null {
  for (const p of OFF_BEATEN_PLACES) if (Math.hypot(x - p.x, z - p.z) <= p.r) return p.id;
  return null;
}

/** True for the three E31 vehicles. */
export function isNewRide(kind: VehicleKind): boolean {
  return NEW_RIDES.includes(kind);
}

/** Within `tol` metres of the boardwalk's centre line (any leg). */
export function onBoardwalk(x: number, z: number, tol = 1.6): boolean {
  for (let i = 0; i + 1 < BOARDWALK.length; i++) {
    const [ax, az] = BOARDWALK[i], [bx, bz] = BOARDWALK[i + 1];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
    if (Math.hypot(x - ax - t * dx, z - az - t * dz) <= tol) return true;
  }
  return false;
}

/**
 * Dry Feet: walk the boardwalk on foot from one end to the other without stepping off. step() returns true once, on the
 * frame the walk completes (reaching within 3 m of the far end after starting within 3 m of the other end).
 */
export function createBoardwalkWalk(): { step(x: number, z: number, onFoot: boolean): boolean } {
  const a = BOARDWALK[0], b = BOARDWALK[BOARDWALK.length - 1];
  let from: 'a' | 'b' | null = null;
  return {
    step(x, z, onFoot) {
      if (!onFoot || !onBoardwalk(x, z)) { from = null; return false; }
      const nearA = Math.hypot(x - a[0], z - a[1]) <= 3, nearB = Math.hypot(x - b[0], z - b[1]) <= 3;
      if (from === null) { if (nearA) from = 'a'; else if (nearB) from = 'b'; return false; }
      if ((from === 'a' && nearB) || (from === 'b' && nearA)) { from = null; return true; }
      return false;
    },
  };
}
