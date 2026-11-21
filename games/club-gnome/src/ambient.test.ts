import { describe, it, expect } from 'vitest';
import { loopPoint } from './ambient';

describe('loopPoint', () => {
  it('is continuous across the wrap at s = 0 / 1', () => {
    const a = loopPoint(0);
    const b = loopPoint(0.999999999);
    expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeLessThan(0.1);
  });

  it('stays inside the loop bounding box', () => {
    for (let i = 0; i < 2000; i++) {
      const p = loopPoint(i / 2000);
      expect(p.x).toBeGreaterThanOrEqual(-9.5 - 1e-6);
      expect(p.x).toBeLessThanOrEqual(9.5 + 1e-6);
      expect(p.z).toBeGreaterThanOrEqual(-4.8 - 1e-6);
      expect(p.z).toBeLessThanOrEqual(4.8 + 1e-6);
    }
  });

  it('has a finite yaw everywhere', () => {
    for (let i = 0; i < 2000; i++) {
      expect(Number.isFinite(loopPoint(i / 2000).yaw)).toBe(true);
    }
  });

  it('moves a small step to a nearby point (no jumps along the ring)', () => {
    let prev = loopPoint(0);
    for (let i = 1; i <= 2000; i++) {
      const p = loopPoint(i / 2000);
      expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThan(0.1);
      prev = p;
    }
  });
});
