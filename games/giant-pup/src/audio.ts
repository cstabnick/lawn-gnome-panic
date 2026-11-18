// Synthesized sound effects (WebAudio, no files). Every sound is built from oscillators and
// a shared white-noise buffer when it plays. Nothing touches the AudioContext until unlockAudio().

export type Sfx =
  | 'bark' | 'woof' | 'whine' | 'pant' | 'squeak' | 'slurp' | 'crunch'
  | 'splash' | 'scrub' | 'pop' | 'throw' | 'happy' | 'snore' | 'click' | 'fail';

const MUTE_KEY = 'giant-pup.muted';
const MASTER_VOL = 0.6;
const DOG_PITCH_JITTER = 0.08;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted: boolean | null = null; // read from storage the first time it is needed
const lastPlayed = new Map<Sfx, number>();

/** Everything a sound needs: the context, the output node, the noise buffer and the start time. */
interface Rig {
  c: AudioContext;
  out: AudioNode;
  n: AudioBuffer;
  t: number;
}

/** [seconds from start, value] points for an exponential frequency or filter curve. */
type Pt = [number, number];

function readMuted(): boolean {
  if (muted === null) {
    try {
      muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      muted = false;
    }
  }
  return muted;
}

function makeNoise(c: AudioContext): AudioBuffer {
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Call from a user gesture (pointerdown); safe to call many times. */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      const c = new Ctor();
      const m = c.createGain();
      const comp = c.createDynamicsCompressor();
      m.gain.value = readMuted() ? 0 : MASTER_VOL;
      m.connect(comp);
      comp.connect(c.destination);
      ctx = c;
      master = m;
      noiseBuf = makeNoise(c);
    } catch {
      return;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    // storage blocked: the mute still applies for this session
  }
  if (master) master.gain.value = m ? 0 : MASTER_VOL;
}

export function isMuted(): boolean {
  return readMuted();
}

/** Exponential curve through the given points, starting at time t. */
function sweep(p: AudioParam, t: number, pts: Pt[]): void {
  p.setValueAtTime(pts[0][1], t + pts[0][0]);
  for (let i = 1; i < pts.length; i++) {
    p.exponentialRampToValueAtTime(pts[i][1], t + pts[i][0]);
  }
}

/** Gain envelope: quick rise to peak, then fall to silence at `end` (never exactly 0). */
function envelope(g: AudioParam, t: number, peak: number, attack: number, end: number): void {
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(peak, t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + end);
}

function scalePts(pts: Pt[], k: number): Pt[] {
  return pts.map(([at, v]) => [at, v * k] as Pt);
}

function biquad(r: Rig, type: BiquadFilterType, freq: number, q = 1): BiquadFilterNode {
  const f = r.c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** Looping noise from a random offset (so repeats do not sound identical), stopped after dur. */
function noiseSrc(r: Rig, t: number, dur: number): AudioBufferSourceNode {
  const s = r.c.createBufferSource();
  s.buffer = r.n;
  s.loop = true;
  s.start(t, Math.random() * 0.8);
  s.stop(t + dur + 0.02);
  return s;
}

/** Oscillator voice with an envelope, routed into dest (a filter or the output). */
function voice(
  r: Rig, type: OscillatorType, pts: Pt[], t: number, dur: number,
  peak: number, attack: number, dest: AudioNode,
): OscillatorNode {
  const o = r.c.createOscillator();
  o.type = type;
  sweep(o.frequency, t, pts);
  const g = r.c.createGain();
  envelope(g.gain, t, peak, attack, dur);
  o.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
  return o;
}

/** Noise through a filter whose frequency follows pts, with an envelope. */
function noiseFx(
  r: Rig, t: number, dur: number, type: BiquadFilterType, pts: Pt[],
  q: number, peak: number, attack: number,
): void {
  const s = noiseSrc(r, t, dur);
  const f = biquad(r, type, pts[0][1], q);
  sweep(f.frequency, t, pts);
  const g = r.c.createGain();
  envelope(g.gain, t, peak, attack, dur);
  s.connect(f);
  f.connect(g);
  g.connect(r.out);
}

/** Big dog "ruff": sawtooth through a lowpass, plus a short chesty noise burst. */
function ruff(r: Rig, t: number, k: number, f0: number, f1: number, dur: number, vol: number): void {
  const lp = biquad(r, 'lowpass', 1200, 4);
  lp.connect(r.out);
  voice(r, 'sawtooth', scalePts([[0, f0], [dur, f1]], k), t, dur, vol, 0.01, lp);
  noiseFx(r, t, 0.08, 'bandpass', [[0, 900]], 1.5, vol * 0.6, 0.005);
}

/** Sine LFO wobbling an oscillator frequency (the whine vibrato). */
function vibrato(r: Rig, o: OscillatorNode, rate: number, depth: number, t: number, dur: number): void {
  const lfo = r.c.createOscillator();
  lfo.frequency.value = rate;
  const g = r.c.createGain();
  g.gain.value = depth;
  lfo.connect(g);
  g.connect(o.frequency);
  lfo.start(t);
  lfo.stop(t + dur + 0.02);
}

function synth(r: Rig, sfx: Sfx): void {
  const k = 1 + (Math.random() * 2 - 1) * DOG_PITCH_JITTER;
  switch (sfx) {
    case 'bark':
      ruff(r, r.t, k, 170, 110, 0.18, 0.35);
      ruff(r, r.t + 0.22, k, 170, 110, 0.18, 0.35);
      break;
    case 'woof':
      ruff(r, r.t, k, 140, 85, 0.3, 0.4);
      break;
    case 'whine': {
      const lp = biquad(r, 'lowpass', 2500, 0.7);
      lp.connect(r.out);
      const o = voice(r, 'sine', scalePts([[0, 700], [0.3, 1000], [0.6, 650]], k), r.t, 0.6, 0.1, 0.05, lp);
      vibrato(r, o, 7, 25, r.t, 0.6);
      break;
    }
    case 'pant':
      for (let i = 0; i < 4; i++) {
        noiseFx(r, r.t + i * 0.12, 0.09, 'bandpass', [[0, 1500]], 1.2, 0.3, 0.01);
      }
      break;
    case 'squeak': {
      const bp = biquad(r, 'bandpass', 1800, 1.5);
      bp.connect(r.out);
      voice(r, 'square', [[0, 1400], [0.07, 2200], [0.15, 1500]], r.t, 0.15, 0.12, 0.01, bp);
      break;
    }
    case 'slurp':
      for (let i = 0; i < 3; i++) {
        noiseFx(r, r.t + i * 0.18, 0.15, 'lowpass', [[0, 400], [0.15, 1800]], 2, 0.35, 0.02);
      }
      break;
    case 'crunch':
      for (let i = 0; i < 10; i++) {
        noiseFx(r, r.t + Math.random() * 0.4, 0.02, 'highpass', [[0, 2000]], 1, 0.4, 0.002);
      }
      break;
    case 'splash':
      noiseFx(r, r.t, 0.5, 'lowpass', [[0, 3000], [0.5, 400]], 1, 0.5, 0.03);
      break;
    case 'scrub':
      noiseFx(r, r.t, 0.08, 'bandpass', [[0, 2500]], 2, 0.15, 0.005);
      break;
    case 'pop': {
      const g = r.c.createGain();
      g.connect(r.out);
      voice(r, 'sine', [[0, 600], [0.06, 200]], r.t, 0.06, 0.4, 0.002, g);
      break;
    }
    case 'throw':
      noiseFx(r, r.t, 0.25, 'bandpass', [[0, 500], [0.25, 2500]], 1.5, 0.35, 0.05);
      break;
    case 'happy': {
      const g = r.c.createGain();
      g.connect(r.out);
      voice(r, 'triangle', [[0, 659.25]], r.t, 0.12, 0.25, 0.005, g);
      voice(r, 'triangle', [[0, 880]], r.t + 0.12, 0.12, 0.25, 0.005, g);
      break;
    }
    case 'snore': {
      // Swell in and out over 1.2 s, quiet, with a low sawtooth rumble underneath.
      noiseFx(r, r.t, 1.2, 'lowpass', [[0, 400]], 1, 0.08, 0.6);
      const rumble = biquad(r, 'lowpass', 200, 1);
      rumble.connect(r.out);
      voice(r, 'sawtooth', [[0, 60]], r.t, 1.2, 0.04, 0.3, rumble);
      break;
    }
    case 'click': {
      const g = r.c.createGain();
      g.connect(r.out);
      voice(r, 'sine', [[0, 1000]], r.t, 0.03, 0.2, 0.002, g);
      break;
    }
    case 'fail': {
      const g = r.c.createGain();
      g.connect(r.out);
      voice(r, 'triangle', [[0, 440]], r.t, 0.14, 0.25, 0.005, g);
      voice(r, 'triangle', [[0, 349.23]], r.t + 0.14, 0.14, 0.25, 0.005, g);
      break;
    }
  }
}

export function play(sfx: Sfx): void {
  const c = ctx;
  const out = master;
  const n = noiseBuf;
  if (!c || !out || !n) return;
  if (readMuted()) return;

  const now = performance.now();
  const gap = sfx === 'snore' ? 1500 : sfx === 'scrub' ? 90 : 60;
  const last = lastPlayed.get(sfx);
  if (last !== undefined && now - last < gap) return;
  lastPlayed.set(sfx, now);

  synth({ c, out, n, t: c.currentTime }, sfx);
}
