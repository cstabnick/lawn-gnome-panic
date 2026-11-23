// Fishing: The Bent Pin bait & tackle in the world (SHOP in types.ts): the shack, its sign, a rod rack, the counter and
// Wenna Gudgeon behind it. World only; the sheet is shopUi.ts.
import type * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { critterMesh } from '../critters';
import { makeGnome, gnomeState } from '../gnomes';
import { heightAt } from '../terrain';
import type { Blip, Box } from '../types';
import { SHOP } from './types';

export interface ShopWorld {
  /** Collision boxes in world coordinates (fishing.ts pushes them into world.boxes once). */
  readonly boxes: readonly Box[];
  readonly blip: Blip;
  /** Where the player stands to talk to Wenna. */
  readonly counter: { x: number; z: number };
  /** True when (px, pz) is within 3 units of the counter point. */
  nearCounter(px: number, pz: number): boolean;
  /** Every frame: Wenna turns toward the player when within 12 units (does nothing farther than 40). */
  update(dt: number, px: number, pz: number): void;
}

export interface PlacedProp {
  id: string;
  x: number;
  z: number;
}

/** Wenna Gudgeon's fixed look: oilskin-yellow coat, teal hat, auburn pigtails. */
const WENNA_LOOK = {
  hat: 0x2f6f8f,
  shirt: 0xe8d36a,
  pants: 0x3b4a5a,
  skin: 0xd9a066,
  boots: 0x222222,
  beard: null,
  hair: { color: 0x8a5a2b, style: 'pigtails' as const },
  freckles: false,
  dress: false,
  glasses: false,
  bowlCut: null,
};

/** Offsets from the shack centre, in world units (the front is -z, toward the canal). */
const COUNTER_DZ = -4.2;
const WENNA_DZ = -3.3;
const SIGN = { dx: 4.5, dz: -4 };
const RACK = { dx: -4.2, dz: -2.5 };
const COOLER = { dx: 3.2, dz: -2 };
const COUNTER_SPOT_DZ = -6; // the player's spot, in front of the counter

/** Every placed thing at the shop with its world (x, z): checked by shop.test.ts against roads, water and region. */
export const SHOP_PROPS: readonly PlacedProp[] = [
  { id: 'shack', x: SHOP.x, z: SHOP.z },
  { id: 'counter', x: SHOP.x, z: SHOP.z + COUNTER_DZ },
  { id: 'wenna', x: SHOP.x, z: SHOP.z + WENNA_DZ },
  { id: 'sign', x: SHOP.x + SIGN.dx, z: SHOP.z + SIGN.dz },
  { id: 'rack', x: SHOP.x + RACK.dx, z: SHOP.z + RACK.dz },
  { id: 'cooler', x: SHOP.x + COOLER.dx, z: SHOP.z + COOLER.dz },
];

function boxAt(cx: number, cz: number, halfX: number, halfZ: number, h: number, y0: number): Box {
  return { minX: cx - halfX, maxX: cx + halfX, minZ: cz - halfZ, maxZ: cz + halfZ, h: y0 + h };
}

function at(id: string): PlacedProp {
  const p = SHOP_PROPS.find((q) => q.id === id);
  if (!p) throw new Error(`shop: no prop ${id}`);
  return p;
}

export function createShop(scene: THREE.Scene): ShopWorld {
  const shackY = heightAt(SHOP.x, SHOP.z);

  // Shack: its front faces -z (SHOP.yaw = PI).
  const shack = critterMesh('bent-pin-shack', 1);
  shack.position.set(SHOP.x, shackY, SHOP.z);
  shack.rotation.y = SHOP.yaw;
  scene.add(shack);

  // Counter, with its own box.
  const counterProp = at('counter');
  const counterY = heightAt(counterProp.x, counterProp.z);
  const counterMesh = critterMesh('counter', 1.4);
  counterMesh.position.set(counterProp.x, counterY, counterProp.z);
  counterMesh.rotation.y = SHOP.yaw;
  scene.add(counterMesh);

  // Hanging sign beside the front-right corner.
  const signProp = at('sign');
  const signMesh = critterMesh('bent-pin-sign', 1.3);
  signMesh.position.set(signProp.x, heightAt(signProp.x, signProp.z), signProp.z);
  scene.add(signMesh);

  // Rod rack and bait cooler on the shack's sides.
  const rackProp = at('rack');
  const rackMesh = critterMesh('fish-rod-rack', 1.2);
  rackMesh.position.set(rackProp.x, heightAt(rackProp.x, rackProp.z), rackProp.z);
  scene.add(rackMesh);

  const coolerProp = at('cooler');
  const coolerMesh = critterMesh('bait-cooler', 1.1);
  coolerMesh.position.set(coolerProp.x, heightAt(coolerProp.x, coolerProp.z), coolerProp.z);
  scene.add(coolerMesh);

  // Wenna behind the counter.
  const wennaProp = at('wenna');
  const wennaY = heightAt(wennaProp.x, wennaProp.z);
  const wenna: GnomeModel = makeGnome(scene, WENNA_LOOK);
  wenna.update(gnomeState(wennaProp.x, wennaY, wennaProp.z, SHOP.yaw, 0), 1);

  const boxes: Box[] = [
    boxAt(SHOP.x, SHOP.z, 3.2, 2.6, 3.5, shackY),
    boxAt(counterProp.x, counterProp.z, 1.2, 0.4, 1.2, counterY),
    boxAt(rackProp.x, rackProp.z, 0.4, 0.4, 1.2, heightAt(rackProp.x, rackProp.z)),
    boxAt(coolerProp.x, coolerProp.z, 0.4, 0.4, 1.1, heightAt(coolerProp.x, coolerProp.z)),
  ];

  const counter = { x: SHOP.x, z: SHOP.z + COUNTER_SPOT_DZ };
  let yaw = SHOP.yaw;

  return {
    boxes,
    blip: { x: SHOP.x, z: SHOP.z, color: SHOP.blip, kind: 'shop', label: SHOP.name },
    counter,
    nearCounter: (px, pz) => Math.hypot(px - counter.x, pz - counter.z) < 3,
    update(dt, px, pz) {
      const dist = Math.hypot(px - wennaProp.x, pz - wennaProp.z);
      if (dist > 40) return; // far away: no work at all
      const near = dist <= 12;
      const targetYaw = near ? Math.atan2(px - wennaProp.x, pz - wennaProp.z) : SHOP.yaw;
      let diff = targetYaw - yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      yaw += diff * Math.min(1, 5 * dt);
      wenna.update(gnomeState(wennaProp.x, wennaY, wennaProp.z, yaw, 0), dt);
    },
  };
}
