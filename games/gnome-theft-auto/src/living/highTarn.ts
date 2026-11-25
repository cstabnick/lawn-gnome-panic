// The High Tarn on Snowcap Rise (E31): the bothy, the jetty, the cairn.
// Stub (E31 foundation): issue D5 fills it. Keep the exported signature.
import type * as THREE from 'three';
import type { Box } from '../types';
import type { AmbientGnomeDef } from '../ambientGnomes';

/** Builds the High Tarn. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildHighTarn(scene: THREE.Scene, boxes: Box[]): void {
  void scene; void boxes;
}

/** The people at the High Tarn (ambient gnomes with a speech bubble). living/runtime.ts shows them. */
export function highTarnPeople(): AmbientGnomeDef[] {
  return [];
}
