import { describe, expect, it } from 'vitest';
import type { PhysEvent, Player } from '../config';
import { createPlayer } from '../physics';
import { generateWorld } from '../world';
import type { World } from '../world';
import { createFloodForces } from './forces';
import { FLOOD, FLOOD_HILL, FLOOD_SEED, newFloodStats, type Cannon, type Flood, type FlowSample, type Geyser, type Obstacles } from './types';

const DT = 1 / 120;

interface FakeFlood extends Flood {
  wet: boolean;
  sample_: { depth: number; vx: number; vz: number };
}

/** A flood with one fixed sample: wet (flowing vx, vz at depth) or dry. */
function fakeFlood(p: Player): FakeFlood {
  const f: FakeFlood = {
    time: 0,
    runs: [],
    wet: true,
    sample_: { depth: 1, vx: 10, vz: 0 },
    step() {},
    focus() {},
    restart() {},
    anchor() {},
    sample(_x, _z, _hint, out: FlowSample) {
      if (!f.wet) {
        out.depth = 0; out.vx = 0; out.vz = 0; out.bedY = p.pos.y - 1; out.surfaceY = p.pos.y - 1;
        return false;
      }
      out.depth = f.sample_.depth;
      out.vx = f.sample_.vx;
      out.vz = f.sample_.vz;
      out.bedY = p.pos.y - 0.5;
      out.surfaceY = p.pos.y - 0.5 + f.sample_.depth;
      return true;
    },
    volume: () => 0,
  };
  return f;
}

function noObstacles(): Obstacles {
  return { cannons: [], geysers: [] };
}

function run(
  fn: (p: Player, w: World, dt: number, ev: PhysEvent[]) => void,
  p: Player,
  w: World,
  steps: number,
  ev: PhysEvent[],
): void {
  for (let i = 0; i < steps; i++) fn(p, w, DT, ev);
}

describe('flood forces', () => {
  const w = generateWorld(FLOOD_SEED, FLOOD_HILL);

  it('riding with the flow adds speed and sets surfing after surfHold, with one surf on event', () => {
    const p = createPlayer(w);
    p.vel.set(12, 0, 0);
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    const flood = fakeFlood(p);
    const fn = createFloodForces(flood, noObstacles(), stats, () => 0);
    const before = Math.hypot(p.vel.x, p.vel.z);
    run(fn, p, w, 1, ev);
    expect(stats.bonus).toBeGreaterThan(0); // the first step: well under the cap, so the current is pushing
    run(fn, p, w, 119, ev);
    expect(Math.hypot(p.vel.x, p.vel.z)).toBeGreaterThan(before + 5);
    expect(stats.surfing).toBe(true);
    expect(stats.surfPoints).toBeGreaterThan(0);
    expect(ev.filter((e) => e.e === 'surf' && e.on)).toHaveLength(1);
    expect(ev.filter((e) => e.e === 'surf')).toHaveLength(1);
  });

  it('does not set surfing before surfHold has passed', () => {
    const p = createPlayer(w);
    p.vel.set(12, 0, 0);
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    const fn = createFloodForces(fakeFlood(p), noObstacles(), stats, () => 0);
    run(fn, p, w, Math.floor(FLOOD.surfHold * 0.5 * 120), ev);
    expect(stats.surfing).toBe(false);
    expect(ev.filter((e) => e.e === 'surf')).toHaveLength(0);
  });

  it('moving against the flow slows the rider', () => {
    const p = createPlayer(w);
    p.vel.set(-10, 0, 0);
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    const fn = createFloodForces(fakeFlood(p), noObstacles(), stats, () => 0);
    // Short run: the drag slows the rider to ~7 m/s here; below 3 m/s the rider would count as riding again.
    run(fn, p, w, 30, ev);
    expect(Math.hypot(p.vel.x, p.vel.z)).toBeLessThan(10);
    expect(stats.surfing).toBe(false);
    expect(stats.bonus).toBe(0);
  });

  it('dry water changes nothing', () => {
    const p = createPlayer(w);
    p.vel.set(5, 0, 3);
    const before = p.vel.clone();
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    const flood = fakeFlood(p);
    flood.wet = false;
    const fn = createFloodForces(flood, noObstacles(), stats, () => 0);
    run(fn, p, w, 60, ev);
    expect(p.vel.equals(before)).toBe(true);
    expect(stats.depth).toBe(0);
    expect(stats.surfing).toBe(false);
    expect(ev).toHaveLength(0);
  });

  it('a firing cannon pushes the rider along the jet and emits one blast', () => {
    const p = createPlayer(w);
    p.vel.set(0, 0, 0);
    // Muzzle 10 m behind the rider, aimed along +z (yaw 0): the rider is 10 m up the jet, at muzzle height.
    const cannon: Cannon = { id: 0, island: p.island, x: p.pos.x, y: p.pos.y, z: p.pos.z - 10, yaw: 0, period: 8, phase: 0 };
    const obs: Obstacles = { cannons: [cannon], geysers: [] };
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    const fn = createFloodForces(fakeFlood(p), obs, stats, () => 7.5); // period 8: t mod 8 = 7.5 is inside the burst
    run(fn, p, w, 10, ev);
    expect(p.vel.z).toBeGreaterThan(0);
    expect(stats.blasts).toBe(1);
    expect(ev.filter((e) => e.e === 'blast')).toHaveLength(1);
    expect(p.mode).toBe('ground');
  });

  it('a second blast within the window bails the rider with Washed out', () => {
    const p = createPlayer(w);
    p.vel.set(0, 0, 0);
    // Cannon A fires at t = 7.5 (mod 8). Cannon B (phase 6.5) fires at t = 9.0 (mod 8 = 1, so (9 + 6.5) mod 8 = 7.5).
    const a: Cannon = { id: 0, island: p.island, x: p.pos.x, y: p.pos.y, z: p.pos.z - 10, yaw: 0, period: 8, phase: 0 };
    const b: Cannon = { ...a, id: 1, phase: 6.5 };
    const obs: Obstacles = { cannons: [a, b], geysers: [] };
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    let t = 7.5;
    const fn = createFloodForces(fakeFlood(p), obs, stats, () => t);
    run(fn, p, w, 10, ev);
    expect(stats.blasts).toBe(1);
    expect(p.mode).toBe('ground');
    t = 9.0;
    run(fn, p, w, 1, ev);
    expect(stats.blasts).toBe(2);
    expect(p.mode).toBe('bail');
    expect(ev).toContainEqual({ e: 'bail', reason: 'Washed out' });
  });

  it('an idle cannon does nothing', () => {
    const p = createPlayer(w);
    p.vel.set(0, 0, 0);
    const cannon: Cannon = { id: 0, island: p.island, x: p.pos.x, y: p.pos.y, z: p.pos.z - 10, yaw: 0, period: 8, phase: 0 };
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    const flood = fakeFlood(p);
    flood.wet = false; // dry, so the current does not push the resting rider
    const fn = createFloodForces(flood, { cannons: [cannon], geysers: [] }, stats, () => 1.0); // t mod 8 = 1: idle
    run(fn, p, w, 30, ev);
    expect(p.vel.lengthSq()).toBe(0);
    expect(stats.blasts).toBe(0);
    expect(ev).toHaveLength(0);
  });

  it('a firing geyser lifts a grounded rider into the air', () => {
    const p = createPlayer(w);
    p.vel.set(0, 0, 0);
    // Period 10: fire window is s in [9.0, 9.7) with windup 1.0 and burst 0.7 (start = 8.3).
    const geyser: Geyser = { id: 0, island: p.island, x: p.pos.x, y: p.pos.y, z: p.pos.z, period: 10, phase: 0 };
    const stats = newFloodStats();
    const ev: PhysEvent[] = [];
    const fn = createFloodForces(fakeFlood(p), { cannons: [], geysers: [geyser] }, stats, () => 9.3);
    run(fn, p, w, 1, ev);
    expect(p.vel.y).toBeGreaterThanOrEqual(FLOOD.geyserLift);
    expect(p.mode).toBe('air');
    expect(stats.blasts).toBe(1);
    expect(stats.sinceBlast).toBe(0);
    expect(ev).toContainEqual({ e: 'blast', by: 'geyser' });
  });

  it('stats.warn is set during a windup and null otherwise', () => {
    const p = createPlayer(w);
    const cannon: Cannon = { id: 0, island: p.island, x: p.pos.x, y: p.pos.y, z: p.pos.z + 20, yaw: 0, period: 8, phase: 0 };
    const obs: Obstacles = { cannons: [cannon], geysers: [] };
    const stats = newFloodStats();
    let t = 6.5; // period 8: windup is s in [6.0, 7.1)
    const fn = createFloodForces(fakeFlood(p), obs, stats, () => t);
    run(fn, p, w, 1, []);
    expect(stats.warn).not.toBeNull();
    expect(stats.warn?.kind).toBe('cannon');
    expect(stats.warn?.fire).toBe(false);
    expect(stats.warn?.dist).toBeCloseTo(20, 5);
    t = 1.0; // idle
    run(fn, p, w, 1, []);
    expect(stats.warn).toBeNull();
  });
});
