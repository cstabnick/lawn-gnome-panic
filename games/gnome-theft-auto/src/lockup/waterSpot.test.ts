import { describe, expect, it } from 'vitest';
import { findWaterSpot } from './waterSpot';
import type { SpotProbe, WaterSpotOpts } from './types';

const OPTS: WaterSpotOpts = { radius: 2, minDist: 4, maxDist: 40, minDepth: 1 };

/** A probe of flat dry land unless overridden. */
function makeProbe(over: Partial<SpotProbe> = {}): SpotProbe {
  return {
    ground: () => 0,
    water: () => 0,
    slope: () => 0,
    blocked: () => false,
    ...over,
  };
}

/** A lake for x < 0: water depth 3, bed at -3; land at x >= 0 with ground 0. */
const lake = (x: number): number => (x < 0 ? 3 : 0);
const lakeProbe = (over: Partial<SpotProbe> = {}): SpotProbe =>
  makeProbe({
    water: (x) => lake(x),
    ground: (x) => (x < 0 ? -3 : 0),
    ...over,
  });

describe('findWaterSpot', () => {
  it('finds open water with all probe points deep enough, y = the water surface, nearest ring first', () => {
    const s = findWaterSpot(10, 0, lakeProbe(), OPTS);
    expect(s).not.toBeNull();
    expect(s!.x).toBeLessThanOrEqual(-2);
    expect(s!.y).toBe(0);
    expect(Math.hypot(s!.x - 10, s!.z)).toBeLessThanOrEqual(15);
  });

  it('returns null when all ground is dry', () => {
    expect(findWaterSpot(10, 0, makeProbe(), OPTS)).toBeNull();
  });

  it('returns null when the lake is blocked everywhere', () => {
    expect(findWaterSpot(10, 0, lakeProbe({ blocked: () => true }), OPTS)).toBeNull();
  });

  it('returns null when minDepth is deeper than the lake', () => {
    expect(findWaterSpot(10, 0, lakeProbe(), { ...OPTS, minDepth: 4 })).toBeNull();
  });
});
