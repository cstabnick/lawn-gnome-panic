import { describe, expect, it } from 'vitest';
import { runHeadless, testMinigame } from '@lawn/party/testkit';
import def from './oly-triple-jump';

testMinigame(def);

describe('oly-triple-jump', () => {
  it('the four CPUs finish before the time cap', () => {
    const run = runHeadless(def, 1);
    expect(run.timeUp).toBe(false);
  });
});

describe('oly-triple-jump online press timing', () => {
  const dt = 1 / 60;
  const rng = () => 0.5;
  // Puts seat 0 in the air on the hop, landing at t = 0.5.
  function airborne() {
    const s = def.init([{ seat: 0, cpu: false, name: 'a', color: 0 }] as never, rng) as any;
    Object.assign(s.seats[0], { ph: 'air', j: 0, t0: 0, z0: 20, z1: 25, vj: 10, actT: -1 });
    s.t = 0;
    return s;
  }
  function stepTo(s: any, t: number, input: any) {
    while (s.t < t - 1e-9) def.step(s, [input], dt, rng);
  }

  it('a press stamped at the landing counts as PERFECT even when it arrives 0.2 s late', () => {
    const s = airborne();
    const idle = { taps: 0, slips: 0, acts: 0 };
    stepTo(s, 0.7, idle); // landing at 0.5 passed, GOOD window over, still inside the grace
    expect(s.seats[0].ph).toBe('air');
    def.step(s, [{ taps: 0, slips: 0, acts: 1, at: 0.5 }], dt, rng);
    expect(s.seats[0].msg).toBe('PERFECT');
    expect(s.seats[0].j).toBe(1);
  });

  it('an unstamped press that arrives after the window is a FLOP', () => {
    const s = airborne();
    stepTo(s, 0.85, { taps: 0, slips: 0, acts: 0 });
    def.step(s, [{ taps: 0, slips: 0, acts: 1 }], dt, rng);
    expect(s.seats[0].msg).toBe('FLOP');
  });
});
