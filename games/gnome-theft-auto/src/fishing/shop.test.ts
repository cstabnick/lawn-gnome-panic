import { describe, expect, it } from 'vitest';
import { roadDistance } from '../critters';
import { regionAt } from '../levels';
import { waterAt } from '../terrain';
import { SHOP_PROPS } from './shop';

describe('The Bent Pin placement', () => {
  it('lists the shop props', () => {
    expect(SHOP_PROPS.map((p) => p.id)).toEqual(['shack', 'counter', 'wenna', 'sign', 'rack', 'cooler']);
  });

  it.each(SHOP_PROPS.map((p) => [p.id, p] as const))('%s is off every road, on dry land, in the canal region', (_id, p) => {
    expect(roadDistance(p.x, p.z)).toBeGreaterThan(10);
    expect(waterAt(p.x, p.z)).toBeNull();
    expect(regionAt(p.x, p.z)).toBe('cloverfield-farms');
  });
});
