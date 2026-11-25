// Live traffic through a roundabout (E28): cars go round the right way, give way on entry, and never jam for good.
import * as THREE from 'three';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { TRAFFIC } from './config';
import type { RoadNode, Vehicle, VehicleKind, World } from './types';

// Same light vehicle and gnome stand-ins as traffic.test.ts: the drivers only need a vehicle record and the physics.
vi.mock('./vehicles', async (importOriginal) => {
  const real = await importOriginal<typeof import('./vehicles')>();
  const { VEHICLES } = await import('./config');
  let id = 1;
  return {
    ...real,
    createVehicle: (_s: unknown, kind: VehicleKind, x: number, z: number, yaw: number, tint?: number): Vehicle => ({
      id: id++, kind, spec: VEHICLES[kind], x, y: 0, z, yaw, speed: 0, vy: 0, driver: 'none', tint: tint ?? 0,
      object: new THREE.Group(), rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0, look: {},
    }) as Vehicle,
    syncVehicleMesh: () => undefined,
    setVehicleLook: (v: Vehicle, look: unknown) => { (v as { look?: unknown }).look = look; },
    removeVehicle: () => undefined,
  };
});
(globalThis as { location?: { search: string } }).location ??= { search: '' };
vi.mock('./audio', () => ({ play: () => undefined }));
vi.mock('./driverHands', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./driverHands')>()),
  clearHands: () => undefined,
}));
vi.mock('@lawn/gnome', () => ({ createGnomeModel: () => ({ object: new THREE.Group(), update: () => undefined }) }));
vi.mock('./gnomes', () => ({ gnomeState: () => ({ position: new THREE.Vector3() }), randomTownLook: () => ({}), biomeLookFor: () => ({}) }));

const { createTraffic } = await import('./traffic');
const { collideVehicles } = await import('./vehicles');
const { applyRoundabouts, canDrive } = await import('./roundabouts');

const RB = { id: 'roundabout/test', x: 3000, z: 3000, r: 16, width: 10 };

/**
 * A roundabout (12 ring nodes) with four spokes out to a square of roads 160 m out, so every car keeps coming back
 * through it. Off the real map (3000, 3000) so no warden or real ring is near.
 */
function ringGraph(): RoadNode[] {
  const nodes: RoadNode[] = [];
  const add = (x: number, z: number): number => { nodes.push({ id: nodes.length, x, z, links: [] }); return nodes.length - 1; };
  const link = (a: number, b: number): void => { nodes[a].links.push(b); nodes[b].links.push(a); };
  const ring: number[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    ring.push(add(RB.x + RB.r * Math.cos(a), RB.z + RB.r * Math.sin(a)));
  }
  for (let k = 0; k < 12; k++) link(ring[k], ring[(k + 1) % 12]);
  const corners: number[] = [];
  for (const [cx, cz] of [[160, 160], [-160, 160], [-160, -160], [160, -160]]) corners.push(add(RB.x + cx, RB.z + cz));
  // Spokes at 0, 90, 180, 270 degrees (ring nodes 0, 3, 6, 9), each with a node 80 m out, to the square's sides.
  const sides: number[] = [];
  for (const [k, dx, dz] of [[0, 1, 0], [3, 0, 1], [6, -1, 0], [9, 0, -1]] as const) {
    const mid = add(RB.x + dx * 80, RB.z + dz * 80);
    const edge = add(RB.x + dx * 160, RB.z + dz * 160);
    link(ring[k], mid);
    link(mid, edge);
    sides.push(edge);
  }
  // The square: each side's middle joined to its two corners.
  const [e, s, w, n] = sides;
  const [se, sw, nw, ne] = corners;
  link(e, se); link(e, ne); link(s, se); link(s, sw); link(w, sw); link(w, nw); link(n, nw); link(n, ne);
  applyRoundabouts(nodes, [RB]);
  return nodes;
}

describe('traffic on a roundabout', () => {
  it('ring links are one-way in the test graph', () => {
    const nodes = ringGraph();
    const ring = nodes.filter((n) => n.ring === RB.id);
    expect(ring.length).toBe(12);
    for (const n of ring) expect(n.links.filter((l) => nodes[l].ring === RB.id && canDrive(n, l)).length).toBe(1);
  });

  it('12 drivers for 3 simulated minutes: round the right way, no jam, and they keep passing through', () => {
    const nodes = ringGraph();
    const world = { boxes: [], roads: { nodes, laneOffset: 2.5 }, half: 6000 } as unknown as World;
    const t = TRAFFIC as unknown as Record<string, number>;
    const over = { liveRadius: 1e9, liveRadiusOut: 1e9, minCars: 12, maxCars: 12, maxLive: 12 };
    const old: Record<string, number> = {};
    for (const [k, v] of Object.entries(over)) { old[k] = t[k]; t[k] = v; }
    onTestFinished(() => { for (const [k, v] of Object.entries(old)) t[k] = v; });
    let s = 99;
    const rnd = vi.spyOn(Math, 'random').mockImplementation(() => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    });
    onTestFinished(() => rnd.mockRestore());

    const traffic = createTraffic(new THREE.Scene(), world);
    const vehicles: Vehicle[] = [];
    const dt = 1 / 30;
    const px = RB.x, pz = RB.z;
    for (let i = 0; i < 6; i++) traffic.update(dt, vehicles, world, px, pz);
    const npcs = vehicles.filter((v) => v.driver === 'npc');
    expect(npcs.length).toBeGreaterThanOrEqual(6);

    const angle = (v: Vehicle): number => Math.atan2(v.z - RB.z, v.x - RB.x);
    const onRingNow = (v: Vehicle): boolean => Math.abs(Math.hypot(v.x - RB.x, v.z - RB.z) - RB.r) < 4;
    const last = new Map<number, { x: number; z: number; t: number }>();
    for (const v of npcs) last.set(v.id, { x: v.x, z: v.z, t: 0 });
    let wrongWay = 0;
    let rightWay = 0;
    let travelled = 0;
    const seen = new Map<number, number>();
    for (let step = 0; step < 3 * 60 * 30; step++) {
      const before = npcs.map((v) => ({ x: v.x, z: v.z, a: angle(v), on: onRingNow(v) }));
      traffic.update(dt, vehicles, world, px, pz);
      collideVehicles(vehicles);
      npcs.forEach((v, i) => {
        const b = before[i];
        const moved = Math.hypot(v.x - b.x, v.z - b.z);
        if (moved < 3) travelled += moved;
        if (b.on && onRingNow(v) && moved > 0.05) {
          const da = Math.atan2(Math.sin(angle(v) - b.a), Math.cos(angle(v) - b.a));
          if (da > 0.004) wrongWay++;
          else if (da < -0.004) rightWay++;
        }
        const l = last.get(v.id)!;
        l.t += dt;
        if (Math.hypot(v.x - l.x, v.z - l.z) > 3) { l.x = v.x; l.z = v.z; l.t = 0; }
        seen.set(v.id, Math.max(seen.get(v.id) ?? 0, l.t));
      });
    }
    const jammed = [...seen.values()].filter((x) => x > 25).length;
    console.log('roundabout: right-way frames', rightWay, 'wrong-way frames', wrongWay, 'travelled', Math.round(travelled), 'jammed', jammed);
    expect(rightWay).toBeGreaterThan(300);
    // A car swinging wide on entry can tick the wrong way for a frame or two; never a lap the wrong way.
    expect(wrongWay).toBeLessThan(rightWay * 0.05);
    expect(jammed).toBeLessThanOrEqual(1);
    expect(travelled).toBeGreaterThan(2500);
  }, 120_000);
});
