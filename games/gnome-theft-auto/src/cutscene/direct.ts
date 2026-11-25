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
  two(size?: ShotSize): CamShot;
} {
  const other = (who: string): string => (who === a ? b : a);
  // Seen from a facing b, a positive swing goes to a's left; from b facing a the same side of the line is b's right.
  const sign = (who: string): number => (who === a ? side : -side);
  return {
    single: (who, size = 'mcu', opts = {}) => ({ kind: 'frame', who, size, toward: other(who), side: angle * sign(who), ...opts }),
    // Over the other's shoulder: the other faces `who`; the same side of the line is the other's right when who === a.
    ots: (who, opts = {}) => ({ kind: 'frame', who, size: 'mcu', over: other(who), side: who === a ? side : -side, ...opts }),
    // Both in frame: the camera swung wide off a's eyeline, still on the same side of the line.
    two: (size = 'fs') => ({ kind: 'frame', who: a, size, toward: b, side: 75 * side }),
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

// ---- Variety ----------------------------------------------------------------------------------------------------------
// Same intent, different set-up: the side of the line never changes, only the swing, the height and the movement.

export type ShotHeight = 'eye' | 'low' | 'high';

/** A stable hash of a seed string (FNV-1a), for picking variants deterministically. */
export function seedOf(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// xorshift32 over the seed hash: a few well-mixed numbers in [0, 1) per seed.
function rolls(seed: string, n: number): number[] {
  let x = seedOf(seed) || 1;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    out.push((x >>> 0) / 4294967296);
  }
  return out;
}

const SIZE_ORDER: ShotSize[] = ['ws', 'fs', 'ms', 'mcu', 'cu'];

function sizeStep(size: ShotSize, by: 1 | -1): ShotSize {
  const i = SIZE_ORDER.indexOf(size) + by;
  return SIZE_ORDER[Math.max(0, Math.min(SIZE_ORDER.length - 1, i))];
}

/**
 * An angle variant for a single: same side of the line (the sign of `side` kept), a different swing and sometimes a
 * different height. cu/mcu: swing 15..40 degrees, height eye (70 %) / low (15 %) / high (15 %); ms/fs: swing 20..55,
 * eye (60 %) / high (25 %) / low (15 %); ws: swing 10..70, eye (50 %) / high (50 %). Deterministic for a seed.
 */
export function pickAngle(seed: string, size: ShotSize, side: 1 | -1 = 1): { side: number; height: ShotHeight } {
  const [r1, r2] = rolls(seed, 2);
  const [lo, hi] = size === 'cu' || size === 'mcu' ? [15, 40] : size === 'ws' ? [10, 70] : [20, 55];
  const swing = Math.round(lo + r1 * (hi - lo));
  let height: ShotHeight;
  if (size === 'cu' || size === 'mcu') height = r2 < 0.7 ? 'eye' : r2 < 0.85 ? 'low' : 'high';
  else if (size === 'ws') height = r2 < 0.5 ? 'eye' : 'high';
  else height = r2 < 0.6 ? 'eye' : r2 < 0.85 ? 'high' : 'low';
  return { side: side * swing, height };
}

/** shot() with pickAngle applied: an eyeline single that differs per seed but keeps the line. */
export function varied(
  who: string,
  size: ShotSize,
  seed: string,
  opts: { toward?: string; side?: 1 | -1; handheld?: number } = {},
): CamShot {
  const a = pickAngle(seed, size, opts.side ?? 1);
  return shot(who, size, { toward: opts.toward, side: a.side, height: a.height, handheld: opts.handheld });
}

/** A slow push-in from `from` to `to` (default one size tighter) over `s` seconds: emphasis on a line or a realisation. */
export function pushIn(
  who: string,
  from: ShotSize,
  s: number,
  opts: { to?: ShotSize; toward?: string; side?: number; height?: ShotHeight } = {},
): CamShot {
  return { kind: 'frame', who, size: from, toward: opts.toward, side: opts.side, height: opts.height, push: { to: opts.to ?? sizeStep(from, 1), s } };
}

/** The reverse: pull out (default one size wider), for an exit, a reveal of the room, a deflation. */
export function pullOut(
  who: string,
  from: ShotSize,
  s: number,
  opts: { to?: ShotSize; toward?: string; side?: number; height?: ShotHeight } = {},
): CamShot {
  return { kind: 'frame', who, size: from, toward: opts.toward, side: opts.side, height: opts.height, push: { to: opts.to ?? sizeStep(from, -1), s } };
}

/** An insert: a close, high angle on what `who` is holding or doing (a cu looking down at the hands). */
export function insert(who: string, opts: { toward?: string; side?: number } = {}): CamShot {
  return { kind: 'frame', who, size: 'cu', height: 'high', toward: opts.toward, side: opts.side ?? 30 };
}

/** A cutaway to someone else (a bystander, a listener) for `hold` (default 'beat'), then back is up to the caller. */
export function cutaway(who: string, opts: { size?: ShotSize; toward?: string; hold?: BeatName } = {}): Step[] {
  return [cut(shot(who, opts.size ?? 'mcu', { toward: opts.toward })), beat(opts.hold ?? 'beat')];
}

// A run key for a plain frame shot (no over-the-shoulder, no push): same who, size and height. Null breaks a run.
function runKey(s: CamShot): string | null {
  if (s.kind !== 'frame' || s.over || s.push) return null;
  return `${s.who}|${s.size}|${s.height ?? 'eye'}`;
}

/**
 * Variety pass over a step list: wherever three or more cam steps in a row (ignoring non-cam steps between them) are
 * 'frame' shots of the same who + size + height, every second repeat gets pickAngle(seed + index) (side sign kept).
 * Returns a new list; nested 'parallel' tracks are walked too. Nothing else changes.
 */
export function vary(steps: Step[], seed: string): Step[] {
  const out: Step[] = steps.map((s) =>
    s.do === 'parallel' ? { ...s, tracks: s.tracks.map((t, i) => vary(t, `${seed}/${i}`)) } : s,
  );

  // Group the cam steps into runs of one key.
  const runs: number[][] = [];
  let run: number[] = [];
  let key: string | null = null;
  out.forEach((s, i) => {
    if (s.do !== 'cam') return;
    const k = runKey(s.shot);
    if (k !== null && k === key) {
      run.push(i);
    } else {
      if (run.length >= 3) runs.push(run);
      run = k === null ? [] : [i];
      key = k;
    }
  });
  if (run.length >= 3) runs.push(run);

  // Every second repeat of a qualifying run (the 2nd, 4th, ... shot) gets a new angle.
  for (const r of runs) {
    r.forEach((idx, pos) => {
      if (pos % 2 === 0) return;
      const st = out[idx];
      if (st.do !== 'cam' || st.shot.kind !== 'frame') return;
      const sgn = (st.shot.side ?? 25) < 0 ? -1 : 1;
      const v = pickAngle(`${seed}:${idx}`, st.shot.size, sgn);
      out[idx] = { ...st, shot: { ...st.shot, side: v.side, height: v.height } };
    });
  }
  return out;
}
