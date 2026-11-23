// More emotes (batch 2): kisses, air guitar, nods and tantrums. Axis notes in types.ts.
import type { AnimDef, EmoteBAnimId } from './types';

const TAU = Math.PI * 2;
/** sin of k whole cycles over d seconds (loops wrap cleanly). */
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const cl = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => { const c = cl(x); return c * c * (3 - 2 * c); };
/** 0 -> 1 -> 0 between a and b seconds. */
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * cl((t - a) / (b - a)));

const row = (r: Omit<AnimDef<EmoteBAnimId>, 'category' | 'emote'>): AnimDef<EmoteBAnimId> => ({ category: 'emote', emote: true, ...r });

export const EMOTE_B_ANIMS: readonly AnimDef<EmoteBAnimId>[] = [
  row({
    id: 'blow-kiss', label: 'Blow Kiss', icon: '😘', duration: 1.4, loop: false, parts: ['armR', 'body'],
    pose: (t) => {
      const k = ease((t - 0.6) / 0.35);
      return { armR: [-2.4 + 0.8 * k, 0, 0.5 - 1.1 * k], body: [0.08 * bump(t, 0.5, 1.2), 0, 0] };
    },
  }),
  row({
    id: 'air-guitar', label: 'Air Guitar', icon: '🎸', duration: 1.6, loop: true, parts: ['armL', 'armR', 'body', 'legL'],
    pose: (t) => ({
      armL: [-1.2, 0, 0.6], armR: [-0.9, 0, 0.3 * sn(t, 1.6, 4)],
      body: [0.15 + 0.08 * sn(t, 1.6, 2), 0, 0], legL: [-0.25, 0, 0.05],
    }),
  }),
  row({
    id: 'raise-roof', label: 'Raise Roof', icon: '🙌', duration: 1.2, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const p = -2.65 - 0.25 * sn(t, 1.2, 2);
      return { armL: [p, 0, 0.4], armR: [p, 0, -0.4], body: [0.05 * sn(t, 1.2, 2), 0, 0] };
    },
  }),
  row({
    id: 'slow-clap', label: 'Slow Clap', icon: '👏', duration: 2.4, loop: true, parts: ['armL', 'armR'],
    pose: (t) => {
      const z = 0.25 + 0.2 * Math.cos((TAU * 2 * t) / 2.4);
      return { armL: [-1.3, 0, -z], armR: [-1.3, 0, z] };
    },
  }),
  row({
    id: 'peace', label: 'Peace', icon: '✌️', duration: 1.4, loop: false, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.6, 0, -0.25 + 0.05 * Math.sin(t * 8)], body: [0, 0, -0.08] }),
  }),
  row({
    id: 'nope', label: 'Nope', icon: '🙅', duration: 1.4, loop: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.8, 0, -0.6], armR: [-1.8, 0, 0.6], body: [0, 0.25 * Math.sin((TAU * 3 * t) / 1.4), 0] }),
  }),
  row({
    id: 'yes-nod', label: 'Nod Yes', icon: '🙂', duration: 1.2, loop: false, parts: ['body'],
    pose: (t) => ({ body: [0.075 - 0.075 * Math.cos((TAU * 3 * t) / 1.2), 0, 0] }),
  }),
  row({
    id: 'headbang', label: 'Headbang', icon: '🤘', duration: 0.8, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0, 0, 0.05], armR: [-2.6, 0, -0.3], body: [0.175 - 0.175 * Math.cos((TAU * 2 * t) / 0.8), 0, 0] }),
  }),
  row({
    id: 'call-me', label: 'Call Me', icon: '🤙', duration: 1.6, loop: false, parts: ['armR'],
    pose: (t) => ({ armR: [-2.5, 0.15 * Math.sin(t * 10), 0.65] }),
  }),
  row({
    id: 'victory', label: 'Victory', icon: '🏆', duration: 1.8, loop: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-2.7, 0, 0.6], armR: [-2.7, 0, -0.6], body: [-0.12, 0, 0], lift: 0.1 * bump(t, 0.3, 0.9) }),
  }),
  row({
    id: 'tantrum', label: 'Tantrum', icon: '😤', duration: 1.6, loop: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => {
      const a = sn(t, 1.6, 4);
      return {
        armL: [-0.8 - 0.6 * a, 0, 0.2], armR: [-0.8 + 0.6 * a, 0, -0.2],
        legL: [-0.15 - 0.15 * a, 0, 0], legR: [-0.15 + 0.15 * a, 0, 0], body: [0.2, 0, 0.05 * a],
      };
    },
  }),
  row({
    id: 'chicken', label: 'Chicken', icon: '🐔', duration: 1.0, loop: true, parts: ['armL', 'armR', 'body', 'legL'],
    pose: (t) => {
      const f = 0.65 + 0.35 * sn(t, 1, 2);
      return {
        armL: [0.3, 0, f], armR: [0.3, 0, -f],
        body: [0.125 - 0.125 * Math.cos((TAU * 2 * t) / 1), 0, 0], legL: [0.2 + 0.2 * sn(t, 1, 1), 0, 0],
      };
    },
  }),
];
