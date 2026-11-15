import { describe, expect, it } from 'vitest';
import bowlFrame from './bowl-frame';

type Lane = ReturnType<typeof bowlFrame.init>['lanes'][number];
const seats = (n: number) => Array.from({ length: n }, (_, k) => ({ seat: k, name: `s${k}`, look: {}, color: 0, cpu: false }));

/** A state with the given lanes: rolls per lane, finished when two balls (or one strike) are in. */
function state(lanes: { rolls: number[]; doneAt?: number }[]) {
  const s = bowlFrame.init(seats(lanes.length) as never, () => 0.5);
  s.lanes.forEach((l: Lane, k) => {
    const rolls = lanes[k].rolls;
    l.rolls = rolls;
    l.ball = rolls.length === 0 ? 0 : rolls[0] === 10 || rolls.length === 2 ? 2 : 1;
    l.doneAt = lanes[k].doneAt ?? 0;
  });
  return s;
}

describe('bowl-frame result', () => {
  it('is null until every lane is finished or the time cap is hit', () => {
    const s = state([{ rolls: [4] }, { rolls: [2, 3], doneAt: 1 }]);
    expect(bowlFrame.result(s, false)).toBeNull();
    expect(bowlFrame.result(s, true)).not.toBeNull();
  });

  it('at equal pins a strike places above a spare', () => {
    const s = state([{ rolls: [5, 5], doneAt: 2 }, { rolls: [10], doneAt: 9 }]);
    expect(bowlFrame.result(s, false)).toEqual([1, 0]);
  });

  it('more pins place above fewer, whatever the marks', () => {
    const s = state([{ rolls: [10], doneAt: 1 }, { rolls: [6, 3], doneAt: 1 }]);
    expect(bowlFrame.result(s, false)).toEqual([0, 1]);
  });

  it('at equal pins and marks the earlier finish places above', () => {
    const s = state([{ rolls: [3, 2], doneAt: 5 }, { rolls: [2, 3], doneAt: 4 }]);
    expect(bowlFrame.result(s, false)).toEqual([1, 0]);
  });

  it('at the time cap an unfinished lane places after a finished lane with the same pins', () => {
    const s = state([{ rolls: [4] }, { rolls: [2, 2], doneAt: 3 }]);
    expect(bowlFrame.result(s, true)).toEqual([1, 0]);
  });

  it('equal finished lanes share a place', () => {
    const s = state([{ rolls: [4, 1], doneAt: 2 }, { rolls: [1, 4], doneAt: 2 }]);
    expect(bowlFrame.result(s, false)).toEqual([0, 0]);
  });
});
