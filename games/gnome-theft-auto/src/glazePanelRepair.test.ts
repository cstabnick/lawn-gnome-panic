import { describe, expect, it } from 'vitest';
import { REPAIR, repairQuote } from './glazePanelRepair';
import { UNLISTED_VALUE } from './dealers/config';

describe('repairQuote', () => {
  it('is 0 for a new vehicle', () => {
    expect(repairQuote(1, 0, 'push-bike')).toBe(0);
  });

  it('grows with missing hit points', () => {
    const light = repairQuote(0.8, 0, 'push-bike');
    const heavy = repairQuote(0.3, 0, 'push-bike');
    expect(light).toBeGreaterThan(0);
    expect(heavy).toBeGreaterThan(light);
  });

  it('adds perLevel for each damage level', () => {
    const base = repairQuote(0.5, 0, 'push-bike');
    expect(repairQuote(0.5, 2, 'push-bike')).toBe(base + 2 * REPAIR.perLevel);
  });

  it('charges a combine more than a push-bike at the same damage', () => {
    expect(repairQuote(0.5, 1, 'combine')).toBeGreaterThan(repairQuote(0.5, 1, 'push-bike'));
  });

  it('prices an unlisted kind at UNLISTED_VALUE', () => {
    const expected = Math.round(REPAIR.base + REPAIR.perHp * 0.5 * Math.min(2.5, Math.max(0.5, UNLISTED_VALUE / 1000)));
    expect(repairQuote(0.5, 0, 'hoa-van')).toBe(expected);
  });

  it('clamps hit points to 0..1', () => {
    expect(repairQuote(1.5, 0, 'push-bike')).toBe(0);
    expect(repairQuote(-0.5, 0, 'push-bike')).toBe(repairQuote(0, 0, 'push-bike'));
  });
});
