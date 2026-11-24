// Driver hands: a seated gnome's hands hold the vehicle's control (steering wheel, handlebars, tiller, lap bars, yoke, basket rim)
// and turn with it, instead of resting on the lap. What each kind holds is data (driveGrips.ts DRIVE_CONTROLS); a Pay 'n' Glaze rig's
// grip markers win when it has them (a styled wheel changes the grip radius).
// Called by player.ts (the player), traffic.ts (NPC riders), remotes.ts (online drivers) and the cutscene actors, each AFTER that
// gnome model's own update() and AFTER the vehicle's mesh is placed for the frame (syncVehicleMesh), or the hands trail the wheel.
//
// Each frame, per hand: the grip's world point is the control pivot's matrixWorld applied to the grip's pivot-local point (so the
// hand turns with the wheel mesh itself), and the arm pivot is aimed at it and stretched to land the hand ball exactly on it.
// No allocation per frame: module scratch values, and per-gnome state made once.
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { ARM_LENGTH, releaseArm } from '@lawn/glaze';
import { controlOf } from './driveGrips';
import type { Vehicle } from './types';

/** How fast the hands ease on and off the grips (exp rate per second: about 0.25 s to settle). */
const EASE_RATE = 9;
/** Below this blend weight, a hand that is not wanted is released to the model's own pose. */
const WAKE_BELOW = 0.002;
/** Within this of 1, a hand that wants the grip is put exactly on it. */
const SNAP_ON = 0.02;
/** The arm may squash to this fraction of its length (a grip close to the shoulder) ... */
export const MIN_STRETCH = 0.55;
/** ... and stretch to this multiple (a grip far away). Every DRIVE_CONTROLS grip is inside 0.6..1.6 at every steering angle. */
export const MAX_STRETCH = 1.65;
const SIDES = ['left', 'right'] as const;
type Side = (typeof SIDES)[number];

interface HandState {
  /** Blend weight per hand: 0 = the model's own pose, 1 = on the grip. */
  w: Record<Side, number>;
  /** The last pose on the grip (arm rotation in its parent and stretch): what a hand eases away from when it lets go. */
  onQ: Record<Side, THREE.Quaternion>;
  onS: Record<Side, number>;
  /** The arm rotation poseHands left this frame: settleHands re-aims only a hand an overlay has not taken over since. */
  setQ: Record<Side, THREE.Quaternion>;
}

const states = new WeakMap<GnomeModel, HandState>();

/** Where a vehicle's grips are: the parent they turn with and each hand's point in that parent. Rebuilt when the body or pivot changes. */
interface GripFrame {
  body: THREE.Object3D;
  parent: THREE.Object3D;
  left: THREE.Vector3;
  right: THREE.Vector3;
}
const frames = new WeakMap<Vehicle, GripFrame>();

// Module-level scratch values: this runs every frame for every driver, so it must not allocate.
const gripW: Record<Side, THREE.Vector3> = { left: new THREE.Vector3(), right: new THREE.Vector3() };
const local = new THREE.Vector3();
const dir = new THREE.Vector3();
const invParent = new THREE.Matrix4();
const reachQ = new THREE.Quaternion();
const restQ = new THREE.Quaternion();
const HANGS_DOWN = new THREE.Vector3(0, -1, 0);
const want: Record<Side, boolean> = { left: false, right: false };
const reachS: Record<Side, number> = { left: 1, right: 1 };
const reachQs: Record<Side, THREE.Quaternion> = { left: new THREE.Quaternion(), right: new THREE.Quaternion() };

/** The vehicle's body (the prefab root: vehicles.ts keeps it as v.object's first child). */
const bodyOf = (v: Vehicle): THREE.Object3D | undefined => v.object.children[0];

/**
 * The grips' parent and pivot-local points for `v`, or null when its driver holds nothing. A Pay 'n' Glaze rig's markers come first
 * (their parent is the steer pivot, their position is the grip). Otherwise driveGrips.ts: the control pivot (vehicles.ts records it
 * on the body as userData.controlPivot after every rebuild), or the body itself for a control that does not turn.
 */
function gripFrame(v: Vehicle): GripFrame | null {
  const marks = v.rig?.grips;
  if (marks && marks.left.parent) {
    // The rig's markers are live objects under the turning pivot: use them directly (no cache needed).
    const f = frames.get(v);
    if (f && f.parent === marks.left.parent && f.left === marks.left.position) return f;
    const fresh: GripFrame = { body: marks.left.parent, parent: marks.left.parent, left: marks.left.position, right: marks.right.position };
    frames.set(v, fresh);
    return fresh;
  }
  const ctl = controlOf(v.kind);
  const body = bodyOf(v);
  if (!ctl || !body) return null;
  const pivot: THREE.Object3D | null | undefined = ctl.pivot === null
    ? body
    : ((body.userData.controlPivot as THREE.Object3D | undefined) ?? null);
  if (!pivot) return null;
  const f = frames.get(v);
  if (f && f.body === body && f.parent === pivot) return f;
  // New body or rebuilt pivot: the grips relative to the pivot's rest position (pivots hang off the body root, or the
  // Pay 'n' Glaze shell, which keeps root-local transforms, so pivot.position is the prefab-local pivot point).
  const [l, r] = ctl.grips;
  const p = pivot === body ? null : pivot.position;
  const at = (g: readonly number[]) => new THREE.Vector3(g[0] - (p?.x ?? 0), g[1] - (p?.y ?? 0), g[2] - (p?.z ?? 0));
  const fresh: GripFrame = { body, parent: pivot, left: at(l), right: at(r) };
  frames.set(v, fresh);
  return fresh;
}

/** Where `side`'s grip of `v` is in world space this frame (after syncVehicleMesh), or null when the driver holds nothing. For tests and debug views. */
export function gripWorld(v: Vehicle, side: Side, out: THREE.Vector3): THREE.Vector3 | null {
  const f = gripFrame(v);
  if (!f) return null;
  f.parent.updateWorldMatrix(true, false);
  return out.copy(f[side]).applyMatrix4(f.parent.matrixWorld);
}

function stateOf(model: GnomeModel): HandState {
  let st = states.get(model);
  if (!st) {
    st = {
      w: { left: 0, right: 0 },
      onQ: { left: new THREE.Quaternion(), right: new THREE.Quaternion() },
      onS: { left: 1, right: 1 },
      setQ: { left: new THREE.Quaternion(), right: new THREE.Quaternion() },
    };
    states.set(model, st);
  }
  return st;
}

/**
 * Aim `arm` (hanging along its local -y, its hand ball ARM_LENGTH down it) at world point `target`, given its parent's inverse world
 * matrix. Writes the rotation to reachQ and returns the stretch, or 0 when the target is out of the MIN..MAX band.
 */
function aim(arm: THREE.Object3D, target: THREE.Vector3): number {
  local.copy(target).applyMatrix4(invParent);
  dir.subVectors(local, arm.position);
  const len = dir.length();
  if (len < ARM_LENGTH * MIN_STRETCH || len > ARM_LENGTH * MAX_STRETCH) return 0;
  dir.divideScalar(len);
  reachQ.setFromUnitVectors(HANGS_DOWN, dir);
  return len / ARM_LENGTH;
}

/** Put one arm at blend `w` between its current (model) pose and the grip pose `q` / stretch `s`. */
function blendArm(arm: THREE.Object3D, w: number, q: THREE.Quaternion, s: number): void {
  restQ.copy(arm.quaternion);
  arm.quaternion.slerpQuaternions(restQ, q, w);
  const k = 1 + (s - 1) * w;
  const thin = 1 / Math.sqrt(k);
  arm.scale.set(thin, k, thin);
}

/**
 * Put `model`'s hands on `v`'s control when the gnome is its DRIVER (seat 0): each hand eases onto its grip (about 0.25 s) and then
 * follows it exactly as the control turns, and eases back to the model's own pose when it lets go (passenger, wreck, sunk, out of reach).
 * Safe to call every frame for any vehicle. `dt` (seconds) paces the ease; 0 holds the current blend.
 */
export function poseHands(model: GnomeModel, v: Vehicle, seat = 0, dt = 1 / 60): void {
  const eligible = seat === 0 && !v.exploded && !v.sunk && v.driver !== 'none';
  const f = eligible ? gripFrame(v) : null;
  let st = states.get(model);
  // A gnome that was never posed and has nothing to hold: leave its arms to the model entirely.
  if (!f && !st) return;
  st ??= stateOf(model);

  want.left = false;
  want.right = false;
  if (f) {
    f.parent.updateWorldMatrix(true, false);
    gripW.left.copy(f.left).applyMatrix4(f.parent.matrixWorld);
    gripW.right.copy(f.right).applyMatrix4(f.parent.matrixWorld);
    // Both arms hang off the same rig: bring its world matrix up to date once and invert it once.
    const armParent = model.arms.left.parent;
    if (armParent) {
      armParent.updateWorldMatrix(true, false);
      invParent.copy(armParent.matrixWorld).invert();
      for (const side of SIDES) {
        const s = aim(model.arms[side], gripW[side]);
        if (s > 0) {
          want[side] = true;
          reachS[side] = s;
          reachQs[side].copy(reachQ);
        }
      }
    }
  }

  // dt <= 0 or not finite (a first frame whose timestamp is older than the clock it is measured from) holds the weights: a
  // negative ease factor would push them outside 0..1 (arms scaled to NaN, the hands vanish for seconds).
  const k = dt > 0 && Number.isFinite(dt) ? 1 - Math.exp(-EASE_RATE * dt) : 0;
  let any = false;
  for (const side of SIDES) {
    const arm = model.arms[side];
    let w = Math.min(1, Math.max(0, st.w[side] + ((want[side] ? 1 : 0) - st.w[side]) * k));
    // Settled on the grip: exactly on it, not 99% of the way (the exp ease never quite arrives).
    if (want[side] && w > 1 - SNAP_ON) w = 1;
    st.w[side] = w;
    if (want[side]) {
      st.onQ[side].copy(reachQs[side]);
      st.onS[side] = reachS[side];
    }
    if (w < WAKE_BELOW && !want[side]) {
      st.w[side] = 0;
      releaseArm(arm);
      continue;
    }
    any = true;
    // On the grip: this frame's aim. Letting go: ease from the last grip pose back to whatever the model has the arm doing.
    blendArm(arm, w, st.onQ[side], st.onS[side]);
    st.setQ[side].copy(arm.quaternion);
  }
  if (!any && !f) states.delete(model);
}

/** Let go of the wheel over the next frames (getting out, the mount sequence): each hand eases from its last grip pose to the model's. */
/**
 * After an overlay that moves the BODY (anim/rideAuto.ts driving personalities lean and sway model.rig, which carries both arms):
 * re-aim each hand that is fully on its grip and whose arm the overlay did not pose itself, so the steering hand stays on the wheel
 * while the body moves under it. A hand the overlay took (the personality's free left arm) is left as the overlay set it. No allocation.
 */
export function settleHands(model: GnomeModel, v: Vehicle, seat = 0): void {
  const st = states.get(model);
  if (!st || seat !== 0 || v.exploded || v.sunk || v.driver === 'none') return;
  const f = gripFrame(v);
  const armParent = model.arms.left.parent;
  if (!f || !armParent) return;
  let parentReady = false;
  for (const side of SIDES) {
    const arm = model.arms[side];
    if (st.w[side] < 1 || arm.quaternion.angleTo(st.setQ[side]) > 1e-5) continue;
    if (!parentReady) {
      f.parent.updateWorldMatrix(true, false);
      armParent.updateWorldMatrix(true, false);
      invParent.copy(armParent.matrixWorld).invert();
      parentReady = true;
    }
    gripW[side].copy(f[side]).applyMatrix4(f.parent.matrixWorld);
    const s = aim(arm, gripW[side]);
    if (s <= 0) continue;
    arm.quaternion.copy(reachQ);
    const thin = 1 / Math.sqrt(s);
    arm.scale.set(thin, s, thin);
    st.onQ[side].copy(reachQ);
    st.onS[side] = s;
    st.setQ[side].copy(reachQ);
  }
}

export function releaseHands(model: GnomeModel, dt = 1 / 60): void {
  const st = states.get(model);
  if (!st) return;
  const k = dt > 0 && Number.isFinite(dt) ? 1 - Math.exp(-EASE_RATE * dt) : 0;
  let any = false;
  for (const side of SIDES) {
    const arm = model.arms[side];
    st.w[side] -= st.w[side] * k;
    if (st.w[side] < WAKE_BELOW) {
      st.w[side] = 0;
      releaseArm(arm);
      continue;
    }
    any = true;
    blendArm(arm, st.w[side], st.onQ[side], st.onS[side]);
  }
  if (!any) states.delete(model);
}

/** Forget a gnome's hand blend and put both arm scales back to 1 (it left the vehicle, was yanked out, or respawned). */
export function clearHands(model: GnomeModel): void {
  states.delete(model);
  releaseArm(model.arms.left);
  releaseArm(model.arms.right);
}

/** How far each hand is on its grip (0..1), for tests and debug overlays. 0 for a gnome that holds nothing. */
export function handWeight(model: GnomeModel, side: Side): number {
  return states.get(model)?.w[side] ?? 0;
}
