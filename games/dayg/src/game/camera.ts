// Low third-person camera (gnome height, so headstones loom) with a first-person toggle; never sinks into blocks.
// Inside a building it ignores the cut-away roof and upper floors, keeps clear of walls and ceilings, and goes close-follow when squeezed.
import * as THREE from 'three';
import { CAMERA, INTERIOR } from '../config';
import type { Collider } from '../world/collide';
import type { CameraRig, InputState } from './types';
import type { InteriorState } from './interior';

const FP_PITCH = 1.3;
const RAY_STEP = 0.25;
const EMPTY: ReadonlySet<string> = new Set<string>();

export interface PoseIn {
  target: { x: number; y: number; z: number }; yaw: number; pitch: number; crouched: boolean;
  maxDist: number; skip: ReadonlySet<string>; ceilY: number | null;
}
export interface PoseOut { x: number; y: number; z: number; dist: number; lx: number; ly: number; lz: number }

/** Where the third-person camera wants to be: pulled in along the ray from the look point until a block (within solidPad) or the ceiling. */
export function thirdPersonPose(collider: Collider, p: PoseIn): PoseOut {
  const sy = Math.sin(p.yaw), cy = Math.cos(p.yaw);
  const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch);
  const lx = p.target.x, ly = p.target.y + CAMERA.height - (p.crouched ? CAMERA.crouchDrop : 0), lz = p.target.z;
  const dx = -sy * cp, dy = sp, dz = -cy * cp;   // unit ray from the look-at point to the camera

  let dist = p.maxDist;
  for (let t = RAY_STEP; t <= p.maxDist + 1e-6; t += RAY_STEP) {
    if (collider.solidAt(lx + dx * t, ly + dy * t, lz + dz * t, INTERIOR.solidPad, p.skip)) {
      dist = Math.max(0, t - RAY_STEP);
      break;
    }
  }
  if (p.ceilY !== null && dy > 0) dist = Math.min(dist, Math.max(0, (p.ceilY - INTERIOR.ceilPad - ly) / dy));

  const x = lx + dx * dist, z = lz + dz * dist;
  const y0 = ly + dy * dist;
  const y = Math.max(y0, collider.groundAt(x, z, y0) + 0.3);
  return { x, y, z, dist, lx, ly, lz };
}

export function createCameraRig(camera: THREE.PerspectiveCamera, collider: Collider, interior?: { state: InteriorState }): CameraRig {
  let snap = true;
  let wasInside = false;
  let pitchTarget: number | null = null;   // eases the pitch up when the player walks in
  let closeHold = 0;
  const desired = new THREE.Vector3();
  const look = new THREE.Vector3();

  const rig: CameraRig = {
    yaw: 0,
    pitch: CAMERA.pitchDefault,
    view: 'third',
    close: false,
    update(target, input: InputState, dt, crouched) {
      const inside = !!interior && interior.state.building != null;
      if (inside && !wasInside) pitchTarget = Math.max(rig.pitch, INTERIOR.pitchEnter);
      wasInside = inside;

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
        rig.close = true;
        pitchTarget = null;
        closeHold = 0;
        return;
      }

      // The ease toward pitchTarget yields to the player's own look input.
      if (pitchTarget !== null) {
        if (input.lookY !== 0) pitchTarget = null;
        else {
          rig.pitch += (pitchTarget - rig.pitch) * (1 - Math.exp(-3 * dt / INTERIOR.pitchEaseSeconds));
          if (Math.abs(pitchTarget - rig.pitch) < 0.01) pitchTarget = null;
        }
      }
      const pMin = inside ? INTERIOR.pitchMin : CAMERA.pitchMin;
      const pMax = inside ? INTERIOR.pitchMax : CAMERA.pitchMax;
      rig.pitch = Math.min(pMax, Math.max(pMin, rig.pitch + input.lookY));

      const maxDist = inside ? INTERIOR.distance : CAMERA.distance;
      const pose = thirdPersonPose(collider, {
        target, yaw: rig.yaw, pitch: rig.pitch, crouched, maxDist,
        skip: inside && interior ? interior.state.skip : EMPTY,
        ceilY: inside && interior ? interior.state.ceilY : null,
      });

      if (!rig.close && pose.dist < INTERIOR.closeAt) {
        rig.close = true;
        closeHold = 0;
      } else if (rig.close) {
        if (pose.dist >= INTERIOR.closeExitAt) closeHold += dt;
        else closeHold = 0;
        if (closeHold >= INTERIOR.closeHold) {
          rig.close = false;
          closeHold = 0;
          snap = true;
        }
      }

      if (rig.close) {
        // Close-follow: just behind the gnome's head, looking where the gnome looks, tilted by the pitch.
        const g = Math.min(1.3, Math.max(-1.3, rig.pitch - CAMERA.pitchDefault));
        camera.position.set(target.x - 0.2 * sy, target.y + (crouched ? 1.0 : 1.5), target.z - 0.2 * cy);
        look.set(camera.position.x + sy * Math.cos(g), camera.position.y - Math.sin(g), camera.position.z + cy * Math.cos(g));
        camera.lookAt(look);
        return;
      }

      desired.set(pose.x, pose.y, pose.z);
      // Pulling in is instant (smoothing it would sweep through the block); easing back out is smoothed.
      const curDist = Math.hypot(camera.position.x - pose.lx, camera.position.y - pose.ly, camera.position.z - pose.lz);
      if (snap || (pose.dist < maxDist && curDist > pose.dist + 0.05)) {
        camera.position.copy(desired);
        snap = false;
      } else {
        camera.position.lerp(desired, 1 - Math.exp(-12 * dt));
      }
      camera.lookAt(pose.lx, pose.ly, pose.lz);
    },
  };
  return rig;
}
