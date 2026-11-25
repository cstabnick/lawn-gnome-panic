// The floating third-person chase camera: sits behind and above the player gnome (or the mower it drives), orbits
// with mouse / touch drag, drifts back behind on its own, and never ends up inside a building. On foot and under the
// chute it sits over the gnome's right shoulder so the crosshair (screen centre) is clear of the body.
import * as THREE from 'three';
import type { CameraMode, ChaseCamera, InputState, World } from './types';
import { angleDiff, insideBox, pushOutOfBoxes } from './collide';
import { groundAt, heightAt } from './terrain';
import { isInteriorPoint } from './interiors/space';
import { deckCeilingAbove } from './highways/deck';
import { AIM } from './gunMods';
import { SHAKE_FACTOR, getShakeLevel } from './viewPrefs';

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
/** Anti-jump tuning: how fast the shoulder look point and the camera distance ease inward, and when a change counts. */
export const CAM_STEADY = {
  /** Shoulder look point: ease-in rate per second (out uses CLIP_RECOVER_RATE). */
  shoulderInRate: 25,
  /** Camera distance: ease-in rate per second. */
  clipInRate: 30,
  /** Ignore changes of the safe distance smaller than this (metres). */
  hysteresis: 0.15,
  /** A clip distance change above this (metres) within `jumpWindow` seconds pauses the yaw auto-follow. */
  jumpDist: 0.5,
  jumpWindow: 0.2,
  /** The look target blends from the view direction to the look point between these camera-to-look distances. */
  lookBlendMin: 0.25,
  lookBlendMax: 0.6,
  /** Rising ground only blocks the camera above this rise, and below this height over it. */
  groundRise: 0.8,
  groundBand: 0.3,
  /** Look-ahead: the safe distance also counts rays turned up to `feelerSpread` radians either side, each allowed `feelerSlope` metres more per radian. This makes the distance change gradually as a corner swings into the ray. */
  feelerSpread: 0.85,
  feelerStep: 0.06,
  feelerDepth: 4,
  feelerSlope: 10,
};
/** First person: field of view, near plane, pitch limit (radians). */
export const FP_FOV = 75;
const FP_NEAR = 0.05;
const FP_PITCH = 1.2;
/** Every shake(amount) is multiplied by this and by the Options level (viewPrefs.ts SHAKE_FACTOR), then capped at SHAKE_CAP. */
export const SHAKE_SCALE = 0.4;
export const SHAKE_CAP = 0.3;
const FOV_BASE = 62;
const FOV_SPEED_MAX = 14;
const FOV_SPEED_GAIN = 0.4;
const FOV_RATE = 4;
const FOV_EPS = 0.05;
const BOB_AMP = 0.04;
const BOB_FREQ = 1.3;
/** Showroom (the Pay 'n' Glaze shop): distance = max(min, radius * per-radius), look point lifted by radius * look. */
const SHOWROOM_DIST_MIN = 8.4;
const SHOWROOM_DIST_PER_RADIUS = 3.4;
const SHOWROOM_LOOK = 0.55;
/** The vehicle must fit a sphere of radius * SHOWROOM_FIT_RADIUS in the upper SHOWROOM_FIT_HEIGHT of the picture (the shop sheet covers the rest on a phone) and the full width. */
const SHOWROOM_FIT_RADIUS = 1.15;
const SHOWROOM_FIT_HEIGHT = 0.55;
const SHOWROOM_PITCH = 0.2;
/** Auto-orbit speed (radians/s), paused for this many seconds after a drag. */
const SHOWROOM_SPIN = 0.35;
const SHOWROOM_SPIN_PAUSE = 3;
const SHOWROOM_SMOOTHING = 7;

export interface ShowroomTarget { x: number; y: number; z: number; radius: number; centered?: boolean; distance?: number }

export function createChaseCamera(camera: THREE.PerspectiveCamera): ChaseCamera {
  const chase: ChaseCamera = {
    yaw: 0,
    pitch: VIEW.foot.pitch,
    showroom(target: ShowroomTarget | null) {
      // Entering or leaving the showroom may move the camera across the map (the shop warps the player to its stage): cut, do not glide.
      if ((target === null) !== (room === null)) {
        smoothed = null;
        clippedDist = -1;
      }
      room = target;
      if (target) roomSinceDrag = Infinity;
      else clearShowroomOffset();
    },
    get showroomActive(): boolean {
      return room !== null;
    },
    update(
      dt: number,
      target: { x: number; y: number; z: number },
      targetYaw: number,
      mode: CameraMode,
      input: InputState,
      world: World,
      extra?: { boost?: boolean; airborne?: boolean; eye?: { x: number; y: number; z: number } },
    ) {
      time += dt;
      // The showroom orbits its vehicle instead: the target, mode and world are ignored while it is set.
      if (room) {
        stepShowroom(dt, input, room);
        return;
      }
      const v = VIEW[mode];
      // Aim blend: foot view only (the other modes ignore setAim).
      const a = mode === 'foot' ? aimT : 0;
      const fp = firstPerson && extra?.eye ? extra.eye : null;
      if (!fp && fpApplied) {
        // Leaving first person: restore the lens and cut the chase view in.
        fpApplied = false;
        camera.near = savedNear;
        camera.updateProjectionMatrix();
        smoothed = null;
        clippedDist = -1;
        shoulderClip = -1;
        clipHist.length = 0;
      }

      // Orbit input, and how long since the player last dragged. Aiming slows the look down.
      if (input.camYaw !== 0 || input.camPitch !== 0) sinceDrag = 0;
      else sinceDrag += dt;
      const lookScale = 1 + (aimZoom - 1) * a;
      chase.yaw += input.camYaw / lookScale;
      chase.pitch = clamp(chase.pitch + input.camPitch / lookScale, fp ? -FP_PITCH : PITCH_MIN, fp ? FP_PITCH : PITCH_MAX);

      // Target speed, from its movement since the last frame.
      let speed = 0;
      if (lastTarget) {
        const dx = target.x - lastTarget.x;
        const dy = target.y - lastTarget.y;
        const dz = target.z - lastTarget.z;
        if (dt > 0) speed = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
      }
      lastTarget = { x: target.x, y: target.y, z: target.z };

      if (fp) {
        if (!fpApplied) {
          fpApplied = true;
          savedNear = camera.near;
          camera.near = FP_NEAR;
          camera.updateProjectionMatrix();
        }
        // Drive and fly drift back behind the vehicle; on foot the view stays where the player put it.
        if (mode === 'drive' || mode === 'fly') {
          if (sinceDrag > v.followAfter) chase.yaw += clamp(angleDiff(targetYaw, chase.yaw), -v.followRate * dt, v.followRate * dt);
        }
        recoil *= Math.exp(-RECOIL_DECAY * dt);
        shakeAmt *= Math.exp(-9 * dt);
        if (shakeAmt < 0.001) shakeAmt = 0;
        const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
        const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 0.7 : 0;
        const sz = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
        camera.position.set(fp.x + sx, fp.y + sy, fp.z + sz);
        const p = chase.pitch - recoil;
        const cpp = Math.cos(p);
        camera.lookAt(
          camera.position.x + Math.sin(chase.yaw) * cpp,
          camera.position.y - Math.sin(p),
          camera.position.z + Math.cos(chase.yaw) * cpp,
        );
        const fpFov = FP_FOV / lookScale;
        const fpRate = mode === 'foot' ? FOV_RATE * (1 + 2 * a) : FOV_RATE;
        camera.fov += (fpFov - camera.fov) * (1 - Math.exp(-fpRate * dt));
        if (Math.abs(camera.fov - appliedFov) > FOV_EPS) {
          camera.updateProjectionMatrix();
          appliedFov = camera.fov;
        }
        return;
      }

      // Drift back behind the target when the player is not steering the view (not while the clip distance is jumping).
      clipHold = Math.max(0, clipHold - dt);
      if (sinceDrag > v.followAfter && speed >= v.followMinSpeed && clipHold <= 0) {
        const diff = angleDiff(targetYaw, chase.yaw);
        const step = clamp(diff, -v.followRate * dt, v.followRate * dt);
        chase.yaw += step;
      }
      // While aiming the pitch stays where the player put it.
      if (sinceDrag > PITCH_RETURN_AFTER && a <= 0) {
        const diff = v.pitch - chase.pitch;
        chase.pitch += clamp(diff, -PITCH_RETURN_RATE * dt, PITCH_RETURN_RATE * dt);
      }
      chase.pitch = clamp(chase.pitch, PITCH_MIN, PITCH_MAX);

      // Gun recoil and camera shake settle back to zero.
      recoil *= Math.exp(-RECOIL_DECAY * dt);
      shakeAmt *= Math.exp(-9 * dt);
      if (shakeAmt < 0.001) shakeAmt = 0;

      // Over-the-shoulder: ease the sideways offset in and out (foot and chute only), and clip against nearby walls.
      const shoulderTarget = mode === 'foot' ? lerp(SHOULDER, AIM.shoulder, a) : mode === 'chute' ? SHOULDER : 0;
      shoulder += (shoulderTarget - shoulder) * (1 - Math.exp(-v.smoothing * dt));
      const rightX = -Math.cos(chase.yaw);
      const rightZ = Math.sin(chase.yaw);

      // Desired position: behind the look point along the view direction. Recoil lifts the view, so the
      // placement uses the pitch minus the kick.
      const pivot = new THREE.Vector3(target.x, target.y + v.lookHeight, target.z);
      const rawLook = new THREE.Vector3(target.x + rightX * shoulder, target.y + v.lookHeight, target.z + rightZ * shoulder);
      // Ground under the player: the clip march treats rising ground as a wall (see isBlocked).
      const baseGround = heightAt(target.x, target.z);
      let look = pivot;
      if (shoulder > 0.01) {
        // Ease the clipped shoulder distance so the look point never flips between pivot and shoulder in one frame.
        const rawLen = pivot.distanceTo(rawLook);
        const wanted = pivot.distanceTo(clipPoint(pivot, rawLook, world, 0.25, baseGround));
        if (shoulderClip < 0) shoulderClip = wanted;
        else shoulderClip += (wanted - shoulderClip) * (1 - Math.exp(-(wanted < shoulderClip ? CAM_STEADY.shoulderInRate : CLIP_RECOVER_RATE) * dt));
        const used = Math.min(shoulderClip, rawLen);
        look = rawLen > 1e-6 ? new THREE.Vector3().lerpVectors(pivot, rawLook, used / rawLen) : pivot;
      } else {
        shoulderClip = -1;
      }
      const effPitch = chase.pitch - recoil;
      const cp = Math.cos(effPitch);
      const fx = Math.sin(chase.yaw) * cp;
      const fy = -Math.sin(effPitch);
      const fz = Math.cos(chase.yaw) * cp;
      const stuntPull = extra?.airborne ? 2.8 : 0;
      const baseDist = mode === 'foot' ? lerp(v.dist, AIM.cameraDist, a) : v.dist;
      const distance = baseDist + v.distPerSpeed * speed + stuntPull;
      const desired = new THREE.Vector3(look.x - fx * distance, look.y - fy * distance, look.z - fz * distance);

      if (!smoothed) smoothed = desired.clone();
      else smoothed.lerp(desired, 1 - Math.exp(-v.smoothing * dt));

      // Float: a gentle bob on top of the smoothed position, never below MIN_Y.
      const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
      const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt * 0.7 : 0;
      const sz = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
      const out = new THREE.Vector3(smoothed.x + sx, smoothed.y + BOB_AMP * Math.sin(time * BOB_FREQ) + sy, smoothed.z + sz);
      const outFloor = groundAt(out.x, out.z, target.y + 1) + MIN_Y;
      if (out.y < outFloor) out.y = outFloor;

      // No clipping: pull in immediately on wall contact, ease back out smoothly when clear.
      const rawDist = look.distanceTo(out);
      const safeDist = clipDistSmooth(pivot, pivot.clone().add(out).sub(look), world, baseGround);
      // Hysteresis: a ray grazing a corner flips the march result by a step; ignore small changes.
      if (safeHeld < 0 || Math.abs(safeDist - safeHeld) >= CAM_STEADY.hysteresis) safeHeld = safeDist;
      if (clippedDist < 0) clippedDist = safeHeld;
      else clippedDist += (safeHeld - clippedDist) * (1 - Math.exp(-(safeHeld < clippedDist ? CAM_STEADY.clipInRate : CLIP_RECOVER_RATE) * dt));
      const placeAt = (d: number): THREE.Vector3 => (rawDist > 1e-5 ? new THREE.Vector3().lerpVectors(look, out, Math.min(rawDist, d) / rawDist) : look.clone());
      let placed = placeAt(clippedDist);
      // Never end a frame inside a box: fall back to the safe distance.
      if (isBlocked(placed.x, placed.y, placed.z, 0.1, world, baseGround)) {
        const rawSafe = clipDist(look, out, world, baseGround);
        safeHeld = Math.min(safeDist, rawSafe);
        clippedDist = Math.min(clippedDist, rawSafe);
        placed = placeAt(clippedDist);
      }
      // Remember the recent clip distances: a big change inside the window pauses the yaw follow.
      clipHist.push({ t: time, d: clippedDist });
      while (clipHist.length > 1 && time - clipHist[0].t > CAM_STEADY.jumpWindow) clipHist.shift();
      if (Math.abs(clippedDist - clipHist[0].d) > CAM_STEADY.jumpDist) clipHold = CAM_STEADY.jumpWindow;
      const placedFloor = groundAt(placed.x, placed.z, target.y + 1) + MIN_Y;
      if (placed.y < placedFloor) placed.y = placedFloor;
      // Under a skyway viaduct (highways/deck.ts): keep the camera below the deck so the player stays in view.
      const ceiling = deckCeilingAbove(placed.x, placed.z, target.y + 0.5);
      if (ceiling !== null && placed.y > ceiling - 0.4) placed.y = Math.max(target.y + 0.6, ceiling - 0.4);
      camera.position.copy(placed);
      // Blend the look direction between the view direction (camera at the look point) and the look point itself.
      const toLook = placed.distanceTo(look);
      const bt = clamp((toLook - CAM_STEADY.lookBlendMin) / (CAM_STEADY.lookBlendMax - CAM_STEADY.lookBlendMin), 0, 1);
      if (bt >= 1) {
        camera.lookAt(look);
      } else {
        const dx = lerp(fx, bt > 0 ? (look.x - placed.x) / toLook : fx, bt);
        const dy = lerp(fy, bt > 0 ? (look.y - placed.y) / toLook : fy, bt);
        const dz = lerp(fz, bt > 0 ? (look.z - placed.z) / toLook : fz, bt);
        camera.lookAt(placed.x + dx * 10, placed.y + dy * 10, placed.z + dz * 10);
      }

      // Widen the lens a little with speed and turbo boost.
      const boostFov = extra?.boost ? 6 : 0;
      const fovTarget = mode === 'foot' ? FOV_BASE / lookScale : FOV_BASE + Math.min(FOV_SPEED_MAX, speed * FOV_SPEED_GAIN + boostFov);
      const fovRate = mode === 'foot' ? FOV_RATE * (1 + 2 * a) : FOV_RATE;
      camera.fov += (fovTarget - camera.fov) * (1 - Math.exp(-fovRate * dt));
      if (Math.abs(camera.fov - appliedFov) > FOV_EPS) {
        camera.updateProjectionMatrix();
        appliedFov = camera.fov;
      }
    },
    kick(pitch: number) {
      recoil = clamp(recoil + pitch, 0, RECOIL_MAX);
    },
    shake(amount: number) {
      shakeAmt = Math.min(SHAKE_CAP, shakeAmt + amount * SHAKE_SCALE * SHAKE_FACTOR[getShakeLevel()]);
    },
    setFirstPerson(on: boolean) {
      firstPerson = on;
    },
    get firstPerson(): boolean {
      return firstPerson;
    },
    setAim(t: number, zoom: number) {
      aimT = clamp(t, 0, 1);
      aimZoom = Math.max(1, zoom);
    },
    aimDir(out: THREE.Vector3) {
      camera.getWorldDirection(out);
      return out.normalize();
    },
  };

  /** One frame of the showroom orbit: drag steers it (and pauses the auto-spin), else it turns slowly on its own. */
  const stepShowroom = (dt: number, input: InputState, t: ShowroomTarget): void => {
    if (input.camYaw !== 0 || input.camPitch !== 0) roomSinceDrag = 0;
    else roomSinceDrag += dt;
    chase.yaw += input.camYaw;
    chase.pitch = clamp(chase.pitch + input.camPitch, PITCH_MIN, PITCH_MAX);
    if (roomSinceDrag > SHOWROOM_SPIN_PAUSE) chase.yaw += SHOWROOM_SPIN * dt;
    if (roomSinceDrag > PITCH_RETURN_AFTER) {
      const diff = SHOWROOM_PITCH - chase.pitch;
      chase.pitch += clamp(diff, -PITCH_RETURN_RATE * dt, PITCH_RETURN_RATE * dt);
    }
    chase.pitch = clamp(chase.pitch, PITCH_MIN, PITCH_MAX);

    const look = new THREE.Vector3(t.x, t.y + t.radius * SHOWROOM_LOOK, t.z);
    // Distance at which the sphere fits the binding visible half-extent: the upper part of the height, or the full width.
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const visibleTan = Math.min(SHOWROOM_FIT_HEIGHT * tanHalf, tanHalf * camera.aspect);
    const fitDist = (t.radius * SHOWROOM_FIT_RADIUS) / visibleTan;
    const distance = t.distance ?? Math.max(SHOWROOM_DIST_MIN, t.radius * SHOWROOM_DIST_PER_RADIUS, fitDist);
    const cp = Math.cos(chase.pitch);
    const desired = new THREE.Vector3(
      look.x - Math.sin(chase.yaw) * cp * distance,
      look.y + Math.sin(chase.pitch) * distance,
      look.z - Math.cos(chase.yaw) * cp * distance,
    );
    // Eases in from wherever the last view left the camera, and out again when the showroom closes.
    if (!smoothed) smoothed = desired.clone();
    else smoothed.lerp(desired, 1 - Math.exp(-SHOWROOM_SMOOTHING * dt));
    const out = smoothed.clone();
    const floor = heightAt(out.x, out.z) + MIN_Y;
    if (out.y < floor) out.y = floor;
    camera.position.copy(out);
    camera.lookAt(look);
    if (t.centered) clearShowroomOffset();
    else applyShowroomOffset();

    // Base lens; the speed and boost widening belongs to the driving views.
    camera.fov += (FOV_BASE - camera.fov) * (1 - Math.exp(-FOV_RATE * dt));
    if (Math.abs(camera.fov - appliedFov) > FOV_EPS) {
      camera.updateProjectionMatrix();
      appliedFov = camera.fov;
    }
  };

  /**
   * The shop sheet covers the bottom of the screen (portrait) or the right (landscape phone): slide the picture so the vehicle sits in what is left.
   * A view offset moves the projection centre without moving the camera, so the orbit maths above stays the same.
   */
  let offsetKey = '';
  const applyShowroomOffset = (): void => {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const landscape = typeof window.matchMedia === 'function' && window.matchMedia('(max-height: 500px)').matches;
    const key = `${w}x${h}${landscape ? 'L' : 'P'}`;
    if (key === offsetKey) return;
    offsetKey = key;
    if (landscape) camera.setViewOffset(w, h, Math.min(0.23 * w, 210), 0, w, h);
    else camera.setViewOffset(w, h, 0, 0.29 * h, w, h);
  };
  const clearShowroomOffset = (): void => {
    if (!offsetKey) return;
    offsetKey = '';
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  let room: ShowroomTarget | null = null;
  let roomSinceDrag = 1e9;
  let time = 0;
  let sinceDrag = 1e9;
  let smoothed: THREE.Vector3 | null = null;
  let lastTarget: { x: number; y: number; z: number } | null = null;
  let appliedFov = camera.fov;
  let recoil = 0;
  let shakeAmt = 0;
  /** First-person view (setFirstPerson). */
  let firstPerson = false;
  let shoulder = 0;
  let clippedDist = -1;
  let safeHeld = -1;
  let shoulderClip = -1;
  let clipHold = 0;
  const clipHist: { t: number; d: number }[] = [];
  let fpApplied = false;
  let savedNear = camera.near;
  /** Aim blend (0..1) and total zoom at full aim, set every frame by setAim. */
  let aimT = 0;
  let aimZoom = 1;

  return chase;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** A point is blocked by a box, or by ground that rises above the player's ground and reaches up to the point. */
function isBlocked(x: number, y: number, z: number, radius: number, world: World, baseGround: number): boolean {
  // Interior rooms (E05, x >= 5000): walls and ceiling are see-through from outside, so the camera ignores colliders
  // there and keeps its full distance (a dollhouse view) instead of jamming against the wall behind the player.
  if (isInteriorPoint(x, z)) return false;
  const ground = heightAt(x, z);
  if (ground > baseGround + CAM_STEADY.groundRise && y < ground + CAM_STEADY.groundBand) return true;
  return pushOutOfBoxes(x, z, radius, world.boxes, y - 0.15).hit || insideBox(x, y, z, world.boxes);
}

/** Walk from `from` towards `to`; return the furthest point reachable before a box. */
function clipPoint(from: THREE.Vector3, to: THREE.Vector3, world: World, radius: number, baseGround: number): THREE.Vector3 {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  if (len < 1e-6) return to.clone();
  dir.divideScalar(len);
  for (let s = MARCH_STEP; s - MARCH_STEP < len; s += MARCH_STEP) {
    const d = Math.min(s, len);
    const x = from.x + dir.x * d;
    const y = from.y + dir.y * d;
    const z = from.z + dir.z * d;
    if (isBlocked(x, y, z, radius, world, baseGround)) {
      const back = Math.max(0, d - MARCH_STEP);
      return new THREE.Vector3(from.x + dir.x * back, from.y + dir.y * back, from.z + dir.z * back);
    }
  }
  return to.clone();
}

/** clipDist plus look-ahead feelers turned either side of the ray (see CAM_STEADY.feelerSlope), so the result is Lipschitz in yaw. */
function clipDistSmooth(from: THREE.Vector3, to: THREE.Vector3, world: World, baseGround: number): number {
  const center = clipDist(from, to, world, baseGround);
  let best = center;
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const probe = new THREE.Vector3();
  const slope = CAM_STEADY.feelerSlope;
  const at = (th: number, sign: number): number => {
    const c = Math.cos(th);
    const s = Math.sin(th);
    probe.set(from.x + dx * c + sign * dz * s, to.y, from.z + dz * c - sign * dx * s);
    const d = clipDist(from, probe, world, baseGround);
    best = Math.min(best, d + slope * th);
    return d;
  };
  // Where neighbouring feelers differ by more than the slope allows, bisect: the edge of a corner is where the distance is steepest.
  const refine = (a: number, fa: number, b: number, fb: number, sign: number, depth: number): void => {
    if (depth <= 0 || Math.abs(fa - fb) <= slope * (b - a)) return;
    const m = (a + b) / 2;
    const fm = at(m, sign);
    refine(a, fa, m, fm, sign, depth - 1);
    refine(m, fm, b, fb, sign, depth - 1);
  };
  for (const sign of [1, -1]) {
    let prevTh = 0;
    let prev = center;
    for (let th = CAM_STEADY.feelerStep; th <= CAM_STEADY.feelerSpread; th += CAM_STEADY.feelerStep) {
      if (slope * prevTh >= best) break;
      const d = at(th, sign);
      refine(prevTh, prev, th, d, sign, CAM_STEADY.feelerDepth);
      prevTh = th;
      prev = d;
    }
  }
  return best;
}

/** Walk from `from` towards `to`; return the max unobstructed distance, backed off by MARCH_BACKOFF. */
function clipDist(from: THREE.Vector3, to: THREE.Vector3, world: World, baseGround: number): number {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = dir.length();
  if (len < 1e-6) return len;
  dir.divideScalar(len);
  for (let s = MARCH_STEP; s - MARCH_STEP < len; s += MARCH_STEP) {
    const d = Math.min(s, len);
    const x = from.x + dir.x * d;
    const y = from.y + dir.y * d;
    const z = from.z + dir.z * d;
    if (isBlocked(x, y, z, CAM_RADIUS, world, baseGround)) {
      return Math.max(MIN_CAM_DIST, d - MARCH_BACKOFF);
    }
  }
  return len;
}
