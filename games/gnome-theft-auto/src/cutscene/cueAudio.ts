// Cutscene audio: procedural music loops with crossfades, ambience beds, stingers, one-shot SFX and per-vehicle engine
// hums, all WebAudio (no files), on the game's AudioContext (audio.ts getAudioOutput). Also ducks Turfton FM.
//
// Importing this module touches nothing: audio.ts and @lawn/music are loaded (dynamically) the first time a cue audio
// is created, and every call checks for the output context before it makes sound.
import type * as AudioMod from '../audio';
import type * as MusicMod from '@lawn/music';
import type { Sfx } from '../types';
import type { AmbienceBed, CueSfx, MusicTrack, Stinger } from './script';

export interface EngineVoice {
  /** speed01 0 = idle .. 1 = flat out; gain 0..1 (distance from the camera). */
  set(speed01: number, gain?: number): void;
  stop(): void;
}

export interface CueAudio {
  /** Start / crossfade to a track, or stop with null. fade seconds (default 1.5). */
  music(track: MusicTrack | null, fade?: number): void;
  ambience(bed: AmbienceBed | null, fade?: number): void;
  /** pan -1 left .. 1 right; gain 0..1 (default 1). */
  sfx(id: CueSfx, opts?: { pan?: number; gain?: number }): void;
  stinger(id: Stinger): void;
  /** Turfton FM level 0..1 (1 = untouched). */
  radio(level: number): void;
  /** A looping engine hum for one scene vehicle. */
  engine(): EngineVoice;
  /** Fade out music, ambience and engines; put the radio back to 1. */
  stopAll(fade?: number): void;
}

type CueExtraSfx = Exclude<CueSfx, Sfx>;
type Synth = (c: AudioContext, out: AudioNode, t: number) => void;

/** Game sounds: played by audio.ts play(), not synthesized here. */
const GAME_SFX: ReadonlySet<string> = new Set<string>([
  'squirt', 'crack', 'steal', 'door', 'alarm', 'whistle', 'washed', 'bump', 'gunshot', 'shotgun', 'reload', 'chute',
  'handbrake', 'handbrake-release', 'boom', 'boost', 'stunt', 'splash', 'shutter', 'smash', 'drink', 'hoa-shot',
  'gnome-hit', 'player-crack',
]);

const CUE_LEVEL = 0.9;
const PAD_PEAK = 0.1;

interface TrackSpec {
  /** MIDI notes per chord. */
  chords: number[][];
  /** MIDI bass note per chord. */
  roots: number[];
  /** Seconds per grid step. */
  stepS: number;
  /** Grid steps per chord. */
  steps: number;
  /** Per step of a chord: semitones above the chord's bass note, null = rest. */
  bass: (number | null)[];
  /** Per step: semitones above the chord's root plus an octave, null = silent. Absent = no arpeggio. */
  arp?: (number | null)[];
  /** Odd steps late by this fraction of stepS (a swung feel). */
  swing?: number;
  level: number;
  pad: OscillatorType;
  cut: number;
  bassWave: OscillatorType;
}

const TRACKS: Record<MusicTrack, TrackSpec> = {
  tension: {
    chords: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]],
    roots: [33, 29, 26, 28],
    stepS: 0.2, steps: 8,
    bass: Array(8).fill(0),
    level: 0.14, pad: 'sawtooth', cut: 1200, bassWave: 'sawtooth',
  },
  warm: {
    chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
    roots: [36, 33, 29, 31],
    stepS: 0.5, steps: 4,
    bass: [0, null, 0, null],
    level: 0.13, pad: 'triangle', cut: 1200, bassWave: 'triangle',
  },
  heist: {
    chords: [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]],
    roots: [38, 34, 31, 33],
    stepS: 0.25, steps: 8,
    bass: [0, 2, 3, 5, 7, 5, 3, 2],
    arp: [0, null, 3, null, 7, null, 3, null],
    swing: 0.3,
    level: 0.15, pad: 'triangle', cut: 1200, bassWave: 'triangle',
  },
  sad: {
    chords: [[53, 57, 60], [50, 53, 57], [53, 57, 60], [50, 53, 57]],
    roots: [41, 38, 41, 38],
    stepS: 0.65, steps: 4,
    bass: [0, null, null, null],
    level: 0.13, pad: 'triangle', cut: 900, bassWave: 'sine',
  },
  triumph: {
    chords: [[60, 64, 67], [53, 57, 60], [55, 59, 62], [60, 64, 67]],
    roots: [36, 29, 31, 36],
    stepS: 0.25, steps: 8,
    bass: [0, null, null, null, null, null, null, null],
    arp: [0, 4, 7, 12, 7, 4, 7, 12],
    level: 0.16, pad: 'sawtooth', cut: 1400, bassWave: 'triangle',
  },
  mystery: {
    chords: [[52, 55, 59], [48, 52, 55], [52, 55, 59], [47, 50, 54]],
    roots: [40, 36, 40, 35],
    stepS: 0.5, steps: 4,
    bass: [0, null, null, null],
    arp: [6, null, null, null],
    level: 0.12, pad: 'triangle', cut: 1000, bassWave: 'sine',
  },
  chase: {
    chords: [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]],
    roots: [40, 36, 43, 38],
    stepS: 0.0625, steps: 16,
    bass: Array(16).fill(0),
    level: 0.16, pad: 'sawtooth', cut: 1500, bassWave: 'sawtooth',
  },
};

const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
const noop = (): void => {};

// ---- WebAudio helpers ------------------------------------------------------------------------------------------------

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

/** Linear swell: up to peak over attack seconds, then down to silence at dur. */
function swell(g: GainNode, peak: number, t: number, attack: number, dur: number): void {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.linearRampToValueAtTime(0, t + dur);
}

/** One shared 2 s white-noise buffer per context (loops well for ambience). */
let noise: AudioBuffer | null = null;
let noiseFor: AudioContext | null = null;

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise && noiseFor === c) return noise;
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noise = b;
  noiseFor = c;
  return b;
}

function noiseSource(c: AudioContext, t: number, dur: number): AudioBufferSourceNode {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.start(t);
  src.stop(t + dur + 0.05);
  return src;
}

function biquad(c: AudioContext, type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode {
  const n = c.createBiquadFilter();
  n.type = type;
  n.frequency.value = f;
  n.Q.value = q;
  return n;
}

/** A short noise burst through one filter, decaying. */
function noiseBurst(
  c: AudioContext, out: AudioNode, t: number, dur: number,
  type: BiquadFilterType, f0: number, f1: number, peak: number,
): void {
  const src = noiseSource(c, t, dur);
  const f = biquad(c, type, f0, 0.7);
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  decay(g, peak, t, dur);
  src.connect(f).connect(g).connect(out);
  release(src, [src, f, g]);
}

/** A decaying oscillator, optionally gliding from f0 to f1. */
function ping(
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
  o.stop(t + dur + 0.05);
  release(o, [o, g]);
}

/** A decaying note by MIDI number. */
function note(c: AudioContext, out: AudioNode, type: OscillatorType, t: number, dur: number, midi: number, peak: number): void {
  const f = hz(midi);
  ping(c, out, type, t, dur, f, f, peak);
}

/** A sustained, slowly fading chord note: two detuned oscillators through one envelope. */
function pad(c: AudioContext, out: AudioNode, type: OscillatorType, midi: number, t: number, dur: number): void {
  const g = c.createGain();
  const end = t + dur;
  const attack = Math.min(0.25, dur * 0.3);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(PAD_PEAK, t + attack);
  g.gain.setValueAtTime(PAD_PEAK, end);
  g.gain.linearRampToValueAtTime(0, end + 0.3);
  g.connect(out);
  for (const detune of [-6, 6]) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = hz(midi);
    o.detune.value = detune;
    o.connect(g);
    o.start(t);
    o.stop(end + 0.35);
    release(o, [o, g]);
  }
}

// ---- Music -----------------------------------------------------------------------------------------------------------

/** One track's loop, played by a look-ahead scheduler. */
function scheduleStep(c: AudioContext, out: AudioNode, spec: TrackSpec, i: number, t: number): void {
  const s = i % spec.steps;
  const ci = Math.floor(i / spec.steps) % spec.chords.length;
  const chord = spec.chords[ci];
  const ts = i % 2 === 1 ? t + (spec.swing ?? 0) * spec.stepS : t;
  if (s === 0) for (const m of chord) pad(c, out, spec.pad, m, t, spec.steps * spec.stepS);
  const b = spec.bass[s] ?? null;
  if (b !== null) note(c, out, spec.bassWave, ts, spec.stepS * 0.9, spec.roots[ci] + b, 0.5);
  const a = spec.arp?.[s];
  if (a !== null && a !== undefined) note(c, out, 'triangle', ts, spec.stepS * 1.6, chord[0] + 12 + a, 0.3);
}

// ---- Ambience --------------------------------------------------------------------------------------------------------

/** A playing layer: its fade gain, and how to stop it for good. */
interface Layer {
  gain: GainNode;
  halt(): void;
}

function startMusic(c: AudioContext, dest: AudioNode, track: MusicTrack, fade: number): Layer {
  const spec = TRACKS[track];
  const t0 = c.currentTime;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(spec.level, t0 + fade);
  gain.connect(dest);
  const filter = biquad(c, 'lowpass', spec.cut, 0.5);
  filter.connect(gain);

  let step = 0;
  let nextT = t0 + 0.05;
  const tick = (): void => {
    const now = c.currentTime;
    if (nextT < now - 0.5) nextT = now + 0.05; // the tab was hidden: restart near now
    while (nextT < now + 0.3) {
      scheduleStep(c, filter, spec, step, nextT);
      step++;
      nextT += spec.stepS;
    }
  };
  tick();
  const timer = setInterval(tick, 100);
  return {
    gain,
    halt: () => {
      clearInterval(timer);
      gain.disconnect();
    },
  };
}

function startBed(c: AudioContext, dest: AudioNode, bed: AmbienceBed, fade: number): Layer {
  const t0 = c.currentTime;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(1, t0 + fade);
  gain.connect(dest);

  const nodes: AudioNode[] = [gain];
  const sources: AudioScheduledSourceNode[] = [];
  let chirpTimer: ReturnType<typeof setTimeout> | undefined;
  let dead = false;

  const add = <T extends AudioNode>(n: T): T => {
    nodes.push(n);
    return n;
  };
  const loop = (): AudioBufferSourceNode => {
    const s = c.createBufferSource();
    s.buffer = noiseBuffer(c);
    s.loop = true;
    s.start();
    sources.push(s);
    return add(s);
  };
  const filt = (type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode => add(biquad(c, type, f, q));
  const level = (v: number): GainNode => {
    const g = add(c.createGain());
    g.gain.value = v;
    return g;
  };
  const lfo = (rate: number, depth: number, target: AudioParam): void => {
    const o = c.createOscillator();
    o.frequency.value = rate;
    const d = add(c.createGain());
    d.gain.value = depth;
    o.connect(d);
    d.connect(target);
    o.start();
    sources.push(o);
    nodes.push(o);
  };
  const link = (...ns: AudioNode[]): void => {
    for (let i = 0; i < ns.length - 1; i++) ns[i].connect(ns[i + 1]);
  };

  switch (bed) {
    case 'room':
      link(loop(), filt('lowpass', 300), level(0.05), gain);
      break;
    case 'street': {
      const lvl = level(0.06);
      link(loop(), filt('bandpass', 600), lvl, gain);
      lfo(0.25, 0.03, lvl.gain);
      break;
    }
    case 'forest': {
      link(loop(), filt('highpass', 2500, 0.5), level(0.035), gain);
      const chirp = (): void => {
        if (dead) return;
        const t = c.currentTime + 0.02;
        const f0 = 2500 + Math.random() * 800;
        ping(c, gain, 'sine', t, 0.15, f0, f0 + 1000, 0.06);
        chirpTimer = setTimeout(chirp, 2000 + Math.random() * 4000);
      };
      chirpTimer = setTimeout(chirp, 1000 + Math.random() * 2000);
      break;
    }
    case 'wind': {
      const f = filt('bandpass', 400, 0.8);
      link(loop(), f, level(0.08), gain);
      lfo(0.12, 150, f.frequency);
      break;
    }
    case 'night': {
      // Crickets: a high square wave pulsed by a fast LFO on its gain.
      const o = c.createOscillator();
      o.type = 'square';
      o.frequency.value = 4500;
      const g = level(0.01);
      o.connect(g);
      o.start();
      sources.push(o);
      nodes.push(o);
      link(g, gain);
      lfo(14, 0.01, g.gain);
      break;
    }
    case 'crowd': {
      const f = filt('bandpass', 900, 0.6);
      link(loop(), f, level(0.07), gain);
      lfo(0.7, 200, f.frequency);
      break;
    }
    case 'water': {
      const f = filt('lowpass', 700);
      link(loop(), f, level(0.08), gain);
      lfo(0.2, 150, f.frequency);
      break;
    }
    case 'rain':
      link(loop(), filt('highpass', 1500, 0.5), level(0.05), gain);
      break;
  }

  return {
    gain,
    halt: () => {
      if (dead) return;
      dead = true;
      if (chirpTimer !== undefined) clearTimeout(chirpTimer);
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      }
      for (const n of nodes) n.disconnect();
    },
  };
}

/** Fade a layer out, then halt it once the fade is done. */
function retire(c: AudioContext, layer: Layer, fade: number): void {
  const now = c.currentTime;
  layer.gain.gain.cancelScheduledValues(now);
  layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
  layer.gain.gain.linearRampToValueAtTime(0, now + fade);
  setTimeout(layer.halt, fade * 1000 + 150);
}

// ---- Engines ---------------------------------------------------------------------------------------------------------

function startEngine(c: AudioContext, dest: AudioNode, registry: Set<(fade: number) => void>): EngineVoice {
  const saw = c.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = 45;
  const sub = c.createOscillator();
  sub.type = 'square';
  sub.frequency.value = 22.5;
  const lp = biquad(c, 'lowpass', 800);
  const g = c.createGain();
  g.gain.value = 0;
  saw.connect(lp);
  sub.connect(lp);
  lp.connect(g);
  g.connect(dest);
  saw.start();
  sub.start();

  let done = false;
  const halt = (fade: number): void => {
    if (done) return;
    done = true;
    registry.delete(halt);
    const now = c.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(0, now + fade);
    saw.stop(now + fade + 0.05);
    sub.stop(now + fade + 0.05);
    release(saw, [saw, sub, lp, g]);
  };
  registry.add(halt);

  return {
    set(speed01, gain = 1) {
      if (done) return;
      const s = clamp(speed01, 0, 1);
      const now = c.currentTime;
      const f = 45 + 110 * s;
      saw.frequency.setTargetAtTime(f, now, 0.05);
      sub.frequency.setTargetAtTime(f / 2, now, 0.05);
      g.gain.setTargetAtTime(0.05 * clamp(gain, 0, 1) * (0.4 + 0.6 * s), now, 0.05);
    },
    stop() {
      halt(0.3);
    },
  };
}

// ---- One-shot SFX and stingers ---------------------------------------------------------------------------------------

const SYNTH: Record<CueExtraSfx, Synth> = {
  footsteps: (c, o, t) => {
    for (let i = 0; i < 4; i++) noiseBurst(c, o, t + i * 0.25, 0.07, 'lowpass', 900, 500, 0.3);
  },
  'door-creak': (c, o, t) => {
    const s = c.createOscillator();
    s.type = 'sawtooth';
    s.frequency.setValueAtTime(90, t);
    s.frequency.linearRampToValueAtTime(240, t + 1.4);
    const f = biquad(c, 'bandpass', 400, 3);
    const g = c.createGain();
    swell(g, 0.25, t, 0.2, 1.4);
    s.connect(f).connect(g).connect(o);
    s.start(t);
    s.stop(t + 1.45);
    release(s, [s, f, g]);
  },
  whoosh: (c, o, t) => {
    const src = noiseSource(c, t, 0.6);
    const f = biquad(c, 'bandpass', 300, 1);
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(2500, t + 0.5);
    const g = c.createGain();
    swell(g, 0.3, t, 0.15, 0.6);
    src.connect(f).connect(g).connect(o);
    release(src, [src, f, g]);
  },
  punch: (c, o, t) => {
    ping(c, o, 'sine', t, 0.15, 120, 40, 0.6);
    noiseBurst(c, o, t, 0.03, 'highpass', 2000, 2000, 0.4);
  },
  thud: (c, o, t) => ping(c, o, 'sine', t, 0.35, 60, 60, 0.6),
  skid: (c, o, t) => noiseBurst(c, o, t, 0.6, 'bandpass', 1800, 1800, 0.3),
  'engine-rev': (c, o, t) => {
    const s = c.createOscillator();
    s.type = 'sawtooth';
    s.frequency.setValueAtTime(60, t);
    s.frequency.linearRampToValueAtTime(180, t + 0.45);
    s.frequency.linearRampToValueAtTime(60, t + 0.9);
    const f = biquad(c, 'lowpass', 800);
    const g = c.createGain();
    swell(g, 0.12, t, 0.1, 0.9);
    s.connect(f).connect(g).connect(o);
    s.start(t);
    s.stop(t + 0.95);
    release(s, [s, f, g]);
  },
  glass: (c, o, t) => {
    ping(c, o, 'sine', t, 0.3, 2400, 2400, 0.1);
    ping(c, o, 'sine', t + 0.05, 0.3, 3100, 3100, 0.08);
    ping(c, o, 'sine', t + 0.11, 0.3, 3900, 3900, 0.07);
    noiseBurst(c, o, t, 0.15, 'highpass', 3000, 3000, 0.12);
  },
  cash: (c, o, t) => {
    ping(c, o, 'square', t, 0.1, 1320, 1320, 0.08);
    ping(c, o, 'square', t + 0.08, 0.1, 1760, 1760, 0.08);
    ping(c, o, 'sine', t + 0.2, 0.6, 2640, 2640, 0.15);
  },
  phone: (c, o, t) => {
    for (let i = 0; i < 4; i++) {
      const f = i % 2 === 1 ? 1400 : 900;
      ping(c, o, 'sine', t + i * 0.2, 0.18, f, f, 0.2);
    }
  },
  knock: (c, o, t) => {
    for (let i = 0; i < 3; i++) noiseBurst(c, o, t + i * 0.18, 0.08, 'lowpass', 400, 300, 0.5);
  },
};

const STINGERS: Record<Stinger, Synth> = {
  reveal: (c, o, t) => [60, 64, 67, 72].forEach((m, i) => note(c, o, 'triangle', t + i * 0.09, 0.6, m, 0.2)),
  danger: (c, o, t) => {
    for (const m of [33, 34, 37]) note(c, o, 'sawtooth', t, 1.2, m, 0.08);
    ping(c, o, 'sine', t, 0.4, 150, 60, 0.5);
  },
  comic: (c, o, t) => {
    // Slide whistle: up, then down.
    const s = c.createOscillator();
    s.type = 'sine';
    s.frequency.setValueAtTime(400, t);
    s.frequency.exponentialRampToValueAtTime(1200, t + 0.5);
    s.frequency.exponentialRampToValueAtTime(600, t + 1.2);
    const g = c.createGain();
    swell(g, 0.14, t, 0.05, 1.2);
    s.connect(g).connect(o);
    s.start(t);
    s.stop(t + 1.25);
    release(s, [s, g]);
  },
  sad: (c, o, t) => [67, 63, 60].forEach((m, i) => note(c, o, 'triangle', t + i * 0.45, 0.5, m, 0.18)),
  triumph: (c, o, t) => [60, 64, 67, 72].forEach((m) => note(c, o, 'square', t, 1.4, m, 0.05)),
  mystery: (c, o, t) => {
    // Tritone bells: 440 Hz and 622 Hz (an augmented fourth apart).
    ping(c, o, 'sine', t, 1.6, 440, 440, 0.14);
    ping(c, o, 'sine', t, 1.6, 622.25, 622.25, 0.12);
  },
};

// ---- Factory ---------------------------------------------------------------------------------------------------------

export function createCueAudio(): CueAudio {
  // Loaded on the first call, not at import: audio.ts touches window when it loads.
  let audio: typeof AudioMod | null = null;
  let musicMod: typeof MusicMod | null = null;
  void import('../audio').then((m) => {
    audio = m;
  });
  void import('@lawn/music').then((m) => {
    musicMod = m;
  });

  let cue: { ctx: AudioContext; gain: GainNode } | null = null;

  let wantMusic: MusicTrack | null = null;
  let musicFade = 1.5;
  let appliedMusic: MusicTrack | null = null;
  let musicLayer: Layer | null = null;

  let wantAmb: AmbienceBed | null = null;
  let ambFade = 2;
  let appliedAmb: AmbienceBed | null = null;
  let ambLayer: Layer | null = null;

  const engines = new Set<(fade: number) => void>();

  /**
   * The output context if the player has interacted yet, else null. Also starts whatever music or ambience was asked
   * for while there was no context.
   */
  function ready(): { ctx: AudioContext; dest: GainNode } | null {
    const out = audio?.getAudioOutput() ?? null;
    if (!out) return null;
    if (!cue || cue.ctx !== out.ctx) {
      const gain = out.ctx.createGain();
      gain.gain.value = CUE_LEVEL;
      gain.connect(out.master);
      cue = { ctx: out.ctx, gain };
    }
    const c = out.ctx;
    const dest = cue.gain;

    if (appliedMusic !== wantMusic) {
      if (musicLayer) retire(c, musicLayer, musicFade);
      musicLayer = wantMusic ? startMusic(c, dest, wantMusic, musicFade) : null;
      appliedMusic = wantMusic;
    }
    if (appliedAmb !== wantAmb) {
      if (ambLayer) retire(c, ambLayer, ambFade);
      ambLayer = wantAmb ? startBed(c, dest, wantAmb, ambFade) : null;
      appliedAmb = wantAmb;
    }
    return { ctx: c, dest };
  }

  return {
    music(track, fade = 1.5) {
      wantMusic = track;
      musicFade = fade;
      ready();
    },

    ambience(bed, fade = 2) {
      wantAmb = bed;
      ambFade = fade;
      ready();
    },

    sfx(id, opts = {}) {
      const r = ready();
      if (!r) return;
      if (GAME_SFX.has(id)) {
        audio?.play(id as Sfx);
        return;
      }
      const synth = SYNTH[id as CueExtraSfx];
      if (!synth) return;
      const p = r.ctx.createStereoPanner();
      p.pan.value = clamp(opts.pan ?? 0, -1, 1);
      const g = r.ctx.createGain();
      g.gain.value = clamp(opts.gain ?? 1, 0, 2);
      p.connect(g).connect(r.dest);
      synth(r.ctx, p, r.ctx.currentTime + 0.01);
      // The longest extra sound is about 1.4 s.
      setTimeout(() => {
        p.disconnect();
        g.disconnect();
      }, 2500);
    },

    stinger(id) {
      const r = ready();
      if (!r) return;
      STINGERS[id](r.ctx, r.dest, r.ctx.currentTime + 0.01);
    },

    radio(level) {
      musicMod?.setMusicVolume(clamp(level, 0, 1));
    },

    engine() {
      const r = ready();
      if (!r) return { set: noop, stop: noop };
      return startEngine(r.ctx, r.dest, engines);
    },

    stopAll(fade = 0.8) {
      wantMusic = null;
      musicFade = fade;
      wantAmb = null;
      ambFade = fade;
      ready();
      for (const halt of [...engines]) halt(fade);
      engines.clear();
      musicMod?.setMusicVolume(1);
    },
  };
}
