import { describe, expect, it } from 'vitest';
import { LIGHT_HYSTERESIS, pickLights } from './lightBudget';

const count = (xs: boolean[]): number => xs.filter(Boolean).length;

describe('pickLights', () => {
  it('returns exactly min(budget, n) trues', () => {
    const scores = [5, 1, 3, 2, 4];
    const off = [false, false, false, false, false];
    expect(count(pickLights(scores, off, 3, LIGHT_HYSTERESIS))).toBe(3);
    expect(count(pickLights(scores, off, 0, LIGHT_HYSTERESIS))).toBe(0);
  });

  it('turns on the lights with the lowest scores', () => {
    const scores = [5, 1, 3, 2, 4];
    const off = [false, false, false, false, false];
    expect(pickLights(scores, off, 3, LIGHT_HYSTERESIS)).toEqual([false, true, true, true, false]);
  });

  it('gives a currently-on light a hysteresis head start', () => {
    // Light 1 is on with score 2.5; its adjusted score 1.5 beats light 0 (2.0).
    const scores = [2, 2.5, 3];
    const prevOn = [false, true, false];
    expect(pickLights(scores, prevOn, 1, 1.0)).toEqual([false, true, false]);
    // Without the head start the lower score wins.
    expect(pickLights(scores, [false, false, false], 1, 1.0)).toEqual([true, false, false]);
  });

  it('turns on every light when the budget is at least n, and breaks ties by lower index', () => {
    expect(pickLights([1, 2], [false, false], 5, LIGHT_HYSTERESIS)).toEqual([true, true]);
    expect(pickLights([1, 1, 1, 1], [false, false, false, false], 2, LIGHT_HYSTERESIS)).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});
