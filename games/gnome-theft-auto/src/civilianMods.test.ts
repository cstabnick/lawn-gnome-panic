// Civilian mods (L91): deterministic per car, about 15% of ground cars, 1-2 valid cosmetic mods, never boats or aircraft.
import { describe, expect, it } from 'vitest';
import {
  EXHAUST_IDS, FINISH_IDS, LAMP_IDS, MIRROR_IDS, ORNAMENT_IDS, RIM_IDS, SPOILER_IDS, TYRE_IDS, type Loadout,
} from '@lawn/glaze';
import { CIV_MODS, CIV_RIM_COLORS, rollCivilianMods } from './civilianMods';

const MOD_KEYS = ['finish', 'tyre', 'rim', 'lamp', 'spoiler', 'ornament', 'mirror', 'exhaust'] as const;
const FORBIDDEN_KEYS = ['wheelSize', 'camberFront', 'camberRear', 'rideHeight', 'extras'] as const;

/** Whether `value` is one of the ids on a glaze shelf. */
const onShelf = (list: readonly string[], value: unknown): boolean => typeof value === 'string' && list.includes(value);

describe('rollCivilianMods', () => {
  it('is deterministic for the same (id, kind)', () => {
    for (let id = 1; id <= 200; id++) {
      expect(rollCivilianMods(id, 'ride-on')).toEqual(rollCivilianMods(id, 'ride-on'));
    }
  });

  it('gives about 15% of ride-on mowers a mod, within 0.10..0.20 over ids 1..2000', () => {
    let modded = 0;
    for (let id = 1; id <= 2000; id++) {
      if (rollCivilianMods(id, 'ride-on') !== null) modded++;
    }
    const share = modded / 2000;
    expect(share).toBeGreaterThanOrEqual(0.1);
    expect(share).toBeLessThanOrEqual(0.2);
    expect(CIV_MODS.chance).toBe(0.15);
  });

  it('gives every modded car 1-2 mod slots, with valid shelf ids and no forbidden fields', () => {
    const shelves: Partial<Record<(typeof MOD_KEYS)[number], readonly string[]>> = {
      finish: FINISH_IDS, tyre: TYRE_IDS, rim: RIM_IDS, lamp: LAMP_IDS,
      spoiler: SPOILER_IDS, ornament: ORNAMENT_IDS, mirror: MIRROR_IDS, exhaust: EXHAUST_IDS,
    };
    const stockOnly: Partial<Record<(typeof MOD_KEYS)[number], string>> = {
      finish: 'gloss', tyre: 'stock', rim: 'stock', lamp: 'stock',
    };
    let checked = 0;
    for (let id = 1; id <= 2000; id++) {
      const mods = rollCivilianMods(id, 'ride-on') as Partial<Loadout> | null;
      if (!mods) continue;
      checked++;

      const slots = Object.keys(mods).filter((k) => k !== 'rimColor');
      expect(slots.length).toBeGreaterThanOrEqual(1);
      expect(slots.length).toBeLessThanOrEqual(CIV_MODS.maxMods);
      expect(new Set(slots).size).toBe(slots.length);

      for (const key of Object.keys(mods)) {
        expect(FORBIDDEN_KEYS as readonly string[]).not.toContain(key);
        if (key === 'rimColor') {
          expect(CIV_RIM_COLORS as readonly number[]).toContain(mods.rimColor);
          continue;
        }
        const value = mods[key as keyof Loadout];
        expect(onShelf(shelves[key as (typeof MOD_KEYS)[number]] ?? [], value)).toBe(true);
        const stock = stockOnly[key as keyof typeof stockOnly];
        if (stock !== undefined) expect(value).not.toBe(stock);
      }
      if (mods.rim !== undefined) expect(mods.rimColor).toBeDefined();
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('never gives boats or aircraft a mod', () => {
    for (let id = 1; id <= 500; id++) {
      expect(rollCivilianMods(id, 'walnut-dinghy')).toBeNull();
      expect(rollCivilianMods(id, 'plane')).toBeNull();
    }
  });
});
