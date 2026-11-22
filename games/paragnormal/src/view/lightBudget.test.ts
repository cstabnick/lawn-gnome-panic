import { describe, expect, it } from 'vitest';
import { pickLights } from './lightBudget';

const count = (on: boolean[]) => on.filter(Boolean).length;

describe('pickLights', () => {
  it('returns exactly min(budget, n) trues', () => {
    const scores = [5, 1, 3, 2, 4, 0];
    const prev = scores.map(() => false);
    expect(count(pickLights(scores, prev, 3, 1))).toBe(3);
    expect(count(pickLights(scores, prev, 10, 1))).toBe(6);
    expect(count(pickLights([], [], 4, 1))).toBe(0);
  });

  it('picks the lowest scores', () => {
    const scores = [5, 1, 3, 2, 4];
    const on = pickLights(scores, scores.map(() => false), 2, 0);
    expect(on).toEqual([false, true, false, true, false]);
  });

  it('keeps a lit light that is within the hysteresis of a challenger', () => {
    // Light 1 is lit at 2.0; challenger 0 sits at 1.5, only 0.5 m closer. With 1 m hysteresis, light 1 stays.
    const scores = [1.5, 2.0];
    const prev = [false, true];
    expect(pickLights(scores, prev, 1, 1)).toEqual([false, true]);
    // Without a lit light, the closer challenger wins.
    expect(pickLights(scores, [false, false], 1, 1)).toEqual([true, false]);
  });

  it('lights them all when the budget covers every light', () => {
    const scores = [3, -1, 7];
    expect(pickLights(scores, [false, false, false], 5, 1)).toEqual([true, true, true]);
    expect(pickLights(scores, [false, false, false], 3, 1)).toEqual([true, true, true]);
  });
});
