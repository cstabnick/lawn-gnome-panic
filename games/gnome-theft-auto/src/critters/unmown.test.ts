import { describe, expect, it } from 'vitest';
import { CRITTER_SPECS } from '../critters';
import { regionAt } from '../levels';
import { unmownLife } from './unmown';

const BOARDWALK: [number, number][] = [[-1100, -1560], [-1100, -1625], [-1150, -1625], [-1150, -1695]];

describe('unmown life', () => {
  it('every group is in the-unmown with a known kind', () => {
    for (const g of unmownLife.groups) {
      expect(g.region).toBe('the-unmown');
      expect(regionAt(g.x, g.z)).toBe('the-unmown');
      expect(Object.keys(CRITTER_SPECS)).toContain(g.kind);
    }
  });

  it('has every wild kind and a sane total', () => {
    const kinds = new Set(unmownLife.groups.map((g) => g.kind));
    for (const k of ['hare', 'hedgehog', 'fox', 'frog', 'duck', 'dragonfly', 'butterfly'] as const) expect(kinds.has(k)).toBe(true);
    const total = unmownLife.groups.reduce((n, g) => n + g.count, 0);
    expect(total).toBeGreaterThanOrEqual(30);
    expect(total).toBeLessThanOrEqual(60);
  });

  it('keeps group centres 15 m off the boardwalk', () => {
    for (const g of unmownLife.groups) {
      for (const [x, z] of BOARDWALK) expect(Math.hypot(g.x - x, g.z - z)).toBeGreaterThanOrEqual(15);
    }
  });
});
