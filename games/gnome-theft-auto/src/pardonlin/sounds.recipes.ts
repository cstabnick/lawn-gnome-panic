// Pardonlin's synthesized sounds (E30): no audio files. Each id is a procedural recipe on the world sound bus
// (sound/bus.ts registerSound), played positionally by sound.ts. Peaks never go above PEAK_MAX.
import { hasSound, registerSound } from '../sound/bus';
import { burst, tone, voiced } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';

export const PL_SOUND_IDS = [
  'pl-bell',
  'pl-accordion',
  'pl-cup-clink',
  'pl-coo',
  'pl-boules-clack',
  'pl-shop-bell',
  'pl-murmur',
] as const;

export type PlSoundId = (typeof PL_SOUND_IDS)[number];

const PEAK_MAX = 0.25;

/** Per-play pitch variation of about +-6%. */
function pitch(info: SoundInfo): number {
  return 1 + (info.rand - 0.5) * 0.12;
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

const RECIPES: Record<PlSoundId, Recipe> = {
  'pl-bell': (c, out, t, info) => {
    // A deep church bell: inharmonic partials with long decays, and a small strike click.
    const p = pitch(info);
    const base = 196 * p;
    const partials: [number, number, number][] = [
      [0.5, 0.1, 3.6],
      [1, 0.2, 3.8],
      [1.19, 0.07, 2.6],
      [1.5, 0.09, 3.0],
      [2, 0.1, 2.6],
      [2.76, 0.06, 1.8],
      [5.4, 0.03, 1.0],
    ];
    for (const [ratio, peak, dur] of partials) tone(c, out, 'sine', t, dur, base * ratio, base * ratio, lvl(info, peak));
    burst(c, out, t, 0.02, 'highpass', 3000, 3000, lvl(info, 0.05), 1, 0.002);
    return 3.8;
  },

  'pl-accordion': (c, out, t, info) => {
    // A wheezy reed phrase in a minor waltz figure: detuned saw and square notes, with a slow bellows swell.
    const p = pitch(info);
    const notes: [number, number, number][] = [
      [220, 0, 0.45], // A3
      [261.6, 0.4, 0.4], // C4
      [329.6, 0.8, 0.4], // E4
      [440, 1.2, 0.5], // A4
      [392, 1.8, 0.8], // G4
    ];
    for (const [f, at, dur] of notes) {
      const freq = f * p;
      voiced(c, out, 'sawtooth', t + at, dur, freq, freq, lvl(info, 0.06), 5.5, 0.01, 1800, 0.04);
      voiced(c, out, 'square', t + at, dur, freq * 1.005, freq * 1.005, lvl(info, 0.035), 5.5, 0.01, 1400, 0.04);
    }
    // Bellows breath under the phrase.
    burst(c, out, t, 2.6, 'bandpass', 500 * p, 700 * p, lvl(info, 0.03), 0.7, 0.6);
    return 2.6;
  },

  'pl-cup-clink': (c, out, t, info) => {
    // A porcelain tink: a bright sine with a short ring and a sharp tick.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.25, 2800 * p, 2750 * p, lvl(info, 0.12));
    tone(c, out, 'sine', t + 0.02, 0.18, 3900 * p, 3850 * p, lvl(info, 0.08));
    burst(c, out, t, 0.03, 'highpass', 4000 * p, 4000 * p, lvl(info, 0.05), 1, 0.001);
    return 0.3;
  },

  'pl-coo': (c, out, t, info) => {
    // A pigeon coo: two soft low warbled notes falling in pitch.
    const p = pitch(info);
    voiced(c, out, 'sine', t, 0.7, 320 * p, 260 * p, lvl(info, 0.12), 7, 0.04, 900, 0.1);
    voiced(c, out, 'sine', t + 0.8, 0.6, 300 * p, 240 * p, lvl(info, 0.1), 7, 0.04, 900, 0.1);
    return 1.4;
  },

  'pl-boules-clack': (c, out, t, info) => {
    // A metal knock: a falling triangle tick and a hard click.
    const p = pitch(info);
    tone(c, out, 'triangle', t, 0.08, 1800 * p, 1200 * p, lvl(info, 0.18));
    burst(c, out, t, 0.02, 'highpass', 3000 * p, 3000 * p, lvl(info, 0.12), 1, 0.001);
    return 0.1;
  },

  'pl-shop-bell': (c, out, t, info) => {
    // A little door bell: a ting-a-ling of two bright sines.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.6, 2100 * p, 2080 * p, lvl(info, 0.12));
    tone(c, out, 'sine', t + 0.12, 0.5, 2800 * p, 2780 * p, lvl(info, 0.1));
    return 0.7;
  },

  'pl-murmur': (c, out, t, info) => {
    // A short burst of café chatter: band-limited noise with syllable-like amplitude bumps.
    const p = pitch(info);
    const syllables = 5;
    for (let k = 0; k < syllables; k++) {
      burst(c, out, t + k * 0.2, 0.16, 'bandpass', 500 * p, 1200 * p, lvl(info, 0.06), 2, 0.03);
    }
    return (syllables - 1) * 0.2 + 0.16;
  },
};

let registered = false;

/** Register every Pardonlin sound once (later calls do nothing). Must not touch AudioContext at import time. */
export function registerPardonlinSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of PL_SOUND_IDS) if (!hasSound(id)) registerSound(id, RECIPES[id]);
}
