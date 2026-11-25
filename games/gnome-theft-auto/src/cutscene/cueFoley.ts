// Batch-3 cutscene foley (script.ts FoleySfx) and the character intro stinger. Procedural WebAudio only, built from the
// helpers in cueSynth.ts. cueAudio.ts plays them through a pan and gain per call; each synth must finish within 2.4 s
// (cueAudio disconnects the per-call nodes after 2.5 s).
import type { FoleySfx } from './script';
import { biquad, decay, noiseBurst, noiseSource, note, ping, release, swell } from './cueSynth';

/** Schedule one sound into `out` at AudioContext time `t`. Peak gain about 0.1..0.6. */
export type Synth = (c: AudioContext, out: AudioNode, t: number) => void;

/** Random pitch within +-8 %, so repeated plays do not sound identical. */
const jitter = (f: number): number => f * (0.92 + Math.random() * 0.16);

/** A sine glide 1200 -> 1700 -> 1300 Hz (the clay squeak). */
function squeakTone(c: AudioContext, out: AudioNode, t: number, dur: number, peak: number): void {
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(1200, t);
  o.frequency.exponentialRampToValueAtTime(1700, t + dur * 0.4);
  o.frequency.exponentialRampToValueAtTime(1300, t + dur);
  const g = c.createGain();
  decay(g, peak, t, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
  release(o, [o, g]);
}

/** A slow swell of highpass noise (the rustle of cloth or paper bags). */
function swellNoise(c: AudioContext, out: AudioNode, t: number, dur: number, f: number, peak: number): void {
  const src = noiseSource(c, t, dur);
  const f1 = biquad(c, 'highpass', f, 0.7);
  const g = c.createGain();
  swell(g, peak, t, dur * 0.3, dur);
  src.connect(f1).connect(g).connect(out);
  release(src, [src, f1, g]);
}

/** Camera shutter: a click, a short gap, a second click. */
function snapShutter(c: AudioContext, out: AudioNode, t: number): void {
  noiseBurst(c, out, t, 0.02, 'highpass', 3000, 3000, 0.4);
  noiseBurst(c, out, t + 0.1, 0.02, 'highpass', 3000, 3000, 0.4);
}

const cloth: Synth = (c, out, t) => {
  noiseBurst(c, out, t, 0.3, 'bandpass', jitter(900), jitter(600), 0.12);
  noiseBurst(c, out, t + 0.14, 0.3, 'bandpass', jitter(900), jitter(600), 0.1);
};

const paper: Synth = (c, out, t) => {
  const n = 3 + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const f = 3000 + Math.random() * 2000;
    noiseBurst(c, out, t + i * 0.05 + Math.random() * 0.01, 0.03, 'highpass', f, f, 0.2);
  }
};

const pour: Synth = (c, out, t) => {
  // six short bursts gliding 500 -> 1400 Hz, alternating loud and soft for a tremolo
  for (let k = 0; k < 6; k++) {
    const f0 = 500 + 900 * (k / 6);
    const f1 = 500 + 900 * ((k + 1) / 6);
    noiseBurst(c, out, t + k * 0.15, 0.2, 'bandpass', jitter(f0), jitter(f1), k % 2 ? 0.12 : 0.18);
  }
};

const clink: Synth = (c, out, t) => {
  ping(c, out, 'sine', t, 0.4, jitter(2600), jitter(2600), 0.25);
  ping(c, out, 'sine', t, 0.3, jitter(3400), jitter(3400), 0.15);
};

const chair: Synth = (c, out, t) => {
  const bp = biquad(c, 'bandpass', 120, 1.5);
  bp.connect(out);
  ping(c, bp, 'sawtooth', t, 0.35, jitter(140), jitter(90), 0.2);
};

const keys: Synth = (c, out, t) => {
  for (let i = 0; i < 6; i++) {
    const f = 3000 + Math.random() * 3000;
    ping(c, out, 'sine', t + i * 0.05 + Math.random() * 0.02, 0.08, f, f, 0.12);
  }
};

const zip: Synth = (c, out, t) => {
  // 12 ticks whose gaps shrink, so the rate rises
  for (let i = 0; i < 12; i++) {
    const at = t + 0.6 * (1 - (1 - i / 12) ** 2);
    noiseBurst(c, out, at, 0.03, 'highpass', 3000, 3000, 0.15);
  }
};

const bell: Synth = (c, out, t) => {
  ping(c, out, 'sine', t, 1.2, jitter(1800), jitter(1800), 0.25);
  ping(c, out, 'sine', t, 1.2, jitter(2700), jitter(2700), 0.12);
};

const crunch: Synth = (c, out, t) => {
  for (let i = 0; i < 3; i++) noiseBurst(c, out, t + i * 0.07, 0.08, 'lowpass', jitter(1200), jitter(1200), 0.3);
};

const creak: Synth = (c, out, t) => {
  const bp = biquad(c, 'bandpass', 90, 6);
  bp.connect(out);
  ping(c, bp, 'sawtooth', t, 1.4, jitter(70), jitter(110), 0.2);
};

const thunder: Synth = (c, out, t) => {
  noiseBurst(c, out, t, 2.2, 'lowpass', jitter(180), jitter(60), 0.5);
  ping(c, out, 'sine', t, 2, jitter(50), jitter(50), 0.3);
};

const gulp: Synth = (c, out, t) => {
  ping(c, out, 'sine', t, 0.12, jitter(300), jitter(160), 0.3);
};

const tap: Synth = (c, out, t) => {
  for (let i = 0; i < 4; i++) noiseBurst(c, out, t + i * 0.11, 0.06, 'lowpass', jitter(800), jitter(800), 0.15);
};

const pop: Synth = (c, out, t) => {
  ping(c, out, 'sine', t, 0.06, jitter(600), jitter(250), 0.3);
  noiseBurst(c, out, t, 0.02, 'highpass', 3000, 3000, 0.2);
};

const clatter: Synth = (c, out, t) => {
  for (let i = 0; i < 6; i++) {
    const f = 900 + Math.random() * 1600;
    ping(c, out, 'sine', t + Math.random() * 0.5, 0.12, f, f, 0.15);
  }
};

const latch: Synth = (c, out, t) => {
  noiseBurst(c, out, t, 0.03, 'highpass', 2000, 2000, 0.3);
  noiseBurst(c, out, t + 0.07, 0.03, 'highpass', 2000, 2000, 0.3);
};

const squeak: Synth = (c, out, t) => {
  squeakTone(c, out, t, 0.18, 0.2);
};

const shovel: Synth = (c, out, t) => {
  noiseBurst(c, out, t, 0.25, 'lowpass', 400, 300, 0.4);
  noiseBurst(c, out, t + 0.1, 0.08, 'lowpass', 1200, 1200, 0.25);
};

const flutter: Synth = (c, out, t) => {
  for (let i = 0; i < 8; i++) noiseBurst(c, out, t + i * 0.05, 0.04, 'bandpass', jitter(1500), jitter(1500), 0.2);
};

const staticCrackle: Synth = (c, out, t) => {
  // ten slots, about 60 % filled, so the crackle has random gaps
  for (let i = 0; i < 10; i++) {
    if (Math.random() > 0.6) continue;
    noiseBurst(c, out, t + i * 0.06 + Math.random() * 0.02, 0.03 + Math.random() * 0.03, 'bandpass', jitter(2200), jitter(2200), 0.15);
  }
};

const snap: Synth = (c, out, t) => {
  snapShutter(c, out, t);
};

const rustle: Synth = (c, out, t) => {
  swellNoise(c, out, t, 0.6, 2500, 0.15);
};

/** One synth per FoleySfx. */
export const FOLEY: Record<FoleySfx, Synth> = {
  cloth,
  paper,
  pour,
  clink,
  chair,
  keys,
  zip,
  bell,
  crunch,
  creak,
  thunder,
  gulp,
  tap,
  pop,
  clatter,
  latch,
  squeak,
  shovel,
  flutter,
  static: staticCrackle,
  snap,
  rustle,
};

/** The 'intro' stinger (a character intro card): a camera-flash freeze, then a rising chord arpeggio. Under 2 s. */
export const INTRO_STINGER: Synth = (c, out, t) => {
  snapShutter(c, out, t);
  [62, 66, 69, 74].forEach((m, i) => note(c, out, 'triangle', t + 0.12 + i * 0.06, 0.9, m, 0.12));
  noiseBurst(c, out, t + 0.12, 1.0, 'highpass', 6000, 4000, 0.05);
};
