import { describe, it, expect } from 'vitest';
import { roofHeight, forageBobOffset } from './world';

// Only pure helpers are tested. buildWorld needs a scene and a town, and rendering is not checked here.

describe('roofHeight', () => {
  it('is 45% of the wall height', () => {
    expect(roofHeight(4)).toBeCloseTo(1.8);
  });

  it('is positive for positive heights', () => {
    for (const h of [0.5, 1, 3, 6, 12]) {
      expect(roofHeight(h)).toBeGreaterThan(0);
    }
  });
});

describe('forageBobOffset', () => {
  it('stays within plus or minus 0.06', () => {
    for (let t = 0; t < 20; t += 0.05) {
      for (const phase of [0, 1.7, 3.4, 5.1]) {
        const v = forageBobOffset(t, phase);
        expect(v).toBeGreaterThanOrEqual(-0.06 - 1e-9);
        expect(v).toBeLessThanOrEqual(0.06 + 1e-9);
      }
    }
  });

  it('is a sine of time * 2 plus phase', () => {
    expect(forageBobOffset(0, 0)).toBeCloseTo(0);
    expect(forageBobOffset(Math.PI / 4, 0)).toBeCloseTo(0.06);
  });
});
