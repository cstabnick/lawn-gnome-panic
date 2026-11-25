// Hedgeworth's sounds: a procedural recipe for every GOLF_SOUNDS id, registered on the world sound bus (sound/bus.ts
// registerSound) so playAt / play2d can play them. Soft, cartoonish, garden-scale (same style as fishing/sounds.ts).
// info.param: 0.5 = calm, 1 = strong (louder, a touch higher; the club strike uses it). info.rand: a little pitch
// variation per play. Peaks never go above 0.25.
import { hasSound, registerSound } from '../sound/bus';
import { burst, tone } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';
import { GOLF_SOUNDS } from './types';
import type { GolfSoundId } from './types';

const PEAK_MAX = 0.25;

/** Pitch multiplier: per-play random +-10%, plus a little lift when strong. */
function pitch(info: SoundInfo): number {
  return (1 + (info.rand - 0.5) * 0.2) * (1 + (info.param - 0.5) * 0.3);
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

const RECIPES: Record<GolfSoundId, Recipe> = {
  'golf-tock': (c, out, t, info) => {
    // A club face on the ball: a sharp click, then a short hollow woody body that decays fast.
    const p = pitch(info);
    burst(c, out, t, 0.012, 'highpass', 3500 * p, 3500 * p, lvl(info, 0.08), 2, 0.001);
    tone(c, out, 'sine', t, 0.12, 320 * p, 220 * p, lvl(info, 0.2), 0.002);
    tone(c, out, 'triangle', t, 0.05, 900 * p, 500 * p, lvl(info, 0.06), 0.001);
    return 0.12;
  },

  'golf-putt': (c, out, t, info) => {
    // A soft tick on the green.
    const p = pitch(info);
    burst(c, out, t, 0.03, 'bandpass', 2000 * p, 1500 * p, lvl(info, 0.1), 3, 0.002);
    return 0.03;
  },

  'golf-cup': (c, out, t, info) => {
    // The ball rattling into the cup: three quick hollow plinks.
    const p = pitch(info);
    for (let k = 0; k < 3; k++) {
      tone(c, out, 'sine', t + k * 0.08, 0.12, 1400 * p, 900 * p, lvl(info, 0.14), 0.002);
    }
    return 0.16 + 0.12;
  },

  'golf-splash-reed': (c, out, t, info) => {
    // A plop into a reedy pond: a hollow drop, then a splash of noise through the reeds.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.12, 600 * p, 250 * p, lvl(info, 0.16), 0.003);
    burst(c, out, t, 0.35, 'bandpass', 1200 * p, 600 * p, lvl(info, 0.1), 1.2, 0.005);
    return 0.35;
  },

  'board-crack': (c, out, t, info) => {
    // A fence board snapping: a sharp wood crack, then a clatter of planks.
    const p = pitch(info);
    burst(c, out, t, 0.03, 'highpass', 3000 * p, 2000 * p, lvl(info, 0.22), 1.5, 0.001);
    burst(c, out, t + 0.03, 0.25, 'bandpass', 1500 * p, 400 * p, lvl(info, 0.12), 2, 0.003);
    tone(c, out, 'triangle', t + 0.08, 0.05, 180 * p, 120 * p, lvl(info, 0.1), 0.002);
    tone(c, out, 'triangle', t + 0.15, 0.05, 160 * p, 110 * p, lvl(info, 0.08), 0.002);
    return 0.3;
  },

  'hedge-rustle': (c, out, t, info) => {
    // A long leafy rustle as a cart pushes through a giant plant.
    const p = pitch(info);
    burst(c, out, t, 0.8, 'bandpass', 2500 * p, 1200 * p, lvl(info, 0.14), 0.8, 0.1);
    burst(c, out, t, 0.6, 'highpass', 4000 * p, 2500 * p, lvl(info, 0.06), 1, 0.08);
    return 0.8;
  },

  'sprinkler-hiss': (c, out, t, info) => {
    // A lawn sprinkler: four ticks as the arm turns, then a hiss of water, about 1.2 s.
    const p = pitch(info);
    for (let k = 0; k < 4; k++) {
      burst(c, out, t + k * 0.08, 0.02, 'highpass', 2400 * p, 2400 * p, lvl(info, 0.07), 2, 0.002);
    }
    burst(c, out, t + 0.35, 0.85, 'bandpass', 5000 * p, 3500 * p, lvl(info, 0.12), 0.7, 0.08);
    return 1.2;
  },
};

let registered = false;

/** Register every golf sound once (later calls do nothing). Must not touch AudioContext at import time. */
export function registerGolfSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of GOLF_SOUNDS) if (!hasSound(id)) registerSound(id, RECIPES[id]);
}
