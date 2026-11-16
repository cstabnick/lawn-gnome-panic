// Each course's scenery and background show ("someone is playing that game over there"). trackView builds the shared
// parts (ground, mown track, start arch, hedges) and then calls the course's builder here.
import type * as THREE from 'three';
import type { CourseId } from '../../config';
import type { Track } from '../../track';
import { buildGardenShow } from './garden';
import { buildPanicShow } from './panic';
import { buildFrontShow } from './front';
import { buildGolfShow } from './golf';

export interface CourseShow {
  /** Every frame. raceT = race time (0 before GO, keeps counting after), dt = frame seconds. */
  update(raceT: number, dt: number): void;
}

export type ShowBuilder = (scene: THREE.Scene, track: Track) => CourseShow;

const BUILDERS: Record<CourseId, ShowBuilder> = {
  garden: buildGardenShow,
  panic: buildPanicShow,
  front: buildFrontShow,
  golf: buildGolfShow,
};

export function buildCourseShow(course: CourseId, scene: THREE.Scene, track: Track): CourseShow {
  return BUILDERS[course](scene, track);
}
