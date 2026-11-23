import { describe, expect, it } from 'vitest';
import { fishById } from './species';
import { RODS, BAITS } from './tackle';
import { createFishingState, forceBite, resetFishing, stepFishing } from './sim';
import type { FishEvent, FishSpecies, FishingState, SimEnv, SimInput } from './types';

const DT = 1 / 60;
const gudgeon = fishById('fish-gudgeon')!;
const mossjaw = fishById('fish-old-mossjaw')!;

/** A seeded LCG so every run is the same. */
function seeded(seed: number): () => number {
  let v = seed;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

function makeEnv(fish: FishSpecies, size: number, opts: { water?: () => number | null; seed?: number } = {}): SimEnv {
  return {
    rod: RODS[0],
    bait: BAITS[0],
    origin: { x: 0, y: 1.4, z: 0, yaw: 0 },
    water: opts.water ?? (() => 0),
    biteDelay: () => 2,
    pick: () => ({ fish, size }),
    rnd: seeded(opts.seed ?? 7),
  };
}

function newInput(): SimInput {
  return { hold: false, pressed: false, released: false };
}

/** Step n frames with the input as it is now; collect the events. */
function run(s: FishingState, inp: SimInput, env: SimEnv, seconds: number, events: FishEvent[] = []): FishEvent[] {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    const ev = stepFishing(s, inp, env, DT);
    if (ev) events.push(ev);
    inp.pressed = false;
    inp.released = false;
  }
  return events;
}

/** Press, hold for `charge` seconds, release, then fly until the bobber lands. */
function castFull(s: FishingState, inp: SimInput, env: SimEnv, holdSeconds: number): FishEvent[] {
  const events: FishEvent[] = [];
  inp.pressed = true;
  inp.hold = true;
  stepFishing(s, inp, env, DT);
  inp.pressed = false;
  run(s, inp, env, holdSeconds, events);
  inp.hold = false;
  inp.released = true;
  events.push(...run(s, inp, env, 1, []));
  return events;
}

/** Step until the bite is on (at most 30 s). Returns the events seen on the way. */
function waitForBite(s: FishingState, inp: SimInput, env: SimEnv): FishEvent[] {
  const events: FishEvent[] = [];
  for (let i = 0; i < 30 / DT && s.phase !== 'bite'; i++) {
    const ev = stepFishing(s, inp, env, DT);
    if (ev) events.push(ev);
    inp.pressed = false;
  }
  expect(s.phase).toBe('bite');
  return events;
}

/** A state waiting at the bobber (after a cast with the given hold time). */
function waitingState(env: SimEnv, holdSeconds = 1.2): { s: FishingState; inp: SimInput } {
  const s = createFishingState();
  const inp = newInput();
  castFull(s, inp, env, holdSeconds);
  expect(s.phase).toBe('wait');
  return { s, inp };
}

describe('casting', () => {
  it('a held cast flies out along +z and plops', () => {
    const env = makeEnv(gudgeon, 13);
    const s = createFishingState();
    const inp = newInput();
    inp.pressed = true;
    inp.hold = true;
    stepFishing(s, inp, env, DT);
    expect(s.phase).toBe('charge');
    inp.pressed = false;
    run(s, inp, env, 0.6);
    inp.hold = false;
    inp.released = true;
    const events: FishEvent[] = [];
    const n = Math.round(1 / DT);
    for (let i = 0; i < n; i++) {
      const ev = stepFishing(s, inp, env, DT);
      if (ev) events.push(ev);
      inp.released = false;
      if (s.phase === 'wait') break;
    }
    expect(events).toEqual(['cast', 'plop']);
    expect(s.phase).toBe('wait');
    const expected = 3 + s.charge * (env.rod.castRange - 3);
    expect(s.charge).toBeGreaterThan(0.4);
    expect(s.charge).toBeLessThan(0.7);
    expect(Math.abs(s.bobZ - expected)).toBeLessThan(0.5);
    expect(Math.abs(s.bobX)).toBeLessThan(1e-9);
    expect(s.bobY).toBe(0);
  });

  it('with no water in reach the cast is dry and the line goes idle', () => {
    const env = makeEnv(gudgeon, 13, { water: () => null });
    const s = createFishingState();
    const inp = newInput();
    inp.pressed = true;
    inp.hold = true;
    stepFishing(s, inp, env, DT);
    inp.pressed = false;
    run(s, inp, env, 0.3);
    inp.hold = false;
    inp.released = true;
    const events = run(s, inp, env, 0.05);
    expect(events).toEqual(['dry']);
    expect(s.phase).toBe('idle');
  });
});

describe('waiting', () => {
  it('nibbles come before the bite, and pressing early gives "early"', () => {
    const env = makeEnv(gudgeon, 13);
    const { s, inp } = waitingState(env);
    const events = waitForBite(s, inp, env);
    const nibble = events.indexOf('nibble');
    const bite = events.indexOf('bite');
    expect(nibble).toBeGreaterThanOrEqual(0);
    expect(bite).toBeGreaterThan(nibble);
    expect(s.phase).toBe('bite');

    const env2 = makeEnv(gudgeon, 13);
    const early = waitingState(env2);
    early.inp.pressed = true;
    const got = stepFishing(early.s, early.inp, env2, DT);
    expect(got).toBe('early');
    expect(early.s.phase).toBe('idle');
  });
});

describe('biting', () => {
  it('no press after a bite gives "missed" and back to waiting', () => {
    const env = makeEnv(gudgeon, 13);
    const { s, inp } = waitingState(env);
    const events = run(s, inp, env, 4);
    expect(events).toContain('bite');
    expect(events).toContain('missed');
    expect(s.phase).toBe('wait');
    expect(s.fish).toBeNull();
  });
});

describe('fighting', () => {
  it('gudgeon: a player who holds under 0.7 tension lands it within 40 s', () => {
    const env = makeEnv(gudgeon, 13, { seed: 11 });
    const { s, inp } = waitingState(env);
    const events: FishEvent[] = [];
    let hooked = false;
    for (let i = 0; i < 40 / DT && s.phase !== 'landed' && s.phase !== 'lost'; i++) {
      if (s.phase === 'bite' && !hooked) {
        inp.pressed = true;
        hooked = true;
      }
      inp.hold = s.phase === 'reel' && s.tension < 0.7;
      const ev = stepFishing(s, inp, env, DT);
      if (ev) events.push(ev);
      inp.pressed = false;
    }
    expect(events).toContain('hooked');
    expect(events).toContain('landed');
    expect(s.phase).toBe('landed');
    expect(s.fish).toBe(gudgeon);
    expect(s.size).toBe(13);
  });

  it('gudgeon never reeled slips the clip', () => {
    const env = makeEnv(gudgeon, 13, { seed: 3 });
    const { s, inp } = waitingState(env);
    const events = waitForBite(s, inp, env);
    inp.pressed = true;
    run(s, inp, env, 40, events);
    expect(events).toContain('hooked');
    expect(events).toContain('slipped');
    expect(events).not.toContain('landed');
    expect(s.phase).toBe('lost');
  });

  it('old mossjaw with the twig rod, always reeling, snaps the clip', () => {
    const env = makeEnv(mossjaw, 220, { seed: 5 });
    const { s, inp } = waitingState(env, 1.2);
    const events = waitForBite(s, inp, env);
    inp.pressed = true;
    inp.hold = true;
    run(s, inp, env, 40, events);
    expect(events).toContain('hooked');
    expect(events).toContain('snapped');
    expect(events).not.toContain('landed');
    expect(s.phase).toBe('lost');
  });
});

describe('forceBite', () => {
  it('only works while waiting', () => {
    const env = makeEnv(gudgeon, 13);
    const s = createFishingState();
    expect(forceBite(s, gudgeon, 12)).toBe(false);
    expect(s.phase).toBe('idle');

    const waiting = waitingState(env).s;
    expect(forceBite(waiting, mossjaw, 200)).toBe(true);
    expect(waiting.phase).toBe('bite');
    expect(waiting.fish).toBe(mossjaw);
    expect(waiting.size).toBe(200);
    expect(waiting.dip).toBe(1);

    resetFishing(waiting);
    expect(waiting.phase).toBe('idle');
    expect(waiting.fish).toBeNull();
    expect(forceBite(waiting, gudgeon, 12)).toBe(false);
  });
});
