// Hunting and fishing (batch 2): stalking, slingshot and spear, skinning, tracking, casting and reeling. Axis notes in types.ts.
import type { AnimDef, HuntAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const cs = (t: number, d: number, k = 1): number => Math.cos((TAU * k * t) / d);
const cl = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => { const c = cl(x); return c * c * (3 - 2 * c); };
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * cl((t - a) / (b - a)));
/** Linear blend from a to b as k goes 0..1. */
const mix = (a: number, b: number, k: number): number => a + (b - a) * k;

const row = (r: Omit<AnimDef<HuntAnimId>, 'category' | 'emote'>): AnimDef<HuntAnimId> => ({ category: 'hunt', emote: true, ...r });

export const HUNT_ANIMS: readonly AnimDef<HuntAnimId>[] = [
  row({
    id: 'crouch-stalk', label: 'Stalk', icon: '🐾', duration: 1.6, loop: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-0.8, 0, 0.3], armR: [-0.8, 0, -0.3],
      legL: [-0.7 - 0.2 * sn(t, 1.6), 0, 0], legR: [-0.7 + 0.2 * sn(t, 1.6), 0, 0],
      body: [0.4, 0, 0.03 * sn(t, 1.6)], lift: -0.15,
    }),
  }),
  row({
    id: 'crouch-aim', label: 'Crouch Aim', icon: '🎯', duration: 2.0, loop: true, prop: 'twig-slingshot', parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-1.57, 0, -0.15], armR: [-1.57, 0, 0.15], legL: [-1.4, 0, 0], legR: [0.6, 0, 0],
      body: [0.1, 0.02 * sn(t, 2), 0], lift: -0.2,
    }),
  }),
  row({
    id: 'slingshot-draw', label: 'Slingshot', icon: '🪃', duration: 1.6, loop: false, prop: 'twig-slingshot', parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const draw = ease(t / 1.0) * (t < 1.2 ? 1 : Math.exp(-(t - 1.2) * 12));
      return { armL: [-1.57, 0, -0.1], armR: [mix(-1.57, -2.0, draw), 0, mix(0.2, 0.6, draw)], body: [0, 0.2, 0] };
    },
  }),
  row({
    id: 'spear-ready', label: 'Spear Ready', icon: '🔱', duration: 2.0, loop: true, prop: 'royal-spear', parts: ['armL', 'armR', 'legL', 'body'],
    pose: (t) => ({ armL: [-1.4, 0, 0.2], armR: [-2.6, 0, -0.4], legL: [-0.4, 0, 0], body: [0.03 * sn(t, 2), 0.3, 0] }),
  }),
  row({
    id: 'spear-throw', label: 'Spear Throw', icon: '🎯', duration: 1.2, loop: false, prop: 'royal-spear', parts: ['armL', 'armR', 'legL', 'body'],
    pose: (t) => {
      const back = ease(t / 0.4);
      const whip = ease((t - 0.4) / 0.25);
      return {
        armL: [-1.4, 0, 0.2], armR: [mix(mix(-2.0, -2.8, back), -1.2, whip), 0, -0.3],
        legL: [-0.5 * whip, 0, 0], body: [0.2 * whip, mix(0.5 * back, -0.3, whip), 0],
      };
    },
  }),
  row({
    id: 'skin', label: 'Skin', icon: '🔪', duration: 1.4, loop: true, prop: 'thorn-dagger', parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-1.0, 0, -0.2], armR: [-0.9 + 0.25 * sn(t, 1.4, 3), 0, 0.1], legL: [-1.3, 0, 0.1], legR: [-1.3, 0, -0.1],
      body: [0.45, 0, 0], lift: -0.22,
    }),
  }),
  row({
    id: 'track-ground', label: 'Track', icon: '👣', duration: 3.0, loop: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-0.6, 0, 0.2], armR: [-1.0, 0, -0.1], legL: [-1.1, 0, 0.1], legR: [-1.1, 0, -0.1],
      body: [0.55, 0.25 * sn(t, 3), 0], lift: -0.2,
    }),
  }),
  row({
    id: 'fish-cast', label: 'Cast', icon: '🎣', duration: 1.4, loop: false, prop: 'fishing-rod', parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const back = ease(t / 0.5);
      const flick = ease((t - 0.5) / 0.25);
      return { armL: [-1.5, 0, -0.3], armR: [mix(mix(-1.3, -2.9, back), -1.3, flick), 0, 0], body: [mix(-0.1 * back, 0.15, flick), 0, 0] };
    },
  }),
  row({
    id: 'fish-reel', label: 'Reel In', icon: '🎣', duration: 1.0, loop: true, prop: 'fishing-rod', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.2 + 0.2 * sn(t, 1, 2), 0, -0.35 + 0.2 * cs(t, 1, 2)], armR: [-1.7, 0, 0], body: [-0.1, 0, 0] }),
  }),
  row({
    id: 'fish-catch', label: 'Big Catch', icon: '🐟', duration: 2.0, loop: false, prop: 'fishing-rod', parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const up = ease(t / 0.8);
      return { armL: [mix(-1.5, -2.7, up), 0, 0.4 * up], armR: [mix(-1.6, -2.9, up), 0, 0], body: [-0.15 * up, 0, 0], lift: 0.12 * bump(t, 0.8, 1.2) };
    },
  }),
  row({
    id: 'lasso-twirl', label: 'Lasso', icon: '🤠', duration: 0.8, loop: true, prop: 'lasso-sling', parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.0, 0, 0.1], armR: [-2.7 + 0.15 * sn(t, 0.8), 0, -0.3 + 0.25 * cs(t, 0.8)], body: [0, 0.1 * sn(t, 0.8), 0] }),
  }),
  row({
    id: 'bird-call', label: 'Bird Call', icon: '🐦', duration: 2.4, loop: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.2, 0, -0.5], armR: [-2.2, 0, 0.5],
      body: [-0.1 - 0.05 * (bump(t, 0.6, 0.9) + bump(t, 1.1, 1.4) + bump(t, 1.6, 1.9)), 0, 0],
    }),
  }),
];
