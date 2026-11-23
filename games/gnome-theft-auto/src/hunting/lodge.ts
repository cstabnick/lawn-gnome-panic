// Tuft hunting: the Tuft & Tally Lodge in Mossy Wood (LODGE in species.ts): a log cabin, its sign, two tuft drying
// racks, a counter, and Hazel Mattock the lodge-keeper standing behind it. World only; the sheet is lodgeUi.ts.
import type * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { critterMesh } from '../critters';
import { makeGnome, gnomeState } from '../gnomes';
import { heightAt } from '../terrain';
import type { Blip, Box } from '../types';
import { LODGE } from './species';

export interface LodgeWorld {
  /** Collision boxes in world coordinates (hunting.ts pushes them into world.boxes once). */
  readonly boxes: readonly Box[];
  readonly blip: Blip;
  /** Where the player stands to talk to Hazel. */
  readonly counter: { x: number; z: number };
  /** True when (px, pz) is within 3 units of the counter point. */
  nearCounter(px: number, pz: number): boolean;
  /** Every frame: Hazel's idle animation, turning toward the player when near. */
  update(dt: number, px: number, pz: number): void;
}

/** Hazel's fixed look (the lodge-keeper). */
const HAZEL_LOOK = {
  hat: 0x3f6b2e,
  shirt: 0x6b4a2e,
  pants: 0x4b3a2a,
  skin: 0xe0ac69,
  boots: 0x222222,
  beard: null,
  hair: { color: 0xc0c0c0, style: 'pigtails' as const },
  freckles: true,
  dress: false,
  glasses: true,
  bowlCut: null,
};

/** Offsets from the cabin centre, in world units (the cabin faces +z; +z is out front). */
const COUNTER_Z = 3.4 + 2; // counter sits just in front of the cabin's front wall
const HAZEL_Z = 4.6; // Hazel stands behind the counter
const SPOT_Z = COUNTER_Z + 1.8; // the player's spot, in front of the counter
const SIGN = { dx: -5.5, dz: 3.8 };
const RACK_X = 7;
const RACK_Z = 1;

interface PlacedProp {
  id: string;
  x: number;
  z: number;
}

/** Every placed thing at the lodge with its world (x, z): checked by lodge.test.ts against the roads and region. */
export const LODGE_PROPS: readonly PlacedProp[] = [
  { id: 'cabin', x: LODGE.x, z: LODGE.z },
  { id: 'counter', x: LODGE.x, z: LODGE.z + COUNTER_Z },
  { id: 'hazel', x: LODGE.x, z: LODGE.z + HAZEL_Z },
  { id: 'sign', x: LODGE.x + SIGN.dx, z: LODGE.z + SIGN.dz },
  { id: 'rack-l', x: LODGE.x - RACK_X, z: LODGE.z + RACK_Z },
  { id: 'rack-r', x: LODGE.x + RACK_X, z: LODGE.z + RACK_Z },
];

function boxAt(cx: number, cz: number, halfX: number, halfZ: number, h: number, y0: number): Box {
  return { minX: cx - halfX, maxX: cx + halfX, minZ: cz - halfZ, maxZ: cz + halfZ, h: y0 + h };
}

export function createLodge(scene: THREE.Scene): LodgeWorld {
  const y0 = heightAt(LODGE.x, LODGE.z);
  const counter = { x: LODGE.x, z: LODGE.z + SPOT_Z };
  const at = (id: string) => {
    const p = LODGE_PROPS.find((q) => q.id === id);
    if (!p) throw new Error(`lodge: no prop ${id}`);
    return p;
  };

  // Cabin: its front faces +z (LODGE.yaw = 0).
  const cabin = critterMesh('log-cabin', LODGE.scale);
  cabin.position.set(LODGE.x, y0, LODGE.z);
  cabin.rotation.y = LODGE.yaw;
  scene.add(cabin);

  // Counter, with its own box.
  const counterProp = at('counter');
  const counterY = heightAt(counterProp.x, counterProp.z);
  const counterMesh = critterMesh('counter', 1.4);
  counterMesh.position.set(counterProp.x, counterY, counterProp.z);
  scene.add(counterMesh);

  // Sign at the front-left corner.
  const signProp = at('sign');
  const signMesh = critterMesh('tuft-lodge-sign', 1.5);
  signMesh.position.set(signProp.x, heightAt(signProp.x, signProp.z), signProp.z);
  scene.add(signMesh);

  // Two drying racks at the cabin's sides.
  const racks: PlacedProp[] = [at('rack-l'), at('rack-r')];
  for (const r of racks) {
    const rack = critterMesh('tuft-drying-rack', 1.4);
    rack.position.set(r.x, heightAt(r.x, r.z), r.z);
    scene.add(rack);
  }

  // Hazel behind the counter.
  const hazelProp = at('hazel');
  const hazelY = heightAt(hazelProp.x, hazelProp.z);
  const hazel: GnomeModel = makeGnome(scene, HAZEL_LOOK);
  hazel.update(gnomeState(hazelProp.x, hazelY, hazelProp.z, 0, 0), 1);

  const boxes: Box[] = [
    boxAt(LODGE.x, LODGE.z, 4.7, 3.4, 6, y0),
    boxAt(counterProp.x, counterProp.z, 1.2, 0.4, 1.2, counterY),
    ...racks.map((r) => boxAt(r.x, r.z, 0.4, 0.4, 1.2, heightAt(r.x, r.z))),
  ];

  let yaw = 0;

  return {
    boxes,
    blip: { x: LODGE.x, z: LODGE.z, color: LODGE.blip, kind: 'shop', label: 'Tuft & Tally Lodge' },
    counter,
    nearCounter: (px, pz) => Math.hypot(px - counter.x, pz - counter.z) < 3,
    update(dt, px, pz) {
      const near = Math.hypot(px - hazelProp.x, pz - hazelProp.z) <= 12;
      const targetYaw = near ? Math.atan2(px - hazelProp.x, pz - hazelProp.z) : 0;
      let diff = targetYaw - yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      yaw += diff * Math.min(1, 5 * dt);
      hazel.update(gnomeState(hazelProp.x, hazelY, hazelProp.z, yaw, 0), dt);
    },
  };
}
