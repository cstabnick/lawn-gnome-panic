import { describe, expect, it } from 'vitest';
import { SIDE_BY_SIDE } from './config';
import { bowlLane, laneDone, laneReady, newLane, placeLanes, tickLane, type Lane } from './lanes';
import { knockDown } from './scoring';

/** Lanes with the given rolls (one frame), finished at doneAt. */
function lanes(spec: { rolls: number[]; doneAt?: number }[]): Lane[] {
  return spec.map((s) => ({ ...newLane(), rolls: s.rolls, doneAt: s.doneAt ?? 0 }));
}

describe('placeLanes (one frame)', () => {
  it('more pins place above fewer, whatever the marks', () => {
    expect(placeLanes(lanes([{ rolls: [10], doneAt: 1 }, { rolls: [6, 3], doneAt: 1 }]), 1)).toEqual([0, 1]);
  });

  it('at equal pins a strike places above a spare', () => {
    expect(placeLanes(lanes([{ rolls: [5, 5], doneAt: 2 }, { rolls: [10], doneAt: 9 }]), 1)).toEqual([1, 0]);
  });

  it('at equal pins and marks the earlier finish places above', () => {
    expect(placeLanes(lanes([{ rolls: [3, 2], doneAt: 5 }, { rolls: [2, 3], doneAt: 4 }]), 1)).toEqual([1, 0]);
  });

  it('an unfinished lane places after a finished lane with the same pins', () => {
    expect(placeLanes(lanes([{ rolls: [4] }, { rolls: [2, 2], doneAt: 3 }]), 1)).toEqual([1, 0]);
  });

  it('equal finished lanes share a place', () => {
    expect(placeLanes(lanes([{ rolls: [4, 1], doneAt: 2 }, { rolls: [1, 4], doneAt: 2 }]), 1)).toEqual([0, 0]);
  });
});

describe('a lane bowling one frame', () => {
  it('is done after a strike, or after two balls', () => {
    expect(laneDone(lanes([{ rolls: [10] }])[0], 1)).toBe(true);
    expect(laneDone(lanes([{ rolls: [4] }])[0], 1)).toBe(false);
    expect(laneDone(lanes([{ rolls: [4, 3] }])[0], 1)).toBe(true);
    expect(laneDone(lanes([{ rolls: [4, 3] }])[0], 2)).toBe(false);
  });

  it('counts a throw once it has settled, then waits before the next ball', () => {
    const l = newLane();
    expect(bowlLane(l, { x: -0.1, aim: 0, speed: 8, spin: 0.3 }, 0, 1)).toBe(true);
    const f = l.flight!;
    // Not ready while the ball rolls: a second throw is refused.
    expect(bowlLane(l, { x: 0, aim: 0, speed: 8, spin: 0 }, 0.1, 1)).toBe(false);
    tickLane(l, f.dur, 1);
    expect(l.rolls).toEqual([]);
    const t = f.dur + SIDE_BY_SIDE.settleSeconds;
    tickLane(l, t, 1);
    expect(l.flight).toBeNull();
    expect(l.rolls).toEqual([f.down.filter(Boolean).length]);
    if (laneDone(l, 1)) {
      expect(l.doneAt).toBe(t);
    } else {
      expect(laneReady(l, t, 1)).toBe(false);
      expect(laneReady(l, t + SIDE_BY_SIDE.readySeconds, 1)).toBe(true);
      expect(l.standing.filter(Boolean).length).toBe(10 - l.rolls[0]);
    }
  });
});

describe('knockDown', () => {
  it('only counts pins that were standing', () => {
    const standing = [true, true, false, true, true, true, true, true, true, true];
    const down = [true, false, true, true, false, false, false, false, false, false];
    expect(knockDown(standing, down)).toBe(2);
    expect(standing.slice(0, 4)).toEqual([false, true, false, false]);
  });
});
