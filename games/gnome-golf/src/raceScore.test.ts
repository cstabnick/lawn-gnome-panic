import { describe, expect, it } from 'vitest';
import { HOLES, ROUND } from './config';
import { raceTable, speedBonus, speedPlaces, strokePoints } from './raceScore';

const blank = (): (number | null)[] => HOLES.map(() => null);

describe('race scoring', () => {
  it('stroke points: par 5, birdie 6, bogey 4, ace 8, floor 1, pickup 0', () => {
    expect(strokePoints(4, 4)).toBe(5);
    expect(strokePoints(3, 4)).toBe(6);
    expect(strokePoints(5, 4)).toBe(4);
    expect(strokePoints(1, 3)).toBe(8);
    expect(strokePoints(9, 3)).toBe(1);
    expect(strokePoints(ROUND.maxStrokes, 3)).toBe(0);
  });

  it('speed places rank per hole, ties share, unfinished get none', () => {
    expect(speedPlaces([40, 30, null, 50, 30])).toEqual([2, 0, null, 3, 0]);
    expect([0, 1, 2, 3, null].map(speedBonus)).toEqual([3, 2, 1, 0, 0]);
  });

  it('total = stroke points + speed bonus, ranked per hole, not on round time', () => {
    const par1 = HOLES[0].par;
    const a = { scores: blank(), times: blank() };
    const b = { scores: blank(), times: blank() };
    const c = { scores: blank(), times: blank() };
    // Hole 1: all make par; c is fastest, then a, then b.
    a.scores[0] = par1; a.times[0] = 50;
    b.scores[0] = par1; b.times[0] = 90;
    c.scores[0] = par1; c.times[0] = 20;
    // Hole 2: only a and b finish; b is faster. c is still slow on hole 2 (no time yet).
    const par2 = HOLES[1].par;
    a.scores[1] = par2; a.times[1] = 60;
    b.scores[1] = par2 - 1; b.times[1] = 30;
    const [ta, tb, tc] = raceTable([a, b, c]);
    expect(ta.holes[0]).toMatchObject({ stroke: 5, place: 1, bonus: 2, points: 7 });
    expect(tb.holes[0]).toMatchObject({ place: 2, bonus: 1, points: 6 });
    expect(tc.holes[0]).toMatchObject({ place: 0, bonus: 3, points: 8 });
    expect(tb.holes[1]).toMatchObject({ stroke: 6, place: 0, bonus: 3, points: 9 });
    expect(ta.holes[1]).toMatchObject({ place: 1, bonus: 2, points: 7 });
    expect([ta.total, tb.total, tc.total]).toEqual([14, 15, 8]);
  });
});
