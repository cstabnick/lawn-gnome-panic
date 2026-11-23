// Footsteps by surface, splashes, shop bells, doors, crowds, event stingers. Procedural WebAudio only.
import type { Recipe, RecipeTable, SoundInfo, StepSoundId, WorldOnlySoundId } from '../ids';
import { burst, env, tone, voiced } from '../synth';

/** Pitch variation of +-12% from info.rand (+-8% is too little for clay feet, +-12% for steps). */
function pitch(info: SoundInfo, f: number, spread = 0.12): number {
  return f * (1 + (info.rand * 2 - 1) * spread);
}

/** Level: scaled by info.param (0.5 walk -> 0.9x, 1 run -> 1.2x), capped at a footstep-quiet 0.3. */
function level(info: SoundInfo, base: number): number {
  return Math.min(0.3, base * (0.6 + 0.6 * info.param));
}

/** Footsteps are short, so they all end with the same tail budget. */
const STEP_DUR = 0.16;

const stepAsphalt: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.03, 'highpass', pitch(info, 2500), pitch(info, 2500), level(info, 0.2));
  tone(c, out, 'sine', t, 0.04, pitch(info, 180), pitch(info, 120), level(info, 0.2));
  return 0.06;
};

const stepIce: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.02, 'highpass', pitch(info, 4500), pitch(info, 4500), level(info, 0.15));
  tone(c, out, 'sine', t, 0.03, pitch(info, 1800), pitch(info, 1800), level(info, 0.05));
  return 0.06;
};

const stepSnow: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.12, 'bandpass', pitch(info, 1200), pitch(info, 700), level(info, 0.2), 2, 0.02);
  return 0.13;
};

const stepSand: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.1, 'lowpass', pitch(info, 1400), pitch(info, 1400), level(info, 0.18), 1, 0.02);
  return 0.11;
};

const stepMud: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.12, 'lowpass', pitch(info, 600), pitch(info, 250), level(info, 0.2));
  tone(c, out, 'sine', t, 0.12, pitch(info, 120), pitch(info, 70), level(info, 0.12));
  return 0.13;
};

const stepGrass: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.08, 'bandpass', pitch(info, 2500), pitch(info, 1600), level(info, 0.15));
  return 0.09;
};

const stepFarm: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.08, 'bandpass', pitch(info, 1800), pitch(info, 1100), level(info, 0.15));
  return 0.09;
};

const stepRock: Recipe = (c, out, t, info) => {
  tone(c, out, 'sine', t, 0.05, pitch(info, 240), pitch(info, 150), level(info, 0.2));
  burst(c, out, t, 0.015, 'highpass', pitch(info, 3500), pitch(info, 3500), level(info, 0.08));
  return 0.07;
};

const stepDirt: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.06, 'lowpass', pitch(info, 900), pitch(info, 900), level(info, 0.18));
  tone(c, out, 'sine', t, 0.06, pitch(info, 140), pitch(info, 90), level(info, 0.1));
  return 0.07;
};

const stepGravel: Recipe = (c, out, t, info) => {
  // Three tiny clicks inside 0.05 s.
  for (let i = 0; i < 3; i++) {
    burst(c, out, t + i * 0.018, 0.012, 'bandpass', pitch(info, 3000 + i * 700), pitch(info, 3000 + i * 700),
      level(info, 0.15), 3);
  }
  return 0.07;
};

const stepWater: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.15, 'lowpass', pitch(info, 1800), pitch(info, 500), level(info, 0.2), 1, 0.03);
  tone(c, out, 'sine', t, 0.15, pitch(info, 300), pitch(info, 180), level(info, 0.1));
  return STEP_DUR;
};

// World one-shots.

const splashSmall: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.35, 'lowpass', pitch(info, 2800), pitch(info, 500), 0.35);
  tone(c, out, 'sine', t, 0.2, pitch(info, 280), pitch(info, 140), 0.2);
  return 0.36;
};

const splashBig: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.9, 'lowpass', pitch(info, 2000), pitch(info, 200), 0.4 * (0.7 + 0.6 * info.param));
  tone(c, out, 'sine', t, 0.9, pitch(info, 140), pitch(info, 50), 0.25);
  // Four droplets over 0.6 s after the splash.
  for (let i = 0; i < 4; i++) {
    const f = pitch(info, 900 + i * 200);
    tone(c, out, 'sine', t + 0.1 + i * 0.15, 0.04, f, f * 1.3, 0.12);
  }
  return 1.0;
};

const shopBell: Recipe = (c, out, t, info) => {
  // Two strikes 0.18 s apart, each a 1.2 s ring with partials 1320 (fundamental), 2640 and 1980.
  for (const at of [t, t + 0.18]) {
    tone(c, out, 'sine', at, 1.2, pitch(info, 1320, 0.02), pitch(info, 1320, 0.02), 0.18);
    tone(c, out, 'sine', at, 1.2, pitch(info, 2640, 0.02), pitch(info, 2640, 0.02), 0.08);
    tone(c, out, 'sine', at, 1.2, pitch(info, 1980, 0.02), pitch(info, 1980, 0.02), 0.06);
  }
  return 1.4;
};

const doorCreak: Recipe = (c, out, t, info) => {
  // Sawtooth 180 -> 260 -> 200 Hz through a bandpass 900 Q 6, with fast vibrato (rate 25, depth 5%).
  const f0 = pitch(info, 180);
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * 1.44, t + 0.3);
  o.frequency.exponentialRampToValueAtTime(f0 * 1.11, t + 0.6);
  const lfo = c.createOscillator();
  lfo.frequency.value = 25;
  const lfoG = c.createGain();
  lfoG.gain.value = f0 * 0.05;
  lfo.connect(lfoG).connect(o.frequency);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 6;
  const g = c.createGain();
  env(g, level(info, 0.15), t, 0.6, 0.05);
  o.connect(bp).connect(g).connect(out);
  o.start(t);
  lfo.start(t);
  o.stop(t + 0.61);
  lfo.stop(t + 0.61);
  o.onended = () => {
    o.disconnect();
    lfo.disconnect();
    lfoG.disconnect();
    bp.disconnect();
    g.disconnect();
  };
  return 0.62;
};

const cash: Recipe = (c, out, t, info) => {
  // "ka" clunk, then "ching": two bell partials 2600 and 3900.
  burst(c, out, t, 0.05, 'bandpass', pitch(info, 1200), pitch(info, 800), 0.3, 2);
  tone(c, out, 'sine', t + 0.08, 0.5, pitch(info, 2600), pitch(info, 2600), 0.15);
  tone(c, out, 'sine', t + 0.12, 0.45, pitch(info, 3900), pitch(info, 3900), 0.1);
  return 0.6;
};

const eventStart: Recipe = (c, out, t, info) => {
  // Bright rising stinger C5 E5 G5, 0.12 s apart, over a soft whoosh.
  const notes = [523.25, 659.26, 783.99];
  notes.forEach((f, i) => tone(c, out, 'triangle', t + i * 0.12, 0.2, pitch(info, f, 0.02), pitch(info, f, 0.02), 0.2));
  burst(c, out, t, 0.4, 'bandpass', 400, 1600, level(info, 0.4), 1, 0.1);
  return 0.5;
};

const eventEnd: Recipe = (c, out, t, info) => {
  // Resolving stinger G5 E5 C6, the last note held longer.
  const notes: [number, number][] = [[783.99, 0.14], [659.26, 0.14], [1046.5, 0.6]];
  let at = t;
  for (const [f, dur] of notes) {
    tone(c, out, 'triangle', at, dur, pitch(info, f, 0.02), pitch(info, f, 0.02), 0.2);
    at += 0.12;
  }
  return 0.85;
};

const crowdCheer: Recipe = (c, out, t, info) => {
  // Seven sawtooth "ahh"s from 200 to 500 Hz with vibrato, over a bandpass noise bed.
  for (let i = 0; i < 7; i++) {
    const f0 = pitch(info, 200 + i * 50, 0.05);
    voiced(c, out, 'sawtooth', t + i * 0.02, 1.2, f0, f0 * 1.2, level(info, 0.05), 5 + i * 0.3, 0.04, 1400, 0.3);
  }
  burst(c, out, t, 1.2, 'bandpass', 1500, 1500, level(info, 0.12), 0.8, 0.4);
  return 1.3;
};

const crowdMurmur: Recipe = (c, out, t, info) => {
  // Low indistinct chatter: a bandpass bed plus four short voiced blips at random times.
  burst(c, out, t, 1.6, 'bandpass', 500, 500, level(info, 0.1), 1.5, 0.3);
  for (let i = 0; i < 4; i++) {
    const at = t + Math.random() * 1.4;
    const f0 = pitch(info, 150 + Math.random() * 150, 0.05);
    voiced(c, out, 'sawtooth', at, 0.12, f0, f0 * 0.9, level(info, 0.05), 15, 0.03, 600, 0.02);
  }
  return 1.6;
};

const smashWood: Recipe = (c, out, t, info) => {
  // Crack, then the splinter tail.
  burst(c, out, t, 0.24, 'bandpass', pitch(info, 1600), pitch(info, 300), level(info, 0.3), 1);
  tone(c, out, 'triangle', t, 0.24, pitch(info, 160), pitch(info, 45), level(info, 0.2));
  return 0.26;
};

const smashGlass: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.3, 'highpass', pitch(info, 6000), pitch(info, 3500), level(info, 0.25), 1, 0.002);
  // Five tinkles over 0.4 s.
  for (let i = 0; i < 5; i++) {
    tone(c, out, 'sine', t + i * 0.08, 0.05, pitch(info, 3000 + i * 750), pitch(info, 3000 + i * 750), 0.1);
  }
  return 0.4;
};

const metalClang: Recipe = (c, out, t, info) => {
  // Inharmonic ring (520, 1310, 2150 Hz) decaying over 0.8 s, with a highpass tick at the start.
  tone(c, out, 'sine', t, 0.8, pitch(info, 520), pitch(info, 520), 0.2, 0.002);
  tone(c, out, 'sine', t, 0.8, pitch(info, 1310), pitch(info, 1310), 0.1, 0.002);
  tone(c, out, 'sine', t, 0.8, pitch(info, 2150), pitch(info, 2150), 0.05, 0.002);
  burst(c, out, t, 0.02, 'highpass', 5000, 5000, 0.15);
  return 0.82;
};

const windGust: Recipe = (c, out, t, info) => {
  // Two 1 s sweeps: 300 -> 900 Hz gusting up, then 900 -> 400 Hz falling away. 2 s, quiet.
  burst(c, out, t, 1.0, 'bandpass', 300, 900, level(info, 0.1), 1, 0.4);
  burst(c, out, t + 1.0, 1.0, 'bandpass', 900, 400, level(info, 0.08), 1, 0.05);
  return 2.0;
};

const waterLap: Recipe = (c, out, t, info) => {
  burst(c, out, t, 0.4, 'lowpass', pitch(info, 700), pitch(info, 300), level(info, 0.18), 1, 0.1);
  tone(c, out, 'sine', t, 0.4, pitch(info, 200), pitch(info, 150), 0.06, 0.1);
  return 0.42;
};

const bellToll: Recipe = (c, out, t, info) => {
  // Town clock bell: partials 220, 440, 563 and 880 Hz with a 3 s decay.
  tone(c, out, 'sine', t, 3, pitch(info, 220, 0.02), pitch(info, 220, 0.02), 0.2, 0.002);
  tone(c, out, 'sine', t, 3, pitch(info, 440, 0.02), pitch(info, 440, 0.02), 0.08, 0.002);
  tone(c, out, 'sine', t, 3, pitch(info, 563, 0.02), pitch(info, 563, 0.02), 0.04, 0.002);
  tone(c, out, 'sine', t, 3, pitch(info, 880, 0.02), pitch(info, 880, 0.02), 0.02, 0.002);
  return 3.1;
};

export const WORLD_RECIPES: RecipeTable<StepSoundId | WorldOnlySoundId> = {
  'step-asphalt': stepAsphalt,
  'step-ice': stepIce,
  'step-snow': stepSnow,
  'step-sand': stepSand,
  'step-mud': stepMud,
  'step-grass': stepGrass,
  'step-farm': stepFarm,
  'step-rock': stepRock,
  'step-dirt': stepDirt,
  'step-gravel': stepGravel,
  'step-water': stepWater,
  'splash-small': splashSmall,
  'splash-big': splashBig,
  'shop-bell': shopBell,
  'door-creak': doorCreak,
  cash,
  'event-start': eventStart,
  'event-end': eventEnd,
  'crowd-cheer': crowdCheer,
  'crowd-murmur': crowdMurmur,
  'smash-wood': smashWood,
  'smash-glass': smashGlass,
  'metal-clang': metalClang,
  'wind-gust': windGust,
  'water-lap': waterLap,
  'bell-toll': bellToll,
};
