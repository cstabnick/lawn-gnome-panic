// STUB (Epic 2 fills this in): chase camera behind a kart. Used by the full game and the party slice.
import type * as THREE from 'three';
import type { KartState } from '../config';

/** Follow k from behind and above (CAMERA in config.ts). snap = jump there at once (race start). */
export function updateChaseCamera(camera: THREE.PerspectiveCamera, k: Readonly<KartState>, dt: number, snap = false): void {
  void dt; void snap;
  camera.position.set(k.x - Math.sin(k.h) * 6, 3, k.z - Math.cos(k.h) * 6);
  camera.lookAt(k.x, 1, k.z);
}
