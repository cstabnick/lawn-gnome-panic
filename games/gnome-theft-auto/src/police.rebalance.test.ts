import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { installFakeDom } from './testing/fakeDom';
import { createWatch, lineOfSight } from './police';
import type { Box, Fx, Watch, WatchContext, World } from './types';

const box = (minX: number, maxX: number, minZ: number, maxZ: number, h: number): Box => ({ minX, maxX, minZ, maxZ, h });

describe('lineOfSight', () => {
  it('is clear with no boxes in the way', () => {
    expect(lineOfSight([box(10, 12, 10, 12, 5)], 0, 0, 20, 0)).toBe(true);
  });
  it('is blocked by a tall box on the segment', () => {
    expect(lineOfSight([box(5, 7, -1, 1, 3)], 0, 0, 20, 0)).toBe(false);
    expect(lineOfSight([box(5, 7, -1, 1, 3)], 20, 0, 0, 0)).toBe(false);
  });
  it('ignores a low box', () => {
    expect(lineOfSight([box(5, 7, -1, 1, 1.2)], 0, 0, 20, 0)).toBe(true);
  });
  it('is not blocked by a box beyond the end of the segment', () => {
    expect(lineOfSight([box(30, 32, -1, 1, 3)], 0, 0, 20, 0)).toBe(true);
  });
});

let world: World;
const fx = new Proxy({}, { get: () => () => undefined }) as unknown as Fx;
const ctx = (x: number, z: number): WatchContext => ({ playerX: x, playerZ: z, playerY: 0, playerVehicle: null } as unknown as WatchContext);

function mk(): Watch {
  return createWatch(new THREE.Scene(), world, fx, []);
}

beforeAll(async () => {
  installFakeDom();
  const { buildWorld } = await import('./world');
  world = buildWorld(new THREE.Scene(), undefined as unknown as THREE.WebGLRenderer);
  // A ring of walk points at 20..200 m from the origin, no walls.
  const pts: { x: number; z: number }[] = [];
  for (let r = 20; r <= 200; r += 10) for (let a = 0; a < 16; a++) pts.push({ x: Math.cos((a / 16) * 6.283) * r, z: Math.sin((a / 16) * 6.283) * r });
  world = { ...world, walkPoints: pts as World['walkPoints'], boxes: [] };
}, 120000);

describe('Hat Watch rebalance', () => {
  it('cap clamps addHeat and setCap lowers heat', () => {
    const w = mk();
    w.setCap?.(1);
    w.addHeat(3);
    expect(w.heat).toBe(1);
    w.setCap?.(0);
    expect(w.heat).toBe(0);
    w.addHeat(2);
    expect(w.heat).toBe(0);
    w.setCap?.(null);
    w.addHeat(2);
    expect(w.heat).toBe(2);
  });

  it('dispatches after a delay and never closer than spawnNever', () => {
    const scene = new THREE.Scene();
    const w = createWatch(scene, world, fx, []);
    expect(w.search?.()).toBeNull();
    w.addHeat(1);
    w.update(0.1, ctx(0, 0), world);
    let t = 0.1;
    const guards = scene.children.length;
    for (; t < 5; t += 0.1) {
      w.update(0.1, ctx(0, 0), world);
    }
    expect(scene.children.length).toBe(guards);
    expect(w.search?.()?.dispatchIn).toBeGreaterThan(0);
    for (; t < 6.3; t += 0.1) {
      w.update(0.1, ctx(0, 0), world);
    }
    expect(scene.children.length).toBeGreaterThan(guards);
    for (const c of scene.children.slice(guards)) {
      expect(Math.hypot(c.position.x, c.position.z)).toBeGreaterThanOrEqual(50);
    }
  });

  it('search is null at heat 0 and evade rises while unseen', () => {
    const w = mk();
    expect(w.search?.()).toBeNull();
    w.addHeat(1);
    w.update(0.1, ctx(0, 0), world);
    const a = w.search?.();
    expect(a).not.toBeNull();
    for (let i = 0; i < 40; i++) w.update(0.1, ctx(0, 0), world);
    const b = w.search?.();
    expect(b!.evade).toBeGreaterThan(a!.evade);
  });
});
