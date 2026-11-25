import { describe, expect, it } from 'vitest';
import { COAST } from './config';
import { gondolaPos, spokewheelAngle } from './spokewheel';

const w = COAST.spokewheel;
const G = 3;

describe('spokewheel', () => {
  it('angle is in [0, 2pi), periodic and increasing', () => {
    for (const t of [-500, -1, 0, 5, 47.3, 96, 1000.7]) {
      const a = spokewheelAngle(t);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(Math.PI * 2);
      expect(spokewheelAngle(t + w.periodS)).toBeCloseTo(a, 6);
    }
    expect(spokewheelAngle(10.5)).toBeGreaterThan(spokewheelAngle(10));
  });

  it('gondola 0 is at the bottom at angle 0 and at the top at pi', () => {
    const b = gondolaPos(0, 0, G);
    expect(b.x).toBeCloseTo(w.x, 6);
    expect(b.y).toBeCloseTo(G + w.hubH - w.radius, 6);
    expect(gondolaPos(0, Math.PI, G).y).toBeCloseTo(G + w.hubH + w.radius, 6);
  });

  it('gondolas are evenly spaced on the rim', () => {
    const hubY = G + w.hubH;
    const step = (Math.PI * 2) / w.gondolas;
    for (let k = 0; k < w.gondolas; k++) {
      const p = gondolaPos(k, 0.7, G);
      expect(Math.hypot(p.x - w.x, p.y - hubY)).toBeCloseTo(w.radius, 6);
      const q = gondolaPos((k + 1) % w.gondolas, 0.7, G);
      const a1 = Math.atan2(p.x - w.x, hubY - p.y);
      const a2 = Math.atan2(q.x - w.x, hubY - q.y);
      expect((((a2 - a1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).toBeCloseTo(step, 6);
    }
  });
});
