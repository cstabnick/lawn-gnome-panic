// More reactions (batch 2): weather, dodging vehicles, falls and recoveries. Axis notes in types.ts.
import type { AnimDef, ReactBAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const cl = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => { const c = cl(x); return c * c * (3 - 2 * c); };
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * cl((t - a) / (b - a)));

const row = (r: Omit<AnimDef<ReactBAnimId>, 'category'>): AnimDef<ReactBAnimId> => ({ category: 'react', ...r });

/** A dive to one side: s = -1 to its left, +1 to its right. */
const dodge = (s: number) => (t: number) => {
  const b = bump(t, 0, 0.9);
  return {
    armL: [-0.4 * b, 0, 1.0 * b] as [number, number, number],
    armR: [-0.4 * b, 0, -1.0 * b] as [number, number, number],
    legL: [0, 0, s > 0 ? 0.5 * b : 0] as [number, number, number],
    legR: [0, 0, s < 0 ? -0.5 * b : 0] as [number, number, number],
    body: [0, 0, 0.45 * s * b] as [number, number, number],
    lift: 0.15 * bump(t, 0, 0.6),
  };
};

export const REACT_B_ANIMS: readonly AnimDef<ReactBAnimId>[] = [
  row({
    id: 'shiver-cold', label: 'Shiver', icon: '🥶', duration: 0.5, loop: true, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.1, 0, -0.7], armR: [-1.1, 0, 0.7], body: [0.12, 0, 0.03 * sn(t, 0.5, 2)] }),
  }),
  row({
    id: 'shield-rain', label: 'Rain Hands', icon: '🌧️', duration: 1.0, loop: true, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-2.9, 0, -0.5], armR: [-2.9, 0, 0.5], body: [0.2 + 0.03 * sn(t, 1, 2), 0, 0] }),
  }),
  row({
    id: 'shade-sun', label: 'Shade Eyes', icon: '😎', duration: 3.0, loop: true, emote: true, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.3, 0, 0.6], body: [0.03, 0.3 * sn(t, 3), 0] }),
  }),
  row({
    id: 'duck-cover', label: 'Duck', icon: '🫣', duration: 1.2, loop: true, emote: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-2.6, 0, -0.4], armR: [-2.6, 0, 0.4], legL: [-1.2, 0, 0.1], legR: [-1.2, 0, -0.1],
      body: [0.5, 0, 0.025 * sn(t, 1.2, 6)], lift: -0.18,
    }),
  }),
  row({
    id: 'jump-back', label: 'Jump Back', icon: '😮', duration: 0.9, loop: false, emote: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.2, 0, 0.6], armR: [-2.2, 0, -0.6], body: [-0.25 * Math.exp(-t * 4), 0, 0], lift: 0.25 * bump(t, 0, 0.5),
    }),
  }),
  row({ id: 'dodge-left', label: 'Dodge Left', icon: '↩️', duration: 0.9, loop: false, emote: false, parts: ['armL', 'armR', 'legL', 'legR', 'body'], pose: dodge(-1) }),
  row({ id: 'dodge-right', label: 'Dodge Right', icon: '↪️', duration: 0.9, loop: false, emote: false, parts: ['armL', 'armR', 'legL', 'legR', 'body'], pose: dodge(1) }),
  row({
    id: 'fall-forward', label: 'Faceplant', icon: '🤕', duration: 1.6, loop: false, emote: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => {
      const k = ease(t / 0.5);
      const fling = bump(t, 0, 0.9);
      return {
        armL: [-2.8 * fling - 2.4 * k * (1 - fling), 0, 0.3], armR: [-2.8 * fling - 2.4 * k * (1 - fling), 0, -0.3],
        legL: [0.5 * bump(t, 0.1, 1.0), 0, 0], legR: [0.4 * bump(t, 0.15, 1.1), 0, 0],
        body: [1.57 * k, 0, 0], lift: 0.24 * k,
      };
    },
  }),
  row({
    id: 'limp', label: 'Limp', icon: '🦵', duration: 1.2, loop: true, emote: false, parts: ['legR', 'body'],
    pose: (t) => ({ legR: [-0.05 + 0.15 * sn(t, 1.2), 0, 0], body: [0.1, 0, 0.1 * sn(t, 1.2, 2)] }),
  }),
  row({
    id: 'dust-off', label: 'Dust Off', icon: '🧹', duration: 1.6, loop: false, emote: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const a = Math.sin((TAU * 2 * t) / 1.6);
      return { armL: [-0.55 + 0.25 * a, 0, -0.4 * Math.max(0, a)], armR: [-0.55 - 0.25 * a, 0, 0.4 * Math.max(0, -a)], body: [0.2, 0, 0] };
    },
  }),
  row({
    id: 'hurt-arm', label: 'Hurt Arm', icon: '🤕', duration: 2.0, loop: true, emote: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.0, 0, -0.8], armR: [0.1, 0, -0.1], body: [0.085 + 0.035 * sn(t, 2), 0, 0.06] }),
  }),
  row({
    id: 'gasp', label: 'Gasp', icon: '😲', duration: 1.0, loop: false, emote: true, parts: ['armL', 'armR', 'body'],
    pose: () => ({ armL: [-2.4, 0, -0.55], armR: [-2.4, 0, 0.55], body: [-0.15, 0, 0] }),
  }),
  row({
    id: 'cough-smoke', label: 'Cough', icon: '😷', duration: 1.2, loop: true, emote: false, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.2, 0, 0.5], body: [0.225 - 0.125 * Math.cos((TAU * 2 * t) / 1.2), 0, 0] }),
  }),
  row({
    id: 'sneeze', label: 'Sneeze', icon: '🤧', duration: 1.4, loop: false, emote: true, parts: ['armR', 'body'],
    pose: (t) => {
      const wind = -0.25 * ease(t / 0.7);
      const snap = t < 0.7 ? wind : t < 0.85 ? -0.25 + 0.65 * ease((t - 0.7) / 0.15) : 0.4 * Math.exp(-(t - 0.85) * 5);
      return { armR: [-2.3, 0, 0.5], body: [snap, 0, 0] };
    },
  }),
];
