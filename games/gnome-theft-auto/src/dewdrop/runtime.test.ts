import { describe, expect, it, vi } from 'vitest';

vi.mock('../vehicles', () => ({ createVehicle: vi.fn(), removeVehicle: vi.fn() }));
vi.mock('../interactables', () => ({ addInteractSpot: vi.fn(() => () => {}) }));

import { HAMSTER_HOUR_SECONDS } from './config';
import { hamsterStep, type HamsterState } from './runtime';

function run(seconds: number, state: HamsterState, inBall = true): number {
  let fired = 0;
  const dt = 1;
  for (let i = 0; i < seconds; i++) if (hamsterStep(state, inBall, dt)) fired++;
  return fired;
}

describe('hamsterStep', () => {
  it('uses the 60 s threshold', () => {
    expect(HAMSTER_HOUR_SECONDS).toBe(60);
  });

  it('59 s in the ball then out resets the run', () => {
    const s: HamsterState = { t: 0, fired: false };
    expect(run(59, s)).toBe(0);
    expect(hamsterStep(s, false, 1)).toBe(false);
    expect(s.t).toBe(0);
    // A fresh 59 s after that still does not fire.
    expect(run(59, s)).toBe(0);
    expect(s.fired).toBe(false);
  });

  it('60 s in a row fires exactly once per session', () => {
    const s: HamsterState = { t: 0, fired: false };
    expect(run(60, s)).toBe(1);
    expect(run(120, s)).toBe(0);
    expect(s.fired).toBe(true);
  });

  it('fires on the frame the 60th second is reached', () => {
    const s: HamsterState = { t: 0, fired: false };
    expect(run(59, s)).toBe(0);
    expect(hamsterStep(s, true, 1)).toBe(true);
  });
});
