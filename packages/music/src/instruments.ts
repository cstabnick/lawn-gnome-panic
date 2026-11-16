// Natural, acoustic-inspired synthesized instruments (no samples):
// French horn, plucked concert harp, felt piano, upright bass, and soft brush/rim percussion.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';
import type { Fx } from './mix';
import { midiToNote } from './theory';

const sendTo = (T: Tone, keep: Keep, amount: number, dest: ToneNS.InputNode) =>
  keep(new T.Gain(amount)).connect(dest);

export interface HornVoice {
  play(midi: number, durS: number, time: number, vel?: number): void;
}

/**
 * Warm French horn / flugelhorn: detuned sawtooth pair through a blooming low-pass filter
 * and subtle vibrato, sent generously into the hall reverb.
 */
export function createFrenchHorn(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  fx: Fx,
  opts: { volumeDb?: number; revSend?: number; brightness?: number; attack?: number } = {},
): HornVoice {
  const revGain = sendTo(T, keep, opts.revSend ?? 0.65, fx.rev);
  const delayGain = sendTo(T, keep, 0.14, fx.delay);
  const lp = keep(new T.Filter({ frequency: opts.brightness ?? 1650, type: 'lowpass', rolloff: -12 })).fan(dest, revGain, delayGain);
  const vib = keep(new T.Vibrato({ frequency: 4.3, depth: 0.06 })).connect(lp);
  const atk = opts.attack ?? 0.11;
  const horn = keep(new T.MonoSynth({
    oscillator: { type: 'fatsawtooth', count: 2, spread: 9 },
    filter: { Q: 1.4, type: 'lowpass', rolloff: -12 },
    envelope: { attack: atk, decay: 0.35, sustain: 0.72, release: 0.55 },
    filterEnvelope: {
      attack: atk * 1.15,
      decay: 0.45,
      sustain: 0.55,
      release: 0.45,
      baseFrequency: 320,
      octaves: 2.1,
    },
  })).connect(vib);
  horn.volume.value = opts.volumeDb ?? -14;

  return {
    play(midi, durS, time, vel = 0.8) {
      horn.triggerAttackRelease(midiToNote(midi), Math.max(0.08, durS), time, vel);
    },
  };
}

export interface HarpVoice {
  pluck(midi: number, time: number, vel?: number): void;
  /** Rolls a chord upward like a harpist's hand sweep. */
  arp(midis: readonly number[], time: number, spreadS?: number, vel?: number): void;
}

/**
 * Concert harp: a 6-voice round-robin Karplus-Strong PluckSynth pool with per-voice
 * velocity gain, warmed through a 3.6 kHz low-pass filter into lush reverb and echo.
 */
export function createHarp(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  fx: { rev: ToneNS.ToneAudioNode; delay: ToneNS.ToneAudioNode },
  opts: { volumeDb?: number; revSend?: number; echoSend?: number; dampening?: number } = {},
): HarpVoice {
  const revGain = sendTo(T, keep, opts.revSend ?? 0.7, fx.rev);
  const echoGain = sendTo(T, keep, opts.echoSend ?? 0.22, fx.delay);
  const master = keep(new T.Volume(opts.volumeDb ?? -10)).fan(dest, revGain, echoGain);
  const lp = keep(new T.Filter({ frequency: 3600, type: 'lowpass' })).connect(master);

  const voices = Array.from({ length: 6 }, () => {
    const g = keep(new T.Gain(0.8)).connect(lp);
    const p = keep(new T.PluckSynth({
      attackNoise: 0.55,
      dampening: opts.dampening ?? 2900,
      resonance: 0.965,
      release: 1.4,
    })).connect(g);
    return { p, g };
  });
  let idx = 0;

  const pluck = (midi: number, time: number, vel = 0.75): void => {
    const v = voices[idx++ % voices.length];
    v.g.gain.setValueAtTime(Math.max(0.05, Math.min(1.2, vel)), time);
    v.p.triggerAttack(midiToNote(midi), time);
  };

  return {
    pluck,
    arp(midis, time, spreadS = 0.045, vel = 0.7) {
      for (let i = 0; i < midis.length; i++) {
        pluck(midis[i], time + i * spreadS, vel * (0.85 + 0.15 * (i / Math.max(1, midis.length - 1))));
      }
    },
  };
}

export interface PianoVoice {
  play(midis: number | readonly number[], durS: number, time: number, vel?: number): void;
}

/**
 * Warm felt / grand piano: soft-hammer FM PolySynth through a woody 3 kHz low-pass
 * filter with natural sustain and generous hall reverb.
 */
export function createFeltPiano(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  fx: Fx,
  opts: { volumeDb?: number; revSend?: number; echoSend?: number; brightness?: number } = {},
): PianoVoice {
  const revGain = sendTo(T, keep, opts.revSend ?? 0.55, fx.rev);
  const echoGain = sendTo(T, keep, opts.echoSend ?? 0.15, fx.delay);
  const lp = keep(new T.Filter({ frequency: opts.brightness ?? 3000, type: 'lowpass' })).fan(dest, revGain, echoGain);
  const piano = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 1,
    modulationIndex: 1.75,
    oscillator: { type: 'sine' },
    modulation: { type: 'triangle' },
    envelope: { attack: 0.004, decay: 2.1, sustain: 0.14, release: 1.5 },
    modulationEnvelope: { attack: 0.001, decay: 0.11, sustain: 0.03, release: 0.2 },
  })).connect(lp);
  piano.volume.value = opts.volumeDb ?? -10;

  return {
    play(midis, durS, time, vel = 0.75) {
      const notes = typeof midis === 'number' ? midiToNote(midis) : midis.map(midiToNote);
      piano.triggerAttackRelease(notes, Math.max(0.06, durS), time, vel);
    },
  };
}

export interface UprightBassVoice {
  play(midi: number, durS: number, time: number, vel?: number): void;
}

/** Warm acoustic upright bass: woody triangle pluck layered with a gentle sine fundamental. */
export function createUprightBass(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  opts: { volumeDb?: number } = {},
): UprightBassVoice {
  const lp = keep(new T.Filter({ frequency: 460, type: 'lowpass' })).connect(dest);
  const body = keep(new T.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.014, decay: 0.5, sustain: 0.28, release: 0.28 },
    filterEnvelope: { attack: 0.005, decay: 0.18, sustain: 0.2, release: 0.2, baseFrequency: 180, octaves: 1.5 },
  })).connect(lp);
  body.volume.value = opts.volumeDb ?? -10;
  const sub = keep(new T.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.016, decay: 0.45, sustain: 0.35, release: 0.25 },
  })).connect(dest);
  sub.volume.value = (opts.volumeDb ?? -10) - 4;

  return {
    play(midi, durS, time, vel = 0.85) {
      const n = midiToNote(midi);
      const d = Math.max(0.08, durS);
      body.triggerAttackRelease(n, d, time, vel);
      sub.triggerAttackRelease(n, d, time, vel * 0.8);
    },
  };
}

export interface SoftKit {
  kick(time: number, vel?: number): void;
  brush(time: number, vel?: number): void;
  rim(time: number, vel?: number): void;
  shaker(time: number, vel?: number): void;
}

/** Gentle, organic percussion (soft felt kick, brush sweep, wooden rim, airy shaker) in a reverby room. */
export function createSoftKit(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  fx: Fx,
  opts: { volumeDb?: number; revSend?: number } = {},
): SoftKit {
  const bus = keep(new T.Volume(opts.volumeDb ?? -4)).connect(dest);
  const revSend = sendTo(T, keep, opts.revSend ?? 0.35, fx.rev);

  const kick = keep(new T.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 3.5,
    envelope: { attack: 0.005, decay: 0.28, sustain: 0, release: 0.08 },
  })).connect(bus);
  kick.volume.value = -4;

  const brushBp = keep(new T.Filter({ frequency: 2600, type: 'bandpass', Q: 0.9 })).fan(bus, revSend);
  const brush = keep(new T.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.012, decay: 0.14, sustain: 0, release: 0.06 },
  })).connect(brushBp);
  brush.volume.value = -14;

  const rimFilter = keep(new T.Filter({ frequency: 1400, type: 'bandpass', Q: 3.5 })).fan(bus, revSend);
  const rim = keep(new T.MembraneSynth({
    pitchDecay: 0.006,
    octaves: 1.5,
    envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.02 },
  })).connect(rimFilter);
  rim.volume.value = -10;

  const shakerHp = keep(new T.Filter({ frequency: 5800, type: 'highpass' })).fan(bus, sendTo(T, keep, 0.18, fx.rev));
  const shaker = keep(new T.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.004, decay: 0.045, sustain: 0, release: 0.02 },
  })).connect(shakerHp);
  shaker.volume.value = -22;

  return {
    kick: (time, vel = 0.75) => kick.triggerAttackRelease('G1', '8n', time, vel),
    brush: (time, vel = 0.6) => brush.triggerAttackRelease('16n', time, vel),
    rim: (time, vel = 0.65) => rim.triggerAttackRelease('C4', '32n', time, vel),
    shaker: (time, vel = 0.5) => shaker.triggerAttackRelease('32n', time, vel),
  };
}

export interface SpatialFx {
  rev: ToneNS.ToneAudioNode;
  delay: ToneNS.ToneAudioNode;
  chorusSend?: ToneNS.ToneAudioNode;
}

/**
 * Lounge vibraphone: soft mallet sine/FM bars with classic motor tremolo,
 * bathed in hall reverb and stereo echo.
 */
export function createVibraphone(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  fx: SpatialFx,
  opts: { volumeDb?: number; revSend?: number; echoSend?: number } = {},
): PianoVoice {
  const revGain = sendTo(T, keep, opts.revSend ?? 0.75, fx.rev);
  const echoGain = sendTo(T, keep, opts.echoSend ?? 0.32, fx.delay);
  const lp = keep(new T.Filter({ frequency: 3600, type: 'lowpass' })).fan(dest, revGain, echoGain);
  const trem = keep(new T.Tremolo({ frequency: 4.2, depth: 0.35 })).connect(lp);
  trem.start();

  const vibes = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 3.98,
    modulationIndex: 1.15,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: { attack: 0.008, decay: 1.9, sustain: 0.12, release: 1.8 },
    modulationEnvelope: { attack: 0.002, decay: 0.12, sustain: 0.02, release: 0.15 },
  })).connect(trem);
  vibes.maxPolyphony = 6;
  vibes.volume.value = opts.volumeDb ?? -13;

  return {
    play(midis, durS, time, vel = 0.65) {
      const notes = typeof midis === 'number' ? midiToNote(midis) : midis.map(midiToNote);
      vibes.triggerAttackRelease(notes, Math.max(0.1, durS), time, vel);
    },
  };
}

/**
 * Vintage lounge electric piano (Rhodes-style): warm tine shimmer with gentle tremolo,
 * routed into big reverb, echo, and optional stereo chorus.
 */
export function createRhodes(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  fx: SpatialFx,
  opts: { volumeDb?: number; revSend?: number; echoSend?: number; chorusSend?: number } = {},
): PianoVoice {
  const revGain = sendTo(T, keep, opts.revSend ?? 0.65, fx.rev);
  const echoGain = sendTo(T, keep, opts.echoSend ?? 0.28, fx.delay);
  const lp = keep(new T.Filter({ frequency: 3100, type: 'lowpass' })).fan(dest, revGain, echoGain);
  if (fx.chorusSend) lp.connect(sendTo(T, keep, opts.chorusSend ?? 0.38, fx.chorusSend));
  const trem = keep(new T.Tremolo({ frequency: 3.1, depth: 0.24 })).connect(lp);
  trem.start();

  const ep = keep(new T.PolySynth(T.FMSynth, {
    harmonicity: 2,
    modulationIndex: 1.45,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: { attack: 0.004, decay: 1.7, sustain: 0.24, release: 1.6 },
    modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.06, release: 0.45 },
  })).connect(trem);
  ep.maxPolyphony = 6;
  ep.volume.value = opts.volumeDb ?? -11;

  return {
    play(midis, durS, time, vel = 0.65) {
      const notes = typeof midis === 'number' ? midiToNote(midis) : midis.map(midiToNote);
      ep.triggerAttackRelease(notes, Math.max(0.08, durS), time, vel);
    },
  };
}

/**
 * Slow-blooming, wide ambient pad: detuned fat triangles through a warm low-pass filter,
 * heavily drenched in reverb and optional chorus.
 */
export function createAmbientPad(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  fx: SpatialFx,
  opts: { volumeDb?: number; revSend?: number; chorusSend?: number; brightness?: number } = {},
): PianoVoice {
  const revGain = sendTo(T, keep, opts.revSend ?? 0.85, fx.rev);
  const lp = keep(new T.Filter({ frequency: opts.brightness ?? 1300, type: 'lowpass' })).fan(dest, revGain);
  if (fx.chorusSend) lp.connect(sendTo(T, keep, opts.chorusSend ?? 0.45, fx.chorusSend));

  const pad = keep(new T.PolySynth(T.Synth, {
    oscillator: { type: 'fattriangle', count: 3, spread: 22 },
    envelope: { attack: 2.4, decay: 0.8, sustain: 0.85, release: 4.5 },
  })).connect(lp);
  pad.maxPolyphony = 10;
  pad.volume.value = opts.volumeDb ?? -21;

  return {
    play(midis, durS, time, vel = 0.5) {
      const notes = typeof midis === 'number' ? midiToNote(midis) : midis.map(midiToNote);
      pad.triggerAttackRelease(notes, Math.max(0.5, durS), time, vel);
    },
  };
}
