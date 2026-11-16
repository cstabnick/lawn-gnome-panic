// Shared effect returns. Both inputs and outputs of spatial/modulation FX are high-passed (> ~220 Hz)
// so low end never enters reverb/delay/chorus tails or muddies the mix envelope.
import type * as ToneNS from 'tone';
import type { Keep, Tone } from './engine';

export interface Fx {
  /** Reverb input (fully wet). */
  rev: ToneNS.ToneAudioNode;
  /** Dotted-8th ping-pong echo that feeds the reverb (fully wet). */
  delay: ToneNS.ToneAudioNode;
  /** Snare reverb send; its gain is the amount. */
  snareSend: ToneNS.Gain;
  /** Dub "throw": a quarter-note echo. Open the gain on one hit to throw it. */
  throwSend: ToneNS.Gain;
}

export interface FxOpts {
  reverbDecay?: number;
  reverbHp?: number;
  snareSend?: number;
  echoTime?: ToneNS.Unit.Time;
  echoFeedback?: number;
  echoLp?: number;
}

const DEFAULT_FX_PRE_HP_HZ = 220;

export function createFx(T: Tone, keep: Keep, out: ToneNS.InputNode, opts: FxOpts = {}): Fx {
  const revHp = keep(new T.Filter(opts.reverbHp ?? 300, 'highpass')).connect(out);
  const revNode = keep(new T.Reverb({ decay: opts.reverbDecay ?? 3.5, preDelay: 0.025, wet: 1 })).connect(revHp);
  const rev = keep(new T.Filter(DEFAULT_FX_PRE_HP_HZ, 'highpass')).connect(revNode);

  const delayLp = keep(new T.Filter(opts.echoLp ?? 4200, 'lowpass')).connect(rev);
  const delayNode = keep(new T.PingPongDelay({ delayTime: opts.echoTime ?? '8n.', feedback: opts.echoFeedback ?? 0.42, wet: 1 })).connect(delayLp);
  const delay = keep(new T.Filter(DEFAULT_FX_PRE_HP_HZ, 'highpass')).connect(delayNode);

  const throwDelay = keep(new T.FeedbackDelay({ delayTime: '4n', feedback: 0.5, wet: 1 })).connect(rev);
  const throwInHp = keep(new T.Filter(DEFAULT_FX_PRE_HP_HZ, 'highpass')).connect(throwDelay);
  const throwSend = keep(new T.Gain(0)).connect(throwInHp);

  const snareSend = keep(new T.Gain(opts.snareSend ?? 0.15)).connect(rev);
  return { rev, delay, snareSend, throwSend };
}

export interface AmbientFx {
  /** Large hall/cathedral reverb input (fully wet). */
  rev: ToneNS.ToneAudioNode;
  /** Dotted-quarter ping-pong echo feeding the big reverb (fully wet). */
  delay: ToneNS.ToneAudioNode;
  /** Slow stereo chorus feeding the reverb (lush elevator/tape wash). */
  chorusSend: ToneNS.ToneAudioNode;
  /** Slowly sweeping bandpass auto-filter feeding the reverb (distant hallway drift). */
  sweepSend: ToneNS.ToneAudioNode;
}

export interface AmbientFxOpts {
  reverbDecay?: number;
  reverbHp?: number;
  reverbLp?: number;
  echoTime?: ToneNS.Unit.Time;
  echoFeedback?: number;
}

/**
 * Spatial effects rack for ambient & lounge tracks: huge damped reverb, long ping-pong
 * echo, dreamy stereo chorus, and a slow sweeping filter bus for background foleys.
 */
export function createAmbientFx(T: Tone, keep: Keep, out: ToneNS.InputNode, opts: AmbientFxOpts = {}): AmbientFx {
  const revHpFreq = opts.reverbHp ?? DEFAULT_FX_PRE_HP_HZ;
  const revHp = keep(new T.Filter(revHpFreq, 'highpass')).connect(out);
  const revLp = keep(new T.Filter(opts.reverbLp ?? 5500, 'lowpass')).connect(revHp);
  const revNode = keep(new T.Reverb({ decay: opts.reverbDecay ?? 11, preDelay: 0.045, wet: 1 })).connect(revLp);
  const rev = keep(new T.Filter(revHpFreq, 'highpass')).connect(revNode);

  const delayLp = keep(new T.Filter(3200, 'lowpass')).connect(rev);
  const delayNode = keep(new T.PingPongDelay({
    delayTime: opts.echoTime ?? '4n.',
    feedback: opts.echoFeedback ?? 0.5,
    wet: 1,
  })).connect(delayLp);
  const delay = keep(new T.Filter(DEFAULT_FX_PRE_HP_HZ, 'highpass')).connect(delayNode);

  const chorusNode = keep(new T.Chorus({ frequency: 0.65, delayTime: 4.5, depth: 0.55, wet: 1 })).connect(rev);
  chorusNode.start();
  const chorusSend = keep(new T.Filter(DEFAULT_FX_PRE_HP_HZ, 'highpass')).connect(chorusNode);

  const sweepPan = keep(new T.AutoPanner({ frequency: 0.09, depth: 0.55 })).connect(rev);
  sweepPan.start();

  const sweepSend = keep(new T.AutoFilter({
    frequency: 0.11,
    baseFrequency: 320,
    octaves: 2.8,
    filter: { type: 'bandpass', Q: 1.6, rolloff: -12 },
  })).connect(sweepPan);
  sweepSend.start();

  return { rev, delay, chorusSend, sweepSend };
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** Places a mono or stereo source at a fixed position in the stereo field (-1 left .. +1 right). */
export function createPanner(
  T: Tone,
  keep: Keep,
  pan: number,
  dest: ToneNS.InputNode,
): ToneNS.Panner {
  return keep(new T.Panner(clamp(pan, -1, 1))).connect(dest);
}

export interface AutoPanOpts {
  frequency?: ToneNS.Unit.Frequency;
  depth?: number;
}

/** Creates and starts a stereo auto-panner that sweeps a source smoothly across L/R. */
export function createAutoPanner(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  opts: AutoPanOpts = {},
): ToneNS.AutoPanner {
  const panner = keep(new T.AutoPanner({
    frequency: opts.frequency ?? 0.22,
    depth: clamp(opts.depth ?? 0.65, 0, 1),
  })).connect(dest);
  panner.start();
  return panner;
}

/** Widens a stereo signal using mid/side processing (0 = mono, 0.5 = normal, 1 = wide). */
export function createStereoWidener(
  T: Tone,
  keep: Keep,
  width: number,
  dest: ToneNS.InputNode,
): ToneNS.StereoWidener {
  return keep(new T.StereoWidener(clamp(width, 0, 1))).connect(dest);
}

export interface StereoBusOpts {
  width?: number;
  chorusFreq?: number;
  chorusDepth?: number;
  chorusWet?: number;
  highpass?: number;
}

/**
 * Reusable stereo width bus: pre-high-passed mid/side widener + stereo chorus.
 * Connect wide pads, supersaws, or ambient layers here to sit around center-panned bass/kick.
 */
export function createStereoBus(
  T: Tone,
  keep: Keep,
  dest: ToneNS.InputNode,
  opts: StereoBusOpts = {},
): ToneNS.ToneAudioNode {
  const widener = createStereoWidener(T, keep, opts.width ?? 0.58, dest);
  const chorus = keep(new T.Chorus({
    frequency: opts.chorusFreq ?? 1.1,
    delayTime: 3.6,
    depth: clamp(opts.chorusDepth ?? 0.45, 0, 1),
    spread: 180,
    wet: clamp(opts.chorusWet ?? 0.4, 0, 1),
  })).connect(widener);
  chorus.start();
  const hpFreq = opts.highpass ?? DEFAULT_FX_PRE_HP_HZ;
  return hpFreq > 0 ? keep(new T.Filter(hpFreq, 'highpass')).connect(chorus) : chorus;
}
