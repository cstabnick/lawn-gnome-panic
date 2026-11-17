// Chase camera: sits behind your direction of travel (not your board, so spins never whip it around), pulls back
// and widens with speed, leans into carves, dips with drops, shakes on hard landings, never clips into an island.
import * as THREE from 'three';
import type { Player, PhysEvent } from './config';
import { groundAt, type World } from './world';

export interface ChaseCam {
  update(p: Player, pos: THREE.Vector3, dt: number, steer: number, events: PhysEvent[], trainMode?: boolean): void;
  /** Snap behind the rider (after a respawn or warp). */
  snap(): void;
}

const BASE_FOV = 68;

export function createChaseCam(camera: THREE.PerspectiveCamera, w: World): ChaseCam {
  let yaw = 0;
  let pitch = 0;
  let roll = 0;
  let fov = BASE_FOV;
  let dist = 6;
  let shake = 0;
  let snapNext = true;
  const want = new THREE.Vector3();
  const look = new THREE.Vector3();
  const lookSm = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  const angLerp = (a: number, b: number, k: number): number => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;

  return {
    snap() {
      snapNext = true;
    },
    update(p, pos, dt, steer, events, trainMode = false) {
      for (const e of events) {
        if (e.e === 'land') shake = Math.max(shake, Math.min(1, e.impact / 30));
        if (e.e === 'bail') shake = 1;
        if (e.e === 'respawn' || e.e === 'warp' || e.e === 'skyfall') snapNext = true;
      }
      const speed = p.vel.length();
      const hs = Math.hypot(p.vel.x, p.vel.z);
      const travelYaw = hs > 3 ? Math.atan2(p.vel.x, p.vel.z) : p.heading + (p.switchStance ? Math.PI : 0);
      const travelPitch = Math.atan2(p.vel.y, Math.max(hs, 1));
      const air = p.mode === 'air';

      const kYaw = snapNext ? 1 : 1 - Math.exp(-(air ? 2.2 : 5) * dt);
      yaw = angLerp(yaw, travelYaw, kYaw);
      const kPitch = snapNext ? 1 : 1 - Math.exp(-3 * dt);
      pitch += (THREE.MathUtils.clamp(travelPitch * 0.45, -0.5, 0.35) - pitch) * kPitch;
      const targetRoll = p.mode === 'ground' ? -steer * 0.07 * Math.min(1, speed / 25) : 0;
      roll += (targetRoll - roll) * (1 - Math.exp(-6 * dt));

      const speedK = THREE.MathUtils.clamp((speed - 8) / 45, 0, 1);
      const trainDist = trainMode ? 9.5 : 0;
      const trainHeight = trainMode ? 3.5 : 0;
      dist += (6 + trainDist + speedK * 3.2 + (p.boosting ? 1 : 0) - dist) * (1 - Math.exp(-3 * dt));
      const height = 2.1 + trainHeight + speedK * 0.6;

      // Behind the travel direction, tilted with the drop.
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      want.set(pos.x - fx * dist * Math.cos(pitch), pos.y + height - Math.sin(pitch) * dist, pos.z - fz * dist * Math.cos(pitch));
      const g = groundAt(w, want.x, want.z, want.y + 3);
      if (g && want.y < g.y + 1.2) want.y = g.y + 1.2;
      if (snapNext) camera.position.copy(want);
      else camera.position.lerp(want, 1 - Math.exp(-12 * dt));

      look.set(pos.x + fx * 5, pos.y + 1.1 + (trainMode ? 1.8 : 0) + Math.sin(pitch) * 4, pos.z + fz * 5);
      if (snapNext) lookSm.copy(look);
      else lookSm.lerp(look, 1 - Math.exp(-14 * dt));
      camera.up.set(0, 1, 0);
      camera.lookAt(lookSm);
      camera.rotateZ(roll);

      if (shake > 0.01) {
        const s = shake * 0.18;
        camera.position.add(tmp.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s));
        shake *= Math.exp(-7 * dt);
      }

      // Portrait screens: widen the vertical FOV so you still see about as much to the sides.
      const aspect = camera.aspect;
      const base = aspect < 1.2 ? Math.min(100, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * 1.2 / aspect))) : BASE_FOV;
      const fovTarget = Math.min(115, base + speedK * 30 + (p.boosting ? 8 : 0));
      fov += (fovTarget - fov) * (1 - Math.exp(-4 * dt));
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      snapNext = false;
    },
  };
}
