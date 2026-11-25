import { describe, expect, it } from 'vitest';
import { createLift, liftResult, stepLift } from './lift';
import { LIFT } from './types';
import type { LiftEvent, LiftState } from './types';

const DT = 0.005;
const idle = { press: false, hold: false };

/** Idle until the grab swing is at a peak (|swing| near 1). */
function toPeak(s: LiftState): void {
  while (Math.abs(s.swing) < 0.999) stepLift(s, DT, idle);
}

function grabbed(heavy = false): LiftState {
  const s = createLift(heavy);
  expect(stepLift(s, DT, { press: true, hold: true })).toBe('grabbed');
  return s;
}

function holdUntil(s: LiftState, tilt: number): void {
  while (s.tilt < tilt) stepLift(s, DT, { press: false, hold: true });
}

describe('lift minigame', () => {
  it('a press at swing 0 grabs', () => {
    const s = createLift(false);
    expect(stepLift(s, DT, { press: true, hold: true })).toBe('grabbed');
    expect(s.phase).toBe('lift');
    expect(s.phaseT).toBe(0);
  });

  it('a press at a peak misses', () => {
    const s = createLift(false);
    toPeak(s);
    expect(stepLift(s, 0, { press: true, hold: true })).toBe('grab-miss');
    expect(s.phase).toBe('grab');
    expect(s.misses).toBe(1);
  });

  it('three misses grab anyway', () => {
    const s = createLift(false);
    const events: (LiftEvent | null)[] = [];
    for (let i = 0; i < 3; i++) {
      toPeak(s);
      events.push(stepLift(s, 0, { press: true, hold: true }));
      stepLift(s, 0.3, idle);
    }
    expect(events).toEqual(['grab-miss', 'grab-miss', 'grabbed']);
    expect(s.phase).toBe('lift');
    expect(s.misses).toBe(LIFT.maxMisses);
  });

  it('holding to the top spills', () => {
    const s = grabbed();
    let e: LiftEvent | null = null;
    while (!e) e = stepLift(s, DT, { press: false, hold: true });
    expect(e).toBe('spill');
    expect(s.tilt).toBe(1);
    expect(s.spilled && s.emptied).toBe(true);
    expect(s.phase).toBe('lower');
  });

  it('releasing in the tip zone tips; releasing early does not', () => {
    const early = grabbed();
    holdUntil(early, 0.5);
    expect(stepLift(early, DT, idle)).toBeNull();
    expect(early.phase).toBe('lift');

    const s = grabbed();
    holdUntil(s, (LIFT.tipMin + LIFT.tipMax) / 2);
    expect(stepLift(s, DT, idle)).toBe('tipped');
    expect(s.emptied).toBe(true);
    expect(s.spilled).toBe(false);
    expect(s.phase).toBe('lower');
  });

  it('lowering to 0 on a swing zero crossing is neat', () => {
    const s = grabbed();
    holdUntil(s, 0.9);
    stepLift(s, DT, idle);
    expect(s.phase).toBe('lower');
    const half = 0.5 / LIFT.swingHz;
    const lowerTime = s.tilt / LIFT.lowerRate;
    // Start holding so that the bin lands on a zero crossing (a multiple of half a period).
    let n = 1;
    while (n * half - lowerTime < s.phaseT) n++;
    const startAt = n * half - lowerTime;
    let e: LiftEvent | null = null;
    while (!e) e = stepLift(s, DT, { press: false, hold: s.phaseT >= startAt });
    expect(e).toBe('set-down');
    expect(s.phase).toBe('done');
    expect(s.neat).toBeGreaterThanOrEqual(0.9);
  });

  it('done ignores input', () => {
    const s = createLift(false);
    s.phase = 'done';
    expect(stepLift(s, 1, { press: true, hold: true })).toBeNull();
    expect(s.t).toBe(0);
  });

  it('star rules', () => {
    const base = { ...createLift(false), phase: 'done' as const, neat: 1 };
    expect(liftResult(base).stars).toBe(5);
    expect(liftResult({ ...base, misses: 2 }).stars).toBe(3);
    expect(liftResult({ ...base, neat: 0.4 }).stars).toBe(4);
    expect(liftResult({ ...base, spilled: true }).stars).toBe(2);
    expect(liftResult({ ...base, spilled: true, misses: 3, neat: 0.1 }).stars).toBe(1);
    expect(liftResult({ ...base, misses: 9, neat: 0 }).stars).toBe(1);
  });

  it('is deterministic with a fixed dt', () => {
    const run = (): LiftState => {
      const s = createLift(true);
      for (let i = 0; i < 600; i++) stepLift(s, 1 / 60, { press: i % 97 === 0, hold: i % 50 < 30 });
      return s;
    };
    expect(run()).toEqual(run());
  });
});
