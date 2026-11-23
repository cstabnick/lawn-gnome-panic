// Fishing sounds: a procedural recipe for every FISH_SOUND_IDS id, registered on the world sound bus (sound/bus.ts
// registerSound) so playAt / play2d can play them. Soft, cartoonish, garden-scale (same style as hunting/sounds.ts).
// info.param: 0.5 = calm, 1 = strong (louder, a touch higher; used by the splash). info.rand: a little pitch variation
// per play. Peaks never go above 0.25.
import { registerSound } from '../sound/bus';
import { burst, tone, voiced } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';
import { FISH_SOUND_IDS } from './types';

const PEAK_MAX = 0.25;

/** Pitch multiplier: per-play random +-10%, plus a little lift when strong. */
function pitch(info: SoundInfo): number {
  return (1 + (info.rand - 0.5) * 0.2) * (1 + (info.param - 0.5) * 0.3);
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

const RECIPES: Record<(typeof FISH_SOUND_IDS)[number], Recipe> = {
  'fish-cast': (c, out, t, info) => {
    // A rising whoosh of filtered noise, then a fast reel-click trill.
    const p = pitch(info);
    burst(c, out, t, 0.35, 'bandpass', 800 * p, 2400 * p, lvl(info, 0.14), 1.2, 0.03);
    const clicks = 6;
    for (let k = 0; k < clicks; k++) {
      burst(c, out, t + 0.2 + k * 0.02, 0.012, 'highpass', 3000 * p, 3000 * p, lvl(info, 0.06), 2, 0.002);
    }
    return 0.35;
  },

  'fish-plop': (c, out, t, info) => {
    // A small hollow "plip" and a short splash of noise.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.1, 600 * p, 250 * p, lvl(info, 0.18));
    burst(c, out, t, 0.08, 'bandpass', 1400 * p, 900 * p, lvl(info, 0.08), 1, 0.003);
    return 0.1;
  },

  'fish-nibble': (c, out, t, info) => {
    // A tiny blip.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.05, 900 * p, 900 * p, lvl(info, 0.12));
    return 0.05;
  },

  'fish-bite': (c, out, t, info) => {
    // A deeper double "bloop" with a splash burst.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.14, 320 * p, 300 * p, lvl(info, 0.2));
    tone(c, out, 'sine', t + 0.13, 0.16, 220 * p, 200 * p, lvl(info, 0.2));
    burst(c, out, t, 0.25, 'bandpass', 1200 * p, 700 * p, lvl(info, 0.1), 1, 0.005);
    return 0.13 + 0.16;
  },

  'fish-reel': (c, out, t, info) => {
    // A ratchet: 8 short bandpassed clicks over 0.4 s.
    const p = pitch(info);
    const count = 8;
    const step = 0.4 / count;
    for (let k = 0; k < count; k++) {
      burst(c, out, t + k * step, 0.03, 'bandpass', 2200 * p, 2200 * p, lvl(info, 0.12), 3, 0.002);
    }
    return (count - 1) * step + 0.03;
  },

  'fish-splash': (c, out, t, info) => {
    // A noise splash, louder with info.param.
    const p = pitch(info);
    burst(c, out, t, 0.35, 'bandpass', 1800 * p, 500 * p, lvl(info, 0.18), 0.8, 0.005);
    burst(c, out, t, 0.2, 'highpass', 2500 * p, 1200 * p, lvl(info, 0.06), 1, 0.002);
    return 0.35;
  },

  'fish-land': (c, out, t, info) => {
    // A cheerful three-note pluck up.
    const p = pitch(info);
    tone(c, out, 'triangle', t, 0.16, 523 * p, 523 * p, lvl(info, 0.16));
    tone(c, out, 'triangle', t + 0.14, 0.16, 659 * p, 659 * p, lvl(info, 0.16));
    tone(c, out, 'triangle', t + 0.28, 0.24, 784 * p, 784 * p, lvl(info, 0.16));
    return 0.28 + 0.24;
  },

  'fish-snap': (c, out, t, info) => {
    // A twangy "boing": a triangle sliding down with a wobble.
    const p = pitch(info);
    voiced(c, out, 'triangle', t, 0.4, 700 * p, 180 * p, lvl(info, 0.2), 25, 0.08, 3000, 0.004);
    return 0.4;
  },

  'fish-sell': (c, out, t, info) => {
    // A till clunk, then two coin clinks (like hunt-sell).
    const p = pitch(info);
    burst(c, out, t, 0.12, 'lowpass', 300 * p, 200 * p, lvl(info, 0.15), 1, 0.003);
    tone(c, out, 'sine', t + 0.15, 0.1, 3200 * p, 3000 * p, lvl(info, 0.08));
    tone(c, out, 'sine', t + 0.3, 0.12, 2900 * p, 2700 * p, lvl(info, 0.08));
    return 0.3 + 0.12;
  },
};

let registered = false;

/** Register every fishing sound once (later calls do nothing). Must not touch AudioContext at import time. */
export function registerFishSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of FISH_SOUND_IDS) registerSound(id, RECIPES[id]);
}
