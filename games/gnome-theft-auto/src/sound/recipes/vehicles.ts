// Other vehicles' one-shots: crashes, tyre squeal, horns, sirens.
import type { RecipeTable, VehicleSoundId } from '../ids';
import { burst, tone, voiced } from '../synth';

/** Per-play pitch multiplier: +-8% from info.rand. */
const pitch = (rand: number): number => 0.92 + rand * 0.16;

export const VEHICLE_RECIPES: RecipeTable<VehicleSoundId> = {
  'crash-light': (c, out, t, info) => {
    const p = pitch(info.rand);
    tone(c, out, 'sine', t, 0.18, 120 * p, 45 * p, 0.3);
    burst(c, out, t, 0.15, 'bandpass', 1800, 600, 0.15, 2);
    return 0.25;
  },

  'crash-heavy': (c, out, t, info) => {
    const p = pitch(info.rand);
    const k = 0.6 + 0.4 * info.param;
    tone(c, out, 'sine', t, 0.5, 80 * p, 28 * p, 0.4 * k);
    burst(c, out, t, 0.45, 'lowpass', 2500, 200, 0.25 * k);
    for (const dt of [0.06, 0.13, 0.22]) {
      burst(c, out, t + dt, 0.04, 'highpass', 4000, 4000, 0.12 * k);
    }
    return 0.6;
  },

  'tyre-squeal': (c, out, t, info) => {
    const dur = 0.35 + 0.4 * info.param;
    burst(c, out, t, dur, 'bandpass', 1500, 1100, 0.3, 8);
    tone(c, out, 'triangle', t, dur, 900 * pitch(info.rand), 820, 0.06);
    return dur;
  },

  'horn-car': (c, out, t, info) => {
    const p = pitch(info.rand);
    voiced(c, out, 'sawtooth', t, 0.28, 440 * p, 440 * p, 0.2, 6, 0.01, 1800, 0.01);
    voiced(c, out, 'sawtooth', t, 0.28, 554 * p, 554 * p, 0.2, 6, 0.01, 1800, 0.01);
    return 0.28;
  },

  'horn-truck': (c, out, t, info) => {
    const p = pitch(info.rand);
    voiced(c, out, 'sawtooth', t, 0.6, 115 * p, 115 * p, 0.2, 5, 0.005, 700, 0.01);
    voiced(c, out, 'sawtooth', t, 0.6, 145 * p, 145 * p, 0.2, 5, 0.005, 700, 0.01);
    return 0.6;
  },

  'horn-bike': (c, out, t, info) => {
    const p = pitch(info.rand);
    for (const dt of [0, 0.14]) {
      tone(c, out, 'sine', t + dt, 0.12, 2100 * p, 2100 * p, 0.3);
      tone(c, out, 'triangle', t + dt, 0.12, 3150 * p, 3150 * p, 0.12);
    }
    return 0.28;
  },

  'horn-boat': (c, out, t, info) => {
    const p = pitch(info.rand);
    voiced(c, out, 'sawtooth', t, 1.6, 90 * p, 90 * p, 0.2, 3, 0.01, 500, 0.12);
    voiced(c, out, 'square', t, 1.6, 92 * p, 92 * p, 0.12, 3, 0.01, 500, 0.12);
    return 1.6;
  },

  'horn-hoa': (c, out, t) => {
    tone(c, out, 'square', t, 0.1, 920, 920, 0.2);
    tone(c, out, 'square', t + 0.1, 0.1, 680, 680, 0.2);
    return 0.2;
  },

  'siren-whoop': (c, out, t, info) => {
    const k = 0.6 + 0.4 * info.param;
    tone(c, out, 'triangle', t, 0.35, 500, 1400, 0.3 * k, 0.01);
    tone(c, out, 'triangle', t + 0.35, 0.35, 1400, 600, 0.3 * k, 0.01);
    tone(c, out, 'sine', t, 0.7, 500, 600, 0.1 * k, 0.01);
    return 0.7;
  },

  backfire: (c, out, t, info) => {
    const p = pitch(info.rand);
    burst(c, out, t, 0.03, 'highpass', 3000, 3000, 0.4, 0.7);
    tone(c, out, 'sine', t, 0.12, 90 * p, 40 * p, 0.35);
    return 0.12;
  },

  'engine-start': (c, out, t, info) => {
    const p = pitch(info.rand);
    for (let i = 0; i < 3; i++) {
      tone(c, out, 'square', t + i * 0.09, 0.06, 60 * p, 80 * p, 0.15, 0.002);
    }
    voiced(c, out, 'sawtooth', t + 0.3, 0.6, 50 * p, 90 * p, 0.2, 8, 0.01, 900, 0.05);
    return 0.9;
  },

  'door-slam': (c, out, t, info) => {
    const p = pitch(info.rand);
    tone(c, out, 'sine', t, 0.2, 150 * p, 50 * p, 0.35);
    burst(c, out, t + 0.05, 0.02, 'bandpass', 3500, 3500, 0.2, 2);
    return 0.2;
  },

  'brake-hiss': (c, out, t) => {
    burst(c, out, t, 0.5, 'highpass', 3000, 3000, 0.25, 1, 0.01);
    return 0.5;
  },
};
