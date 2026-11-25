// E33: guard rails along the mountain roads where the ground falls away or a hairpin turns. railRuns() is the pure
// plan (which stretches get a rail); buildGuardRails puts the prefab sections and their colliders in the world.
// FOUNDATION STUB: issue E3 fills it in.
import type * as THREE from 'three';
import type { Box } from '../types';
import type { RouteId } from './routes';

/** One continuous rail: along route `route` from s0 to s1 (s0 < s1), on side `side` (+1 = left of travel, -1 = right). */
export interface RailRun { route: RouteId; side: 1 | -1; s0: number; s1: number }

/** Every guard-rail run on every 'road' route. Pure. */
export function railRuns(): RailRun[] {
  return [];
}

export function buildGuardRails(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}
