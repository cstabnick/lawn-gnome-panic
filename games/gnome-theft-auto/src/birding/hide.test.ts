import { describe, expect, it } from 'vitest';
import { roadDistance } from '../critters';
import { regionAt } from '../levels';
import { waterAt } from '../terrain';
import { HIDE_PROPS } from './hide';

describe('Reedwatch Hide placement', () => {
  it('lists the hide props', () => {
    expect(HIDE_PROPS.map((p) => p.id)).toEqual(['hide', 'keeper', 'counter', 'sign', 'feeder']);
  });

  it.each(HIDE_PROPS.map((p) => [p.id, p] as const))('%s is off every road, on Loch Moss and dry', (_id, p) => {
    expect(roadDistance(p.x, p.z)).toBeGreaterThan(10);
    expect(regionAt(p.x, p.z)).toBe('loch-moss');
    expect(waterAt(p.x, p.z)).toBeNull();
  });
});
