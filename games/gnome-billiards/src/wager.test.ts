import { describe, expect, it } from 'vitest';
import { clampWager, maxWager, wagerPayout, wagerPreset } from './wager';

describe('wager math', () => {
  it('caps wagers at 50% of current chips', () => {
    expect(maxWager(100)).toBe(50);
    expect(maxWager(51)).toBe(25);
    expect(maxWager(0)).toBe(0);
    expect(clampWager(80, 100)).toBe(50);
    expect(clampWager(-10, 100)).toBe(0);
    expect(clampWager(23.9, 100)).toBe(23);
  });

  it('computes presets and payouts accurately', () => {
    expect(wagerPreset(200, 0.1)).toBe(20);
    expect(wagerPreset(200, 0.25)).toBe(50);
    expect(wagerPreset(200, 0.5)).toBe(100);
    expect(wagerPreset(200, 0.8)).toBe(100);
    expect(wagerPayout(50, 2.5)).toEqual({ totalReturn: 175, profit: 125 });
    expect(wagerPayout(40, 1.25)).toEqual({ totalReturn: 90, profit: 50 });
  });
});
