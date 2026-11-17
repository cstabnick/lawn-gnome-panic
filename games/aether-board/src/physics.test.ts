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
      // Pure pursuit onto the exit line (the big kicker's centre line, or the halfpipe's), 14 m ahead along it.
      const pipe = w.pipes.find((pp) => pp.from === p.island);
      const k = isl.kickers.find((kk) => kk.big);
      const ox = pipe ? pipe.sx : k!.x, oz = pipe ? pipe.sz : k!.z, oyaw = pipe ? pipe.yaw : k!.yaw;
      const olen = pipe ? pipe.len : k!.len;
      const fx = Math.sin(oyaw), fz = Math.cos(oyaw);
      const u = Math.min(olen, (p.pos.x - ox) * fx + (p.pos.z - oz) * fz + 14);
      const tx = ox + fx * u, tz = oz + fz * u;
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
      if (e.e === 'respawn' || e.e === 'skyfall') respawns++;
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

describe('flips', () => {
  it('holding push through a takeoff does not front flip; pressing it again in the air does', () => {
    const w = generateWorld(1);
    const p = createPlayer(w);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 2; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    for (let i = 0; i < 20; i++) stepPlayer(p, { ...NO_INPUT, lean: 1, jump: true }, null, w, DT, ev);
    for (let i = 0; i < 30; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    expect(p.mode).toBe('air');
    expect(Math.abs(p.flip)).toBeLessThan(0.05);
    stepPlayer(p, NO_INPUT, null, w, DT, ev);
    for (let i = 0; i < 10; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    expect(p.flip).toBeGreaterThan(0.1);
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

describe('halfpipes and falling', () => {
  it('carving hard into a pipe wall goes up it and comes back down inside the pipe', () => {
    const w = generateWorld(1);
    const pp = w.pipes[0];
    const p = createPlayer(w);
    const fx = Math.sin(pp.yaw), fz = Math.cos(pp.yaw);
    // Start on the floor 20 m in, moving down the pipe and toward its right wall.
    const x = pp.sx + fx * 20, z = pp.sz + fz * 20;
    p.pos.set(x, pp.y0 - pp.slope * 20 + 0.01, z);
    const rx = -fz, rz = fx; // right of travel
    p.vel.set(fx * 22 + rx * 10, 0, fz * 22 + rz * 10);
    p.heading = Math.atan2(p.vel.x, p.vel.z);
    const ev: PhysEvent[] = [];
    let maxUp = -Infinity;
    for (let i = 0; i < SIM_HZ * 4; i++) {
      stepPlayer(p, NO_INPUT, null, w, DT, ev);
      const u = (p.pos.x - pp.sx) * fx + (p.pos.z - pp.sz) * fz;
      maxUp = Math.max(maxUp, p.pos.y - (pp.y0 - pp.slope * u)); // height above the pipe floor under you
    }
    expect(maxUp).toBeGreaterThan(3); // went up the wall
    expect(ev.some((e) => e.e === 'skyfall' || e.e === 'respawn')).toBe(false); // never fell out
  });

  it('riding off the side of an island drops you out of the sky onto the next one, and you land', () => {
    const w = generateWorld(1);
    const p = createPlayer(w);
    const isl = w.islands[0];
    // Ride straight off the right-hand rim.
    p.heading = Math.atan2(isl.dz, -isl.dx) + Math.PI;
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 14; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    const fall = ev.findIndex((e) => e.e === 'skyfall');
    expect(fall).toBeGreaterThanOrEqual(0);
    expect(ev.slice(fall).some((e) => e.e === 'land')).toBe(true);
    expect(ev.some((e) => e.e === 'respawn')).toBe(false);
  });
});
