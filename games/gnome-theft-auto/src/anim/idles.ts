// The idle animations: what a townsgnome does while standing about, sitting or sleeping between walks.
import type { AnimDef, IdleAnimId } from './types';

const TAU = Math.PI * 2;
/** sin with k cycles per d seconds (whole k, so loops wrap). */
const s = (t: number, d: number, k = 1): number => Math.sin((TAU * k * t) / d);
/** cos with k cycles per d seconds. */
const c = (t: number, d: number, k = 1): number => Math.cos((TAU * k * t) / d);
/** Smoothstep, clamped to 0..1. */
const ease = (x: number): number => {
  const y = Math.min(1, Math.max(0, x));
  return y * y * (3 - 2 * y);
};
/** Eases in over `rise` seconds and out over the last `fall` seconds of a one-shot of length `d`. */
const env = (t: number, d: number, rise: number, fall: number): number => ease(t / rise) * ease((d - t) / fall);
/** A sine squashed so it holds near its peaks (+-1). */
const plat = (v: number): number => Math.tanh(3 * v) / Math.tanh(3);

/** One row per id in IDLE_IDS (types.ts), in that order. */
export const IDLE_ANIMS: readonly AnimDef<IdleAnimId>[] = [
  {
    id: 'look-around', label: 'Look Around', icon: '👀', category: 'idle', duration: 4.0, loop: true,
    parts: ['body'], emote: false,
    pose: (t) => ({ body: [0, 0.5 * plat(s(t, 4)), 0] }),
  },
  {
    id: 'stretch', label: 'Stretch', icon: '🙆', category: 'idle', duration: 2.6, loop: false,
    parts: ['armL', 'armR', 'body'], emote: true,
    pose: (t) => {
      const m = env(t, 2.6, 0.8, 0.6);
      return { armL: [-2.9 * m, 0, 0.15 * m], armR: [-2.9 * m, 0, -0.15 * m], body: [-0.15 * m, 0, 0] };
    },
  },
  {
    id: 'yawn', label: 'Yawn', icon: '🥱', category: 'idle', duration: 2.4, loop: false,
    parts: ['armR', 'body'], emote: true,
    pose: (t) => {
      const m = env(t, 2.4, 0.7, 0.5);
      const back = -0.1 * Math.sin(Math.PI * Math.min(1, t / 1.4));
      const sag = 0.2 * ease((t - 1.2) / 1.0);
      return { armR: [-2.2 * m, 0, 0.45 * m], body: [back + sag, 0, 0] };
    },
  },
  {
    id: 'scratch-head', label: 'Scratch Head', icon: '🤔', category: 'idle', duration: 2.0, loop: false,
    parts: ['armR', 'body'], emote: true,
    pose: (t) => {
      const m = env(t, 2.0, 0.4, 0.4);
      return { armR: [-2.8 * m, 0, 0.6 * m + 0.1 * m * s(t, 1, 5)], body: [0, 0, 0.06 * m] };
    },
  },
  {
    id: 'tap-foot', label: 'Tap Foot', icon: '🦶', category: 'idle', duration: 1.0, loop: true,
    parts: ['armL', 'armR', 'legR'], emote: true,
    pose: (t) => ({
      armL: [0.3, 0, 0.7], armR: [0.3, 0, -0.7],
      legR: [-0.125 * (1 - c(t, 1, 2)), 0, 0],
    }),
  },
  {
    // Label shortened from "Hands On Hips" (13 characters) to fit the 12-character limit.
    id: 'hands-on-hips', label: 'Hands Hips', icon: '🧍', category: 'idle', duration: 3.0, loop: true,
    parts: ['armL', 'armR', 'body'], emote: true,
    pose: (t) => ({
      armL: [0.3, 0, 0.7], armR: [0.3, 0, -0.7],
      body: [0.015 * (1 + s(t, 3)), 0, 0],
    }),
  },
  {
    id: 'cross-arms', label: 'Cross Arms', icon: '🙅', category: 'idle', duration: 3.0, loop: true,
    parts: ['armL', 'armR', 'body'], emote: true,
    pose: (t) => ({
      armL: [-1.3, 0, -0.8], armR: [-1.3, 0, 0.8],
      body: [0, 0.08 * s(t, 3), 0],
    }),
  },
  {
    id: 'sit-ground', label: 'Sit', icon: '🪑', category: 'idle', duration: 4.0, loop: true,
    parts: ['armL', 'armR', 'legL', 'legR', 'body'], emote: true,
    pose: (t) => ({
      armL: [0.5, 0, 0.15], armR: [0.5, 0, -0.15],
      legL: [-1.57, 0, 0], legR: [-1.57, 0, 0],
      body: [-0.1 + 0.02 * s(t, 4), 0, 0],
      lift: -0.26,
    }),
  },
  {
    id: 'sleep', label: 'Sleep', icon: '😴', category: 'idle', duration: 4.0, loop: true,
    parts: ['armL', 'armR', 'legL', 'legR', 'body'], emote: true,
    pose: (t) => ({
      armL: [0, 0, 0.2], armR: [0, 0, -0.2],
      legL: [0, 0, 0], legR: [0, 0, 0],
      body: [-1.57 + 0.02 * s(t, 4), 0, 0],
      lift: 0.24,
    }),
  },
  {
    id: 'lean-back', label: 'Lean Back', icon: '😎', category: 'idle', duration: 3.0, loop: true,
    parts: ['armL', 'armR', 'legR', 'body'], emote: true,
    pose: (t) => ({
      armL: [0.5, 0, 0.15], armR: [0.5, 0, -0.15],
      legR: [-0.2, 0, 0.25],
      body: [-0.12 + 0.01 * s(t, 3), 0, 0],
    }),
  },
  {
    id: 'think', label: 'Think', icon: '💭', category: 'idle', duration: 3.0, loop: true,
    parts: ['armL', 'armR', 'body'], emote: true,
    pose: (t) => ({
      armL: [-0.9, 0, -0.7], armR: [-2.1, 0, 0.75],
      body: [0.06 + 0.02 * s(t, 3), 0, 0],
    }),
  },
];
