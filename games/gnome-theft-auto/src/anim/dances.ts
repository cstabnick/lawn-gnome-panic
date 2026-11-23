// The five dances (DANCE_IDS order). All loop: each pose is built from sin/cos of 2*PI*k*t/duration with whole k,
// so pose(0) and pose(duration) match and the loop wraps seamlessly. Pure: no Math.random, no state.
import type { AnimDef, AnimPose, DanceAnimId } from './types';

const TAU = Math.PI * 2;
/** sin of a whole-number multiple of one cycle. */
const s = (t: number, d: number, k = 1) => Math.sin((TAU * k * t) / d);
/** cos of a whole-number multiple of one cycle. */
const c = (t: number, d: number, k = 1) => Math.cos((TAU * k * t) / d);
const lerp = (a: number, b: number, w: number) => a + (b - a) * w;

// Robot: 8 steps of 0.3 s. Index 7 equals index 0 so the loop wraps without a jump.
const ROBOT_STEP = 0.3;
const ROBOT_ARM_X = [-1.57, -0.9, -1.57, -0.9, -1.57, -0.9, -1.57, -1.57];
const ROBOT_BODY_RY = [0.4, 0.4, -0.4, -0.4, 0.4, 0.4, -0.4, 0.4];

const DANCE_JIG: AnimDef<'dance-jig'> = {
  id: 'dance-jig',
  label: 'Jig',
  icon: '☘️',
  category: 'dance',
  duration: 1.6,
  loop: true,
  parts: ['armL', 'armR', 'legL', 'legR', 'body'],
  emote: true,
  pose(t: number): AnimPose {
    const d = 1.6;
    const kickL = Math.max(0, s(t, d));
    const kickR = Math.max(0, -s(t, d));
    return {
      armL: [0.3, 0, 0.7],
      armR: [0.3, 0, -0.7],
      legL: [-0.8 * kickL, 0, 0],
      legR: [-0.8 * kickR, 0, 0],
      body: [0.04 * c(t, d, 2), 0, 0],
      // Two small hops per cycle.
      lift: 0.12 * Math.abs(s(t, d, 2)),
    };
  },
};

const DANCE_ROBOT: AnimDef<'dance-robot'> = {
  id: 'dance-robot',
  label: 'Robot',
  icon: '🤖',
  category: 'dance',
  duration: 2.4,
  loop: true,
  parts: ['armL', 'armR', 'legL', 'legR', 'body'],
  emote: true,
  pose(t: number): AnimPose {
    const i = Math.min(ROBOT_ARM_X.length - 1, Math.floor(t / ROBOT_STEP));
    return {
      armL: [ROBOT_ARM_X[i], 0, 0],
      armR: [ROBOT_ARM_X[i], 0, 0],
      legL: [0, 0, 0],
      legR: [0, 0, 0],
      body: [0, ROBOT_BODY_RY[i], 0],
    };
  },
};

const DANCE_DISCO: AnimDef<'dance-disco'> = {
  id: 'dance-disco',
  label: 'Disco',
  icon: '🕺',
  category: 'dance',
  duration: 2.0,
  loop: true,
  parts: ['armL', 'armR', 'legL', 'legR', 'body'],
  emote: true,
  pose(t: number): AnimPose {
    const d = 2.0;
    const w = 0.5 + 0.5 * s(t, d); // 1 = arm up-right, 0 = arm across the body
    return {
      armL: [0.3, 0, 0.7],
      armR: [lerp(-0.6, -2.7, w), 0, lerp(0.6, -0.6, w)],
      legL: [0, 0, 0],
      legR: [0, 0, 0],
      body: [0, 0, 0.12 * s(t, d)],
    };
  },
};

const DANCE_FLAIL: AnimDef<'dance-flail'> = {
  id: 'dance-flail',
  label: 'Flail',
  icon: '🙃',
  category: 'dance',
  duration: 1.2,
  loop: true,
  parts: ['armL', 'armR', 'legL', 'legR', 'body'],
  emote: true,
  pose(t: number): AnimPose {
    const d = 1.2;
    return {
      armL: [-1.0 + s(t, d, 2), 0, 1.0 + 0.8 * c(t, d, 3)],
      armR: [-1.0 + s(t, d, 3), 0, -(1.0 + 0.8 * s(t, d, 2))],
      legL: [0, 0, 0],
      legR: [0, 0, 0],
      body: [0, 0.3 * s(t, d, 2), 0.15 * c(t, d, 2)],
      lift: 0.05 * s(t, d, 4),
    };
  },
};

const DANCE_HOP: AnimDef<'dance-hop'> = {
  id: 'dance-hop',
  label: 'Bunny Hop',
  icon: '🐰',
  category: 'dance',
  duration: 1.0,
  loop: true,
  parts: ['armL', 'armR', 'legL', 'legR', 'body'],
  emote: true,
  pose(t: number): AnimPose {
    const d = 1.0;
    return {
      armL: [-1.0, 0, 0.2],
      armR: [-1.0, 0, -0.2],
      legL: [0, 0, 0],
      legR: [0, 0, 0],
      // Two hops per cycle: 0 on the ground at t = 0 and d/2, 0.25 in the air between.
      lift: 0.25 * Math.abs(s(t, d, 2)),
      // Leans 0.1 on each landing, straight in the air.
      body: [0.05 + 0.05 * c(t, d, 2), 0, 0],
    };
  },
};

/** One row per id in DANCE_IDS (types.ts), in that order. */
export const DANCE_ANIMS: readonly AnimDef<DanceAnimId>[] = [DANCE_JIG, DANCE_ROBOT, DANCE_DISCO, DANCE_FLAIL, DANCE_HOP];
