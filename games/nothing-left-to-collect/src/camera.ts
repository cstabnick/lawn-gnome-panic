// Smooth fixed-yaw follow camera: always looks toward -z, four framings, pulled back on portrait screens.
import * as THREE from 'three';
import { CAMERA } from './config';
import type { CameraMode, FollowCamera } from './types';

const SHAKE_TIME = 0.4;

export function createFollowCamera(camera: THREE.PerspectiveCamera): FollowCamera {
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const wantPos = new THREE.Vector3();
  const wantLook = new THREE.Vector3();
  let placed = false;
  let shakeAmount = 0;
  let shakeLeft = 0;

  const desired = (target: THREE.Vector3, mode: CameraMode): number => {
    const c = CAMERA[mode];
    const k = camera.aspect < 1 ? CAMERA.portraitBack : 1;
    wantPos.set(target.x, target.y + c.height * k, target.z + c.back * k);
    wantLook.set(target.x, target.y + c.lookUp, target.z);
    return c.fov;
  };

  const apply = (dt: number): void => {
    camera.position.copy(pos);
    if (shakeLeft > 0) {
      shakeLeft = Math.max(0, shakeLeft - dt);
      const a = shakeAmount * (shakeLeft / SHAKE_TIME);
      camera.position.x += (Math.random() * 2 - 1) * a;
      camera.position.y += (Math.random() * 2 - 1) * a;
      camera.position.z += (Math.random() * 2 - 1) * a * 0.5;
    }
    camera.lookAt(look);
  };

  const setFov = (fov: number): void => {
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  };

  const snap = (target: THREE.Vector3, mode: CameraMode): void => {
    const fov = desired(target, mode);
    pos.copy(wantPos);
    look.copy(wantLook);
    setFov(fov);
    placed = true;
    apply(0);
  };

  return {
    update(dt: number, target: THREE.Vector3, mode: CameraMode) {
      if (!placed) { snap(target, mode); return; }
      const fov = desired(target, mode);
      const k = 1 - Math.exp(-CAMERA.lerp * dt);
      pos.lerp(wantPos, k);
      look.lerp(wantLook, k);
      setFov(camera.fov + (fov - camera.fov) * k);
      apply(dt);
    },
    snap,
    shake(amount: number) {
      shakeAmount = Math.max(amount, shakeLeft > 0 ? shakeAmount * (shakeLeft / SHAKE_TIME) : 0);
      shakeLeft = SHAKE_TIME;
    },
  };
}
