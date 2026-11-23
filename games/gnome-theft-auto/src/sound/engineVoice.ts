// One synthesized small-engine voice (Web Audio). Used for the player's own engine (audio.ts) and for other vehicles
// (enginePool.ts). Pitch, load and level are driven by engineModel.ts; this file only turns them into sound.
//
//   body  (a harmonic series at the firing frequency; the shape is the EngineWave recipe: 'putt' by default, each
//          vehicle picks its own: rasp, thump, lope, electric hum, outboard, drone)
//   sub   (a sine at the firing frequency: weight under the body)
//   whine (a sine at whineHz, optional: electric motor, gearbox, turbo; lowpassed, tremoloed with the rest)
//   puff  (band-passed noise whose level pulses at the firing frequency: the exhaust)
//     -> drive (more gain into a soft clipper as the load rises: a working engine growls)
//     -> two lowpasses (cutoff follows revs and load, capped by distance muffling)
//     -> chop (blade/rotor tremolo, planes and the Whirligig only)
//     -> out (level)
// A slow wobble on the pitch (deeper for rough engines) keeps it from sounding like a test tone.
// Every parameter moves with setTargetAtTime, so nothing ever jumps (no clicks, no zipper noise).

import type { EngineWave } from './engines';

export interface EngineParams {
  /** Firing frequency, Hz (engineModel.ts firingHz, times any doppler ratio). */
  hz: number;
  /** 0..1 how hard the engine works. */
  load: number;
  /** Output gain, linear (0 = silent). */
  level: number;
  /** EngineProfile.bright and .rough, 0..1. */
  bright: number;
  rough: number;
  /** EngineProfile.chop: blade chop rate per Hz of firing (0 = none). */
  chop?: number;
  /** Highest tone cutoff allowed, Hz (distance muffling from spatial.ts). Default 20000. */
  maxCutoff?: number;
  /** Harmonic recipe of the body (engines.ts EngineWave). Default 'putt'. */
  wave?: EngineWave;
  /** 0..1 level of a sine whine (electric motor, gearbox, turbo). Default 0. */
  whine?: number;
  /** Pitch of the whine, Hz. Default hz x 8. */
  whineHz?: number;
  /** Multiplier on the exhaust puff noise. Default 1. */
  noise?: number;
}

export interface EngineVoice {
  /** The voice's last node: connect it on (a panner, a bus). Built connected to `dest`. */
  readonly output: GainNode;
  /** Glide every parameter to `p` (time constant `tau` seconds, default 0.05). */
  set(p: EngineParams, now: number, tau?: number): void;
  /** Jump every parameter except the level to `p` at once (use only while the voice is silent). */
  snap(p: EngineParams, now: number): void;
  /** Stop the sources and unhook the voice. It cannot be used again. */
  stop(now: number): void;
}

const waves = new WeakMap<BaseAudioContext, Map<EngineWave, PeriodicWave>>();
let shaperCurve: Float32Array<ArrayBuffer> | null = null;
const noiseBufs = new WeakMap<BaseAudioContext, AudioBuffer>();

/** The harmonic coefficients of an engine wave: index 0 unused, harmonics 1..24. Pure (no audio context). */
export function waveCoefficients(wave: EngineWave): { real: Float32Array; imag: Float32Array } {
  const N = 24;
  const real = new Float32Array(N + 1);
  const imag = new Float32Array(N + 1);
  for (let n = 1; n <= N; n++) {
    const lump = 0.75 + 0.5 * Math.abs(Math.sin(n * 2.399)); // fixed, so every engine shares one wave shape
    let im = 0;
    let re = 0;
    switch (wave) {
      case 'putt': // the classic series: 1/n^1.1, even harmonics a little stronger
        im = (1 / Math.pow(n, 1.1)) * (n % 2 === 0 ? 1.3 : 1) * lump;
        re = im * 0.35 * Math.cos(n * 1.7);
        break;
      case 'buzz': // two-stroke rasp: buzzy odd harmonics
        im = (1 / Math.pow(n, 0.8)) * (n % 2 === 1 ? 1.3 : 1) * lump;
        re = im * 0.2 * Math.cos(n * 1.3);
        break;
      case 'chug': // diesel thump: a strong second and third
        im = (1 / Math.pow(n, 1.6)) * (n === 2 || n === 3 ? 1.6 : 1) * lump;
        re = im * 0.45 * Math.cos(n * 2.1);
        break;
      case 'rumble': // V-twin lope: strong even harmonics
        im = (1 / Math.pow(n, 1.3)) * (n % 2 === 0 ? 1.5 : 1) * lump;
        re = im * 0.4 * Math.cos(n * 1.1);
        break;
      case 'electric': // motor hum: almost a pure tone
        im = n === 1 ? 1 : n === 2 ? 0.15 : n === 3 ? 0.05 : 0;
        re = 0;
        break;
      case 'outboard': // rasp, less lumpy than the putt
        im = (1 / Math.pow(n, 0.9)) * (n % 2 === 1 ? 1.2 : 1) * (0.9 + 0.2 * Math.abs(Math.sin(n * 2.399)));
        re = im * 0.25 * Math.cos(n * 1.5);
        break;
      case 'drone': // smooth prop or rotor
        im = 1 / Math.pow(n, 1.2);
        re = 0;
        break;
    }
    imag[n] = im;
    real[n] = re;
  }
  return { real, imag };
}

/** The engine's harmonic series for one wave recipe, cached per context and wave. */
function engineWave(ctx: BaseAudioContext, wave: EngineWave = 'putt'): PeriodicWave {
  let byWave = waves.get(ctx);
  if (!byWave) {
    byWave = new Map();
    waves.set(ctx, byWave);
  }
  const cached = byWave.get(wave);
  if (cached) return cached;
  const { real, imag } = waveCoefficients(wave);
  const w = ctx.createPeriodicWave(real, imag);
  byWave.set(wave, w);
  return w;
}

function softClip(): Float32Array<ArrayBuffer> {
  if (shaperCurve) return shaperCurve;
  const n = 1024;
  const c = new Float32Array(new ArrayBuffer(n * 4));
  const k = Math.tanh(2);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.tanh(2 * x) / k;
  }
  shaperCurve = c;
  return c;
}

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const cached = noiseBufs.get(ctx);
  if (cached) return cached;
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBufs.set(ctx, b);
  return b;
}

/** The tone cutoff for a firing frequency, brightness and load, capped by `max`. */
export function engineCutoff(hz: number, bright: number, load: number, max = 20000): number {
  return Math.min(max, Math.max(250, 350 + hz * (8 + 14 * bright + 12 * load)));
}

type Key = 'hz' | 'subHz' | 'pulseHz' | 'level' | 'cut' | 'cut2' | 'drive' | 'puff' | 'puffBase' | 'bp' | 'jitter' | 'chopRate'
  | 'chopDepth' | 'chopBase' | 'whine' | 'whineHz' | 'whineCut';

export function createEngineVoice(ctx: AudioContext, dest: AudioNode): EngineVoice {
  const body = ctx.createOscillator();
  body.setPeriodicWave(engineWave(ctx, 'putt'));
  let curWave: EngineWave = 'putt';
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.55;
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  const subGain = ctx.createGain();
  subGain.gain.value = 0.32;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  noise.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 0.8;
  const puffAmp = ctx.createGain();
  puffAmp.gain.value = 0;
  // The puff's level pulses with the firing: a sine at the firing frequency added onto the puff gain.
  const pulse = ctx.createOscillator();
  pulse.type = 'sine';
  const pulseDepth = ctx.createGain();
  pulseDepth.gain.value = 0;

  const drive = ctx.createGain();
  drive.gain.value = 1;
  const shaper = ctx.createWaveShaper();
  shaper.curve = softClip();
  shaper.oversample = 'none';
  const lp1 = ctx.createBiquadFilter();
  lp1.type = 'lowpass';
  lp1.Q.value = 0.9;
  const lp2 = ctx.createBiquadFilter();
  lp2.type = 'lowpass';
  lp2.Q.value = 0.5;
  const chop = ctx.createGain();
  chop.gain.value = 1;
  const chopLfo = ctx.createOscillator();
  chopLfo.type = 'sine';
  const chopDepth = ctx.createGain();
  chopDepth.gain.value = 0;
  const output = ctx.createGain();
  output.gain.value = 0;

  // Sine whine: optional, silent unless p.whine > 0.
  const whineOsc = ctx.createOscillator();
  whineOsc.type = 'sine';
  const whineGain = ctx.createGain();
  whineGain.gain.value = 0;
  const whineLp = ctx.createBiquadFilter();
  whineLp.type = 'lowpass';
  whineLp.Q.value = 0.7;

  // Pitch wobble: cents onto every oscillator at the firing frequency.
  const jitter = ctx.createOscillator();
  jitter.type = 'sine';
  jitter.frequency.value = 0.9;
  const jitterDepth = ctx.createGain();
  jitterDepth.gain.value = 0;

  body.connect(bodyGain).connect(drive);
  sub.connect(subGain).connect(drive);
  noise.connect(bp).connect(puffAmp).connect(drive);
  whineOsc.connect(whineGain).connect(whineLp).connect(chop);
  pulse.connect(pulseDepth).connect(puffAmp.gain);
  drive.connect(shaper).connect(lp1).connect(lp2).connect(chop).connect(output).connect(dest);
  chopLfo.connect(chopDepth).connect(chop.gain);
  jitter.connect(jitterDepth);
  jitterDepth.connect(body.detune);
  jitterDepth.connect(sub.detune);
  jitterDepth.connect(pulse.detune);
  jitterDepth.connect(whineOsc.detune);

  const sources: AudioScheduledSourceNode[] = [body, sub, noise, pulse, chopLfo, jitter, whineOsc];
  for (const s of sources) s.start();

  const last: Partial<Record<Key, number>> = {};
  /** Glide a param, skipping changes under 0.5% so a steady engine schedules nothing. */
  const glide = (key: Key, param: AudioParam, v: number, now: number, tau: number): void => {
    const prev = last[key];
    if (prev !== undefined && Math.abs(v - prev) <= 0.005 * Math.abs(prev) + 1e-5) return;
    last[key] = v;
    param.setTargetAtTime(v, now, tau);
  };
  const jump = (key: Key, param: AudioParam, v: number, now: number): void => {
    last[key] = v;
    param.cancelScheduledValues(now);
    param.setValueAtTime(v, now);
  };

  const derive = (p: EngineParams) => {
    const hz = Math.max(5, p.hz);
    const load = Math.min(1, Math.max(0, p.load));
    const noiseMul = Math.max(0, p.noise ?? 1);
    const puff = (0.08 + 0.3 * p.rough + 0.25 * load) * noiseMul;
    const chopRate = (p.chop ?? 0) * hz;
    return {
      hz,
      cut: engineCutoff(hz, p.bright, load, p.maxCutoff),
      drive: 0.9 + 1.6 * load,
      puff,
      puffBase: puff * 0.35,
      bp: 600 + 1500 * p.bright + 800 * load,
      jitter: 4 + 26 * p.rough,
      chopRate: Math.max(0.1, chopRate),
      chopDepth: chopRate > 0 ? 0.35 : 0,
      whine: Math.min(1, Math.max(0, p.whine ?? 0)) * 0.18,
      whineHz: Math.min(12000, Math.max(20, p.whineHz ?? hz * 8)),
      whineCut: Math.min(p.maxCutoff ?? 20000, 9000),
    };
  };

  const apply = (p: EngineParams, now: number, move: (k: Key, a: AudioParam, v: number) => void): void => {
    const d = derive(p);
    move('hz', body.frequency, d.hz);
    move('subHz', sub.frequency, d.hz);
    move('pulseHz', pulse.frequency, d.hz);
    move('cut', lp1.frequency, d.cut);
    move('cut2', lp2.frequency, Math.min(20000, d.cut * 1.6));
    move('drive', drive.gain, d.drive);
    move('puff', pulseDepth.gain, d.puff);
    move('puffBase', puffAmp.gain, d.puffBase);
    move('bp', bp.frequency, d.bp);
    move('jitter', jitterDepth.gain, d.jitter);
    move('chopRate', chopLfo.frequency, d.chopRate);
    move('chopDepth', chopDepth.gain, d.chopDepth);
    // The chop swings the gain around 1 - depth so the average level stays put.
    move('chopBase', chop.gain, 1 - d.chopDepth);
    move('whine', whineGain.gain, d.whine);
    move('whineHz', whineOsc.frequency, d.whineHz);
    move('whineCut', whineLp.frequency, d.whineCut);
  };

  /** Swap the body's harmonic recipe when the wave changes (cheap: cached per context). */
  const syncWave = (p: EngineParams): void => {
    const w = p.wave ?? 'putt';
    if (w !== curWave) {
      curWave = w;
      body.setPeriodicWave(engineWave(ctx, w));
    }
  };

  let stopped = false;
  return {
    output,
    set(p, now, tau = 0.05) {
      if (stopped) return;
      syncWave(p);
      apply(p, now, (k, a, v) => glide(k, a, v, now, k === 'hz' || k === 'subHz' || k === 'pulseHz' || k === 'whineHz' ? 0.04 : tau));
      glide('level', output.gain, Math.max(0, p.level), now, tau);
    },
    snap(p, now) {
      if (stopped) return;
      syncWave(p);
      apply(p, now, (k, a, v) => jump(k, a, v, now));
    },
    stop(now) {
      if (stopped) return;
      stopped = true;
      output.gain.cancelScheduledValues(now);
      output.gain.setTargetAtTime(0, now, 0.02);
      for (const s of sources) {
        try { s.stop(now + 0.12); } catch { /* already stopped */ }
      }
      body.onended = () => output.disconnect();
    },
  };
}
