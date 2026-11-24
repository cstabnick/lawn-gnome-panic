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

// ---- "Some vehicles at spawn are spawning on sidewalks": every spawn source, footprint corners, real built world ----
// The street geometry is restated here from config.ts (not taken from parking.ts), so the test checks parking.ts.
describe('legal parking on the real map', () => {
  type Pt = [number, number];
  async function streets() {
    const cfg = await import('./config');
    const half = cfg.ROAD_WIDTH / 2;
    const sideHi = half + cfg.SIDEWALK_WIDTH;
    const laneEdge = cfg.LANE_OFFSET + 1.1;
    const segD = (x: number, z: number, ax: number, az: number, bx: number, bz: number): number => {
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1e-9;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
      return Math.hypot(x - ax - vx * t, z - az - vz * t);
    };
    const sidewalk = ([x, z]: Pt): boolean => cfg.ROAD_LINES.some((v) =>
      (Math.abs(z) <= cfg.CITY_HALF && Math.abs(x - v) >= half && Math.abs(x - v) <= sideHi)
      || (Math.abs(x) <= cfg.CITY_HALF && Math.abs(z - v) >= half && Math.abs(z - v) <= sideHi));
    const lane = ([x, z]: Pt): boolean =>
      cfg.ROAD_LINES.some((v) => (Math.abs(z) <= cfg.CITY_HALF && Math.abs(x - v) < laneEdge) || (Math.abs(x) <= cfg.CITY_HALF && Math.abs(z - v) < laneEdge))
      || cfg.HIGHWAYS.some((h) => h.points.some((p, i) => i + 1 < h.points.length && segD(x, z, p[0], p[1], h.points[i + 1][0], h.points[i + 1][1]) < laneEdge));
    return { cfg, sidewalk, lane };
  }
  async function world() {
    installFakeDom();
    const { buildWorld } = await import('./world');
    return buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  }
  /** Footprint sample points (corners, edge midpoints, centre) of `kind` at a pose. */
  async function corners(kind: import('./types').VehicleKind, x: number, z: number, yaw: number): Promise<Pt[]> {
    const { footprintOf, footprintPoints } = await import('./parking');
    return footprintPoints(footprintOf(kind), x, z, yaw);
  }
  async function violations(spots: readonly { kind: import('./types').VehicleKind; x: number; z: number; yaw: number }[]) {
    const { cfg, sidewalk, lane } = await streets();
    const bad: string[] = [];
    for (const s of spots) {
      if (cfg.VEHICLES[s.kind].boat) continue;
      const pts = await corners(s.kind, s.x, s.z, s.yaw);
      if (pts.some(sidewalk)) bad.push(`${s.kind}@${s.x.toFixed(1)},${s.z.toFixed(1)} on a sidewalk`);
      else if (pts.some(lane)) bad.push(`${s.kind}@${s.x.toFixed(1)},${s.z.toFixed(1)} in a driving lane`);
    }
    return bad;
  }

  it('world.parked as dealt at load (planParked + parkLegally): no footprint on a sidewalk or in a lane, none lost', async () => {
    const w = await world();
    const { planParked, parkLegally, clearOfRoads } = await import('./fleet');
    const { worldParkingGround, worldSpotChecks } = await import('./fleetRuntime');
    const cfg2 = await import('./config');
    const { SPAWN } = cfg2;
    // The bugs this guards: raw kerb spots hang into the lanes, and the old asphalt-only nudge left them on sidewalks.
    expect((await violations(w.parked)).length).toBeGreaterThan(0);
    expect((await violations(clearOfRoads(w.parked, worldSpotChecks(w)))).some((m) => m.includes('sidewalk'))).toBe(true);
    let seed = 1;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const plans = planParked(w.parked, SPAWN, rng).map((p) => ({ ...p.spot, kind: p.entry ? p.entry.kind : p.spot.kind }));
    const placed = parkLegally(plans, worldParkingGround(w));
    expect(await violations(placed)).toEqual([]);
    expect(placed.length).toBe(w.parked.length);
    // Every placed land vehicle is still in a building-free, dry place (parkLegally's blocked check).
    const g = worldParkingGround(w);
    for (const s of placed) if (!cfg2.VEHICLES[s.kind].boat) expect(g.blocked(s.x, s.z), `${s.kind}@${s.x},${s.z}`).toBe(false);
  }, 120_000);

  it('the airfield planes, the Whirligig pad and the air-and-sea craft spawns are legal', async () => {
    const w = await world();
    const { craftSpawnPoints } = await import('./craft/spawns');
    const spots = [
      ...w.airfield.planeSpots.map((s) => ({ ...s, kind: 'plane' as const })),
      { kind: 'whirligig' as const, x: w.base.padX, z: w.base.padZ, yaw: Math.PI },
      ...craftSpawnPoints(w),
    ];
    expect(await violations(spots)).toEqual([]);
  }, 120_000);

  it('fleet.spawn (the trainer\'s spawn at the crosshair) never leaves a vehicle on a sidewalk or in a lane', async () => {
    const w = await world();
    const { createFleetRuntime, worldParkingGround } = await import('./fleetRuntime');
    const { setPartsHooks } = await import('./vehicles');
    const scene = new THREE.Scene();
    const vehicles: Vehicle[] = [];
    const el = { style: {}, appendChild: () => undefined } as unknown as HTMLElement;
    const fleet = createFleetRuntime({
      scene, ui: el, fx: {} as never, hud: { toast: () => undefined }, vehicles,
      achievements: { unlock: () => undefined, increment: () => undefined }, playerPos: () => ({ x: 0, z: 0 }),
      ground: worldParkingGround(w),
    });
    // Aimed at a sidewalk, a lane, a road centre and a crossing in Turfton, and a highway lane.
    const { cfg } = await streets();
    const v = cfg.ROAD_LINES[1];
    const hw = cfg.HIGHWAYS[0].points[1];
    for (const [x, z, id] of [[v + 6, 20, 'golf-cart'], [v + 2.5, 40, 'ride-on'], [v, 10, 'zero-turn-howler'], [v, v, 'combine'], [hw[0], hw[1], 'push-bike']] as const) {
      const made = fleet.spawn(id, x, z, 0);
      expect(made, id).not.toBeNull();
      expect(await violations([made!])).toEqual([]);
    }
    setPartsHooks(null);
  }, 120_000);

  it('Sling-Lift drop spots (findSafeSpot with the app probe) keep the whole drop circle off sidewalks and lanes', async () => {
    const w = await world();
    const { findSafeSpot, boxesBlocked } = await import('./lockup/safeSpot');
    const { circleClearOfStreets } = await import('./parking');
    const { cfg, sidewalk, lane } = await streets();
    const hit = boxesBlocked(w.boxes, w.half);
    const probe = {
      ground: () => 0, water: () => 0, slope: () => 0,
      blocked: (x: number, z: number, r: number) => hit(x, z, r) || !circleClearOfStreets(x, z, r),
    };
    const v = cfg.ROAD_LINES[2];
    for (const [cx, cz] of [[v + 6, 15], [v, v], [v + 2, -30]]) {
      const s = findSafeSpot(cx, cz, probe, { radius: 2, minDist: 0, maxDist: 40, maxSlope: 1, maxWater: 0.1 });
      expect(s, `${cx},${cz}`).not.toBeNull();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const p: Pt = [s!.x + Math.sin(a) * 2, s!.z + Math.cos(a) * 2];
        expect(sidewalk(p) || lane(p), `${s!.x},${s!.z}`).toBe(false);
      }
    }
  }, 120_000);

  it('moving traffic lanes and the taxi drop-off stay off the sidewalks (they drive, so a lane is their place)', async () => {
    const w = await world();
    const { simGraph, lanePose } = await import('./trafficSim');
    const { dropSpot } = await import('./taxi');
    const { cfg, sidewalk } = await streets();
    const g = simGraph(w.roads.nodes, w.roads.laneOffset);
    let n = 0;
    for (const node of w.roads.nodes) {
      for (const to of node.links) {
        // Grid streets only: the connectors from the city edge to a highway (e.g. node 69 (-215, -10) to the crossing at
        // (-180, 0)) cut across the end of a sidewalk; that is the road network's shape, not a spawn, and is reported.
        const other = w.roads.nodes.find((q) => q.id === to);
        const inCity = (q: { x: number; z: number }) => Math.abs(q.x) < cfg.CITY_HALF && Math.abs(q.z) < cfg.CITY_HALF;
        if (!other || !inCity(node) || !inCity(other)) continue;
        for (const t of [0.25, 0.5, 0.75]) {
          const p = lanePose(g, node.id, to, t);
          // A traffic body is 2.2 m wide: its kerb-side edge must stay on the asphalt.
          const ex = p.x + Math.cos(p.yaw) * 1.1, ez = p.z - Math.sin(p.yaw) * 1.1;
          const fx = p.x - Math.cos(p.yaw) * 1.1, fz = p.z + Math.sin(p.yaw) * 1.1;
          expect(sidewalk([p.x, p.z]) || sidewalk([ex, ez]) || sidewalk([fx, fz]), `lane ${node.id}->${to} at ${p.x},${p.z}`).toBe(false);
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(100);
    const taxi = dropSpot(w.boxes, cfg.SPAWN);
    expect(sidewalk([taxi.stop.x, taxi.stop.z])).toBe(false);
    expect(sidewalk([taxi.from.x, taxi.from.z])).toBe(false);
  }, 120_000);
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
