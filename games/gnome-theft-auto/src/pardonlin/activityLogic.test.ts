import { describe, expect, it } from 'vitest';
import {
  QUEUE_POINTS, QUEUE_STEP_S, ROUND_DROPS, ROUND_TIME_S, deliverAt, parseVisited, roundComplete, roundReward, startPortrait,
  startQueue, startRound, stepPortrait, stepQueue, tickRound, visitDistrict,
} from './activityLogic';

describe('queue', () => {
  const at = (i: number) => QUEUE_POINTS[i] as [number, number];

  it('has nine points from the tail to the front, 4.5 m apart', () => {
    expect(QUEUE_POINTS.length).toBe(9);
    expect(QUEUE_POINTS[0]).toEqual([-1488.2, -196]);
    expect(QUEUE_POINTS[8][1]).toBeCloseTo(-232, 6);
  });

  it('advances every 7 s while the player stays on the current point', () => {
    const q = startQueue();
    const [x, z] = at(0);
    expect(stepQueue(q, QUEUE_STEP_S - 0.5, x, z)).toEqual([]);
    const ev = stepQueue(q, 1, x, z);
    expect(ev).toHaveLength(1);
    expect(ev[0].kind).toBe('shuffle');
    expect(q.index).toBe(1);
  });

  it('resets (lost) when the player walks off the current point', () => {
    const q = startQueue();
    const ev = stepQueue(q, 0.1, -1488.2, -190);
    expect(ev).toEqual([{ kind: 'lost' }]);
    expect(q.active).toBe(false);
    expect(stepQueue(q, 1, -1488.2, -196)).toEqual([]);
  });

  it('completes at the front', () => {
    const q = startQueue();
    let front = false;
    for (let i = 0; i < 20 && !front; i++) {
      const [x, z] = at(q.index);
      for (const e of stepQueue(q, QUEUE_STEP_S, x, z)) if (e.kind === 'front') front = true;
    }
    expect(front).toBe(true);
    expect(q.index).toBe(8);
    expect(q.active).toBe(false);
  });
});

describe('baguette round', () => {
  it('completes after five deliveries in any order', () => {
    const r = startRound();
    for (const i of [4, 2, 0, 3, 1]) {
      const d = ROUND_DROPS[i];
      expect(deliverAt(r, d.x + 1, d.z, 'car')).toBe(i);
    }
    expect(roundComplete(r)).toBe(true);
    expect(roundReward(r)).toBe(150);
  });

  it('adds the trike bonus when the last delivery was on the trike', () => {
    const r = startRound();
    for (let i = 0; i < 5; i++) deliverAt(r, ROUND_DROPS[i].x, ROUND_DROPS[i].z, i === 4 ? 'baguette-trike' : 'car');
    expect(roundReward(r)).toBe(200);
  });

  it('does not deliver out of reach', () => {
    const r = startRound();
    expect(deliverAt(r, ROUND_DROPS[0].x + 6, ROUND_DROPS[0].z, null)).toBe(-1);
  });

  it('warns at a minute and fails when time runs out', () => {
    const r = startRound();
    expect(tickRound(r, ROUND_TIME_S - 61)).toBeNull();
    expect(tickRound(r, 2)).toBe('warn');
    expect(tickRound(r, 2)).toBeNull();
    expect(tickRound(r, 100)).toBe('fail');
    expect(r.over).toBe(true);
    expect(deliverAt(r, ROUND_DROPS[0].x, ROUND_DROPS[0].z, null)).toBe(-1);
  });
});

describe('portrait', () => {
  it('completes after 20 s still and announces progress', () => {
    const p = startPortrait();
    const marks: number[] = [];
    let done = false;
    for (let t = 0; t < 21; t += 1) {
      for (const e of stepPortrait(p, 1, true)) {
        if (e.kind === 'progress') marks.push(e.at);
        if (e.kind === 'done') done = true;
      }
    }
    expect(marks).toEqual([5, 10, 15]);
    expect(done).toBe(true);
  });

  it('resets on a move', () => {
    const p = startPortrait();
    stepPortrait(p, 8, true);
    expect(stepPortrait(p, 1, false)).toEqual([{ kind: 'moved' }]);
    expect(p.elapsed).toBe(0);
    expect(p.announced).toBe(0);
    stepPortrait(p, 19, true);
    expect(p.done).toBe(false);
  });
});

describe('flaneur set', () => {
  it('grows once per district', () => {
    let v: string[] = parseVisited(null);
    const next1 = visitDistrict(v, 'old-town');
    expect(next1).toEqual(['old-town']);
    v = next1!;
    expect(visitDistrict(v, 'old-town')).toBeNull();
    v = visitDistrict(v, 'left-bank')!;
    expect(v).toEqual(['old-town', 'left-bank']);
  });

  it('reads malformed saves as empty', () => {
    expect(parseVisited('not json')).toEqual([]);
    expect(parseVisited('{"a":1}')).toEqual([]);
    expect(parseVisited('["gardens",3]')).toEqual(['gardens']);
  });
});
