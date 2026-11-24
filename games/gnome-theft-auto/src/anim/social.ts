// Pair animations (round 3): two gnomes stand PAIR_GAP apart facing each other and play `id` and its `pair`. Each row is
// one side, in its own frame (forward = toward the partner), so symmetric pairs play the same row. pairs.ts sets them up.
// Axis notes in types.ts.
import type { AnimDef, SocialAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const up = (t: number, d: number, k = 1): number => 0.5 - 0.5 * Math.cos((TAU * k * t) / d);
const cl = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => { const c = cl(x); return c * c * (3 - 2 * c); };
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * cl((t - a) / (b - a)));

const row = (r: Omit<AnimDef<SocialAnimId>, 'category' | 'emote'>): AnimDef<SocialAnimId> => ({ category: 'social', emote: true, ...r });

export const SOCIAL_ANIMS: readonly AnimDef<SocialAnimId>[] = [
  row({
    id: 'handshake', pair: 'handshake', label: 'Handshake', icon: '🤝', duration: 1.6, loop: false, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-1.2 + (t > 0.4 && t < 1.2 ? 0.15 * Math.sin(t * 12) : 0), 0, 0.15], body: [0.08, 0, 0] }),
  }),
  row({
    id: 'high-five', pair: 'high-five', label: 'High Five', icon: '🙏', duration: 1.2, loop: false, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.4, 0, 0.25], body: [0.1 * bump(t, 0.5, 0.8), 0, 0], lift: 0.06 * bump(t, 0.3, 0.8) }),
  }),
  row({
    id: 'fist-bump', pair: 'fist-bump', label: 'Fist Bump', icon: '👊', duration: 1.2, loop: false, parts: ['armR', 'body'],
    pose: (t) => {
      const boom = ease((t - 0.6) / 0.25);
      return { armR: [-1.4 + 0.4 * boom, 0, 0.2 - 1.0 * boom], body: [0.06 * bump(t, 0.3, 0.6), 0, 0] };
    },
  }),
  row({
    id: 'hug-pair', pair: 'hug-pair', label: 'Hug', icon: '🫂', duration: 2.4, loop: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-1.35, 0, -0.55], armR: [-1.35, 0, 0.55], body: [0.12, 0, 0.05 * Math.sin(t * 4)] }),
  }),
  row({
    id: 'dance-pair', pair: 'dance-pair', label: 'Dance Duo', icon: '💃', duration: 2, loop: true, parts: ['armL', 'armR', 'legL', 'legR', 'body'],
    pose: (t) => ({
      armL: [-1.3, 0, -0.2], armR: [-1.3, 0, 0.2], legL: [-0.15 - 0.15 * sn(t, 2), 0, 0], legR: [-0.15 + 0.15 * sn(t, 2), 0, 0],
      body: [0, 0.2 * sn(t, 2), 0.12 * sn(t, 2)], lift: 0.04 * up(t, 2, 2),
    }),
  }),
  row({
    id: 'pair-argue', pair: 'pair-argue', label: 'Row', icon: '😤', duration: 1.6, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0.3, 0, 0.6], armR: [-1.6 + 0.25 * sn(t, 1.6, 4), 0, 0.1], body: [0.2 + 0.05 * sn(t, 1.6, 2), 0, 0] }),
  }),
  row({
    id: 'pair-gossip', pair: 'pair-gossip', label: 'Natter', icon: '🗨️', duration: 3, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0.3, 0, 0.6], armR: [-1.0 - 0.5 * up(t, 3, 2), 0, 0.3], body: [0.2, 0.1 * sn(t, 3), 0.05 * sn(t, 3, 2)] }),
  }),
  row({
    id: 'pair-laugh', pair: 'pair-laugh', label: 'Laugh Duo', icon: '🤣', duration: 1.2, loop: true, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [-0.9, 0, -0.5], armR: [-0.9, 0, 0.5], body: [0.15 + 0.1 * sn(t, 1.2, 4), 0, 0] }),
  }),
  row({
    id: 'toast-cups', pair: 'toast-cups', label: 'Cheers', icon: '🥂', duration: 2, loop: false, prop: 'gta-can-cola', parts: ['armR', 'body'],
    pose: (t) => {
      const raise = ease(t / 0.6);
      const drink = ease((t - 1.1) / 0.4);
      return { armR: [-1.5 - 0.5 * raise - 0.3 * drink, 0, 0.2 + 0.3 * drink], body: [-0.1 * drink, 0, 0] };
    },
  }),
  row({
    id: 'pair-bow', pair: 'pair-bow', label: 'Bow Duo', icon: '🙇', duration: 1.8, loop: false, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0.4, 0, 0], armR: [-0.9, 0, 0.6], body: [0.6 * bump(t, 0.2, 1.6), 0, 0] }),
  }),
  row({
    id: 'secret-whisper', pair: 'secret-listen', label: 'Whisper', icon: '🤫', duration: 2.4, loop: true, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.1, 0, 0.35], body: [0.25, 0.1 * sn(t, 2.4), -0.1] }),
  }),
  row({
    id: 'secret-listen', pair: 'secret-whisper', label: 'Listen', icon: '👂', duration: 2.4, loop: true, parts: ['armR', 'body'],
    pose: (t) => ({ armR: [-2.3, 0, 0.6], body: [0.05 + 0.05 * sn(t, 2.4, 2), 0, 0.15] }),
  }),
];
