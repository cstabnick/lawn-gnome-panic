// Shot sounds for the Ammu-Gnation mods (suppressed, heavy, kazoo, squeaky duck), synthesized with Web Audio on the game's
// audio output (audio.ts getAudioOutput). Self-contained: audio.ts is not edited, its helpers are copied here.
import { play, getAudioOutput } from './audio';
import type { GunSoundId } from './gunMods';
import type { GunKind } from './types';

/** Sounds synthesized here. Anything else (stock, or an unknown id) plays the stock gunshot. */
const MODDED_SOUNDS: ReadonlySet<GunSoundId> = new Set<GunSoundId>(['suppressed', 'heavy', 'kazoo', 'squeak']);

let noiseBuf: AudioBuffer | null = null;
let lastModded = -1;

/** One shared 1 s white-noise buffer. */
function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
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

function noiseBurst(
  c: AudioContext, out: AudioNode, t: number, dur: number,
  filterType: BiquadFilterType, f0: number, f1: number, peak: number, q = 1,
): void {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c);
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.Q.value = q;
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

/** Kazoo: a sawtooth buzz with vibrato, sliding down, through a bandpass. */
function kazoo(c: AudioContext, out: AudioNode, t: number, dur: number, base: number): void {
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(260, t + dur);
  // Vibrato: a 22 Hz LFO, 25 Hz deep, added onto the pitch.
  const lfo = c.createOscillator();
  lfo.frequency.value = 22;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 25;
  lfo.connect(lfoDepth).connect(o.frequency);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1200;
  bp.Q.value = 3;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.22, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(bp).connect(g).connect(out);
  o.start(t);
  o.stop(t + dur);
  lfo.start(t);
  lfo.stop(t + dur);
  release(o, [bp, g]);
  release(lfo, [lfoDepth]);
}

/** Rubber duck squeak: a square wave gliding 900 -> 1500 -> 800 Hz, through a lowpass. */
function squeak(c: AudioContext, out: AudioNode, t: number, dur: number, peak: number): void {
  const o = c.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(900, t);
  o.frequency.linearRampToValueAtTime(1500, t + dur / 2);
  o.frequency.linearRampToValueAtTime(800, t + dur);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3000;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  o.stop(t + dur);
  release(o, [lp, g]);
}

/** Play one shot of `gun` with the sound its mods give. Silent until the audio is unlocked. */
export function playGunShot(gun: GunKind, sound: GunSoundId): void {
  if (!MODDED_SOUNDS.has(sound)) {
    play(gun === 'shotgun' ? 'shotgun' : 'gunshot');
    return;
  }
  const out = getAudioOutput();
  if (!out) return;
  const c = out.ctx;
  const t = c.currentTime;
  if (t - lastModded < 0.03) return;
  lastModded = t;

  // A shotgun makes each sound about 1.5x longer and a bit lower.
  const k = gun === 'shotgun' ? 1.5 : 1;
  const fm = gun === 'shotgun' ? 0.85 : 1;
  const master = out.master;

  switch (sound) {
    case 'suppressed':
      // Soft "pfft" plus a tiny click.
      noiseBurst(c, master, t, 0.07 * k, 'bandpass', 1400 * fm, 1400 * fm, 0.16, 0.8);
      noiseBurst(c, master, t, 0.012 * k, 'highpass', 5000 * fm, 5000 * fm, 0.06);
      return;
    case 'heavy':
      // Boom: a sweeping rumble, a sine thump and a short crack.
      noiseBurst(c, master, t, 0.4 * k, 'lowpass', 1500 * fm, 180 * fm, 0.55);
      tone(c, master, 'sine', t, 0.35 * k, 85 * fm, 28 * fm, 0.6);
      noiseBurst(c, master, t, 0.03 * k, 'highpass', 3500 * fm, 3500 * fm, 0.3);
      return;
    case 'kazoo':
      // A random base pitch so a burst of shots sounds like a tune.
      kazoo(c, master, t, 0.2 * k, (300 + Math.random() * 60) * fm);
      return;
    case 'squeak':
      // Two squeaks, the second softer and 0.06 s later.
      squeak(c, master, t, 0.13 * k, 0.14);
      squeak(c, master, t + 0.06 * k, 0.13 * k, 0.14 * 0.7);
      return;
  }
}
