// The interior registry (E05): defineInterior and the pocket allocator. Pure (no three.js objects, no DOM), so quests,
// tests and the quest simulator can ask where an interior is. The runtime (runtime.ts) builds and enters them.
//
// Pockets: interior n (in definition order) is centred at (5100 + (n % 8) * 200, 0, 5100 + floor(n / 8) * 200), room up
// to 180 x 180. A large interior (w or d > 180, up to 600) is centred at (5350 + (k % 4) * 700, 0, 12350 + floor(k / 4) * 700).
// Everything is at x >= 5000 (interior space, space.ts). Ids are what saves, quests and online use; pockets may move.
import { INTERIOR_MIN_X } from './space';
import type { InteriorDef, InteriorTheme, InteriorThemeId } from './types';

export const INTERIOR_THEMES: Record<InteriorThemeId, InteriorTheme> = {
  shop: { floor: 0x6b5a45, wall: 0xd8c9a3, trim: 0x2e7d32, ceiling: 0xe8e0cc, light: 0xfff0d0 },
  club: { floor: 0x2a1810, wall: 0x4a1218, trim: 0xc9a227, ceiling: 0x1a0a0c, light: 0xffc27a },
  flat: { floor: 0x8a6a4a, wall: 0xe6dccb, trim: 0x8d6e63, ceiling: 0xf2ede2, light: 0xfff4e0 },
  office: { floor: 0x9e9a8f, wall: 0xd9cfb8, trim: 0x6d6a60, ceiling: 0xefece4, light: 0xf4f1e6 },
  burrow: { floor: 0x4a3324, wall: 0x5e4030, trim: 0x8d6e4a, ceiling: 0x3a281c, light: 0xffd59a },
};

/** Largest room side of a normal pocket, and of a large one. */
export const POCKET_MAX = 180;
export const LARGE_POCKET_MAX = 600;
/** Pocket pitch (centre to centre) for normal and large pockets. */
export const POCKET_STEP = 200;
export const LARGE_POCKET_STEP = 700;

export interface PlacedInterior {
  def: InteriorDef;
  /** World centre of the room on the floor (local 0, 0). */
  origin: { x: number; y: number; z: number };
  large: boolean;
  theme: InteriorTheme;
}

const placed = new Map<string, PlacedInterior>();
let normalCount = 0;
let largeCount = 0;
const listeners: ((p: PlacedInterior) => void)[] = [];

/** The world centre of normal pocket n / large pocket k. */
export function pocketOrigin(n: number, large = false): { x: number; y: number; z: number } {
  if (large) return { x: INTERIOR_MIN_X + 350 + (n % 4) * LARGE_POCKET_STEP, y: 0, z: 12350 + Math.floor(n / 4) * LARGE_POCKET_STEP };
  return { x: INTERIOR_MIN_X + 100 + (n % 8) * POCKET_STEP, y: 0, z: 5100 + Math.floor(n / 8) * POCKET_STEP };
}

export function themeOf(t: InteriorThemeId | InteriorTheme): InteriorTheme {
  return typeof t === 'string' ? INTERIOR_THEMES[t] : t;
}

/**
 * Register an interior (at import time is fine). Throws on a duplicate id or a room too big for any pocket.
 * Returns where it was put.
 */
export function defineInterior(def: InteriorDef): PlacedInterior {
  if (placed.has(def.id)) throw new Error(`defineInterior: duplicate id ${def.id}`);
  const { w, d, h } = def.size;
  if (!(w > 0 && d > 0 && h > 0)) throw new Error(`defineInterior ${def.id}: bad size`);
  if (w > LARGE_POCKET_MAX || d > LARGE_POCKET_MAX) throw new Error(`defineInterior ${def.id}: larger than ${LARGE_POCKET_MAX} m`);
  const large = w > POCKET_MAX || d > POCKET_MAX;
  const origin = large ? pocketOrigin(largeCount++, true) : pocketOrigin(normalCount++);
  const p: PlacedInterior = { def, origin, large, theme: themeOf(def.theme) };
  placed.set(def.id, p);
  for (const cb of listeners) cb(p);
  return p;
}

export function interiorById(id: string): PlacedInterior | undefined {
  return placed.get(id);
}

export function listInteriors(): PlacedInterior[] {
  return [...placed.values()];
}

/** Calls cb for every interior defined so far and every one defined later. Returns an unsubscribe. */
export function onInteriorDefined(cb: (p: PlacedInterior) => void): () => void {
  for (const p of placed.values()) cb(p);
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

/** Local (metres from the room centre) to world coordinates. Throws for an unknown id. */
export function interiorToWorld(id: string, lx: number, lz: number): [number, number] {
  const p = placed.get(id);
  if (!p) throw new Error(`interiorToWorld: unknown interior ${id}`);
  return [p.origin.x + lx, p.origin.z + lz];
}

/** The interior whose pocket holds world point (x, z), or null. */
export function interiorAt(x: number, z: number): PlacedInterior | null {
  if (x < INTERIOR_MIN_X) return null;
  for (const p of placed.values()) {
    const half = (p.large ? LARGE_POCKET_STEP : POCKET_STEP) / 2;
    if (Math.abs(x - p.origin.x) <= half && Math.abs(z - p.origin.z) <= half) return p;
  }
  return null;
}

/** Tests only: forget every interior. */
export function resetInteriorsForTest(): void {
  placed.clear();
  normalCount = 0;
  largeCount = 0;
  listeners.length = 0;
}
