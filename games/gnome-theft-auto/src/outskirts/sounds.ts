// Pebblewick's sounds: procedural recipes registered on the world sound bus (sound/bus.ts registerSound), so playAt /
// play2d can play them. Soft and garden-scale like fishing/sounds.ts; peaks never above 0.25. info.rand gives each
// play a little pitch variation.
import { registerSound } from '../sound/bus';
import { burst, tone, voiced } from '../sound/synth';
import type { Recipe, SoundInfo } from '../sound/ids';

export const PW_SOUND_IDS = [
  'pw-windmill-creak', 'pw-chime', 'pw-bell', 'pw-well-plop', 'pw-well-cough', 'pw-combine-hum', 'pw-combine-knock',
  'pw-diner-clatter', 'pw-bus-horn', 'pw-valve-gush', 'pw-hen-cluck', 'pw-till',
] as const;
export type PwSoundId = (typeof PW_SOUND_IDS)[number];

const PEAK_MAX = 0.25;
const lvl = (peak: number): number => Math.min(PEAK_MAX, peak);
const pitch = (info: SoundInfo): number => 1 + (info.rand - 0.5) * 0.16;

const RECIPES: Record<PwSoundId, Recipe> = {
  'pw-windmill-creak': (c, out, t, info) => {
    const p = pitch(info);
    burst(c, out, t, 0.8, 'bandpass', 260 * p, 420 * p, lvl(0.1), 8, 0.2);
    tone(c, out, 'sawtooth', t + 0.1, 0.6, 140 * p, 180 * p, lvl(0.025), 0.15);
    return 0.8;
  },
  'pw-chime': (c, out, t, info) => {
    const notes = [880, 1046.5, 1318.5, 1568, 1760];
    for (let k = 0; k < 3; k++) {
      const f = notes[Math.floor((info.rand * 7 + k * 2) % notes.length)];
      tone(c, out, 'sine', t + k * 0.22, 1.4, f, f, lvl(0.05));
    }
    return 1.9;
  },
  'pw-bell': (c, out, t, info) => {
    const f = 196 * pitch(info);
    tone(c, out, 'sine', t, 3.2, f, f, lvl(0.2));
    for (const [m, g] of [[2, 0.09], [2.76, 0.07], [5.4, 0.04]] as const) tone(c, out, 'sine', t, 2.2, f * m, f * m, lvl(g));
    burst(c, out, t, 0.05, 'highpass', 2000, 2000, lvl(0.06));
    return 3.2;
  },
  'pw-well-plop': (c, out, t, info) => {
    const p = pitch(info);
    tone(c, out, 'sine', t, 0.12, 700 * p, 240 * p, lvl(0.16));
    burst(c, out, t, 0.08, 'bandpass', 1200 * p, 800 * p, lvl(0.06), 1, 0.003);
    tone(c, out, 'sine', t + 0.15, 0.12, 700 * p, 240 * p, lvl(0.06));
    return 0.3;
  },
  'pw-well-cough': (c, out, t, info) => {
    const p = pitch(info);
    burst(c, out, t, 0.25, 'lowpass', 500 * p, 250 * p, lvl(0.18), 2, 0.01);
    burst(c, out, t + 0.3, 0.2, 'lowpass', 450 * p, 220 * p, lvl(0.14), 2, 0.01);
    for (let k = 0; k < 6; k++) tone(c, out, 'triangle', t + 0.55 + k * 0.07, 0.12, 2600 + k * 180, 2400 + k * 180, lvl(0.04));
    return 1.1;
  },
  'pw-combine-hum': (c, out, t) => {
    voiced(c, out, 'sine', t, 2.5, 55, 55, lvl(0.18), 0.7, 0.03, 400, 0.8);
    voiced(c, out, 'sine', t, 2.5, 82.4, 83, lvl(0.12), 0.45, 0.02, 400, 0.9);
    voiced(c, out, 'triangle', t + 0.4, 1.8, 165, 166, lvl(0.03), 0.3, 0.01, 600, 0.6);
    return 2.5;
  },
  'pw-combine-knock': (c, out, t, info) => {
    const p = pitch(info);
    for (const dt of [0, 0.28]) {
      burst(c, out, t + dt, 0.12, 'bandpass', 1800 * p, 1400 * p, lvl(0.16), 6, 0.002);
      tone(c, out, 'sine', t + dt, 0.6, 2350 * p, 2330 * p, lvl(0.05));
    }
    return 0.9;
  },
  'pw-diner-clatter': (c, out, t, info) => {
    const n = 3 + Math.floor(info.rand * 3);
    for (let k = 0; k < n; k++) {
      const f = 3000 + ((k * 977) % 1800);
      burst(c, out, t + k * 0.06 + info.rand * 0.03, 0.03, 'bandpass', f, f, lvl(0.07), 10, 0.001);
    }
    burst(c, out, t + n * 0.06 + 0.05, 0.09, 'lowpass', 300, 200, lvl(0.1), 1, 0.003);
    return n * 0.06 + 0.2;
  },
  'pw-bus-horn': (c, out, t) => {
    voiced(c, out, 'square', t, 0.32, 311, 311, lvl(0.12), 6, 0.01, 1200, 0.02);
    voiced(c, out, 'square', t + 0.38, 0.45, 247, 247, lvl(0.12), 6, 0.01, 1200, 0.02);
    return 0.85;
  },
  'pw-valve-gush': (c, out, t, info) => {
    const p = pitch(info);
    burst(c, out, t, 1.2, 'lowpass', 600 * p, 1800 * p, lvl(0.14), 1, 0.3);
    burst(c, out, t + 0.1, 1.0, 'bandpass', 2500 * p, 1500 * p, lvl(0.04), 2, 0.2);
    return 1.2;
  },
  'pw-hen-cluck': (c, out, t, info) => {
    const n = 2 + Math.round(info.rand);
    for (let k = 0; k < n; k++) voiced(c, out, 'sawtooth', t + k * 0.14, 0.08, 700 * pitch(info), 520, lvl(0.06), 30, 0.08, 1800, 0.005);
    return n * 0.14;
  },
  'pw-till': (c, out, t) => {
    tone(c, out, 'sine', t, 0.6, 2093, 2093, lvl(0.08));
    tone(c, out, 'sine', t, 0.5, 4186, 4186, lvl(0.03));
    burst(c, out, t + 0.2, 0.12, 'lowpass', 400, 200, lvl(0.12), 1, 0.003);
    return 0.6;
  },
};

let registered = false;

/** Register every PW_SOUND_IDS recipe (idempotent). */
export function registerTownSounds(): void {
  if (registered) return;
  registered = true;
  for (const id of PW_SOUND_IDS) registerSound(id, RECIPES[id]);
}
