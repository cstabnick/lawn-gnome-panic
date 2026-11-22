// Floor 1: Orientation. A bright, slightly too-neat open-plan office "where every career begins".
import type { FloorLayout, PropPlacement } from '../types';

/** Top of the `side-table` prefab (its top box sits at 0.55, 0.05 thick). The display acorn sits on it. */
export const F1_PLINTH_TOP = 0.575;

const plant = (x: number, z: number): PropPlacement => ({ prefab: 'spiky-potted-plant', x, z, solid: true });

const desks: PropPlacement[] = [];
for (const z of [1, 5]) {
  for (const x of [-6, 0, 6]) {
    desks.push({ prefab: 'office-desk', x, z, solid: true });
    desks.push({ prefab: 'chair', x, z: z + 0.9, rot: 180 });
  }
}

/** The cabinet run along the west wall: a desk step in front of each cabinet. */
const cabinets: PropPlacement[] = [];
for (const z of [-6, -3, 0, 3, 6]) {
  cabinets.push({ prefab: 'filing-cabinet', x: -12.8, z, solid: true });
  cabinets.push({ prefab: 'office-desk', x: -11, z, rot: 90, solid: true });
}

export const F1: FloorLayout = {
  id: 'f1',
  title: 'Floor 1: Orientation',
  w: 28,
  d: 22,
  floorColor: 0x8fa3b8,
  wallColor: 0xe9eef2,
  elevatorX: 0,
  windows: false,
  spawn: { x: 0, z: -8.5, facing: 0 },
  // The Training Corridor from the lift.
  walls: [
    { x0: -2, z0: -9, x1: -2, z1: -3 },
    { x0: 2, z0: -9, x1: 2, z1: -3 },
  ],
  props: [
    ...desks,
    ...cabinets,
    // The plinth for the display acorn, behind its "rope posts".
    { prefab: 'side-table', x: 10, z: -7, solid: true },
    { prefab: 'flower-pot', x: 9, z: -8, solid: true },
    { prefab: 'flower-pot', x: 11, z: -8, solid: true },
    { prefab: 'flower-pot', x: 9, z: -6, solid: true },
    { prefab: 'flower-pot', x: 11, z: -6, solid: true },
    plant(-13.2, -10.2), plant(13.2, -10.2), plant(-13.2, 10.2), plant(13.2, 10.2),
    { prefab: 'wall-clock', x: 5, z: -10.85, y: 2.2 },
    { prefab: 'bookshelf', x: 12.8, z: 3, rot: -90, solid: true },
  ],
  npcs: [],
  areas: {
    corridor: { x0: -1.8, z0: -9, x1: 1.8, z1: -3 },
    'open-plan': { x0: -9, z0: -2, x1: 9, z1: 9.5 },
    cabinets: { x0: -13.5, z0: -7, x1: -10, z1: 7 },
    plinth: { x0: 8.4, z0: -8.6, x1: 11.6, z1: -5.4 },
    all: { x0: -13.5, z0: -10.5, x1: 13.5, z1: 10.5 },
  },
  interactables: [{ id: 'clock', label: 'Look', x: 5, z: -10, radius: 1.2 }],
};
