// E31 living world sounds: synthesized recipes (no audio files). Each id is a procedural recipe on the world sound bus
// (sound/bus.ts registerSound), played positionally by living/sound.ts. Peaks never go above PEAK_MAX.
import { hasSound, registerSound } from '../sound/bus';
import { burst, tone, voiced } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';

export const LIVING_SOUND_IDS = [
  'living-frogs',
  'living-bittern',
  'living-reeds',
  'living-radio',
  'living-woodpecker',
  'living-dog',
  'living-gate',
  'living-kettle',
  'living-loon',
] as const;

export type LivingSoundId = (typeof LIVING_SOUND_IDS)[number];

const PEAK_MAX = 0.25;

/** Per-play pitch variation of about +-6%. */
function pitch(info: SoundInfo): number {
  return 1 + (info.rand - 0.5) * 0.12;
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

const RECIPES: Record<LivingSoundId, Recipe> = {
  'living-frogs': (c, out, t, info) => {
    // A chorus of 3-6 short croaks: falling saw tones with a little bubble of noise under each.
    const p = pitch(info);
    const croaks = 3 + Math.floor(info.rand * 4);
    for (let k = 0; k < croaks; k++) {
      const at = t + k * 0.19 + (k % 2) * 0.03;
      voiced(c, out, 'sawtooth', at, 0.12, 190 * p, 135 * p, lvl(info, 0.1), 40, 0.02, 900, 0.01);
      burst(c, out, at, 0.1, 'bandpass', 500 * p, 380 * p, lvl(info, 0.03), 1.5, 0.01);
    }
    return (croaks - 1) * 0.19 + 0.12;
  },

  'living-bittern': (c, out, t, info) => {
    // The bittern's boom, twice: a deep falling sine with a low breath of noise.
    const p = pitch(info);
    for (const at of [0, 1.4]) {
      tone(c, out, 'sine', t + at, 1.6, 110 * p, 68 * p, lvl(info, 0.2), 0.05);
      burst(c, out, t + at, 0.5, 'lowpass', 300 * p, 200 * p, lvl(info, 0.05), 1, 0.05);
    }
    return 1.4 + 1.6;
  },

  'living-reeds': (c, out, t, info) => {
    // Soft wind hiss through reeds: slow band-limited noise that swells and opens up.
    const p = pitch(info);
    burst(c, out, t, 2.5, 'bandpass', 2500 * p, 3500 * p, lvl(info, 0.06), 0.8, 0.3);
    return 2.5;
  },

  'living-radio': (c, out, t, info) => {
    // A ranger's radio: a crackle of static, then a muffled two-tone beep.
    const p = pitch(info);
    burst(c, out, t, 0.6, 'highpass', 2000 * p, 2000 * p, lvl(info, 0.05), 0.5, 0.01);
    tone(c, out, 'sine', t + 0.7, 0.25, 880 * p, 870 * p, lvl(info, 0.06));
    tone(c, out, 'sine', t + 1.0, 0.25, 660 * p, 650 * p, lvl(info, 0.06));
    return 1.3;
  },

  'living-woodpecker': (c, out, t, info) => {
    // A fast knock burst: five quick woody taps.
    const p = pitch(info);
    const knocks = 5;
    for (let k = 0; k < knocks; k++) {
      const at = t + k * 0.07;
      tone(c, out, 'triangle', at, 0.03, 1400 * p, 900 * p, lvl(info, 0.12), 0.001);
      burst(c, out, at, 0.02, 'highpass', 2500 * p, 2500 * p, lvl(info, 0.06), 1, 0.001);
    }
    return (knocks - 1) * 0.07 + 0.05;
  },

  'living-dog': (c, out, t, info) => {
    // Two woofs: short rough barks falling in pitch.
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.22, 260 * p, 200 * p, lvl(info, 0.12), 30, 0.02, 900, 0.01);
    voiced(c, out, 'sawtooth', t + 0.35, 0.2, 230 * p, 180 * p, lvl(info, 0.11), 30, 0.02, 900, 0.01);
    return 0.6;
  },

  'living-gate': (c, out, t, info) => {
    // A creaky gate: a slow wobbling saw sweeping down, with a little friction hiss.
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.9, 180 * p, 120 * p, lvl(info, 0.08), 5, 0.08, 1200, 0.05);
    burst(c, out, t, 0.9, 'bandpass', 900 * p, 700 * p, lvl(info, 0.03), 2, 0.05);
    return 0.9;
  },

  'living-kettle': (c, out, t, info) => {
    // A kettle whistle rising, soft and steady.
    const p = pitch(info);
    voiced(c, out, 'sine', t, 2.5, 900 * p, 1800 * p, lvl(info, 0.1), 6, 0.01, 4000, 0.3);
    return 2.5;
  },

  'living-loon': (c, out, t, info) => {
    // The tarn loon: a long wailing whistle that rises, then falls away over the water.
    const p = pitch(info);
    voiced(c, out, 'sine', t, 1.6, 500 * p, 1100 * p, lvl(info, 0.1), 4, 0.03, 2400, 0.4);
    voiced(c, out, 'sine', t + 1.6, 1.8, 1100 * p, 450 * p, lvl(info, 0.1), 4, 0.03, 2400, 0.1);
    return 3.4;
  },
};

let registered = false;

/** Register every E31 living sound once (later calls do nothing). Must not touch AudioContext at import time. */
export function registerLivingSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of LIVING_SOUND_IDS) if (!hasSound(id)) registerSound(id, RECIPES[id]);
}
