// Course layouts: where Gnomokemon live, the zone each roams in, and the cover they hide in.
// Data converted from the spawn lists in world.ts. A zone is a circle whose radius is
// max(spawn.radius) + 1.5 over the spawns it holds, centred to cover them all.

import type { CourseId } from './types';

/** A circle on the ground (x, z) where creatures of one home group roam. */
export interface Zone {
  x: number;
  z: number;
  radius: number;
}

/** A place a Shy or Skittish creature can hide: a bush, a log, a pot, a rock. */
export interface CoverSpot {
  x: number;
  z: number;
}

/** A creature placed in a course. `zone` indexes the layout's zones. */
export interface LayoutSpawn {
  speciesId: string;
  pos: [number, number, number];
  rotY: number;
  scale?: number;
  zone: number;
}

export interface CourseLayout {
  /** Roam zones. Every spawn's `zone` index points into this array. */
  zones: readonly Zone[];
  cover: readonly CoverSpot[];
  spawns: readonly LayoutSpawn[];
}

const LAYOUTS: Record<CourseId, CourseLayout> = {
  lawn: {
    zones: [
      { x: -5.8, z: 11.8, radius: 3.3 },
      { x: 5.15, z: 9.35, radius: 4.3 },
      { x: -6.8, z: 4.8, radius: 3.2 },
      { x: 4.3, z: -0.4, radius: 3.9 },
      { x: -4.5, z: -2.6, radius: 3.4 },
      { x: 5.73, z: -12.23, radius: 4.9 },
      { x: 6.8, z: -17.6, radius: 4.1 },
      { x: -6, z: -22.17, radius: 3.6 },
      { x: 1.4, z: -29, radius: 5 },
      { x: -7.2, z: -10.5, radius: 3.5 },
    ],
    cover: [
      { x: -7.2, z: 14.2 },
      { x: 1.45, z: 8.85 },
      { x: -9.5, z: 4.8 },
      { x: 1.1, z: -1.5 },
      { x: -3.1, z: -0.1 },
      { x: 9.73, z: -13.93 },
      { x: 6.8, z: -21.2 },
      { x: -6, z: -22.37 },
      { x: 5.5, z: -30.8 },
      { x: -9.6, z: -12.3 },
    ],
    spawns: [
      { speciesId: 'sproutling', pos: [-3.2, 0, 13.4], rotY: 0.6, scale: 1.25, zone: 0 },
      { speciesId: 'sproutling', pos: [4.8, 0, 12.2], rotY: -0.7, scale: 1.1, zone: 1 },
      { speciesId: 'mossback', pos: [-8.4, 0, 10.2], rotY: 1.1, scale: 1.35, zone: 0 },
      { speciesId: 'staghorn', pos: [-6.8, 0, 4.8], rotY: 0.8, scale: 1.35, zone: 2 },
      { speciesId: 'thimblekin', pos: [3.2, 0, 2.8], rotY: -0.9, scale: 1.25, zone: 3 },
      { speciesId: 'dewdrop', pos: [-5.6, 0, -2], rotY: 0.7, scale: 1.25, zone: 4 },
      { speciesId: 'dewdrop', pos: [-3.4, 0, -3.2], rotY: 0.3, scale: 1.1, zone: 4 },
      { speciesId: 'hoseleech', pos: [5.4, 0, -3.6], rotY: -0.7, scale: 1.35, zone: 3 },
      { speciesId: 'strawight', pos: [9.4, 0, -9.2], rotY: -1.1, scale: 1.4, zone: 5 },
      { speciesId: 'paperwasp', pos: [3.6, 1.3, -12], rotY: -0.5, scale: 1.3, zone: 5 },
      { speciesId: 'kilnpup', pos: [6.8, 0, -17.6], rotY: -1, scale: 1.3, zone: 6 },
      { speciesId: 'unfired', pos: [-4.4, 0, -19.5], rotY: 0.6, scale: 1.35, zone: 7 },
      { speciesId: 'grubthorn', pos: [-9.2, 0, -21.8], rotY: 1, scale: 1.45, zone: 7 },
      { speciesId: 'minimower', pos: [2.2, 0, -27.2], rotY: -0.4, scale: 1.4, zone: 8 },
      { speciesId: 'magpiethief', pos: [5.5, 0.9, 6.5], rotY: -0.8, scale: 1.25, zone: 1 },
      { speciesId: 'hedgewright', pos: [-7.2, 0, -10.5], rotY: 0.6, scale: 1.3, zone: 9 },
      { speciesId: 'acorndrake', pos: [4.2, 1.4, -15.5], rotY: -0.5, scale: 1.35, zone: 5 },
      { speciesId: 'bellrat', pos: [-4.4, 0, -25.2], rotY: 0.7, scale: 1.3, zone: 7 },
      { speciesId: 'gnomespirit', pos: [0.6, 0.2, -31.5], rotY: -0.2, scale: 1.45, zone: 8 },
    ],
  },
  desert: {
    zones: [
      { x: -5.47, z: 9.87, radius: 4.7 },
      { x: 3.8, z: 6.8, radius: 5.7 },
      { x: -4.1, z: -3.2, radius: 4 },
      { x: 5.8, z: -11.6, radius: 5.3 },
      { x: -6.6, z: -20.2, radius: 3.4 },
      { x: 2.4, z: -26.5, radius: 4.9 },
    ],
    cover: [
      { x: -7.97, z: 13.17 },
      { x: 8.7, z: 5.3 },
      { x: -5.5, z: -6.4 },
      { x: 1.4, z: -9.7 },
      { x: -6.6, z: -23.1 },
      { x: 6.8, z: -26.5 },
    ],
    spawns: [
      { speciesId: 'cactuskin', pos: [-3.4, 0, 13.8], rotY: 0.5, scale: 1.3, zone: 0 },
      { speciesId: 'cactuskin', pos: [5.2, 0, 11.4], rotY: -0.6, scale: 1.2, zone: 1 },
      { speciesId: 'armadillan', pos: [-7.8, 0, 8.6], rotY: 1, scale: 1.4, zone: 0 },
      { speciesId: 'armadillan', pos: [-5.2, 0, 7.2], rotY: 0.4, scale: 1.15, zone: 0 },
      { speciesId: 'tumblewight', pos: [2.4, 0, 2.2], rotY: -0.5, scale: 1.35, zone: 1 },
      { speciesId: 'sunlizard', pos: [-5.4, 0, -2.6], rotY: 0.8, scale: 1.35, zone: 2 },
      { speciesId: 'sunlizard', pos: [-2.8, 0, -3.8], rotY: 0.2, scale: 1.2, zone: 2 },
      { speciesId: 'cactuskin', pos: [6.4, 0, -7.2], rotY: -0.9, scale: 1.3, zone: 3 },
      { speciesId: 'sunlizard', pos: [8.2, 0, -12.4], rotY: -1.1, scale: 1.35, zone: 3 },
      { speciesId: 'tumblewight', pos: [2.8, 0, -15.2], rotY: -0.4, scale: 1.3, zone: 3 },
      { speciesId: 'armadillan', pos: [-6.6, 0, -20.2], rotY: 0.7, scale: 1.35, zone: 4 },
      { speciesId: 'armadillan', pos: [2.4, 0, -26.5], rotY: -0.5, scale: 1.45, zone: 5 },
    ],
  },
  depths: {
    zones: [
      { x: -3.2, z: 13.6, radius: 3.9 },
      { x: 4.6, z: 11.4, radius: 3.4 },
      { x: -6.2, z: 6.2, radius: 3.5 },
      { x: 3.2, z: 1.8, radius: 3.7 },
      { x: -3.8, z: -4.4, radius: 3.3 },
      { x: 6.4, z: -9.8, radius: 4.1 },
      { x: -4.2, z: -16.4, radius: 3.1 },
      { x: 1.8, z: -24.5, radius: 3.7 },
    ],
    cover: [
      { x: -3.2, z: 10.2 },
      { x: 4.6, z: 8.5 },
      { x: -8, z: 3.8 },
      { x: 0, z: 1.8 },
      { x: -6.6, z: -4.4 },
      { x: 2.8, z: -9.8 },
      { x: -5.2, z: -18.8 },
      { x: -1.4, z: -24.5 },
    ],
    spawns: [
      { speciesId: 'rustcrab', pos: [-3.2, 0, 13.6], rotY: 0.7, scale: 1.35, zone: 0 },
      { speciesId: 'rustcrab', pos: [4.6, 0, 11.4], rotY: -0.6, scale: 1.2, zone: 1 },
      { speciesId: 'dewdrop', pos: [-6.2, 0, 6.2], rotY: 0.9, scale: 1.25, zone: 2 },
      { speciesId: 'hoseleech', pos: [3.2, 0, 1.8], rotY: -0.8, scale: 1.4, zone: 3 },
      { speciesId: 'clogmaw', pos: [-3.8, 0, -4.4], rotY: 0.4, scale: 1.5, zone: 4 },
      { speciesId: 'rustcrab', pos: [6.4, 0, -9.8], rotY: -1.1, scale: 1.35, zone: 5 },
      { speciesId: 'unfired', pos: [-4.2, 0, -16.4], rotY: 0.5, scale: 1.35, zone: 6 },
      { speciesId: 'clogmaw', pos: [1.8, 0, -24.5], rotY: -0.3, scale: 1.6, zone: 7 },
    ],
  },
  kiln: {
    zones: [
      { x: -4.2, z: 10.45, radius: 4.7 },
      { x: 4, z: 7.1, radius: 5.1 },
      { x: -3.6, z: -4.8, radius: 3.1 },
      { x: 6.8, z: -11.2, radius: 3.7 },
      { x: -6.4, z: -18.5, radius: 2.9 },
      { x: 1.8, z: -26, radius: 5.3 },
    ],
    cover: [
      { x: -8, z: 12.15 },
      { x: 8.5, z: 7.3 },
      { x: -3.6, z: -7.4 },
      { x: 6.8, z: -14.4 },
      { x: -8.8, z: -18.5 },
      { x: 1.8, z: -21.2 },
    ],
    spawns: [
      { speciesId: 'glowmoth', pos: [-2.8, 1.2, 13.5], rotY: 0.5, scale: 1.35, zone: 0 },
      { speciesId: 'glowmoth', pos: [3.8, 1.5, 11.8], rotY: -0.6, scale: 1.25, zone: 1 },
      { speciesId: 'kilnpup', pos: [-5.6, 0, 7.4], rotY: 0.8, scale: 1.35, zone: 0 },
      { speciesId: 'unfired', pos: [4.2, 0, 2.4], rotY: -0.9, scale: 1.35, zone: 1 },
      { speciesId: 'kilnwarden', pos: [-3.6, 0, -4.8], rotY: 0.5, scale: 1.45, zone: 2 },
      { speciesId: 'strawight', pos: [6.8, 0, -11.2], rotY: -1, scale: 1.4, zone: 3 },
      { speciesId: 'grubthorn', pos: [-6.4, 0, -18.5], rotY: 0.9, scale: 1.45, zone: 4 },
      { speciesId: 'minimower', pos: [1.8, 0, -26], rotY: -0.4, scale: 1.5, zone: 5 },
    ],
  },
  ocean: {
    zones: [
      { x: -4.8, z: 10.4, radius: 3.7 },
      { x: 3.8, z: 11.4, radius: 3.5 },
      { x: 2.8, z: 2, radius: 4.7 },
      { x: -4.6, z: -4.4, radius: 3.5 },
      { x: 3.6, z: -10.5, radius: 4.9 },
      { x: -5.8, z: -16.8, radius: 3.9 },
      { x: 1.7, z: -24.5, radius: 4.3 },
    ],
    cover: [
      { x: -2, z: 9 },
      { x: 1.4, z: 9.6 },
      { x: 6.9, z: 1.1 },
      { x: -7.6, z: -4.4 },
      { x: 3.6, z: -6.1 },
      { x: -7.4, z: -19.8 },
      { x: -1.2, z: -22.1 },
    ],
    spawns: [
      { speciesId: 'kelpsprite', pos: [-3.2, 0.4, 13.6], rotY: 0.5, scale: 1.35, zone: 0 },
      { speciesId: 'kelpsprite', pos: [3.8, 0.6, 11.4], rotY: -0.6, scale: 1.2, zone: 1 },
      { speciesId: 'barnacleknight', pos: [-6.4, 0, 7.2], rotY: 0.9, scale: 1.35, zone: 0 },
      { speciesId: 'cisterneel', pos: [2.8, 0.4, 2], rotY: -0.7, scale: 1.4, zone: 2 },
      { speciesId: 'drownedtoad', pos: [-4.6, 0, -4.4], rotY: 0.5, scale: 1.45, zone: 3 },
      { speciesId: 'seamower', pos: [3.6, 0.1, -10.5], rotY: -0.8, scale: 1.5, zone: 4 },
      { speciesId: 'hoseleech', pos: [-5.8, 0, -16.8], rotY: 0.7, scale: 1.35, zone: 5 },
      { speciesId: 'cisterneel', pos: [4.2, 0.6, -21.5], rotY: -0.5, scale: 1.35, zone: 6 },
      { speciesId: 'seamower', pos: [-0.8, 0.1, -27.5], rotY: 0.2, scale: 1.65, zone: 6 },
    ],
  },
  night: {
    zones: [
      { x: -3.2, z: 13.6, radius: 3.1 },
      { x: 4.2, z: 11.2, radius: 3.5 },
      { x: -6.4, z: 6.4, radius: 3.6 },
      { x: 2.8, z: 1.4, radius: 4.3 },
      { x: -4.4, z: -4.6, radius: 3.7 },
      { x: 5.4, z: -10.8, radius: 2.9 },
      { x: -3.2, z: -17.2, radius: 4.9 },
      { x: 0.4, z: -26.8, radius: 3.3 },
    ],
    cover: [
      { x: -4.2, z: 11.2 },
      { x: 1.2, z: 11.2 },
      { x: -6.4, z: 3.3 },
      { x: 6.4, z: 0.2 },
      { x: -4.4, z: -7.8 },
      { x: 3, z: -10.8 },
      { x: 1.2, z: -17.2 },
      { x: 0.4, z: -29.6 },
    ],
    spawns: [
      { speciesId: 'mooncap', pos: [-3.2, 0, 13.6], rotY: 0.6, scale: 1.35, zone: 0 },
      { speciesId: 'mooncap', pos: [4.2, 0, 11.2], rotY: -0.5, scale: 1.2, zone: 1 },
      { speciesId: 'starbeetle', pos: [-6.4, 0, 6.4], rotY: 0.9, scale: 1.35, zone: 2 },
      { speciesId: 'dewghost', pos: [2.8, 0.3, 1.4], rotY: -0.7, scale: 1.35, zone: 3 },
      { speciesId: 'clockworkfrog', pos: [-4.4, 0, -4.6], rotY: 0.6, scale: 1.4, zone: 4 },
      { speciesId: 'bonsaititan', pos: [5.4, 0, -10.8], rotY: -0.8, scale: 1.5, zone: 5 },
      { speciesId: 'glowmoth', pos: [-3.2, 1.3, -17.2], rotY: 0.5, scale: 1.4, zone: 6 },
      { speciesId: 'gnomejesus', pos: [0.4, 0.15, -26.8], rotY: 0, scale: 1.45, zone: 7 },
    ],
  },
  frost: {
    zones: [
      { x: -4.6, z: 9.9, radius: 4.1 },
      { x: 4.2, z: 11.4, radius: 3.5 },
      { x: 2.8, z: 1.4, radius: 3.9 },
      { x: -4.4, z: -4.6, radius: 4.3 },
      { x: 5.4, z: -11.2, radius: 4 },
      { x: 0.4, z: -25.8, radius: 3.7 },
    ],
    cover: [
      { x: -7.9, z: 11.3 },
      { x: 1.8, z: 9.6 },
      { x: -0.6, z: 1.4 },
      { x: -0.8, z: -5.8 },
      { x: 2.6, z: -13.3 },
      { x: -2.8, z: -25.8 },
    ],
    spawns: [
      { speciesId: 'snowcap', pos: [-3, 0, 13.6], rotY: 0.6, scale: 1.35, zone: 0 },
      { speciesId: 'snowcap', pos: [4.2, 0, 11.4], rotY: -0.5, scale: 1.2, zone: 1 },
      { speciesId: 'icicleimp', pos: [-6.2, 0.3, 6.2], rotY: 0.8, scale: 1.35, zone: 0 },
      { speciesId: 'pinego', pos: [2.8, 0, 1.4], rotY: -0.7, scale: 1.35, zone: 2 },
      { speciesId: 'frosthound', pos: [-4.4, 0, -4.6], rotY: 0.6, scale: 1.4, zone: 3 },
      { speciesId: 'chimneyowl', pos: [5.4, 0.8, -11.2], rotY: -0.8, scale: 1.4, zone: 4 },
      { speciesId: 'frostking', pos: [0.4, 0, -25.8], rotY: 0, scale: 1.5, zone: 5 },
    ],
  },
};

/** Layout for one course: zones, cover spots and spawns (same order as world.ts). */
export function layoutFor(courseId: CourseId): CourseLayout {
  return LAYOUTS[courseId];
}
