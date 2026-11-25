// The batch-3 cutscene ambience beds (script.ts ExtraBed): snow, shore, cave, market, meadow, storm, office, garden.
// cueAudio.ts startBed hands each builder a BedKit; the builder wires looping layers into kit.gain and may schedule
// spot sounds with kit.every. Procedural WebAudio only (no files). The sound bible (docs/design/gnome-theft-auto/
// sound-design.md) says which place uses which bed.
import type { ExtraBed } from './script';
import { noiseBurst, ping } from './cueSynth';

/** What a bed builder gets: its output gain and small helpers that register every node, so the bed halts cleanly. */
export interface BedKit {
  c: AudioContext;
  /** The bed's output (cueAudio fades it in and out). Connect the last node of each layer here. */
  gain: GainNode;
  /** A looping white-noise source, already started. */
  loop(): AudioBufferSourceNode;
  /** A biquad filter. */
  filt(type: BiquadFilterType, f: number, q?: number): BiquadFilterNode;
  /** A gain node at a fixed level. */
  level(v: number): GainNode;
  /** A sine LFO of `rate` Hz and `depth` added to `target` (a filter frequency or a gain). */
  lfo(rate: number, depth: number, target: AudioParam): void;
  /** Connect nodes in a chain: link(a, b, c) = a -> b -> c. */
  link(...ns: AudioNode[]): void;
  /**
   * Call `fn(t)` again and again at random gaps of minS..maxS seconds (the first after one gap) until the bed stops;
   * `t` is the AudioContext time to schedule at. Use for spot sounds: a drip, a gull, a cup clink, far thunder.
   */
  every(minS: number, maxS: number, fn: (t: number) => void): void;
}

export type BedBuilder = (k: BedKit) => void;

/** A random number in lo..hi. */
const between = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

/** One builder per ExtraBed. */
export const EXTRA_BED_BUILDERS: Record<ExtraBed, BedBuilder> = {
  // Hushed wind and a very soft hiss. Quiet on purpose: no spot sounds.
  snow: (k) => {
    const f = k.filt('lowpass', 500);
    k.link(k.loop(), f, k.level(0.05), k.gain);
    k.lfo(0.08, 120, f.frequency);
    k.link(k.loop(), k.filt('highpass', 6000, 0.7), k.level(0.008), k.gain);
  },
  // Surf with a slow swell, and gulls.
  shore: (k) => {
    const c = k.c;
    const lvl = k.level(0.07);
    k.link(k.loop(), k.filt('lowpass', 600), lvl, k.gain);
    k.lfo(0.11, 0.05, lvl.gain);
    k.every(6, 14, (t) => {
      ping(c, k.gain, 'sine', t, 0.35, 1900, 1300, 0.04);
      ping(c, k.gain, 'sine', t + 0.2, 0.35, 1900, 1300, 0.04);
    });
  },
  // Dark room tone with a drip now and then.
  cave: (k) => {
    const c = k.c;
    k.link(k.loop(), k.filt('lowpass', 220), k.level(0.05), k.gain);
    k.every(1.5, 4, (t) => {
      ping(c, k.gain, 'sine', t, 0.12, between(1400, 2000), 700, 0.06);
    });
  },
  // A crowd murmur, with cup clinks and a far bicycle bell.
  market: (k) => {
    const c = k.c;
    const f = k.filt('bandpass', 800, 0.7);
    k.link(k.loop(), f, k.level(0.05), k.gain);
    k.lfo(0.5, 150, f.frequency);
    k.every(3, 7, (t) => {
      ping(c, k.gain, 'sine', t, 0.08, 2600, 2600, 0.05);
      ping(c, k.gain, 'sine', t + 0.04, 0.08, 3400, 3400, 0.05);
    });
    k.every(12, 25, (t) => {
      ping(c, k.gain, 'sine', t, 0.1, 1800, 1800, 0.03);
      ping(c, k.gain, 'sine', t + 0.15, 0.1, 1800, 1800, 0.03);
    });
  },
  // Tall grass hiss, and insects. The insects are a narrow noise band pulsed by an LFO (a raw oscillator would
  // not be halted when the bed stops).
  meadow: (k) => {
    const lvl = k.level(0.035);
    k.link(k.loop(), k.filt('bandpass', 3000, 0.6), lvl, k.gain);
    k.lfo(0.2, 0.02, lvl.gain);
    const insects = k.level(0.004);
    k.link(k.loop(), k.filt('bandpass', 4200, 25), insects, k.gain);
    k.lfo(11, 0.004, insects.gain);
  },
  // Heavy rain, gusts, and far thunder.
  storm: (k) => {
    const c = k.c;
    k.link(k.loop(), k.filt('highpass', 1200, 0.5), k.level(0.09), k.gain);
    const gust = k.filt('bandpass', 400, 0.8);
    k.link(k.loop(), gust, k.level(0.07), k.gain);
    k.lfo(0.15, 200, gust.frequency);
    k.every(10, 22, (t) => {
      noiseBurst(c, k.gain, t, 2.0, 'lowpass', 160, 60, 0.12);
      ping(c, k.gain, 'sine', t, 1.2, 55, 40, 0.1);
    });
  },
  // Fluorescent hum, room tone, and keyboard bursts.
  office: (k) => {
    const c = k.c;
    k.link(k.loop(), k.filt('bandpass', 120, 8), k.level(0.06), k.gain);
    k.link(k.loop(), k.filt('lowpass', 300), k.level(0.03), k.gain);
    k.every(4, 9, (t) => {
      const clicks = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < clicks; i++) {
        noiseBurst(c, k.gain, t + i * 0.07, 0.03, 'highpass', 3000, 3000, 0.02);
      }
    });
  },
  // A fountain trickle, and birds.
  garden: (k) => {
    const c = k.c;
    const lvl = k.level(0.03);
    k.link(k.loop(), k.filt('bandpass', 1800, 0.5), lvl, k.gain);
    k.lfo(0.9, 0.015, lvl.gain);
    k.every(3, 8, (t) => {
      const f0 = between(2400, 3200);
      ping(c, k.gain, 'sine', t, 0.15, f0, f0 + 900, 0.035);
    });
  },
};
