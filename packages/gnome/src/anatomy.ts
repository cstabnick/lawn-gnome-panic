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
export const NECK_ANCHOR: Vec3 = [0, 0.65, 0.05];
