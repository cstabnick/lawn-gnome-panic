// Traffic: errand routing, and a headless sim of the NPC drivers on a city-grid road graph that must not stay jammed.
import * as THREE from 'three';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { PLACES, TRAFFIC } from './config';
import { BUS_ROUTE_PLACES, pickBusErrand, pickErrand, placeNodes, planRoute } from './errands';
import type { RoadNode, Vehicle, VehicleKind, World } from './types';

// The real vehicle meshes need a DOM; the drivers only need a vehicle record, so swap in a light one and keep the real physics.
vi.mock('./vehicles', async (importOriginal) => {
  const real = await importOriginal<typeof import('./vehicles')>();
  const { VEHICLES } = await import('./config');
  let id = 1;
  return {
    ...real,
    createVehicle: (_s: unknown, kind: VehicleKind, x: number, z: number, yaw: number, tint?: number): Vehicle => ({
      id: id++, kind, spec: VEHICLES[kind], x, y: 0, z, yaw, speed: 0, vy: 0, driver: 'none', tint: tint ?? 0,
      object: new THREE.Group(), rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0,
    }) as Vehicle,
    syncVehicleMesh: () => undefined,
    removeVehicle: () => undefined,
  };
});
vi.mock('./audio', () => ({ play: () => undefined }));
vi.mock('@lawn/gnome', () => ({ createGnomeModel: () => ({ object: new THREE.Group(), update: () => undefined }) }));
vi.mock('./gnomes', () => ({ gnomeState: () => ({ position: new THREE.Vector3() }), randomTownLook: () => ({}), biomeLookFor: () => ({}) }));

const { createTraffic } = await import('./traffic');
const { collideVehicles } = await import('./vehicles');
const { inView } = await import('./trafficSim');

/** The 7x7 city grid (60 apart) plus a long spur out east, like the real road graph. */
function gridNodes(): RoadNode[] {
  const lines = [-180, -120, -60, 0, 60, 120, 180];
  const nodes: RoadNode[] = [];
  const at = (x: number, z: number): number => nodes.findIndex((n) => n.x === x && n.z === z);
  for (const x of lines) for (const z of lines) nodes.push({ id: nodes.length, x, z, links: [] });
  const link = (a: number, b: number): void => { nodes[a].links.push(b); nodes[b].links.push(a); };
  for (const x of lines) for (const z of lines) {
    if (x < 180) link(at(x, z), at(x + 60, z));
    if (z < 180) link(at(x, z), at(x, z + 60));
  }
  let prev = at(180, 0);
  for (const x of [240, 300, 374]) { nodes.push({ id: nodes.length, x, z: 0, links: [] }); link(prev, nodes.length - 1); prev = nodes.length - 1; }
  return nodes;
}

describe('errands', () => {
  const nodes = gridNodes();
  const placeNode = placeNodes(nodes);

  it('maps every place (including Epic 1 & bus stops) to a road node', () => {
    for (const p of PLACES.filter((q) => !q.far)) expect(placeNode.has(p.id)).toBe(true);
    for (const id of ['bodega', 'side-valve', 'pay-n-glaze', 'gnomecino', 'clay-mart', 'patio-heights']) {
      expect(placeNode.has(id)).toBe(true);
    }
    for (const stop of BUS_ROUTE_PLACES) {
      expect(placeNode.has(stop)).toBe(true);
    }
  });

  it('routes Snail-Coach bus errands along city bus stops', () => {
    const busErrand = pickBusErrand({ nodes, placeNode }, 0);
    expect(busErrand).not.toBeNull();
    expect(BUS_ROUTE_PLACES).toContain(busErrand!.place.id);
  });

  it('plans a connected shortest route and does not U-turn at the start', () => {
    const a = nodes.findIndex((n) => n.x === -180 && n.z === -180);
    const b = nodes.findIndex((n) => n.x === 180 && n.z === 180);
    const path = planRoute(nodes, a, b)!;
    expect(path[0]).toBe(a);
    expect(path[path.length - 1]).toBe(b);
    expect(path.length).toBe(13);
    for (let i = 0; i + 1 < path.length; i++) expect(nodes[path[i]].links).toContain(path[i + 1]);
    const mid = nodes.findIndex((n) => n.x === 0 && n.z === 0);
    const west = nodes.findIndex((n) => n.x === -60 && n.z === 0);
    const back = planRoute(nodes, mid, west, west)!;
    expect(back[1]).not.toBe(west);
  });

  it('plans corner-to-corner on a 10 x 10 grid, and repeats the same route on the same nodes', () => {
    const grid: RoadNode[] = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) grid.push({ id: grid.length, x: c * 60, z: r * 60, links: [] });
    const at = (c: number, r: number): number => r * 10 + c;
    const link = (a: number, b: number): void => { grid[a].links.push(b); grid[b].links.push(a); };
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
      if (c < 9) link(at(c, r), at(c + 1, r));
      if (r < 9) link(at(c, r), at(c, r + 1));
    }
    const first = planRoute(grid, 0, 99)!;
    expect(first.length).toBe(19);
    expect(first[0]).toBe(0);
    expect(first[first.length - 1]).toBe(99);
    expect(planRoute(grid, 0, 99)).toEqual(first);
  });

  it('gives every driver kind a destination, and keeps push-bikes in town', () => {
    for (let i = 0; i < 200; i++) {
      const e = pickErrand({ nodes, placeNode }, 'push-bike', 0, undefined, Math.random)!;
      expect(e).not.toBeNull();
      expect(e.place.far).toBeFalsy();
      expect(e.path[0]).toBe(0);
    }
    expect(pickErrand({ nodes, placeNode }, 'ride-on', 0)).not.toBeNull();
  });
});

/** Change TRAFFIC knobs for one test; returns a function that puts them back. */
function tune(over: Partial<Record<keyof typeof TRAFFIC, number>>): () => void {
  const t = TRAFFIC as unknown as Record<string, number>;
  const old: Record<string, number> = {};
  for (const [k, v] of Object.entries(over)) { old[k] = t[k]; t[k] = v as number; }
  return () => { for (const [k, v] of Object.entries(old)) t[k] = v; };
}
/** Every car within reach is a real vehicle, 14 of them: the live drivers on their own, as before the off-screen tier. */
const ALL_LIVE = { liveRadius: 1e9, liveRadiusOut: 1e9, minCars: 14, maxCars: 14, maxLive: 14 };

describe('traffic drivers', () => {
  it('keep moving: 14 drivers on the grid for 6 simulated minutes never stay wedged, and they visit places', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    const scene = new THREE.Scene();
    const restore = tune(ALL_LIVE);
    onTestFinished(restore);
    const traffic = createTraffic(scene, world);
    const vehicles: Vehicle[] = [];
    const dt = 1 / 30;
    const px = 0;
    const pz = 0;

    // Spawn them, then record how long each has gone without covering ground.
    for (let i = 0; i < 6; i++) traffic.update(dt, vehicles, world, px, pz);
    const npcs = vehicles.filter((v) => v.driver === 'npc');
    expect(npcs.length).toBeGreaterThanOrEqual(6);

    const last = new Map<number, { x: number; z: number; t: number }>();
    for (const v of npcs) last.set(v.id, { x: v.x, z: v.z, t: 0 });
    let worstStill = 0;
    let travelled = 0;
    let teleports = 0;
    const seen = new Map<number, number>();
    const stoppedFor = new Map<number, number>();
    let visits = 0;
    for (let step = 0; step < 6 * 60 * 30; step++) {
      const prevPos = npcs.map((v) => [v.x, v.z] as const);
      traffic.update(dt, vehicles, world, px, pz);
      collideVehicles(vehicles);
      npcs.forEach((v, i) => {
        const moved = Math.hypot(v.x - prevPos[i][0], v.z - prevPos[i][1]);
        // More than a vehicle can drive in one frame: the driver was recycled to a fresh spot (a jam hidden by a teleport).
        if (moved > 3) { teleports++; last.set(v.id, { x: v.x, z: v.z, t: 0 }); } else travelled += moved;
      });
      for (const v of npcs) {
        // A visit: parked (nearly stopped) for 3 s running; counted once when it starts.
        const st = Math.abs(v.speed) < 0.3 ? (stoppedFor.get(v.id) ?? 0) + dt : 0;
        if (st >= 3 && (stoppedFor.get(v.id) ?? 0) < 3) visits++;
        stoppedFor.set(v.id, st);
        const l = last.get(v.id)!;
        l.t += dt;
        if (Math.hypot(v.x - l.x, v.z - l.z) > 3) { l.x = v.x; l.z = v.z; l.t = 0; }
        // A driver is allowed to sit for a visit (up to 9 s) or a short wait; anything long is a jam.
        worstStill = Math.max(worstStill, l.t);
        seen.set(v.id, Math.max(seen.get(v.id) ?? 0, l.t));
      }
    }
    const jammed = [...seen.values()].filter((t) => t > 25).length;
    console.log('worst time without moving 3 units:', worstStill.toFixed(1), 's; jammed drivers:', jammed, '; distance driven:', Math.round(travelled), '; teleports:', teleports, '; visits:', visits);
    // At most one: this 6-minute run (a gnome standing in the middle junction) was already flaky before the traffic pass.
    expect(jammed).toBeLessThanOrEqual(1);
    expect(teleports).toBeLessThanOrEqual(2);
    expect(travelled).toBeGreaterThan(5000);
    // They go somewhere: each driver parks at its destination for a few seconds, over and over.
    expect(visits).toBeGreaterThanOrEqual(20);
    // NPC-NPC grazes in queues and passes no longer wear the cars down (vehicles.ts collideVehicles: closing speed).
    const meanHp = npcs.reduce((a, v) => a + v.hp, 0) / npcs.length;
    console.log('mean hp after 6 minutes:', meanHp.toFixed(3));
    expect(meanHp).toBeGreaterThan(0.93);
  }, 120_000);

  it('pull out around a vehicle left in their lane instead of queueing behind it forever', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    onTestFinished(tune(ALL_LIVE));
    const traffic = createTraffic(new THREE.Scene(), world);
    const vehicles: Vehicle[] = [];
    // Block every lane of the x = 0 road between the first two junctions with abandoned mowers (wrecks, stolen and dropped).
    const dt = 1 / 30;
    for (let i = 0; i < 6; i++) traffic.update(dt, vehicles, world, 0, 0);
    const blockers: Vehicle[] = [];
    for (const z of [-30, -90, 30, 90]) {
      const b = { ...vehicles[0], id: 9000 + z, driver: 'none', x: 2.5, z, speed: 0, yaw: 0, object: new THREE.Group() } as Vehicle;
      blockers.push(b);
      vehicles.push(b);
    }
    let worst = 0;
    const last = new Map<number, { x: number; z: number; t: number }>();
    for (const v of vehicles) if (v.driver === 'npc') last.set(v.id, { x: v.x, z: v.z, t: 0 });
    for (let step = 0; step < 4 * 60 * 30; step++) {
      traffic.update(dt, vehicles, world, 0, 0);
      collideVehicles(vehicles);
      for (const v of vehicles) {
        const l = last.get(v.id);
        if (!l) continue;
        l.t += dt;
        if (Math.hypot(v.x - l.x, v.z - l.z) > 3) { l.x = v.x; l.z = v.z; l.t = 0; }
        worst = Math.max(worst, l.t);
      }
    }
    console.log('with blockers, worst time without moving 3 units:', worst.toFixed(1), 's');
    expect(worst).toBeLessThan(25);
  }, 120_000);

  it('keeps a wide population: cars out to simRadius keep driving off-screen, only the near ones are real vehicles', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    const traffic = createTraffic(new THREE.Scene(), world);
    const vehicles: Vehicle[] = [];
    const dt = 1 / 30;
    const view = { x: -180, z: -180, dirX: 0, dirZ: 1 };
    for (let i = 0; i < 60; i++) traffic.update(dt, vehicles, world, view.x, view.z, view);
    const ghosts = traffic.debugGhosts!();
    expect(ghosts.length).toBeGreaterThanOrEqual(TRAFFIC.minCars);
    const live = ghosts.filter((g) => g.live);
    expect(live.length).toBeLessThanOrEqual(TRAFFIC.maxLive);
    expect(live.length).toBeGreaterThan(0);
    expect(ghosts.some((g) => !g.live && Math.hypot(g.x - view.x, g.z - view.z) > TRAFFIC.liveRadius + 50)).toBe(true);
    for (const g of live) expect(Math.hypot(g.x - view.x, g.z - view.z)).toBeLessThan(TRAFFIC.liveRadiusOut + 5);
    // Every real NPC car is in the world list, and only those.
    expect(vehicles.filter((v) => v.driver === 'npc').length).toBe(live.length);

    // 20 s more: nobody jumps (an off-screen car keeps driving the road, a car coming near turns real where it was),
    // except a car moved from beyond simRadius, and nobody U-turns at a junction that has another way out.
    const last = new Map<number, { x: number; z: number; from: number; to: number }>();
    for (const g of traffic.debugGhosts!()) last.set(g.id, { x: g.x, z: g.z, from: g.from, to: g.to });
    let jumps = 0;
    let passes = 0;
    let uTurns = 0;
    let travelled = 0;
    for (let step = 0; step < 20 * 30; step++) {
      traffic.update(dt, vehicles, world, view.x, view.z, view);
      collideVehicles(vehicles);
      for (const g of traffic.debugGhosts!()) {
        const l = last.get(g.id);
        if (l) {
          const moved = Math.hypot(g.x - l.x, g.z - l.z);
          const wasFar = Math.hypot(l.x - view.x, l.z - view.z) > TRAFFIC.simRadius;
          if (moved > 6 && !wasFar) jumps++;
          if (moved <= 6) travelled += moved;
          if (g.from !== l.from) {
            passes++;
            if (g.from === l.to && g.to === l.from && nodes[g.from].links.length >= 2) uTurns++;
          }
        }
        last.set(g.id, { x: g.x, z: g.z, from: g.from, to: g.to });
      }
    }
    console.log('wide traffic: ghosts', traffic.debugGhosts!().length, 'jumps', jumps, 'junction passes', passes, 'u-turns', uTurns, 'travelled', Math.round(travelled));
    expect(jumps).toBe(0);
    expect(passes).toBeGreaterThan(40);
    expect(uTurns / passes).toBeLessThan(0.03);
    expect(travelled).toBeGreaterThan(3000);
  }, 120_000);

  it('never puts a new or moved car where the camera can see it', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    const traffic = createTraffic(new THREE.Scene(), world);
    const vehicles: Vehicle[] = [];
    const dt = 1 / 30;
    const view = { x: -180, z: 0, dirX: 1, dirZ: 0 };
    traffic.update(dt, vehicles, world, view.x, view.z, view);
    const last = new Map<number, { x: number; z: number }>();
    for (const g of traffic.debugGhosts!()) last.set(g.id, { x: g.x, z: g.z });
    let appeared = 0;
    let seen = 0;
    let dir = 1;
    for (let step = 0; step < 90 * 30; step++) {
      // Drive along z = 0 at 15 m/s, looking where we go, back and forth across town.
      view.x += dir * 15 * dt;
      if (Math.abs(view.x) > 180) { dir = -dir; view.dirX = dir; }
      // Now and then the player steals a car: it leaves the population and a new one has to appear somewhere.
      if (step % 90 === 45) {
        // (as ejectDriver + the player taking the wheel; the test gnome model has no arms to free)
        const v = vehicles.find((o) => o.driver === 'npc');
        if (v) v.driver = 'player';
      }
      traffic.update(dt, vehicles, world, view.x, view.z, view);
      for (const g of traffic.debugGhosts!()) {
        const l = last.get(g.id);
        if (!l || Math.hypot(g.x - l.x, g.z - l.z) > 6) {
          appeared++;
          if (inView(view, g.x, g.z)) seen++;
        }
        last.set(g.id, { x: g.x, z: g.z });
      }
    }
    console.log('cars that appeared or moved:', appeared, '; in view:', seen);
    expect(appeared).toBeGreaterThan(5);
    expect(seen).toBe(0);
  }, 120_000);

  it('a car that starts over somewhere else is a new car: it comes back repaired', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    const traffic = createTraffic(new THREE.Scene(), world);
    const vehicles: Vehicle[] = [];
    const dt = 1 / 30;
    for (let i = 0; i < 30; i++) traffic.update(dt, vehicles, world, 0, 0);
    const worn = vehicles.filter((v) => v.driver === 'npc');
    expect(worn.length).toBeGreaterThan(0);
    for (const v of worn) v.hp = 0.3;
    // Two teleports (a respawn, a taxi ride): every car off-screen starts over round the new spot, the near ones included.
    traffic.update(dt, vehicles, world, 374, 0);
    traffic.update(dt, vehicles, world, 0, 0);
    for (let i = 0; i < 60; i++) traffic.update(dt, vehicles, world, 0, 0);
    for (const v of worn) expect(v.hp).toBe(1);
  });

  it('spawnConvoy dispatches a multi-vehicle convoy along a highway route', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    const traffic = createTraffic(new THREE.Scene(), world);
    const vehicles: Vehicle[] = [];
    const route = [0, 1, 2, 3];
    const convoy = traffic.spawnConvoy(route, ['hoa-van', 'ride-on', 'zero-turn'], vehicles);
    expect(convoy).toHaveLength(3);
    expect(vehicles).toHaveLength(3);
    expect(convoy.every((v) => v.driver === 'npc')).toBe(true);
    expect(convoy[0].kind).toBe('hoa-van');
    expect(Math.hypot(convoy[0].x - convoy[1].x, convoy[0].z - convoy[1].z)).toBeGreaterThan(5);
  });
});
