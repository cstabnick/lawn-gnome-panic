import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createCritters, type CritterCtx, type CritterDeps } from '../critters';
import type { Fx, Vehicle, World } from '../types';
import { cloverfieldLife } from './cloverfield';

const makeWorld = () => ({ boxes: [], parked: [], half: 900 }) as unknown as World;
const fx = { smash() {}, spark() {} } as unknown as Fx;
const makeDeps = () => {
  const d = {
    fx, play: vi.fn(), toast: vi.fn(), callout: vi.fn(), earn: vi.fn(), steal: () => 0, hurtPlayer: vi.fn(), event: vi.fn(),
  };
  return d as typeof d & CritterDeps;
};
const ctx = (over: Partial<CritterCtx> = {}): CritterCtx => ({
  dt: 0.05, time: 0, playerX: 0, playerY: 0, playerZ: 0, playerVehicle: null, playerSpeed: 0,
  vehicles: [], world: makeWorld(), night: 0, ...over,
});

describe('cloverfield farms life', () => {
  it('every group spawns with its count, in cloverfield-farms', () => {
    const rt = createCritters(new THREE.Scene(), makeWorld(), makeDeps(), [cloverfieldLife]);
    const expected: Record<string, number> = {
      'clover-cows-west': 6, 'clover-cows-east': 5, 'clover-sheep-south': 8, 'clover-sheep-west': 7,
      'clover-pigs': 4, 'clover-hens-granny': 10, 'clover-hens-east': 8,
    };
    for (const [id, n] of Object.entries(expected)) {
      const members = rt.inGroup(id);
      expect(members).toHaveLength(n);
      for (const c of members) expect(c.region).toBe('cloverfield-farms');
    }
  });

  it('a moving combine herds a cow 10 units behind it: flee along its heading', () => {
    const rt = createCritters(new THREE.Scene(), makeWorld(), makeDeps(), [cloverfieldLife]);
    const cow = rt.inGroup('clover-cows-west')[0];
    const combine = {
      kind: 'combine', x: cow.x, y: 0, z: cow.z - 10, yaw: 0, speed: 5, vy: 0, driver: 'player',
      spec: { radius: 2, flies: false }, exploded: false,
    } as unknown as Vehicle;
    rt.update(ctx({ playerVehicle: combine, vehicles: [combine], playerX: combine.x, playerZ: combine.z, playerSpeed: 0 }));
    expect(cow.mode).toBe('flee');
    expect(cow.fleeDir).not.toBeNull();
    expect(cow.fleeDir!.x).toBeCloseTo(0, 5);
    expect(cow.fleeDir!.z).toBeCloseTo(1, 5);
  });

  it('a player on foot running into an idle cow tips it once; a second contact within 20 s earns nothing', () => {
    const deps = makeDeps();
    const rt = createCritters(new THREE.Scene(), makeWorld(), deps, [cloverfieldLife]);
    const cow = rt.inGroup('clover-cows-west')[0];
    const runAt = (px: number, pz: number) => {
      cow.mode = 'idle';
      cow.modeT = 100;
      rt.update(ctx({ playerX: px, playerZ: pz, playerSpeed: 6 }));
    };
    runAt(cow.x + 1.0, cow.z);
    expect(cow.mode).toBe('down');
    expect(deps.earn).toHaveBeenCalledTimes(1);
    expect(deps.earn).toHaveBeenCalledWith(20, 'Cow Tipping');

    for (let i = 0; i < 100; i++) rt.update(ctx({ time: i * 0.05, playerX: -900, playerZ: -900 }));
    runAt(cow.x + 1.0, cow.z);
    expect(cow.mode).toBe('idle');
    expect(deps.earn).toHaveBeenCalledTimes(1);
  });

  it('after 600 updates of 0.05 s no critter has been removed', () => {
    const rt = createCritters(new THREE.Scene(), makeWorld(), makeDeps(), [cloverfieldLife]);
    const before = rt.list.length;
    for (let i = 0; i < 600; i++) rt.update(ctx({ time: i * 0.05, playerX: -140, playerZ: 470, playerSpeed: 2 }));
    expect(rt.list).toHaveLength(before);
  });
});
