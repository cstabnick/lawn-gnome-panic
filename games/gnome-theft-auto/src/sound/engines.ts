// Engine sound profiles, one per vehicle (engine-sounds workstream). engineModel.ts guesses an engine from a vehicle's
// mass and acceleration; this table gives each vehicle its own character on top: the waveform (a mower's putt, a
// two-stroke's buzz, a diesel's chug, a van's rumble, a golf cart's electric hum, an outboard's rasp, a rotor's drone),
// how the pitch climbs with the revs, a whine (electric motor, gearbox, turbo spool), built-in misfires (a hot rod's pops)
// and how loud it idles. Damage and a waterlogged engine add misfires, roughness and a sag (conditionMix); a stalled one
// coughs. Pure: no AudioContext. engineVoice.ts plays the numbers; audio.ts (the player) and enginePool.ts (everyone
// else) build them through voiceParams.
//
// A vehicle added later needs nothing here: it falls back to engineModel.ts's guess. To give it a character, call
// registerEngineSound('<kind or fleet variant id>', { ... }) once at load.
import { engineProfile, type EngineProfile, type EngineSpecLike } from './engineModel';
import type { EngineParams } from './engineVoice';

/** The engine's harmonic recipe (engineVoice.ts builds one PeriodicWave per name). */
export type EngineWave = 'putt' | 'buzz' | 'chug' | 'rumble' | 'electric' | 'outboard' | 'drone';

export interface EngineSound extends EngineProfile {
  /** What it resolved from: a fleet variant id, a vehicle kind, or 'default'. */
  id: string;
  wave: EngineWave;
  /** Pitch curve: hz = idle + (max - idle) * revs^curve. 1 = linear, < 1 climbs early (a buzzy two-stroke), > 1 late (a heavy diesel). */
  curve: number;
  /** 0..1 level of a steady sine whine above the firing note (an electric motor, a gearbox). */
  whine: number;
  /** Whine pitch = firing Hz x this. */
  whineRatio: number;
  /** 0..1 extra whine that rises with load and revs (a turbo or supercharger spooling). */
  turbo: number;
  /** Misfires per second when healthy and dry (a lumpy hot rod pops; most engines 0). */
  misfire: number;
  /** Loudness at idle with no load, relative to working flat out (electric ~0.2, combustion ~0.75). */
  idleLevel: number;
  /** Multiplier on the exhaust noise (electric ~0.1). */
  noise: number;
  /** No engine at all (push bike, Tessie): always silent. */
  silent: boolean;
}

/** A table entry: anything left out comes from engineModel.ts's guess for the vehicle (or the defaults below). */
export type EngineSoundDef = Partial<Omit<EngineSound, 'id'>>;

const EXTRA_DEFAULTS: Omit<EngineSound, keyof EngineProfile | 'id' | 'wave'> = {
  curve: 1, whine: 0, whineRatio: 8, turbo: 0, misfire: 0, idleLevel: 0.75, noise: 1, silent: false,
};

/** Every vehicle in config.ts VEHICLES, by kind. */
const TABLE: Record<string, EngineSoundDef> = {
  // No engine: pedal power and a turtle.
  'push-bike': { silent: true, gain: 0 },
  // Tubing (tubing/): towed or paddled, no engine.
  'tow-tube': { silent: true, gain: 0 },
  tessie: { silent: true, gain: 0 },

  // Mowers.
  'ride-on': { wave: 'putt', idleHz: 22, maxHz: 70, gears: 0, bright: 0.4, rough: 0.3, gain: 0.9, curve: 0.9 },
  'zero-turn': {
    wave: 'buzz', idleHz: 28, maxHz: 105, gears: 0, bright: 0.7, rough: 0.25, gain: 1, curve: 0.85,
    turbo: 0.45, whineRatio: 11,
  },
  lowrider: {
    wave: 'rumble', idleHz: 16, maxHz: 58, gears: 3, bright: 0.35, rough: 0.5, gain: 1.1, curve: 1, misfire: 0.15,
  },
  'mulch-spreader': { wave: 'chug', idleHz: 18, maxHz: 55, gears: 0, bright: 0.3, rough: 0.55, gain: 1.05, curve: 1 },
  whirligig: {
    wave: 'drone', idleHz: 30, maxHz: 58, gears: 0, bright: 0.45, rough: 0.35, gain: 1, chop: 0.32,
    turbo: 0.2, whineRatio: 14,
  },

  // Farm and town.
  combine: {
    wave: 'chug', idleHz: 11, maxHz: 34, gears: 4, bright: 0.25, rough: 0.7, gain: 1.25, curve: 1.15,
    whine: 0.18, whineRatio: 9,
  },
  'boot-float': { wave: 'chug', idleHz: 12, maxHz: 30, gears: 2, bright: 0.3, rough: 0.6, gain: 1.15, curve: 1.1 },
  'snail-coach': {
    wave: 'rumble', idleHz: 13, maxHz: 42, gears: 4, bright: 0.35, rough: 0.55, gain: 1.15, curve: 1.05,
    turbo: 0.3, whineRatio: 16,
  },
  'hoa-van': { wave: 'rumble', idleHz: 17, maxHz: 60, gears: 4, bright: 0.45, rough: 0.35, gain: 1.05 },
  taxi: { wave: 'rumble', idleHz: 19, maxHz: 70, gears: 4, bright: 0.5, rough: 0.3, gain: 1 },

  // Odd rides.
  'pot-rod': { wave: 'buzz', idleHz: 24, maxHz: 85, gears: 3, bright: 0.75, rough: 0.5, gain: 1, misfire: 0.2 },
  'lawn-roller': { wave: 'chug', idleHz: 10, maxHz: 22, gears: 0, bright: 0.2, rough: 0.8, gain: 1.1, curve: 1.2 },
  'teacup-trundler': { wave: 'buzz', idleHz: 34, maxHz: 80, gears: 0, bright: 0.6, rough: 0.2, gain: 0.75, curve: 0.9 },
  'barrow-buggy': { wave: 'buzz', idleHz: 30, maxHz: 95, gears: 0, bright: 0.55, rough: 0.55, gain: 0.85, curve: 0.8, misfire: 0.3 },

  // European rides.
  'euro-hatch': { wave: 'buzz', idleHz: 30, maxHz: 110, gears: 4, bright: 0.55, rough: 0.25, gain: 0.85 },
  'deux-pots': { wave: 'chug', idleHz: 20, maxHz: 70, gears: 4, bright: 0.4, rough: 0.6, gain: 0.95, curve: 1.05, misfire: 0.1 },
  wespa: { wave: 'buzz', idleHz: 40, maxHz: 160, gears: 3, bright: 0.85, rough: 0.45, gain: 0.9, curve: 0.85, misfire: 0.15 },
  // Dirt country (E14): a small buzzy two-stroke, revvier and rougher than the Wespa.
  'dirt-bike': { wave: 'buzz', idleHz: 38, maxHz: 150, gears: 3, bright: 0.8, rough: 0.55, gain: 0.9, curve: 0.8, misfire: 0.2 },
  'baguette-trike': { wave: 'buzz', idleHz: 36, maxHz: 120, gears: 2, bright: 0.7, rough: 0.6, gain: 0.85, misfire: 0.25 },
  'crepe-van': { wave: 'rumble', idleHz: 15, maxHz: 50, gears: 3, bright: 0.3, rough: 0.5, gain: 1.05, curve: 1.1 },
  'golf-cart': {
    wave: 'electric', idleHz: 25, maxHz: 95, gears: 0, bright: 0.25, rough: 0.02, gain: 0.75,
    whine: 0.55, whineRatio: 7, idleLevel: 0.2, noise: 0.1,
  },

  // Boats.
  'walnut-dinghy': { wave: 'outboard', idleHz: 32, maxHz: 100, gears: 0, bright: 0.5, rough: 0.45, gain: 0.85, curve: 0.85 },
  'gravy-boat': { wave: 'outboard', idleHz: 30, maxHz: 110, gears: 0, bright: 0.65, rough: 0.4, gain: 0.95, curve: 0.85 },
  'clog-cruiser': { wave: 'rumble', idleHz: 18, maxHz: 52, gears: 0, bright: 0.35, rough: 0.5, gain: 1.05 },
  'watering-can-steamer': {
    wave: 'chug', idleHz: 8, maxHz: 20, gears: 0, bright: 0.2, rough: 0.9, gain: 1.15, curve: 1.2, noise: 1.4,
  },
  'hoa-patrol-boat': { wave: 'outboard', idleHz: 24, maxHz: 90, gears: 0, bright: 0.55, rough: 0.4, gain: 1.1, curve: 0.9 },

  // Aircraft.
  plane: { wave: 'drone', idleHz: 34, maxHz: 72, gears: 0, bright: 0.55, rough: 0.3, gain: 1.05, chop: 0.4 },
  // Air and sea (craft/): a buzzier sport prop, a slow-chopping copter, and the balloon's burner roar.
  'hedge-hopper': { wave: 'drone', idleHz: 38, maxHz: 84, gears: 0, bright: 0.6, rough: 0.25, gain: 1, chop: 0.35 },
  'sycamore-copter': {
    wave: 'drone', idleHz: 26, maxHz: 52, gears: 0, bright: 0.4, rough: 0.3, gain: 1.05, chop: 0.45, turbo: 0.25, whineRatio: 13,
  },
  'dandelion-drifter': { wave: 'chug', idleHz: 9, maxHz: 18, gears: 0, bright: 0.2, rough: 0.9, gain: 0.7, noise: 1.6, idleLevel: 0.35 },
};

const registered = new Map<string, EngineSoundDef>();

/** Give a vehicle kind or a fleet variant id its own engine sound (replaces any earlier entry for that id). */
export function registerEngineSound(id: string, def: EngineSoundDef): void {
  registered.set(id, def);
}

/** The table entry for an id (registered first, then the built-in table), or undefined. */
export function engineSoundDef(id: string): EngineSoundDef | undefined {
  return registered.get(id) ?? TABLE[id];
}

/** Ids with a built-in entry (for tests and the debug panel). */
export function engineSoundIds(): string[] {
  return Object.keys(TABLE);
}

function fallbackWave(spec: EngineSpecLike): EngineWave {
  if (spec.flies) return 'drone';
  if (spec.boat) return 'outboard';
  return 'putt';
}

/**
 * The engine sound for a vehicle: its fleet variant's entry, else its kind's, else engineModel.ts's guess from the spec.
 * spec.pitch (Vehicle.enginePitch) scales idleHz and maxHz (and so the whine).
 */
export function engineSoundFor(spec: EngineSpecLike & { kind?: string }, variant?: string): EngineSound {
  const id = variant !== undefined && engineSoundDef(variant) ? variant : spec.kind !== undefined && engineSoundDef(spec.kind) ? spec.kind : 'default';
  const def = id === 'default' ? undefined : engineSoundDef(id);
  const guess = engineProfile({ ...spec, pitch: undefined });
  const out: EngineSound = { ...guess, wave: fallbackWave(spec), ...EXTRA_DEFAULTS, ...def, id };
  const k = spec.pitch;
  if (k !== undefined && k !== 1 && Number.isFinite(k) && k > 0) {
    out.idleHz *= k;
    out.maxHz *= k;
  }
  if (out.maxHz <= out.idleHz) out.maxHz = out.idleHz + 1;
  if (!(out.curve > 0)) out.curve = 1;
  return out;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Firing frequency for revs 0..1 along the profile's pitch curve. Rises monotonically from idleHz to maxHz. */
export function engineHz(p: EngineSound, revs: number): number {
  return p.idleHz + (p.maxHz - p.idleHz) * Math.pow(clamp01(revs), p.curve);
}

/** The vehicle's state as far as the engine is concerned. All optional: absent = healthy and dry. */
export interface EngineCondition {
  /** Vehicle.hp, 0..1 (1 = new). */
  hp?: number;
  /** Vehicle.waterlog, 0..1. */
  waterlog?: number;
  /** Vehicle.waterlogStalled: flooded, will not run. */
  stalled?: boolean;
  /** A boat's prop clear of the water (waves.ts airtime), 0..1: the engine races. */
  propOut?: number;
}

/** What the condition does to the sound. */
export interface ConditionMix {
  /** Misfires per second (the profile's own plus damage and water). */
  misfire: number;
  /** Roughness 0..1 replacing the profile's. */
  rough: number;
  /** Level multiplier. */
  level: number;
  /** Pitch multiplier (a sick engine sags). */
  pitch: number;
}

/** Damage and water make an engine misfire, run rough and sag; a stalled one only coughs (the starter cranking). */
export function conditionMix(p: EngineSound, c: EngineCondition = {}): ConditionMix {
  if (p.silent) return { misfire: 0, rough: p.rough, level: 0, pitch: 1 };
  const d = 1 - clamp01(c.hp ?? 1);
  const w = clamp01(c.waterlog ?? 0);
  const electric = p.wave === 'electric';
  // An electric motor does not misfire; it stutters only when soaked.
  const misfire = (electric ? 0 : p.misfire + 3 * d * d) + (w > 0.35 ? (4 * (w - 0.35)) / 0.65 : 0);
  const rough = clamp01(p.rough + (electric ? 0.1 : 0.35) * d + 0.3 * w);
  const pitch = 1 - 0.08 * w - 0.05 * d;
  if (c.stalled) return { misfire: Math.max(4, misfire), rough: clamp01(rough + 0.4), level: 0.35, pitch: pitch * 0.6 };
  const po = clamp01(c.propOut ?? 0);
  if (po > 0) return { misfire, rough, level: 1 - 0.25 * po, pitch: pitch * (1 + 0.18 * po) };
  return { misfire, rough, level: 1, pitch };
}

/** Misfire state carried frame to frame: seconds left of the current dropout. */
export interface MisfireState {
  gap: number;
}

export function newMisfireState(): MisfireState {
  return { gap: 0 };
}

/** Level of a misfiring engine's dip. */
const MISFIRE_DIP = 0.15;

/**
 * Advance the misfires by dt seconds at `rate` per second. Returns the level gate for this frame: 1 running, or
 * MISFIRE_DIP during a 50-120 ms dropout. Mutates `st`; `rng` is injectable for tests.
 */
export function stepMisfire(st: MisfireState, rate: number, dt: number, rng: () => number = Math.random): number {
  if (st.gap > 0) {
    st.gap -= dt;
    return MISFIRE_DIP;
  }
  if (rate > 0 && dt > 0 && rng() < rate * dt) {
    st.gap = 0.05 + 0.07 * rng();
    return MISFIRE_DIP;
  }
  return 1;
}

/**
 * How loud other vehicles' engines sit in the mix, by who drives them: other players' vehicles matter to play (and win
 * voices first in enginePool.ts), police next, ambient traffic is background, a vehicle with no driver is quietest.
 */
export function engineMixFor(driver: string | undefined): number {
  switch (driver) {
    case 'remote': return 1;
    case 'police': return 0.9;
    case 'npc': return 0.75;
    default: return 0.6;
  }
}

/** The inputs voiceParams needs every frame. */
export interface VoiceFrame {
  /** Smoothed revs and load, 0..1 (engineModel.ts EngineState). */
  revs: number;
  load: number;
  /** conditionMix() result. */
  cond: ConditionMix;
  /** stepMisfire() result, 0..1. */
  gate: number;
  /** Base level before the profile's gain (player 0.075, others 0.11 x distance gain x mix). */
  base: number;
  /** Doppler ratio, default 1. */
  doppler?: number;
  /** Distance muffling cutoff (spatial.ts), Hz. */
  maxCutoff?: number;
}

/** Everything engineVoice.ts needs for one frame of this engine. */
export function voiceParams(p: EngineSound, f: VoiceFrame): EngineParams {
  const revs = clamp01(f.revs);
  const load = clamp01(f.load);
  const hz = engineHz(p, revs) * f.cond.pitch * (f.doppler ?? 1);
  const shape = p.idleLevel + (1 - p.idleLevel) * clamp01(0.4 * revs + 0.6 * load);
  const level = p.silent ? 0 : Math.max(0, f.base * p.gain * f.cond.level * f.gate * shape);
  const whine = clamp01(p.whine * (0.4 + 0.6 * revs) + p.turbo * load * revs);
  return {
    hz,
    load,
    level,
    bright: p.bright,
    rough: f.cond.rough,
    chop: p.chop,
    maxCutoff: f.maxCutoff,
    wave: p.wave,
    whine,
    whineHz: hz * p.whineRatio,
    noise: p.noise,
  };
}
