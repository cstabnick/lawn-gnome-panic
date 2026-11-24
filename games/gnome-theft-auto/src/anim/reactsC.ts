// Reactions to the world's sights (round 3): aircraft flyovers and banner planes, birds, a fish caught or lost, combing a
// hunting tuft, gawping at the skyway view, phones, a low pass, a race, a horn, a snapshot. Axis notes in types.ts.
import type { AnimDef, ReactCAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const cl = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => { const c = cl(x); return c * c * (3 - 2 * c); };
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * cl((t - a) / (b - a)));
const mix = (a: number, b: number, k: number): number => a + (b - a) * k;

const row = (r: Omit<AnimDef<ReactCAnimId>, 'category'>): AnimDef<ReactCAnimId> => ({ category: 'react', ...r });

export const REACT_C_ANIMS: readonly AnimDef<ReactCAnimId>[] = [
  row({
    id: 'look-up-flyover', label: 'Look Up', icon: '🚁', duration: 3, loop: false, emote: true, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.6 * bump(t, 0.8, 2.4), 0, -0.2], body: [-0.35, mix(0.6, -0.6, ease(t / 3)), 0] }),
  }),
  row({
    id: 'wave-banner-plane', label: 'Wave Plane', icon: '✈️', duration: 1.6, loop: true, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.8, 0, 0.3 + 0.4 * sn(t, 1.6, 2, Math.PI)], armR: [-2.8, 0, -0.3 + 0.4 * sn(t, 1.6, 2)], body: [-0.3, 0, 0],
    }),
  }),
  row({
    id: 'spot-bird', label: 'Spot Bird', icon: '🐦', duration: 2, loop: false, emote: true, parts: ['armL', 'armR', 'body'],
    pose: () => ({ armL: [-2.3, 0, -0.6], armR: [-2.2, 0, -0.1], body: [-0.2, 0.2, 0] }),
  }),
  row({
    id: 'fish-triumph', label: 'Got One!', icon: '🐟', duration: 2.4, loop: false, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.9, 0, 0.2], armR: [-2.9, 0, -0.2], body: [-0.15, 0, 0],
      lift: 0.12 * (bump(t, 0.4, 0.9) + bump(t, 1.1, 1.6)),
    }),
  }),
  row({
    id: 'fish-sulk', label: 'Bad Luck', icon: '😩', duration: 2.4, loop: false, emote: true, parts: ['armL', 'armR', 'legR', 'body'],
    pose: (t) => ({ armL: [0.1, 0, 0.05], armR: [0.1, 0, -0.05], legR: [-0.4 * bump(t, 1.4, 1.9), 0, 0], body: [0.35, 0, 0.08] }),
  }),
  row({
    id: 'tuft-comb', label: 'Comb Tuft', icon: '🪶', duration: 2, loop: true, emote: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-0.9, 0, -0.2], armR: [-0.8 + 0.3 * sn(t, 2, 2), 0, 0.1], legL: [-1.3, 0, 0.1], legR: [-1.3, 0, -0.1],
      body: [0.4, 0, 0], lift: -0.22,
    }),
  }),
  row({
    id: 'gawk-view', label: 'Gawk', icon: '🏞️', duration: 4, loop: true, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0.3, 0, -0.1], armR: [0.3, 0, 0.1], body: [-0.1, 0.5 * sn(t, 4), 0.04 * sn(t, 4, 2)] }),
  }),
  row({
    id: 'answer-phone', label: 'Answer', icon: '📱', duration: 2, loop: false, emote: true, prop: 'tin-can-phone', parts: ['armR', 'body'],
    pose: (t) => {
      const k = ease(t / 0.6);
      return { armR: [mix(0.1, -2.5, k), 0, 0.65 * k], body: [0, 0.15 * k, 0] };
    },
  }),
  row({
    id: 'duck-low-plane', label: 'Duck!', icon: '🛩️', duration: 1.4, loop: false, emote: false, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => {
      const b = bump(t, 0, 1.4);
      return {
        armL: [-2.6 * b, 0, -0.4 * b], armR: [-2.6 * b, 0, 0.4 * b], legL: [-1.0 * b, 0, 0], legR: [-1.0 * b, 0, 0],
        body: [0.5 * b, 0, 0], lift: -0.2 * b,
      };
    },
  }),
  row({
    id: 'cheer-race', label: 'Race Fan', icon: '🏁', duration: 1, loop: true, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.6 + 0.3 * sn(t, 1, 2), 0, 0.3], armR: [-2.6 - 0.3 * sn(t, 1, 2), 0, -0.3], body: [-0.08, 0, 0],
      lift: 0.04 * (0.5 - 0.5 * Math.cos(TAU * 2 * t)),
    }),
  }),
  row({
    id: 'startle-horn', label: 'Startled', icon: '📯', duration: 0.9, loop: false, emote: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const b = bump(t, 0, 0.9);
      return { armL: [-1.6 * b, 0, 1.2 * b], armR: [-1.6 * b, 0, -1.2 * b], body: [-0.3 * Math.exp(-t * 4), 0, 0], lift: 0.2 * bump(t, 0, 0.4) };
    },
  }),
  row({
    id: 'photo-snap', label: 'Snapshot', icon: '📸', duration: 2, loop: false, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const k = ease(t / 0.4) * (1 - ease((t - 1.6) / 0.4));
      return { armL: [-2.0 * k, 0, -0.45 * k], armR: [-2.0 * k, 0, 0.45 * k], body: [0.05 * bump(t, 1.1, 1.3), 0, 0] };
    },
  }),
];
