// Reedmere (E31): reed beds round the marsh water, the raised boardwalk and the viewing platform.
// Stub (E31 foundation): issue B2 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';

/** Builds the Reedmere boardwalk, platform and reeds. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildReedmere(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}
