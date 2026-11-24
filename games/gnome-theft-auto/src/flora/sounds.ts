// Mow sounds: a procedural recipe for every MOW_SOUND_IDS id, registered on the world sound bus (sound/bus.ts
// registerSound) so playAt can play them. Soft, garden-scale (same style as fishing/sounds.ts).
// info.param: 0.5 = normal, 1 = hard mow (louder). info.rand: a little pitch variation per play.
// Peaks never go above 0.25.
import { registerSound, hasSound } from '../sound/bus';
import { burst, tone } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';
import type { MowSoundId } from './types';

export const MOW_SOUND_IDS: readonly MowSoundId[] = ['mow-snip', 'mow-chop', 'mow-thunk', 'mow-rustle'];

const PEAK_MAX = 0.25;

/** Pitch multiplier: per-play random +-10%. */
function pitch(info: SoundInfo): number {
  return 1 + (info.rand - 0.5) * 0.2;
}

/** Peak: normal 0.75x, hard 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

const RECIPES: Record<MowSoundId, Recipe> = {
  'mow-snip': (c, out, t, info) => {
    // A quick bright snip: two short high noise bursts, 0.08 s in all.
    const p = pitch(info);
    burst(c, out, t, 0.02, 'highpass', 4500 * p, 4500 * p, lvl(info, 0.14), 1.5, 0.002);
    burst(c, out, t + 0.03, 0.025, 'bandpass', 3500 * p, 3000 * p, lvl(info, 0.1), 2, 0.002);
    return 0.08;
  },

  'mow-chop': (c, out, t, info) => {
    // A woody chop: a bandpassed click plus a short falling thud.
    const p = pitch(info);
    burst(c, out, t, 0.04, 'bandpass', 1200 * p, 1000 * p, lvl(info, 0.2), 1.2, 0.002);
    tone(c, out, 'sine', t, 0.15, 180 * p, 120 * p, lvl(info, 0.2), 0.003);
    return 0.15;
  },

  'mow-thunk': (c, out, t, info) => {
    // A leafy shrub hit: a low sine thud, then a lowpassed rustle of leaves.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.12, 110 * p, 70 * p, lvl(info, 0.2), 0.004);
    burst(c, out, t, 0.25, 'lowpass', 1200 * p, 600 * p, lvl(info, 0.1), 0.7, 0.006);
    return 0.25;
  },

  'mow-rustle': (c, out, t, info) => {
    // A soft swish of leaves at low level.
    const p = pitch(info);
    burst(c, out, t, 0.3, 'highpass', 1500 * p, 2500 * p, lvl(info, 0.06), 0.8, 0.03);
    return 0.3;
  },
};

/** Register every mow sound (safe to call twice: ids already registered are skipped). Must not touch AudioContext at import time. */
export function registerMowSounds(): void {
  for (const id of MOW_SOUND_IDS) if (!hasSound(id)) registerSound(id, RECIPES[id]);
}
