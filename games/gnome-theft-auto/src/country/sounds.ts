// The countryside's procedural recipes for every COUNTRY_SOUNDS id, registered on the world sound bus (sound/bus.ts
// registerSound) so playAt can play them. Soft, cartoonish, garden-scale (same style as golf/sounds.ts).
// info.param: 0.5 = calm, 1 = strong. info.rand: a little pitch variation per play. Peaks never go above 0.25.
import { hasSound, registerSound } from '../sound/bus';
import { burst, tone, voiced } from '../sound/synth';
import { deerBark, goatBleat } from '../sound/recipes/critters';
import type { Recipe, SoundInfo } from '../sound/ids';
import { COUNTRY_SOUNDS } from './types';
import type { CountrySoundId } from './types';

const PEAK_MAX = 0.25;

/** Pitch multiplier: per-play random +-10%, plus a little lift when strong. */
function pitch(info: SoundInfo): number {
  return (1 + (info.rand - 0.5) * 0.2) * (1 + (info.param - 0.5) * 0.3);
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

/** Cheap deterministic hash in 0..1, so one play's random-looking events are spread but repeatable. */
function hash(x: number): number {
  const s = Math.sin(x) * 43758.5453;
  return s - Math.floor(s);
}

const RECIPES: Record<CountrySoundId, Recipe> = {
  'country-campfire': (c, out, t, info) => {
    // Soft crackle: a low brown-noise bed under a few short sparks.
    const p = pitch(info);
    burst(c, out, t, 1.2, 'lowpass', 300 * p, 200 * p, lvl(info, 0.05), 0.7, 0.2);
    for (let k = 0; k < 6; k++) {
      const tk = t + hash(info.rand * 100 + k * 3.7) * 1.1;
      burst(c, out, tk, 0.03, 'highpass', 2500 * p, 2000 * p, lvl(info, 0.08), 2, 0.002);
    }
    return 1.2;
  },

  'country-site-hammer': (c, out, t, info) => {
    // Three quick taps: a wooden-metal knock with a short ring.
    const p = pitch(info);
    for (let k = 0; k < 3; k++) {
      const tk = t + k * 0.15;
      burst(c, out, tk, 0.04, 'bandpass', 1800 * p, 1500 * p, lvl(info, 0.15), 3, 0.002);
      tone(c, out, 'triangle', tk, 0.08, 420 * p, 300 * p, lvl(info, 0.1), 0.002);
    }
    return 0.5;
  },

  'country-site-mixer': (c, out, t, info) => {
    // A churning drum: a low rumble with a slow wobble and a gritty noise layer.
    const p = pitch(info);
    voiced(c, out, 'triangle', t, 1.5, 80 * p, 70 * p, lvl(info, 0.12), 3, 0.15, 300, 0.05);
    burst(c, out, t, 1.5, 'bandpass', 900 * p, 700 * p, lvl(info, 0.06), 2, 0.05);
    return 1.5;
  },

  'country-crane-whir': (c, out, t, info) => {
    // A rising electric whine that ends in a ratchet tick.
    const p = pitch(info);
    tone(c, out, 'sine', t, 1.1, 300 * p, 900 * p, lvl(info, 0.1), 0.1);
    tone(c, out, 'triangle', t, 1.1, 600 * p, 1200 * p, lvl(info, 0.05), 0.1);
    for (let k = 0; k < 3; k++) {
      burst(c, out, t + 1.1 + k * 0.04, 0.02, 'highpass', 3000 * p, 3000 * p, lvl(info, 0.1), 2, 0.002);
    }
    return 1.25;
  },

  'country-vine-snip': (c, out, t, info) => {
    // Two crisp shear snips.
    const p = pitch(info);
    for (let k = 0; k < 2; k++) {
      const tk = t + k * 0.15;
      burst(c, out, tk, 0.05, 'highpass', 4000 * p, 2500 * p, lvl(info, 0.18), 2, 0.001);
      tone(c, out, 'square', tk, 0.02, 2200 * p, 1800 * p, lvl(info, 0.04), 0.001);
    }
    return 0.25;
  },

  'country-deer-bark': deerBark,
  'country-goat-bleat': goatBleat,

  'country-manor-knocker': (c, out, t, info) => {
    // Two heavy brass knocks with a hollow ring that hangs after the second.
    const p = pitch(info);
    for (const tk of [t, t + 0.45]) {
      burst(c, out, tk, 0.06, 'lowpass', 600, 300, lvl(info, 0.15), 1);
      tone(c, out, 'sine', tk, 0.5, 180 * p, 120 * p, lvl(info, 0.22), 0.002);
    }
    tone(c, out, 'sine', t, 0.9, 520 * p, 500 * p, lvl(info, 0.06), 0.003);
    tone(c, out, 'sine', t + 0.45, 0.45, 780 * p, 760 * p, lvl(info, 0.03), 0.003);
    return 0.9;
  },

  'country-snore': (c, out, t, info) => {
    // One slow snore: a rough low inhale, then a whistling exhale.
    const p = pitch(info);
    burst(c, out, t, 0.8, 'bandpass', 400 * p, 700 * p, lvl(info, 0.1), 1, 0.2);
    tone(c, out, 'sawtooth', t, 0.8, 90 * p, 80 * p, lvl(info, 0.03), 0.2);
    burst(c, out, t + 0.9, 1.1, 'bandpass', 1800 * p, 900 * p, lvl(info, 0.08), 6, 0.15);
    return 2;
  },

  'farm-plant': (c, out, t, info) => {
    // A soft soil pat: a damp thump with a little dirt hiss.
    const p = pitch(info);
    burst(c, out, t, 0.08, 'lowpass', 600 * p, 200 * p, lvl(info, 0.14), 1, 0.002);
    tone(c, out, 'sine', t, 0.1, 140 * p, 90 * p, lvl(info, 0.08), 0.002);
    return 0.12;
  },

  'farm-water': (c, out, t, info) => {
    // About 0.8 s of watering-can patter: many small drops over a soft trickle.
    const p = pitch(info);
    burst(c, out, t, 0.8, 'bandpass', 2500 * p, 2500 * p, lvl(info, 0.03), 0.6, 0.1);
    for (let k = 0; k < 14; k++) {
      const tk = t + hash(info.rand * 50 + k * 1.9) * 0.75;
      burst(c, out, tk, 0.02, 'highpass', 3000 * p, 2500 * p, lvl(info, 0.06), 2, 0.002);
    }
    return 0.8;
  },

  'farm-harvest': (c, out, t, info) => {
    // A leafy pull, then a pop as the crop comes free.
    const p = pitch(info);
    burst(c, out, t, 0.25, 'bandpass', 1500 * p, 800 * p, lvl(info, 0.12), 1, 0.05);
    tone(c, out, 'sine', t + 0.25, 0.08, 300 * p, 120 * p, lvl(info, 0.14), 0.002);
    return 0.35;
  },

  'farm-sell': (c, out, t, info) => {
    // A couple of acorns clinking into a tin.
    const p = pitch(info);
    for (const tk of [t, t + 0.13]) {
      tone(c, out, 'triangle', tk, 0.1, 2600 * p, 2200 * p, lvl(info, 0.12), 0.001);
      tone(c, out, 'sine', tk, 0.06, 3900 * p, 3900 * p, lvl(info, 0.05), 0.001);
    }
    tone(c, out, 'sine', t + 0.2, 0.12, 900 * p, 800 * p, lvl(info, 0.05), 0.003);
    return 0.35;
  },

  'farm-oak-shake': (c, out, t, info) => {
    // Leafy rustle, then 6-8 small knocks as acorns land.
    const p = pitch(info);
    const count = 6 + Math.floor(info.rand * 2.99);
    burst(c, out, t, 0.6, 'bandpass', 2500 * p, 1200 * p, lvl(info, 0.1), 0.8, 0.05);
    for (let k = 0; k < count; k++) {
      const tk = t + 0.5 + k * 0.07;
      tone(c, out, 'sine', tk, 0.03, 1500 * p, 1100 * p, lvl(info, 0.09), 0.001);
      burst(c, out, tk, 0.015, 'highpass', 2000 * p, 2000 * p, lvl(info, 0.06), 2, 0.001);
    }
    return 0.5 + (count - 1) * 0.07 + 0.04;
  },
};

let registered = false;

/** Register every countryside sound once (later calls do nothing). Must not touch AudioContext at import time. */
export function registerCountrySounds(): void {
  if (registered) return;
  registered = true;
  for (const id of COUNTRY_SOUNDS) if (!hasSound(id)) registerSound(id, RECIPES[id]);
}
