// Floor ∞: Everything. The top of the Annex: white, airy, full of nice furniture, all of it about to be collected.
// A clear path runs east from the lift to the window spot in the north-east corner, where Shellshore hangs in the sky.
import type { FloorLayout, PropPlacement } from '../types';

/** Top of the `office-desk` prefab (its top box sits at 0.595, 0.07 thick). */
const DESK_TOP = 0.63;

const DESK_XS = [-9, -3, 3, 9];
const DESK_ROWS = [-3, 4];

const desks: PropPlacement[] = [];
const chairs: PropPlacement[] = [];
for (const z of DESK_ROWS) {
  for (const x of DESK_XS) {
    desks.push({ prefab: 'office-desk', x, z, tint: 0xe8e8ee, solid: true });
    // Tucked in on the south side, a hand's width from the desk front (no shared face).
    chairs.push({ prefab: 'chair', x, z: z + 0.85, rot: 180, tint: 0xf4f4f8, solid: true });
  }
}

const plant = (x: number, z: number): PropPlacement => ({ prefab: 'spiky-potted-plant', x, z, solid: true });
const pot = (x: number, z: number): PropPlacement => ({ prefab: 'flower-pot', x, z });
const shelf = (z: number): PropPlacement => ({ prefab: 'bookshelf', x: 14.5, z, rot: -90, tint: 0xf0f0f4, solid: true });
const cabinet = (z: number): PropPlacement => ({ prefab: 'filing-cabinet', x: -14.5, z, rot: 90, tint: 0xf2f2f6, solid: true });

export const F4: FloorLayout = {
  id: 'f4',
  title: 'Floor ∞: Everything',
  w: 30,
  d: 30,
  floorColor: 0xd8d8e0,
  wallColor: 0xffffff,
  elevatorX: 0,
  spawn: { x: 0, z: -12.5, facing: 0 },
  windows: true,
  walls: [],
  props: [
    ...desks,
    ...chairs,
    // Trophies on two of the desks, clear of the blotter and the stamp.
    { prefab: 'trophy-cup', x: -9 + 0.7, z: -3 - 0.1, y: DESK_TOP },
    { prefab: 'trophy-cup', x: 9 + 0.7, z: 4 - 0.1, y: DESK_TOP },
    // West wall: filing cabinets, spaced so no two share a face.
    cabinet(-8.5), cabinet(-7.6), cabinet(-6.7), cabinet(-5.8),
    // South-west lounge.
    { prefab: 'couch', x: -10, z: 10, solid: true },
    { prefab: 'couch', x: -10, z: 13.6, rot: 180, solid: true },
    { prefab: 'couch', x: -13.6, z: 11.8, rot: 90, solid: true },
    // East wall: bookshelves, then the break corner.
    shelf(-1), shelf(1.5), shelf(4), shelf(6.5),
    { prefab: 'vending-machine', x: 14.3, z: 10.5, rot: -90, solid: true },
    { prefab: 'arcade-cabinet', x: 14.3, z: 12.8, rot: -90, solid: true },
    // North wall, west of the lift (the path to the window runs east).
    { prefab: 'fc-water-cooler', x: -6, z: -14.4, solid: true },
    { prefab: 'fc-photocopier', x: -3.8, z: -14.2, solid: true },
    { prefab: 'reception-desk', x: -9.5, z: -11, tint: 0xeeeeee, solid: true },
    plant(-2, -14.3), plant(2, -14.3), plant(-14.2, -14.2), plant(14.2, -9),
    plant(-14.2, 14.2), plant(6, 13.8),
    pot(-6, 0.8), pot(0, 0.8), pot(6, 0.8), pot(0, 8),
    { prefab: 'crate', x: -4.6, z: 11.5, rot: 10, solid: true },
    { prefab: 'crate', x: -3.4, z: 11.8, rot: -15, solid: true },
    { prefab: 'crate', x: -4, z: 12.9, rot: 30, solid: true },
    { prefab: 'wall-clock', x: 6, z: -14.85, y: 2.2 },
  ],
  npcs: [],
  areas: {
    floor: { x0: -14, z0: -13, x1: 14, z1: 14 },
    'window-spot': { x0: 10, z0: -14.5, x1: 14.5, z1: -11 },
    all: { x0: -14.5, z0: -14.5, x1: 14.5, z1: 14.5 },
  },
  interactables: [
    { id: 'window', label: 'Look', x: 12, z: -13.8, radius: 1.8 },
    { id: 'clock', label: 'Look', x: 6, z: -14, radius: 1.2 },
  ],
};
