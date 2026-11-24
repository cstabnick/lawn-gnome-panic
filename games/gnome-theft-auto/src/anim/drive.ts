// Driving personalities (round 3): overlays on a driver whose hands are on the grips (driverHands.ts). Only the LEFT
// arm (off the wheel) and the body move, so the right hand keeps steering. rideAuto.ts picks them. Axis notes in types.ts.
import type { AnimDef, DriveAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const up = (t: number, d: number, k = 1): number => 0.5 - 0.5 * Math.cos((TAU * k * t) / d);
const bump = (t: number, a: number, b: number): number => Math.sin(Math.PI * Math.min(1, Math.max(0, (t - a) / (b - a))));

const row = (r: Omit<AnimDef<DriveAnimId>, 'category' | 'emote'>): AnimDef<DriveAnimId> => ({ category: 'drive', emote: false, ...r });

export const DRIVE_ANIMS: readonly AnimDef<DriveAnimId>[] = [
  row({
    id: 'drive-casual', label: 'One Hand', icon: '🤙', duration: 4, loop: true, parts: ['armL', 'body'],
    pose: (t) => ({ armL: [0.1, 0, 0.15], body: [-0.12, 0, 0.05 + 0.02 * sn(t, 4)] }),
  }),
  row({
    id: 'drive-white-knuckle', label: 'Tense', icon: '😬', duration: 1, loop: true, parts: ['body'],
    pose: (t) => ({ body: [0.3, 0, 0.02 * sn(t, 1, 8)] }),
  }),
  row({
    id: 'drive-road-rage', label: 'Road Rage', icon: '🤬', duration: 1.6, loop: false, parts: ['armL', 'body'],
    pose: (t) => ({ armL: [-2.4 + 0.25 * Math.sin(t * 24), 0, 0.6], body: [0.15 + 0.05 * Math.sin(t * 12), 0, 0] }),
  }),
  row({
    id: 'drive-elbow-out', label: 'Elbow Out', icon: '💪', duration: 4, loop: true, parts: ['armL', 'body'],
    pose: (t) => ({ armL: [-0.3 + 0.05 * sn(t, 4, 4), 0, 1.3], body: [-0.08, 0, 0.08] }),
  }),
  row({
    id: 'drive-sing-along', label: 'Sing Along', icon: '🎤', duration: 2, loop: true, parts: ['armL', 'body'],
    pose: (t) => ({ armL: [-2.0 + 0.3 * sn(t, 2, 2), 0, 0.4], body: [0.06 * sn(t, 2, 4), 0, 0.08 * sn(t, 2, 2)] }),
  }),
  row({
    id: 'drive-lean-cool', label: 'Lean Back', icon: '😎', duration: 4, loop: true, parts: ['armL', 'body'],
    pose: (t) => ({ armL: [0.2, 0, 0.3], body: [-0.2 + 0.03 * sn(t, 4, 4), 0, 0.15] }),
  }),
  row({
    id: 'drive-honk-pound', label: 'Honk', icon: '📯', duration: 1.2, loop: false, parts: ['armL', 'body'],
    pose: (t) => ({ armL: [-1.2 + 0.3 * Math.sin(t * 20), 0, -0.4], body: [0.2 * bump(t, 0, 1.2), 0, 0] }),
  }),
  row({
    id: 'drive-sleepy', label: 'Drowsy', icon: '😪', duration: 4, loop: true, parts: ['body'],
    pose: (t) => ({ body: [0.12 + 0.12 * up(t, 4) ** 3, 0, 0.08] }),
  }),
];
