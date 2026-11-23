// Pure engine-sound maths (no AudioContext): what an engine of a given vehicle sounds like, how its revs follow the
// speed and the throttle, and the doppler shift of a moving source. engineVoice.ts turns these numbers into sound;
// audio.ts (the player's own engine) and enginePool.ts (everyone else's) share both.
//
// Why the old engine sounded like a bug: a raw sawtooth whose pitch jumped straight to the speed every frame (no
// inertia, so every bump and tap of the throttle was a pitch glitch), at a constant level whatever the load, and the
// pooled voices for other vehicles were handed from one vehicle to the next while still sounding, so their pitch and pan
// slid across the stereo field ("chirps"). Revs now have inertia (rise and fall at their own rates), the load (throttle
// against speed) shapes the tone, and a voice only changes hands while it is silent.

/** How one engine sounds. Firing frequency (Hz) is the pitch of the engine's pulses: rpm / 60 x firings per revolution. */
export interface EngineProfile {
  /** Firing frequency at idle and at the redline, Hz. */
  idleHz: number;
  maxHz: number;
  /** 0 = a continuously variable transmission (a mower's hydrostatic drive), else the number of gears. */
  gears: number;
  /** 0..1: how open the tone is (a sporty engine is brighter). */
  bright: number;
  /** 0..1: exhaust noise and firing irregularity (a big diesel or a two-stroke clatters). */
  rough: number;
  /** Loudness multiplier, about 0.7..1.3. */
  gain: number;
  /** A rotor or propeller chops the sound at this many Hz per unit of revs (0 = none). */
  chop: number;
}

/** The parts of a VehicleSpec (types.ts) an engine sound needs. Works for any vehicle, new kinds included. */
export interface EngineSpecLike {
  maxSpeed: number;
  accel: number;
  mass: number;
  flies: boolean;
  fixedWing?: boolean;
  boat?: boolean;
  /** Engine pitch multiplier on idleHz and maxHz (Vehicle.enginePitch; fleet.ts variants). Absent = 1. */
  pitch?: number;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * The engine a vehicle has, from its size (mass) and liveliness (acceleration), so a vehicle added later gets a fitting
 * sound with no table to update. Heavy = lower, rougher, louder, with gears; light and quick = higher and brighter.
 */
export function engineProfile(spec: EngineSpecLike): EngineProfile {
  const p = baseProfile(spec);
  const k = spec.pitch;
  if (k === undefined || k === 1 || !Number.isFinite(k) || k <= 0) return p;
  return { ...p, idleHz: p.idleHz * k, maxHz: p.maxHz * k };
}

function baseProfile(spec: EngineSpecLike): EngineProfile {
  const size = clamp01((spec.mass - 1.5) / 7);
  const sport = clamp01((spec.accel - 8) / 12);
  if (spec.flies) {
    // A plane's propeller drone, or the Whirligig's rotor: a steady motor chopped by the blades.
    return spec.fixedWing
      ? { idleHz: 34, maxHz: 72, gears: 0, bright: 0.55, rough: 0.3, gain: 1.05, chop: 0.4 }
      : { idleHz: 30, maxHz: 58, gears: 0, bright: 0.45, rough: 0.35, gain: 1, chop: 0.32 };
  }
  if (spec.boat) {
    // An outboard two-stroke: fires every revolution, so it buzzes higher than a mower of the same size.
    return {
      idleHz: lerp(30, 20, size), maxHz: lerp(96, 60, size), gears: 0,
      bright: 0.5 - 0.2 * size, rough: 0.45 + 0.25 * size, gain: 0.85 + 0.3 * size, chop: 0,
    };
  }
  return {
    idleHz: lerp(24, 15, size) + 4 * sport,
    maxHz: lerp(74, 44, size) + 22 * sport,
    // Mowers have a variable drive; vans, coaches and combines change gear.
    gears: spec.mass >= 3 ? 4 : 0,
    bright: clamp01(0.35 + 0.4 * sport - 0.2 * size),
    rough: clamp01(0.2 + 0.45 * size),
    gain: 0.8 + 0.45 * size,
    chop: 0,
  };
}

/**
 * Where the revs want to be, 0 (idle) .. 1 (redline), for speed01 = |speed| / maxSpeed and throttle -1..1. With gears
 * the revs climb through each gear and drop back at the change; without, they rise smoothly with the speed. Pressing
 * the throttle at low speed lifts the revs (the engine works before the vehicle moves).
 */
export function targetRevs(speed01: number, throttle: number, gears: number): number {
  const s = clamp01(speed01);
  const push = clamp01(Math.abs(throttle));
  if (gears <= 0) return clamp01(0.08 + 0.82 * Math.pow(s, 0.85) + 0.18 * push * (1 - s));
  const span = 1 / gears;
  const g = Math.min(gears - 1, Math.floor(s / span));
  const within = (s - g * span) / span;
  const low = g === 0 ? 0.08 : 0.42;
  return clamp01(low + (0.95 - low) * within + 0.12 * push * (1 - within));
}

/** Engine state carried from frame to frame: smoothed revs and load, both 0..1. */
export interface EngineState {
  revs: number;
  load: number;
}

export function newEngineState(): EngineState {
  return { revs: 0.08, load: 0 };
}

/** Revs rise in about a quarter of a second and fall more slowly (the flywheel); a gear change drops them quickly. */
const RISE_TAU = 0.22;
const FALL_TAU = 0.45;
const SHIFT_TAU = 0.14;
const LOAD_TAU = 0.15;

/**
 * Move the state one frame towards the target revs. `load` is how hard the engine works: throttle held while the
 * vehicle is not yet at the speed the revs ask for. Pure; mutates and returns `st`.
 */
export function stepEngine(st: EngineState, target: number, throttle: number, dt: number): EngineState {
  if (!(dt > 0)) return st;
  const d = target - st.revs;
  const tau = d >= 0 ? RISE_TAU : d < -0.2 ? SHIFT_TAU : FALL_TAU;
  st.revs += d * (1 - Math.exp(-dt / tau));
  const wantLoad = clamp01(Math.abs(throttle)) * (0.35 + 0.65 * clamp01(d * 4 + 0.3));
  st.load += (wantLoad - st.load) * (1 - Math.exp(-dt / LOAD_TAU));
  return st;
}

/** The firing frequency for a revs value. */
export function firingHz(p: EngineProfile, revs: number): number {
  return p.idleHz + (p.maxHz - p.idleHz) * clamp01(revs);
}

/** Speed of sound in world units (metres) per second. */
export const SOUND_SPEED = 343;

/**
 * Doppler pitch ratio of a source at (sx, sz) moving at (svx, svz) for a listener at (lx, lz) moving at (lvx, lvz):
 * above 1 while it closes in, below 1 as it goes away. Clamped to 0.8..1.25 so a teleport never squeals.
 */
export function dopplerRatio(
  sx: number, sz: number, svx: number, svz: number,
  lx: number, lz: number, lvx: number, lvz: number,
): number {
  const dx = lx - sx;
  const dz = lz - sz;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.5) return 1;
  const ux = dx / dist;
  const uz = dz / dist;
  const vs = svx * ux + svz * uz; // source speed towards the listener
  const vl = lvx * ux + lvz * uz; // listener speed away from the source
  const r = (SOUND_SPEED - vl) / (SOUND_SPEED - vs);
  return Math.min(1.25, Math.max(0.8, r));
}
