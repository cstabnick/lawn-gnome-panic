// Arm reach: swing a gnome's rigid arm pivot toward a world point (a steering-wheel grip), stretching it a little when the point is far.
// The gnome's arm (packages/gnome model.ts makeArm) is a pivot at the shoulder; a 0.3-long box hangs from it along -y and a 0.06 hand ball sits at y = -0.32.
// STUB (see the issue that owns this file).
import * as THREE from 'three';

/** Distance from a gnome's shoulder pivot to the middle of its hand ball, gnome units. */
export const ARM_LENGTH = 0.32;

export interface ArmReach {
  /** True when the target was within reach (length x maxStretch) and the arm was posed on it. False: the arm was left alone. */
  reached: boolean;
  /** The y-scale applied to the arm pivot (1 = no stretch). */
  stretch: number;
}

export interface ReachOptions {
  /** Longest stretch allowed, as a multiple of the arm. Default 1.45. */
  maxStretch?: number;
}

/**
 * Point `arm` (an Object3D hanging along its local -y) at world point `target`: set its quaternion in its parent's space and its scale.y so the hand ball lands on the target.
 * When the target is farther than ARM_LENGTH * maxStretch, do NOT move the arm and return reached false. Call it every frame AFTER the gnome model's own update(), which overwrites arm rotations.
 * Must work when the gnome's rig has a non-unit scale (read the parent's world matrix; call updateWorldMatrix on the parent first).
 */
export function reachArm(arm: THREE.Object3D, target: THREE.Vector3, opts: ReachOptions = {}): ArmReach {
  void arm; void target; void opts;
  return { reached: false, stretch: 1 };
}

/** Put the arm pivot's scale back to 1 (rotation is left to the gnome model's own update). */
export function releaseArm(arm: THREE.Object3D): void {
  arm.scale.set(1, 1, 1);
}

/** reachArm for both hands: left arm to the left grip's world position, right arm to the right's. Returns both results; an unreached arm is released. */
export function poseHandsOnGrips(
  arms: { left: THREE.Object3D; right: THREE.Object3D },
  grips: { left: THREE.Object3D; right: THREE.Object3D },
  opts: ReachOptions = {},
): { left: ArmReach; right: ArmReach } {
  const p = new THREE.Vector3();
  const out = { left: { reached: false, stretch: 1 }, right: { reached: false, stretch: 1 } };
  for (const side of ['left', 'right'] as const) {
    grips[side].getWorldPosition(p);
    out[side] = reachArm(arms[side], p, opts);
    if (!out[side].reached) releaseArm(arms[side]);
  }
  return out;
}
