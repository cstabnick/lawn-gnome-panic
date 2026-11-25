// The Unmown's trail furniture (E31): waymarkers, fingerposts, rules boards, interpretive panels, benches.
// Stub (E31 foundation): issue B4 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';

/** Dresses trail/unmown-loop and trail/reedmere-boardwalk. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildUnmownTrails(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}
