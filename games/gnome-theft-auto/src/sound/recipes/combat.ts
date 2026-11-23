// NPC and police gunfire, explosions, ricochets. Near shots are crisp (crack + body); far shots lose the crack and
// gain a dull thump with an echo tail, so distant gunfire reads as distant without a separate sample.
import type { CombatSoundId, Recipe, RecipeTable, SoundInfo } from '../ids';
import { burst, tone } from '../synth';

/** Distance (metres) where a shot counts as fully far. */
const FAR_M = 150;
/** Below this far amount a shot is "near" (full crack). */
const NEAR = 0.3;
/** Echo copies start at these offsets (seconds), each half as loud as the one before. */
const ECHO_GAPS = [0.18, 0.42, 0.7];
/** Silence margin added to every returned duration (nodes stop 0.01 s after their own end). */
const EPS = 0.02;

type Thump = (t: number, peak: number) => void;

function farOf(info: SoundInfo): number {
  return Math.min(1, info.dist / FAR_M);
}

/** +-6% pitch per play. */
function pitchOf(info: SoundInfo): number {
  return 1 + (info.rand * 2 - 1) * 0.06;
}

/** One dull thump: a tone gliding f0 -> f1 plus a little lowpassed noise, so the echoes are darker than the crack. */
function thumpAt(
  c: AudioContext, out: AudioNode, t: number, peak: number,
  type: OscillatorType, f0: number, f1: number, dur: number,
): void {
  tone(c, out, type, t, dur, f0, f1, peak);
  burst(c, out, t, dur * 0.8, 'lowpass', 500, 200, peak * 0.4, 0.7);
}

/**
 * Far echo tail: 3 quieter copies of the thump at +0.18, +0.42, +0.7 s (each ~0.5x the previous). Scaled by distance;
 * nothing is added when near. Returns the total duration including the tail.
 */
function echoTail(far: number, peak: number, thumpDur: number, thump: Thump, gapScale = 1): number {
  let end = thumpDur;
  if (far < NEAR) return end;
  let pk = peak * far;
  for (const gap0 of ECHO_GAPS) {
    const gap = gap0 * gapScale;
    pk *= 0.5;
    thump(gap, pk);
    end = Math.max(end, gap + thumpDur);
  }
  return end;
}

const gunPistol: Recipe = (c, out, t, info) => {
  const far = farOf(info);
  const p = pitchOf(info);
  const dur = 0.1;
  burst(c, out, t, 0.03, 'highpass', 3000 * p, 3000 * p, far < NEAR ? 0.35 : 0.06, 1, 0.001);
  thumpAt(c, out, t, 0.4, 'sine', 140 * p, 50 * p, dur);
  const end = echoTail(far, 0.4, dur, (at, pk) => thumpAt(c, out, t + at, pk, 'sine', 140 * p, 50 * p, dur));
  return end + EPS;
};

const gunShotgun: Recipe = (c, out, t, info) => {
  const far = farOf(info);
  const p = pitchOf(info);
  const dur = 0.25;
  burst(c, out, t, dur, 'lowpass', 1400 * p, 350 * p, far < NEAR ? 0.4 : 0.15, 0.7, 0.002);
  tone(c, out, 'sine', t, 0.2, 90 * p, 35 * p, far < NEAR ? 0.4 : 0.2);
  const end = echoTail(far, 0.4, dur, (at, pk) => thumpAt(c, out, t + at, pk, 'sine', 90 * p, 35 * p, 0.2), 1.4);
  return end + EPS;
};

const gunHoa: Recipe = (c, out, t, info) => {
  const far = farOf(info);
  const p = pitchOf(info);
  const dur = 0.07;
  burst(c, out, t, 0.04, 'bandpass', 2600 * p, 2600 * p, 0.35, 1.5, 0.002);
  tone(c, out, 'triangle', t, dur, 180 * p, 65 * p, 0.35);
  const end = echoTail(far, 0.35, dur, (at, pk) => thumpAt(c, out, t + at, pk, 'triangle', 180 * p, 65 * p, dur));
  return end + EPS;
};

const explosion: Recipe = (c, out, t, info) => {
  const far = farOf(info);
  const p = pitchOf(info);
  burst(c, out, t, 0.9, 'lowpass', 1800 * p, 90 * p, 0.45, 0.8, 0.005);
  tone(c, out, 'sine', t, 0.8, 70 * p, 22 * p, 0.4);
  let end = 0.9;
  if (far >= NEAR) {
    // Distant blasts roll on as a low rumble.
    burst(c, out, t, 1.4, 'lowpass', 300, 300, 0.35 * far, 0.7, 0.15);
    end = 1.4;
  }
  return end + EPS;
};

const ricochet: Recipe = (c, out, t, info) => {
  const p = pitchOf(info);
  burst(c, out, t, 0.02, 'highpass', 4000, 4000, 0.25, 1, 0.001);
  tone(c, out, 'sine', t, 0.25, 2600 * p, 900 * p, 0.3);
  return 0.25 + EPS;
};

const bulletWhiz: Recipe = (c, out, t, info) => {
  const p = pitchOf(info);
  burst(c, out, t, 0.18, 'bandpass', 3000 * p, 900 * p, 0.25, 4, 0.02);
  return 0.18 + EPS;
};

export const COMBAT_RECIPES: RecipeTable<CombatSoundId> = {
  'gun-pistol': gunPistol,
  'gun-shotgun': gunShotgun,
  'gun-hoa': gunHoa,
  explosion,
  ricochet,
  'bullet-whiz': bulletWhiz,
};
