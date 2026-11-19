// Sound effects from WebAudio oscillators and noise. Never throws.
import type { SfxName } from './config';

const MUTE_KEY = 'gnome-sweet-gnome.muted';
const MAX_STARTS_PER_SEC = 24;

type Out = AudioNode;
type Voice = (c: AudioContext, out: Out, t: number, p: number) => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
const recentStarts: number[] = [];

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readMuted();

/** The one AudioContext, created on first use and resumed when suspended. Null if WebAudio is missing. */
function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

/** One second of random samples, reused as the source for every noise sound. */
function getNoise(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/** Drops sounds beyond MAX_STARTS_PER_SEC so a big cascade does not clip. */
function allowStart(): boolean {
  const now = Date.now();
  while (recentStarts.length && now - recentStarts[0] > 1000) recentStarts.shift();
  if (recentStarts.length >= MAX_STARTS_PER_SEC) return false;
  recentStarts.push(now);
  return true;
}

interface ToneOpts {
  glideTo?: number; // end frequency of an exponential glide
  vibratoHz?: number; // LFO rate on frequency
  vibratoDepth?: number; // LFO depth in Hz (default 20)
}

/** One oscillator through a gain envelope, optionally gliding and wobbling. */
function tone(
  c: AudioContext,
  out: Out,
  t: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  o: ToneOpts = {},
): void {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t + dur);
  if (o.vibratoHz) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = o.vibratoHz;
    depth.gain.value = o.vibratoDepth ?? 20;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.02);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Filtered noise with a sweeping filter frequency and a fading envelope. */
function noise(
  c: AudioContext,
  out: Out,
  t: number,
  dur: number,
  vol: number,
  filter: BiquadFilterType,
  f0: number,
  f1: number,
): void {
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  const flt = c.createBiquadFilter();
  flt.type = filter;
  flt.frequency.setValueAtTime(f0, t);
  flt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(flt);
  flt.connect(g);
  g.connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

/** Every sound, as scheduled notes. `p` multiplies all frequencies. */
const VOICES: Record<SfxName, Voice> = {
  swap: (c, o, t, p) => {
    tone(c, o, t, 620 * p, 0.09, 'sine', 0.18, { glideTo: 760 * p });
  },
  bad: (c, o, t, p) => {
    tone(c, o, t, 170 * p, 0.12, 'square', 0.1, { glideTo: 120 * p });
    tone(c, o, t + 0.15, 170 * p, 0.14, 'square', 0.1, { glideTo: 110 * p });
  },
  match: (c, o, t, p) => {
    tone(c, o, t, 880 * p, 0.5, 'sine', 0.2);
    tone(c, o, t, 1760 * p, 0.4, 'triangle', 0.08);
  },
  special: (c, o, t, p) => {
    [523, 659, 784].forEach((f, i) => tone(c, o, t + i * 0.09, f * p, 0.2, 'triangle', 0.14));
  },
  mower: (c, o, t, p) => {
    tone(c, o, t, 140 * p, 0.35, 'sawtooth', 0.09, { glideTo: 120 * p, vibratoHz: 28, vibratoDepth: 25 });
  },
  bomb: (c, o, t, p) => {
    noise(c, o, t, 0.6, 0.5, 'lowpass', 1800, 120);
    tone(c, o, t, 120 * p, 0.35, 'sine', 0.35, { glideTo: 40 * p });
  },
  prism: (c, o, t, p) => {
    [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) =>
      tone(c, o, t + i * 0.045, f * p, 0.12, 'sine', 0.1),
    );
  },
  bee: (c, o, t, p) => {
    tone(c, o, t, 230 * p, 0.5, 'square', 0.07, { vibratoHz: 40, vibratoDepth: 30 });
  },
  stone: (c, o, t) => {
    noise(c, o, t, 0.06, 0.4, 'highpass', 2500, 1500);
  },
  weeds: (c, o, t) => {
    noise(c, o, t, 0.3, 0.12, 'bandpass', 600, 1600);
  },
  gnome: (c, o, t, p) => {
    tone(c, o, t, 523 * p, 0.14, 'triangle', 0.2);
    tone(c, o, t + 0.12, 784 * p, 0.25, 'triangle', 0.2);
  },
  win: (c, o, t, p) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(c, o, t + i * 0.12, f * p, 0.16, 'triangle', 0.16));
    [523, 659, 784, 1047].forEach((f) => tone(c, o, t + 0.5, f * p, 0.7, 'triangle', 0.12));
  },
  lose: (c, o, t, p) => {
    tone(c, o, t, 392 * p, 0.25, 'sawtooth', 0.1, { glideTo: 370 * p });
    tone(c, o, t + 0.27, 349 * p, 0.25, 'sawtooth', 0.1, { glideTo: 330 * p });
    tone(c, o, t + 0.54, 311 * p, 0.5, 'sawtooth', 0.1, { glideTo: 277 * p });
  },
  star: (c, o, t, p) => {
    tone(c, o, t, 1976 * p, 0.4, 'sine', 0.18);
    tone(c, o, t, 3952 * p, 0.2, 'sine', 0.05);
  },
  coin: (c, o, t, p) => {
    tone(c, o, t, 1318 * p, 0.07, 'square', 0.07);
    tone(c, o, t + 0.07, 1760 * p, 0.12, 'square', 0.07);
  },
  build: (c, o, t, p) => {
    tone(c, o, t, 523 * p, 0.12, 'triangle', 0.16);
    tone(c, o, t + 0.1, 784 * p, 0.3, 'triangle', 0.16);
    noise(c, o, t + 0.1, 0.3, 0.08, 'highpass', 5000, 9000);
  },
  click: (c, o, t, p) => {
    tone(c, o, t, 1400 * p, 0.02, 'triangle', 0.06);
  },
};

function play(name: SfxName, pitch: number): void {
  if (muted) return;
  const p = Number.isFinite(pitch) && pitch > 0 ? pitch : 1;
  if (!allowStart()) return;
  const c = getContext();
  if (!c || !master) return;
  VOICES[name](c, master, c.currentTime + 0.01, p);
}

export function playSfx(name: SfxName, pitch = 1): void {
  try {
    play(name, pitch);
  } catch {
    // Audio must never break the game.
  }
}

/** The match chime, a step higher for every cascade (0 = the swap's own match). */
export function playMatch(cascade: number): void {
  try {
    const steps = Math.max(0, Math.min(Number.isFinite(cascade) ? cascade : 0, 8));
    play('match', 2 ** (steps * 2 / 12));
  } catch {
    // Audio must never break the game.
  }
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    // Storage may be blocked; the mute still holds for this visit.
  }
}

export function isMuted(): boolean {
  return muted;
}
