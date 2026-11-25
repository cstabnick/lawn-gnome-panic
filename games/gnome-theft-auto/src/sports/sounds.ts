// Founders' Green sports sounds: a procedural recipe for every CourtSoundId (Drainpipe Court) and SkateSoundId (the
// Gutter Bowls), registered on the world sound bus (sound/bus.ts registerSound) so playAt / play2d can play them.
// Soft, cartoonish, garden-scale (same style as golf/sounds.ts).
// info.param: 0.5 = calm, 1 = strong (louder, a touch higher; skate-roll reads it as speed, skate-land as impact).
// info.rand: a little pitch variation per play. Peaks never go above 0.25.
import { hasSound, registerSound } from '../sound/bus';
import { burst, tone } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';
import type { CourtSoundId } from '../court/types';
import type { SkateSoundId } from '../skate/types';

const PEAK_MAX = 0.25;

/** Pitch multiplier: per-play random +-10%, plus a little lift when strong. */
function pitch(info: SoundInfo): number {
  return (1 + (info.rand - 0.5) * 0.2) * (1 + (info.param - 0.5) * 0.3);
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

const RECIPES: Record<CourtSoundId | SkateSoundId, Recipe> = {
  'jam-bounce': (c, out, t, info) => {
    // A rubber ball on concrete: a short hollow thump with a little ping.
    const p = pitch(info);
    tone(c, out, 'triangle', t, 0.09, 260 * p, 140 * p, lvl(info, 0.2), 0.002);
    burst(c, out, t, 0.02, 'highpass', 2500 * p, 2500 * p, lvl(info, 0.05), 2, 0.001);
    tone(c, out, 'sine', t, 0.1, 1100 * p, 1000 * p, lvl(info, 0.04), 0.002);
    return 0.1;
  },

  'jam-swish': (c, out, t, info) => {
    // A ball through a netless rim: a soft whoosh (no net rustle), then a clunk down the drainpipe.
    const p = pitch(info);
    burst(c, out, t, 0.3, 'bandpass', 3000 * p, 1500 * p, lvl(info, 0.1), 1.2, 0.02);
    tone(c, out, 'sine', t + 0.3, 0.08, 180 * p, 90 * p, lvl(info, 0.18), 0.003);
    return 0.4;
  },

  'jam-clang': (c, out, t, info) => {
    // A ball off a metal rim: a bright clang with a slow wobble (two close tones beat against each other).
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.5, 1800 * p, 1700 * p, lvl(info, 0.14), 0.002);
    tone(c, out, 'sine', t, 0.5, 1830 * p, 1720 * p, lvl(info, 0.1), 0.002);
    burst(c, out, t, 0.03, 'highpass', 4000 * p, 3000 * p, lvl(info, 0.08), 2, 0.001);
    return 0.5;
  },

  'jam-dunk': (c, out, t, info) => {
    // A hand on the rim: a slap, then the drainpipe groaning.
    const p = pitch(info);
    burst(c, out, t, 0.03, 'highpass', 3000 * p, 2000 * p, lvl(info, 0.16), 1.5, 0.001);
    tone(c, out, 'triangle', t + 0.04, 0.35, 150 * p, 70 * p, lvl(info, 0.16), 0.02);
    burst(c, out, t + 0.04, 0.3, 'bandpass', 400 * p, 200 * p, lvl(info, 0.08), 2, 0.02);
    return 0.4;
  },

  'jam-whistle': (c, out, t, info) => {
    // A short referee whistle: a high tone with a slight rise.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.25, 2700 * p, 2800 * p, lvl(info, 0.14), 0.01);
    tone(c, out, 'triangle', t, 0.25, 5400 * p, 5600 * p, lvl(info, 0.02), 0.01);
    return 0.25;
  },

  'jam-cheer': (c, out, t, info) => {
    // Three or four small voices: a quick "ooh", staggered and at different pitches.
    const p = pitch(info);
    for (let k = 0; k < 4; k++) {
      const v = p * (0.9 + k * 0.07);
      tone(c, out, 'triangle', t + k * 0.05, 0.25, 380 * v, 300 * v, lvl(info, 0.07), 0.03);
    }
    return 0.4;
  },

  'jam-drainpipe': (c, out, t, info) => {
    // A ball rattling down a long drainpipe: falling tinny clunks, each a little lower and later.
    const p = pitch(info);
    for (let k = 0; k < 5; k++) {
      const f = (900 - k * 90) * p;
      tone(c, out, 'sine', t + k * 0.07, 0.05, f, f * 0.55, lvl(info, 0.14), 0.002);
    }
    burst(c, out, t, 0.35, 'bandpass', 2000 * p, 800 * p, lvl(info, 0.04), 3, 0.002);
    return 0.4;
  },

  'skate-roll': (c, out, t, info) => {
    // Wheels rolling on concrete: a short grainy rumble, about 0.4 s. info.param = speed (louder when faster).
    const p = pitch(info);
    burst(c, out, t, 0.4, 'bandpass', 1800 * p, 1400 * p, lvl(info, 0.1), 1.5, 0.02);
    burst(c, out, t, 0.4, 'highpass', 3000 * p, 2500 * p, lvl(info, 0.03), 1, 0.02);
    return 0.4;
  },

  'skate-pop': (c, out, t, info) => {
    // An ollie: the tail snapping on concrete, a quick rising knock and a scrape of air.
    const p = pitch(info);
    tone(c, out, 'triangle', t, 0.06, 300 * p, 520 * p, lvl(info, 0.16), 0.002);
    burst(c, out, t + 0.02, 0.05, 'highpass', 3000 * p, 2000 * p, lvl(info, 0.06), 2, 0.002);
    return 0.08;
  },

  'skate-land': (c, out, t, info) => {
    // Four wheels landing: a clack and a thud. info.param = impact.
    const p = pitch(info);
    burst(c, out, t, 0.02, 'highpass', 3000 * p, 2000 * p, lvl(info, 0.14), 2, 0.001);
    tone(c, out, 'triangle', t + 0.01, 0.12, 120 * p, 60 * p, lvl(info, 0.2), 0.002);
    return 0.14;
  },

  'skate-grind': (c, out, t, info) => {
    // Metal scraping along a rail, about 0.5 s.
    const p = pitch(info);
    burst(c, out, t, 0.5, 'bandpass', 2500 * p, 3200 * p, lvl(info, 0.1), 6, 0.02);
    burst(c, out, t, 0.5, 'highpass', 4500 * p, 4000 * p, lvl(info, 0.03), 4, 0.02);
    return 0.5;
  },

  'skate-bail': (c, out, t, info) => {
    // A board clattering away, then a gnome's "oof".
    const p = pitch(info);
    for (let k = 0; k < 3; k++) {
      tone(c, out, 'triangle', t + k * 0.12, 0.05, 500 * p, 320 * p, lvl(info, 0.12), 0.002);
    }
    burst(c, out, t, 0.4, 'bandpass', 1500 * p, 800 * p, lvl(info, 0.06), 2, 0.005);
    tone(c, out, 'triangle', t + 0.5, 0.15, 260 * p, 180 * p, lvl(info, 0.14), 0.01);
    return 0.65;
  },

  'skate-push': (c, out, t, info) => {
    // A foot scuffing concrete as the rider pushes off.
    const p = pitch(info);
    burst(c, out, t, 0.25, 'bandpass', 900 * p, 600 * p, lvl(info, 0.1), 2, 0.02);
    return 0.25;
  },
};

let registered = false;

/** Register every court and skate sound once (later calls do nothing). Must not touch AudioContext at import time. */
export function registerSportsSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of Object.keys(RECIPES) as (CourtSoundId | SkateSoundId)[]) {
    if (!hasSound(id)) registerSound(id, RECIPES[id]);
  }
}
