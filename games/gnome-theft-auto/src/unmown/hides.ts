// The Unmown bird hides (E31): Reedmere Hide, Meadow Hide, Wood Hide.
// Stub (E31 foundation): issue B3 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';

/** Builds the three bird hides. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildUnmownHides(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}
