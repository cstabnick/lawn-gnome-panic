import { describe, expect, it } from 'vitest';
import { roadDistance } from '../critters';
import { regionAt } from '../levels';
import { LODGE_PROPS } from './lodge';

describe('Tuft & Tally Lodge placement', () => {
  it('lists the lodge props', () => {
    expect(LODGE_PROPS.map((p) => p.id)).toEqual(['cabin', 'counter', 'hazel', 'sign', 'rack-l', 'rack-r']);
  });

  it.each(LODGE_PROPS.map((p) => [p.id, p] as const))('%s is off every road and in Mossy Wood', (_id, p) => {
    expect(roadDistance(p.x, p.z)).toBeGreaterThan(10);
    expect(regionAt(p.x, p.z)).toBe('mossy-wood');
  });
});
