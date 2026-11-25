// Sound recipes, rendered to sample arrays (mono, peak-normalised to the given gain). Pure: no Web Audio here.
import type { Surface } from './surfaces';

export type UiSound = 'tap' | 'open' | 'close' | 'error' | 'toast' | 'grab' | 'drop' | 'stack';

/** A small deterministic PRNG in [-1, 1), so a recipe renders the same every time. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

export function normalise(out: Float32Array, gain: number): Float32Array {
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] = (out[i] / peak) * gain;
  return out;
}

/** A filtered noise burst: a one-pole lowpass, an exponential decay, and an optional click at the start. */
export function noise(sr: number, seconds: number, lp: number, decay: number, rand: () => number, click = 0): Float32Array {
  const n = Math.max(1, Math.floor(sr * seconds));
  const out = new Float32Array(n);
  const a = 1 - Math.exp((-2 * Math.PI * lp) / sr);
  let y = 0;
  for (let i = 0; i < n; i++) {
    y += a * (rand() - y);
    out[i] = y * Math.exp(-decay * (i / sr)) + (i < sr * 0.002 ? click * rand() : 0);
  }
  return out;
}

/** A sine blip with a pitch sweep from f0 to f1 and an exponential decay. */
export function blip(sr: number, seconds: number, f0: number, f1: number, decay: number): Float32Array {
  const n = Math.max(1, Math.floor(sr * seconds));
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const f = f0 + (f1 - f0) * (i / n);
    phase += (2 * Math.PI * f) / sr;
    out[i] = Math.sin(phase) * Math.exp(-decay * (i / sr));
  }
  return out;
}

export function mix(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(Math.max(a.length, b.length));
  out.set(a);
  for (let i = 0; i < b.length; i++) out[i] += b[i];
  return out;
}

export function renderUi(kind: UiSound, sr: number): Float32Array {
  switch (kind) {
    case 'tap': return normalise(blip(sr, 0.03, 1200, 900, 90), 0.25);
    case 'open': return normalise(blip(sr, 0.09, 600, 1000, 25), 0.25);
    case 'close': return normalise(blip(sr, 0.09, 1000, 500, 25), 0.25);
    case 'error': return normalise(mix(blip(sr, 0.12, 200, 180, 12), blip(sr, 0.12, 300, 270, 12)), 0.3);
    case 'toast': return normalise(blip(sr, 0.12, 880, 1320, 18), 0.18);
    case 'grab': return normalise(mix(blip(sr, 0.04, 400, 500, 40), noise(sr, 0.02, 4000, 90, rng(5), 1)), 0.22);
    case 'drop': return normalise(noise(sr, 0.06, 1500, 40, rng(6)), 0.3);
    case 'stack': return normalise(mix(blip(sr, 0.05, 700, 700, 40), blip(sr, 0.05, 900, 900, 40)), 0.2);
  }
}

const STEP: Record<Surface, { seconds: number; lp: number; decay: number; gain: number; click: number }> = {
  grass: { seconds: 0.09, lp: 1500, decay: 42, gain: 0.20, click: 0 },
  gravel: { seconds: 0.07, lp: 3200, decay: 58, gain: 0.28, click: 0.22 },
  stone: { seconds: 0.06, lp: 2600, decay: 62, gain: 0.30, click: 0.32 },
  moss: { seconds: 0.14, lp: 1000, decay: 26, gain: 0.14, click: 0 },
  mud: { seconds: 0.16, lp: 450, decay: 24, gain: 0.26, click: 0 },
};

/** One footstep. `volume` 0..1 scales the surface level (sneaking is quieter, a sprint is louder). */
export function renderStep(surface: Surface, sr: number, volume: number, seed = 1): Float32Array {
  const s = STEP[surface];
  return normalise(noise(sr, s.seconds, s.lp, s.decay, rng(seed), s.click), s.gain * Math.min(1, Math.max(0.05, volume)));
}

/** Melee swing whoosh or ceramic/clay hit thud. */
export function renderAttack(hit: boolean, sr: number): Float32Array {
  const whoosh = normalise(noise(sr, 0.14, 1800, 22, rng(19), 0.15), 0.28);
  if (!hit) return whoosh;
  const thud = normalise(mix(blip(sr, 0.1, 240, 90, 26), noise(sr, 0.08, 2800, 45, rng(23), 0.7)), 0.45);
  return mix(whoosh, thud);
}
