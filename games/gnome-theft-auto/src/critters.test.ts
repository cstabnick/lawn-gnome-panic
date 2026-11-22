import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCritters, type CritterCtx, type CritterDeps, type RegionLife } from './critters';
import type { Fx, World } from './types';

const world = { boxes: [], parked: [], half: 900 } as unknown as World;
const fx = { smash() {}, spark() {} } as unknown as Fx;
const deps: CritterDeps = {
  fx, play() {}, toast() {}, callout() {}, earn() {}, steal: () => 0, hurtPlayer() {}, event() {},
};
const ctx = (over: Partial<CritterCtx> = {}): CritterCtx => ({
  dt: 0.05, time: 0, playerX: 0, playerY: 0, playerZ: 400, playerVehicle: null, playerSpeed: 0,
  vehicles: [], world, night: 0, ...over,
});

describe('critters runtime', () => {
  it('spawns a group in its region and keeps it there while wandering', () => {
    const life: RegionLife = {
      id: 't', groups: [{ id: 'cows', kind: 'cow', region: 'cloverfield-farms', x: 100, z: 500, count: 5, spread: 6, leash: 20 }],
    };
    const rt = createCritters(new THREE.Scene(), world, deps, [life]);
    expect(rt.inGroup('cows')).toHaveLength(5);
    for (let i = 0; i < 400; i++) rt.update(ctx({ time: i * 0.05, playerX: 100, playerZ: 470 }));
    for (const c of rt.inGroup('cows')) {
      expect(c.region).toBe('cloverfield-farms');
      expect(Math.hypot(c.x - c.homeX, c.z - c.homeZ)).toBeLessThan(c.leash + 2);
    }
  });

  it('a shot knocks a critter over, it gets up and flees, and it never goes away', () => {
    const rt = createCritters(new THREE.Scene(), world, deps, []);
    const hen = rt.spawn('hen', 50, 500, { region: 'cloverfield-farms' });
    expect(rt.hitTest(hen.x, hen.y + 0.2, hen.z)).toBe(true);
    expect(hen.mode).toBe('down');
    for (let i = 0; i < 60; i++) rt.update(ctx({ playerX: 50, playerZ: 480 }));
    expect(['flee', 'idle', 'wander']).toContain(hen.mode);
    expect(rt.list).toContain(hen);
  });

  it('onHit lets a region life replace the knock-over', () => {
    let shrugs = 0;
    const life: RegionLife = { id: 'b', groups: [], onHit: () => { shrugs++; return true; } };
    const rt = createCritters(new THREE.Scene(), world, deps, [life]);
    const bear = rt.spawn('polar-bear', 200, -700, { region: 'frostbite-fells' });
    rt.knock(bear, 0, 0, 'vehicle');
    expect(shrugs).toBe(1);
    expect(bear.mode).not.toBe('down');
  });

  it('a moving vehicle frightens, a fast one knocks over', () => {
    const rt = createCritters(new THREE.Scene(), world, deps, []);
    const sheep = rt.spawn('sheep', 0, 500, { region: 'cloverfield-farms' });
    const car = { x: 0, y: 0, z: 490, speed: 2.5, exploded: false, spec: { radius: 1.5, flies: false } };
    rt.update(ctx({ vehicles: [car as never], playerX: 0, playerZ: 480 }));
    expect(sheep.mode).toBe('flee');
    car.x = sheep.x; car.z = sheep.z - 1; car.speed = 12;
    rt.update(ctx({ vehicles: [car as never], playerX: 0, playerZ: 480 }));
    expect(sheep.mode).toBe('down');
  });
});
