// Personality (round 3): how each townsgnome archetype walks, runs and stands. walk-* / run-* rows are `onMove`
// overlays: their arm x is ADDED to the walk swing (animator.ts applyPose additive), so keep it small, and they never
// touch the legs (the walk cycle owns them). idle-* rows are whole standing poses. Axis notes in types.ts.
import type { AnimDef, StyleAnimId, Vec3 } from './types';

const TAU = Math.PI * 2;
const sn = (t: number, d: number, k = 1, ph = 0): number => Math.sin((TAU * k * t) / d + ph);
/** 0..1..0 over k whole cycles (a loop-safe bounce). */
const up = (t: number, d: number, k = 1): number => 0.5 - 0.5 * Math.cos((TAU * k * t) / d);

const walk = (id: StyleAnimId, label: string, icon: string, duration: number, pose: AnimDef['pose']): AnimDef<StyleAnimId> => ({
  id, label, icon, duration, pose, category: 'style', loop: true, emote: true, onMove: true, parts: ['armL', 'armR', 'body'],
});
const stand = (r: Omit<AnimDef<StyleAnimId>, 'category' | 'loop' | 'emote'>): AnimDef<StyleAnimId> => ({
  category: 'style', loop: true, emote: true, ...r,
});
const arms = (x: number, zOut: number): { armL: Vec3; armR: Vec3 } => ({ armL: [x, 0, zOut], armR: [x, 0, -zOut] });

export const STYLE_ANIMS: readonly AnimDef<StyleAnimId>[] = [
  walk('walk-swagger', 'Swagger', '😎', 1.2, (t) => ({ ...arms(0.1, 0.35), body: [-0.06, 0.18 * sn(t, 1.2), 0.06 * sn(t, 1.2)] })),
  walk('walk-shuffle', 'Shuffle', '🐌', 1.2, () => ({ ...arms(0.15, 0.05), body: [0.22, 0, 0], lift: -0.04 })),
  walk('walk-tiptoe', 'Tiptoe', '🩰', 0.8, (t) => ({ ...arms(-0.4, 0.5), body: [0.05, 0, 0], lift: 0.05 + 0.02 * up(t, 0.8, 2) })),
  walk('walk-sulk', 'Sulk', '😒', 1.4, (t) => ({ ...arms(0.2, 0.05), body: [0.3, 0, 0.04 * sn(t, 1.4)] })),
  walk('walk-jaunty', 'Jaunty', '🎶', 0.9, (t) => ({ ...arms(-0.15, 0.2), body: [-0.04, 0, 0.08 * sn(t, 0.9)], lift: 0.05 * up(t, 0.9, 2) })),
  walk('walk-nervous', 'Nervous', '😬', 1.2, (t) => ({
    armL: [-0.6, 0, -0.4], armR: [-0.6, 0, 0.4], body: [0.08, 0.25 * sn(t, 1.2, 3), 0],
  })),
  walk('walk-proud', 'Proud', '🦚', 1.2, (t) => ({ ...arms(0.15, 0.15), body: [-0.15, 0.05 * sn(t, 1.2), 0] })),
  walk('walk-sleepy', 'Sleepwalk', '😪', 1.6, (t) => ({
    ...arms(0.1, 0.05), body: [0.15 + 0.05 * sn(t, 1.6, 2), 0, 0.1 * sn(t, 1.6)], lift: -0.03,
  })),
  walk('walk-pompous', 'Pompous', '🎩', 1.4, (t) => ({
    armL: [0.4, 0, -0.1], armR: [-0.5, 0, 0.3], body: [-0.2, 0.1 * sn(t, 1.4), 0],
  })),
  walk('run-flail', 'Flail Run', '🙀', 0.6, (t) => ({
    armL: [-1.2 + 0.8 * sn(t, 0.6, 2), 0, 0.8], armR: [-1.2 - 0.8 * sn(t, 0.6, 2), 0, -0.8], body: [0.1, 0, 0.1 * sn(t, 0.6)],
  })),
  walk('run-pump', 'Power Run', '🏃', 0.5, (t) => ({
    armL: [-0.5 * sn(t, 0.5, 1), 0, 0.1], armR: [0.5 * sn(t, 0.5, 1), 0, -0.1], body: [0.25, 0, 0],
  })),
  walk('run-sneak', 'Sneak', '🥷', 0.8, (t) => ({ ...arms(-0.5, 0.3), body: [0.35, 0.05 * sn(t, 0.8), 0], lift: -0.1 })),

  stand({
    id: 'idle-swagger', label: 'Cool Stand', icon: '🕶️', duration: 3, parts: ['armL', 'armR', 'legR', 'body'],
    pose: (t) => ({ ...arms(0.2, 0.3), legR: [-0.1, 0, -0.15], body: [-0.08, 0.12 * sn(t, 3), 0.03] }),
  }),
  stand({
    id: 'idle-nervous', label: 'Fidget', icon: '😰', duration: 2, parts: ['armL', 'armR', 'legL', 'body'],
    pose: (t) => ({
      armL: [-1.0 + 0.1 * sn(t, 2, 4), 0, -0.5], armR: [-1.0 - 0.1 * sn(t, 2, 4), 0, 0.5],
      legL: [-0.12 * up(t, 2, 4), 0, 0], body: [0.06, 0.3 * sn(t, 2, 2), 0],
    }),
  }),
  stand({
    id: 'idle-proud', label: 'Chest Out', icon: '🏅', duration: 4, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0.5, 0, -0.15], armR: [0.5, 0, 0.15], body: [-0.15 + 0.02 * sn(t, 4), 0.1 * sn(t, 4), 0] }),
  }),
  stand({
    id: 'idle-sleepy', label: 'Nod Off', icon: '😴', duration: 4, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ ...arms(0.05, 0.05), body: [0.12 + 0.18 * up(t, 4) ** 3, 0, 0.05] }),
  }),
  stand({
    id: 'idle-pompous', label: 'Pompous', icon: '🧐', duration: 3, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({ armL: [0.5, 0, -0.1], armR: [-0.6, 0, 0.4], body: [-0.2, 0.15 * sn(t, 3), 0] }),
  }),
  stand({
    id: 'idle-sulk', label: 'Sulk', icon: '😞', duration: 3, parts: ['armL', 'armR', 'legR', 'body'],
    pose: (t) => ({ armL: [-0.9, 0, -0.6], armR: [-0.9, 0, 0.6], legR: [-0.2 * up(t, 3), 0, 0], body: [0.3, 0, 0.05] }),
  }),
  stand({
    id: 'idle-jaunty', label: 'Bounce', icon: '😄', duration: 1.6, parts: ['armL', 'armR', 'body'],
    pose: (t) => ({
      armL: [0.2 * sn(t, 1.6), 0, 0.1], armR: [-0.2 * sn(t, 1.6), 0, -0.1], body: [0, 0, 0.06 * sn(t, 1.6)], lift: 0.03 * up(t, 1.6, 2),
    }),
  }),
];
