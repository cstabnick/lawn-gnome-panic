// Reception: the Annex lobby of Bucketworth & Sons, Collectors. Primrose Paperweight behind the desk.
import type { FloorLayout, PropPlacement } from '../types';
import { PRIMROSE_LOOK } from '../config';

/** Top of the `side-table` prefab (its top box sits at 0.55, 0.05 thick). */
const SIDE_TABLE_TOP = 0.575;

const plant = (x: number, z: number): PropPlacement => ({ prefab: 'spiky-potted-plant', x, z, solid: true });

export const LOBBY: FloorLayout = {
  id: 'lobby',
  title: 'Reception',
  w: 20,
  d: 16,
  floorColor: 0xc9b89a,
  wallColor: 0xece4d4,
  elevatorX: 0,
  frontDoorX: 0,
  windows: false,
  // Just inside the front door, facing the desk to the north.
  spawn: { x: 0, z: 5.5, facing: Math.PI },
  walls: [],
  props: [
    { prefab: 'reception-desk', x: 0, z: -3, tint: 0x8a5a3b, solid: true },
    { prefab: 'fc-nameplate', x: -0.75, z: -2.85, y: 0.73 },
    { prefab: 'couch', x: -6, z: 2, rot: 90, solid: true },
    { prefab: 'couch', x: 6, z: 2, rot: -90, solid: true },
    plant(-8.8, -6.8), plant(8.8, -6.8), plant(-8.8, 6.8), plant(8.8, 6.8),
    plant(-1.8, -7.3), plant(1.8, -7.3),
    { prefab: 'wall-clock', x: 4, z: -7.85, y: 2.2 },
    { prefab: 'bookshelf', x: -8.6, z: -4, rot: 90, solid: true },
    { prefab: 'side-table', x: -6, z: 4.3, solid: true },
    { prefab: 'side-table', x: 6, z: 4.3, solid: true },
    { prefab: 'trophy-cup', x: -6, z: 4.3, y: SIDE_TABLE_TOP },
    { prefab: 'trophy-cup', x: 6, z: 4.3, y: SIDE_TABLE_TOP },
    { prefab: 'flower-pot', x: -2.2, z: 6.5, solid: true },
    { prefab: 'flower-pot', x: 2.2, z: 6.5, solid: true },
  ],
  npcs: [{ id: 'primrose', x: 0, z: -4.1, facing: 0, look: PRIMROSE_LOOK }],
  areas: {
    'front-door': { x0: -1.5, z0: 6.6, x1: 1.5, z1: 8 },
    outside: { x0: -1.5, z0: 8.3, x1: 1.5, z1: 9.6 },
    reception: { x0: -3, z0: -2.6, x1: 3, z1: 0 },
    waiting: { x0: -8, z0: -1, x1: 8, z1: 5 },
    all: { x0: -9.5, z0: -7.5, x1: 9.5, z1: 7.5 },
  },
  interactables: [
    { id: 'secretary', label: 'Talk', x: 0, z: -2.1, radius: 1.6 },
    { id: 'nameplate', label: 'Read', x: -0.9, z: -2.1, radius: 0.9 },
    { id: 'clock', label: 'Look', x: 4, z: -7, radius: 1.2 },
  ],
};
