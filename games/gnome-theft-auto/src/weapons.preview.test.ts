import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GUN_ORDER } from './config';
import { moddedGun } from './gunMods';
import { createWeapons } from './weapons';
import type { Fx } from './types';

// A Fx whose every method is a no-op: the preview does not draw effects.
const fx = new Proxy({}, { get: () => () => undefined }) as Fx;

function setup() {
  return createWeapons(new THREE.Scene(), fx);
}

describe('previewLoadout', () => {
  it('shows mods on the held gun without changing its stats', () => {
    const weapons = setup();
    weapons.previewLoadout!('pistol', { muzzle: 'suppressor' });
    expect(weapons.spec().rate).toBe(moddedGun('pistol', {}).rate);
    expect(weapons.spec().mag).toBe(moddedGun('pistol', {}).mag);
    expect(weapons.loadoutOf('pistol')).toEqual({});
  });

  it('a null preview puts the fitted mods back without throwing', () => {
    const weapons = setup();
    weapons.previewLoadout!('pistol', { muzzle: 'suppressor' });
    expect(() => weapons.previewLoadout!('pistol', null)).not.toThrow();
    expect(weapons.loadoutOf('pistol')).toEqual({});
  });
});

describe('ammoOf', () => {
  it('reports each gun its own magazine, held or not', () => {
    const weapons = setup();
    for (const kind of GUN_ORDER) {
      expect(weapons.ammoOf!(kind)).toBe(moddedGun(kind, {}).mag);
    }
    weapons.selectGun('shotgun');
    expect(weapons.ammoOf!('shotgun')).toBe(weapons.ammo);
    expect(weapons.ammoOf!('shotgun')).toBe(moddedGun('shotgun', {}).mag);
  });
});
