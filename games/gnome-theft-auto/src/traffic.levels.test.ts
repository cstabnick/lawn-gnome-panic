import { beforeAll, describe, expect, it, onTestFinished, vi } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { heightAt } from './terrain';
import type { RoadNode, World } from './types';
import { deckContactsAt } from './highways/deck';
import { addSkywayRoads, roadY } from './highways/roads';
import { pickSpot, resetGhostIds, simGraph } from './trafficSim';
import { resetDirectorClock } from './trafficDirectors';
import { TRAFFIC } from './config';
import type { Vehicle, VehicleKind } from './types';

// Vehicle ids of the light records below; each live-traffic run numbers them from 1 again.
const mockIds = vi.hoisted(() => ({ next: 1 }));

// Light vehicle records (no meshes); the real physics, chassis and traffic code run.
vi.mock('./vehicles', async (importOriginal) => {
  const real = await importOriginal<typeof import('./vehicles')>();
  const { VEHICLES } = await import('./config');
  const { heightAt: land } = await import('./terrain');
  return {
    ...real,
    createVehicle: (_s: unknown, kind: VehicleKind, x: number, z: number, yaw: number, tint?: number): Vehicle => ({
      id: mockIds.next++, kind, spec: VEHICLES[kind], x, y: land(x, z), z, yaw, speed: 0, vy: 0, driver: 'none', tint: tint ?? 0,
      object: new THREE.Group(), rider: null, riderLook: null, wheelSpin: 0, steerVis: 0, hp: 1, damage: 0, lastHit: 0, look: {},
    }) as Vehicle,
    syncVehicleMesh: () => undefined,
    setVehicleLook: (v: Vehicle, look: unknown) => { (v as { look?: unknown }).look = look; },
    removeVehicle: () => undefined,
  };
});
vi.mock('./audio', () => ({ play: () => undefined }));
vi.mock('./driverHands', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./driverHands')>()),
  clearHands: () => undefined,
}));
vi.mock('@lawn/gnome', () => ({ createGnomeModel: () => ({ object: new THREE.Group(), update: () => undefined }) }));
vi.mock('./gnomes', () => ({ gnomeState: () => ({ position: new THREE.Vector3() }), randomTownLook: () => ({}), biomeLookFor: () => ({}) }));

let world: World;
let graph: ReturnType<typeof simGraph>;
let createTraffic: typeof import('./traffic').createTraffic;

// The whole-world build takes seconds alone and minutes on a loaded machine (it timed out at the old 120 s under load):
// time is not what this file checks, so the hook and the sims get 5 minutes, and the traffic module loads in the hook.
const LOADED_MS = 300_000;

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('./world');
  world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  addSkywayRoads(world.roads);
  graph = simGraph(world.roads.nodes, world.roads.laneOffset);
  ({ createTraffic } = await import('./traffic'));
}, LOADED_MS);

/** A seeded random source, so the spots are the same every run. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('traffic height follows the road level', () => {
  it('a car on a skyway lane sits at the deck top, a car on the street at the land', () => {
    const nodes = new Map<number, RoadNode>(world.roads.nodes.map((n) => [n.id, n]));
    const rand = lcg(7);
    let deckSpots = 0;
    let groundSpots = 0;
    for (const [cx, cz] of [[255, -60], [0, -60]]) {
      for (let i = 0; i < 200; i++) {
        const spot = pickSpot(
          graph,
          { x: cx, z: cz, minDist: 0, maxDist: 400, viewers: [], avoid: [], clear: 0 },
          rand,
        );
        if (!spot) continue;
        const a = nodes.get(spot.from);
        const b = nodes.get(spot.to);
        if (!a || !b) continue;
        // The materialize rule: a link with a deck node at either end (not a ramp foot joining the street) takes roadY.
        if (a.deck !== undefined && b.deck !== undefined) {
          const y = roadY(a, b, spot.x, spot.z);
          const contacts = deckContactsAt(spot.x, spot.z);
          expect(contacts.some((c) => Math.abs(c.surfaceY - y) <= 0.05)).toBe(true);
          deckSpots++;
        } else if (a.deck === undefined && b.deck === undefined) {
          const y = roadY(a, b, spot.x, spot.z);
          expect(y).toBe(heightAt(spot.x, spot.z));
          groundSpots++;
        }
      }
    }
    expect(deckSpots).toBeGreaterThan(0);
    expect(groundSpots).toBeGreaterThan(0);
  });
});

const LEVELS_SEED = 1;

describe('live traffic keeps its level (chassis on)', () => {
  for (const [name, fx, fz] of [['on the deck', 255, -60], ['under the deck', 0, -60]] as const) {
    it(`cars stay on a surface and never jump levels: focus ${name}`, async () => {
      // Same run every time, alone or in the full suite, in any order (F2): traffic draws its spawns, kinds and turns from
      // Math.random (unseeded, it was a different 14 cars every run), the traffic-warden clock is module state that starts
      // at the wall clock (the Turfton wardens stand on this grid), and vehicle/ghost ids are counters the other run in this
      // file advanced.
      resetDirectorClock();
      resetGhostIds();
      mockIds.next = 1;
      const rnd = vi.spyOn(Math, 'random').mockImplementation(lcg(LEVELS_SEED));
      onTestFinished(() => { rnd.mockRestore(); resetDirectorClock(); });
      const saved = { ...TRAFFIC };
      Object.assign(TRAFFIC, { liveRadius: 1e9, liveRadiusOut: 1e9, minCars: 14, maxCars: 14, maxLive: 14 });
      onTestFinished(() => { Object.assign(TRAFFIC, saved); });
      const traffic = createTraffic(new THREE.Scene(), world);
      const vehicles: Vehicle[] = [];
      const dt = 1 / 30;
      const lastY = new Map<number, number>();
      const bad: string[] = [];
      for (let step = 0; step < 120 * 30; step++) {
        traffic.update(dt, vehicles, world, fx, fz);
        for (const v of vehicles) {
          if (v.driver !== 'npc' || v.spec.boat || v.spec.flies) continue;
          const land = heightAt(v.x, v.z);
          const onLand = Math.abs(v.y - land) < 0.5;
          const onDeck = deckContactsAt(v.x, v.z).some((c) => Math.abs(c.surfaceY - v.y) < 0.5);
          const prev = lastY.get(v.id);
          lastY.set(v.id, v.y);
          const where = `t${step} car ${v.id} at ${v.x.toFixed(0)},${v.z.toFixed(0)}`;
          if (!onLand && !onDeck) bad.push(`${where} y=${v.y.toFixed(2)} land=${land.toFixed(2)}`);
          // A moving car changes height gently (ramps); a jump of a metre in one frame is a level snap (L-skyway-traffic).
          else if (prev !== undefined && Math.abs(v.y - prev) > 1.0) bad.push(`${where} jump ${prev.toFixed(2)}->${v.y.toFixed(2)}`);
        }
      }
      expect(vehicles.filter((v) => v.driver === 'npc').length).toBeGreaterThan(0);
      expect(bad.slice(0, 10)).toEqual([]);
    }, LOADED_MS);
  }
});
