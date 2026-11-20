// Synthesized sound effects and the mower engine hum. Web Audio only, no files.
import type { Sfx } from './types';

const MUTE_KEY = 'gta.muted';
const MASTER_LEVEL = 0.5;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let lastSquirt = -1;
let lastGunshot = -1;
let muted = loadMuted();

interface Engine {
  osc: OscillatorNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoDepth: GainNode;
}
let engine: Engine | null = null;
let lastFreq = -1;
let lastGain = -1;
let lastDepth = -1;
let lastPlane = false;

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function saveMuted(m: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* storage blocked: mute still works for this page */
  }
}

/** Create the AudioContext on the first call (from a user gesture) and resume it. */
export function unlockAudio(): void {
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : MASTER_LEVEL;
    master.connect(ctx.destination);
  }
  void ctx.resume();
}

export function setMuted(m: boolean): void {
  muted = m;
  saveMuted(m);
  if (master) master.gain.value = m ? 0 : MASTER_LEVEL;
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) setMuted(!muted);
});

/** One shared 1 s white-noise buffer. */
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b;
  return b;
}

/** Disconnect nodes once the source has stopped, so finished sounds are released. */
function release(src: AudioScheduledSourceNode, nodes: AudioNode[]): void {
  src.onended = () => {
    for (const n of nodes) n.disconnect();
  };
}

/** Exponential decay from peak to silence over dur. */
function decay(g: GainNode, peak: number, t: number, dur: number): void {
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

/** Short fade in and out, flat in the middle. */
function shape(g: GainNode, peak: number, t: number, dur: number): void {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.005);
  g.gain.setValueAtTime(peak, t + dur - 0.015);
  g.gain.linearRampToValueAtTime(0, t + dur);
}

function noiseBurst(
  c: AudioContext, out: AudioNode, t: number, dur: number,
  filterType: BiquadFilterType, f0: number, f1: number, peak: number,
): void {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  decay(g, peak, t, dur);
  src.connect(filter).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur);
  release(src, [filter, g]);
}

function tone(
  c: AudioContext, out: AudioNode, type: OscillatorType, t: number, dur: number,
  f0: number, f1: number, peak: number,
): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  decay(g, peak, t, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur);
  release(o, [g]);
}

function playSfx(c: AudioContext, out: AudioNode, s: Sfx): void {
  const t = c.currentTime;
  switch (s) {
    case 'handbrake': {
      // Ratchet: five quick clicks climbing in pitch, then a dull clunk as the lever seats.
      for (let i = 0; i < 5; i++) {
        const at = t + i * 0.045;
        noiseBurst(c, out, at, 0.03, 'bandpass', 2400 + i * 450, 2400 + i * 450, 0.35);
        tone(c, out, 'square', at, 0.02, 900 + i * 120, 700 + i * 120, 0.08);
      }
      tone(c, out, 'sine', t + 0.24, 0.12, 130, 70, 0.4);
      return;
    }
    case 'handbrake-release': {
      noiseBurst(c, out, t, 0.04, 'bandpass', 1800, 1200, 0.3);
      tone(c, out, 'sine', t, 0.08, 110, 80, 0.25);
      return;
    }
    case 'squirt': {
      if (t - lastSquirt < 0.05) return;
      lastSquirt = t;
      noiseBurst(c, out, t, 0.06, 'bandpass', 2500, 2500, 0.25);
      return;
    }
    case 'crack':
      noiseBurst(c, out, t, 0.05, 'highpass', 2500, 2500, 0.35);
      noiseBurst(c, out, t + 0.03, 0.2, 'bandpass', 1200, 500, 0.3);
      tone(c, out, 'triangle', t, 0.12, 320, 110, 0.25);
      return;
    case 'steal': {
      for (const [start, freq] of [[0, 440], [0.09, 660]] as const) {
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.value = freq;
        const g = c.createGain();
        shape(g, 0.15, t + start, 0.09);
        o.connect(g).connect(out);
        o.start(t + start);
        o.stop(t + start + 0.09);
        release(o, [g]);
      }
      return;
    }
    case 'door':
      noiseBurst(c, out, t, 0.04, 'highpass', 1500, 1500, 0.3);
      tone(c, out, 'sine', t, 0.08, 180, 180, 0.35);
      return;
    case 'alarm': {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = 750;
      const lfo = c.createOscillator();
      lfo.frequency.value = 3;
      const depth = c.createGain();
      depth.gain.value = 150;
      lfo.connect(depth).connect(o.frequency);
      const filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      const g = c.createGain();
      shape(g, 0.12, t, 1.2);
      o.connect(filter).connect(g).connect(out);
      o.start(t);
      lfo.start(t);
      o.stop(t + 1.2);
      lfo.stop(t + 1.2);
      release(o, [filter, g, depth]);
      lfo.onended = () => lfo.disconnect();
      return;
    }
    case 'whistle': {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = 2200;
      const lfo = c.createOscillator();
      lfo.frequency.value = 25;
      const depth = c.createGain();
      depth.gain.value = 60;
      lfo.connect(depth).connect(o.frequency);
      const g = c.createGain();
      shape(g, 0.12, t, 0.5);
      o.connect(g).connect(out);
      o.start(t);
      lfo.start(t);
      o.stop(t + 0.5);
      lfo.stop(t + 0.5);
      release(o, [g, depth]);
      lfo.onended = () => lfo.disconnect();
      return;
    }
    case 'washed':
      tone(c, out, 'sine', t, 0.8, 600, 120, 0.25);
      noiseBurst(c, out, t, 0.12, 'lowpass', 3000, 400, 0.2);
      return;
    case 'boom':
      noiseBurst(c, out, t, 0.7, 'lowpass', 1800, 120, 0.7);
      tone(c, out, 'sine', t, 0.6, 110, 28, 0.6);
      return;
    case 'bump':
      tone(c, out, 'sine', t, 0.12, 90, 45, 0.4);
      return;
    case 'gunshot': {
      if (t - lastGunshot < 0.03) return;
      lastGunshot = t;
      noiseBurst(c, out, t, 0.03, 'highpass', 3000, 3000, 0.35);
      tone(c, out, 'sine', t, 0.1, 120, 50, 0.4);
      return;
    }
    case 'shotgun':
      noiseBurst(c, out, t, 0.25, 'lowpass', 1200, 400, 0.5);
      tone(c, out, 'sine', t, 0.25, 90, 35, 0.5);
      return;
    case 'reload':
      // Two metallic clicks, 0.35 s apart.
      noiseBurst(c, out, t, 0.03, 'bandpass', 5000, 5000, 0.25);
      noiseBurst(c, out, t + 0.35, 0.03, 'bandpass', 5000, 5000, 0.25);
      return;
    case 'chute': {
      // Whoosh: noise through a bandpass sweeping 400 -> 1500 -> 400 Hz, gain swelling then fading.
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 1.5;
      filter.frequency.setValueAtTime(400, t);
      filter.frequency.linearRampToValueAtTime(1500, t + 0.3);
      filter.frequency.linearRampToValueAtTime(400, t + 0.6);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.3, t + 0.3);
      g.gain.linearRampToValueAtTime(0, t + 0.6);
      src.connect(filter).connect(g).connect(out);
      src.start(t);
      src.stop(t + 0.6);
      release(src, [filter, g]);
      return;
    }
  }
}

/** Synthesized one-shot sound effect. Silent until unlockAudio() has run. */
export function play(s: Sfx): void {
  if (!ctx || !master) return;
  playSfx(ctx, master, s);
}

// ---- Tyre skid: a looping filtered-noise squeal whose volume and pitch follow how hard the tyres are sliding. ----
interface Skid { gain: GainNode; filter: BiquadFilterNode }
let skid: Skid | null = null;
let lastSkid = -1;

/** level 0..1 (0 = grip). Call every frame while driving; 0 fades it out. */
export function setSkid(level: number): void {
  if (!ctx || !master) return;
  if (!skid) {
    if (level <= 0) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 3;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(master);
    src.start();
    skid = { gain, filter };
  }
  if (Math.abs(level - lastSkid) < 0.02) return;
  lastSkid = level;
  const t = ctx.currentTime;
  skid.gain.gain.setTargetAtTime(level * 0.16, t, 0.05);
  skid.filter.frequency.setTargetAtTime(1100 + level * 900, t, 0.05);
}

function ensureEngine(c: AudioContext, out: AudioNode): Engine {
  if (engine) return engine;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 55;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  const gain = c.createGain();
  gain.gain.value = 0;
  // Rotor flutter: an 18 Hz LFO added onto the engine gain. Depth is 0 unless flying.
  const lfo = c.createOscillator();
  lfo.frequency.value = 18;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 0;
  lfo.connect(lfoDepth).connect(gain.gain);
  osc.connect(filter).connect(gain).connect(out);
  osc.start();
  lfo.start();
  engine = { osc, gain, lfo, lfoDepth };
  return engine;
}

/**
 * Engine hum: on while the player drives; speed01 = |speed| / maxSpeed; flying adds a rotor flutter.
 * plane = true swaps in a lower, buzzier propeller drone (70 to 140 Hz, 28 Hz tremolo) that rises with speed.
 * The same oscillator serves both, so switching never leaves an old one running.
 */
export function setEngine(on: boolean, speed01: number, flying: boolean, plane = false): void {
  if (!ctx || !master) return;
  if (!engine && !on) return;
  const e = ensureEngine(ctx, master);
  const t = ctx.currentTime;
  const s = Math.min(1, Math.max(0, speed01));

  if (plane !== lastPlane) {
    e.lfo.frequency.setTargetAtTime(plane ? 28 : 18, t, 0.08);
    lastPlane = plane;
  }

  const freq = plane ? 70 + 70 * s : 55 + 95 * s;
  if (Math.abs(freq - lastFreq) > 0.5) {
    e.osc.frequency.setTargetAtTime(freq, t, 0.08);
    lastFreq = freq;
  }

  const gainTarget = on ? (plane ? 0.05 + 0.05 * s : 0.07) : 0;
  if (Math.abs(gainTarget - lastGain) > 0.001) {
    e.gain.gain.setTargetAtTime(gainTarget, t, 0.08);
    lastGain = gainTarget;
  }

  // Flutter only while the engine is audibly running; otherwise a silent engine would still buzz.
  // A plane always tremolos while running; the mower only when flying.
  const depth = on && (plane || flying) ? 0.04 : 0;
  if (Math.abs(depth - lastDepth) > 0.001) {
    e.lfoDepth.gain.setTargetAtTime(depth, t, 0.08);
    lastDepth = depth;
  }
}
