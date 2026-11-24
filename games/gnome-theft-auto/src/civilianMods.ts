// Civilian cars with a mod or two (L91): about one traffic car in seven gets 1-2 cosmetic Pay 'n' Glaze mods (paint
// finish, tyre, rim, lamp, spoiler, ornament, mirror, exhaust). The roll is seeded from the vehicle id, so the same car
// always gets the same mods. Cosmetic only: never touches handling.
// STUB: filled by issue E02 1-7.
import type { Loadout } from '@lawn/glaze';
import type { VehicleKind } from './types';

/** Share of civilian cars that get mods, and how many mods at most. */
export const CIV_MODS = { chance: 0.15, maxMods: 2 } as const;

/**
 * The mods for civilian car `id` of `kind`, as a partial Loadout to merge over the car's stock look (the caller passes
 * `{ ...v.look, ...mods }` to setVehicleLook), or null for a stock car. Pure and deterministic: the same (id, kind) gives
 * the same answer every call. Kinds that are not dressed (no glaze rig), boats and aircraft get null.
 */
export function rollCivilianMods(_id: number, _kind: VehicleKind): Partial<Loadout> | null {
  return null;
}
