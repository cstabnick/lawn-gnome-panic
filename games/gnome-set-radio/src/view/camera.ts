import * as THREE from 'three';
import type { SkaterState } from '../sim/skater';

export interface ChaseCamera {
  yaw: number;
  pitch: number;
  update(cam: THREE.PerspectiveCamera, s: SkaterState, dt: number, orbitDeltaX: number): void;
}

export function createChaseCamera(initialYaw = Math.PI): ChaseCamera {
  const pos = new THREE.Vector3(0, 6, 46);
  const lookAt = new THREE.Vector3(0, 1.5, 36);

  const state: ChaseCamera = {
    yaw: initialYaw,
    pitch: 0.36,
    update(cam, s, dt, orbitDeltaX) {
      if (Math.abs(orbitDeltaX) > 0.0001) {
        state.yaw -= orbitDeltaX;
      } else {
        // Gently follow skater travel direction when not manually orbiting
        const spd = Math.hypot(s.vx, s.vz);
        if (spd > 2.0) {
          const travelYaw = Math.atan2(s.vx, s.vz);
          let diff = travelYaw - state.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          state.yaw += diff * Math.min(1, dt * 2.2);
        }
      }

      const dist = s.grinding ? 9.5 : 10.8;
      const height = s.grinding ? 4.4 : 4.9;
      const targetX = s.x - Math.sin(state.yaw) * dist;
      const targetZ = s.z - Math.cos(state.yaw) * dist;
      const targetY = s.y + height;

      const k = Math.min(1, dt * 7.5);
      pos.lerp(new THREE.Vector3(targetX, targetY, targetZ), k);
      lookAt.lerp(new THREE.Vector3(s.x + Math.sin(state.yaw) * 3, s.y + 1.4, s.z + Math.cos(state.yaw) * 3), k);

      cam.position.copy(pos);
      cam.lookAt(lookAt);

      const spd = Math.hypot(s.vx, s.vz);
      const targetFov = 60 + Math.min(12, Math.max(0, spd - 12) * 0.75 + (s.boosting ? 5 : 0));
      if (Math.abs(cam.fov - targetFov) > 0.05) {
        cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 6);
        cam.updateProjectionMatrix();
      }
    },
  };
  return state;
}
