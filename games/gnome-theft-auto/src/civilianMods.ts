// Civilian cars with a mod or two (L91): about one traffic car in seven gets 1-2 cosmetic Pay 'n' Glaze mods (paint
// finish, tyre, rim, lamp, spoiler, ornament, mirror, exhaust). The roll is seeded from the vehicle id, so the same car
// always gets the same mods. Cosmetic only: never touches handling.
import {
  EXHAUST_IDS, FINISH_IDS, LAMP_IDS, MIRROR_IDS, ORNAMENT_IDS, RIM_IDS, SPOILER_IDS, TYRE_IDS, type Loadout,
} from '@lawn/glaze';
import type { VehicleKind } from './types';
import { VEHICLES } from './config';
import { GLAZE_KINDS } from './glazeStore';

/** Share of civilian cars that get mods, and how many mods at most. */
export const CIV_MODS = { chance: 0.15, maxMods: 2 } as const;

/** Rim paints a modded rim can take, 0xRRGGBB. */
export const CIV_RIM_COLORS = [0xe03c31, 0x2f6fde, 0xf2c230, 0x3cb371] as const;

/** The mod slots a civilian car can take. A rim's colour counts as part of the rim slot. */
const SLOTS = ['finish', 'tyre', 'rim', 'lamp', 'spoiler', 'ornament', 'mirror', 'exhaust'] as const;

/** Deterministic 32-bit PRNG (mulberry32): the same seed always gives the same sequence of values in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 32-bit string hash (FNV-1a), so each vehicle kind rolls its own sequence for the same id. */
function hashKind(kind: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < kind.length; i++) {
    h ^= kind.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Whether a kind takes a Pay 'n' Glaze rig. Same rule as vehicles.ts `dressed`, which is not exported; keep the two in step. */
function isDressed(kind: VehicleKind): boolean {
  return GLAZE_KINDS.includes(kind);
}

/** Pick one element of a non-empty list. */
function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

/**
 * The mods for civilian car `id` of `kind`, as a partial Loadout to merge over the car's stock look (the caller passes
 * `{ ...v.look, ...mods }` to setVehicleLook), or null for a stock car. Pure and deterministic: the same (id, kind) gives
 * the same answer every call. Kinds that are not dressed (no glaze rig), boats and aircraft get null.
 */
export function rollCivilianMods(id: number, kind: VehicleKind): Partial<Loadout> | null {
  const spec = VEHICLES[kind];
  if (!spec || spec.boat || spec.flies || spec.air || !isDressed(kind)) return null;

  const rng = mulberry32((Math.imul(id, 2654435761) ^ hashKind(kind)) >>> 0);
  if (rng() >= CIV_MODS.chance) return null;

  // Shuffle the slots (partial Fisher-Yates) and take the first 1 or 2.
  const slots = [...SLOTS];
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const count = 1 + Math.floor(rng() * CIV_MODS.maxMods);

  const out: Partial<Loadout> = {};
  for (const slot of slots.slice(0, count)) {
    switch (slot) {
      case 'finish':
        out.finish = pick(rng, FINISH_IDS.filter((f) => f !== 'gloss'));
        break;
      case 'tyre':
        out.tyre = pick(rng, TYRE_IDS.filter((t) => t !== 'stock'));
        break;
      case 'rim':
        out.rim = pick(rng, RIM_IDS.filter((r) => r !== 'stock'));
        out.rimColor = pick(rng, CIV_RIM_COLORS);
        break;
      case 'lamp':
        out.lamp = pick(rng, LAMP_IDS.filter((l) => l !== 'stock'));
        break;
      case 'spoiler':
        out.spoiler = pick(rng, SPOILER_IDS);
        break;
      case 'ornament':
        out.ornament = pick(rng, ORNAMENT_IDS);
        break;
      case 'mirror':
        out.mirror = pick(rng, MIRROR_IDS);
        break;
      case 'exhaust':
        out.exhaust = pick(rng, EXHAUST_IDS);
        break;
    }
  }
  return out;
}
