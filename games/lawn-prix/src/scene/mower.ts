// The mower models, built from the lawn-prix prefabs (catalog/lawn-prix.ts): the ride-on mower (cart) and the
// push-mower bike. Gnome-sized (about 1.3 x 2.0 m for the cart, 0.6 x 1.5 m for the bike). The game animates the
// prefab's named pivots: wheel-<n> (spin, and yaw for the front pair), steer (the cart's wheel), blade and handle (bike).
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';
import { VEHICLES, type VehicleId } from '../config';

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

/** The steering column's tilt, rad (negative = leaning back toward the driver). Set on the cart's steer pivot. */
const COLUMN_TILT = -0.5;

/** A named pivot of a mower prefab. Throws if the prefab lacks it, so a renamed pivot fails loudly. */
function pivot(root: THREE.Object3D, name: string): THREE.Object3D {
  const p = root.getObjectByName(name);
  if (!p) throw new Error(`mower prefab has no pivot '${name}'`);
  return p;
}

function makeCart(color: number): MowerModel {
  const object = buildPrefab('ride-on-mower', { tint: color, scale: VEHICLES.cart.scale });
  // Spin then yaw (the wheel's own axle, then its steering), so the front pair can turn with the wheel.
  const wheels = [
    { w: pivot(object, 'wheel-0'), r: 0.275, front: false },
    { w: pivot(object, 'wheel-1'), r: 0.275, front: false },
    { w: pivot(object, 'wheel-2'), r: 0.175, front: true },
    { w: pivot(object, 'wheel-3'), r: 0.175, front: true },
  ];
  for (const { w } of wheels) w.rotation.order = 'YXZ';
  const steer = pivot(object, 'steer');
  // Tilt first, then turn about the column: the wheel yaws about its own column.
  steer.rotation.order = 'XYZ';
  steer.rotation.x = COLUMN_TILT;
  return {
    object,
    seat: new THREE.Vector3(0, 0.45, -0.35),
    armReach: -1.2,
    update(speed, steerInput, dt) {
      for (const { w, r, front } of wheels) {
        w.rotation.x += (speed / r) * dt;
        // Right is -x in object space, so a right turn yaws the front wheels negative about y.
        if (front) w.rotation.y = -steerInput * 0.5;
      }
      steer.rotation.y = -steerInput * 1.2;
    },
  };
}

function makeBike(color: number): MowerModel {
  const object = buildPrefab('push-mower-bike', { tint: color, scale: VEHICLES.bike.scale });
  const wheels = ['wheel-0', 'wheel-1', 'wheel-2', 'wheel-3'].map((n) => pivot(object, n));
  const blade = pivot(object, 'blade');
  const handle = pivot(object, 'handle');
  return {
    object,
    seat: new THREE.Vector3(0, 0.25, -0.45),
    armReach: -1.4,
    update(speed, steer, dt) {
      for (const w of wheels) w.rotation.x += (speed / 0.1) * dt;
      if (Math.abs(speed) > 0.5) blade.rotation.y += 80 * dt;
      handle.rotation.y = -steer * 0.35;
    },
  };
}

export function createMower(vehicle: VehicleId, color: number): MowerModel {
  return vehicle === 'bike' ? makeBike(color) : makeCart(color);
}
