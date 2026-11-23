import { describe, expect, it } from 'vitest';
import { groundHeight, pushOutOfBoxes, sweepCircleBoxes, wallBounce } from './collide';
import type { Box } from './types';

describe('swept circle vs boxes', () => {
  // A 0.2 m thick wall running along x, from z = 0 to z = 0.2, 3 m tall.
  const wall: Box[] = [{ minX: -50, maxX: 50, minZ: 0, maxZ: 0.2, h: 3 }];

  it('a fast circle cannot tunnel through a thin wall: it stops on the near side', () => {
    // Circle r 0.9 starts 1.2 m in front of the wall and moves 2.6 m through it in one sweep.
    const s = sweepCircleBoxes(0, -1.2, 0, 1.4, 0.9, wall, 0);
    expect(s.hit).toBe(true);
    expect(s.z).toBeLessThan(0);
    expect(s.z).toBeCloseTo(-0.9, 2);
    expect(s.nz).toBeCloseTo(-1, 6);
    // A single push from the same end point (the old per-frame test) lets it through to the far side.
    const old = pushOutOfBoxes(0, 1.4, 0.9, wall, 0);
    expect(old.z).toBeCloseTo(1.4, 6);
  });

  it('a diagonal move into a long wall slides along it and keeps most of its along-wall progress', () => {
    const L = 4;
    const s = sweepCircleBoxes(0, -2, L / Math.SQRT2, -2 + L / Math.SQRT2, 0.9, wall, 0);
    expect(s.hit).toBe(true);
    const alongWall = s.x; // free travel along x would be L / sqrt(2)
    expect(alongWall).toBeGreaterThanOrEqual(0.6 * (L / Math.SQRT2));
    expect(s.z).toBeLessThan(0);
  });

  it('a move that misses the wall is untouched', () => {
    const s = sweepCircleBoxes(0, -5, 1, -4, 0.9, wall, 0);
    expect(s.hit).toBe(false);
    expect(s.x).toBeCloseTo(1, 9);
    expect(s.z).toBeCloseTo(-4, 9);
    expect(s.nx).toBe(0);
    expect(s.nz).toBe(0);
  });
});

describe('wallBounce', () => {
  it('a head-on 20 m/s hit reports impact 20 and rebounds slowly', () => {
    const b = wallBounce(0, -20, 0, 1);
    expect(b.impact).toBeCloseTo(20, 9);
    expect(Math.hypot(b.vx, b.vz)).toBeLessThanOrEqual(3.1);
  });

  it('a 10-degree glancing hit at 20 m/s keeps more than 17 m/s', () => {
    // Velocity 10 degrees from the wall surface, i.e. 20 sin 10 deg into the wall normal (+z) and 20 cos 10 deg along x.
    const a = (10 * Math.PI) / 180;
    const b = wallBounce(20 * Math.cos(a), -20 * Math.sin(a), 0, 1);
    expect(Math.hypot(b.vx, b.vz)).toBeGreaterThan(17);
    expect(b.impact).toBeCloseTo(20 * Math.sin(a), 9);
  });

  it('moving away from the wall is unchanged with impact 0', () => {
    // The normal points out of the wall toward the circle, so moving along +n is moving away.
    const b = wallBounce(3, 5, 0, 1);
    expect(b).toEqual({ vx: 3, vz: 5, impact: 0 });
  });
});

describe('rooftop groundHeight', () => {
  const boxes: Box[] = [
    { minX: 10, maxX: 30, minZ: 10, maxZ: 30, h: 12 },
    { minX: 15, maxX: 25, minZ: 15, maxZ: 25, h: 20 },
  ];

  it('returns 0 on open ground', () => {
    expect(groundHeight(0, 0, 0.35, boxes, 0)).toBe(0);
  });

  it('returns building roof height when standing or landing on top', () => {
    expect(groundHeight(12, 12, 0.35, boxes, 12)).toBe(12);
    expect(groundHeight(20, 20, 0.35, boxes, 20)).toBe(20);
  });

  it('ignores roofs taller than maxY + step tolerance', () => {
    expect(groundHeight(20, 20, 0.35, boxes, 12)).toBe(12);
    expect(groundHeight(12, 12, 0.35, boxes, 0)).toBe(0);
  });
});
