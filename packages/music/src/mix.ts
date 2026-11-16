// Shared effect returns. Reverb is high-passed so tails never muddy the bass.
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

export function createFx(T: Tone, keep: Keep, out: ToneNS.InputNode, opts: { reverbDecay?: number; snareSend?: number } = {}): Fx {
  const revHp = keep(new T.Filter(300, 'highpass')).connect(out);
  const rev = keep(new T.Reverb({ decay: opts.reverbDecay ?? 3.5, preDelay: 0.02, wet: 1 })).connect(revHp);
  const delay = keep(new T.PingPongDelay({ delayTime: '8n.', feedback: 0.42, wet: 1 })).connect(rev);
  const throwDelay = keep(new T.FeedbackDelay({ delayTime: '4n', feedback: 0.5, wet: 1 })).connect(rev);
  const throwSend = keep(new T.Gain(0)).connect(throwDelay);
  const snareSend = keep(new T.Gain(opts.snareSend ?? 0.15)).connect(rev);
  return { rev, delay, snareSend, throwSend };
}
