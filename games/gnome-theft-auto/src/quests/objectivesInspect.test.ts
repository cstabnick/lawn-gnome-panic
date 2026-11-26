import { describe, expect, it } from 'vitest';
import { holdProgress, nextPoint, pendingPoints } from './objectivesInspect';

describe('inspect helpers', () => {
  it('holdProgress fills over holdSeconds and clamps', () => {
    expect(holdProgress(0, 2)).toBe(0);
    expect(holdProgress(1, 2)).toBe(0.5);
    expect(holdProgress(5, 2)).toBe(1);
    expect(holdProgress(0, undefined)).toBe(0);
    expect(holdProgress(0.1, 0)).toBe(1);
  });
  it('pendingPoints shows all, or only the next when ordered', () => {
    expect(pendingPoints([true, false, false], false)).toEqual([1, 2]);
    expect(pendingPoints([true, false, false], true)).toEqual([1]);
    expect(pendingPoints([true, true], true)).toEqual([]);
  });
  it('nextPoint picks the nearest open point in range', () => {
    const pts: { pos: [number, number]; radius?: number }[] = [{ pos: [0, 0] }, { pos: [10, 0] }, { pos: [20, 0], radius: 8 }];
    const none = [false, false, false];
    expect(nextPoint(pts, none, false, 1, 0)).toBe(0);
    expect(nextPoint(pts, none, false, 5, 0)).toBe(-1);
    expect(nextPoint(pts, none, false, 16, 0)).toBe(2);
    expect(nextPoint(pts, none, true, 10, 0)).toBe(-1);
    expect(nextPoint(pts, [true, false, false], true, 10, 0)).toBe(1);
  });
});
