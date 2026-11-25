import { describe, expect, it } from 'vitest';
import { SKY } from './config';
import { SKY_BEHAVIOURS } from './behaviours';
import * as THREE from 'three';
import type { Vehicle } from '../types';
import { createSkyTraffic, pickBehaviour, pickSpawn } from './runtime';
import type { SkyContext, SkyWaypoint } from './types';

const square = (half: number): SkyWaypoint[] => [
  { x: -half, z: -half, agl: 70, speed: 30 },
  { x: half, z: -half, agl: 70, speed: 30 },
  { x: half, z: half, agl: 70, speed: 30 },
  { x: -half, z: half, agl: 70, speed: 30 },
];

function ctxAt(x: number, z: number, heat: number, time = 100): SkyContext {
  return {
    playerX: x,
    playerZ: z,
    heat,
    eventActive: false,
    airfield: { x: 0, z: 0, yaw: 0, length: 400 },
    time,
    rng: () => 0.5,
  };
}

describe('pickSpawn', () => {
  it('parked start returns route[0] on the ground', () => {
    const route = square(500);
    const s = pickSpawn(route, 0, 0, false, 'loop');
    expect(s).toEqual({ x: route[0].x, z: route[0].z, agl: 0, next: 0, ground: true });
  });

  it('spawns at a far route point of a big loop and flies on to the next one', () => {
    const route = square(500);
    const s = pickSpawn(route, 0, 0, true, 'loop');
    expect(s.ground).toBe(false);
    const dist = Math.hypot(s.x, s.z);
    expect(dist).toBeGreaterThanOrEqual(SKY.minSpawnDist);
    const k = route.findIndex((p) => p.x === s.x && p.z === s.z);
    expect(k).toBeGreaterThanOrEqual(0);
    expect(s.next).toBe((k + 1) % route.length);
    expect(s.agl).toBe(route[k].agl);
  });

  it('spawns spawnFar away on a small loop around the player and keeps the index', () => {
    const route = square(50);
    const s = pickSpawn(route, 0, 0, true, 'loop');
    expect(Math.hypot(s.x, s.z)).toBeCloseTo(SKY.spawnFar, 0);
    const k = route.findIndex((p) => {
      const dx = p.x, dz = p.z;
      const len = Math.hypot(dx, dz);
      return Math.abs(s.x - (len > 0 ? (dx / len) * SKY.spawnFar : 0)) < 1
        && Math.abs(s.z - (len > 0 ? (dz / len) * SKY.spawnFar : 0)) < 1;
    });
    expect(k).toBeGreaterThanOrEqual(0);
    expect(s.next).toBe(k);
  });

  it("'once' spawns at index 0 and heads for index 1", () => {
    const route = square(500);
    const s = pickSpawn(route, 0, 0, true, 'once');
    expect(s.x).toBe(route[0].x);
    expect(s.z).toBe(route[0].z);
    expect(s.next).toBe(1);
    expect(s.ground).toBe(false);
  });
});

describe('pickBehaviour', () => {
  const none = new Set<string>();
  const noCool = new Map<string, number>();

  it('picks banner-tow at the origin with nothing active', () => {
    const def = pickBehaviour(SKY_BEHAVIOURS, ctxAt(0, 0, 0), none, noCool, 0);
    expect(def?.id).toBe('banner-tow');
    expect(def?.priority).toBe(10);
    expect(def?.radius).toBe(700);
  });

  it('picks another in-range behaviour when banner-tow is active', () => {
    const def = pickBehaviour(SKY_BEHAVIOURS, ctxAt(0, 0, 0), new Set(['banner-tow']), noCool, 1);
    expect(def).not.toBeNull();
    expect(def?.id).not.toBe('banner-tow');
    expect(def?.id).not.toBe('watch-copter');
    expect(def?.id).not.toBe('news-copter');
  });

  it('picks watch-copter at heat 2', () => {
    const def = pickBehaviour(SKY_BEHAVIOURS, ctxAt(0, 0, 2), none, noCool, 0);
    expect(def?.id).toBe('watch-copter');
  });

  it('watch-copter still flies at the normal cap, but nothing else does', () => {
    expect(pickBehaviour(SKY_BEHAVIOURS, ctxAt(0, 0, 2), none, noCool, SKY.maxActive)?.id).toBe('watch-copter');
    expect(pickBehaviour(SKY_BEHAVIOURS, ctxAt(0, 0, 0), none, noCool, SKY.maxActive)).toBeNull();
  });

  it('skips a behaviour still on cooldown', () => {
    const cool = new Map([['banner-tow', 200]]);
    const def = pickBehaviour(SKY_BEHAVIOURS, ctxAt(0, 0, 0), none, cool, 0);
    expect(def?.id).not.toBe('banner-tow');
    expect(def).not.toBeNull();
  });
});

describe('createSkyTraffic aircraft()', () => {
  it('lists the flying aircraft, and their positions move between frames (cutscenes step them too)', () => {
    const vehicles: Vehicle[] = [];
    const sky = createSkyTraffic({
      scene: new THREE.Scene(),
      world: { boxes: [], airfield: { x: 0, z: 0, yaw: 0, length: 400 } } as never,
      vehicles,
      fx: {} as never,
      hud: {} as never,
      economy: { earn: () => {} },
      achievements: { unlock: () => null, increment: () => null },
      heat: () => 0,
      play: () => {},
    });
    expect(sky.aircraft()).toHaveLength(0);
    expect(sky.spawn('banner-tow')).toBe(true);
    const mine = vehicles[vehicles.length - 1];
    sky.update(0.1, 0, 0, 0, null, false);
    expect(sky.aircraft()).toContain(mine);
    const x0 = mine.x;
    const z0 = mine.z;
    for (let i = 0; i < 20; i++) sky.update(0.1, 0, 0, 0, null, false);
    expect(sky.aircraft()).toContain(mine);
    expect(mine.x !== x0 || mine.z !== z0).toBe(true);
    sky.clear();
    expect(sky.aircraft()).toHaveLength(0);
  });
});
