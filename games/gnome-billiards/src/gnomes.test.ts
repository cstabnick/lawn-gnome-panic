import { describe, expect, it } from 'vitest';
import { BLOCK_HX, BLOCK_HZ, inBlock, newWalker, pushOut, route, segmentHitsBlock, stepWalker, walkTo, WALK_X, WALK_Z, type Pt } from './gnomes';

const outside = (p: Pt): boolean => !inBlock(p);

describe('gnome walking', () => {
  it('pushes a point inside the rails out through its nearest side', () => {
    const p = pushOut({ x: 0.1, z: 0.5 });
    expect(outside(p)).toBe(true);
    expect(p.z).toBeCloseTo(BLOCK_HZ);
    expect(pushOut({ x: 2, z: 0 })).toEqual({ x: 2, z: 0 });
  });

  it('a route across the table goes round a corner, and never enters the rails', () => {
    const from: Pt = { x: -1.6, z: 0 };
    const to: Pt = { x: 1.6, z: 0 };
    expect(segmentHitsBlock(from, to)).toBe(true);
    const wps = route(from, to);
    expect(wps.length).toBeGreaterThan(1);
    let prev = from;
    for (const w of wps) {
      expect(segmentHitsBlock(prev, w)).toBe(false);
      prev = w;
    }
    expect(wps[wps.length - 1]).toEqual(to);
  });

  it('a walker reaches a goal on the far side of the table without entering it', () => {
    const w = newWalker(-1.6, 0);
    walkTo(w, { x: 1.6, z: 0.2 });
    let guard = 0;
    while ((w.path.length > 0 || w.moving) && guard++ < 20000) {
      stepWalker(w, 1 / 60);
      expect(outside({ x: w.x, z: w.z })).toBe(true);
    }
    expect(Math.hypot(w.x - 1.6, w.z - 0.2)).toBeLessThan(0.02);
    expect(w.moving).toBe(false);
  });

  it('walk targets are clamped to the floor', () => {
    const w = newWalker(-1.6, 0);
    walkTo(w, { x: 99, z: -99 });
    const goal = w.path[w.path.length - 1];
    expect(Math.abs(goal.x)).toBeLessThanOrEqual(WALK_X + 1e-9);
    expect(Math.abs(goal.z)).toBeLessThanOrEqual(WALK_Z + 1e-9);
  });
});
