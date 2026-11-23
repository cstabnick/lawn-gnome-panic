// Scene actors on screen: a gnome model per ScriptActor, posed each frame from its ActorSample (walk cycle, gestures,
// talking bob, held prop), seated in a vehicle, or drawn through a mount.ts sequence.
import * as THREE from 'three';
import { buildHeld } from '@lawn/prefabs';
import type { GnomeModel } from '@lawn/gnome';
import { clearHandsUp, gnomeState, makeGnome } from '../gnomes';
import { clearHands } from '../driverHands';
import type { MountPose } from '../mount';
import type { ResolvedCast } from './cast';
import type { ActorSample, Gesture, ScriptActor, Vec3 } from './script';

export interface StageActor {
  id: string;
  model: GnomeModel;
  cast: ResolvedCast;
  /** What the model stands in when not seated (the room group, or the scene). */
  parent: THREE.Object3D;
  heldId: string | null;
  heldObj: THREE.Object3D | null;
}

/** Arm rotations (x, y, z radians, applied after model.update) plus a body pitch and vertical bob, for a gesture at t of dur. */
export interface GesturePose { left: Vec3; right: Vec3; pitch: number; bob: number }

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Pure pose for a gesture. Every rotation, pitch and bob eases in and out over the first and last 0.2 s. */
export function gesturePose(name: Gesture, t: number, dur: number): GesturePose {
  const env = clamp01(Math.min(t / 0.2, (dur - t) / 0.2));
  let left: Vec3 = [0, 0, 0];
  let right: Vec3 = [0, 0, 0];
  let pitch = 0;
  let bob = 0;
  switch (name) {
    case 'wave':
      right = [-2.6, 0, -0.3 + Math.sin(t * 10) * 0.35];
      break;
    case 'point':
      right = [-1.55, 0, 0];
      break;
    case 'shrug':
      left = [-0.5, 0, 0.6];
      right = [-0.5, 0, -0.6];
      bob = 0.05 * Math.abs(Math.sin(t * 6));
      break;
    case 'nod':
      pitch = t < 0.8 ? Math.sin(t * 8) * 0.15 : 0;
      break;
    case 'cheer':
      left = [-2.9 + Math.sin(t * 9) * 0.12, 0, 0.3];
      right = [-2.9 - Math.sin(t * 9) * 0.12, 0, -0.3];
      bob = 0.15 * Math.abs(Math.sin(t * 8));
      break;
    case 'handsUp':
      left = [-2.85, 0, 0.3];
      right = [-2.85, 0, -0.3];
      break;
    case 'lean':
      pitch = 0.25;
      right = [-0.7, 0, 0.3];
      break;
    case 'crossArms':
      left = [-1.3, 0, -0.8];
      right = [-1.3, 0, 0.8];
      break;
    case 'facepalm':
      right = [-2.3, 0, 0.5];
      pitch = 0.15;
      break;
    case 'bow':
      pitch = dur > 0 ? 0.6 * Math.sin((Math.PI * t) / dur) : 0;
      break;
    case 'flinch': {
      // A jolt back in the first 0.25 s, hands half up, settling.
      const jolt = Math.exp(-t * 6);
      left = [-1.9, 0, 0.5];
      right = [-1.9, 0, -0.5];
      pitch = -0.28 * jolt - 0.05;
      bob = 0.06 * jolt;
      break;
    }
    case 'slump':
      left = [0.15, 0, 0.1];
      right = [0.15, 0, -0.1];
      pitch = 0.32;
      bob = -0.05;
      break;
    case 'think':
      right = [-2.1, 0, 0.75];
      left = [-0.9, 0, -0.7];
      pitch = 0.06 + Math.sin(t * 1.5) * 0.02;
      break;
    case 'clutch':
      left = [-1.2, 0, -0.95];
      right = [-0.3, 0, 0.1];
      pitch = 0.12;
      break;
    case 'beckon':
      right = [-1.5 + Math.max(0, Math.sin(t * 7)) * 0.6, 0, -0.15];
      break;
    case 'tipHat':
      right = [-2.95, 0, 0.35];
      pitch = 0.1 * Math.sin(Math.min(1, t / 0.6) * Math.PI);
      break;
    case 'stomp':
      left = [-0.4, 0, 0.35];
      right = [-0.4, 0, -0.35];
      bob = 0.1 * Math.abs(Math.sin(t * 9)) * Math.exp(-t * 1.5);
      break;
    case 'sit':
    case 'stand':
    default:
      break;
  }
  // "+ 0" turns a -0 from a zero env into 0.
  const k = (v: number): number => v * env + 0;
  return {
    left: [k(left[0]), k(left[1]), k(left[2])],
    right: [k(right[0]), k(right[1]), k(right[2])],
    pitch: k(pitch),
    bob: k(bob),
  };
}

export function createStageActor(parent: THREE.Object3D, def: ScriptActor, cast: ResolvedCast): StageActor {
  const model = makeGnome(parent, cast.look);
  model.object.scale.setScalar(cast.scale);
  const a: StageActor = { id: def.id, model, cast, parent, heldId: null, heldObj: null };
  setHeld(a, cast.held);
  model.object.visible = !def.hidden;
  return a;
}

/**
 * Pose for this frame. `seat` given: the actor sits in a vehicle (model reparented to seat.object at seat.local, facing
 * the vehicle's nose). Otherwise it stands in `parent` at the sample's position.
 */
export function poseActor(a: StageActor, s: ActorSample, dt: number, clock: number, seat?: { object: THREE.Object3D; local: Vec3 }): void {
  const obj = a.model.object;
  obj.visible = s.visible;
  if (!s.visible) return;
  if (seat) {
    if (obj.parent !== seat.object) seat.object.add(obj);
    a.model.update(gnomeState(seat.local[0], seat.local[1], seat.local[2], 0, 0, true), dt);
  } else {
    if (obj.parent !== a.parent) a.parent.add(obj);
    a.model.update(gnomeState(s.x, s.y, s.z, s.yaw, s.speed, s.sitting), dt);
  }
  // update() animates the arms, so the pose goes on after it.
  if (s.gesture) {
    const p = gesturePose(s.gesture, s.gestureT, Math.max(s.gestureT + 0.2, 1.2));
    a.model.arms.left.rotation.set(...p.left);
    a.model.arms.right.rotation.set(...p.right);
    a.model.rig.rotation.x = p.pitch;
    obj.position.y += p.bob;
  } else if (s.talking) {
    a.model.arms.right.rotation.set(-0.55 - Math.abs(Math.sin(clock * 5.5)) * 0.35, 0, 0.15);
    a.model.rig.rotation.x = Math.sin(clock * 14) * 0.05;
  } else {
    a.model.rig.rotation.x = 0;
  }
  if (s.held !== a.heldId) setHeld(a, s.held);
}

/** Put a prefab in the right hand, or empty it. An unknown prefab id holds nothing (heldId is still recorded). */
export function setHeld(a: StageActor, prefab: string | null): void {
  if (a.heldObj) a.heldObj.removeFromParent();
  a.heldObj = null;
  a.heldId = prefab;
  if (!prefab) return;
  try {
    const prop = buildHeld(prefab);
    prop.position.set(0, -0.32, 0.02);
    prop.rotation.x = Math.PI;
    a.model.arms.right.add(prop);
    a.heldObj = prop;
  } catch {
    a.heldObj = null;
  }
}

/** Draw a mount.ts frame pose (world coordinates; the actor must be on a world stage). */
export function drawMountPose(a: StageActor, pose: MountPose, dt: number): void {
  const obj = a.model.object;
  if (obj.parent !== a.parent) a.parent.add(obj);
  obj.quaternion.identity();
  clearHands(a.model);
  clearHandsUp(a.model);
  const st = gnomeState(pose.x, pose.y, pose.z, pose.yaw, 0, pose.seated);
  st.velocity.set(pose.vx, 0, pose.vz);
  st.grounded = !pose.airborne;
  st.jumpsUsed = pose.airborne ? 1 : 0;
  a.model.update(st, dt);
  // Arms reach for the rim, a door or a driver, and stretch up over the top of a climb. Set after update, which animates them.
  if (pose.reach > 0 || pose.climb > 0) {
    const arm = -(1.5 * pose.reach + 1.6 * pose.climb);
    a.model.arms.left.rotation.set(arm, 0, 0);
    a.model.arms.right.rotation.set(arm, 0, 0);
  }
}

export function removeStageActor(a: StageActor): void {
  a.model.object.removeFromParent();
}
