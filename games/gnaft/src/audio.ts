// WebAudio sound effects, ocean ambience and mower hum, all synthesised in code (no files).
import type { SfxName } from './config';

const MASTER_GAIN = 0.6;
const AMBIENCE_BASE = 0.07;
const AMBIENCE_LFO_HZ = 0.12;
const AMBIENCE_LFO_DEPTH = 0.04;
const ENGINE_BASE = 55;
const ENGINE_MAX_GAIN = 0.08;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let ambienceStarted = false;
let engineGain: GainNode | null = null;
let engineOsc: OscillatorNode | null = null;
let engineSquare: OscillatorNode | null = null;

let lastCutAt = -Infinity;
let lastReelAt = -Infinity;
let lastSplashAt = -Infinity;
let lastChompAt = -Infinity;
let lastGullAt = -Infinity;

let rainGain: GainNode | null = null;

/** Lazily create the context and master bus. Returns null if WebAudio is unavailable. */
function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const c = new AudioContext();
    const m = c.createGain();
    m.gain.value = MASTER_GAIN;
    m.connect(c.destination);
    ctx = c;
    master = m;
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const length = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, length, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buf;
  }
  return noiseBuffer;
}

function startAmbience(c: AudioContext, out: GainNode): void {
  if (ambienceStarted) return;
  ambienceStarted = true;
  const now = c.currentTime;

  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  src.loop = true;

  const lowpass = c.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 500;

  const ambienceGain = c.createGain();
  ambienceGain.gain.value = AMBIENCE_BASE;

  // Slow LFO swells the ambience gain like waves.
  const lfo = c.createOscillator();
  lfo.frequency.value = AMBIENCE_LFO_HZ;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = AMBIENCE_LFO_DEPTH;
  lfo.connect(lfoDepth);
  lfoDepth.connect(ambienceGain.gain);

  src.connect(lowpass);
  lowpass.connect(ambienceGain);
  ambienceGain.connect(out);

  src.start(now);
  lfo.start(now);
}

/** Call from a user gesture (the title-screen click) to unlock audio and start the ocean ambience. */
export function startAudio(): void {
  try {
    const c = ensureContext();
    if (!c || !master) return;
    if (c.state === 'suspended') void c.resume();
    startAmbience(c, master);
  } catch {
    // Audio must never break the game.
  }
}

/** Short synth helper: one oscillator with an exponential gain envelope. */
function tone(
  c: AudioContext,
  out: GainNode,
  f0: number,
  f1: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  delay = 0,
): void {
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + dur);
}

/** Short filtered noise burst. Filter sweeps from f0 to f1 (Hz) over dur seconds. */
function noise(
  c: AudioContext,
  out: GainNode,
  dur: number,
  vol: number,
  filterType: BiquadFilterType,
  f0: number,
  f1: number,
  delay = 0,
): void {
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(f0, t);
  filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  src.start(t, Math.random());
  src.stop(t + dur);
}

/** Oscillator (pitch sweep f0 -> f1) through a biquad filter, with an exponential gain envelope. */
function filteredTone(
  c: AudioContext,
  out: GainNode,
  f0: number,
  f1: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  filterType: BiquadFilterType,
  filterFreq: number,
  filterQ = 1,
  delay = 0,
): void {
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + dur);
}

/** Play a short sound effect. No-op before startAudio(). */
export function sfx(name: SfxName): void {
  try {
    const c = ctx;
    const out = master;
    if (!c || !out) return;
    if (c.state === 'suspended') void c.resume();

    const nowMs = performance.now();
    if (name === 'cut') {
      if (nowMs - lastCutAt < 60) return;
      lastCutAt = nowMs;
    } else if (name === 'reel') {
      if (nowMs - lastReelAt < 60) return;
      lastReelAt = nowMs;
    } else if (name === 'splash') {
      if (nowMs - lastSplashAt < 80) return;
      lastSplashAt = nowMs;
    } else if (name === 'chomp') {
      if (nowMs - lastChompAt < 80) return;
      lastChompAt = nowMs;
    } else if (name === 'gull') {
      if (nowMs - lastGullAt < 80) return;
      lastGullAt = nowMs;
    }

    switch (name) {
      case 'throw':
        noise(c, out, 0.35, 0.18, 'bandpass', 400, 3000);
        break;
      case 'reel':
        tone(c, out, 1400, 1100, 0.02, 'square', 0.04);
        break;
      case 'catch':
        tone(c, out, 660, 660, 0.12, 'square', 0.08);
        tone(c, out, 990, 990, 0.18, 'square', 0.08, 0.1);
        break;
      case 'place':
        tone(c, out, 120, 60, 0.18, 'sine', 0.3);
        break;
      case 'cut':
        noise(c, out, 0.1, 0.15, 'highpass', 4000, 1500);
        break;
      case 'craft':
        tone(c, out, 523, 523, 0.1, 'triangle', 0.1, 0);
        tone(c, out, 659, 659, 0.1, 'triangle', 0.1, 0.09);
        tone(c, out, 784, 784, 0.18, 'triangle', 0.1, 0.18);
        break;
      case 'spot':
        tone(c, out, 1320, 1320, 0.4, 'sine', 0.15);
        break;
      case 'dock':
        // Low horn: sawtooth through a lowpass for a muffled blast.
        {
          const osc = c.createOscillator();
          const lp = c.createBiquadFilter();
          const gain = c.createGain();
          const t = c.currentTime;
          osc.type = 'sawtooth';
          osc.frequency.value = 110;
          lp.type = 'lowpass';
          lp.frequency.value = 600;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.18, t + 0.05);
          gain.gain.setValueAtTime(0.18, t + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
          osc.connect(lp);
          lp.connect(gain);
          gain.connect(out);
          osc.start(t);
          osc.stop(t + 0.7);
        }
        break;
      case 'loot':
        tone(c, out, 1800, 1800, 0.06, 'square', 0.06);
        tone(c, out, 2400, 2400, 0.08, 'square', 0.06, 0.07);
        break;
      case 'error':
        tone(c, out, 90, 90, 0.3, 'square', 0.1);
        break;
      case 'click':
        tone(c, out, 1000, 1000, 0.005, 'square', 0.05);
        break;
      case 'splash':
        noise(c, out, 0.35, 0.2, 'bandpass', 800, 300);
        break;
      case 'thunder':
        {
          // Low rumble: lowpassed noise, fast attack, a second swell at 0.4 s, long decay.
          const src = c.createBufferSource();
          src.buffer = getNoiseBuffer(c);
          const lp = c.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = 200;
          const gain = c.createGain();
          const t = c.currentTime;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.6, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.2, t + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.45, t + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
          src.connect(lp);
          lp.connect(gain);
          gain.connect(out);
          src.start(t, Math.random());
          src.stop(t + 2.5);
        }
        break;
      case 'gull':
        filteredTone(c, out, 1400, 900, 0.18, 'sawtooth', 0.08, 'bandpass', 1100, 3);
        filteredTone(c, out, 1400, 900, 0.18, 'sawtooth', 0.08, 'bandpass', 1100, 3, 0.1);
        break;
      case 'shark':
        filteredTone(c, out, 82, 82, 0.25, 'sawtooth', 0.2, 'lowpass', 400);
        filteredTone(c, out, 87, 87, 0.25, 'sawtooth', 0.2, 'lowpass', 400, 1, 0.25);
        break;
      case 'bonk':
        tone(c, out, 300, 120, 0.12, 'sine', 0.25);
        noise(c, out, 0.03, 0.12, 'highpass', 3000, 3000);
        break;
      case 'win':
        // Rising fanfare; the last note is held for 0.5 s.
        tone(c, out, 523, 523, 0.12, 'square', 0.08, 0);
        tone(c, out, 659, 659, 0.12, 'square', 0.08, 0.12);
        tone(c, out, 784, 784, 0.12, 'square', 0.08, 0.24);
        tone(c, out, 1047, 1047, 0.12, 'square', 0.08, 0.36);
        tone(c, out, 1319, 1319, 0.5, 'square', 0.08, 0.48);
        break;
      case 'bottle':
        // Glassy clink, then a soft cork pop.
        tone(c, out, 2200, 2200, 0.3, 'sine', 0.12);
        tone(c, out, 3300, 3300, 0.3, 'sine', 0.08);
        tone(c, out, 600, 200, 0.08, 'sine', 0.2, 0.3);
        break;
      case 'chomp':
        noise(c, out, 0.12, 0.3, 'lowpass', 800, 200);
        tone(c, out, 90, 50, 0.12, 'sine', 0.25);
        break;
      case 'quack':
        // Two nasal squeaks: a sawtooth through a bandpass, pitch dropping.
        filteredTone(c, out, 900, 520, 0.14, 'sawtooth', 0.18, 'bandpass', 1100, 4);
        filteredTone(c, out, 850, 480, 0.16, 'sawtooth', 0.18, 'bandpass', 1100, 4, 0.18);
        break;
      case 'swim':
        noise(c, out, 0.25, 0.12, 'lowpass', 900, 300);
        break;
    }
  } catch {
    // Audio must never break the game.
  }
}

/** Mower engine hum. 0 = off, 1 = full. Call every frame from the mowing system. */
export function setEngine(level: number): void {
  try {
    const c = ctx;
    const out = master;
    if (!c || !out) return;
    const lvl = Math.min(1, Math.max(0, level));

    if (!engineGain || !engineOsc || !engineSquare) {
      const now = c.currentTime;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      const gain = c.createGain();
      gain.gain.value = 0;
      lp.connect(gain);
      gain.connect(out);

      const saw = c.createOscillator();
      saw.type = 'sawtooth';
      saw.frequency.value = ENGINE_BASE;
      saw.connect(lp);

      const sq = c.createOscillator();
      sq.type = 'square';
      sq.frequency.value = ENGINE_BASE * 2;
      sq.connect(lp);

      saw.start(now);
      sq.start(now);

      engineGain = gain;
      engineOsc = saw;
      engineSquare = sq;
    }

    const now = c.currentTime;
    engineGain.gain.setTargetAtTime(ENGINE_MAX_GAIN * lvl, now, 0.1);
    const freq = ENGINE_BASE + 25 * lvl;
    engineOsc.frequency.setTargetAtTime(freq, now, 0.1);
    engineSquare.frequency.setTargetAtTime(freq * 2, now, 0.1);
  } catch {
    // Audio must never break the game.
  }
}

/** The shared audio graph once startAudio() has run, else null. Other modules (music) connect to `master`. */
export function getAudio(): { ctx: AudioContext; master: GainNode } | null {
  return ctx && master ? { ctx, master } : null;
}

/** Rain noise level 0..1, called every frame by the weather system. No-op before startAudio(). */
export function setRain(level: number): void {
  try {
    const c = ctx;
    const out = master;
    if (!c || !out) return;
    const lvl = Math.min(1, Math.max(0, level));

    if (!rainGain) {
      const src = c.createBufferSource();
      src.buffer = getNoiseBuffer(c);
      src.loop = true;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1200;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 6000;
      const gain = c.createGain();
      gain.gain.value = 0;
      src.connect(hp);
      hp.connect(lp);
      lp.connect(gain);
      gain.connect(out);
      src.start(c.currentTime);
      rainGain = gain;
    }

    rainGain.gain.setTargetAtTime(0.1 * lvl, c.currentTime, 0.3);
  } catch {
    // Audio must never break the game.
  }
}
