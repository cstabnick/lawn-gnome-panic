// Reactions: fear, pain and falls. One AnimDef per id in REACT_IDS (types.ts), in that order.
import type { AnimDef, ReactAnimId, Vec3 } from './types';

const TAU = Math.PI * 2;
/** sin over k whole cycles of a d-second loop. */
const s = (t: number, d: number, k = 1): number => Math.sin((TAU * k * t) / d);
/** cos over k whole cycles of a d-second loop. */
const c = (t: number, d: number, k = 1): number => Math.cos((TAU * k * t) / d);
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
/** Smoothstep: 0 -> 1 with eased ends. */
const ease = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
/** A single hump that is 0 outside [a, b] and peaks at the middle. */
const bump = (t: number, a: number, b: number): number =>
  t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a));
/** Eased interpolation from a to b over [t0, t1], held at the ends. */
const seg = (t: number, t0: number, t1: number, a: number, b: number): number =>
  a + (b - a) * ease((t - t0) / (t1 - t0));

export const REACT_ANIMS: readonly AnimDef<ReactAnimId>[] = [
  {
    id: 'cower',
    label: 'Cower',
    icon: '😨',
    category: 'react',
    duration: 1.2,
    loop: true,
    parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    emote: true,
    pose(t: number) {
      const shake = 0.03 * s(t, 1.2, 12); // 10 Hz over one 1.2 s cycle
      return {
        armL: [-2.6, 0, -0.4] as Vec3,
        armR: [-2.6, 0, 0.4] as Vec3,
        legL: [-0.6, 0, 0] as Vec3,
        legR: [-0.6, 0, 0] as Vec3,
        body: [0.35, 0, shake] as Vec3,
        lift: -0.12,
      };
    },
  },
  {
    id: 'panic',
    label: 'Panic',
    icon: '😱',
    category: 'react',
    duration: 0.6,
    loop: true,
    parts: ['armL', 'armR'],
    emote: false,
    pose(t: number) {
      // Arms only: it plays while the gnome runs away.
      return {
        armL: [-2.6 + 0.4 * s(t, 0.6), 0, 0.5 * s(t, 0.6)] as Vec3,
        armR: [-2.6 + 0.4 * c(t, 0.6), 0, -0.5 * c(t, 0.6)] as Vec3,
      };
    },
  },
  {
    id: 'stumble',
    label: 'Stumble',
    icon: '🥴',
    category: 'react',
    duration: 1.0,
    loop: false,
    parts: ['armL', 'armR', 'legL', 'body'],
    emote: false,
    pose(t: number) {
      const h = Math.sin((Math.PI * t) / 1.0); // 0 -> 1 -> 0 over the trip
      return {
        armL: [-1.8 * h, 0, 0.6 * h] as Vec3,
        armR: [-1.8 * h, 0, -0.6 * h] as Vec3,
        legL: [0.6 * h, 0, 0] as Vec3,
        body: [0.5 * h, 0, 0] as Vec3,
      };
    },
  },
  {
    id: 'hurt',
    label: 'Hurt',
    icon: '🤕',
    category: 'react',
    duration: 1.4,
    loop: false,
    parts: ['armL', 'armR', 'body'],
    emote: false,
    pose(t: number) {
      return {
        armL: [-0.9, 0, -0.6] as Vec3,
        armR: [0.2, 0, 0] as Vec3,
        body: [0.4 * (1 - ease(t / 1.4)), 0, 0] as Vec3,
      };
    },
  },
  {
    id: 'knockdown',
    label: 'Knockdown',
    icon: '💫',
    category: 'react',
    duration: 1.6,
    loop: false,
    parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    emote: true,
    pose(t: number) {
      const p = clamp01(t / 0.5);
      const fall = p * p; // ease in over the first 0.5 s
      return {
        armL: [-2.6 * bump(t, 0, 0.7), 0, 1.0 * ease(t / 0.6)] as Vec3,
        armR: [-2.6 * bump(t, 0, 0.7), 0, -1.0 * ease(t / 0.6)] as Vec3,
        legL: [-0.6 * bump(t, 0, 0.6), 0, 0] as Vec3,
        legR: [-0.6 * bump(t, 0, 0.6), 0, 0] as Vec3,
        body: [-1.57 * fall, 0, 0] as Vec3,
        lift: 0.24 * fall,
      };
    },
  },
  {
    id: 'get-up',
    label: 'Get Up',
    icon: '🧎',
    category: 'react',
    duration: 1.4,
    loop: false,
    parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    emote: false,
    pose(t: number) {
      // Lying -> sitting (0 to 0.5 s) -> standing (0.5 to 1.4 s).
      const up = t < 0.5;
      const rx = up ? seg(t, 0, 0.5, -1.57, -0.2) : seg(t, 0.5, 1.4, -0.2, 0);
      const lift = up ? seg(t, 0, 0.5, 0.24, -0.26) : seg(t, 0.5, 1.4, -0.26, 0);
      const leg = up ? seg(t, 0, 0.5, 0, -1.57) : seg(t, 0.5, 1.4, -1.57, 0);
      const push = 0.8 * bump(t, 0.1, 0.8); // arms push off the ground
      const settle = 1 - ease(t / 1.0);
      return {
        armL: [push, 0, 1.0 * settle] as Vec3,
        armR: [push, 0, -1.0 * settle] as Vec3,
        legL: [leg, 0, 0] as Vec3,
        legR: [leg, 0, 0] as Vec3,
        body: [rx, 0, 0] as Vec3,
        lift,
      };
    },
  },
  {
    id: 'dizzy',
    label: 'Dizzy',
    icon: '\u{1F635}‍\u{1F4AB}',
    category: 'react',
    duration: 2.0,
    loop: true,
    parts: ['armL', 'armR', 'body'],
    emote: true,
    pose(t: number) {
      return {
        armL: [0.2 * s(t, 2.0), 0, 0.5] as Vec3,
        armR: [0.2 * c(t, 2.0), 0, -0.5] as Vec3,
        body: [0.12 * s(t, 2.0), 0, 0.12 * c(t, 2.0)] as Vec3,
      };
    },
  },
  {
    id: 'flinch',
    label: 'Flinch',
    icon: '😖',
    category: 'react',
    duration: 0.8,
    loop: false,
    parts: ['armL', 'armR', 'body'],
    emote: false,
    pose(t: number) {
      return {
        armL: [-1.9, 0, -0.3] as Vec3,
        armR: [-1.9, 0, 0.3] as Vec3,
        body: [-0.28 * Math.exp(-t / 0.2), 0, 0] as Vec3,
      };
    },
  },
];
