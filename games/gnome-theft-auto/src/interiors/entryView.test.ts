// Entry views (FX02, D58): the first look into every walk-in frames the room, not a plank. For every registered
// interior, nothing taller than 1.2 m stands within 3 m in front of the spawn; and every lift or stairs that puts the
// player back in the world (kit.stairsTo with a world pose) leaves the follow camera clear of the arrival's kiosk.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import '../campus/interiors';
import '../campus/observatoryInterior';
import '../coast/pirateShip';
import '../country/manorInterior';
import '../golf/clubhouse';
import '../homes/interiors';
import './index';
import '../pardonlin/interiors';
import '../societies/flock/tent';
import '../societies/loamdeep/interior';
import '../societies/loamdeep/moleman';
import '../societies/underspan/workshop';
import '../unmown/station';
import '../workplaces/chef/kitchen';
import '../workplaces/comedy/club';
import '../workplaces/gnomazon/warehouse';
import { listInteriors } from './registry';
import { createKit } from './kit';
import { DOUBLE_POT_ROOF_ARRIVAL, DOUBLE_POT_ROOF_KIOSK } from './showcase/doublePot';

/** Nothing taller than this (m) may stand in the entry corridor. */
const MAX_H = 1.2;
/** The corridor: from 0.3 m to 3 m in front of the spawn, 0.6 m either side of the line of sight. */
const NEAR = 0.3;
const FAR = 3;
const HALF_W = 0.6;
/**
 * Known exceptions, each with its reason. Rooms here belong to other fix epics' files; the entry stays a finding there.
 * uni-lecture: the tiered `lecture-bench-row` prefab is scaled to 18 m wide and so stands ~4 m tall (campus/interiors.ts).
 */
const EXEMPT: Record<string, string> = {
  'uni-lecture': 'tiered bench rows scaled by width (campus/interiors.ts, not FX02)',
};

/** The foot camera behind an arrival: distance and over-the-shoulder offset (camera.ts VIEW.foot, SHOULDER). */
const CAM_DIST = 4.6;
const CAM_SHOULDER = 0.7;
const CAM_RADIUS = 0.35;

interface Hit { name: string; top: number }

function entryBlockers(group: THREE.Group, spawn: { x: number; z: number; yaw: number }, size: { w: number; d: number }): Hit[] {
  const fx = Math.sin(spawn.yaw);
  const fz = Math.cos(spawn.yaw);
  const hits: Hit[] = [];
  group.updateMatrixWorld(true);
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (let c: THREE.Object3D | null = o; c && c !== group; c = c.parent) {
      if (c.userData.shell || c.userData.interiorNpc) return;
    }
    const bb = new THREE.Box3().setFromObject(mesh);
    if (bb.isEmpty() || bb.max.y <= MAX_H) return;
    // A huge flat-ish piece covering the whole room (a floor slab, a ceiling lip) is not furniture.
    if (bb.max.x - bb.min.x > size.w * 0.9 && bb.max.z - bb.min.z > size.d * 0.9) return;
    for (let d = NEAR; d <= FAR + 1e-6; d += 0.1) {
      for (const s of [-HALF_W, 0, HALF_W]) {
        const x = spawn.x + fx * d + fz * s;
        const z = spawn.z + fz * d - fx * s;
        if (x >= bb.min.x && x <= bb.max.x && z >= bb.min.z && z <= bb.max.z) {
          hits.push({ name: `${mesh.parent?.name ?? ''}/${mesh.name || 'mesh'}`, top: bb.max.y });
          return;
        }
      }
    }
  });
  return hits;
}

describe('interiors: entry views (D58)', () => {
  const all = listInteriors();

  it('registers the walk-ins this check covers', () => {
    expect(all.length).toBeGreaterThanOrEqual(20);
  });

  for (const p of all) {
    it(`${p.def.id}: nothing taller than ${MAX_H} m within ${FAR} m in front of the spawn`, () => {
      const { kit, build } = createKit(p);
      p.def.build(kit);
      const spawn = build.spawn ?? { x: 0, z: 0, yaw: 0 };
      const hits = entryBlockers(kit.group, spawn, p.def.size);
      if (EXEMPT[p.def.id]) return;
      expect(hits.map((h) => `${h.name} (${h.top.toFixed(1)} m)`)).toEqual([]);
    });
  }

  it('keeps the follow camera clear of the Double Pot lift kiosk on arrival', () => {
    const k = DOUBLE_POT_ROOF_KIOSK;
    const a = DOUBLE_POT_ROOF_ARRIVAL;
    const fx = Math.sin(a.yaw);
    const fz = Math.cos(a.yaw);
    // Right of the view direction (camera.ts: rightX = -cos(yaw), rightZ = sin(yaw)).
    for (const shoulder of [0, CAM_SHOULDER]) {
      for (let d = 0.5; d <= CAM_DIST + 1e-6; d += 0.25) {
        const x = a.x - fx * d - Math.cos(a.yaw) * shoulder;
        const z = a.z - fz * d + Math.sin(a.yaw) * shoulder;
        const inside = x > k.minX - CAM_RADIUS && x < k.maxX + CAM_RADIUS && z > k.minZ - CAM_RADIUS && z < k.maxZ + CAM_RADIUS;
        expect(inside, `camera at ${d} m behind the arrival is in the kiosk`).toBe(false);
      }
    }
  });

  it('sends every Double Pot lift ride to the clear arrival pose', () => {
    const targets: { x: number; y: number; z: number; yaw: number }[] = [];
    for (const p of all) {
      const { kit } = createKit(p);
      const orig = kit.stairsTo;
      kit.stairsTo = (x, z, to, prompt) => {
        if (typeof to !== 'string') targets.push(to);
        orig(x, z, to, prompt);
      };
      p.def.build(kit);
    }
    const onSlab = targets.filter((t) => t.x >= 111 && t.x <= 129 && t.z >= -110.7 && t.z <= -69.3);
    expect(onSlab.length).toBeGreaterThan(0);
    for (const t of onSlab) expect(t).toEqual({ ...DOUBLE_POT_ROOF_ARRIVAL });
  });
});
