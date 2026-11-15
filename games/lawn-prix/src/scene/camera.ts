// Chase camera behind a kart. Used by the full game and the party slice.
import type * as THREE from 'three';
import type { KartState } from '../config';
import { CAMERA } from '../config';

/** Follow k from behind and above (CAMERA in config.ts). snap = jump there at once (race start). */
export function updateChaseCamera(camera: THREE.PerspectiveCamera, k: Readonly<KartState>, dt: number, snap = false): void {
  const fx = Math.sin(k.h);
  const fz = Math.cos(k.h);
  const a = snap ? 1 : 1 - Math.exp(-dt * CAMERA.follow);

  const wantX = k.x - fx * CAMERA.distance;
  const wantY = CAMERA.height;
  const wantZ = k.z - fz * CAMERA.distance;
  camera.position.x += (wantX - camera.position.x) * a;
  camera.position.y += (wantY - camera.position.y) * a;
  camera.position.z += (wantZ - camera.position.z) * a;
  camera.lookAt(k.x + fx * CAMERA.lookAhead, CAMERA.lookHeight, k.z + fz * CAMERA.lookAhead);

  const speed = Math.hypot(k.vx, k.vz);
  const wantFov = CAMERA.fov + Math.min(12, speed * 0.5) + (k.boost > 0 ? 6 : 0);
  const fov = camera.fov + (wantFov - camera.fov) * a;
  if (Math.abs(fov - camera.fov) > 0.05) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
}
