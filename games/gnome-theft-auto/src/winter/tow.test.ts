import { describe, expect, it } from 'vitest';
import { canGrab, handlePositions, startTow, stepTow, towPoint } from './tow';
import { TOW } from './types';

const LEN = Math.hypot(TOW.top.x - TOW.base.x, TOW.top.z - TOW.base.z);

/** Distance from (x, z) to the segment from a to b. */
function segDist(x: number, z: number, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const vx = b.x - a.x;
  const vz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz)));
  return Math.hypot(x - (a.x + vx * t), z - (a.z + vz * t));
}

describe('tow', () => {
  it('canGrab at the base when slow, not when fast or far', () => {
    expect(canGrab(TOW.base.x, TOW.base.z, 2)).toBe(true);
    expect(canGrab(TOW.base.x, TOW.base.z, 9)).toBe(false);
    expect(canGrab(TOW.base.x + 10, TOW.base.z, 2)).toBe(false);
  });

  it('a ride reaches the top after about len / speed seconds', () => {
    const r = startTow();
    expect(r.len).toBeCloseTo(LEN, 6);
    const dt = 0.1;
    let t = 0;
    while (!r.done && t < 1000) {
      stepTow(r, dt);
      t += dt;
    }
    expect(r.done).toBe(true);
    expect(Math.abs(t - LEN / TOW.speed)).toBeLessThanOrEqual(dt + 1e-9);
  });

  it('the ride up to the summit takes 35 s or less and ends near the top of the slope', () => {
    expect(LEN / TOW.speed).toBeLessThanOrEqual(35);
    expect(LEN / TOW.speed).toBeGreaterThan(15);
    expect(TOW.top.z).toBeLessThan(-1300);
  });

  it('towPoint(0) is the base and towPoint(len) the top', () => {
    const a = towPoint(0);
    expect(a.x).toBeCloseTo(TOW.base.x, 6);
    expect(a.z).toBeCloseTo(TOW.base.z, 6);
    const b = towPoint(LEN);
    expect(b.x).toBeCloseTo(TOW.top.x, 6);
    expect(b.z).toBeCloseTo(TOW.top.z, 6);
  });

  it('handlePositions returns n points, each on the up line or the return line', () => {
    const pts = handlePositions(0, TOW.handles);
    expect(pts.length).toBe(24);
    // Return line sits 0.8 m to the side of the up line; accept either within 1 m.
    for (const p of pts) {
      const d = segDist(p.x, p.z, TOW.base, TOW.top);
      expect(d).toBeLessThan(1 + 1e-9);
    }
  });

  it('at t = 1 the first handle has moved TOW.speed metres along the loop', () => {
    const a = handlePositions(0, TOW.handles)[0];
    const b = handlePositions(1, TOW.handles)[0];
    expect(Math.hypot(b.x - a.x, b.z - a.z)).toBeCloseTo(TOW.speed, 6);
  });
});
