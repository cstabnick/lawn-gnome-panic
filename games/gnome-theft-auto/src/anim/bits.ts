// Bits of town life (round 3): waiting for the bus, maps, watches, haggling, gossip, acorn counting, hiccups and the
// weather (sweating in the Dust Flats, shivering in the Fells). Axis notes in types.ts.
import type { AnimDef, BitAnimId, Vec3 } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const up = (t: number, d: number, k = 1): number => 0.5 - 0.5 * Math.cos((TAU * k * t) / d);
const cl = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => { const c = cl(x); return c * c * (3 - 2 * c); };
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * cl((t - a) / (b - a)));
const mix = (a: number, b: number, k: number): number => a + (b - a) * k;
const BEHIND: { armL: Vec3; armR: Vec3 } = { armL: [0.4, 0, -0.15], armR: [0.4, 0, 0.15] };

const row = (r: Omit<AnimDef<BitAnimId>, 'category' | 'emote'>): AnimDef<BitAnimId> => ({ category: 'bit', emote: true, ...r });

export const BIT_ANIMS: readonly AnimDef<BitAnimId>[] = [
  row({
    id: 'wait-bus', label: 'Wait Bus', icon: '🚏', duration: 4, loop: true, parts: ['armL', 'armR', 'legR', 'body'],
    pose: (t) => ({ ...BEHIND, legR: [-0.15 * up(t, 4, 4), 0, 0], body: [0, 0.4 * sn(t, 4), 0] }),
  }),
  row({
    id: 'read-map', label: 'Read Map', icon: '🗺️', duration: 3, loop: true, prop: 'folded-map', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.4, 0, -0.25], armR: [-1.4, 0, 0.25], body: [0.15, 0.15 * sn(t, 3), 0.04 * sn(t, 3, 1, 1)] }),
  }),
  row({
    id: 'check-watch', label: 'Watch', icon: '⌚', duration: 1.6, loop: false, parts: ['armL', 'body'],
    pose: (t) => ({ armL: [-1.5, 0, -0.6], body: [0.15 * ease(t / 0.4), 0, 0] }),
  }),
  row({
    id: 'window-shop', label: 'Browse', icon: '🛍️', duration: 4, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ ...BEHIND, body: [0.1, 0.3 * sn(t, 4), 0] }),
  }),
  row({
    id: 'haggle', label: 'Haggle', icon: '🤝', duration: 2, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-1.0, 0, -0.3 + 0.1 * sn(t, 2, 4)], armR: [-1.4 + 0.3 * sn(t, 2, 2), 0, -0.2], body: [0.08, 0.1 * sn(t, 2), 0],
    }),
  }),
  row({
    id: 'argue', label: 'Argue', icon: '🗯️', duration: 1.6, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-1.2 + 0.5 * sn(t, 1.6, 2), 0, 0.4], armR: [-1.2 - 0.5 * sn(t, 1.6, 2), 0, -0.4],
      body: [0.12 + 0.06 * sn(t, 1.6, 4), 0, 0],
    }),
  }),
  row({
    id: 'gossip', label: 'Gossip', icon: '🤭', duration: 3, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0.3, 0, 0.6], armR: [-2.1, 0, 0.4], body: [0.12, 0.08 * sn(t, 3), 0.1] }),
  }),
  row({
    id: 'count-acorns', label: 'Count', icon: '🌰', duration: 2, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.2, 0, -0.3], armR: [-1.2 + 0.15 * sn(t, 2, 6), 0, 0.25], body: [0.25, 0, 0] }),
  }),
  row({
    id: 'tie-shoe', label: 'Tie Shoe', icon: '👟', duration: 3, loop: false, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => {
      const f = 0.1 * Math.sin(t * 12);
      return {
        armL: [-0.7, 0, f], armR: [-0.7, 0, -f], legL: [-1.4, 0, 0], legR: [0.5, 0, 0], body: [0.5, 0, 0], lift: -0.22,
      };
    },
  }),
  row({
    id: 'hiccups', label: 'Hiccups', icon: '😮', duration: 1.5, loop: true, parts: ['armR', 'body'],
    pose: (t) => {
      const hic = Math.max(0, sn(t, 1.5, 2)) ** 8;
      return { armR: [-2.2, 0, 0.5], body: [-0.12 * hic, 0, 0], lift: 0.03 * hic };
    },
  }),
  row({
    id: 'sweat-heat', label: 'Too Hot', icon: '🥵', duration: 2, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.6, 0, -0.4 + 0.2 * sn(t, 2, 4)], armR: [-2.5, 0, 0.6 + 0.25 * sn(t, 2, 2)], body: [0.1, 0, 0] }),
  }),
  row({
    id: 'shiver-fells', label: 'Too Cold', icon: '🥶', duration: 0.8, loop: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-1.1, 0, -0.7], armR: [-1.1, 0, 0.7], legL: [-0.15 * up(t, 0.8), 0, 0], legR: [-0.15 * (1 - up(t, 0.8)), 0, 0],
      body: [0.12, 0, 0.03 * sn(t, 0.8, 4)],
    }),
  }),
  row({
    id: 'dust-hat', label: 'Dust Hat', icon: '🎩', duration: 2, loop: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const lift = ease(t / 0.4) * (1 - ease((t - 0.6) / 0.3));
      const beat = t > 0.9 && t < 1.7 ? 0.25 * Math.sin((t - 0.9) * 18) : 0;
      return { armL: [-0.8, 0, -0.3], armR: [mix(-0.4 + beat, -2.9, lift), 0, -0.2], body: [0.1 * bump(t, 0.8, 1.8), 0, 0] };
    },
  }),
  row({
    id: 'pat-pockets', label: 'Pockets', icon: '👖', duration: 1.6, loop: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const p = 0.15 * Math.sin(t * 14);
      return { armL: [0.05 + p, 0, 0.3], armR: [0.05 - p, 0, -0.3], body: [0.15, 0.2 * Math.sin(t * 4), 0] };
    },
  }),
  row({
    id: 'eat-snack', label: 'Snack', icon: '🥨', duration: 2, loop: true, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-1.6 - 0.6 * up(t, 2, 2), 0, 0.4], body: [0.05, 0, 0] }),
  }),
  row({
    id: 'sip-drink', label: 'Sip', icon: '🥤', duration: 3, loop: true, prop: 'gta-can-cola', parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-1.3 - 0.9 * up(t, 3), 0, 0.4], body: [-0.1 * up(t, 3), 0, 0] }),
  }),
  row({
    id: 'feed-birds', label: 'Feed Birds', icon: '🐦', duration: 2, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.0, 0, -0.3], armR: [-1.0 + 0.4 * sn(t, 2, 2), 0, -0.2], body: [0.3, 0, 0] }),
  }),
  row({
    id: 'sit-bench', label: 'Sit Bench', icon: '🪑', duration: 4, loop: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-1.2, 0, 0.1], armR: [-1.2, 0, -0.1], legL: [-1.57, 0, 0], legR: [-1.57, 0, 0],
      body: [0.05 + 0.02 * sn(t, 4), 0.1 * sn(t, 4), 0], lift: -0.12,
    }),
  }),
];
