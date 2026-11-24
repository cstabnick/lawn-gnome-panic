// The Loch Moss buoy run: the gates sit in deep water, and the run counts gates in order.
import { describe, expect, it } from 'vitest';
import { waterAt } from '../terrain';
import { BUOY_GATES, RUN_TIMEOUT_S, buoysOf, newRun, stepRun } from './course';
import type { BuoyGate } from './course';

type Pt = { x: number; z: number };

/** Forward unit vector of a gate (0 = +z, as in course.ts). */
const fwd = (g: BuoyGate): Pt => ({ x: Math.sin(g.yaw), z: Math.cos(g.yaw) });

/** The run through one gate: from 10 m behind its centre to 10 m in front. */
const through = (g: BuoyGate): [Pt, Pt] => {
  const f = fwd(g);
  return [{ x: g.x - f.x * 10, z: g.z - f.z * 10 }, { x: g.x + f.x * 10, z: g.z + f.z * 10 }];
};

/** Points from a to b every `step` metres, a and b included. */
function line(a: Pt, b: Pt, step: number): Pt[] {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / step));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) out.push({ x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n });
  return out;
}

describe('the buoy course', () => {
  it('every buoy is in water at least 1.5 m deep', () => {
    for (const g of BUOY_GATES) {
      for (const b of buoysOf(g)) {
        const hit = waterAt(b.x, b.z);
        expect(hit, `buoy at ${b.x.toFixed(1)}, ${b.z.toFixed(1)}`).not.toBeNull();
        expect(hit!.depth).toBeGreaterThanOrEqual(1.5);
      }
    }
  });

  it('consecutive gates are 25..90 m apart, the loop closing too', () => {
    BUOY_GATES.forEach((g, i) => {
      const n = BUOY_GATES[(i + 1) % BUOY_GATES.length];
      const d = Math.hypot(n.x - g.x, n.z - g.z);
      expect(d).toBeGreaterThanOrEqual(25);
      expect(d).toBeLessThanOrEqual(90);
    });
  });

  it('driving straight through gate 0 then gate 1 gives gate twice', () => {
    const g0 = BUOY_GATES[0], f = fwd(g0);
    const r = newRun();
    const results: string[] = [];
    // Straight along gate 0's heading, past gate 0 and on to gate 1's centre. Offset 0.7 m to one side so no step
    // lands exactly on a gate line (a touch is not a proper crossing).
    const side = { x: Math.cos(g0.yaw) * 0.7, z: -Math.sin(g0.yaw) * 0.7 };
    const pts = line(
      { x: g0.x - f.x * 10 + side.x, z: g0.z - f.z * 10 + side.z },
      { x: g0.x + f.x * 57 + side.x, z: g0.z + f.z * 57 + side.z }, 0.5);
    for (let i = 1; i < pts.length; i++) {
      const res = stepRun(r, pts[i - 1].x, pts[i - 1].z, pts[i].x, pts[i].z, 0.05);
      if (res) results.push(res);
    }
    expect(results).toEqual(['gate', 'gate']);
    expect(r.next).toBe(2);
  });

  it('crossing gate 0 backwards gives null', () => {
    const [front, back] = through(BUOY_GATES[0]).reverse() as [Pt, Pt];
    const r = newRun();
    expect(stepRun(r, front.x, front.z, back.x, back.z, 0.05)).toBeNull();
    expect(r.next).toBe(0);
  });

  it('finishing all six gates gives finish with a time', () => {
    const r = newRun();
    const events: string[] = [];
    // Through every gate in order; each leg runs from the front of one gate to the back of the next.
    let prev: Pt | null = null;
    for (const g of BUOY_GATES) {
      const [back, front] = through(g);
      if (prev) {
        const a = line(prev, back, 0.5);
        for (let i = 1; i < a.length; i++) {
          const res = stepRun(r, a[i - 1].x, a[i - 1].z, a[i].x, a[i].z, 0.05);
          if (res) events.push(res);
        }
      }
      const res = stepRun(r, back.x, back.z, front.x, front.z, 0.05);
      if (res) events.push(res);
      prev = front;
    }
    expect(events).toEqual([...Array(BUOY_GATES.length - 1).fill('gate'), 'finish']);
    expect(r.finished).toBe(true);
    expect(r.time).not.toBeNull();
    expect(r.time!).toBeGreaterThan(0);
  });

  it(`idle for more than ${RUN_TIMEOUT_S} s after gate 1 resets the run`, () => {
    const r = newRun();
    for (const g of BUOY_GATES.slice(0, 2)) {
      const [back, front] = through(g);
      stepRun(r, back.x, back.z, front.x, front.z, 0.05);
    }
    expect(r.next).toBe(2);
    let res: string | null = null;
    for (let s = 0; s < RUN_TIMEOUT_S + 5 && res !== 'reset'; s++) res = stepRun(r, 0, 0, 0, 0, 1);
    expect(res).toBe('reset');
    expect(r.next).toBe(0);
  });
});
