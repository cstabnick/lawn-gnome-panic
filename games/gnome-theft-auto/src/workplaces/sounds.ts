// E24 workplace sounds: synthesized one-shots on the world sound bus (sound/bus.ts registerSound). No audio files.
// Runtimes call registerWorkSounds() once, then play2d(id) / playAt(id, pos) from '../sound/bus'.
import { hasSound, registerSound } from '../sound/bus';
import type { Recipe, SoundInfo } from '../sound/ids';
import { burst, tone, voiced } from '../sound/synth';

export const WORK_SOUND_IDS = [
  // chef
  'chef-chop', 'chef-sizzle', 'chef-stir', 'chef-pour', 'chef-bell', 'chef-ticket',
  // mechanic
  'mech-air-wrench', 'mech-spray', 'mech-keys',
  // comedy
  'crowd-groan', 'crowd-boo', 'crowd-cough', 'crowd-sigh', 'pity-clap', 'comedy-rimshot', 'tomato-splat', 'tomato-whoosh',
] as const;
export type WorkSoundId = (typeof WORK_SOUND_IDS)[number];

const PEAK_MAX = 0.25;

/** Per-play pitch variation of about +-6%. */
function pitch(info: SoundInfo): number {
  return 1 + (info.rand - 0.5) * 0.12;
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

export const WORK_RECIPES: Record<WorkSoundId, Recipe> = {
  'chef-chop': (c, out, t, info) => {
    // A dry knife knock on the board: a short bright noise tick over a low thud.
    const p = pitch(info);
    burst(c, out, t, 0.05, 'bandpass', 1800 * p, 1200 * p, lvl(info, 0.12), 2, 0.002);
    tone(c, out, 'sine', t, 0.12, 160 * p, 80 * p, lvl(info, 0.14));
    return 0.15;
  },

  'chef-sizzle': (c, out, t, info) => {
    // A pan hiss with small crackle pops on top.
    const p = pitch(info);
    burst(c, out, t, 0.8, 'highpass', 3500 * p, 5000 * p, lvl(info, 0.07), 0.8, 0.05);
    for (let k = 0; k < 12; k++) {
      burst(c, out, t + k * 0.065 + (k % 3) * 0.02, 0.012, 'highpass', 6000 * p, 6000 * p, lvl(info, 0.1), 1, 0.001);
    }
    return 0.8;
  },

  'chef-stir': (c, out, t, info) => {
    // A soft wooden spoon scrape against the pot.
    const p = pitch(info);
    burst(c, out, t, 0.45, 'bandpass', 600 * p, 380 * p, lvl(info, 0.1), 3, 0.08);
    return 0.5;
  },

  'chef-pour': (c, out, t, info) => {
    // A gurgle: noise through a band-pass whose centre wobbles up and down.
    const p = pitch(info);
    for (let k = 0; k < 5; k++) {
      const wobble = 1 + (k % 2) * 0.25;
      burst(c, out, t + k * 0.1, 0.12, 'bandpass', 300 * p * wobble, 500 * p * wobble, lvl(info, 0.08), 5, 0.02);
    }
    return 0.62;
  },

  'chef-bell': (c, out, t, info) => {
    // A counter bell: two inharmonic partials with a long decay, and a small strike click.
    const p = pitch(info);
    tone(c, out, 'sine', t, 1.2, 1480 * p, 1470 * p, lvl(info, 0.12));
    tone(c, out, 'sine', t, 1.2, 2350 * p, 2330 * p, lvl(info, 0.07));
    burst(c, out, t, 0.02, 'highpass', 3000, 3000, lvl(info, 0.05), 1, 0.002);
    return 1.2;
  },

  'chef-ticket': (c, out, t, info) => {
    // A paper rustle, then a tiny printer chirp twice.
    const p = pitch(info);
    burst(c, out, t, 0.25, 'highpass', 2500 * p, 4000 * p, lvl(info, 0.06), 0.7, 0.02);
    tone(c, out, 'square', t + 0.25, 0.12, 1400 * p, 2200 * p, lvl(info, 0.05));
    tone(c, out, 'square', t + 0.4, 0.08, 1800 * p, 2600 * p, lvl(info, 0.05));
    return 0.5;
  },

  'mech-air-wrench': (c, out, t, info) => {
    // A brrrt: pulsed noise at about 30 pulses a second for half a second.
    const p = pitch(info);
    for (let k = 0; k < 15; k++) {
      burst(c, out, t + k / 30, 0.03, 'bandpass', 900 * p, 700 * p, lvl(info, 0.14), 1.5, 0.003);
    }
    return 0.5;
  },

  'mech-spray': (c, out, t, info) => {
    // A can hiss with a quick rattle at the start.
    const p = pitch(info);
    for (let k = 0; k < 4; k++) {
      burst(c, out, t + k * 0.02, 0.015, 'bandpass', 2500 * p, 3000 * p, lvl(info, 0.1), 3, 0.001);
    }
    burst(c, out, t, 0.8, 'highpass', 5000 * p, 7000 * p, lvl(info, 0.1), 0.7, 0.01);
    return 0.8;
  },

  'mech-keys': (c, out, t, info) => {
    // A jingle of four small metallic tinks.
    const p = pitch(info);
    for (let k = 0; k < 4; k++) {
      tone(c, out, 'sine', t + k * 0.09, 0.12, (2600 + k * 200) * p, (2550 + k * 200) * p, lvl(info, 0.1));
    }
    return 0.5;
  },

  'crowd-groan': (c, out, t, info) => {
    // Several low "ohhh" voices falling in pitch, slightly out of step with each other.
    const p = pitch(info);
    for (let v = 0; v < 3; v++) {
      const f0 = (150 + v * 18) * p;
      voiced(c, out, 'sawtooth', t + v * 0.05, 1.2, f0, f0 * 0.8, lvl(info, 0.05), 5, 0.02, 700, 0.15);
    }
    return 1.3;
  },

  'crowd-boo': (c, out, t, info) => {
    // Several flat, buzzy "boo" voices through a low-pass.
    const p = pitch(info);
    for (let v = 0; v < 3; v++) {
      const f = (220 + v * 22) * p;
      voiced(c, out, 'square', t + v * 0.04, 1.4, f, f * 0.97, lvl(info, 0.035), 6, 0.015, 1200, 0.08);
    }
    return 1.45;
  },

  'crowd-cough': (c, out, t, info) => {
    // One cough: a noise burst and a second, softer pulse.
    const p = pitch(info);
    burst(c, out, t, 0.12, 'bandpass', 900 * p, 700 * p, lvl(info, 0.18), 1.2, 0.005);
    burst(c, out, t + 0.16, 0.1, 'bandpass', 800 * p, 600 * p, lvl(info, 0.14), 1.2, 0.005);
    return 0.3;
  },

  'crowd-sigh': (c, out, t, info) => {
    // A breathy sigh: soft noise sliding down in pitch.
    const p = pitch(info);
    burst(c, out, t, 1, 'bandpass', 1400 * p, 500 * p, lvl(info, 0.1), 1.2, 0.2);
    return 1;
  },

  'pity-clap': (c, out, t, info) => {
    // One clap, a pause, then a second, smaller and hesitant clap.
    const p = pitch(info);
    burst(c, out, t, 0.06, 'bandpass', 1800 * p, 1500 * p, lvl(info, 0.22), 1.5, 0.002);
    burst(c, out, t + 0.55, 0.05, 'bandpass', 1700 * p, 1400 * p, lvl(info, 0.12), 1.5, 0.002);
    return 0.65;
  },

  'comedy-rimshot': (c, out, t, info) => {
    // Badum-tss: a snare and kick hit, then a cymbal wash.
    const p = pitch(info);
    tone(c, out, 'triangle', t, 0.15, 140 * p, 110 * p, lvl(info, 0.2));
    burst(c, out, t, 0.12, 'bandpass', 1800 * p, 1200 * p, lvl(info, 0.2), 1.2, 0.002);
    burst(c, out, t + 0.25, 0.7, 'highpass', 7000 * p, 8000 * p, lvl(info, 0.1), 0.7, 0.003);
    return 0.95;
  },

  'tomato-splat': (c, out, t, info) => {
    // A wet squelch: low-passed noise with a fast pitch drop.
    const p = pitch(info);
    burst(c, out, t, 0.3, 'lowpass', 1200 * p, 300 * p, lvl(info, 0.22), 2, 0.003);
    tone(c, out, 'sine', t, 0.2, 260 * p, 80 * p, lvl(info, 0.15), 0.003);
    return 0.3;
  },

  'tomato-whoosh': (c, out, t, info) => {
    // A short whoosh rising in pitch.
    const p = pitch(info);
    burst(c, out, t, 0.35, 'bandpass', 400 * p, 2400 * p, lvl(info, 0.12), 1.5, 0.08);
    return 0.35;
  },
};

let registered = false;

/** Register every workplace sound once (later calls do nothing). Must not touch AudioContext at import time. */
export function registerWorkSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of WORK_SOUND_IDS) if (!hasSound(id)) registerSound(id, WORK_RECIPES[id]);
}
