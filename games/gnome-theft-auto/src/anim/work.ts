// The working poses: a gnome doing a job with a prop in its right hand. Every row loops, is listed in the emote menu,
// and holds its prop (the animator attaches it to armR). Poses are pure functions of t; loops use whole-number cycles.
import type { AnimDef, WorkAnimId } from './types';

const TAU = Math.PI * 2;
const s = (t: number, d: number, k = 1) => Math.sin((TAU * k * t) / d);
const c = (t: number, d: number, k = 1) => Math.cos((TAU * k * t) / d);
/** 0 at t = 0, 1 at half a cycle, back to 0 at the end: one smooth stroke per cycle. */
const stroke = (t: number, d: number) => 0.5 - 0.5 * c(t, d);

/** One row per id in WORK_IDS (types.ts), in that order. */
export const WORK_ANIMS: readonly AnimDef<WorkAnimId>[] = [
  {
    id: 'fish', label: 'Fish', icon: '🎣', category: 'work', duration: 4.0, loop: true, emote: true,
    prop: 'fishing-rod', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armR: [-1.2 + 0.1 * s(t, 4.0), 0, 0],
      armL: [-1.0, 0, -0.3],
      body: [0.05, 0, 0],
    }),
  },
  {
    id: 'dig', label: 'Dig', icon: '⛏️', category: 'work', duration: 1.4, loop: true, emote: true,
    prop: 'dibber', parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const k = stroke(t, 1.4);
      return {
        armL: [-0.6 - 0.5 * k, 0, 0],
        armR: [-0.6 - 0.5 * k, 0, 0],
        body: [0.15 + 0.3 * k, 0, 0],
      };
    },
  },
  {
    id: 'sweep', label: 'Sweep', icon: '🧹', category: 'work', duration: 1.2, loop: true, emote: true,
    prop: 'broom', parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const sw = s(t, 1.2);
      return {
        armL: [-0.7, 0, 0.4 * sw],
        armR: [-0.7, 0, 0.4 * sw],
        body: [0, 0.2 * sw, 0],
      };
    },
  },
  {
    id: 'saw', label: 'Saw', icon: '🪚', category: 'work', duration: 0.8, loop: true, emote: true,
    prop: 'hand-saw', parts: ['armR', 'body'],
    pose: (t) => ({
      armR: [-1.0 + 0.35 * s(t, 0.8), 0, 0],
      body: [0.25, 0, 0],
    }),
  },
  {
    id: 'rake', label: 'Rake', icon: '🍂', category: 'work', duration: 1.6, loop: true, emote: true,
    prop: 'hand-rake', parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const r = stroke(t, 1.6);
      return {
        armL: [-0.6 - 0.8 * r, 0, 0],
        armR: [-0.6 - 0.8 * r, 0, 0],
        body: [0.1 + 0.2 * r, 0, 0],
      };
    },
  },
  {
    id: 'water', label: 'Water', icon: '🪴', category: 'work', duration: 3.0, loop: true, emote: true,
    prop: 'watering-can', parts: ['armR', 'body'],
    pose: (t) => ({
      armR: [-1.1, 0.3 * s(t, 3.0), 0],
      body: [0.12, 0, 0],
    }),
  },
  {
    id: 'read', label: 'Read', icon: '📖', category: 'work', duration: 3.0, loop: true, emote: true,
    prop: 'red-book', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-1.5, 0, -0.25 + 0.3 * stroke(t, 3.0)],
      armR: [-1.5, 0, 0.25],
      body: [0.12, 0, 0],
    }),
  },
];
