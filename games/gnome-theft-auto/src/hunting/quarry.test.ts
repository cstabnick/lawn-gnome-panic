import { describe, expect, it } from 'vitest';
import {
  alarmQuarry, canComb, combQuarry, createQuarry, quarryContains, shootQuarry, stepQuarry,
  type Quarry, type QuarryEnv, type QuarryFrame,
} from './quarry';
import { SPECIES_BY_ID, HUNT, type HuntSpecies } from './species';

/** Seeded PRNG (mulberry32) so the tests are deterministic. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeEnv(seed = 1): QuarryEnv {
  const rnd = seeded(seed);
  return { ground: () => 0, open: () => true, rnd };
}

function frame(over: Partial<QuarryFrame> = {}): QuarryFrame {
  return { dt: 1 / 30, playerX: 0, playerZ: 0, noise: 0.15, night: 0.5, shot: false, ...over };
}

function spawn(id: string, x: number, z: number, env = makeEnv()): Quarry {
  const species: HuntSpecies = SPECIES_BY_ID[id as keyof typeof SPECIES_BY_ID];
  return createQuarry(1, species, x, z, env);
}

/** Steps `seconds` at frame rate `dt` with a fixed frame template. */
function run(q: Quarry, env: QuarryEnv, seconds: number, over: Partial<QuarryFrame> = {}): void {
  const dt = 1 / 30;
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) stepQuarry(q, frame({ dt, ...over }), env);
}

describe('quarry simulation', () => {
  it('a grazing quarry far away stays calm', () => {
    const env = makeEnv(2);
    const q = spawn('fox', 100, 100, env);
    run(q, env, 10, { playerX: 0, playerZ: 0, noise: 1 });
    expect(q.awareness).toBeLessThan(HUNT.wary);
    expect(q.mode).not.toBe('flee');
    expect(q.mode).not.toBe('down');
  });

  it('a running gnome inside hearing range turns a fox wary, then it flees and the distance grows', () => {
    const env = makeEnv(3);
    const q = spawn('fox', 10, 0, env);
    // Player at the origin, fox at x = 10: heard and seen while the gnome runs (noise 1).
    let sawWary = false;
    for (let i = 0; i < 30 * 3 && q.mode !== 'flee'; i++) {
      stepQuarry(q, frame({ noise: 1, playerX: 0, playerZ: 0 }), env);
      if (q.mode === 'wary') sawWary = true;
    }
    expect(sawWary).toBe(true);
    expect(q.mode).toBe('flee');
    const d0 = Math.hypot(q.x, q.z);
    run(q, env, 1, { noise: 1 });
    expect(Math.hypot(q.x, q.z)).toBeGreaterThan(d0);
  });

  it('a rolling hedgehog rolls up, and a shot bounces off it', () => {
    const env = makeEnv(4);
    const q = spawn('hedgehog', 3, 0, env);
    for (let i = 0; i < 30 * 3 && q.mode !== 'rolled'; i++) {
      stepQuarry(q, frame({ noise: 1 }), env);
    }
    expect(q.mode).toBe('rolled');
    expect(shootQuarry(q, 0, -5, 5)).toBe('bounced');
    expect(q.mode).toBe('rolled');
  });

  it('a shot downs a running fox: combable in range, and fleeing a second after downTime', () => {
    const env = makeEnv(5);
    const q = spawn('fox', 20, 0, env);
    expect(shootQuarry(q, 0, -20, 20)).toBe('downed');
    expect(q.mode).toBe('down');
    expect(q.lastShotDist).toBe(20);
    expect(canComb(q, 0, -20 + 1)).toBe(false); // out of range from a distant gnome
    const near = q.x - 1;
    expect(canComb(q, near, q.z)).toBe(true);
    expect(Math.abs(q.x - near)).toBeLessThanOrEqual(HUNT.combRange);
    run(q, env, SPECIES_BY_ID.fox.downTime + 1, { playerX: 20, playerZ: -20 });
    expect(q.mode).toBe('flee');
  });

  it('combing sets the recomb timer: canComb is false after a second shot', () => {
    const env = makeEnv(6);
    const q = spawn('fox', 0, 0, env);
    shootQuarry(q, 0, -1, 1);
    expect(canComb(q, 0, 0)).toBe(true);
    combQuarry(q, 0, 0);
    expect(q.combedT).toBe(HUNT.recombSeconds);
    expect(q.tip).toBe(0);
    expect(q.mode).toBe('flee');
    shootQuarry(q, 0, -1, 1);
    expect(q.mode).toBe('down');
    expect(canComb(q, 0, 0)).toBe(false);
  });

  it('a night species is hidden at night 0 and cannot be hit', () => {
    const env = makeEnv(7);
    const q = spawn('old-grizzle', 0, 0, env);
    stepQuarry(q, frame({ night: 0 }), env);
    expect(q.mode).toBe('hidden');
    expect(quarryContains(q, q.x, q.y + 0.2, q.z)).toBe(false);
    expect(shootQuarry(q, 0, -5, 5)).toBe('miss');
    // Dusk brings it out.
    stepQuarry(q, frame({ night: 0.5 }), env);
    expect(q.mode).not.toBe('hidden');
  });

  it('a flushed mallard gains lift above 1 unit', () => {
    const env = makeEnv(8);
    const q = spawn('mallard', 5, 0, env);
    for (let i = 0; i < 30 * 3 && q.mode !== 'flying'; i++) {
      stepQuarry(q, frame({ noise: 1, night: 0.2 }), env);
    }
    expect(q.mode).toBe('flying');
    run(q, env, 1, { night: 0.2, noise: 0 });
    expect(q.lift).toBeGreaterThan(1);
    expect(q.y).toBeCloseTo(q.lift, 6);
  });

  it('alarmQuarry makes a calm grazing quarry run from the given point', () => {
    const env = makeEnv(9);
    const q = spawn('fox', 0, 0, env);
    alarmQuarry(q, 5, 0);
    stepQuarry(q, frame({ playerX: 100, playerZ: 100 }), env);
    expect(q.mode).toBe('flee');
    expect(q.fromX).toBe(5);
    expect(q.fromZ).toBe(0);
  });
});
