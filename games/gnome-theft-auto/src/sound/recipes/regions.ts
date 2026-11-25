// Region and weather spot sounds for the batch-3 places (ids.ts REGION_SOUNDS). Procedural WebAudio only.
// info.rand: +-15% level variation per play. info.param is not used: these sounds do not change with alarm.
import type { Recipe, RecipeTable, RegionSoundId, SoundInfo } from '../ids';
import { burst, tone } from '../synth';

/** Peak scaled by the per-play random: 0.85..1.15 of `peak`. */
function amp(info: SoundInfo, peak: number): number {
  return peak * (0.85 + 0.3 * info.rand);
}

/** A sawtooth creak through a narrow bandpass; the filter is disconnected with the oscillator. */
function creak(c: AudioContext, out: AudioNode, t: number, dur: number, f0: number, f1: number, peak: number): void {
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 6;
  bp.connect(out);
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.linearRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bp);
  o.start(t);
  o.stop(t + dur + 0.01);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
    bp.disconnect();
  };
}

const surfWash: Recipe = (c, out, t, info) => {
  // Two swells: the filter opens 300 -> 700 Hz, then closes back to 300.
  const p = amp(info, 0.2);
  burst(c, out, t, 1.25, 'lowpass', 300, 700, p, 0.7, 0.4);
  burst(c, out, t + 1.25, 1.25, 'lowpass', 700, 300, p, 0.7, 0.4);
  return 2.5;
};

const buoyBell: Recipe = (c, out, t, info) => {
  const p = amp(info, 0.12);
  tone(c, out, 'sine', t, 2.5, 520, 520, p, 0.003);
  tone(c, out, 'sine', t, 2.5, 1300, 1300, p * 0.45, 0.003);
  return 2.5;
};

const snowCreak: Recipe = (c, out, t, info) => {
  creak(c, out, t, 0.3, 180, 240, amp(info, 0.12));
  return 0.3;
};

const icicleTink: Recipe = (c, out, t, info) => {
  // Two or three high pings, each a little different in pitch.
  const count = info.rand > 0.5 ? 3 : 2;
  const gap = 0.09;
  for (let k = 0; k < count; k++) {
    const f = 4200 - k * 350 - info.rand * 300;
    tone(c, out, 'sine', t + k * gap, 0.12, f, f, amp(info, 0.08), 0.002);
  }
  return (count - 1) * gap + 0.12;
};

const cafeClink: Recipe = (c, out, t, info) => {
  tone(c, out, 'sine', t, 0.35, 2600, 2600, amp(info, 0.1), 0.002);
  tone(c, out, 'sine', t + 0.12, 0.35, 3400, 3400, amp(info, 0.09), 0.002);
  return 0.5;
};

const chapelChime: Recipe = (c, out, t, info) => {
  // Three bell notes falling, half a second apart, each with a quiet overtone.
  const notes = [660, 550, 440];
  notes.forEach((f, k) => {
    const at = t + k * 0.5;
    tone(c, out, 'sine', at, 1.6, f, f, amp(info, 0.14), 0.003);
    tone(c, out, 'sine', at, 1.2, f * 2.4, f * 2.4, amp(info, 0.035), 0.003);
  });
  return 2.6;
};

const grassHiss: Recipe = (c, out, t, info) => {
  burst(c, out, t, 1.2, 'bandpass', 3000, 3000, amp(info, 0.1), 0.8, 0.4);
  return 1.2;
};

const thunderFar: Recipe = (c, out, t, info) => {
  burst(c, out, t, 2.8, 'lowpass', 160, 60, amp(info, 0.3), 0.7, 0.5);
  tone(c, out, 'sine', t, 2.8, 55, 40, amp(info, 0.18), 0.6);
  return 2.8;
};

const campusBell: Recipe = (c, out, t, info) => {
  tone(c, out, 'sine', t, 3, 330, 330, amp(info, 0.2), 0.003);
  tone(c, out, 'sine', t, 2, 830, 830, amp(info, 0.07), 0.003);
  return 3;
};

/** A geared motor: a square wave gliding f0 -> f1 through a lowpass; the filter is disconnected with the oscillator. */
function whirr(c: AudioContext, out: AudioNode, t: number, dur: number, f0: number, f1: number, peak: number): void {
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  lp.connect(out);
  const o = c.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.linearRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.15);
  g.gain.setValueAtTime(peak, t + dur - 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(lp);
  o.start(t);
  o.stop(t + dur + 0.01);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
    lp.disconnect();
  };
}

const turbineWhoosh: Recipe = (c, out, t, info) => {
  // A slow swell as the vane comes round, the band falling 500 -> 180 Hz, and a faint hum under it.
  const p = amp(info, 0.22);
  burst(c, out, t, 1.6, 'lowpass', 500, 180, p, 0.7, 0.5);
  tone(c, out, 'sine', t, 1.6, 70, 70, amp(info, 0.02), 0.3);
  return 1.6;
};

const antSkitter: Recipe = (c, out, t, info) => {
  // Twenty-five tiny ticks at irregular gaps (a fixed pattern, shifted per play by info.rand).
  let at = 0;
  let seed = Math.floor(info.rand * 4096) + 1;
  for (let k = 0; k < 25; k++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = seed / 0x7fffffff;
    burst(c, out, t + at, 0.02, 'highpass', 5000, 5000, amp(info, 0.05), 1.2, 0.001);
    at += 0.03 + r * 0.02;
  }
  return 1.25;
};

const telescopeWhirr: Recipe = (c, out, t, info) => {
  // The dome motor and the telescope slewing (90 -> 140 Hz), then a soft clunk as it stops.
  whirr(c, out, t, 1.9, 90, 140, amp(info, 0.08));
  tone(c, out, 'sine', t + 1.9, 0.25, 60, 40, amp(info, 0.2), 0.003);
  return 2.2;
};

const weldCrackle: Recipe = (c, out, t, info) => {
  // Five crackling arc bursts of filtered noise, uneven in length and level, under the Underspan.
  let at = 0;
  let seed = Math.floor(info.rand * 4096) + 7;
  for (let k = 0; k < 5; k++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = seed / 0x7fffffff;
    burst(c, out, t + at, 0.07 + r * 0.05, 'bandpass', 2400 + r * 1200, 1800 + r * 900, amp(info, 0.14), 2, 0.002);
    at += 0.12 + r * 0.06;
  }
  return 0.8;
};

const pedalWhirr: Recipe = (c, out, t, info) => {
  // A bicycle dynamo: the pitch rises then falls back, with a slight wobble from the wheel.
  const dur = 1;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(180, t);
  o.frequency.linearRampToValueAtTime(320, t + dur * 0.5);
  o.frequency.linearRampToValueAtTime(190, t + dur);
  const wob = c.createOscillator();
  wob.frequency.value = 9;
  const wobGain = c.createGain();
  wobGain.gain.value = 6;
  wob.connect(wobGain).connect(o.frequency);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  lp.connect(out);
  const g = c.createGain();
  const peak = amp(info, 0.1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.15);
  g.gain.setValueAtTime(peak, t + dur - 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(lp);
  o.start(t);
  wob.start(t);
  o.stop(t + dur + 0.01);
  wob.stop(t + dur + 0.01);
  o.onended = () => {
    o.disconnect();
    wob.disconnect();
    wobGain.disconnect();
    g.disconnect();
    lp.disconnect();
  };
  return dur;
};

const reedRustle: Recipe = (c, out, t, info) => {
  // Wind through reeds: a soft band-passed swell that opens and closes.
  burst(c, out, t, 0.8, 'bandpass', 1200, 2200, amp(info, 0.14), 1.2, 0.3);
  return 0.8;
};

const flockHum: Recipe = (c, out, t, info) => {
  // A quiet two-note hum of several voices: a sine pair near 140 and 210 Hz with slow vibrato.
  const dur = 1.6;
  const notes = [140, 210];
  notes.forEach((f, k) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f * (1 + info.rand * 0.01 * (k + 1));
    const vib = c.createOscillator();
    vib.frequency.value = 4.5;
    const vibGain = c.createGain();
    vibGain.gain.value = f * 0.012;
    vib.connect(vibGain).connect(o.frequency);
    const g = c.createGain();
    const peak = amp(info, k === 0 ? 0.09 : 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.35);
    g.gain.setValueAtTime(peak, t + dur - 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    vib.start(t);
    o.stop(t + dur + 0.01);
    vib.stop(t + dur + 0.01);
    o.onended = () => {
      o.disconnect();
      vib.disconnect();
      vibGain.disconnect();
      g.disconnect();
    };
  });
  return dur;
};

const soilCrumble: Recipe = (c, out, t, info) => {
  // A dry low crumble of noise with a few small ticks on top, the digging of a spade.
  burst(c, out, t, 0.5, 'lowpass', 500, 250, amp(info, 0.18), 0.8, 0.01);
  for (let k = 0; k < 3; k++) {
    burst(c, out, t + 0.05 + k * 0.13, 0.02, 'highpass', 3500, 3500, amp(info, 0.05), 1.2, 0.001);
  }
  return 0.5;
};

const lampWhoomp: Recipe = (c, out, t, info) => {
  // A soft thump as the lamp catches, then a brief bright flicker of noise.
  tone(c, out, 'sine', t, 0.4, 110, 50, amp(info, 0.25), 0.005);
  burst(c, out, t + 0.04, 0.12, 'highpass', 2500, 1500, amp(info, 0.06), 1, 0.002);
  return 0.4;
};

const moleSqueak: Recipe = (c, out, t, info) => {
  // A tiny polite squeak: a short sine chirp rising high.
  tone(c, out, 'sine', t, 0.15, 2200 + info.rand * 300, 3400, amp(info, 0.07), 0.005);
  return 0.15;
};

const burrowDrip: Recipe = (c, out, t, info) => {
  // One water drip (a falling chirp) with a little cave echo.
  const f = 1800 + info.rand * 300;
  tone(c, out, 'sine', t, 0.08, f, f * 0.55, amp(info, 0.14), 0.002);
  tone(c, out, 'sine', t + 0.25, 0.07, f * 0.8, f * 0.45, amp(info, 0.05), 0.002);
  return 0.35;
};

const sprinklerTick: Recipe = (c, out, t, info) => {
  // Ten ticks of the sprinkler arm, then a soft hiss.
  for (let k = 0; k < 10; k++) {
    burst(c, out, t + k * 0.09, 0.03, 'highpass', 3000, 3000, amp(info, 0.12));
  }
  burst(c, out, t + 0.9, 1, 'highpass', 4000, 4000, amp(info, 0.04), 1, 0.2);
  return 1.9;
};

export const REGION_RECIPES: RecipeTable<RegionSoundId> = {
  'surf-wash': surfWash,
  'buoy-bell': buoyBell,
  'snow-creak': snowCreak,
  'icicle-tink': icicleTink,
  'cafe-clink': cafeClink,
  'chapel-chime': chapelChime,
  'grass-hiss': grassHiss,
  'thunder-far': thunderFar,
  'campus-bell': campusBell,
  'sprinkler-tick': sprinklerTick,
  'turbine-whoosh': turbineWhoosh,
  'ant-skitter': antSkitter,
  'telescope-whirr': telescopeWhirr,
  'weld-crackle': weldCrackle,
  'pedal-whirr': pedalWhirr,
  'reed-rustle': reedRustle,
  'flock-hum': flockHum,
  'soil-crumble': soilCrumble,
  'lamp-whoomp': lampWhoomp,
  'mole-squeak': moleSqueak,
  'burrow-drip': burrowDrip,
};
