// STUB: little particle effects. Filled in by its own issue; keep these signatures.
import * as THREE from 'three';

export type FxKind = 'heart' | 'bubble' | 'sparkle' | 'zzz' | 'dust' | 'crumb' | 'splash' | 'note';

export interface Fx {
  /** Burst `count` particles of kind at world position pos. */
  spawn(kind: FxKind, pos: THREE.Vector3, count?: number): void;
  update(dt: number): void;
}

export function createFx(scene: THREE.Scene): Fx {
  void scene;
  return { spawn: () => {}, update: () => {} };
}
