// Mittenholt, the Snowcap Rise hamlet (E31).
// Stub (E31 foundation): issue D3 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';

/** Builds Mittenholt. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildMittenholt(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}

/** The people of Mittenholt (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function mittenholtPeople(): AmbientGnomeDef[] {
  return [];
}
