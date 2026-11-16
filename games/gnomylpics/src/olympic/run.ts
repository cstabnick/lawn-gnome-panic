// The alternating-tap model every running and spinning event shares (pure: no DOM, no three, JSON state).
// A human's view sends cumulative counters (TapInput); stepRunner turns the new taps into speed.
// The exported names and types are a contract the event slices rely on.

export interface TapParams {
  /** Speed added per correct tap. */
  boost: number;
  /** Speed cap. */
  max: number;
  /** Speed lost per second. */
  drag: number;
  /** Speed is multiplied by this on a slip (same key twice). */
  stumbleMult: number;
  /** Seconds after a slip during which taps are ignored. */
  stumbleS: number;
}

/** Running, metres per second. */
export const RUN: TapParams = { boost: 1.1, max: 11, drag: 2.4, stumbleMult: 0.4, stumbleS: 0.45 };
/** Spinning a mower, radians per second. */
export const SPIN: TapParams = { boost: 1.2, max: 30, drag: 1.8, stumbleMult: 0.7, stumbleS: 0.3 };

/** Cumulative counters a view sends every frame (never one-frame flags). */
export interface TapInput {
  /** Correct alternating taps so far. */
  taps: number;
  /** Out-of-order taps (same side twice) so far. */
  slips: number;
  /** Action presses (Space / Enter / the on-screen action button) so far. */
  acts: number;
}

/** Plain JSON; lives in a slice's state, one per seat. */
export interface Runner {
  /** Current speed (m/s, or rad/s for SPIN). */
  v: number;
  /** Seconds of stumble left; taps are ignored while > 0. */
  stun: number;
  /** Last counters seen from this seat's input. */
  taps: number;
  slips: number;
  acts: number;
  /** CPU only: seconds until the CPU's next tap. */
  cpuWait: number;
}

export function newRunner(): Runner {
  return { v: 0, stun: 0, taps: 0, slips: 0, acts: 0, cpuWait: 0 };
}

/** Applies one step: new taps, new slips, drag and stun. Returns how many NEW acts arrived this step (0 if none). */
export function stepRunner(r: Runner, input: TapInput | null, p: TapParams, dt: number): number {
  let newActs = 0;
  if (input !== null) {
    const newSlips = Math.max(0, input.slips - r.slips);
    if (newSlips > 0) {
      r.v *= p.stumbleMult;
      r.stun = p.stumbleS;
      r.slips = input.slips;
    }
    // Checked after the slip handling above: a slip in this step blocks this step's taps.
    const newTaps = Math.max(0, input.taps - r.taps);
    r.taps = Math.max(r.taps, input.taps);
    if (r.stun <= 0) {
      r.v = Math.min(p.max, r.v + newTaps * p.boost);
    }
    newActs = Math.max(0, input.acts - r.acts);
    r.acts = Math.max(r.acts, input.acts);
  }
  r.v = Math.max(0, r.v - p.drag * dt);
  r.stun = Math.max(0, r.stun - dt);
  return newActs;
}

/** A CPU's skill, 0.45..0.9, drawn once in init. */
export function cpuSkill(rng: () => number): number {
  return 0.45 + rng() * 0.45;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** What a CPU sends this step (call from MinigameDef.cpu). acts is r.acts unchanged: the slice decides acts. */
export function cpuTaps(r: Readonly<Runner>, skill: number, rng: () => number): TapInput {
  if (r.cpuWait > 1 / 60) {
    return { taps: r.taps, slips: r.slips, acts: r.acts };
  }
  const mistake = lerp(0.08, 0.01, skill);
  if (rng() < mistake) {
    return { taps: r.taps, slips: r.slips + 1, acts: r.acts };
  }
  return { taps: r.taps + 1, slips: r.slips, acts: r.acts };
}

/** Advances a CPU's tap timer (call from MinigameDef.step for every CPU seat, after stepRunner). */
export function advanceCpu(r: Runner, skill: number, dt: number, rng: () => number): void {
  r.cpuWait -= dt;
  if (r.cpuWait <= 0) {
    r.cpuWait = lerp(0.15, 0.085, skill) * (0.85 + rng() * 0.3);
  }
}
