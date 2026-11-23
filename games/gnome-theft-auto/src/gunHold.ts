// Held guns: one pose for every gnome that holds one (the player, online players, cutscene actors). The right hand
// grips the gun in front of the body (aimed along the aim pitch, or lowered when not aiming), the left hand rests on
// the `support` pivot of two-handed guns, and the held item is placed through the shared hand anchor + prefab wear.
import * as THREE from 'three';
import { anchorMatrix, wearMatrix, type GnomeModel } from '@lawn/gnome';
import { getPrefab, pivotAt, type Vec3 } from '@lawn/prefabs';
import { reachArm, releaseArm } from '@lawn/glaze';

/** How a gun is held this frame. pitch: radians, + = aiming up (0 when unknown, e.g. online players). */
export interface GunAim { aiming: boolean; pitch: number }

/** Tunable gun pose. Rig space: feet at y 0, +z forward, +x the gnome's left. Grips are where the hands hold the gun. */
export const GUN_POSE = {
  aimGrip2: [0, 0.56, 0.22],
  aimGrip1: [-0.2, 0.6, 0.3],
  lowGrip2: [0.04, 0.54, 0.16],
  lowGrip1: [-0.27, 0.34, 0.08],
  lowPitch2: -0.45,
  lowPitch1: -0.9,
  pitchLift: 0.25,
  leftStretch: 1.45,
} as const satisfies {
  aimGrip2: Vec3; aimGrip1: Vec3; lowGrip2: Vec3; lowGrip1: Vec3;
  lowPitch2: number; lowPitch1: number; pitchLift: number; leftStretch: number;
};

// Module-level scratch objects: poseGunArms runs every frame for several gnomes, so it must not allocate.
const _m = new THREE.Matrix4();
const _w = new THREE.Matrix4();
const _grip = new THREE.Vector3();
const _target = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _down = new THREE.Vector3();
const _right = new THREE.Vector3();
const _basis = new THREE.Matrix4();
const _qRig = new THREE.Quaternion();
const _qWanted = new THREE.Quaternion();
const _qRigWorld = new THREE.Quaternion();
const _qArmWorld = new THREE.Quaternion();
const _qInv = new THREE.Quaternion();
const _support = new THREE.Vector3();
const _box = new THREE.Box3();
const _meshBox = new THREE.Box3();
const _inv = new THREE.Matrix4();
const _up = new THREE.Vector3(0, -1, 0);

/** True when the prefab is a gun (its `uses` include 'shoot'): it gets the gun pose. */
export function isGunPrefab(prefabId: string | null): boolean {
  if (!prefabId) return false;
  return getPrefab(prefabId)?.uses.includes('shoot') ?? false;
}

/** True when the prefab is held in both hands (it has a `support` pivot for the left hand). */
export function isTwoHanded(prefabId: string | null): boolean {
  if (!prefabId) return false;
  return Boolean(getPrefab(prefabId)?.pivots?.support);
}

/**
 * Put `holder` (a buildHeld / buildModdedGun group: grip at its origin) on a right arm pivot the way buildGear('hand')
 * does: EQUIP_ANCHORS.hand, then the prefab's `wear`. Adds it to `arm` and returns it.
 */
export function placeInHand(holder: THREE.Object3D, prefabId: string, arm: THREE.Object3D): THREE.Object3D {
  const def = getPrefab(prefabId);
  const s0 = holder.scale.x;
  anchorMatrix('hand', _m);
  wearMatrix(def?.wear, _w);
  _m.multiply(_w);
  _m.decompose(holder.position, holder.quaternion, holder.scale);
  holder.scale.multiplyScalar(s0);
  holder.userData.prefabId = prefabId;
  holder.userData.baseQuat = holder.quaternion.clone();
  arm.add(holder);
  return holder;
}

/** Pose the arms and the held gun (any prefab the caller holds as a gun). Call every frame AFTER model.update(). `held`: the holder from placeInHand, or null. */
export function poseGunArms(model: GnomeModel, prefabId: string | null, aim: GunAim, held?: THREE.Object3D | null): void {
  // Callers decide what is held as a gun (GTA's GUNS list includes the whip and the grenade, which do not 'shoot').
  if (!prefabId || !getPrefab(prefabId)) return;
  const two = isTwoHanded(prefabId);
  const pitch = aim.aiming
    ? THREE.MathUtils.clamp(aim.pitch, -1.2, 1.2)
    : (two ? GUN_POSE.lowPitch2 : GUN_POSE.lowPitch1);
  const grip = aim.aiming
    ? (two ? GUN_POSE.aimGrip2 : GUN_POSE.aimGrip1)
    : (two ? GUN_POSE.lowGrip2 : GUN_POSE.lowGrip1);
  const lift = aim.aiming ? GUN_POSE.pitchLift * Math.sin(pitch) : 0;
  _grip.set(grip[0], grip[1] + lift, grip[2]);

  model.rig.updateWorldMatrix(true, true);
  const rightArm = model.arms.right;

  // 2. Right hand: the arm swings so its hand lands on the grip. No stretch.
  _target.copy(_grip);
  model.rig.localToWorld(_target);
  rightArm.parent?.worldToLocal(_target);
  _dir.subVectors(_target, rightArm.position).normalize();
  rightArm.quaternion.setFromUnitVectors(_up, _dir);
  rightArm.scale.set(1, 1, 1);

  // 3. The gun: prefab +y points along the aim (fwd), prefab +z points down the gun (down'), so the top (-z) is up.
  if (held) {
    _fwd.set(0, Math.sin(pitch), Math.cos(pitch));
    _down.set(0, -Math.cos(pitch), Math.sin(pitch));
    _right.crossVectors(_fwd, _down);
    _basis.makeBasis(_right, _fwd, _down);
    _qRig.setFromRotationMatrix(_basis);
    model.rig.getWorldQuaternion(_qRigWorld);
    _qWanted.copy(_qRigWorld).multiply(_qRig);
    const arm = held.parent ?? rightArm;
    arm.updateWorldMatrix(true, false);
    arm.getWorldQuaternion(_qArmWorld);
    _qInv.copy(_qArmWorld).invert();
    held.quaternion.copy(_qInv).multiply(_qWanted);
  }

  // 4. Left hand: on the gun's support pivot for two-handed guns, released otherwise.
  const leftArm = model.arms.left;
  const def = two ? getPrefab(prefabId) : undefined;
  if (two && held && def?.pivots?.support) {
    model.object.updateMatrixWorld(true);
    const s = pivotAt(def.pivots.support);
    const g = def.grip ?? [0, 0, 0];
    _support.set(s[0] - g[0], s[1] - g[1], s[2] - g[2]);
    held.localToWorld(_support);
    reachArm(leftArm, _support, { maxStretch: GUN_POSE.leftStretch });
  } else {
    releaseArm(leftArm);
  }
}

/** Undo poseGunArms: arm scales back to 1 and the held item back to its placeInHand orientation. */
export function clearGunArms(model: GnomeModel, held?: THREE.Object3D | null): void {
  releaseArm(model.arms.left);
  releaseArm(model.arms.right);
  if (held?.userData.baseQuat) held.quaternion.copy(held.userData.baseQuat as THREE.Quaternion);
}

/** World position of the held gun's muzzle (holder.userData.muzzle, holder-local), or of its far +y tip. */
export function muzzleWorld(held: THREE.Object3D, out: THREE.Vector3): THREE.Vector3 {
  held.updateWorldMatrix(true, true);
  const muzzle = held.userData.muzzle as readonly number[] | undefined;
  if (Array.isArray(muzzle)) {
    out.set(muzzle[0], muzzle[1], muzzle[2]);
    return held.localToWorld(out);
  }
  // No muzzle set: the top-centre of the gun's own geometry, in holder-local space.
  _inv.copy(held.matrixWorld).invert();
  _box.makeEmpty();
  held.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geom = mesh.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    if (!geom.boundingBox) return;
    _meshBox.copy(geom.boundingBox).applyMatrix4(mesh.matrixWorld).applyMatrix4(_inv);
    _box.union(_meshBox);
  });
  if (_box.isEmpty()) return held.getWorldPosition(out);
  const cx = (_box.min.x + _box.max.x) / 2;
  const cz = (_box.min.z + _box.max.z) / 2;
  out.set(cx, _box.max.y, cz);
  return held.localToWorld(out);
}
