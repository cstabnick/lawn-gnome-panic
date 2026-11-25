// Tuft hunting: procedural sounds, registered on the world sound bus (sound/bus.ts registerSound) so playAt / play2d
// can play them: one call per species (HuntSpecies.call) plus the comb, the shot bouncing off a rolled shell, a flush
// of wings and the lodge till.
// Soft, cartoonish, garden-scale (same style as sound/recipes/critters.ts). info.param: 0.5 = calm, 1 = alarmed
// (louder and higher). info.rand: a little pitch variation per play. Peaks never go above 0.25.
import { registerSound } from '../sound/bus';
import { burst, tone, voiced } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';

export const HUNT_SOUND_IDS = [
  'hunt-hedgehog', 'hunt-fox', 'hunt-badger', 'hunt-armadillo', 'hunt-hare', 'hunt-mallard', 'hunt-mouse', 'hunt-pheasant', 'hunt-deer',
  'hunt-comb', 'hunt-bounce', 'hunt-flush', 'hunt-sell',
] as const;
export type HuntSoundId = (typeof HUNT_SOUND_IDS)[number];

const PEAK_MAX = 0.25;

/** Pitch multiplier: per-play random +-10%, plus a little lift when alarmed. */
function pitch(info: SoundInfo): number {
  return (1 + (info.rand - 0.5) * 0.2) * (1 + (info.param - 0.5) * 0.3);
}

/** Peak: calm 0.75x, alarmed 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

const RECIPES: Record<HuntSoundId, Recipe> = {
  'hunt-hedgehog': (c, out, t, info) => {
    // Three snuffly puffs of filtered noise.
    const p = pitch(info);
    const gap = 0.09;
    for (let k = 0; k < 3; k++) {
      burst(c, out, t + k * gap, 0.06, 'bandpass', 1500 * p, 900 * p, lvl(info, 0.14), 2, 0.008);
    }
    return 2 * gap + 0.06;
  },

  'hunt-fox': (c, out, t, info) => {
    // Two high yips.
    const p = pitch(info);
    voiced(c, out, 'triangle', t, 0.22, 1100 * p, 1500 * p, lvl(info, 0.2), 12, 0.03, 2600, 0.01);
    voiced(c, out, 'triangle', t + 0.3, 0.24, 1250 * p, 1700 * p, lvl(info, 0.2), 12, 0.03, 2600, 0.01);
    return 0.3 + 0.24;
  },

  'hunt-badger': (c, out, t, info) => {
    // Low grumble with a rumble underneath.
    const p = pitch(info);
    const dur = 0.8;
    voiced(c, out, 'sawtooth', t, dur, 90 * p, 70 * p, lvl(info, 0.16), 7, 0.05, 400, 0.05);
    burst(c, out, t, dur, 'lowpass', 260, 180, lvl(info, 0.1), 1, 0.08);
    return dur;
  },

  'hunt-armadillo': (c, out, t, info) => {
    // Dry scritch of claws on earth, then a few quick ticks.
    const p = pitch(info);
    burst(c, out, t, 0.45, 'bandpass', 2600 * p, 1800 * p, lvl(info, 0.1), 3, 0.02);
    for (let k = 0; k < 3; k++) {
      burst(c, out, t + 0.5 + k * 0.07, 0.03, 'highpass', 3000 * p, 3000 * p, lvl(info, 0.1), 2, 0.002);
    }
    return 0.5 + 2 * 0.07 + 0.03;
  },

  'hunt-hare': (c, out, t, info) => {
    // Two soft thumps (feet drumming).
    const p = pitch(info);
    burst(c, out, t, 0.12, 'lowpass', 220 * p, 120 * p, lvl(info, 0.22), 1, 0.005);
    burst(c, out, t + 0.22, 0.12, 'lowpass', 240 * p, 130 * p, lvl(info, 0.2), 1, 0.005);
    return 0.22 + 0.12;
  },

  'hunt-mallard': (c, out, t, info) => {
    // Two quacks.
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.2, 640 * p, 420 * p, lvl(info, 0.16), 28, 0.04, 1400, 0.01);
    voiced(c, out, 'sawtooth', t + 0.26, 0.22, 600 * p, 380 * p, lvl(info, 0.16), 28, 0.04, 1400, 0.01);
    return 0.26 + 0.22;
  },

  'hunt-mouse': (c, out, t, info) => {
    // A tiny high squeak, then a shorter one.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.07, 3800 * p, 4600 * p, lvl(info, 0.12));
    tone(c, out, 'sine', t + 0.09, 0.07, 4200 * p, 3600 * p, lvl(info, 0.1));
    return 0.09 + 0.07;
  },

  'hunt-pheasant': (c, out, t, info) => {
    // Creaky two-note "korr-kok", then a wing whirr.
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.18, 300 * p, 240 * p, lvl(info, 0.16), 6, 0.03, 1200, 0.01);
    tone(c, out, 'triangle', t + 0.24, 0.1, 380 * p, 340 * p, lvl(info, 0.14));
    burst(c, out, t + 0.4, 0.35, 'bandpass', 2000 * p, 2400 * p, lvl(info, 0.06), 1.5, 0.05);
    return 0.4 + 0.35;
  },

  'hunt-deer': (c, out, t, info) => {
    // A short, hoarse dog-like bark: a noisy burst with a quick pitch drop.
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.35, 520 * p, 260 * p, lvl(info, 0.18), 20, 0.02, 900, 0.01);
    burst(c, out, t, 0.12, 'bandpass', 1200 * p, 800 * p, lvl(info, 0.08), 1.2, 0.005);
    return 0.35;
  },

  'hunt-comb': (c, out, t, info) => {
    // A quick brushing swish.
    const p = pitch(info);
    burst(c, out, t, 0.22, 'bandpass', 2500 * p, 5000 * p, lvl(info, 0.14), 1.2, 0.04);
    return 0.22;
  },

  'hunt-bounce': (c, out, t, info) => {
    // A small metallic ting off a rolled shell.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.35, 2600 * p, 2400 * p, lvl(info, 0.16));
    tone(c, out, 'sine', t, 0.2, 3900 * p, 3700 * p, lvl(info, 0.07));
    return 0.35;
  },

  'hunt-flush': (c, out, t, info) => {
    // A clatter of wingbeats, about half a second.
    const p = pitch(info);
    const count = 6;
    const step = 0.075;
    for (let k = 0; k < count; k++) {
      burst(c, out, t + k * step, 0.05, 'bandpass', 1800 * p, 1800 * p, lvl(info, 0.12), 1.5, 0.004);
    }
    return (count - 1) * step + 0.05;
  },

  'hunt-sell': (c, out, t, info) => {
    // A wooden till clunk, then two coin clinks.
    const p = pitch(info);
    burst(c, out, t, 0.12, 'lowpass', 300 * p, 200 * p, lvl(info, 0.15), 1, 0.003);
    tone(c, out, 'sine', t + 0.15, 0.1, 3200 * p, 3000 * p, lvl(info, 0.08));
    tone(c, out, 'sine', t + 0.3, 0.12, 2900 * p, 2700 * p, lvl(info, 0.08));
    return 0.3 + 0.12;
  },
};

let registered = false;

/** Register every HUNT_SOUND_IDS recipe once (later calls do nothing). */
export function registerHuntSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of HUNT_SOUND_IDS) registerSound(id, RECIPES[id]);
}
