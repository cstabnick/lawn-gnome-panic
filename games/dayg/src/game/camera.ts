// Low third-person camera (gnome height, so headstones loom) with a first-person toggle; never sinks into blocks.
import * as THREE from 'three';
import { CAMERA } from '../config';
import type { Collider } from '../world/collide';
import type { CameraRig } from './types';

const RAY_STEP = 0.25;
const FP_PITCH = 1.3;

export function createCameraRig(camera: THREE.PerspectiveCamera, collider: Collider): CameraRig {
  let snap = true;
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3();

  const rig: CameraRig = {
    yaw: 0,
    pitch: CAMERA.pitchDefault,
    view: 'third',
    update(target, input, dt, crouched) {
      if (input.view) {
        rig.view = rig.view === 'third' ? 'first' : 'third';
        rig.pitch = rig.view === 'first' ? 0 : CAMERA.pitchDefault;
        snap = true;
      }
      // forward = (sin yaw, 0, cos yaw), right = (-cos yaw, 0, sin yaw): turning right lowers yaw.
      rig.yaw -= input.lookX;
      const sy = Math.sin(rig.yaw), cy = Math.cos(rig.yaw);

      if (rig.view === 'first') {
        // lookY > 0 looks down.
        rig.pitch = Math.min(FP_PITCH, Math.max(-FP_PITCH, rig.pitch + input.lookY));
        const cp = Math.cos(rig.pitch);
        camera.position.set(target.x, target.y + (crouched ? 1.0 : 1.5), target.z);
        look.set(camera.position.x + sy * cp, camera.position.y - Math.sin(rig.pitch), camera.position.z + cy * cp);
        camera.lookAt(look);
        snap = true; // going back to third person starts in place
        return;
      }

      rig.pitch = Math.min(CAMERA.pitchMax, Math.max(CAMERA.pitchMin, rig.pitch + input.lookY));
      const lx = target.x, ly = target.y + CAMERA.height - (crouched ? CAMERA.crouchDrop : 0), lz = target.z;
      const cp = Math.cos(rig.pitch), sp = Math.sin(rig.pitch);
      const dx = -sy * cp, dy = sp, dz = -cy * cp;   // unit ray from the look-at point to the camera

      // Pull in along the ray at the first point inside or under a block.
      let dist: number = CAMERA.distance;
      for (let t = RAY_STEP; t <= CAMERA.distance + 1e-6; t += RAY_STEP) {
        const x = lx + dx * t, y = ly + dy * t, z = lz + dz * t;
        if (collider.groundAt(x, z, y + 200) > y + 0.1) { dist = Math.max(0, t - RAY_STEP); break; }
      }
      desired.set(lx + dx * dist, ly + dy * dist, lz + dz * dist);
      desired.y = Math.max(desired.y, collider.groundAt(desired.x, desired.z, desired.y) + 0.3);

      // Pulling in is instant (smoothing it would sweep through the block); easing back out is smoothed.
      const curDist = Math.hypot(camera.position.x - lx, camera.position.y - ly, camera.position.z - lz);
      if (snap || (dist < CAMERA.distance && curDist > dist + 0.05)) {
        camera.position.copy(desired);
        snap = false;
      } else {
        camera.position.lerp(desired, 1 - Math.exp(-12 * dt));
      }
      camera.lookAt(lx, ly, lz);
    },
  };
  return rig;
}
