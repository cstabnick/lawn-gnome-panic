import * as THREE from 'three';
import type { SkaterState } from '../sim/skater';

export interface ChaseCamera {
  yaw: number;
  pitch: number;
  shake(intensity: number, duration?: number): void;
  fovPunch(delta: number): void;
  snap(
    cam: THREE.PerspectiveCamera,
    s: SkaterState,
    getGroundY?: (x: number, z: number) => number,
  ): void;
  update(
    cam: THREE.PerspectiveCamera,
    s: SkaterState,
    dt: number,
    orbitDeltaX: number,
    getGroundY?: (x: number, z: number) => number,
    beatPulse?: number,
    energyNorm?: number,
  ): void;
}

export function createChaseCamera(initialYaw = Math.PI): ChaseCamera {
  const pos = new THREE.Vector3(0, 6, 46);
  const lookAt = new THREE.Vector3(0, 1.5, 36);
  const targetPosVec = new THREE.Vector3();
  const targetLookVec = new THREE.Vector3();
  let shakeIntensity = 0;
  let shakeTime = 0;
  let shakeDur = 0.2;
  let fovOffset = 0;
  let manualOrbitTimer = 0;
  let camRoll = 0;

  const state: ChaseCamera = {
    yaw: initialYaw,
    pitch: 0.36,
    shake(intensity, duration = 0.2) {
      shakeIntensity = Math.max(shakeIntensity, intensity);
      shakeDur = Math.max(0.05, duration);
      shakeTime = shakeDur;
    },
    fovPunch(delta) {
      fovOffset = Math.max(-6, Math.min(10, fovOffset + delta));
    },
    snap(cam, s, getGroundY) {
      state.yaw = s.yaw;
      camRoll = 0;
      fovOffset = 0;
      const targetX = s.x - Math.sin(state.yaw) * 10.8;
      const targetZ = s.z - Math.cos(state.yaw) * 10.8;
      const targetY = getGroundY
        ? Math.max(s.y + 4.9, getGroundY(targetX, targetZ) + 1.3)
        : s.y + 4.9;
      pos.set(targetX, targetY, targetZ);
      lookAt.set(s.x + Math.sin(state.yaw) * 3, s.y + 1.4, s.z + Math.cos(state.yaw) * 3);
      cam.position.copy(pos);
      cam.up.set(0, 1, 0);
      cam.lookAt(lookAt);
      cam.fov = 60;
      cam.updateProjectionMatrix();
    },
    update(cam, s, dt, orbitDeltaX, getGroundY, beatPulse = 0, energyNorm = 0) {
      if (Math.abs(orbitDeltaX) > 0.0001) {
        state.yaw -= orbitDeltaX;
        manualOrbitTimer = 1.2;
      } else {
        manualOrbitTimer = Math.max(0, manualOrbitTimer - dt);
        if (manualOrbitTimer <= 0) {
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
      }

      const dist = s.grinding ? 9.5 : 10.8;
      const height = s.grinding ? 4.4 : 4.9;
      const targetX = s.x - Math.sin(state.yaw) * dist;
      const targetZ = s.z - Math.cos(state.yaw) * dist;
      let targetY = s.y + height;
      if (getGroundY && s.y >= -1.0) {
        targetY = Math.max(targetY, getGroundY(targetX, targetZ) + 1.3);
      }

      const k = Math.min(1, dt * 7.5);
      targetPosVec.set(targetX, targetY, targetZ);
      targetLookVec.set(s.x + Math.sin(state.yaw) * 3, s.y + 1.4, s.z + Math.cos(state.yaw) * 3);
      pos.lerp(targetPosVec, k);
      lookAt.lerp(targetLookVec, k);

      cam.position.copy(pos);
      if (getGroundY && s.y >= -1.0) {
        cam.position.y = Math.max(cam.position.y, getGroundY(cam.position.x, cam.position.z) + 1.3);
      }
      const spdNow = Math.hypot(s.vx, s.vz);
      const grooveShake =
        beatPulse * energyNorm * 0.065 +
        Math.max(0, Math.min(1, (spdNow - 18) / 20)) * (s.boosting || s.speedMode ? 0.045 : 0.02);
      if (shakeTime > 0 || grooveShake > 0.005) {
        let mag = grooveShake;
        if (shakeTime > 0) {
          shakeTime = Math.max(0, shakeTime - dt);
          const falloff = shakeTime / shakeDur;
          mag += shakeIntensity * falloff * falloff;
          if (shakeTime === 0) shakeIntensity = 0;
        }
        cam.position.x += (Math.random() * 2 - 1) * mag;
        cam.position.y += (Math.random() * 2 - 1) * mag * 0.75;
        cam.position.z += (Math.random() * 2 - 1) * mag;
      }

      const targetRoll = s.wallRiding ? s.wallSide * 0.14 : -s.lean * 0.16;
      camRoll += (targetRoll - camRoll) * Math.min(1, dt * 7);
      cam.up.set(Math.sin(camRoll), Math.cos(camRoll), 0);
      cam.lookAt(lookAt);

      fovOffset *= Math.max(0, 1 - dt * 8);
      const spd = Math.hypot(s.vx, s.vz);
      const targetFov = 60 + Math.min(12, Math.max(0, spd - 12) * 0.75 + (s.boosting ? 5 : 0)) + fovOffset;
      if (Math.abs(cam.fov - targetFov) > 0.05) {
        cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 6);
        cam.updateProjectionMatrix();
      }
    },
  };
  return state;
}
