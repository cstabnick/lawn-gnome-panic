// E25 garbage: the lift-arm minigame as a pure state machine (grab on the swing, lift into the tip zone, lower onto
// the mark). Rules in types.ts (LiftPhase, LIFT).
import { LIFT } from './types';
import type { LiftEvent, LiftInput, LiftResult, LiftState } from './types';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function createLift(heavy: boolean): LiftState {
  return { phase: 'grab', t: 0, phaseT: 0, swing: 0, misses: 0, tilt: 0, wasHeld: false, spilled: false, emptied: false, neat: 0, heavy };
}

function enter(s: LiftState, phase: LiftState['phase']): void {
  s.phase = phase;
  s.phaseT = 0;
}

/** Advance by dt with this step's input. Returns at most one event. */
export function stepLift(s: LiftState, dt: number, input: LiftInput): LiftEvent | null {
  if (s.phase === 'done') return null;
  s.t += dt;
  s.phaseT += dt;
  const hz = LIFT.swingHz * (s.heavy ? LIFT.heavySwing : 1);
  const wave = Math.sin(2 * Math.PI * hz * s.phaseT);
  const { hold } = input;
  let event: LiftEvent | null = null;

  if (s.phase === 'grab') {
    s.swing = wave;
    if (input.press) {
      if (Math.abs(s.swing) <= LIFT.grabWindow) {
        enter(s, 'lift');
        event = 'grabbed';
      } else {
        s.misses++;
        if (s.misses >= LIFT.maxMisses) {
          enter(s, 'lift');
          event = 'grabbed';
        } else event = 'grab-miss';
      }
    }
  } else if (s.phase === 'lift') {
    s.swing *= Math.max(0, 1 - 6 * dt);
    if (hold) {
      s.tilt += LIFT.liftRate * (s.heavy ? LIFT.heavyLift : 1) * dt;
      if (s.tilt >= LIFT.spillAt) {
        s.tilt = 1;
        s.spilled = s.emptied = true;
        enter(s, 'lower');
        event = 'spill';
      }
    } else if (s.wasHeld && s.tilt >= LIFT.tipMin && s.tilt <= LIFT.tipMax) {
      s.emptied = true;
      enter(s, 'lower');
      event = 'tipped';
    }
  } else {
    s.swing = LIFT.lowerSwing * wave;
    if (hold) {
      s.tilt -= LIFT.lowerRate * dt;
      if (s.tilt <= 0) {
        s.tilt = 0;
        s.neat = clamp(1 - Math.abs(s.swing), 0, 1);
        s.phase = 'done';
        event = 'set-down';
      }
    }
  }
  s.wasHeld = hold;
  return event;
}

export function liftResult(s: LiftState): LiftResult {
  let stars = 5 - s.misses - (s.neat < 0.5 ? 1 : 0);
  if (s.spilled) stars = Math.min(stars, 2);
  stars = clamp(stars, 1, 5);
  return { stars: stars as LiftResult['stars'], neat: s.neat, spilled: s.spilled, misses: s.misses, seconds: s.t };
}
