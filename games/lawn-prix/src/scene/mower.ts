// STUB (Epic 2 fills this in): the mower models, built from three.js primitives.
import * as THREE from 'three';
import type { VehicleId } from '../config';

export interface MowerModel {
  /** Origin on the ground at the middle of the wheelbase; faces +z. */
  object: THREE.Group;
  /** Where the gnome's feet go, in object space (the gnome is added as a child at this position). */
  seat: THREE.Vector3;
  /** Arm pose for the gnome: GnomeModel.arms.left/right.rotation.x (negative = forward, reaching for the wheel/handle). */
  armReach: number;
  /** Spin wheels and blades, turn the steering wheel / handlebar. speed m/s (signed), steer -1..1 (+1 = right). */
  update(speed: number, steer: number, dt: number): void;
}

export function createMower(vehicle: VehicleId, color: number): MowerModel {
  void vehicle;
  const object = new THREE.Group();
  object.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1.6), new THREE.MeshStandardMaterial({ color })));
  return { object, seat: new THREE.Vector3(0, 0.5, -0.2), armReach: -1, update() {} };
}
