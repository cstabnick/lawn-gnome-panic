// Bot players (roadmap 7.7): determinism, district coverage, divergence and the null perturbation.
import { describe, it, expect } from 'vitest';
import { assembleFullMap } from '../world/fullMap';
import { divergence, nullPerturb, runWithBots } from './bots';
import { createRng, hashString } from './rng';
import { createWorld, hashWorld } from './world';

describe('bot players', () => {
  it('is deterministic: two 5-day runs give equal bot rows and world hashes', () => {
    const a = runWithBots(7, 5, ['quester', 'solo']);
    const b = runWithBots(7, 5, ['quester', 'solo']);
    expect(JSON.stringify(a.bots)).toBe(JSON.stringify(b.bots));
    expect(hashWorld(a.world)).toBe(hashWorld(b.world));
  });

  it('visits at least two districts by day 5 on the full map', () => {
    const { bots } = runWithBots(3, 5, ['quester'], { map: 'full' });
    const last = bots.filter((r) => r.day === 5);
    expect(last.length).toBeGreaterThan(0);
    expect(Math.max(...last.map((r) => r.districts.length))).toBeGreaterThanOrEqual(2);
  });

  it('divergence of a world with itself is 0', () => {
    const { world } = createWorld(11, undefined, assembleFullMap().containers, { map: 'full' });
    expect(divergence(world, world)).toBe(0);
  });

  it('a null perturbation makes divergence greater than 0', () => {
    const { world: a } = createWorld(11, undefined, assembleFullMap().containers, { map: 'full' });
    const { world: b } = createWorld(11, undefined, assembleFullMap().containers, { map: 'full' });
    nullPerturb(b, createRng(hashString('11:perturb')));
    expect(divergence(a, b)).toBeGreaterThan(0);
  });

});
