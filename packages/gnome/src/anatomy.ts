// The gnome's head and face, in rig space (feet at y 0). model.ts builds the head from these, and gear-clearance.ts
// checks worn gear against them, so the two cannot drift apart.
import type { Vec3 } from '@lawn/prefabs';

/** The head is a sphere. Gear must stay outside it. */
export const HEAD = { center: [0, 0.8, 0] as Vec3, radius: 0.17 };

/** Face features that stick out past the head sphere. Gear must stay clear of them too. */
export const FACE: ReadonlyArray<{ name: string; center: Vec3; radius: number }> = [
  { name: 'nose', center: [0, 0.8, 0.17], radius: 0.05 },
  { name: 'eye-left', center: [0.06, 0.86, 0.15], radius: 0.025 },
  { name: 'eye-right', center: [-0.06, 0.86, 0.15], radius: 0.025 },
];

/** Where neck gear is attached: its origin sits here, so its lowest point is at y 0 of the gear itself. */
export const NECK_ANCHOR: Vec3 = [0, 0.65, 0.05]; // same as EQUIP_ANCHORS.neck.at

/**
 * Where each equipment slot puts its gear, before the prefab's own `wear` offset. `at` is in rig space (feet at y 0)
 * for head, back and neck, and in the right arm's pivot space for hand. `rot` is in DEGREES, x then y then z.
 * gear.ts reads these; the prefab editor (`npm run prefab-editor`) rewrites these lines, so keep one slot per line.
 */
export const EQUIP_ANCHORS: Readonly<Record<'head' | 'back' | 'neck' | 'hand', { at: Vec3; rot: Vec3 }>> = {
  head: { at: [0, 0.91, 0], rot: [0, 0, 0] },
  back: { at: [0, 0.28, -0.22], rot: [0, 180, 0] },
  neck: { at: [0, 0.65, 0.05], rot: [0, 0, 0] },
  hand: { at: [0, -0.32, 0.02], rot: [-90, 0, 0] },
};
