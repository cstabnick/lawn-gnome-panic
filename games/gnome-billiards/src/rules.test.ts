import { describe, expect, it } from 'vitest';
import { CUE_BALL, EIGHT_BALL } from './config';
import type { Ball, ShotEvents } from './physics';
import { BANK_TARGET, groupOf, judge, lowestBallId, rack, STRAIGHT_TARGET } from './rules';

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

describe('9-ball, 6-ball, and straight pool rules', () => {
  it('9-ball racks cue + balls 1..9 in a diamond with 1 at apex and 9 in center', () => {
    const balls = rack(12, '9ball');
    expect(balls).toHaveLength(10);
    expect(new Set(balls.map((b) => b.id)).size).toBe(10);
    const one = balls.find((b) => b.id === 1)!;
    const nine = balls.find((b) => b.id === 9)!;
    expect(one.x).toBeLessThan(nine.x);
  });

  it('9-ball fouls when hitting a higher ball before the lowest ball', () => {
    const before = [...live([2, 5, 9]), { id: CUE_BALL, x: 0.5, y: 0.5, vx: 0, vy: 0, pocketed: false }];
    const v = judge(before, ev(5, []), [null, null], 0, '9ball');
    expect(v.foul).toBe(true);
    expect(v.ballInHand).toBe(true);
    expect(lowestBallId(before)).toBe(2);
  });

  it('9-ball wins on legal 9 pot and respots 9 on a foul pot', () => {
    const before = [...live([2, 9]), { id: CUE_BALL, x: 0.5, y: 0.5, vx: 0, vy: 0, pocketed: false }];
    const win = judge(before, ev(2, [9]), [null, null], 0, '9ball');
    expect(win.winner).toBe(0);
    expect(win.foul).toBe(false);

    const foulPot = judge(before, ev(9, [9]), [null, null], 0, '9ball');
    expect(foulPot.winner).toBeNull();
    expect(foulPot.foul).toBe(true);
    expect(foulPot.respotIds).toEqual([9]);
  });

  it('6-ball racks 7 balls and wins on legal 6 pot', () => {
    const balls = rack(5, '6ball');
    expect(balls).toHaveLength(7);
    const before = [...live([3, 6]), { id: CUE_BALL, x: 0.5, y: 0.5, vx: 0, vy: 0, pocketed: false }];
    const win = judge(before, ev(3, [6]), [null, null], 0, '6ball');
    expect(win.winner).toBe(0);
  });

  it('straight pool awards +1 per ball, -1 on scratch, and wins at target', () => {
    const before = [...live([1, 2, 3, 4, 5]), { id: CUE_BALL, x: 0.5, y: 0.5, vx: 0, vy: 0, pocketed: false }];
    const v1 = judge(before, ev(1, [1, 2]), [null, null], 0, 'straight', [0, 0]);
    expect(v1.scores).toEqual([2, 0]);
    expect(v1.continues).toBe(true);

    const vScratch = judge(before, ev(1, [1, CUE_BALL]), [null, null], 0, 'straight', [2, 0]);
    expect(vScratch.foul).toBe(true);
    expect(vScratch.scores).toEqual([1, 0]);

    const vWin = judge(before, ev(1, [1, 2]), [null, null], 0, 'straight', [STRAIGHT_TARGET - 2, 3]);
    expect(vWin.winner).toBe(0);
  });

  it('bank pool scores +1 for banked pots, respots non-banked pots, and wins at 5', () => {
    const before = [...live([1, 2, 3]), { id: CUE_BALL, x: 0.5, y: 0.5, vx: 0, vy: 0, pocketed: false }];
    const vBank = judge(before, { firstHit: 1, pocketed: [1], cushionHits: { 1: 1 } }, [null, null], 0, 'bank', [0, 0]);
    expect(vBank.foul).toBe(false);
    expect(vBank.continues).toBe(true);
    expect(vBank.scores).toEqual([1, 0]);

    const vNoBank = judge(before, { firstHit: 2, pocketed: [2], cushionHits: {} }, [null, null], 0, 'bank', [1, 0]);
    expect(vNoBank.continues).toBe(false);
    expect(vNoBank.respotIds).toEqual([2]);
    expect(vNoBank.scores).toEqual([1, 0]);

    const vWin = judge(before, { firstHit: 3, pocketed: [3], cushionHits: { 3: 1 } }, [null, null], 0, 'bank', [BANK_TARGET - 1, 2]);
    expect(vWin.winner).toBe(0);
  });
});
