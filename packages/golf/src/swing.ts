// The three-tap swing meter as pure state changes: tap to start, tap to lock power, tap to lock accuracy.
// Both functions mutate the SwingState in place. Sound, flashes and phase changes stay with the caller.
import { SWING, type ClubId, type SwingState } from './tuning';

export type SwingEvent = { kind: 'start' } | { kind: 'power'; power: number } | { kind: 'fire'; power: number; accuracy: number } | null;

/** A tap: idle -> power (start), power -> accuracy (locks power = marker), accuracy -> fire with accuracy = clamp(-marker / SWING.accuracyWindow, -1, 1). */
export function swingTap(sw: SwingState): SwingEvent {
  if (sw.stage === 'idle') {
    sw.stage = 'power';
    sw.marker = 0;
    sw.power = 0;
    return { kind: 'start' };
  }
  if (sw.stage === 'power') {
    sw.power = sw.marker;
    sw.stage = 'accuracy';
    return { kind: 'power', power: sw.power };
  }
  return { kind: 'fire', power: sw.power, accuracy: Math.max(-1, Math.min(1, -sw.marker / SWING.accuracyWindow)) };
}

/**
 * Meter travel for dt seconds (scale = speed multiplier, 1 normally; putts rise SWING.puttRiseScale times slower).
 * Overswing past SWING.maxPower locks power automatically; falling past -0.3 fires with accuracy 1.
 */
export function swingStep(sw: SwingState, dt: number, club: ClubId, scale = 1): SwingEvent {
  if (sw.stage === 'power') {
    sw.marker += (dt * scale) / (SWING.riseSeconds * (club === 'PT' ? SWING.puttRiseScale : 1));
    if (sw.marker >= SWING.maxPower) {
      sw.marker = SWING.maxPower;
      sw.power = sw.marker;
      sw.stage = 'accuracy';
      return { kind: 'power', power: sw.power };
    }
  } else if (sw.stage === 'accuracy') {
    sw.marker -= (dt * scale * sw.power) / SWING.fallSeconds;
    if (sw.marker <= -0.3) return { kind: 'fire', power: sw.power, accuracy: 1 };
  }
  return null;
}
