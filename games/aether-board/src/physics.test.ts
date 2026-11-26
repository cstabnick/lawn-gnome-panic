import { describe, expect, it } from 'vitest';
import { NO_INPUT, SIM_HZ, type Input, type PhysEvent } from './config';
import { generateWorld, groundAt } from './world';
import { createPlayer, stepPlayer } from './physics';

const DT = 1 / SIM_HZ;

/** Rides straight at the current island's exit kicker, never steering in the air. */
function autopilot(seed: number, seconds: number, pop = false, course = false) {
  const w = generateWorld(seed);
  // The terrain tests ride the bare mountain: the race course's obstacles are for players to dodge (course = true keeps them).
  if (!course) {
    w.hazards.length = 0;
    w.bumpers.length = 0;
  }
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
      // Joined runs: ride down the run's centre line to its end.
      const ra = isl.r * isl.stretch;
      const ox = pipe ? pipe.sx : k ? k.x : isl.cx - isl.dx * ra, oz = pipe ? pipe.sz : k ? k.z : isl.cz - isl.dz * ra;
      const oyaw = pipe ? pipe.yaw : k ? k.yaw : Math.atan2(isl.dx, isl.dz);
      const olen = pipe ? pipe.len : k ? k.len : 2 * ra + 20;
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
    expect(a.rails.some((r) => r.side !== undefined)).toBe(true);
  });

  it('side-mountain rails start and end over an island and extend past the side edge in the middle', () => {
    const w = generateWorld(7);
    const sideRails = w.rails.filter((r) => r.side !== undefined);
    expect(sideRails.length).toBeGreaterThan(0);
    for (const r of sideRails) {
      const first = r.pts[0];
      const mid = r.pts[Math.floor(r.pts.length / 2)];
      const last = r.pts[r.pts.length - 1];
      expect(groundAt(w, first.x, first.z, first.y + 1)).not.toBeNull();
      expect(groundAt(w, last.x, last.z, last.y + 1)).not.toBeNull();
      expect(groundAt(w, mid.x, mid.z, mid.y + 5)).toBeNull();
    }
  });

  it('a player can grind a side-mountain rail out over the edge and return to the mountain', () => {
    const w = generateWorld(7);
    const r = w.rails.find((rl) => rl.side !== undefined)!;
    const p = createPlayer(w);
    const dir = r.pts[2].clone().sub(r.pts[0]).normalize();
    p.pos.copy(r.pts[1]).addScaledVector(dir, 0.2);
    p.pos.y += 0.2;
    p.vel.copy(dir).multiplyScalar(25);
    p.mode = 'air';
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 3; i++) {
      stepPlayer(p, { ...NO_INPUT, stick: { x: 0, y: 0 } }, null, w, DT, ev);
    }
    expect(ev.some((e) => e.e === 'grindStart')).toBe(true);
    expect(ev.some((e) => e.e === 'grindEnd')).toBe(true);
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
    expect(ev.some((e) => e.e === 'skyfall')).toBe(false);
  });
});

describe('riding', () => {
  for (const seed of [1, 2, 3, 6]) {
    it(`autopilot flows down the island chain (seed ${seed})`, () => {
      const r = autopilot(seed, 150);
      expect(r.maxIsland).toBeGreaterThanOrEqual(10); // the whole mountain (12 long runs) in 150 s, hands off
      expect(r.respawns).toBeLessThanOrEqual(2);       // sky-falls count here
      expect(r.maxSpeed).toBeGreaterThan(20);
    });
  }
  for (const seed of [1, 3]) {
    it(`autopilot still gets to the bottom through the race course's obstacles (seed ${seed})`, () => {
      const r = autopilot(seed, 200, false, true);
      expect(r.maxIsland).toBeGreaterThanOrEqual(10); // it never dodges: it bails on some rocks and bounces off posts
      expect(r.events.some((e) => e.e === 'bump')).toBe(true);
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
    w.bumpers.length = 0; // no side walls: they would keep you on (see the bumper tests)
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

describe('every pop trick through the recognizer and the physics', () => {
  it('pops, finishes and lands clean for each GROUND_GESTURES entry', async () => {
    const { createRecognizer } = await import('./tricks');
    const { GROUND_GESTURES } = await import('./config');
    const Z: Record<string, { x: number; y: number }> = {
      N: { x: 0, y: 1 }, NE: { x: 0.7, y: 0.7 }, E: { x: 1, y: 0 }, NW: { x: -0.7, y: 0.7 }, W: { x: -1, y: 0 }, S: { x: 0, y: -1 },
    };
    for (const g of GROUND_GESTURES) {
      const w = generateWorld(3);
      const p = createPlayer(w);
      const rec = createRecognizer();
      const ev: PhysEvent[] = [];
      const run = (stick: { x: number; y: number }, s: number, grab: 0 | 1, lean = 0) => {
        for (let i = 0; i < Math.round(s * SIM_HZ); i++) {
          const cmd = rec.feed(stick, p.mode, DT, grab !== 0);
          stepPlayer(p, { ...NO_INPUT, stick, grab, lean }, cmd, w, DT, ev);
        }
      };
      const mod = g.mod ? 1 : 0;
      run({ x: 0, y: 0 }, 1.5, 0, 1);
      run(Z.S, 0.15, mod);
      for (const z of g.path) run(Z[z], 0.05, mod);
      run({ x: 0, y: 0 }, 0.3, mod);
      run({ x: 0, y: 0 }, 2.5, 0);
      const pop = ev.find((e) => e.e === 'pop') as { trick: string } | undefined;
      expect(pop?.trick, g.trick).toBe(g.trick);
      if (g.trick !== 'ollie') expect(ev.some((e) => e.e === 'trickDone' && e.trick === g.trick), g.trick).toBe(true);
      expect(ev.some((e) => e.e === 'bail'), g.trick).toBe(false);
    }
  });
});

describe('controller-friendly air', () => {
  const jump = (steerAir: (t: number) => number) => {
    const w = generateWorld(1);
    const p = createPlayer(w);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 2; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    for (let i = 0; i < 40; i++) stepPlayer(p, { ...NO_INPUT, jump: true }, null, w, DT, ev);
    let t = 0;
    for (let i = 0; i < SIM_HZ * 3; i++) {
      stepPlayer(p, { ...NO_INPUT, steer: p.mode === 'air' ? steerAir(t) : 0 }, null, w, DT, ev);
      if (p.mode === 'air') t += DT;
    }
    return ev;
  };
  it('a slightly-off-centre stick held through the air does not spin you into a bail', () => {
    const ev = jump(() => 0.25);
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
    expect(ev.some((e) => e.e === 'land')).toBe(true);
  });
  it('a spin you let go of mid-air settles onto a clean landing', () => {
    const ev = jump((t) => (t < 0.3 ? 1 : 0));
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
    const land = ev.find((e) => e.e === 'land') as { spin: number } | undefined;
    expect(land).toBeDefined();
  });
});

describe('the mountain', () => {
  it('runs join smoothly, and a jump\'s next run never reaches back over the kicker (seeds 1-40)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const w = generateWorld(seed);
      expect(w.islands.length).toBeGreaterThanOrEqual(10);
      for (let i = 0; i + 1 < w.islands.length; i++) {
        const a = w.islands[i];
        const b = w.islands[i + 1];
        if (w.links[i] === 'join') {
          // Ride along a's centre line across the join: the ground never steps more than 1.2 m.
          const ra = a.r * a.stretch;
          let prev: number | null = null;
          for (let al = ra * 0.9; al < ra + 4; al += 0.5) { // the join itself (beyond it a run's own kickers are fair game)
            const x = a.cx + a.dx * al, z = a.cz + a.dz * al;
            const g = groundAt(w, x, z, (prev ?? 1e9) + 2);
            expect(g, `seed ${seed} join ${i}: hole at ${al.toFixed(1)}`).not.toBeNull();
            if (prev !== null) expect(Math.abs(g!.y - prev), `seed ${seed} join ${i}: step at ${al.toFixed(1)}`).toBeLessThan(1.2);
            prev = g!.y;
          }
        } else if (w.links[i] === 'jump') {
          for (let k = 0; k < 64; k++) {
            const th = (k / 64) * Math.PI * 2;
            const al = Math.cos(th) * b.r * b.stretch, sd = Math.sin(th) * b.r;
            const x = b.cx + b.dx * al + b.dz * sd, z = b.cz + b.dz * al - b.dx * sd;
            const ox = x - a.cx, oz = z - a.cz;
            const inside = Math.hypot((ox * a.dx + oz * a.dz) / a.stretch, ox * a.dz - oz * a.dx) < a.r;
            expect(inside, `seed ${seed} run ${i + 1} overlaps run ${i} after a jump`).toBe(false);
          }
        }
      }
    }
  });
});

describe('manuals', () => {
  const ride = (policy: (p: ReturnType<typeof createPlayer>) => { grab: 0 | 1 | 2; lean: number; jump?: boolean }, seconds: number) => {
    const w = generateWorld(1);
    const p = createPlayer(w);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 1.5; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    let maxT = 0;
    for (let i = 0; i < SIM_HZ * seconds; i++) {
      stepPlayer(p, { ...NO_INPUT, ...policy(p) }, null, w, DT, ev);
      if (p.manual) maxT = Math.max(maxT, p.manual.t);
    }
    return { ev, maxT, p };
  };
  it('holding GRAB 1 on the ground tips into a nose manual; with no balancing you drop out of it, without a bail', () => {
    const { ev, maxT } = ride(() => ({ grab: 1, lean: 0 }), 4);
    expect(ev.find((e) => e.e === 'manualStart')).toEqual({ e: 'manualStart', kind: 'nose' });
    const end = ev.find((e) => e.e === 'manualEnd') as { fell: boolean } | undefined;
    expect(end?.fell).toBe(true);
    expect(maxT).toBeLessThan(3);
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
  });
  it('a player who balances (W/S against the tip) never drops out', () => {
    const { ev, maxT } = ride((p) => ({ grab: 2, lean: p.manual ? Math.max(-1, Math.min(1, p.manual.balance * 2.2 + p.manual.vel * 0.9)) : 0 }), 6);
    expect(ev.some((e) => e.e === 'manualEnd' && e.fell)).toBe(false); // never lost the balance
    expect(maxT).toBeGreaterThan(4);
  });
  it('popping out of a manual ends it cleanly and pops', () => {
    let n = 0;
    const { ev } = ride((p) => {
      n++;
      return { grab: 1, lean: p.manual ? Math.max(-1, Math.min(1, p.manual.balance * 2.2 + p.manual.vel * 0.9)) : 0, jump: n > 120 && n < 160 };
    }, 2);
    const end = ev.find((e) => e.e === 'manualEnd') as { fell: boolean } | undefined;
    expect(end?.fell).toBe(false);
    expect(ev.some((e) => e.e === 'takeoff')).toBe(true);
  });
});
