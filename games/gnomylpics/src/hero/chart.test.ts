import { describe, expect, it } from 'vitest';
import { LEAD_S, chartFor, makeChart } from './chart';

describe('makeChart', () => {
  it('is the same for the same seed', () => {
    expect(makeChart(7)).toEqual(makeChart(7));
  });

  it('has sorted notes in range, a sane length and lanes 0..3 with no triple lane runs', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const c = makeChart(seed);
      expect(c.songS).toBeGreaterThanOrEqual(30);
      expect(c.songS).toBeLessThanOrEqual(42);
      expect(c.notes.length).toBeGreaterThanOrEqual(60);
      expect(c.notes.length).toBeLessThanOrEqual(220);
      for (let i = 0; i < c.notes.length; i++) {
        const n = c.notes[i];
        expect(n.t).toBeGreaterThanOrEqual(LEAD_S);
        expect(n.t).toBeLessThan(c.songS);
        expect([0, 1, 2, 3]).toContain(n.lane);
        if (i > 0) expect(n.t).toBeGreaterThanOrEqual(c.notes[i - 1].t);
        if (i > 1) {
          const triple = n.lane === c.notes[i - 1].lane && n.lane === c.notes[i - 2].lane;
          expect(triple).toBe(false);
        }
      }
    }
  });

  it('chartFor returns the same object for a cached seed', () => {
    expect(chartFor(3)).toBe(chartFor(3));
  });
});
