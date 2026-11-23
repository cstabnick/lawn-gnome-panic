import { describe, expect, it } from 'vitest';
import { GUNS, GUN_ORDER } from './config';
import {
  AIM, GUN_MODS, MOD_SLOTS, aimZoom, decodeGunLoadout, decodeGunWire, encodeGunLoadout, encodeGunWire, getMod,
  loadoutCost, moddedGun, modsFor, normalizeGunLoadout, slotsFor, stepAim,
} from './gunMods';
import { buyMods, fitLoadout, fittedLoadout, gunModStorageForTest, ownedMods } from './gunModStore';

describe('gun mod catalogue', () => {
  it('has unique ids, a known slot, a price and at least one gun each', () => {
    const ids = new Set<string>();
    for (const m of GUN_MODS) {
      expect(ids.has(m.id), m.id).toBe(false);
      ids.add(m.id);
      expect(MOD_SLOTS).toContain(m.slot);
      expect(m.price).toBeGreaterThan(0);
      expect(m.guns.length).toBeGreaterThan(0);
      for (const g of m.guns) expect(GUN_ORDER).toContain(g);
      if (m.slot === 'finish') expect(m.finish).toBeDefined();
      else expect(m.prefab, m.id).toMatch(/^gunmod-/);
    }
  });
  it('gives every weapon a finish and a charm, and every firearm an optic, muzzle and mag', () => {
    for (const g of GUN_ORDER) {
      expect(modsFor(g, 'finish').length).toBeGreaterThan(0);
      expect(modsFor(g, 'charm').length).toBeGreaterThan(0);
    }
    for (const g of ['pistol', 'smg', 'shotgun', 'rifle'] as const) {
      for (const s of ['optic', 'muzzle', 'mag'] as const) expect(slotsFor(g)).toContain(s);
    }
  });
});

describe('moddedGun', () => {
  it('is the stock spec with no mods', () => {
    const m = moddedGun('rifle', {});
    expect(m.rate).toBe(GUNS.rifle.rate);
    expect(m.mag).toBe(GUNS.rifle.mag);
    expect(m.damage).toBe(1);
    expect(m.zoom).toBe(1);
    expect(m.sound).toBe('stock');
  });
  it('multiplies the stats and takes the muzzle sound over the barrel sound', () => {
    const m = moddedGun('rifle', { optic: 'long-scope', mag: 'drum-mag', muzzle: 'suppressor', barrel: 'heavy-barrel' });
    expect(m.mag).toBe(Math.round(GUNS.rifle.mag * 2.5));
    expect(m.zoom).toBeCloseTo(2.6);
    expect(m.damage).toBeCloseTo(1.35);
    expect(m.sound).toBe('suppressed');
    expect(moddedGun('rifle', { barrel: 'heavy-barrel' }).sound).toBe('heavy');
  });
  it('ignores mods that do not fit the gun or sit in the wrong slot', () => {
    expect(normalizeGunLoadout('pistol', { optic: 'long-scope', muzzle: 'red-dot', mag: 'extended-mag' })).toEqual({ mag: 'extended-mag' });
    expect(moddedGun('leaf-blower', { mag: 'drum-mag' }).mag).toBe(GUNS['leaf-blower'].mag);
  });
});

describe('codes', () => {
  it('round-trips a loadout and the wire code', () => {
    const l = { optic: 'holo', muzzle: 'kazoo', finish: 'firefly-glow', charm: 'charm-gnome' };
    const code = encodeGunLoadout(l);
    expect(code).toMatch(/^[a-z0-9]*$/);
    expect(decodeGunLoadout(code)).toEqual(l);
    expect(decodeGunWire(encodeGunWire('smg', l))).toEqual({ gun: 'smg', loadout: l });
    expect(decodeGunWire('99-o0')).toBeNull();
    expect(decodeGunWire('bad')).toBeNull();
    expect(decodeGunLoadout('zz')).toEqual({});
  });
  it('prices only the mods not owned', () => {
    expect(loadoutCost(new Set(['holo']), { optic: 'holo', muzzle: 'kazoo' })).toBe(getMod('kazoo')!.price);
  });
});

describe('aim', () => {
  it('blends in and out at the blend rate and zooms to AIM.zoom times the optic', () => {
    expect(stepAim(0, true, 1)).toBe(1);
    expect(stepAim(1, false, 1 / AIM.blendRate / 2)).toBeCloseTo(0.5);
    const g = moddedGun('rifle', { optic: 'long-scope' });
    expect(aimZoom(g, 0)).toBe(1);
    expect(aimZoom(g, 1)).toBeCloseTo(AIM.zoom * 2.6);
  });
});

describe('gunModStore', () => {
  it('keeps owned and fitted mods per gun, drops unowned ones, and survives a reload', () => {
    const mem = new Map<string, string>();
    const s = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
    gunModStorageForTest(s);
    buyMods('pistol', ['red-dot', 'long-scope']);
    expect([...ownedMods('pistol')]).toEqual(['red-dot']);
    fitLoadout('pistol', { optic: 'red-dot', muzzle: 'kazoo' });
    expect(fittedLoadout('pistol')).toEqual({ optic: 'red-dot' });
    gunModStorageForTest(s);
    expect(fittedLoadout('pistol')).toEqual({ optic: 'red-dot' });
    s.setItem('gta-gunmods-v1', '{nope');
    gunModStorageForTest(s);
    expect(fittedLoadout('pistol')).toEqual({});
    gunModStorageForTest(null);
  });
});
