import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCritters, isPlayerHidden, type CritterCtx, type CritterDeps } from '../critters';
import { heightAt } from '../terrain';
import type { Fx, World } from '../types';
import { buildPatches, commonsLife, GRASS_PATCHES, HIVES, inPatch, tallGrassAt } from './commons';

const world = { boxes: [], parked: [], half: 900 } as unknown as World;
const fx = { smash() {}, spark() {} } as unknown as Fx;

function makeDeps() {
  const log = { toasts: [] as string[], events: [] as string[], hurt: 0 };
  const deps: CritterDeps = {
    fx,
    play() {},
    toast: (t) => { log.toasts.push(t); },
    callout() {},
    earn() {},
    steal: () => 0,
    hurtPlayer: (a) => { log.hurt += a; },
    event: (id) => { log.events.push(id); },
  };
  return { deps, log };
}

const ctx = (over: Partial<CritterCtx> = {}): CritterCtx => ({
  dt: 0.05, time: 0, playerX: 0, playerY: 0, playerZ: 0, playerVehicle: null, playerSpeed: 0,
  vehicles: [], world, night: 0, ...over,
});

const car = (x: number, z: number, speed: number) => ({
  x, y: 0, z, yaw: 0, speed, vy: 0, exploded: false, spec: { radius: 1.5, flies: false },
});

describe('tallgrass commons', () => {
  it('grass patches: the centre is tall grass, 20 units outside every patch is not', () => {
    buildPatches();
    expect(tallGrassAt(-800, 480, 0)).toBe(true);
    expect(inPatch(-800, 480)).toBe(true);
    for (const p of GRASS_PATCHES) {
      expect(tallGrassAt(p.x + p.r + 20, p.z, 0)).toBe(false);
    }
  });

  it('hides the player on foot in the grass, not while in a vehicle', () => {
    const { deps, log } = makeDeps();
    const rt = createCritters(new THREE.Scene(), world, deps, [commonsLife]);
    for (const h of HIVES) expect(rt.inGroup(h.id)).toHaveLength(5);

    rt.update(ctx({ time: 1, playerX: -800, playerZ: 480 }));
    expect(isPlayerHidden()).toBe(true);
    expect(log.toasts).toContain('Hidden in the tall grass. The Hat Watch cannot see you.');

    const v = car(-800, 480, 0);
    rt.update(ctx({ time: 1.05, playerX: -800, playerZ: 480, playerVehicle: v as never, vehicles: [v as never] }));
    expect(isPlayerHidden()).toBe(false);
  });

  it('a mower slows in the grass, mows a path, and the grass grows back', () => {
    const { deps } = makeDeps();
    const rt = createCritters(new THREE.Scene(), world, deps, [commonsLife]);
    const v = car(-850, 480, 12);
    const dt = 0.05;
    let t = 0;
    expect(tallGrassAt(-848, 480, 0)).toBe(true);
    for (let i = 0; i < 10; i++) {
      t += dt;
      rt.update(ctx({ dt, time: t, playerX: -900, playerZ: 900, vehicles: [v as never] }));
      v.x += v.speed * dt;
    }
    expect(Math.abs(v.speed)).toBeLessThan(12);
    for (let x = -848; x <= v.x; x += 0.5) expect(tallGrassAt(x, 480, t)).toBe(false);

    // 50 s later, with nothing driving, the path has grown back.
    for (let i = 0; i < 1000; i++) {
      t += dt;
      rt.update(ctx({ dt, time: t, playerX: -900, playerZ: 900 }));
    }
    expect(tallGrassAt(-848, 480, t)).toBe(true);
  });

  it('knocking a hive starts a swarm, and the swarm ends when the player gets 150 away', () => {
    const { deps, log } = makeDeps();
    const rt = createCritters(new THREE.Scene(), world, deps, [commonsLife]);
    const start = rt.list.length;
    const hive = HIVES[0];
    const bees = rt.inGroup(hive.id);
    const hx = bees[0].homeX, hz = bees[0].homeZ;
    rt.update(ctx({ time: 1, playerX: hx, playerZ: hz }));

    expect(rt.hitTest(hx, heightAt(hx, hz) + 0.8, hz)).toBe(true);
    expect(rt.list.length).toBe(start + 6);
    for (const b of rt.inGroup(hive.id)) expect(b.mode).toBe('chase');
    expect(log.toasts).toContain('You knocked a hive! RUN!');
    expect(log.events).toContain('hive-knocked');

    rt.update(ctx({ time: 1.05, playerX: hx, playerZ: hz }));
    expect(log.hurt).toBeGreaterThan(0);

    rt.update(ctx({ time: 1.1, playerX: hx + 150, playerZ: hz }));
    expect(rt.list.length).toBe(start);
    expect(log.events).toContain('swarm-escaped');
  });
});
