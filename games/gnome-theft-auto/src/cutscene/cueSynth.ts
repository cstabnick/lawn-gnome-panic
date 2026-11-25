// Small WebAudio building blocks shared by the cutscene sound modules (cueAudio.ts music and stingers, cueFoley.ts
// one-shots, cueBeds.ts ambience beds). Every helper schedules on the given context and releases its nodes when done.

export const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

// ---- WebAudio helpers ------------------------------------------------------------------------------------------------

/** Disconnect nodes once the source has stopped, so finished sounds are released. */
export function release(src: AudioScheduledSourceNode, nodes: AudioNode[]): void {
  src.onended = () => {
    for (const n of nodes) n.disconnect();
  };
}

/** Exponential decay from peak to silence over dur. */
export function decay(g: GainNode, peak: number, t: number, dur: number): void {
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

/** Linear swell: up to peak over attack seconds, then down to silence at dur. */
export function swell(g: GainNode, peak: number, t: number, attack: number, dur: number): void {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.linearRampToValueAtTime(0, t + dur);
}

/** One shared 2 s white-noise buffer per context (loops well for ambience). */
let noise: AudioBuffer | null = null;
let noiseFor: AudioContext | null = null;

export function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise && noiseFor === c) return noise;
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noise = b;
  noiseFor = c;
  return b;
}

export function noiseSource(c: AudioContext, t: number, dur: number): AudioBufferSourceNode {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  src.start(t);
  src.stop(t + dur + 0.05);
  return src;
}

export function biquad(c: AudioContext, type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode {
  const n = c.createBiquadFilter();
  n.type = type;
  n.frequency.value = f;
  n.Q.value = q;
  return n;
}

/** A short noise burst through one filter, decaying. */
export function noiseBurst(
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
export function ping(
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
export function note(c: AudioContext, out: AudioNode, type: OscillatorType, t: number, dur: number, midi: number, peak: number): void {
  const f = hz(midi);
  ping(c, out, type, t, dur, f, f, peak);
}
