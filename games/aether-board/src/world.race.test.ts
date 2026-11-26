import { describe, expect, it } from 'vitest';
import { NO_INPUT, SIM_HZ, type PhysEvent } from './config';
import { generateWorld, groundAt } from './world';
import { createPlayer, stepPlayer } from './physics';
import { FLOOD_HILL } from './flood/types';

const DT = 1 / SIM_HZ;

describe('the race course (free ride)', () => {
  it('every free-ride world gets side walls, pinball posts, rocks and spikes, the same every time', () => {
    for (const seed of [1, 2, 3, 6, 7, 42]) {
      const a = generateWorld(seed);
      const b = generateWorld(seed);
      expect(JSON.stringify(a.bumpers)).toBe(JSON.stringify(b.bumpers));
      expect(a.bumpers.filter((x) => x.kind === 'wall').length, `seed ${seed}`).toBeGreaterThan(500);
      expect(a.bumpers.filter((x) => x.kind === 'post').length, `seed ${seed}`).toBeGreaterThan(40);
      expect(a.hazards.some((h) => h.kind === 'rock'), `seed ${seed}`).toBe(true);
      expect(a.hazards.some((h) => h.kind === 'spike'), `seed ${seed}`).toBe(true);
      for (const x of a.bumpers) expect(Number.isFinite(x.ax + x.az + x.ya + x.bx + x.bz + x.yb)).toBe(true);
    }
  });

  it('Descent and Flood Run worlds have no bumpers', () => {
    expect(generateWorld(3).race).toBe(true);
    expect(generateWorld(3, { hazard: 3, steep: 3, tricky: 3, runs: 5 }).bumpers).toEqual([]);
    expect(generateWorld(3, { hazard: 3, steep: 3, tricky: 3, runs: 5 }).race).toBe(false);
    expect(generateWorld(11, FLOOD_HILL).bumpers).toEqual([]);
    expect(generateWorld(11, FLOOD_HILL).race).toBe(false);
  });

  it('keeps the start, the exit-kicker run-ups and the rails clear of obstacles', () => {
    for (const seed of [1, 2, 3, 6, 7]) {
      const w = generateWorld(seed);
      const obstacles = [
        ...w.hazards.map((h) => ({ x: h.x, z: h.z, r: h.r })),
        ...w.bumpers.filter((b) => b.kind === 'post').map((b) => ({ x: b.ax, z: b.az, r: b.r })),
      ];
      const bad: string[] = [];
      for (const o of obstacles) {
        if (Math.hypot(o.x - w.spawn.pos.x, o.z - w.spawn.pos.z) < 60) bad.push('by the spawn');
        for (const rl of w.rails) {
          if (Math.hypot(o.x - rl.center.x, o.z - rl.center.z) > rl.radius + 10) continue;
          if (rl.pts.some((p) => Math.hypot(o.x - p.x, o.z - p.z) < o.r + 4)) bad.push('by a rail');
        }
        for (const isl of w.islands) for (const k of isl.kickers) {
          if (!k.big) continue;
          const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
          const u = (o.x - k.x) * fx + (o.z - k.z) * fz;
          const v = Math.abs((o.x - k.x) * fz - (o.z - k.z) * fx);
          if (u > -45 && u < k.len + 14 && v < k.width / 2 + 3) bad.push('on a kicker run-up');
        }
      }
      expect(bad, `seed ${seed}`).toEqual([]);
    }
  });

  it('the side wall bounces you back onto the run instead of letting you ride off the edge', () => {
    const w = generateWorld(1);
    const p = createPlayer(w);
    const isl = w.islands[0];
    // Same ride as the sky-fall test, straight at the right-hand rim, but with the walls in.
    p.heading = Math.atan2(isl.dz, -isl.dx) + Math.PI;
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 6; i++) stepPlayer(p, { ...NO_INPUT, lean: 1 }, null, w, DT, ev);
    expect(ev.some((e) => e.e === 'bump' && e.kind === 'wall')).toBe(true);
    expect(ev.some((e) => e.e === 'skyfall' || e.e === 'bail')).toBe(false);
    expect(groundAt(w, p.pos.x, p.pos.z, p.pos.y + 1)).not.toBeNull();
  });

  it('a pinball post kicks you back the way you came, without a bail', () => {
    const w = generateWorld(3);
    w.hazards.length = 0;
    w.bumpers.length = 0;
    const p = createPlayer(w);
    const sp = w.spawn;
    const fx = Math.sin(sp.heading), fz = Math.cos(sp.heading);
    const x = sp.pos.x + fx * 12, z = sp.pos.z + fz * 12;
    const y = groundAt(w, x, z, sp.pos.y + 50)?.y ?? sp.pos.y;
    w.bumpers.push({ kind: 'post', ax: x, az: z, ya: y, bx: x, bz: z, yb: y, r: 1.3, h: 2.2, island: 0 });
    p.vel.set(fx * 12, 0, fz * 12);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 2 && !ev.some((e) => e.e === 'bump'); i++) stepPlayer(p, NO_INPUT, null, w, DT, ev);
    const hit = ev.find((e) => e.e === 'bump');
    expect(hit && hit.e === 'bump' && hit.kind).toBe('post');
    expect(p.vel.x * fx + p.vel.z * fz).toBeLessThan(-5); // thrown back uphill
    expect(ev.some((e) => e.e === 'bail')).toBe(false);
  });

  it('a jump clears a post: you fly over its top', () => {
    const w = generateWorld(3);
    w.hazards.length = 0;
    w.bumpers.length = 0;
    const p = createPlayer(w);
    const sp = w.spawn;
    const fx = Math.sin(sp.heading), fz = Math.cos(sp.heading);
    const x = sp.pos.x + fx * 6, z = sp.pos.z + fz * 6;
    const y = groundAt(w, x, z, sp.pos.y + 50)?.y ?? sp.pos.y;
    w.bumpers.push({ kind: 'post', ax: x, az: z, ya: y, bx: x, bz: z, yb: y, r: 1.3, h: 2.2, island: 0 });
    p.pos.y = sp.pos.y + 6;
    p.mode = 'air';
    p.vel.set(fx * 12, 2, fz * 12);
    const ev: PhysEvent[] = [];
    for (let i = 0; i < SIM_HZ * 1; i++) stepPlayer(p, NO_INPUT, null, w, DT, ev);
    expect(ev.some((e) => e.e === 'bump')).toBe(false);
  });
});
