import { describe, expect, it } from 'vitest';
import { NO_INPUT, SIM_HZ, type Input, type PhysEvent } from './config';
import { generateWorld, groundAt } from './world';
import { createPlayer, stepPlayer } from './physics';

const DT = 1 / SIM_HZ;

/** Rides straight at the current island's exit kicker, never steering in the air. */
function autopilot(seed: number, seconds: number, pop = false) {
  const w = generateWorld(seed);
  const p = createPlayer(w);
  const events: PhysEvent[] = [];
  let maxIsland = 0;
  let maxSpeed = 0;
  let respawns = 0;
  let lands = 0;
  let bails = 0;
  let airMax = 0;
  for (let i = 0; i < seconds * SIM_HZ; i++) {
    const inp: Input = { ...NO_INPUT, stick: { x: 0, y: 0 } };
    if (p.mode === 'ground') {
      const isl = w.islands[p.island];
      const k = isl.kickers[isl.kickers.length - 1];
      // Pure pursuit onto the kicker's centre line, 14 m ahead of where we are along it.
      const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
      const u = Math.min(k.len, (p.pos.x - k.x) * fx + (p.pos.z - k.z) * fz + 14);
      const tx = k.x + fx * u, tz = k.z + fz * u;
      const want = Math.atan2(tx - p.pos.x, tz - p.pos.z);
      const travel = p.vel.lengthSq() > 1 ? Math.atan2(p.vel.x, p.vel.z) : p.heading;
      const diff = Math.atan2(Math.sin(want - travel), Math.cos(want - travel));
      inp.steer = Math.max(-1, Math.min(1, -diff * 3));
      inp.lean = 1;
    }
    const ev: PhysEvent[] = [];
    stepPlayer(p, inp, null, w, DT, ev);
    for (const e of ev) {
      events.push(e);
      if (e.e === 'respawn') respawns++;
      if (e.e === 'land') { lands++; airMax = Math.max(airMax, e.airT); }
      if (e.e === 'bail') bails++;
    }
    maxIsland = Math.max(maxIsland, p.island);
    maxSpeed = Math.max(maxSpeed, p.vel.length());
    expect(Number.isFinite(p.pos.x + p.pos.y + p.pos.z)).toBe(true);
  }
  void pop;
  return { w, p, maxIsland, maxSpeed, respawns, lands, bails, airMax, events };
}

describe('world', () => {
  it('spawn is on the first island and generation is deterministic', () => {
    const a = generateWorld(7);
    const b = generateWorld(7);
    expect(a.islands.length).toBe(b.islands.length);
    expect(a.islands[5].cx).toBe(b.islands[5].cx);
    const g = groundAt(a, a.spawn.pos.x, a.spawn.pos.z, a.spawn.pos.y + 1);
    expect(g?.island).toBe(0);
    expect(a.rails.some((r) => r.ley)).toBe(true);
  });
});

describe('riding', () => {
  for (const seed of [1, 2, 3, 6]) {
    it(`autopilot flows down the island chain (seed ${seed})`, () => {
      const r = autopilot(seed, 90);
      expect(r.maxIsland).toBeGreaterThanOrEqual(10);
      expect(r.maxSpeed).toBeGreaterThan(20);
    });
  }
  it('an ollie on flat-ish ground gets air and lands clean', () => {
    const w = generateWorld(1);
    const p = createPlayer(w);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 2; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    for (let i = 0; i < 20; i++) stepPlayer(p, { ...NO_INPUT, jump: true }, null, w, DT, ev);
    stepPlayer(p, NO_INPUT, null, w, DT, ev);
    expect(p.mode).toBe('air');
    for (let i = 0; i < SIM_HZ * 2; i++) stepPlayer(p, NO_INPUT, null, w, DT, ev);
    expect(ev.some((e) => e.e === 'land')).toBe(true);
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
  });
});

describe('tricks through the physics', () => {
  it('pull back then flick up-left: a kickflip that pops, finishes and lands clean', async () => {
    const { createRecognizer } = await import('./tricks');
    const w = generateWorld(1);
    const p = createPlayer(w);
    const rec = createRecognizer();
    const ev: PhysEvent[] = [];
    const step = (stick: { x: number; y: number }, n: number, lean = 0) => {
      for (let i = 0; i < n; i++) {
        const cmd = rec.feed(stick, p.mode, DT);
        stepPlayer(p, { ...NO_INPUT, lean, stick }, cmd, w, DT, ev);
      }
    };
    step({ x: 0, y: 0 }, SIM_HZ * 2, 1);           // roll
    step({ x: 0, y: -1 }, 20);                      // pull back (crouch)
    step({ x: -0.7, y: 0.7 }, 6);                   // flick up-left
    step({ x: 0, y: 0 }, SIM_HZ * 3);               // let it fly and land
    expect(ev.find((e) => e.e === 'pop')).toEqual({ e: 'pop', trick: 'kickflip' });
    expect(ev.some((e) => e.e === 'trickDone' && e.trick === 'kickflip')).toBe(true);
    expect(ev.some((e) => e.e === 'land')).toBe(true);
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
  });
});
