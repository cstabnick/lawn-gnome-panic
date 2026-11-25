// Regression: "a million gnomes sometimes are just chilling in one area". Drives the real pedestrian system on the real
// map for a few simulated minutes and counts idle pedestrians per 12 m cell.
import * as THREE from 'three';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installFakeDom } from './testing/fakeDom';
import { CROWD_CAP, CROWD_CELL } from './npcs';
import type { Fx, Npcs, World } from './types';

vi.mock('./audio', () => ({ play: () => undefined }));

let world: World;
let createNpcs: typeof import('./npcs').createNpcs;

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('./world');
  world = buildWorld(new THREE.Scene(), null as unknown as THREE.WebGLRenderer);
  createNpcs = (await import('./npcs')).createNpcs;
});

function maxIdlePerCell(npcs: Npcs): number {
  const cells = new Map<string, number>();
  for (const n of npcs.list) {
    if (n.state !== 'idle' || n.quest) continue;
    const k = `${Math.floor(n.x / CROWD_CELL)},${Math.floor(n.z / CROWD_CELL)}`;
    cells.set(k, (cells.get(k) ?? 0) + 1);
  }
  return Math.max(0, ...cells.values());
}

/** Seeded Math.random for a run, so the counts are the same on every machine and under load (mulberry32). */
function seedRandom(seed: number): void {
  let a = seed >>> 0;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  });
}

function run(player: (t: number) => [number, number], seconds: number, seed = 1): number {
  seedRandom(seed);
  const npcs = createNpcs(new THREE.Scene(), world, { crack: () => undefined } as unknown as Fx);
  let worst = 0;
  const dt = 0.1;
  for (let t = 0; t < seconds; t += dt) {
    const [px, pz] = player(t);
    npcs.update(dt, world, px, pz, []);
    worst = Math.max(worst, maxIdlePerCell(npcs));
  }
  vi.restoreAllMocks();
  return worst;
}

describe('pedestrian crowds', { timeout: 60_000 }, () => {
  it('parked player: no 12 m cell holds more than CROWD_CAP idle gnomes', () => {
    const worst = run(() => [0, 0], 300);
    console.log('parked max idle per cell', worst);
    expect(worst).toBeLessThanOrEqual(CROWD_CAP);
  });
  it('parked beside a sparse walk-point pocket (3 points in 60 m): gnomes do not all pile onto it', () => {
    // Before the fix pickNear fell back to "any candidate" and seeded/recycled 5 to 7 gnomes onto (-80,339).
    for (const [px, pz] of [[-90, 312], [-83, 408], [108, -364]]) {
      expect(run(() => [px, pz], 120)).toBeLessThanOrEqual(CROWD_CAP - 2);
    }
  });
  it('moving player: no 12 m cell holds more than CROWD_CAP idle gnomes', () => {
    const worst = run((t) => [Math.sin(t / 30) * 200, t * 1.5 - 200], 300);
    console.log('moving max idle per cell', worst);
    expect(worst).toBeLessThanOrEqual(CROWD_CAP);
  });
});
