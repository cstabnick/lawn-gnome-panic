// E25 workplace sounds (bin round, fire brigade, Gnomazon): synthesized one-shots on the world sound bus
// (sound/bus.ts registerSound). No audio files. Runtimes call registerJobs3Sounds() once, then play2d(id) / playAt(id, pos).
import { hasSound, registerSound } from '../sound/bus';
import type { Recipe, SoundInfo } from '../sound/ids';
import { burst, tone, voiced } from '../sound/synth';

export const JOBS3_SOUND_IDS = [
  // garbage
  'bin-arm-hydraulic', 'bin-clank', 'bin-tip', 'bin-spill', 'bin-set-down', 'lorry-reverse-beep',
  // firefighter
  'fire-bell', 'fire-crackle', 'hose-spray', 'hose-splash', 'steam-hiss', 'ladder-clunk', 'rescue-cheer', 'cat-meow',
  // gnomazon
  'tape-screech', 'scanner-beep', 'box-thud', 'conveyor-clunk', 'kippy-chime', 'kippy-error', 'quota-fanfare',
] as const;
export type Jobs3SoundId = (typeof JOBS3_SOUND_IDS)[number];

const PEAK_MAX = 0.25;

/** Per-play pitch variation of about +-6%. */
function pitch(info: SoundInfo): number {
  return 1 + (info.rand - 0.5) * 0.12;
}

/** Peak: calm 0.75x, strong 1.25x of the base, never above PEAK_MAX. */
function lvl(info: SoundInfo, peak: number): number {
  return Math.min(PEAK_MAX, peak * (0.75 + 0.5 * info.param));
}

export const JOBS3_RECIPES: Record<Jobs3SoundId, Recipe> = {
  'bin-arm-hydraulic': (c, out, t, info) => {
    // A hydraulic whine rising in pitch, with a thin hiss on top.
    const p = pitch(info);
    tone(c, out, 'sawtooth', t, 0.9, 180 * p, 480 * p, lvl(info, 0.06), 0.05);
    burst(c, out, t, 0.9, 'highpass', 4000 * p, 4000 * p, lvl(info, 0.03), 0.7, 0.05);
    return 0.9;
  },

  'bin-clank': (c, out, t, info) => {
    // A hollow plastic-and-metal clonk: a low falling tone and a short bright ring.
    const p = pitch(info);
    tone(c, out, 'triangle', t, 0.35, 180 * p, 120 * p, lvl(info, 0.2));
    burst(c, out, t, 0.05, 'bandpass', 2500 * p, 2500 * p, lvl(info, 0.1), 4, 0.002);
    return 0.35;
  },

  'bin-tip': (c, out, t, info) => {
    // Rubbish tumbling: a rumble of low noise bursts for 0.8 s.
    const p = pitch(info);
    for (let k = 0; k < 8; k++) {
      burst(c, out, t + k * 0.09, 0.14, 'lowpass', 400 * p, 200 * p, lvl(info, 0.14), 1, 0.01);
    }
    return 0.8;
  },

  'bin-spill': (c, out, t, info) => {
    // A clatter of cans and paper: several short bright ticks over a rustle.
    const p = pitch(info);
    for (let k = 0; k < 6; k++) {
      burst(c, out, t + k * 0.05 + (k % 2) * 0.02, 0.03, 'bandpass', 3000 * p, 2500 * p, lvl(info, 0.12), 3, 0.002);
    }
    burst(c, out, t, 0.5, 'highpass', 4000 * p, 6000 * p, lvl(info, 0.05), 0.7, 0.02);
    return 0.55;
  },

  'bin-set-down': (c, out, t, info) => {
    // A soft plastic thud: a low dip in pitch and a muffled knock.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.2, 120 * p, 60 * p, lvl(info, 0.18));
    burst(c, out, t, 0.08, 'lowpass', 600 * p, 300 * p, lvl(info, 0.08), 1, 0.003);
    return 0.22;
  },

  'lorry-reverse-beep': (c, out, t, info) => {
    // Three square-wave beeps at 1 kHz.
    const p = pitch(info);
    for (let k = 0; k < 3; k++) {
      tone(c, out, 'square', t + k * 0.3, 0.18, 1000 * p, 1000 * p, lvl(info, 0.1));
    }
    return 0.8;
  },

  'fire-bell': (c, out, t, info) => {
    // A brass hand bell rung fast: a run of inharmonic dings, each with a faint upper partial.
    const p = pitch(info);
    for (let k = 0; k < 8; k++) {
      const f = 1300 * p * (1 + (k % 2) * 0.07);
      tone(c, out, 'sine', t + k * 0.13, 0.5, f, f * 0.995, lvl(info, 0.1));
      tone(c, out, 'sine', t + k * 0.13, 0.35, f * 2.76, f * 2.7, lvl(info, 0.04));
    }
    return 1.45;
  },

  'fire-crackle': (c, out, t, info) => {
    // Random crackle pops over a low roar, 0.8 s in all.
    const p = pitch(info);
    burst(c, out, t, 0.8, 'lowpass', 300 * p, 250 * p, lvl(info, 0.1), 0.7, 0.1);
    for (let k = 0; k < 14; k++) {
      const at = t + Math.random() * 0.75;
      burst(c, out, at, 0.015, 'highpass', 3000 * p, 3000 * p, lvl(info, 0.12), 1, 0.001);
    }
    return 0.8;
  },

  'hose-spray': (c, out, t, info) => {
    // A 1 s white-noise hiss with a slight flutter. Replay it to loop.
    const p = pitch(info);
    burst(c, out, t, 1, 'highpass', 2500 * p, 3000 * p, lvl(info, 0.12), 0.7, 0.05);
    burst(c, out, t, 1, 'bandpass', 1800 * p, 1900 * p, lvl(info, 0.05), 0.8, 0.05);
    return 1;
  },

  'hose-splash': (c, out, t, info) => {
    // Wet splatter: a falling wash, then a spatter of small ticks.
    const p = pitch(info);
    burst(c, out, t, 0.25, 'bandpass', 1500 * p, 800 * p, lvl(info, 0.2), 2, 0.003);
    for (let k = 0; k < 5; k++) {
      burst(c, out, t + 0.05 + k * 0.035, 0.02, 'highpass', 4000 * p, 4000 * p, lvl(info, 0.1), 1, 0.001);
    }
    return 0.3;
  },

  'steam-hiss': (c, out, t, info) => {
    // A fast hiss that falls off in pitch.
    const p = pitch(info);
    burst(c, out, t, 0.9, 'highpass', 6000 * p, 2500 * p, lvl(info, 0.14), 0.7, 0.01);
    return 0.9;
  },

  'ladder-clunk': (c, out, t, info) => {
    // A metal clunk, then a clank that rings a little.
    const p = pitch(info);
    tone(c, out, 'triangle', t, 0.25, 260 * p, 180 * p, lvl(info, 0.16));
    tone(c, out, 'sine', t + 0.12, 0.3, 1800 * p, 1750 * p, lvl(info, 0.08));
    burst(c, out, t + 0.12, 0.04, 'highpass', 4000 * p, 4000 * p, lvl(info, 0.1), 1, 0.001);
    return 0.45;
  },

  'rescue-cheer': (c, out, t, info) => {
    // A short rising "hooray": two voiced notes, the second higher and longer.
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.35, 392 * p, 440 * p, lvl(info, 0.08), 5, 0.02, 1800, 0.02);
    voiced(c, out, 'sawtooth', t + 0.3, 0.5, 523 * p, 587 * p, lvl(info, 0.09), 5, 0.02, 1800, 0.02);
    return 0.85;
  },

  'cat-meow': (c, out, t, info) => {
    // A little falling meow: a voiced tone with vibrato, dulled to sound like a mouth shape.
    const p = pitch(info);
    voiced(c, out, 'sawtooth', t, 0.5, 900 * p, 520 * p, lvl(info, 0.12), 7, 0.03, 1400, 0.03);
    return 0.55;
  },

  'tape-screech': (c, out, t, info) => {
    // The long screech of a tape gun: band-passed noise sweeping up.
    const p = pitch(info);
    burst(c, out, t, 0.6, 'bandpass', 1500 * p, 5000 * p, lvl(info, 0.2), 6, 0.02);
    return 0.6;
  },

  'scanner-beep': (c, out, t, info) => {
    // One clean high beep.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.12, 2600 * p, 2600 * p, lvl(info, 0.15));
    return 0.13;
  },

  'box-thud': (c, out, t, info) => {
    // A cardboard thump: a deep dip in pitch and a short muffled slap.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.18, 150 * p, 70 * p, lvl(info, 0.2));
    burst(c, out, t, 0.06, 'lowpass', 800 * p, 400 * p, lvl(info, 0.1), 1, 0.003);
    return 0.2;
  },

  'conveyor-clunk': (c, out, t, info) => {
    // Two roller clunks in a row.
    const p = pitch(info);
    for (const at of [0, 0.25]) {
      tone(c, out, 'triangle', t + at, 0.12, 220 * p, 160 * p, lvl(info, 0.14));
      burst(c, out, t + at, 0.05, 'bandpass', 1200 * p, 900 * p, lvl(info, 0.08), 2, 0.002);
    }
    return 0.4;
  },

  'kippy-chime': (c, out, t, info) => {
    // A friendly two-note rising chime.
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.4, 880 * p, 880 * p, lvl(info, 0.14));
    tone(c, out, 'sine', t + 0.14, 0.5, 1320 * p, 1320 * p, lvl(info, 0.14));
    return 0.65;
  },

  'kippy-error': (c, out, t, info) => {
    // A polite two-note falling "bwoop".
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.25, 520 * p, 480 * p, lvl(info, 0.14));
    tone(c, out, 'sine', t + 0.22, 0.35, 400 * p, 300 * p, lvl(info, 0.14));
    return 0.6;
  },

  'quota-fanfare': (c, out, t, info) => {
    // A tiny 4-note major arpeggio: C5, E5, G5, C6.
    const p = pitch(info);
    const notes = [523, 659, 784, 1047];
    for (let k = 0; k < notes.length; k++) {
      tone(c, out, 'triangle', t + k * 0.11, 0.22, notes[k] * p, notes[k] * p, lvl(info, 0.14));
    }
    return 0.6;
  },
};

/** Register every JOBS3_SOUND_IDS recipe on the bus (idempotent: ids already registered are skipped). */
export function registerJobs3Sounds(): void {
  for (const id of JOBS3_SOUND_IDS) if (!hasSound(id)) registerSound(id, JOBS3_RECIPES[id]);
}
