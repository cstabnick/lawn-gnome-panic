// Wheels: new tyres and rims in place of a prefab's own, wheel size, and camber.
// STUB (see the issue that owns this file).
import * as THREE from 'three';
import type { Loadout, VehicleMounts } from './types';

export interface WheelResult {
  /** Mean extra tyre radius over stock, prefab units (+ for bigger wheels, - for smaller): the body shell is lifted by this much so the bigger tyre does not sink. */
  lift: number;
  /** Wheel pivots found (by index 0..3), after the swap. */
  wheels: (THREE.Object3D | undefined)[];
  /** Objects to spin by update(dt) (the 'spinner' rim's blades), each with its own spin rate rad/s. */
  spinners: { object: THREE.Object3D; rate: number }[];
}

/**
 * For each `mounts.wheels` entry whose pivot group exists under `root` and still has its original tyre parts (a wheel a damage stage removed stays removed): measure its radius (half the bounding-box height) and width (bounding-box x size),
 * and, unless tyre, rim and wheelSize are all stock, replace its children with the new tyre (prefab `glaze-tyre-<id>`, falls back to the original for 'stock') and rim (`glaze-rim-<id>`, tinted rimColor), sized to radius * wheelSize.
 * Raise each wheel pivot's y by its own radius change so the tyre bottom stays on the ground. Idempotent: calling twice gives the same result (it must recognise its own earlier output).
 * With everything stock it changes nothing and returns lift 0.
 */
export function applyWheels(_root: THREE.Object3D, _mounts: VehicleMounts, _loadout: Loadout): WheelResult {
  return { lift: 0, wheels: [], spinners: [] };
}

/**
 * Set a wheel's rotation: `spin` about its axle (x), `steer` yaw about the vertical (front wheels; pass 0 for rear), then `camber` about the forward axis (z), in RADIANS.
 * Sets rotation.order to 'ZYX' and flips the camber's sign for a wheel on the right (-x) side so a NEGATIVE camber always leans the tops of both wheels IN. Replaces the game's `wheel.rotation.set(spin, steer, 0, 'YXZ')`.
 */
export function setWheelPose(wheel: THREE.Object3D, spin: number, steer: number, camber: number): void {
  wheel.rotation.order = 'ZYX';
  wheel.rotation.set(spin, steer, camber);
}
