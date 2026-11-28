// Snack pickups in the world (E08, L33): an item's prefab bobbing above the grass at a few spots in the parks; walk
// through one to put it in the bag. Respawns a while after it is taken. Local to this browser (the bag is per player).
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { PARKS } from '../parks/blocks';
import { itemDef } from '../inventory';

export const PICKUP = {
  /** Walk within this many metres to pick it up. */
  radius: 1.6,
  /** Seconds before a taken pickup comes back. */
  respawnS: 180,
  /** Bob height (m) and speed (Hz); spin (rad/s). */
  bob: 0.15,
  bobHz: 0.6,
  spin: 1.2,
  /** Model scale and height above the ground (m). */
  scale: 1.4,
  lift: 0.6,
  /** Item ids a pickup can be, with weights (cheap snacks are common). */
  table: [
    { id: 'crab-apple', weight: 4 },
    { id: 'seed-cake', weight: 3 },
    { id: 'cheese-wedge', weight: 2 },
    { id: 'bread-loaf', weight: 2 },
    { id: 'toadstool-stew', weight: 1 },
    { id: 'party-popper', weight: 1 },
    { id: 'whoopee-cushion', weight: 1 },
  ],
} as const;

export interface PickupsDeps {
  scene: THREE.Scene;
  spots: readonly { x: number; z: number }[];
  groundAt(x: number, z: number): number;
  /** Put itemId in the bag; false when the bag has no room (the pickup stays). */
  onPick(itemId: string): boolean;
  rng?(): number;
}

export interface Pickups {
  /** Animate, and pick up whatever the player (at px, pz, on foot) walks through. */
  update(dt: number, px: number, pz: number, onFoot: boolean): void;
}

/** Where pickups lie: one spot per park (parks/blocks.ts PARKS), offset 3 m east of the park centre. */
export function pickupSpots(): { x: number; z: number }[] {
  return PARKS.map((p) => ({ x: p.x + 3, z: p.z }));
}

interface Slot {
  x: number;
  z: number;
  baseY: number;
  phase: number;
  group: THREE.Group | null;
  id: string | null;
  visible: boolean;
  /** Seconds left until a taken pickup comes back (0 = not waiting). */
  respawnLeft: number;
}

export function createPickups(deps: PickupsDeps): Pickups {
  const rng = deps.rng ?? Math.random;
  const pool = PICKUP.table.filter((e) => {
    const def = itemDef(e.id);
    return def !== undefined && getPrefab(def.prefab) !== undefined;
  });
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);

  function pickItem(): string | null {
    if (pool.length === 0) return null;
    let r = rng() * totalWeight;
    for (const e of pool) {
      r -= e.weight;
      if (r < 0) return e.id;
    }
    return pool[pool.length - 1].id;
  }

  function build(slot: Slot): void {
    if (slot.group) deps.scene.remove(slot.group);
    slot.group = null;
    slot.id = null;
    const id = pickItem();
    if (id === null) return;
    const def = itemDef(id);
    if (!def) return;
    const model = buildPrefab(def.prefab);
    model.scale.setScalar(PICKUP.scale);
    model.position.set(slot.x, slot.baseY, slot.z);
    deps.scene.add(model);
    slot.group = model;
    slot.id = id;
    slot.visible = true;
  }

  const slots: Slot[] = deps.spots.map((s, i) => ({
    x: s.x,
    z: s.z,
    baseY: deps.groundAt(s.x, s.z) + PICKUP.lift,
    phase: i * 1.7,
    group: null,
    id: null,
    visible: false,
    respawnLeft: 0,
  }));
  for (const slot of slots) build(slot);

  let t = 0;
  const TWO_PI = Math.PI * 2;

  return {
    update(dt, px, pz, onFoot) {
      t += dt;
      for (const slot of slots) {
        if (slot.respawnLeft > 0) {
          slot.respawnLeft -= dt;
          if (slot.respawnLeft <= 0) {
            slot.respawnLeft = 0;
            build(slot);
          }
        }
        const group = slot.group;
        if (!group || !slot.visible) continue;

        group.position.y = slot.baseY + PICKUP.bob * Math.sin(t * TWO_PI * PICKUP.bobHz + slot.phase);
        group.rotation.y += PICKUP.spin * dt;

        if (!onFoot || slot.id === null) continue;
        const dx = slot.x - px;
        const dz = slot.z - pz;
        if (Math.hypot(dx, dz) >= PICKUP.radius) continue;
        if (deps.onPick(slot.id)) {
          slot.visible = false;
          group.visible = false;
          slot.respawnLeft = PICKUP.respawnS;
        }
      }
    },
  };
}
