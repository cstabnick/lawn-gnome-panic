import { describe, expect, it } from 'vitest';
import { VEHICLES } from '../config';
import { REGION_TRAFFIC, regionMixKind } from './trafficMix';

describe('REGION_TRAFFIC', () => {
  it('every mix has a chance in (0, 1] and a non-empty kind list', () => {
    for (const [region, mix] of Object.entries(REGION_TRAFFIC)) {
      expect(mix, region).toBeDefined();
      expect(mix!.chance, region).toBeGreaterThan(0);
      expect(mix!.chance, region).toBeLessThanOrEqual(1);
      expect(mix!.kinds.length, region).toBeGreaterThan(0);
    }
  });

  it('only uses land vehicles that exist in VEHICLES', () => {
    for (const [region, mix] of Object.entries(REGION_TRAFFIC)) {
      for (const kind of mix!.kinds) {
        const spec = VEHICLES[kind];
        expect(spec, `${region}: ${kind}`).toBeDefined();
        expect(spec.boat, `${region}: ${kind} is a boat`).toBeFalsy();
        expect(spec.air, `${region}: ${kind} is an aircraft`).toBeUndefined();
        expect(spec.flies, `${region}: ${kind} flies`).not.toBe(true);
      }
    }
  });
});

describe('regionMixKind', () => {
  it('is null for a region with no mix', () => {
    expect(regionMixKind('turfton', 0, 0)).toBeNull();
  });

  it('picks the first kind of the-unmown on a hit', () => {
    expect(regionMixKind('the-unmown', 0, 0)).toBe('ranger-buggy');
  });

  it('returns null when the roll misses the chance', () => {
    const chance = REGION_TRAFFIC['the-unmown']!.chance;
    expect(regionMixKind('the-unmown', chance, 0)).toBeNull();
    expect(regionMixKind('the-unmown', 0.9999, 0.5)).toBeNull();
  });

  it('maps the second roll onto the kind list', () => {
    const kinds = REGION_TRAFFIC['west-estates']!.kinds;
    expect(regionMixKind('west-estates', 0, 0)).toBe(kinds[0]);
    expect(regionMixKind('west-estates', 0, 0.999999)).toBe(kinds[kinds.length - 1]);
  });
});
