// A fixed pool of positional looping voices (other vehicles' engines, sirens, boat motors, propellers, swarms).
// Each voice is one generic synth built once and reused: a kind only changes its parameters, never its nodes.
import { busOut, getListener } from './bus';
import { noise } from './synth';
import { spatial, type Spatial } from './spatial';

export type LoopKind =
  | 'engine' | 'engine-heavy' | 'boat-motor' | 'propeller'
  | 'siren-police' | 'siren-hoa' | 'siren-ambulance' | 'bees';

export interface LoopSource {
  /** Stable id of the thing making the sound (e.g. `v${vehicle.id}` or `siren${vehicle.id}`). */
  key: string;
  kind: LoopKind;
  x: number;
  z: number;
  /** 0..1 intensity: engine speed01, siren 1, swarm size. */
  level: number;
  /** Audible range in metres (default 70; sirens 160, propeller 220). */
  maxDist?: number;
}

export interface LoopPool {
  /** Every frame: the wanted sources. The nearest audible ones get voices; the rest fade out. */
  update(sources: readonly LoopSource[]): void;
  /** How many voices are audible now. */
  active(): number;
}

interface KindSpec {
  wave: OscillatorType;
  /** Oscillator frequency in Hz for a level 0..1. */
  base: (level: number) => number;
  lfoType: OscillatorType;
  lfoRate: number;
  /** Hz swing added to the oscillator frequency by the LFO (0 = off). */
  lfoDepth: number;
  noiseHz: number;
  noiseGain: number;
  peak: number;
  maxDist: number;
  /** Multiplier on the amp target for this level. */
  ampScale: (level: number) => number;
}

const fixed = (hz: number) => () => hz;
const engineScale = (level: number) => 0.5 + 0.5 * level;
const noAmpScale = () => 1;

const KIND: Record<LoopKind, KindSpec> = {
  engine: {
    wave: 'sawtooth', base: (l) => 55 + 70 * l, lfoType: 'sine', lfoRate: 1, lfoDepth: 0,
    noiseHz: 400, noiseGain: 0.15, peak: 0.1, maxDist: 70, ampScale: engineScale,
  },
  'engine-heavy': {
    wave: 'sawtooth', base: (l) => 38 + 40 * l, lfoType: 'sine', lfoRate: 1, lfoDepth: 0,
    noiseHz: 250, noiseGain: 0.25, peak: 0.13, maxDist: 70, ampScale: engineScale,
  },
  'boat-motor': {
    wave: 'square', base: (l) => 45 + 50 * l, lfoType: 'sine', lfoRate: 6, lfoDepth: 4,
    noiseHz: 600, noiseGain: 0.4, peak: 0.1, maxDist: 70, ampScale: noAmpScale,
  },
  propeller: {
    wave: 'sawtooth', base: (l) => 70 + 70 * l, lfoType: 'sine', lfoRate: 28, lfoDepth: 6,
    noiseHz: 900, noiseGain: 0.3, peak: 0.14, maxDist: 220, ampScale: noAmpScale,
  },
  'siren-police': {
    wave: 'triangle', base: fixed(900), lfoType: 'sine', lfoRate: 0.45, lfoDepth: 350,
    noiseHz: 1000, noiseGain: 0, peak: 0.09, maxDist: 160, ampScale: noAmpScale,
  },
  'siren-hoa': {
    wave: 'square', base: fixed(780), lfoType: 'sine', lfoRate: 4, lfoDepth: 250,
    noiseHz: 1000, noiseGain: 0, peak: 0.07, maxDist: 160, ampScale: noAmpScale,
  },
  'siren-ambulance': {
    wave: 'sine', base: fixed(700), lfoType: 'square', lfoRate: 1.2, lfoDepth: 120,
    noiseHz: 1000, noiseGain: 0, peak: 0.08, maxDist: 160, ampScale: noAmpScale,
  },
  bees: {
    wave: 'sawtooth', base: fixed(210), lfoType: 'sine', lfoRate: 30, lfoDepth: 15,
    noiseHz: 1500, noiseGain: 0.2, peak: 0.05, maxDist: 25, ampScale: (l) => l,
  },
};

/** Last value scheduled per parameter, so a still scene schedules nothing. */
type Cache = Partial<Record<'freq' | 'noiseGain' | 'cutoff' | 'pan' | 'amp', number>>;

interface Voice {
  osc: OscillatorNode;
  noiseSrc: AudioBufferSourceNode;
  noiseFilter: BiquadFilterNode;
  noiseGain: GainNode;
  lp: BiquadFilterNode;
  amp: GainNode;
  panner: StereoPannerNode | null;
  lfo: OscillatorNode;
  lfoDepth: GainNode;
  key: string | null;
  kind: LoopKind | null;
  cache: Cache;
  /** Current amp target (0 when silent). */
  target: number;
  /** Seconds this voice has had no source. */
  idle: number;
  /** When it last lost its key (audio time); it takes no new key for RELEASE_BUSY seconds after. */
  releasedAt: number;
}

/** A voice silent this long stops its oscillators (silent nodes still cost audio-thread CPU on a phone). */
const SLEEP_AFTER = 1.5;
/** A voice that just lost its key is busy this long: it keeps fading and takes no new key (no pitch or pan chirp). */
const RELEASE_BUSY = 0.15;

const SMOOTH = 0.08;

/**
 * Give each voice index the key it should play: keys already on a voice stay there, free voices take the rest in
 * order, null for unused voices. A key is never assigned twice and keys no longer wanted are dropped. A voice with
 * `busy[i]` true (still fading out its last key) keeps no new key this frame.
 */
export function assignVoices(
  prev: readonly (string | null)[], wanted: readonly string[], busy?: readonly boolean[],
): (string | null)[] {
  const out: (string | null)[] = prev.map(() => null);
  const wantSet = new Set(wanted);
  const placed = new Set<string>();
  prev.forEach((k, i) => {
    if (k !== null && wantSet.has(k) && !placed.has(k)) {
      out[i] = k;
      placed.add(k);
    }
  });
  let w = 0;
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== null || busy?.[i]) continue;
    while (w < wanted.length && placed.has(wanted[w])) w++;
    if (w >= wanted.length) break;
    out[i] = wanted[w];
    placed.add(wanted[w]);
    w++;
  }
  return out;
}

function buildVoice(ctx: AudioContext, world: AudioNode): Voice {
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  oscGain.gain.value = 1;
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noise(ctx);
  noiseSrc.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.Q.value = 1;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 20000;
  const amp = ctx.createGain();
  amp.gain.value = 0;
  const panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0;

  osc.connect(oscGain).connect(lp);
  noiseSrc.connect(noiseFilter).connect(noiseGain).connect(lp);
  lp.connect(amp);
  if (panner) {
    amp.connect(panner).connect(world);
  } else {
    amp.connect(world);
  }
  lfo.connect(lfoDepth).connect(osc.frequency);
  osc.start();
  noiseSrc.start();
  lfo.start();

  return {
    osc, noiseSrc, noiseFilter, noiseGain, lp, amp, panner, lfo, lfoDepth,
    key: null, kind: null, cache: {}, target: 0, idle: 0, releasedAt: -Infinity,
  };
}

/** Ramp a parameter to `value`, skipping the call when it moved by less than 1% since the last one. */
function glide(p: AudioParam, name: keyof Cache, value: number, v: Voice, now: number): void {
  const last = v.cache[name];
  if (last !== undefined && Math.abs(value - last) < 0.01 * Math.abs(last) + 1e-6) return;
  v.cache[name] = value;
  p.setTargetAtTime(value, now, SMOOTH);
}

function configure(v: Voice, kind: LoopKind): void {
  const spec = KIND[kind];
  v.kind = kind;
  v.cache = {};
  v.osc.type = spec.wave;
  v.lfo.type = spec.lfoType;
  v.lfo.frequency.value = spec.lfoRate;
  v.lfoDepth.gain.value = spec.lfoDepth;
  v.noiseFilter.frequency.value = spec.noiseHz;
}

function applySource(v: Voice, src: LoopSource, s: Spatial, now: number): void {
  if (v.kind !== src.kind) configure(v, src.kind);
  const spec = KIND[src.kind];
  const level = Math.max(0, Math.min(1, src.level));
  const target = spec.peak * s.gain * spec.ampScale(level);
  glide(v.osc.frequency, 'freq', spec.base(level), v, now);
  glide(v.noiseGain.gain, 'noiseGain', spec.noiseGain, v, now);
  glide(v.lp.frequency, 'cutoff', s.cutoff, v, now);
  glide(v.amp.gain, 'amp', target, v, now);
  if (v.panner) glide(v.panner.pan, 'pan', s.pan, v, now);
  v.target = target;
}

/** Stop a voice's sources and unhook it; the pool builds a fresh one when it is needed again. */
function sleepVoice(v: Voice, now: number): void {
  for (const src of [v.osc, v.noiseSrc, v.lfo]) {
    try { src.stop(now); } catch { /* already stopped */ }
  }
  v.amp.disconnect();
}

export function createLoopPool(size: number): LoopPool {
  /** null = asleep (no nodes). */
  let voices: (Voice | null)[] = [];
  let built: AudioContext | null = null;
  let lastT = 0;

  return {
    update(sources) {
      const out = busOut();
      if (!out) return;
      if (built !== out.ctx) {
        voices = Array.from({ length: size }, () => null);
        built = out.ctx;
        lastT = out.ctx.currentTime;
      }
      const now = out.ctx.currentTime;
      const dt = Math.max(0, now - lastT);
      lastT = now;
      const l = getListener();

      const audible: { src: LoopSource; s: Spatial }[] = [];
      for (const src of sources) {
        const s = spatial(src.x, src.z, l.x, l.z, l.yaw, src.maxDist ?? KIND[src.kind].maxDist);
        if (s.gain >= 0.01) audible.push({ src, s });
      }
      audible.sort((a, b) => b.s.gain - a.s.gain);
      const top = audible.slice(0, size);
      const byKey = new Map(top.map((e) => [e.src.key, e]));

      const busy = voices.map((v) => v !== null && now - v.releasedAt < RELEASE_BUSY);
      const assigned = assignVoices(voices.map((v) => v?.key ?? null), top.map((e) => e.src.key), busy);
      voices.forEach((v, i) => {
        const key = assigned[i];
        const e = key === null ? undefined : byKey.get(key);
        if (!e) {
          if (!v) return;
          if (v.key !== null) v.releasedAt = now;
          v.key = null;
          glide(v.amp.gain, 'amp', 0, v, now);
          v.target = 0;
          v.idle += dt;
          if (v.idle > SLEEP_AFTER) {
            sleepVoice(v, now);
            voices[i] = null;
          }
          return;
        }
        const live = v ?? (voices[i] = buildVoice(out.ctx, out.world));
        live.key = key;
        live.idle = 0;
        applySource(live, e.src, e.s, now);
      });
    },
    active() {
      let n = 0;
      for (const v of voices) if (v && v.target > 0.001) n++;
      return n;
    },
  };
}
