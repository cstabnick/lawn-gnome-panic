// Driver hands: a seated gnome's arms reach the steering grips of the vehicle (and turn with the wheel) instead of resting on the lap.
// Called by player.ts (the player), traffic.ts (NPC riders) and remotes.ts (online drivers), each AFTER that gnome model's own update().
import * as THREE from 'three';
import type { GnomeModel } from '@lawn/gnome';
import { releaseArm, reachArm } from '@lawn/glaze';
import type { Vehicle } from './types';

/** How fast the hands ease on and off the grips (exp rate per second: about 0.25 s to settle). */
const EASE_RATE = 9;
/** Below this blend weight, a hand that is not wanted is released to the model's own pose. */
const WAKE_BELOW = 0.002;
const SIDES = ['left', 'right'] as const;
type Side = (typeof SIDES)[number];

/** Each gnome's blend weight: 0 = resting pose from the model, 1 = on the grips. */
const blend = new WeakMap<GnomeModel, { w: number }>();

// Module-level scratch values: this runs every frame for every driver, so it must not allocate.
const restQ: Record<Side, THREE.Quaternion> = { left: new THREE.Quaternion(), right: new THREE.Quaternion() };
const reachQ: Record<Side, THREE.Quaternion> = { left: new THREE.Quaternion(), right: new THREE.Quaternion() };
const reached: Record<Side, boolean> = { left: false, right: false };
const stretch: Record<Side, number> = { left: 1, right: 1 };
const gripPos = new THREE.Vector3();

/**
 * Point `model`'s arms at `v.rig.grips` when the vehicle has them and the gnome is the DRIVER (seat 0): reachArm both hands, ease between reaching and resting so entering and leaving does not snap,
 * and leave the arms to the model otherwise (passengers, vehicles without grips, wrecks). Safe to call every frame for any vehicle. `dt` (seconds) paces the ease in and out.
 */
export function poseHands(model: GnomeModel, v: Vehicle, seat = 0, dt = 1 / 60): void {
  const grips = v.rig?.grips ?? null;
  const eligible = seat === 0 && grips !== null && !v.exploded && !v.sunk && v.driver !== 'none';
  // A gnome that was never posed and is not posed now: leave its arms to the model entirely.
  let st = blend.get(model);
  if (!eligible && !st) return;
  if (!st) {
    st = { w: 0 };
    blend.set(model, st);
  }

  if (eligible) v.object.updateMatrixWorld(true);

  // Find each hand's reach target this frame. Every arm is restored to the model's pose afterwards; the blend below re-applies it.
  let allReached = eligible;
  for (const side of SIDES) {
    const arm = model.arms[side];
    restQ[side].copy(arm.quaternion);
    reached[side] = false;
    stretch[side] = 1;
    if (eligible && grips) {
      grips[side].getWorldPosition(gripPos);
      const r = reachArm(arm, gripPos);
      if (r.reached) {
        reached[side] = true;
        stretch[side] = r.stretch;
        reachQ[side].copy(arm.quaternion);
      } else {
        allReached = false;
      }
    }
    arm.quaternion.copy(restQ[side]);
    releaseArm(arm);
  }

  // Ease the shared weight towards "both hands on the grips".
  const wanted = allReached;
  st.w += ((wanted ? 1 : 0) - st.w) * (1 - Math.exp(-EASE_RATE * dt));
  if (st.w < WAKE_BELOW && !wanted) {
    st.w = 0;
    for (const side of SIDES) releaseArm(model.arms[side]);
    return;
  }

  // Blend each reached hand from its resting pose to the grip, stretching the arm a little when the grip is far.
  for (const side of SIDES) {
    if (!reached[side]) continue;
    const arm = model.arms[side];
    arm.quaternion.slerpQuaternions(restQ[side], reachQ[side], st.w);
    const s = 1 + (stretch[side] - 1) * st.w;
    const thin = 1 / Math.sqrt(s);
    arm.scale.set(thin, s, thin);
  }
}

/** Forget a gnome's hand blend and put both arm scales back to 1 (it left the vehicle, was yanked out, or respawned). */
export function clearHands(model: GnomeModel): void {
  blend.delete(model);
  releaseArm(model.arms.left);
  releaseArm(model.arms.right);
}
