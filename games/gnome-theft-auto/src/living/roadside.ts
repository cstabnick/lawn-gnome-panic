// Roadside life along the outer band roads (E31): lay-bys, fingerposts, milestones, bus shelters, wayside shrines.
// Stub (E31 foundation): issue D6 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';

/** Builds the roadside pieces along the band roads. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildRoadside(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}
