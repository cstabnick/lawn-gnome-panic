// Guns: STUB (issue 1C fills it in). Real guns with hitscan bullets from the crosshair; see Weapons in types.ts.
import * as THREE from 'three';
import { GUNS, GUN_ORDER } from './config';
import type { Fx, Weapons } from './types';

export function createWeapons(_scene: THREE.Scene, _fx: Fx): Weapons {
  const w: Weapons = {
    gun: 'pistol',
    ammo: GUNS.pistol.mag,
    mag: GUNS.pistol.mag,
    reloading: false,
    attachTo() {},
    setVisible() {},
    switchGun() {
      w.gun = GUN_ORDER[(GUN_ORDER.indexOf(w.gun) + 1) % GUN_ORDER.length];
      w.mag = GUNS[w.gun].mag;
      w.ammo = w.mag;
    },
    reload() {},
    update() { return 0; },
  };
  return w;
}
