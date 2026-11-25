// The Unmown Ranger Station (E31): the building, its yard, the walk-in interior.
// Stub (E31 foundation): issue B1 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';

/** Builds the ranger station on its site and defines its interior. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildRangerStation(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}
