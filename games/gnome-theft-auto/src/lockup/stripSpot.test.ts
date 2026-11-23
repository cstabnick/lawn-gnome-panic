import { describe, expect, it } from 'vitest';
import { findStripSpot } from './stripSpot';
import type { SpotProbe, StripOpts } from './types';

const OPTS: StripOpts = {
  radius: 4,
  length: 60,
  minDist: 8,
  maxDist: 60,
  maxSlope: 0.12,
  maxWater: 0.05,
};

/** A probe of flat, dry, open ground unless overridden. */
function makeProbe(over: Partial<SpotProbe> = {}): SpotProbe {
  return {
    ground: () => 0,
    water: () => 0,
    slope: () => 0,
    blocked: () => false,
    ...over,
  };
}

describe('findStripSpot', () => {
  it('returns a spot 8 m from the centre on open flat dry ground', () => {
    const s = findStripSpot(0, 0, makeProbe({ ground: () => 2 }), OPTS);
    expect(s).not.toBeNull();
    expect(Math.hypot(s!.x, s!.z)).toBeCloseTo(8, 6);
    expect(s!.y).toBe(2);
  });

  it('points down a corridor when the rest of the world is blocked', () => {
    // Only the corridor |z| < 10, x > 20 is clear; blocked(x, z, r) is true near the walls and west of x = 20.
    const probe = makeProbe({
      blocked: (x, z, r) => Math.abs(z) > 10 - r || x < 20 + r,
    });
    const s = findStripSpot(0, 0, probe, OPTS);
    expect(s).not.toBeNull();
    expect(s!.yaw).toBeCloseTo(Math.PI / 2, 9);
    expect(s!.x).toBeGreaterThan(20);
    expect(Math.abs(s!.z)).toBeLessThan(10);
  });

  it('returns null when all ground is water', () => {
    expect(findStripSpot(0, 0, makeProbe({ water: () => 1 }), OPTS)).toBeNull();
  });

  it('returns null when the slope is steep everywhere', () => {
    expect(findStripSpot(0, 0, makeProbe({ slope: () => 0.5 }), OPTS)).toBeNull();
  });
});
