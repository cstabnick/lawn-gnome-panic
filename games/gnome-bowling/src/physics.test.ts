import { describe, it, expect } from 'vitest';
import { PIN_SPOTS, type SimResult, type ThrowInput } from './config';
import { simulateThrow } from './physics';

const FULL = Array.from({ length: 10 }, () => true);
const count = (down: readonly boolean[]) => down.filter(Boolean).length;

/** A right-handed pocket ball that knocks all ten from a full rack (checked in the tuning scan). */
const POCKET: ThrowInput = { x: -0.25, aim: 0, speed: 9, spin: 0.6 };
const GUTTER: ThrowInput = { x: 0.4, aim: 0.12, speed: 9, spin: 0 };
const STRAIGHT: ThrowInput = { x: 0, aim: 0, speed: 9, spin: 0 };

describe('simulateThrow', () => {
  it('a pocket ball knocks all ten pins from a full rack', () => {
    const r = simulateThrow(POCKET, FULL);
    expect(r.gutter).toBe(false);
    expect(count(r.down)).toBe(10);
  });

  it('a gutter ball sets gutter and knocks nothing', () => {
    const r = simulateThrow(GUTTER, FULL);
    expect(r.gutter).toBe(true);
    expect(r.down.every((d) => d === false)).toBe(true);
    expect(r.events.some((e) => e.kind === 'gutter')).toBe(true);
  });

  it('is deterministic: same input gives the same knocks and the same last ball sample', () => {
    const a = simulateThrow(POCKET, FULL);
    const b = simulateThrow({ ...POCKET }, [...FULL]);
    expect(b.down).toEqual(a.down);
    expect(b.ball[b.ball.length - 1]).toEqual(a.ball[a.ball.length - 1]);
    expect(b.ball.length).toBe(a.ball.length);
  });

  it('only pins that were standing can be knocked', () => {
    const standing = FULL.map((_, p) => p === 6 || p === 9);
    const r = simulateThrow(POCKET, standing);
    for (let p = 0; p < 10; p++) {
      if (!standing[p]) expect(r.down[p]).toBe(false);
    }
    expect(r.down.length).toBe(10);
  });

  it('every pin track has one sample per ball sample', () => {
    const r: SimResult = simulateThrow(STRAIGHT, FULL);
    expect(r.pins.length).toBe(PIN_SPOTS.length);
    for (const track of r.pins) expect(track.length).toBe(r.ball.length);
    expect(r.duration).toBeCloseTo((r.ball.length - 1) * r.sampleDt, 9);
  });

  it('a straight centre ball at 9 m/s knocks at least 5 pins', () => {
    const r = simulateThrow(STRAIGHT, FULL);
    expect(count(r.down)).toBeGreaterThanOrEqual(5);
  });

  it('runs one simulation in under 30 ms', () => {
    simulateThrow(POCKET, FULL); // warm up
    const t0 = performance.now();
    simulateThrow(POCKET, FULL);
    expect(performance.now() - t0).toBeLessThan(30);
  });
});
