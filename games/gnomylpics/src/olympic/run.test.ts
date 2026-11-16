import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@lawn/party';
import {
  RUN,
  advanceCpu,
  cpuTaps,
  newRunner,
  stepRunner,
  type Runner,
  type TapInput,
} from './run';

const DT = 1 / 60;

function runCpu(seed: number): Runner {
  const rng = mulberry32(seed);
  const r = newRunner();
  for (let i = 0; i < 600; i++) {
    const input = cpuTaps(r, 0.7, rng);
    stepRunner(r, input, RUN, DT);
    advanceCpu(r, 0.7, DT, rng);
  }
  return r;
}

describe('stepRunner: alternating taps', () => {
  it('10 alternating taps give speed close to 10 * boost minus drag, never above max', () => {
    const r = newRunner();
    let taps = 0;
    for (let i = 0; i < 10; i++) {
      taps += 1;
      const input: TapInput = { taps, slips: 0, acts: 0 };
      stepRunner(r, input, RUN, DT);
      expect(r.v).toBeLessThanOrEqual(RUN.max);
    }
    expect(r.v).toBeCloseTo(10 * 1.1 - (10 * 2.4) / 60, 1);
  });
});

describe('stepRunner: slips and stun', () => {
  it('a slip after reaching speed multiplies v by 0.4 (minus one step of drag) and sets stun', () => {
    const r = newRunner();
    let taps = 0;
    for (let i = 0; i < 12; i++) {
      taps += 1;
      stepRunner(r, { taps, slips: 0, acts: 0 }, RUN, DT);
    }
    const before = r.v;
    expect(before).toBeGreaterThan(5);

    stepRunner(r, { taps, slips: 1, acts: 0 }, RUN, DT);
    expect(r.v).toBeCloseTo(before * 0.4 - RUN.drag * DT, 6);
    expect(r.stun).toBeGreaterThan(0);
  });

  it('taps during the next 0.4 s add nothing; after 0.5 s taps add speed again', () => {
    const r = newRunner();
    let taps = 0;
    let slips = 0;
    for (let i = 0; i < 12; i++) {
      taps += 1;
      stepRunner(r, { taps, slips, acts: 0 }, RUN, DT);
    }
    slips += 1;
    stepRunner(r, { taps, slips, acts: 0 }, RUN, DT);

    // 0.4 s of taps while stunned: speed only decays.
    const stunSteps = Math.round(0.4 / DT);
    for (let i = 0; i < stunSteps; i++) {
      taps += 1;
      const before = r.v;
      stepRunner(r, { taps, slips, acts: 0 }, RUN, DT);
      expect(r.v).toBeLessThanOrEqual(before);
    }
    expect(r.stun).toBeGreaterThan(0);

    // Wait until 0.5 s after the slip in total, then a tap adds speed.
    const waitSteps = Math.round(0.5 / DT) - stunSteps;
    for (let i = 0; i < waitSteps; i++) {
      stepRunner(r, { taps, slips, acts: 0 }, RUN, DT);
    }
    expect(r.stun).toBe(0);
    const before = r.v;
    taps += 1;
    stepRunner(r, { taps, slips, acts: 0 }, RUN, DT);
    expect(r.v).toBeGreaterThan(before - RUN.drag * DT);
    expect(r.v).toBeCloseTo(before + RUN.boost - RUN.drag * DT, 6);
  });
});

describe('stepRunner: acts', () => {
  it('returns 2 when acts jumps from 0 to 2, then 0 on the next step with the same input', () => {
    const r = newRunner();
    const input: TapInput = { taps: 0, slips: 0, acts: 2 };
    expect(stepRunner(r, input, RUN, DT)).toBe(2);
    expect(stepRunner(r, input, RUN, DT)).toBe(0);
  });

  it('returns 0 for a null input', () => {
    const r = newRunner();
    expect(stepRunner(r, null, RUN, DT)).toBe(0);
  });
});

describe('CPU driver', () => {
  it('a CPU at skill 0.7 taps 60..130 times in 10 s and reaches speed', () => {
    const rng = mulberry32(1);
    const r = newRunner();
    let peak = 0;
    for (let i = 0; i < 600; i++) {
      const input = cpuTaps(r, 0.7, rng);
      stepRunner(r, input, RUN, DT);
      advanceCpu(r, 0.7, DT, rng);
      peak = Math.max(peak, r.v);
    }
    expect(r.taps).toBeGreaterThanOrEqual(60);
    expect(r.taps).toBeLessThanOrEqual(130);
    // Peak, not final: the CPU's occasional slips can leave the final instant in a stumble.
    expect(peak).toBeGreaterThan(6);
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });

  it('the same seed gives identical runners (determinism)', () => {
    expect(runCpu(7)).toEqual(runCpu(7));
  });
});
