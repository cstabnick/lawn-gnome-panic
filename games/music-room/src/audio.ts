// Synthesized instruments (Web Audio API). No samples, no libraries.
import type { InstrumentId } from './config';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

/** Creates or resumes the AudioContext. Call from a user gesture (keydown / pointerdown). */
export function unlockAudio(): void {
  if (!ctx) {
    const c = new AudioContext();
    const out = c.createGain();
    out.gain.value = 0.8;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    out.connect(comp);
    comp.connect(c.destination);

    // One shared second of white noise for the snare, hats and crash.
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let k = 0; k < data.length; k++) data[k] = Math.random() * 2 - 1;

    ctx = c;
    master = out;
    noise = buf;
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/** Plays note n on instrument i at once. gain 0..1 scales the volume (remote players use a little less). */
export function playNote(i: InstrumentId, n: number, gain = 1): void {
  unlockAudio();
  if (!ctx || !master || !noise) return;
  const c = ctx;
  const out = master;
  const t = c.currentTime;
  switch (i) {
    case 'drums':
      drum(c, out, noise, n, gain, t);
      break;
    case 'keys':
      keyVoice(c, out, n, gain, t);
      break;
    case 'cowbell':
      cowbell(c, out, n, gain, t);
      break;
  }
}

/** Exponential decay from peak to silence. Never ramps to 0 (exponential ramps need a positive target). */
function decayGain(g: GainNode, t: number, peak: number, decay: number): void {
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + decay);
}

interface FilterSpec {
  type: BiquadFilterType;
  freq: number;
  q?: number;
}

/** A short burst of the shared noise buffer through a chain of filters, with a decaying envelope. */
function noiseVoice(
  c: AudioContext,
  buf: AudioBuffer,
  out: AudioNode,
  t: number,
  peak: number,
  dur: number,
  filters: FilterSpec[],
): void {
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  let node: AudioNode = src;
  for (const f of filters) {
    const bq = c.createBiquadFilter();
    bq.type = f.type;
    bq.frequency.value = f.freq;
    if (f.q !== undefined) bq.Q.value = f.q;
    node.connect(bq);
    node = bq;
  }
  const g = c.createGain();
  decayGain(g, t, peak, dur);
  node.connect(g);
  g.connect(out);
  src.start(t);
  src.stop(t + dur + 0.05);
}

function drum(c: AudioContext, out: AudioNode, buf: AudioBuffer, pad: number, gain: number, t: number): void {
  switch (pad) {
    case 0:
    case 7: {
      // Kick
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const g = c.createGain();
      decayGain(g, t, 1 * gain, 0.45);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.5);
      break;
    }
    case 1: {
      // Snare: noise body plus a short tone
      noiseVoice(c, buf, out, t, 0.7 * gain, 0.18, [{ type: 'highpass', freq: 1200 }]);
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(190, t);
      const g = c.createGain();
      decayGain(g, t, 0.5 * gain, 0.1);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.15);
      break;
    }
    case 2:
      // Closed hat
      noiseVoice(c, buf, out, t, 0.4 * gain, 0.05, [{ type: 'highpass', freq: 7000 }]);
      break;
    case 3:
      // Open hat
      noiseVoice(c, buf, out, t, 0.4 * gain, 0.35, [{ type: 'highpass', freq: 7000 }]);
      break;
    case 4:
    case 5: {
      // Toms: a sine that drops in pitch
      const f0 = pad === 4 ? 140 : 220;
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + 0.25);
      const g = c.createGain();
      decayGain(g, t, 0.9 * gain, 0.35);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.4);
      break;
    }
    case 6:
      // Crash
      noiseVoice(c, buf, out, t, 0.45 * gain, 1.4, [
        { type: 'highpass', freq: 4000 },
        { type: 'bandpass', freq: 6000, q: 0.7 },
      ]);
      break;
  }
}

/** Electric-piano-ish voice; n is a MIDI note number. */
function keyVoice(c: AudioContext, out: AudioNode, n: number, gain: number, t: number): void {
  const freq = 440 * 2 ** ((n - 69) / 12);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(900, t + 0.6);

  const env = c.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.5 * gain, t + 0.005);
  env.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  filter.connect(env);
  env.connect(out);

  const body = c.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(freq, t);
  body.connect(filter);

  const shimmerGain = c.createGain();
  shimmerGain.gain.value = 0.3;
  const shimmer = c.createOscillator();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2 * freq, t);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(filter);

  body.start(t);
  shimmer.start(t);
  body.stop(t + 1.3);
  shimmer.stop(t + 1.3);
}

/** Classic 808-style cowbell: two square oscillators through a bandpass. */
function cowbell(c: AudioContext, out: AudioNode, pad: number, gain: number, t: number): void {
  let mult: number;
  let dur: number;
  switch (pad) {
    case 0: // Cowbell
      mult = 1;
      dur = 0.6;
      break;
    case 1: // Low bell
      mult = 0.8;
      dur = 0.6;
      break;
    case 2: // High bell
      mult = 1.25;
      dur = 0.6;
      break;
    case 3: // Muted bell
      mult = 1;
      dur = 0.12;
      break;
    default:
      return;
  }
  const f1 = 540 * mult;
  const f2 = 800 * mult;

  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1.4 * f2;
  bp.Q.value = 1.2;

  const env = c.createGain();
  decayGain(env, t, 0.6 * gain, dur);
  bp.connect(env);
  env.connect(out);

  for (const f of [f1, f2]) {
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.value = f;
    const og = c.createGain();
    og.gain.value = 0.5;
    o.connect(og);
    og.connect(bp);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}
