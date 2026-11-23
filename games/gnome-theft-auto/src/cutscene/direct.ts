// Director's helpers: small functions that write the steps and shots the direction bible asks for
// (docs/design/gnome-theft-auto/direction/bible.md), so a scene reads as direction rather than coordinates.
// Pure data in, script data out: every helper returns ordinary Step / CamShot values.
import type { CamShot, Gesture, ShotSize, Step } from './script';

/**
 * Named pauses (seconds), from the bible's pacing rules:
 * - `tiny` 0.3: a breath between a line and its reaction.
 * - `beat` 0.7: the classic "beat" in a script; a look before an answer.
 * - `pause` 1.2: something landed; let the audience catch up.
 * - `silence` 2.0: a held silence after a sincere or shocking moment. Use at most once a scene.
 */
export const BEATS = { tiny: 0.3, beat: 0.7, pause: 1.2, silence: 2.0 } as const;
export type BeatName = keyof typeof BEATS;

/** A named pause as a `wait` step. */
export function beat(name: BeatName = 'beat'): Step {
  return { do: 'wait', s: BEATS[name] };
}

/** A shot of `who` by size, optionally on the eyeline to `toward` (see CamShot 'frame'). */
export function shot(
  who: string,
  size: ShotSize,
  opts: { toward?: string; side?: number; height?: 'eye' | 'low' | 'high'; fov?: number; handheld?: number } = {},
): CamShot {
  return { kind: 'frame', who, size, ...opts };
}

/** Cut to a shot (a camera step). */
export function cut(s: CamShot): Step {
  return { do: 'cam', shot: s };
}

/**
 * Matched coverage of a two-hander, every shot on the same side of the line between `a` and `b` (the 180-degree
 * rule): `single(x)` an eyeline single of a or b, `ots(x)` x over the other's shoulder. `side` 1 or -1 picks which side
 * of the line the camera lives on for the whole exchange; `angle` (degrees) how far off the eyeline the singles sit.
 */
export function coverage(a: string, b: string, side: 1 | -1 = 1, angle = 25): {
  single(who: string, size?: ShotSize, opts?: { height?: 'eye' | 'low' | 'high'; handheld?: number }): CamShot;
  ots(who: string, opts?: { handheld?: number }): CamShot;
} {
  const other = (who: string): string => (who === a ? b : a);
  // Seen from a facing b, a positive swing goes to a's left; from b facing a the same side of the line is b's right.
  const sign = (who: string): number => (who === a ? side : -side);
  return {
    single: (who, size = 'mcu', opts = {}) => ({ kind: 'frame', who, size, toward: other(who), side: angle * sign(who), ...opts }),
    // Over the other's shoulder: the other faces `who`; the same side of the line is the other's right when who === a.
    ots: (who, opts = {}) => ({ kind: 'frame', who, size: 'mcu', over: other(who), side: who === a ? side : -side, ...opts }),
  };
}

/**
 * A reaction shot: cut to `who` (a close single, on the eyeline to `toward` if given), an optional gesture, then a
 * beat to read the face. Put it right after the line it reacts to.
 */
export function reaction(
  who: string,
  opts: { toward?: string; gesture?: Gesture; size?: ShotSize; hold?: BeatName; side?: number } = {},
): Step[] {
  const steps: Step[] = [cut(shot(who, opts.size ?? 'mcu', { toward: opts.toward, side: opts.side }))];
  if (opts.gesture) steps.push({ do: 'gesture', who, name: opts.gesture, s: 1.1, async: true });
  steps.push(beat(opts.hold ?? 'beat'));
  return steps;
}

/** An eyeline: `a` and `b` turn to each other (both at once). */
export function exchangeLooks(a: string, b: string, s = 0.35): Step[] {
  return [{ do: 'face', who: a, at: b, s, async: true }, { do: 'face', who: b, at: a, s }];
}
