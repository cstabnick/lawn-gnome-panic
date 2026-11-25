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
};
