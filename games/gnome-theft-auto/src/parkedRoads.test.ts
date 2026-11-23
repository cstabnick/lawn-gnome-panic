// Regression: "a bunch of stuff spawns in the road". Parked vehicles must not stand on (or hang into) a road, and debris
// that lands on a road is tidied away quickly.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { clearOfRoads, PARK_CLEAR, type SpotChecks } from './fleet';
import { DEBRIS, createDebris } from './debris';
import type { ParkedSpot, Vehicle } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

// A road along z: |x| < 5.
const band: SpotChecks = { onRoad: (x) => Math.abs(x) < 5, blocked: () => false };
const touches = (s: ParkedSpot, c: SpotChecks): boolean => {
  if (c.onRoad(s.x, s.z)) return true;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    if (c.onRoad(s.x + Math.sin(a) * PARK_CLEAR, s.z + Math.cos(a) * PARK_CLEAR)) return true;
  }
  return false;
};

describe('clearOfRoads', () => {
  it('moves a kerb spot that hangs into the road onto clear ground, keeping kind and yaw', () => {
    const out = clearOfRoads([{ x: -3.8, z: 22, yaw: 0.5, kind: 'ride-on' }], band);
    expect(out).toHaveLength(1);
    expect(touches(out[0], band)).toBe(false);
    expect(out[0].kind).toBe('ride-on');
    expect(out[0].yaw).toBe(0.5);
    expect(Math.hypot(out[0].x + 3.8, out[0].z - 22)).toBeLessThanOrEqual(15);
  });

  it('keeps clear spots exactly, keeps boats, and drops a spot with nowhere to go', () => {
    const clear: ParkedSpot = { x: 20, z: 0, yaw: 0, kind: 'zero-turn' };
    const boat: ParkedSpot = { x: 0, z: 0, yaw: 0, kind: 'walnut-dinghy' };
    expect(clearOfRoads([clear, boat], band)).toEqual([clear, boat]);
    const allRoad: SpotChecks = { onRoad: () => true, blocked: () => false };
    expect(clearOfRoads([{ x: 0, z: 0, yaw: 0, kind: 'ride-on' }], allRoad)).toEqual([]);
  });

  it('keeps moved spots 6 m from the others', () => {
    const out = clearOfRoads([
      { x: -3.8, z: 0, yaw: 0, kind: 'ride-on' },
      { x: -3.8, z: 1, yaw: 0, kind: 'push-bike' },
    ], band);
    expect(out).toHaveLength(2);
    expect(Math.hypot(out[0].x - out[1].x, out[0].z - out[1].z)).toBeGreaterThanOrEqual(6);
  });

  it('on the real map, no parked land vehicle touches a road after clearOfRoads', async () => {
    installFakeDom();
    const { buildWorld } = await import('./world');
    const { worldSpotChecks } = await import('./fleetRuntime');
    const { VEHICLES } = await import('./config');
    const world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
    const checks = worldSpotChecks(world);
    const land = (s: ParkedSpot) => !VEHICLES[s.kind].boat;
    const before = world.parked.filter((s) => land(s) && touches(s, checks));
    // The bug: kerb-side spots (e.g. the ride-on at -3.8, 22 by the bus stop) sat in the road.
    expect(before.length).toBeGreaterThan(0);
    const after = clearOfRoads(world.parked, checks);
    expect(after.filter((s) => land(s) && touches(s, checks))).toEqual([]);
    // Nothing lost but spots with no clear ground nearby (none expected on this map).
    expect(after.length).toBe(world.parked.length);
  }, 60_000);
});

describe('debris on the road', () => {
  it('a piece that lands on the road is gone within DEBRIS.roadLife + fade; one off the road stays', () => {
    const scene = new THREE.Scene();
    const roadSide = createDebris(scene, () => true);
    const offRoad = createDebris(new THREE.Scene(), () => false);
    for (const d of [roadSide, offRoad]) {
      const object = new THREE.Group();
      const body = new THREE.Group();
      object.add(body);
      for (let i = 0; i < 4; i++) {
        const w = new THREE.Group();
        w.name = `wheel-${i}`;
        w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2), new THREE.MeshBasicMaterial()));
        body.add(w);
      }
      const v = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, tint: 0, spec: { prefab: 'nope', scale: 1 }, object } as unknown as Vehicle;
      expect(d.burst(v)).toBeGreaterThanOrEqual(2);
    }
    const steps = Math.ceil((5 + DEBRIS.roadLife + DEBRIS.fade + 1) * 30);
    for (let i = 0; i < steps; i++) { roadSide.update(1 / 30); offRoad.update(1 / 30); }
    expect(roadSide.count()).toBe(0);
    expect(offRoad.count()).toBeGreaterThan(0);
  }, 30_000);
});
