// Bridges, docks and the gnome waterworks (Wild World Epic 4): road bridges at every water.ts bridge span, docks and
// wharves with their boats, canal lock gates, the loch weir, field sluices, a waterwheel sawmill, and the Tall-One hints.
//
// waterworksPlan() is the pure plan (positions, yaws, colliders, boat spots): it reads water.ts and terrain.ts and uses
// no three.js objects. buildWaterworks() builds the plan's prefabs into a group, pushes their colliders into `boxes`, and
// returns the boats (world.ts adds them to world.parked; app.ts creates them like parked mowers).
import * as THREE from 'three';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import { heightAt } from './terrain';
import { BODIES, bodyLevel, bodyRadius, bridges, canalLocks, courseProfile, shorePoint, waterLevelAt } from './water';
import type { Box, ParkedSpot } from './types';

/** One prefab to place. `solid` are its colliders; `spin` names a child to turn at 0.8 rad/s about its local x axis. */
export interface WorkPlacement {
  prefab: string;
  x: number; y: number; z: number;
  yaw: number;
  scaleX?: number;
  scaleZ?: number;
  solid?: Box[];
  spin?: string;
}

export interface WaterworksPlan {
  works: WorkPlacement[];
  boats: ParkedSpot[];
}

export interface Waterworks {
  /** Boats moored at the docks: world.ts adds them to world.parked (app.ts creates them like parked mowers). */
  boats: ParkedSpot[];
  /** Animate the waterwheel and anything else that moves. */
  update(dt: number): void;
}

const WHEEL_RATE = 0.8;
const LOCH = 'water/loch-moss';
const SEA = 'water/puddle-sea';

type Rect = Omit<Box, 'h'>;

/** Bounds of a rectangle of half sizes (halfX along the object's local x, halfZ along its local z), rotated by yaw. */
function footprint(x: number, z: number, yaw: number, halfX: number, halfZ: number): Rect {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      // local +x = (cos yaw, -sin yaw), local +z = (sin yaw, cos yaw)
      const px = x + sx * halfX * c + sz * halfZ * s;
      const pz = z - sx * halfX * s + sz * halfZ * c;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minZ = Math.min(minZ, pz); maxZ = Math.max(maxZ, pz);
    }
  }
  return { minX, maxX, minZ, maxZ };
}

/** Ground at (x, z), or the water's bank: never below `level + 0.4`. */
function bank(x: number, z: number, level: number): number {
  return Math.max(heightAt(x, z), level + 0.4);
}

/** The placements and boat spots of the waterworks. Empty while the water is off. */
export function waterworksPlan(): WaterworksPlan {
  const works: WorkPlacement[] = [];
  const boats: ParkedSpot[] = [];
  const plan = { works, boats };
  const roads = bridges();
  if (roads.length === 0) return plan;
  const L = bodyLevel(LOCH);
  const S = bodyLevel(SEA);
  const loch = BODIES.find((b) => b.id === LOCH);
  if (L === null || S === null || !loch) return plan;

  // 1. Bridges.
  for (const b of roads) {
    works.push({
      prefab: 'road-bridge', x: b.x, y: b.deck - 2.83, z: b.z, yaw: b.yaw,
      scaleX: b.width / 12, scaleZ: b.length / 24,
    });
  }

  // 2. Loch dock, moored boats.
  {
    // Decks and quays stand 0.12 proud of the bank so their tops never lie in the ground's plane (z-fighting).
    const y = bank(-715, -554, L) + 0.12 - 1.6;
    works.push({
      prefab: 'wooden-dock', x: -715, y, z: -564, yaw: Math.PI,
      solid: [{ minX: -716.5, maxX: -713.5, minZ: -570, maxZ: -558, h: y + 1.6 }],
    });
    boats.push({ x: -705.5, z: -574, yaw: Math.PI, kind: 'watering-can-steamer' });
    boats.push({ x: -721, z: -571, yaw: Math.PI, kind: 'walnut-dinghy' });
  }

  // 3. Loch weir: where the ravine river reaches the loch's rim.
  const ravine = courseProfile('river-ravine');
  if (ravine) {
    const n = ravine.s.length;
    let k = -1;
    for (let i = 0; i + 1 < n; i++) {
      if (bodyRadius(loch, ravine.x[i], ravine.z[i]) > 1 + 10 / 120) { k = i; break; }
    }
    if (k >= 0) {
      const x = ravine.x[k], z = ravine.z[k];
      const yaw = Math.atan2(ravine.x[k + 1] - x, ravine.z[k + 1] - z);
      const y = ravine.bed[k];
      works.push({
        prefab: 'loch-weir', x, y, z, yaw,
        solid: [{ ...footprint(x, z, yaw, 6, 1), h: y + 2.4 }],
      });
    }
  }

  // 4. Loch hints: the heron on the bank, and the pond liner rim along the shore.
  {
    const p = shorePoint(loch, 2.3);
    const dx = p.x - loch.cx, dz = p.z - loch.cz;
    const l = Math.hypot(dx, dz) || 1;
    const hx = p.x + (dx / l) * 3, hz = p.z + (dz / l) * 3;
    works.push({ prefab: 'stone-heron', x: hx, y: heightAt(hx, hz), z: hz, yaw: 0 });
    for (const a of [0.4, 1.9, 3.6]) {
      const p1 = shorePoint(loch, a - 0.02), p2 = shorePoint(loch, a + 0.02);
      const c = shorePoint(loch, a);
      works.push({
        prefab: 'pond-liner-rim', x: c.x, y: L + 0.02, z: c.z,
        yaw: Math.atan2(-(p2.z - p1.z), p2.x - p1.x),
      });
    }
  }

  // 5. Canal lock gates.
  for (const lk of canalLocks()) {
    works.push({ prefab: 'canal-lock-gate', x: lk.x, y: lk.lower - 0.55, z: lk.z, yaw: lk.yaw });
  }

  // 6. Canal wharves (south bank, front face on the waterline z = 235), moored boats.
  for (const x of [-140, 150]) {
    // The canal's surface beside the wharf (the waterline), or the ground when the canal is not sampled there.
    const level = waterLevelAt(x, 235) ?? heightAt(x, 235);
    const y = bank(x, 241, level) + 0.3 - 1.8;
    works.push({
      prefab: 'wharf', x, y, z: 238, yaw: Math.PI,
      solid: [{ minX: x - 6, maxX: x + 6, minZ: 235, maxZ: 241, h: y + 1.8 }],
    });
  }
  boats.push({ x: -140, z: 231, yaw: Math.PI / 2, kind: 'walnut-dinghy' });
  boats.push({ x: 150, z: 231, yaw: -Math.PI / 2, kind: 'gravy-boat' });

  // 7. Gutter lips along the canal's south bank.
  for (const x of [-60, 40, 175]) {
    works.push({ prefab: 'gutter-lip', x, y: heightAt(x, 236.4) - 0.2, z: 236.4, yaw: 0 });
  }

  // 8. Field sluices on the farm river.
  const farm = courseProfile('river-farm');
  if (farm) {
    const n = farm.s.length;
    for (const f of [0.35, 0.6]) {
      const k = Math.max(0, Math.min(n - 2, Math.round(f * n)));
      const dx = farm.x[k + 1] - farm.x[k], dz = farm.z[k + 1] - farm.z[k];
      const l = Math.hypot(dx, dz) || 1;
      const rx = -dz / l, rz = dx / l;
      const cx = farm.x[k], cz = farm.z[k];
      const sx = cx + rx * (12 / 2 + 2.5), sz = cz + rz * (12 / 2 + 2.5);
      const y = heightAt(sx, sz);
      works.push({
        prefab: 'field-sluice', x: sx, y, z: sz, yaw: Math.atan2(cx - sx, cz - sz),
        solid: [{ minX: sx - 1.5, maxX: sx + 1.5, minZ: sz - 1.5, maxZ: sz + 1.5, h: y + 2.2 }],
      });
    }
  }

  // 9. Ravine sawmill on the left bank of the ravine river; its wheel dips into the water.
  if (ravine) {
    const n = ravine.s.length;
    const k = Math.max(0, Math.min(n - 2, Math.round(0.45 * n)));
    const dx = ravine.x[k + 1] - ravine.x[k], dz = ravine.z[k + 1] - ravine.z[k];
    const l = Math.hypot(dx, dz) || 1;
    const nx = dz / l, nz = -dx / l;
    const ox = ravine.x[k] + nx * 7.1, oz = ravine.z[k] + nz * 7.1;
    const y = ravine.surface[k] - 0.4;
    works.push({
      prefab: 'waterwheel-mill', x: ox, y, z: oz, yaw: Math.atan2(nz, -nx), spin: 'wheel',
      solid: [{ minX: ox - 2.5, maxX: ox + 2.5, minZ: oz - 2.5, maxZ: oz + 2.5, h: y + 4.6 }],
    });
  }

  // 10. New Puddle marina: two docks reaching south into the sea, and three moored boats.
  for (const x of [600, 640]) {
    const y = bank(x, 768, S) + 0.12 - 1.6;
    works.push({
      prefab: 'wooden-dock', x, y, z: 776, yaw: 0,
      solid: [{ minX: x - 1.5, maxX: x + 1.5, minZ: 770, maxZ: 782, h: y + 1.6 }],
    });
  }
  boats.push({ x: 612, z: 787, yaw: 0, kind: 'clog-cruiser' });
  boats.push({ x: 652, z: 787, yaw: 0, kind: 'gravy-boat' });
  boats.push({ x: 628, z: 785, yaw: 0, kind: 'walnut-dinghy' });

  // 11. The source: the hose nozzle pointing at the Frozen Birdbath Basin centre (0, -350).
  works.push({ prefab: 'hose-nozzle', x: 16, y: heightAt(16, -340), z: -340, yaw: Math.atan2(-16, -10) });

  return plan;
}

/** Build the waterworks: its prefabs into one group on `scene`, their colliders into `boxes`. */
export function buildWaterworks(scene: THREE.Scene, boxes: Box[]): Waterworks {
  const plan = waterworksPlan();
  const group = new THREE.Group();
  group.name = 'waterworks';
  const spinners: THREE.Object3D[] = [];
  for (const w of plan.works) {
    if (!getPrefab(w.prefab)) continue;
    const obj = buildPrefab(w.prefab);
    obj.position.set(w.x, w.y, w.z);
    obj.rotation.y = w.yaw;
    if (w.scaleX !== undefined || w.scaleZ !== undefined) obj.scale.set(w.scaleX ?? 1, 1, w.scaleZ ?? 1);
    obj.traverse((o) => {
      if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    group.add(obj);
    for (const b of w.solid ?? []) boxes.push(b);
    if (w.spin) {
      const part = obj.getObjectByName(w.spin);
      if (part) spinners.push(part);
    }
  }
  scene.add(group);
  return {
    boats: plan.boats,
    update(dt: number) {
      for (const part of spinners) part.rotation.x += WHEEL_RATE * dt;
    },
  };
}
