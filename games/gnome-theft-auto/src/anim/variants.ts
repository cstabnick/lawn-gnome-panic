// Batch 3 (E09, L63): variants of the most-seen animations (types.ts VARIANT_IDS): plain walks, panicked runs, the
// player's standing fidgets, horn startles and cheers. Axis notes in types.ts.
import type { AnimDef, AnimPose, VariantAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const cl = (x: number): number => Math.min(1, Math.max(0, x));
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * cl((t - a) / (b - a)));
/** A whole turn in radians, folded into [-PI, PI]: the same orientation, so the shared pose checks stay sane. */
const turn = (t: number, d: number): number => {
  const a = TAU * (t / d);
  return a > Math.PI ? a - TAU : a;
};

const style = (r: Omit<AnimDef<VariantAnimId>, 'category' | 'loop' | 'emote' | 'onMove' | 'parts'>
  & { pose: (t: number) => AnimPose }): AnimDef<VariantAnimId> => ({
  category: 'style', loop: true, emote: false, onMove: true, parts: ['armL', 'armR', 'body'], ...r,
});
const bit = (r: Omit<AnimDef<VariantAnimId>, 'category' | 'loop' | 'emote'>): AnimDef<VariantAnimId> => ({
  category: 'bit', loop: false, emote: false, ...r,
});
const react = (r: Omit<AnimDef<VariantAnimId>, 'category' | 'loop' | 'emote'>): AnimDef<VariantAnimId> => ({
  category: 'react', loop: false, emote: false, ...r,
});

export const VARIANT_ANIMS: readonly AnimDef<VariantAnimId>[] = [
  style({
    id: 'walk-easy', label: 'Easy Stroll', icon: '🚶', duration: 1.2,
    pose: (t) => ({
      armL: [0.1, 0, 0.15 + 0.04 * sn(t, 1.2)], armR: [0.1, 0, -0.15 - 0.04 * sn(t, 1.2)], body: [0, 0, 0.04 * sn(t, 1.2)],
    }),
  }),
  style({
    id: 'walk-brisk', label: 'Brisk Walk', icon: '👟', duration: 0.9,
    pose: (t) => ({
      armL: [-0.25 - 0.1 * sn(t, 0.9), 0, 0.05], armR: [-0.25 + 0.1 * sn(t, 0.9), 0, -0.05], body: [0.08, 0, 0],
    }),
  }),
  style({
    id: 'walk-amble', label: 'Amble', icon: '🧺', duration: 1.6,
    pose: (t) => ({ armL: [0.5, 0, 0.05], armR: [0.5, 0, -0.05], body: [0, 0.06 * sn(t, 1.6), 0] }),
  }),
  style({
    id: 'run-cover-head', label: 'Cover Head', icon: '🪖', duration: 0.6,
    pose: (t) => ({ armL: [-2.6, 0, -0.4], armR: [-2.6, 0, 0.4], body: [0.2, 0, 0.03 * sn(t, 0.6)] }),
  }),
  style({
    id: 'run-look-back', label: 'Look Back', icon: '👀', duration: 0.8,
    pose: (t) => ({
      armL: [-0.5 + 0.3 * sn(t, 0.8), 0, 0.05], armR: [-0.5 - 0.3 * sn(t, 0.8), 0, -0.05], body: [0.15, 0.35 * sn(t, 0.8), 0],
    }),
  }),
  style({
    id: 'run-arms-up', label: 'Arms Up', icon: '🙌', duration: 0.5,
    pose: (t) => ({ armL: [-2.8 + 0.3 * sn(t, 0.5), 0, 0.1], armR: [-2.8 - 0.3 * sn(t, 0.5), 0, -0.1], body: [0.05, 0, 0] }),
  }),

  bit({
    id: 'idle-weight-shift', label: 'Weight Shift', icon: '⚖️', duration: 2.2, parts: ['body'],
    pose: (t) => ({ body: [0, 0, 0.12 * bump(t, 0, 2.2)], lift: -0.03 * bump(t, 0, 2.2) }),
  }),
  bit({
    id: 'idle-hat-adjust', label: 'Hat Tip', icon: '🎩', duration: 1.6, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.4 * bump(t, 0, 1.6), 0, -0.3 * bump(t, 0, 1.6)], body: [0.05 * bump(t, 0, 1.6), 0, 0] }),
  }),
  bit({
    id: 'idle-look-back', label: 'Glance Back', icon: '🔙', duration: 2.0, parts: ['body'],
    pose: (t) => ({ body: [0, 0.6 * bump(t, 0, 2.0), 0] }),
  }),

  react({
    id: 'startle-hop', label: 'Hop!', icon: '😲', duration: 0.9, parts: ['armL', 'armR'],
    pose: (t) => ({
      armL: [-0.4 * bump(t, 0, 0.9), 0, 1.4 * bump(t, 0, 0.9)],
      armR: [-0.4 * bump(t, 0, 0.9), 0, -1.4 * bump(t, 0, 0.9)],
      lift: 0.25 * bump(t, 0, 0.9),
    }),
  }),
  react({
    id: 'startle-spin', label: 'Spin Round', icon: '🌀', duration: 1.0, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-0.2, 0, 1.3], armR: [-0.2, 0, -1.3], body: [0, turn(t, 1.0), 0] }),
  }),
  react({
    id: 'fist-wave-both', label: 'Fists Up', icon: '✊', duration: 1.4, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.5 + 0.2 * sn(t, 1.4, 4), 0, 0.2], armR: [-2.5 + 0.2 * sn(t, 1.4, 4, Math.PI), 0, -0.2], body: [-0.05, 0, 0],
    }),
  }),
  react({
    id: 'stomp-off', label: 'Stomp Off', icon: '😤', duration: 1.2, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [0.15, 0, 0.2 * bump(t, 0, 1.2)], armR: [0.15, 0, -0.2 * bump(t, 0, 1.2)],
      body: [0.25 * bump(t, 0, 1.2), 0, 0], lift: -0.04 * (0.5 - 0.5 * Math.cos((TAU * 4 * t) / 1.2)),
    }),
  }),
  react({
    id: 'cheer-jump', label: 'Jump Cheer', icon: '🎉', duration: 1.2, parts: ['armL', 'armR'],
    pose: (t) => ({
      armL: [-2.8, 0, 0.2], armR: [-2.8, 0, -0.2], lift: 0.3 * Math.max(0, sn(t, 1.2, 2)),
    }),
  }),
  react({
    id: 'cheer-whistle', label: 'Whistle', icon: '😗', duration: 1.4, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.2 + 0.3 * sn(t, 1.4, 2), 0, 0.5], armR: [-1.9, 0, 0.1], body: [-0.05, 0, 0],
    }),
  }),
];
