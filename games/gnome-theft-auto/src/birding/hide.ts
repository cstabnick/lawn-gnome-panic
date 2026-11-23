// Birding: the Reedwatch Hide on Loch Moss (HIDE in types.ts): a wooden bird hide facing the loch, a sign, a feeder,
// and Dunnock Pell the keeper by the back door. World only; the counter tab is journalUi.ts.
import type * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { critterMesh } from '../critters';
import { makeGnome, gnomeState } from '../gnomes';
import { heightAt } from '../terrain';
import type { Blip, Box } from '../types';
import { HIDE } from './types';

export interface HideWorld {
  readonly boxes: readonly Box[];
  readonly blip: Blip;
  /** Where the player stands to talk to the keeper. */
  readonly counter: { x: number; z: number };
  nearCounter(px: number, pz: number): boolean;
  /** Every frame: the keeper turns toward a nearby player. */
  update(dt: number, px: number, pz: number): void;
}

/** Dunnock Pell's fixed look (the hide keeper). */
const DUNNOCK_LOOK = {
  hat: 0x2f6b5e,
  shirt: 0x8a7a52,
  pants: 0x4a4a3a,
  skin: 0xd9a066,
  boots: 0x2a2a2a,
  beard: 0xd8d8d0,
  hair: null,
  freckles: false,
  dress: false,
  glasses: true,
  bowlCut: null,
};

/** Offsets from the hide centre, in world units. The hide's front (the slot) faces -z; its door is on +z. */
const KEEPER = { dx: 1.2, dz: 3.6 };
const COUNTER = { dx: 1.2, dz: 4.4 };
const SPOT = { dx: 1.2, dz: 5.2 };
const SIGN = { dx: -4.5, dz: 3.5 };
const FEEDER = { dx: 5, dz: 2.5 };

interface PlacedProp {
  id: string;
  x: number;
  z: number;
}

/** Every placed thing at the hide with its world (x, z): hide.test.ts checks them. */
export const HIDE_PROPS: readonly PlacedProp[] = [
  { id: 'hide', x: HIDE.x, z: HIDE.z },
  { id: 'keeper', x: HIDE.x + KEEPER.dx, z: HIDE.z + KEEPER.dz },
  { id: 'counter', x: HIDE.x + COUNTER.dx, z: HIDE.z + COUNTER.dz },
  { id: 'sign', x: HIDE.x + SIGN.dx, z: HIDE.z + SIGN.dz },
  { id: 'feeder', x: HIDE.x + FEEDER.dx, z: HIDE.z + FEEDER.dz },
];

function boxAt(cx: number, cz: number, halfX: number, halfZ: number, h: number, y0: number): Box {
  return { minX: cx - halfX, maxX: cx + halfX, minZ: cz - halfZ, maxZ: cz + halfZ, h: y0 + h };
}

/** A prop mesh on the ground at (x, z). A prop that fails to build is skipped, so the game still runs. */
function placeProp(scene: THREE.Scene, id: string, scale: number, x: number, z: number, yaw = 0): void {
  try {
    const mesh = critterMesh(id, scale);
    mesh.position.set(x, heightAt(x, z), z);
    mesh.rotation.y = yaw;
    scene.add(mesh);
  } catch (err) {
    console.warn(`birding: could not build ${id}`, err);
  }
}

function at(id: string): PlacedProp {
  const p = HIDE_PROPS.find((q) => q.id === id);
  if (!p) throw new Error(`hide: no prop ${id}`);
  return p;
}

export function createHide(scene: THREE.Scene): HideWorld {
  const y0 = heightAt(HIDE.x, HIDE.z);
  const counter = { x: HIDE.x + SPOT.dx, z: HIDE.z + SPOT.dz };
  const keeperProp = at('keeper');
  const counterProp = at('counter');
  const signProp = at('sign');
  const feederProp = at('feeder');

  // The hide itself, turned to face the loch.
  placeProp(scene, 'reedwatch-hide', HIDE.scale, HIDE.x, HIDE.z, HIDE.yaw);
  placeProp(scene, 'counter', 1.4, counterProp.x, counterProp.z);
  placeProp(scene, 'reedwatch-sign', 1.5, signProp.x, signProp.z);
  placeProp(scene, 'bird-feeder', 1.5, feederProp.x, feederProp.z);

  // Dunnock behind the counter, facing the player's spot.
  const keeperY = heightAt(keeperProp.x, keeperProp.z);
  const keeper: GnomeModel = makeGnome(scene, DUNNOCK_LOOK);
  keeper.update(gnomeState(keeperProp.x, keeperY, keeperProp.z, 0, 0), 1);

  const boxes: Box[] = [
    boxAt(HIDE.x, HIDE.z, 3.9, 2.6, 4.2, y0),
    boxAt(counterProp.x, counterProp.z, 1.2, 0.4, 1.2, heightAt(counterProp.x, counterProp.z)),
    boxAt(signProp.x, signProp.z, 0.15, 0.15, 1.6, heightAt(signProp.x, signProp.z)),
    boxAt(feederProp.x, feederProp.z, 0.15, 0.15, 1.6, heightAt(feederProp.x, feederProp.z)),
  ];

  let yaw = 0;

  return {
    boxes,
    blip: { x: HIDE.x, z: HIDE.z, color: HIDE.blip, kind: 'shop', label: 'Reedwatch Hide' },
    counter,
    nearCounter: (px, pz) => Math.hypot(px - counter.x, pz - counter.z) < 3,
    update(dt, px, pz) {
      const near = Math.hypot(px - keeperProp.x, pz - keeperProp.z) <= 12;
      const targetYaw = near ? Math.atan2(px - keeperProp.x, pz - keeperProp.z) : 0;
      let diff = targetYaw - yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      yaw += diff * Math.min(1, 5 * dt);
      keeper.update(gnomeState(keeperProp.x, keeperY, keeperProp.z, yaw, 0), dt);
    },
  };
}
