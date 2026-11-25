import { describe, expect, it } from 'vitest';
import { circleFlock, createFlock, sendFlock, stepFlock } from './flock';
import { WIND_ANY } from './types';
import type { BirdSpecies, FlockEnv, FlockFrame, PerchSpot } from './types';

/** Seeded fake world: flat ground at 0, water only west of x = -50, perches at the asked spot. */
function makeEnv(seed = 7): FlockEnv {
  let s = seed >>> 0;
  return {
    ground: () => 0,
    water: (x) => (x < -50 ? 0.2 : null),
    perch: (kinds, x, z, _radius, out: PerchSpot) => {
      out.x = x;
      out.z = z;
      out.y = kinds[0] === 'water' ? 0.2 : 0;
      out.kind = kinds[0];
      return true;
    },
    rnd: () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    },
  };
}

const sparrow: BirdSpecies = {
  id: 'test-sparrow', name: 'Test Sparrow', group: 'songbird', rarity: 'common', regions: {}, time: {},
  wind: WIND_ANY, prefab: 'bird-songbird', tint: 0x9a7350, trim: 0x6b4a2e, scale: 1, size: 0.25,
  flight: 'flap', speed: 8, altitude: 5, perches: ['ground'], flock: [3, 5], shy: 6,
  call: { kind: 'chirp', hz: 3200, slide: 1, notes: 2, note: 0.1, gap: 0.2 }, callEvery: [4, 8],
  hint: 'Test hint.', blurb: 'Test blurb.',
};

function frame(over: Partial<FlockFrame> = {}): FlockFrame {
  return {
    dt: 0.05, time: 0, playerX: 500, playerZ: 500, onFoot: false, footSpeed: 0,
    threats: [], shot: false, viewing: false, ...over,
  };
}

describe('createFlock', () => {
  it('makes `size` members with distinct ids', () => {
    let n = 0;
    const f = createFlock(1, sparrow, 5, 0, 0, 0, 'perched', makeEnv(), () => ++n);
    expect(f.members.length).toBe(5);
    expect(new Set(f.members.map((m) => m.id)).size).toBe(5);
  });
});

describe('stepFlock', () => {
  it('flushes a perched flock when a walking gnome is 1 unit away', () => {
    const env = makeEnv();
    let n = 0;
    const f = createFlock(1, sparrow, 4, 0, 0, 0, 'perched', env, () => ++n);
    const flushed = stepFlock(f, frame({ onFoot: true, footSpeed: 1, playerX: 1, playerZ: 0 }), env);
    expect(flushed).toBe(true);
    expect(f.mode).toBe('flying');
  });

  it('does not flush a perched flock when the gnome is 100 away', () => {
    const env = makeEnv();
    let n = 0;
    const f = createFlock(1, sparrow, 4, 0, 0, 0, 'perched', env, () => ++n);
    const flushed = stepFlock(f, frame({ onFoot: true, footSpeed: 1, playerX: 100, playerZ: 0 }), env);
    expect(flushed).toBe(false);
    expect(f.mode).toBe('perched');
  });

  it('flushes a perched flock when a fast vehicle passes within range', () => {
    const env = makeEnv();
    let n = 0;
    const f = createFlock(3, sparrow, 3, 0, 0, 0, 'perched', env, () => ++n);
    expect(stepFlock(f, frame({ threats: [{ x: 3, z: 0, speed: 20 }] }), env)).toBe(true);
    expect(f.mode).toBe('flying');
  });

  it('reaches its target and settles within 60 s', () => {
    const env = makeEnv();
    let n = 0;
    const f = createFlock(2, sparrow, 3, 0, 0, 0, 'flying', env, () => ++n);
    sendFlock(f, 30, 0, 0, 'ground', env);
    let settled = false;
    for (let i = 0; i < 1200 && !settled; i++) {
      stepFlock(f, frame(), env);
      if (f.mode === 'perched') settled = true;
    }
    expect(settled).toBe(true);
    expect(Math.hypot(f.x - 30, f.z)).toBeLessThan(1.5);
  });

  it('keeps a runner species on the ground while it runs', () => {
    const env = makeEnv();
    let n = 0;
    const runner: BirdSpecies = { ...sparrow, id: 'test-runner', flight: 'runner', speed: 11 };
    const f = createFlock(4, runner, 3, 0, 0, 0, 'running', env, () => ++n);
    sendFlock(f, 50, 0, 0, 'ground', env);
    let maxY = -Infinity;
    for (let i = 0; i < 2000 && f.mode === 'running'; i++) {
      stepFlock(f, frame(), env);
      maxY = Math.max(maxY, f.y);
      for (const m of f.members) maxY = Math.max(maxY, m.y);
    }
    expect(maxY).toBeLessThanOrEqual(0.01);
    expect(f.x).toBeGreaterThan(40);
  });

  it('folds the wings of a perched flock', () => {
    const env = makeEnv();
    let n = 0;
    const f = createFlock(5, sparrow, 4, 0, 0, 0, 'perched', env, () => ++n);
    stepFlock(f, frame(), env);
    for (const m of f.members) expect(m.wingAngle).toBeCloseTo(-1.35);
  });

  it('circles a soarer without throwing and keeps it above the ground', () => {
    const env = makeEnv();
    let n = 0;
    const soarer: BirdSpecies = { ...sparrow, id: 'test-soarer', flight: 'soar', altitude: 14 };
    const f = createFlock(6, soarer, 2, 0, 0, 0, 'perched', env, () => ++n);
    circleFlock(f, 0, 0, env);
    expect(f.mode).toBe('circling');
    for (let i = 0; i < 200; i++) stepFlock(f, frame({ time: i * 0.05 }), env);
    expect(f.y).toBeGreaterThan(0);
  });

  it('takes different paths when sent to the same far target with different random sequences', () => {
    const a = createFlock(7, sparrow, 3, 0, 0, 0, 'flying', makeEnv(7), () => 1);
    const b = createFlock(8, sparrow, 3, 0, 0, 0, 'flying', makeEnv(99), () => 1);
    const envA = makeEnv(7);
    const envB = makeEnv(99);
    sendFlock(a, 120, 0, 0, 'ground', envA);
    sendFlock(b, 120, 0, 0, 'ground', envB);
    for (let i = 0; i < 100; i++) {
      stepFlock(a, frame(), envA);
      stepFlock(b, frame(), envB);
    }
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(1);
    for (const f of [a, b]) {
      let settled = false;
      for (let i = 0; i < 2400 && !settled; i++) {
        stepFlock(f, frame(), f === a ? envA : envB);
        if (f.mode === 'perched') settled = true;
      }
      expect(settled).toBe(true);
    }
  });

  it('circles clockwise when circleDir is -1', () => {
    const env = makeEnv();
    let n = 0;
    const soarer: BirdSpecies = { ...sparrow, id: 'test-soarer-cw', flight: 'soar', altitude: 14 };
    const f = createFlock(9, soarer, 1, 11, 0, 0, 'perched', env, () => ++n);
    circleFlock(f, 0, 0, env);
    f.circleDir = -1;
    f.circleR = 1;
    f.x = 11;
    f.z = 0;
    f.tx = 0;
    f.tz = 0;
    f.y = f.ty;
    let total = 0;
    let prev = Math.atan2(f.z - f.tz, f.x - f.tx);
    for (let i = 0; i < 20; i++) {
      stepFlock(f, frame({ time: i * 0.05 }), env);
      const cur = Math.atan2(f.z - f.tz, f.x - f.tx);
      total += Math.atan2(Math.sin(cur - prev), Math.cos(cur - prev));
      prev = cur;
    }
    expect(f.mode).toBe('circling');
    expect(total).toBeLessThan(0);
  });

  it('keeps circleR within 0.7..1.6 after circleFlock', () => {
    const soarer: BirdSpecies = { ...sparrow, id: 'test-soarer-r', flight: 'soar', altitude: 14 };
    for (let seed = 1; seed <= 50; seed++) {
      const env = makeEnv(seed);
      let n = 0;
      const f = createFlock(10, soarer, 2, 0, 0, 0, 'perched', env, () => ++n);
      circleFlock(f, 0, 0, env);
      expect(f.circleR).toBeGreaterThanOrEqual(0.7);
      expect(f.circleR).toBeLessThanOrEqual(1.6);
    }
  });
});
