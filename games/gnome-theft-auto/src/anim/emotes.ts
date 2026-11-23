// The emote menu's 14 animations (EMOTE_IDS in types.ts). All are one-shots (non-looping) with no prop.
import type { AnimDef, AnimPart, AnimPose, EmoteAnimId } from './types';

const TAU = Math.PI * 2;
/** sin of `hz` cycles per second at time t. */
const hz = (t: number, f: number): number => Math.sin(TAU * f * t);
/** One smooth bump over [0, d]: 0 at both ends, 1 in the middle. */
const arch = (t: number, d: number): number => Math.sin((Math.PI * t) / d);

function emote(def: {
  id: EmoteAnimId;
  label: string;
  icon: string;
  duration: number;
  parts: readonly AnimPart[];
  pose: (t: number) => AnimPose;
}): AnimDef<EmoteAnimId> {
  return { ...def, category: 'emote', loop: false, emote: true };
}

/** One row per id in EMOTE_IDS (types.ts), in that order. */
export const EMOTE_ANIMS: readonly AnimDef<EmoteAnimId>[] = [
  emote({
    id: 'wave', label: 'Wave', icon: '👋', duration: 1.6, parts: ['armR'],
    pose: (t) => ({ armR: [-2.6, 0, -0.3 + 0.35 * hz(t, 1.6)] }),
  }),
  emote({
    id: 'point', label: 'Point', icon: '👉', duration: 1.4, parts: ['armR'],
    pose: (t) => ({ armR: [-1.55 - (t < 0.3 ? 0.15 * arch(t, 0.3) : 0), 0, 0] }),
  }),
  emote({
    id: 'shrug', label: 'Shrug', icon: '🤷', duration: 1.2, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-0.5, 0, 0.6],
      armR: [-0.5, 0, -0.6],
      body: [0, 0, 0.05 * Math.sin((TAU * t) / 1.2)],
    }),
  }),
  emote({
    id: 'cheer', label: 'Cheer', icon: '🙌', duration: 2.0, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-2.9 + 0.12 * hz(t, 2), 0, 0.3],
      armR: [-2.9 - 0.12 * hz(t, 2), 0, -0.3],
      body: [0, 0, 0.03 * hz(t, 1)],
      lift: 0.075 * (1 - Math.cos(TAU * t)),
    }),
  }),
  emote({
    id: 'clap', label: 'Clap', icon: '👏', duration: 1.6, parts: ['armL', 'armR'],
    pose: (t) => {
      // Hands meet (z = 0) four times a second.
      const z = 0.35 * (1 + Math.cos(TAU * 4 * t));
      return { armL: [-1.3, 0, z], armR: [-1.3, 0, -z] };
    },
  }),
  emote({
    id: 'facepalm', label: 'Facepalm', icon: '🤦', duration: 1.6, parts: ['armR', 'body'],
    pose: (t) => ({
      armR: [-2.3, 0, 0.5],
      body: [0.15, 0.12 * Math.sin((TAU * t) / 1.6), 0],
    }),
  }),
  emote({
    id: 'thumbs-up', label: 'Thumbs Up', icon: '👍', duration: 1.4, parts: ['armR'],
    pose: (t) => ({ armR: [-1.9 + 0.08 * hz(t, 2), 0, -0.2] }),
  }),
  emote({
    id: 'salute', label: 'Salute', icon: '🫡', duration: 1.5, parts: ['armR', 'body'],
    pose: () => ({ armR: [-2.6, 0, 0.7], body: [-0.05, 0, 0] }),
  }),
  emote({
    id: 'bow', label: 'Bow', icon: '🙇', duration: 1.8, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [0.4, 0, 0],
      armR: [-0.9, 0, 0.6],
      body: [0.6 * arch(t, 1.8), 0, 0],
    }),
  }),
  emote({
    id: 'shake-fist', label: 'Shake Fist', icon: '✊', duration: 1.6, parts: ['armR', 'body'],
    pose: (t) => ({
      armR: [-2.5 + 0.25 * hz(t, 6), 0, 0],
      body: [0.1, 0, 0],
    }),
  }),
  emote({
    id: 'beckon', label: 'Come Here', icon: '🫴', duration: 1.6, parts: ['armR'],
    // Forward (-1.5), curling back toward the body (toward -1.0) twice a second.
    pose: (t) => ({ armR: [-1.5 + 0.25 * (1 - Math.cos(TAU * 2 * t)), 0, 0] }),
  }),
  emote({
    id: 'laugh', label: 'Laugh', icon: '😂', duration: 2.0, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [-0.9, 0, -0.5],
      armR: [-0.9, 0, 0.5],
      body: [0.15 + 0.1 * hz(t, 4), 0, 0],
    }),
  }),
  emote({
    id: 'taunt', label: 'Taunt', icon: '😜', duration: 2.0, parts: ['armL', 'armR', 'body', 'legR'],
    pose: (t) => {
      const wag = 1.2 + 0.15 * hz(t, 3);
      return {
        armL: [0, 0, wag],
        armR: [0, 0, -wag],
        legR: [-0.5 * Math.max(0, hz(t, 1)), 0, 0],
        body: [0, 0.3 * hz(t, 1), 0],
      };
    },
  }),
  emote({
    id: 'flex', label: 'Flex', icon: '💪', duration: 1.8, parts: ['armL', 'armR', 'body'],
    pose: (t) => {
      const x = -1.2 + 0.1 * hz(t, 2);
      return {
        armL: [x, 0, 1.4],
        armR: [x, 0, -1.4],
        body: [-0.08, 0, 0],
      };
    },
  }),
];
