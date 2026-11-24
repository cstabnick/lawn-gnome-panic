// Mood layers (round 3): arms-and-body overlays that work standing or walking (`onMove`, additive arm x). Axis notes in types.ts.
import type { AnimDef, MoodAnimId } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
const up = (t: number, d: number, k = 1): number => 0.5 - 0.5 * Math.cos((TAU * k * t) / d);

const mood = (id: MoodAnimId, label: string, icon: string, duration: number, pose: AnimDef['pose']): AnimDef<MoodAnimId> => ({
  id, label, icon, duration, pose, category: 'style', loop: true, emote: true, onMove: true, parts: ['armL', 'armR', 'body'],
});

export const MOOD_ANIMS: readonly AnimDef<MoodAnimId>[] = [
  mood('mood-happy', 'Happy', '😊', 1.2, (t) => ({
    armL: [0, 0, 0.15], armR: [0, 0, -0.15], body: [-0.03, 0, 0.06 * sn(t, 1.2, 2)], lift: 0.02 * up(t, 1.2, 4),
  })),
  mood('mood-angry', 'Angry', '😠', 1.0, (t) => ({
    armL: [-0.2, 0, 0.25], armR: [-0.2, 0, -0.25], body: [0.15, 0.04 * sn(t, 1, 6), 0],
  })),
  mood('mood-scared', 'Scared', '😟', 1.6, (t) => ({
    armL: [-0.5, 0, -0.3], armR: [-0.5, 0, 0.3], body: [0.12, 0.3 * sn(t, 1.6, 2), 0],
  })),
  mood('mood-bored', 'Bored', '🥱', 3.0, (t) => ({
    armL: [0.1, 0, 0], armR: [0.1, 0, 0], body: [0.2, 0, 0.08 * sn(t, 3)],
  })),
  mood('mood-tipsy', 'Tipsy', '🥴', 2.4, (t) => ({
    armL: [0, 0, 0.4], armR: [0, 0, -0.4], body: [0.08 * sn(t, 2.4, 2), 0.1 * sn(t, 2.4, 1, 1), 0.15 * sn(t, 2.4)],
  })),
];
