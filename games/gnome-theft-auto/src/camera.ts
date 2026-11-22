// The floating third-person chase camera: sits behind and above the player gnome (or the mower it drives), orbits
// with mouse / touch drag, drifts back behind on its own, and never ends up inside a building. On foot and under the
// chute it sits over the gnome's right shoulder so the crosshair (screen centre) is clear of the body.
import * as THREE from 'three';
import type { CameraMode, ChaseCamera, InputState, World } from './types';
import { angleDiff, insideBox, pushOutOfBoxes } from './collide';

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
  foot: { dist: 4.6, distPerSpeed: 0, lookHeight: 1.5, pitch: 0.12, followAfter: 1.5, followRate: 0, followMinSpeed: 0.5, smoothing: 12 },
  drive: { dist: 8.5, distPerSpeed: 0.12, lookHeight: 1.8, pitch: 0.2, followAfter: 0.8, followRate: 3.5, followMinSpeed: 0, smoothing: 7 },
  chute: { dist: 9, distPerSpeed: 0, lookHeight: 1.5, pitch: 0.35, followAfter: 1, followRate: 0, followMinSpeed: 0, smoothing: 8 },
  fly: { dist: 16, distPerSpeed: 0.1, lookHeight: 1.5, pitch: 0.22, followAfter: 0.8, followRate: 2.5, followMinSpeed: 0, smoothing: 7 },
};

const PITCH_MIN = -0.5;
const PITCH_MAX = 1.2;
/** Seconds without a drag before the pitch eases back to the mode's default. */
const PITCH_RETURN_AFTER = 2;
const PITCH_RETURN_RATE = 0.8;
/** Over-the-shoulder offset (units) to the gnome's right, on foot and under the chute. */
const SHOULDER = 0.7;
/** Gun recoil: the view kick is clamped to this (radians) and decays at this rate per second. */
const RECOIL_MAX = 0.15;
const RECOIL_DECAY = 9;
/** Smallest height the camera may sit at. */
const MIN_Y = 0.4;
/** Step length of the no-clip march, and how far in front of a blocked step the camera stops. */
const MARCH_STEP = 0.25;
const MARCH_BACKOFF = 0.35;
const CAM_RADIUS = 0.32;
const MIN_CAM_DIST = 0.55;
const CLIP_RECOVER_RATE = 10;
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
    update(
      dt: number,
      target: { x: number; y: number; z: number },
      targetYaw: number,
      mode: CameraMode,
      input: InputState,
      world: World,
      extra?: { boost?: boolean; airborne?: boolean },
    ) {
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

      // Gun recoil and camera shake settle back to zero.
      recoil *= Math.exp(-RECOIL_DECAY * dt);
      shakeAmt *= Math.exp(-9 * dt);
      if (shakeAmt < 0.001) shakeAmt = 0;

      // Over-the-shoulder: ease the sideways offset in and out (foot and chute only), and clip against nearby walls.
      const shoulderTarget = mode === 'foot' || mode === 'chute' ? SHOULDER : 0;
      shoulder += (shoulderTarget - shoulder) * (1 - Math.exp(-v.smoothing * dt));
      const rightX = -Math.cos(chase.yaw);
      const rightZ = Math.sin(chase.yaw);

      // Desired position: behind the look point along the view direction. Recoil lifts the view, so the
      // placement uses the pitch minus the kick.
      const pivot = new THREE.Vector3(target.x, target.y + v.lookHeight, target.z);
      const rawLook = new THREE.Vector3(target.x + rightX * shoulder, target.y + v.lookHeight, target.z + rightZ * shoulder);
      const look = shoulder > 0.01 ? clipPoint(pivot, rawLook, world, 0.25) : pivot;
      const effPitch = chase.pitch - recoil;
      const cp = Math.cos(effPitch);
      const fx = Math.sin(chase.yaw) * cp;
      const fy = -Math.sin(effPitch);
      const fz = Math.cos(chase.yaw) * cp;
      const stuntPull = extra?.airborne ? 2.8 : 0;
      const distance = v.dist + v.distPerSpeed * speed + stuntPull;
      const desired = new THREE.Vector3(look.x - fx * distance, look.y - fy * distance, look.z - fz * distance);

      if (!smoothed) smoothed = desired.clone();
      else smoothed.lerp(desired, 1 - Math.exp(-v.smoothing * dt));

      // Float: a gentle bob on top of the smoothed position, never below MIN_Y.
      const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
      const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 0.7 : 0;
      const sz = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
      const out = new THREE.Vector3(smoothed.x + sx, smoothed.y + BOB_AMP * Math.sin(time * BOB_FREQ) + sy, smoothed.z + sz);
      if (out.y < MIN_Y) out.y = MIN_Y;

      // No clipping: pull in immediately on wall contact, ease back out smoothly when clear.
      const rawDist = look.distanceTo(out);
      const safeDist = clipDist(look, out, world);
      if (clippedDist < 0 || safeDist < clippedDist) clippedDist = safeDist;
      else clippedDist += (safeDist - clippedDist) * (1 - Math.exp(-CLIP_RECOVER_RATE * dt));
      const useDist = Math.min(rawDist, clippedDist);
      const placed = rawDist > 1e-5
        ? new THREE.Vector3().lerpVectors(look, out, useDist / rawDist)
        : look.clone();
      if (placed.y < MIN_Y) placed.y = MIN_Y;
      camera.position.copy(placed);
      if (placed.distanceTo(look) > 0.25) {
        camera.lookAt(look);
      } else {
        camera.lookAt(placed.x + fx * 10, placed.y + fy * 10, placed.z + fz * 10);
      }

      // Widen the lens a little with speed and turbo boost.
      const boostFov = extra?.boost ? 6 : 0;
      const fovTarget = mode === 'foot' ? FOV_BASE : FOV_BASE + Math.min(FOV_SPEED_MAX, speed * FOV_SPEED_GAIN + boostFov);
      camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-FOV_RATE * dt));
      if (Math.abs(camera.fov - appliedFov) > FOV_EPS) {
        camera.updateProjectionMatrix();
        appliedFov = camera.fov;
      }
    },
    kick(pitch: number) {
      recoil = clamp(recoil + pitch, 0, RECOIL_MAX);
    },
    shake(amount: number) {
      shakeAmt = Math.min(0.65, shakeAmt + amount);
    },
    aimDir(out: THREE.Vector3) {
      camera.getWorldDirection(out);
      return out.normalize();
    },
  };

  let time = 0;
  let sinceDrag = 1e9;
  let smoothed: THREE.Vector3 | null = null;
  let lastTarget: { x: number; y: number; z: number } | null = null;
  let appliedFov = camera.fov;
  let recoil = 0;
  let shakeAmt = 0;
  let shoulder = 0;
  let clippedDist = -1;

  return chase;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function isBlocked(x: number, y: number, z: number, radius: number, world: World): boolean {
  return pushOutOfBoxes(x, z, radius, world.boxes, y - 0.15).hit || insideBox(x, y, z, world.boxes);
}

/** Walk from `from` towards `to`; return the furthest point reachable before a box. */
function clipPoint(from: THREE.Vector3, to: THREE.Vector3, world: World, radius: number): THREE.Vector3 {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  if (len < 1e-6) return to.clone();
  dir.divideScalar(len);
  for (let s = MARCH_STEP; s - MARCH_STEP < len; s += MARCH_STEP) {
    const d = Math.min(s, len);
    const x = from.x + dir.x * d;
    const y = from.y + dir.y * d;
    const z = from.z + dir.z * d;
    if (isBlocked(x, y, z, radius, world)) {
      const back = Math.max(0, d - MARCH_STEP);
      return new THREE.Vector3(from.x + dir.x * back, from.y + dir.y * back, from.z + dir.z * back);
    }
  }
  return to.clone();
}

/** Walk from `from` towards `to`; return the max unobstructed distance, backed off by MARCH_BACKOFF. */
function clipDist(from: THREE.Vector3, to: THREE.Vector3, world: World): number {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  if (len < 1e-6) return len;
  dir.divideScalar(len);
  for (let s = MARCH_STEP; s - MARCH_STEP < len; s += MARCH_STEP) {
    const d = Math.min(s, len);
    const x = from.x + dir.x * d;
    const y = from.y + dir.y * d;
    const z = from.z + dir.z * d;
    if (isBlocked(x, y, z, CAM_RADIUS, world)) {
      return Math.max(MIN_CAM_DIST, d - MARCH_BACKOFF);
    }
  }
  return len;
}
