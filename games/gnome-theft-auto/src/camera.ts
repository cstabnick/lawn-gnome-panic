// The floating third-person chase camera: sits behind and above the player gnome (or the mower it drives), orbits
// with mouse / touch drag, drifts back behind on its own, and never ends up inside a building.
import * as THREE from 'three';
import type { CameraMode, ChaseCamera, InputState, World } from './types';
import { angleDiff, insideBox } from './collide';

interface View {
  /** Base distance from the look point. */
  dist: number;
  /** Extra distance per unit/s of target speed. */
  distPerSpeed: number;
  /** Height above the target's origin to look at. */
  lookHeight: number;
  /** Default pitch (radians, positive = looking down). */
  pitch: number;
  /** Seconds without a drag before the yaw drifts back behind the target. */
  followAfter: number;
  /** Yaw drift rate, radians/s. */
  followRate: number;
  /** Target must be moving faster than this (units/s) for the drift to happen. 0 = always. */
  followMinSpeed: number;
  /** Position smoothing rate (higher = tighter). */
  smoothing: number;
}

const VIEW: Record<CameraMode, View> = {
  foot: { dist: 5.5, distPerSpeed: 0, lookHeight: 1.3, pitch: 0.28, followAfter: 1.5, followRate: 1.2, followMinSpeed: 0.5, smoothing: 12 },
  drive: { dist: 8.5, distPerSpeed: 0.12, lookHeight: 1.8, pitch: 0.3, followAfter: 0.8, followRate: 3.5, followMinSpeed: 0, smoothing: 7 },
  // STUB (issue 1D): tune the chute view.
  chute: { dist: 9, distPerSpeed: 0, lookHeight: 1.5, pitch: 0.5, followAfter: 1, followRate: 2, followMinSpeed: 0, smoothing: 8 },
  fly: { dist: 13, distPerSpeed: 0, lookHeight: 1.5, pitch: 0.38, followAfter: 0.8, followRate: 2.5, followMinSpeed: 0, smoothing: 7 },
};

const PITCH_MIN = -0.25;
const PITCH_MAX = 1.2;
/** Seconds without a drag before the pitch eases back to the mode's default. */
const PITCH_RETURN_AFTER = 2;
const PITCH_RETURN_RATE = 0.8;
/** Smallest height the camera may sit at. */
const MIN_Y = 0.4;
/** Step length of the no-clip march, and how far in front of a blocked step the camera stops. */
const MARCH_STEP = 0.4;
const MARCH_BACKOFF = 0.5;
const FOV_BASE = 62;
const FOV_SPEED_MAX = 14;
const FOV_SPEED_GAIN = 0.4;
const FOV_RATE = 4;
const FOV_EPS = 0.05;
const BOB_AMP = 0.04;
const BOB_FREQ = 1.3;

export function createChaseCamera(camera: THREE.PerspectiveCamera): ChaseCamera {
  const chase: ChaseCamera = {
    yaw: 0,
    pitch: VIEW.foot.pitch,
    update(dt: number, target: { x: number; y: number; z: number }, targetYaw: number, mode: CameraMode, input: InputState, world: World) {
      const v = VIEW[mode];

      time += dt;

      // Orbit input, and how long since the player last dragged.
      if (input.camYaw !== 0 || input.camPitch !== 0) sinceDrag = 0;
      else sinceDrag += dt;
      chase.yaw += input.camYaw;
      chase.pitch = clamp(chase.pitch + input.camPitch, PITCH_MIN, PITCH_MAX);

      // Target speed, from its movement since the last frame.
      let speed = 0;
      if (lastTarget) {
        const dx = target.x - lastTarget.x;
        const dy = target.y - lastTarget.y;
        const dz = target.z - lastTarget.z;
        if (dt > 0) speed = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
      }
      lastTarget = { x: target.x, y: target.y, z: target.z };

      // Drift back behind the target when the player is not steering the view.
      if (sinceDrag > v.followAfter && speed >= v.followMinSpeed) {
        const diff = angleDiff(targetYaw, chase.yaw);
        const step = clamp(diff, -v.followRate * dt, v.followRate * dt);
        chase.yaw += step;
      }
      if (sinceDrag > PITCH_RETURN_AFTER) {
        const diff = v.pitch - chase.pitch;
        chase.pitch += clamp(diff, -PITCH_RETURN_RATE * dt, PITCH_RETURN_RATE * dt);
      }
      chase.pitch = clamp(chase.pitch, PITCH_MIN, PITCH_MAX);

      // Desired position: behind the look point along the view direction.
      const look = new THREE.Vector3(target.x, target.y + v.lookHeight, target.z);
      const cp = Math.cos(chase.pitch);
      const fx = Math.sin(chase.yaw) * cp;
      const fy = -Math.sin(chase.pitch);
      const fz = Math.cos(chase.yaw) * cp;
      const distance = v.dist + v.distPerSpeed * speed;
      const desired = new THREE.Vector3(look.x - fx * distance, look.y - fy * distance, look.z - fz * distance);

      if (!smoothed) smoothed = desired.clone();
      else smoothed.lerp(desired, 1 - Math.exp(-v.smoothing * dt));

      // Float: a gentle bob on top of the smoothed position, never below MIN_Y.
      const out = new THREE.Vector3(smoothed.x, smoothed.y + BOB_AMP * Math.sin(time * BOB_FREQ), smoothed.z);
      if (out.y < MIN_Y) out.y = MIN_Y;

      // No clipping: march from the look point towards the camera and stop short of the first blocked step.
      const placed = clipToView(look, out, world);
      camera.position.copy(placed);
      camera.lookAt(look);

      // Widen the lens a little with speed.
      const fovTarget = mode === 'foot' ? FOV_BASE : FOV_BASE + Math.min(FOV_SPEED_MAX, speed * FOV_SPEED_GAIN);
      camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-FOV_RATE * dt));
      if (Math.abs(camera.fov - appliedFov) > FOV_EPS) {
        camera.updateProjectionMatrix();
        appliedFov = camera.fov;
      }
    },
    kick() {}, // STUB (issue 1D)
    aimDir(out: THREE.Vector3) {
      camera.getWorldDirection(out);
      out.y += 0.06;
      return out.normalize();
    },
  };

  let time = 0;
  let sinceDrag = 1e9;
  let smoothed: THREE.Vector3 | null = null;
  let lastTarget: { x: number; y: number; z: number } | null = null;
  let appliedFov = camera.fov;

  return chase;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Walk from `from` towards `to`; return the furthest point reachable before a box, backed off by MARCH_BACKOFF. */
function clipToView(from: THREE.Vector3, to: THREE.Vector3, world: World): THREE.Vector3 {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  if (len < 1e-6) return to.clone();
  dir.divideScalar(len);
  for (let s = MARCH_STEP; s - MARCH_STEP < len; s += MARCH_STEP) {
    const d = Math.min(s, len);
    const x = from.x + dir.x * d;
    const y = from.y + dir.y * d;
    const z = from.z + dir.z * d;
    if (insideBox(x, y, z, world.boxes)) {
      const back = Math.max(0, d - MARCH_BACKOFF);
      return new THREE.Vector3(from.x + dir.x * back, from.y + dir.y * back, from.z + dir.z * back);
    }
  }
  return to.clone();
}
