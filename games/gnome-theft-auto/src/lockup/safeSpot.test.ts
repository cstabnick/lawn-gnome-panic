import { describe, expect, it } from 'vitest';
import type { Box } from '../types';
import { boxesBlocked, findSafeSpot } from './safeSpot';
import type { SpotOpts, SpotProbe } from './types';

const OPTS: SpotOpts = { radius: 2, minDist: 10, maxDist: 30, maxSlope: 0.3, maxWater: 0.1 };

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

describe('findSafeSpot', () => {
  it('returns a spot at minDist from the centre on flat dry ground, with y = ground', () => {
    const probe = makeProbe({ ground: () => 4.5 });
    const s = findSafeSpot(0, 0, probe, OPTS);
    expect(s).not.toBeNull();
    expect(Math.hypot(s!.x, s!.z)).toBeCloseTo(OPTS.minDist, 6);
    expect(s!.y).toBe(4.5);
  });

  it('pushes past a lake that sits within 20 m of the centre', () => {
    const probe = makeProbe({ water: (x, z) => (Math.hypot(x, z) < 20 ? 1 : 0) });
    const s = findSafeSpot(0, 0, probe, OPTS);
    expect(s).not.toBeNull();
    expect(Math.hypot(s!.x, s!.z)).toBeGreaterThan(20);
  });

  it('avoids a box that covers the first ring', () => {
    const box: Box = { minX: -3, maxX: 3, minZ: 8, maxZ: 12, h: 2 };
    const probe = makeProbe({ blocked: boxesBlocked([box], 100) });
    const s = findSafeSpot(0, 0, probe, OPTS);
    expect(s).not.toBeNull();
    const inBox = s!.x > box.minX && s!.x < box.maxX && s!.z > box.minZ && s!.z < box.maxZ;
    expect(inBox).toBe(false);
    expect(probe.blocked(s!.x, s!.z, OPTS.radius)).toBe(false);
    // Not the first-ring spot straight ahead at (0, 10), which the box covers.
    expect(Math.hypot(s!.x, s!.z - 10)).toBeGreaterThan(0.5);
  });

  it('returns null when all ground is water', () => {
    const probe = makeProbe({ water: () => 1 });
    expect(findSafeSpot(0, 0, probe, OPTS)).toBeNull();
  });

  it('returns null when the slope is steep everywhere', () => {
    const probe = makeProbe({ slope: () => 1 });
    expect(findSafeSpot(0, 0, probe, OPTS)).toBeNull();
  });

  it('returns null when the ground spread across the footprint is too large', () => {
    const probe = makeProbe({ ground: (x) => x * 0.5 });
    expect(findSafeSpot(0, 0, probe, OPTS)).toBeNull();
  });

  it('yaw faces the load toward the centre point', () => {
    const cx = 5;
    const cz = 5;
    const s = findSafeSpot(cx, cz, makeProbe(), OPTS);
    expect(s).not.toBeNull();
    const d = Math.hypot(cx - s!.x, cz - s!.z);
    expect(Math.sin(s!.yaw)).toBeCloseTo((cx - s!.x) / d, 6);
    expect(Math.cos(s!.yaw)).toBeCloseTo((cz - s!.z) / d, 6);
  });
});

describe('boxesBlocked', () => {
  const boxes: Box[] = [{ minX: 0, maxX: 10, minZ: 0, maxZ: 10, h: 1 }];
  const blocked = boxesBlocked(boxes, 100);

  it('is true inside a box', () => {
    expect(blocked(5, 5, 1)).toBe(true);
  });

  it('is false far away from boxes and the edge', () => {
    expect(blocked(-50, -50, 1)).toBe(false);
  });

  it('is true beyond half - r', () => {
    expect(blocked(99.5, 0, 1)).toBe(true);
    expect(blocked(0, -99.5, 1)).toBe(true);
  });

  it('grows boxes by r', () => {
    expect(blocked(11.5, 5, 2)).toBe(true);
    expect(blocked(12.5, 5, 2)).toBe(false);
  });
});
