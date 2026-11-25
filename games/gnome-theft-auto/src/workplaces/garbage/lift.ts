// E25 garbage: the lift-arm minigame as a pure state machine (grab on the swing, lift into the tip zone, lower onto
// the mark). Rules in types.ts (LiftPhase, LIFT). STUB: issue 06 fills it in.
import type { LiftEvent, LiftInput, LiftResult, LiftState } from './types';

export function createLift(heavy: boolean): LiftState {
  return { phase: 'grab', t: 0, phaseT: 0, swing: 0, misses: 0, tilt: 0, wasHeld: false, spilled: false, emptied: false, neat: 0, heavy };
}

/** Advance by dt with this step's input. Returns at most one event. */
export function stepLift(s: LiftState, dt: number, input: LiftInput): LiftEvent | null {
  void dt; void input;
  if (s.phase !== 'done') {
    s.phase = 'done';
    s.emptied = true;
    s.neat = 1;
    return 'set-down';
  }
  return null;
}

export function liftResult(s: LiftState): LiftResult {
  return { stars: 5, neat: s.neat, spilled: s.spilled, misses: s.misses, seconds: s.t };
}
