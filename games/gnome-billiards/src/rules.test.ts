import { describe, expect, it } from 'vitest';
import { CUE_BALL, EIGHT_BALL } from './config';
import type { Ball, ShotEvents } from './physics';
import { groupOf, judge, rack } from './rules';

const live = (ids: number[]): Ball[] => ids.map((id, i) => ({ id, x: 0.1 + i * 0.05, y: 0.5, vx: 0, vy: 0, pocketed: false }));
const ev = (firstHit: number | null, pocketed: number[] = []): ShotEvents => ({ firstHit, pocketed });

describe('8-ball rules', () => {
  it('racks 15 object balls and the cue, with the 8 in the middle', () => {
    const balls = rack(7);
    expect(balls).toHaveLength(16);
    expect(new Set(balls.map((b) => b.id)).size).toBe(16);
    const eight = balls.find((b) => b.id === EIGHT_BALL)!;
    expect(eight.x).toBeGreaterThan(1.0);
    expect(rack(7)).toEqual(rack(7));
  });

  it('groups: solids 1-7, stripes 9-15', () => {
    expect(groupOf(1)).toBe('solid');
    expect(groupOf(7)).toBe('solid');
    expect(groupOf(9)).toBe('stripe');
    expect(groupOf(EIGHT_BALL)).toBeNull();
    expect(groupOf(CUE_BALL)).toBeNull();
  });

  it('a clean pot on an open table assigns the group and keeps the turn', () => {
    const before = live([1, 2, 9, EIGHT_BALL]);
    const v = judge([{ id: CUE_BALL, x: 0.5, y: 0.5, vx: 0, vy: 0, pocketed: false }, ...before], ev(1, [1]), [null, null], 0);
    expect(v.foul).toBe(false);
    expect(v.groups).toEqual(['solid', 'stripe']);
    expect(v.continues).toBe(true);
    expect(v.nextTurn).toBe(0);
  });

  it('scratching is a foul: the other player gets ball in hand', () => {
    const before = live([1, 2, EIGHT_BALL]);
    const v = judge(before, ev(1, [CUE_BALL]), ['solid', 'stripe'], 0);
    expect(v.foul).toBe(true);
    expect(v.scratch).toBe(true);
    expect(v.ballInHand).toBe(true);
    expect(v.nextTurn).toBe(1);
  });

  it('hitting the wrong group first is a foul', () => {
    const before = [...live([1, 9]), { id: CUE_BALL, x: 0.5, y: 0.5, vx: 0, vy: 0, pocketed: false }];
    const v = judge(before, ev(9, []), ['solid', 'stripe'], 0);
    expect(v.foul).toBe(true);
    expect(v.reasons).toContain('wrong ball hit first');
  });

  it('pocketing the 8 after the group is cleared wins', () => {
    const before = live([EIGHT_BALL]);
    const v = judge(before, ev(EIGHT_BALL, [EIGHT_BALL]), ['solid', 'stripe'], 0);
    expect(v.winner).toBe(0);
  });

  it('pocketing the 8 with own balls still on the table loses', () => {
    const before = live([1, EIGHT_BALL]);
    const v = judge(before, ev(1, [EIGHT_BALL]), ['solid', 'stripe'], 0);
    expect(v.winner).toBe(1);
  });

  it('pocketing the 8 on an open table loses', () => {
    const v = judge(live([1, EIGHT_BALL]), ev(1, [EIGHT_BALL]), [null, null], 0);
    expect(v.winner).toBe(1);
  });

  it('pocketing an opponent ball ends the turn', () => {
    const before = live([1, 9]);
    const v = judge(before, ev(1, [1, 9]), ['solid', 'stripe'], 0);
    expect(v.continues).toBe(false);
    expect(v.nextTurn).toBe(1);
  });
});
