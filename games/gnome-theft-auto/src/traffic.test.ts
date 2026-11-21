// Traffic: errand routing, and a headless sim of the NPC drivers on a city-grid road graph that must not stay jammed.
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { PLACES, TRAFFIC } from './config';
import { pickErrand, placeNodes, planRoute } from './errands';
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
vi.mock('./gnomes', () => ({ gnomeState: () => ({ position: new THREE.Vector3() }), randomTownLook: () => ({}) }));

const { createTraffic } = await import('./traffic');
const { collideVehicles } = await import('./vehicles');

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

  it('maps every place to a road node', () => {
    for (const p of PLACES.filter((q) => !q.far)) expect(placeNode.has(p.id)).toBe(true);
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

describe('traffic drivers', () => {
  it('keep moving: 14 drivers on the grid for 6 simulated minutes never stay wedged, and they visit places', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    const scene = new THREE.Scene();
    // Far-behind drivers are normally moved next to the player; switch that off so only a wedged driver can teleport.
    (TRAFFIC as { despawnDistance: number }).despawnDistance = 1e9;
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
    expect(jammed).toBe(0);
    expect(teleports).toBeLessThanOrEqual(2);
    expect(travelled).toBeGreaterThan(5000);
    // They go somewhere: each driver parks at its destination for a few seconds, over and over.
    expect(visits).toBeGreaterThanOrEqual(20);
  }, 120_000);

  it('pull out around a vehicle left in their lane instead of queueing behind it forever', () => {
    const nodes = gridNodes();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 600 } as unknown as World;
    (TRAFFIC as { despawnDistance: number }).despawnDistance = 1e9;
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
});
