import { describe, expect, it } from 'vitest';
import { generateWorld, runY } from '../world';
import { FLOOD, FLOOD_HILL, FLOOD_SEED, type Cannon, type Geyser } from './types';
import { cannonState, cycleOf, generateObstacles, geyserState, inGeyser, inJet } from './obstacles';

const world = generateWorld(FLOOD_SEED, FLOOD_HILL);

describe('generateObstacles', () => {
  it('is deterministic for the same seed and differs for another', () => {
    const a = generateObstacles(world, FLOOD_SEED);
    const b = generateObstacles(world, FLOOD_SEED);
    const other = generateObstacles(world, FLOOD_SEED + 1);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(a));
  });

  it('places between half and all of the requested cannons and geysers', () => {
    const o = generateObstacles(world, FLOOD_SEED);
    const runs = world.islands.length - 1;
    const maxC = runs * FLOOD.cannonsPerRun;
    const maxG = runs * FLOOD.geysersPerRun;
    expect(o.cannons.length).toBeLessThanOrEqual(maxC);
    expect(o.cannons.length * 2).toBeGreaterThanOrEqual(maxC);
    expect(o.geysers.length).toBeLessThanOrEqual(maxG);
    expect(o.geysers.length * 2).toBeGreaterThanOrEqual(maxG);
  });

  it('puts every cannon and geyser on the ground', () => {
    const o = generateObstacles(world, FLOOD_SEED);
    for (const c of o.cannons) expect(runY(world, world.islands[c.island], c.x, c.z)).not.toBeNull();
    for (const g of o.geysers) expect(runY(world, world.islands[g.island], g.x, g.z)).not.toBeNull();
  });

  it('keeps every geyser at least 12 m from hazards', () => {
    const o = generateObstacles(world, FLOOD_SEED);
    for (const g of o.geysers) {
      for (const h of world.hazards) expect(Math.hypot(g.x - h.x, g.z - h.z)).toBeGreaterThanOrEqual(12);
    }
  });
});

describe('cycleOf', () => {
  it('walks idle, windup, fire with the right k', () => {
    // period 10, windup 1, burst 1: windup from 8 to 9, fire from 9 to 10.
    expect(cycleOf(0, 10, 0, 1, 1)).toEqual({ phase: 'idle', k: 0 });
    expect(cycleOf(7.9, 10, 0, 1, 1).phase).toBe('idle');
    const w = cycleOf(8.5, 10, 0, 1, 1);
    expect(w.phase).toBe('windup');
    expect(w.k).toBeCloseTo(0.5);
    const f = cycleOf(9.5, 10, 0, 1, 1);
    expect(f.phase).toBe('fire');
    expect(f.k).toBeCloseTo(0.5);
  });

  it('applies the phase offset and wraps the period', () => {
    // phase 2 moves t=6.5 to s=8.5 (windup).
    expect(cycleOf(6.5, 10, 2, 1, 1).phase).toBe('windup');
    expect(cycleOf(-1.5, 10, 0, 1, 1).phase).toBe('windup');
  });

  it('gives cannonState and geyserState the same shape', () => {
    const c: Cannon = { id: 0, island: 1, x: 0, y: 0, z: 0, yaw: 0, period: 10, phase: 0 };
    const g: Geyser = { id: 0, island: 1, x: 0, y: 0, z: 0, period: 10, phase: 0 };
    expect(cannonState(c, 8.5).phase).toBe('windup');
    expect(geyserState(g, 9.5).phase).toBe('fire');
  });
});

describe('inJet / inGeyser', () => {
  const cannon: Cannon = { id: 0, island: 1, x: 0, y: 5, z: 0, yaw: 0, period: 10, phase: 0 };

  it('detects the jet along its centre line only', () => {
    expect(inJet(cannon, 0, 5, 10)).toBe(true);
    expect(inJet(cannon, 0, 5, -10)).toBe(false);
    expect(inJet(cannon, 3, 5, 20)).toBe(false);
    expect(inJet(cannon, 0, 11, 10)).toBe(false);
  });

  it('detects geysers within radius and below 14 m', () => {
    const g: Geyser = { id: 0, island: 1, x: 0, y: 0, z: 0, period: 10, phase: 0 };
    expect(inGeyser(g, 1, 10, 1)).toBe(true);
    expect(inGeyser(g, 1, 15, 1)).toBe(false);
    expect(inGeyser(g, FLOOD.geyserRadius + 1, 0, 0)).toBe(false);
  });
});
