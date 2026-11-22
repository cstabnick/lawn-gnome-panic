// Floor 2: Onboarding. A busy open-plan floor: a 3 x 3 desk grid, four cubicle bays to the east, a break nook and a
// copy corner to the west, and the Bucketworth Kiosk (a vending machine) left of the lift.
import type { FloorLayout, PropPlacement, WallSeg } from '../types';

const plant = (x: number, z: number): PropPlacement => ({ prefab: 'spiky-potted-plant', x, z, solid: true });
/** An office desk (front faces +z) with its chair behind it on the north side. */
const desk = (x: number, z: number): PropPlacement[] => [
  { prefab: 'office-desk', x, z, solid: true },
  { prefab: 'chair', x, z: z - 0.75 },
];

/** Desk grid of the open plan; Chapter 2 puts Gold Buttons on some of these tops. */
export const F2_DESKS: readonly { x: number; z: number }[] = [-7, 0, 7].flatMap((x) => [-4, 1, 6].map((z) => ({ x, z })));

// Cubicles: four 4 m bays (z -9..-5, -5..-1, -1..3, 3..7) between x 9.5 and 15.5. The west partition has a 2 m
// doorway into every bay; the east end stops short of the outer wall by less than a gnome's width.
const CUBE_X = 9.5;
const cubicleWalls: WallSeg[] = [
  { x0: CUBE_X, z0: -9, x1: CUBE_X, z1: -8 },
  { x0: CUBE_X, z0: -6, x1: CUBE_X, z1: -4 },
  { x0: CUBE_X, z0: -2, x1: CUBE_X, z1: 0 },
  { x0: CUBE_X, z0: 2, x1: CUBE_X, z1: 4 },
  { x0: CUBE_X, z0: 6, x1: CUBE_X, z1: 7 },
  { x0: CUBE_X, z0: -9, x1: 15.5, z1: -9 },
  { x0: CUBE_X, z0: -5, x1: 15.5, z1: -5 },
  { x0: CUBE_X, z0: -1, x1: 15.5, z1: -1 },
  { x0: CUBE_X, z0: 3, x1: 15.5, z1: 3 },
  { x0: CUBE_X, z0: 7, x1: 15.5, z1: 7 },
];

export const F2: FloorLayout = {
  id: 'f2',
  title: 'Floor 2: Onboarding',
  w: 32,
  d: 26,
  floorColor: 0x8fb894,
  wallColor: 0xeef2e9,
  elevatorX: 0,
  windows: false,
  spawn: { x: 0, z: -10.5, facing: 0 },
  walls: cubicleWalls,
  props: [
    // Open plan
    ...F2_DESKS.flatMap((d) => desk(d.x, d.z)),
    // Cubicles: one desk per bay
    ...[-7, -3, 1, 5].flatMap((z) => desk(12.7, z + 0.3)),
    // Break nook
    { prefab: 'fc-water-cooler', x: -14.5, z: -7, solid: true },
    { prefab: 'couch', x: -12, z: -3, rot: 0, solid: true },
    // Copy corner
    { prefab: 'fc-photocopier', x: -14.3, z: 5, rot: 90, solid: true },
    { prefab: 'crate', x: -14.4, z: 7.2, solid: true },
    // Kiosk, against the north wall left of the lift
    { prefab: 'vending-machine', x: -6, z: -11.9, rot: 0, solid: true },
    // Decor
    plant(-14.8, -11.8), plant(14.8, -11.8), plant(-14.8, 11.8), plant(14.8, 11.8),
    { prefab: 'wall-clock', x: 6, z: -12.85, y: 2.2 },
    { prefab: 'bookshelf', x: -15.7, z: 9.3, rot: 90, solid: true },
    { prefab: 'bookshelf', x: -15.7, z: 10.6, rot: 90, solid: true },
  ],
  npcs: [
    { id: 'sorrel', x: -13.6, z: -6.2, facing: 0.8, look: { hat: 0x3a8a5a, shirt: 0xe8d8b0, pants: 0x4a3a2a, beard: 0xd8d0c0 } },
  ],
  areas: {
    'open-plan': { x0: -9, z0: -6, x1: 9, z1: 9 },
    cubicles: { x0: 9.6, z0: -9, x1: 15.5, z1: 7 },
    'break-nook': { x0: -15.5, z0: -9, x1: -10, z1: -2 },
    storage: { x0: -15.5, z0: 1, x1: -10, z1: 9 },
    corners: { x0: -15.5, z0: 9.5, x1: 15.5, z1: 12.5 },
    all: { x0: -15.5, z0: -12.5, x1: 15.5, z1: 12.5 },
  },
  interactables: [
    { id: 'water-cooler', label: 'Chat', x: -13.4, z: -5.4, radius: 1.5 },
    { id: 'photocopier', label: 'Copy', x: -13.2, z: 5, radius: 1.3 },
    { id: 'kiosk', label: 'Shop', x: -6, z: -10.9, radius: 1.4 },
    { id: 'clock', label: 'Look', x: 6, z: -12, radius: 1.2 },
  ],
};
