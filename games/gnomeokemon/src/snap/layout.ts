// Course layouts: where Gnomokemon live, the zone each roams in, and the cover they hide in.
// Read from the course level documents (levels.ts); a creature's height is its lift above the ground under it.

import { courseCover, courseCreatures, courseZones, groundHeight } from './levels';
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

/** A creature placed in a course. `zone` indexes the layout's zones. `pos` is its spawn point in the world. */
export interface LayoutSpawn {
  speciesId: string;
  pos: [number, number, number];
  rotY: number;
  scale?: number;
  zone: number;
  /** Height above the ground under it; kept while the creature roams. */
  lift: number;
  /** Bobbing amplitude for a creature on water (0 or undefined: none). */
  bob?: number;
  phase?: number;
}

export interface CourseLayout {
  /** Roam zones. Every spawn's `zone` index points into this array. */
  zones: readonly Zone[];
  cover: readonly CoverSpot[];
  spawns: readonly LayoutSpawn[];
}

/** Layout for one course: zones, cover spots and spawns (in the order of the level document). */
export function layoutFor(courseId: CourseId): CourseLayout {
  return {
    zones: courseZones(courseId),
    cover: courseCover(courseId),
    spawns: courseCreatures(courseId).map((c) => ({
      speciesId: c.speciesId,
      pos: [c.x, groundHeight(courseId, c.x, c.z) + c.lift, c.z],
      rotY: c.rotY,
      scale: c.scale,
      zone: c.zone,
      lift: c.lift,
      bob: c.bob,
      phase: c.phase,
    })),
  };
}
