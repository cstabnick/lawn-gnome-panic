// Small synth helpers for world-sound recipes. Every helper schedules its own nodes, stops its source by t + dur
// and disconnects them when it ends. `out` is the node to feed (the recipe's out).

let noiseBuf: AudioBuffer | null = null;
let noiseCtx: AudioContext | null = null;

/** One shared 1 s white-noise buffer (per AudioContext). */
export function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf && noiseCtx === c) return noiseBuf;
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b;
  noiseCtx = c;
  return b;
}

function release(src: AudioScheduledSourceNode, nodes: AudioNode[]): void {
  src.onended = () => {
    src.disconnect();
    for (const n of nodes) n.disconnect();
  };
}

/** Attack to `peak` in `attack` s, then exponential decay to silence at t + dur. */
export function env(g: GainNode, peak: number, t: number, dur: number, attack = 0.004): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + Math.min(attack, dur * 0.5));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

/** Filtered noise burst; the filter sweeps f0 -> f1 over dur. q is the filter Q (default 1). */
export function burst(
  c: AudioContext, out: AudioNode, t: number, dur: number,
  type: BiquadFilterType, f0: number, f1: number, peak: number, q = 1, attack = 0.004,
): void {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  src.loop = dur > 0.95;
  // Start at a random offset so repeated bursts are not identical.
  const offset = Math.random() * 0.5;
  const f = c.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = c.createGain();
  env(g, peak, t, dur, attack);
  src.connect(f).connect(g).connect(out);
  src.start(t, offset);
  src.stop(t + dur + 0.01);
  release(src, [f, g]);
}

/** Oscillator tone gliding f0 -> f1 (exponential) over dur. */
export function tone(
  c: AudioContext, out: AudioNode, type: OscillatorType, t: number, dur: number,
  f0: number, f1: number, peak: number, attack = 0.004,
): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const g = c.createGain();
  env(g, peak, t, dur, attack);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.01);
  release(o, [g]);
}

/** Tone with vibrato (rate Hz, depth as a fraction of f, e.g. 0.03) and a lowpass at `cutoff`. Good for horns, calls and sirens. */
export function voiced(
  c: AudioContext, out: AudioNode, type: OscillatorType, t: number, dur: number,
  f0: number, f1: number, peak: number, rate: number, depth: number, cutoff = 2400, attack = 0.02,
): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const lfo = c.createOscillator();
  lfo.frequency.value = rate;
  const lfoG = c.createGain();
  lfoG.gain.value = f0 * depth;
  lfo.connect(lfoG).connect(o.frequency);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = cutoff;
  const g = c.createGain();
  env(g, peak, t, dur, attack);
  o.connect(f).connect(g).connect(out);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.01);
  lfo.stop(t + dur + 0.01);
  release(o, [f, g]);
  release(lfo, [lfoG]);
}
