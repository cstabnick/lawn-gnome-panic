// The held gun with its Ammu-Gnation mods bolted on: a small "loadout on a prefab" helper, like @lawn/glaze's attachLoadout
// for vehicles. Each mod is its own @lawn/prefabs part placed at one of the gun's mount points; the finish re-glazes the
// gun's own parts. STUB: the gun-rig issue fills this in; the signature is final.
import * as THREE from 'three';
import { buildHeld } from '@lawn/prefabs';
import { GUNS } from './config';
import type { GunLoadout } from './gunMods';
import type { GunKind } from './types';

/**
 * Build `gun` as buildHeld does (a holder group, grip at the origin, muzzle toward +y) with every mod of `loadout` bolted on
 * and its finish applied. Mods whose prefab is missing, or that do not fit the gun, are skipped; it never throws for a mod.
 * `opts.scale` scales the whole holder (the shop's display gun is drawn big).
 */
export function buildModdedGun(gun: GunKind, loadout: GunLoadout, opts: { scale?: number } = {}): THREE.Group {
  void loadout;
  return buildHeld(GUNS[gun].prefab, { scale: opts.scale });
}
