// The Unmown's story vignettes and Oldroot Wood (E31).
// Stub (E31 foundation): issue B5 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';

/** Builds the preserve vignettes, Oldroot Wood dressing and the Last Dandelion. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildUnmownVignettes(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}

/** The people of the Unmown: the rangers and the visitors (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function unmownPeople(): AmbientGnomeDef[] {
  return [];
}
