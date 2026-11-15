// The mower models, built from three.js primitives. Gnome-sized (about 1.3 x 2.0 m for the cart, 0.6 x 1.5 m for the bike).
import * as THREE from 'three';
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

const TYRE = 0x222222;
const METAL = 0x8a8f96;
const SEAT = 0x333333;

/** A cylinder along the x axis (an axle or a wheel), as a mesh. */
function axleMesh(radius: number, width: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, width, 16);
  geo.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

/** A thin bar between two points in object space. */
function bar(a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 8), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  return mesh;
}

function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

/** A wheel: an outer holder at the axle (for steering yaw), a spinning inner mesh (for roll). */
interface Wheel {
  holder: THREE.Group;
  spin: THREE.Object3D;
  radius: number;
}

function makeWheel(x: number, y: number, z: number, radius: number, width: number): Wheel {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  const spin = axleMesh(radius, width, new THREE.MeshStandardMaterial({ color: TYRE, roughness: 0.9 }));
  holder.add(spin);
  return { holder, spin, radius };
}

function makeCart(color: number): { object: THREE.Group; seat: THREE.Vector3; armReach: number; update: MowerModel['update'] } {
  const object = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color });
  const deckPaint = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8) });
  const metal = new THREE.MeshStandardMaterial({ color: METAL, metalness: 0.4, roughness: 0.5 });
  const seatMat = new THREE.MeshStandardMaterial({ color: SEAT });

  // Low, wide deck (the housing) and the hood in front.
  object.add(box(1.2, 0.2, 1.7, deckPaint, 0, 0.35, 0));
  object.add(box(1.0, 0.25, 0.5, paint, 0, 0.5, 0.95));
  object.add(box(0.7, 0.12, 0.05, metal, 0, 0.45, 1.2));
  // Side grass chute.
  object.add(box(0.12, 0.2, 0.4, deckPaint, 0.66, 0.45, -0.2));

  // Seat and backrest at the rear.
  object.add(box(0.5, 0.12, 0.5, seatMat, 0, 0.42, -0.35));
  object.add(box(0.5, 0.55, 0.1, seatMat, 0, 0.7, -0.62));

  // Wheels: big rear, small front (front yaws with the steering).
  const rearL = makeWheel(-0.6, 0.275, -0.55, 0.275, 0.2);
  const rearR = makeWheel(0.6, 0.275, -0.55, 0.275, 0.2);
  const frontL = makeWheel(-0.55, 0.175, 0.6, 0.175, 0.16);
  const frontR = makeWheel(0.55, 0.175, 0.6, 0.175, 0.16);
  for (const w of [rearL, rearR, frontL, frontR]) object.add(w.holder);

  // Steering column leaning back toward the driver, with a wheel on top (the wheel spins about the column).
  const column = new THREE.Group();
  column.position.set(0, 0.7, 0.25);
  column.rotation.x = -0.5;
  column.add(bar(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.5, 0), 0.02, metal));
  const steerGroup = new THREE.Group();
  steerGroup.position.set(0, 0.5, 0);
  const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 24), seatMat);
  wheelRing.rotation.x = Math.PI / 2;
  wheelRing.castShadow = true;
  steerGroup.add(wheelRing);
  column.add(steerGroup);
  object.add(column);

  return {
    object,
    seat: new THREE.Vector3(0, 0.45, -0.35),
    armReach: -1.2,
    update(speed, steer, dt) {
      for (const w of [rearL, rearR, frontL, frontR]) w.spin.rotation.x += (speed / w.radius) * dt;
      // Right is -x in object space, so a right turn yaws the front wheels negative about y.
      frontL.holder.rotation.y = -steer * 0.5;
      frontR.holder.rotation.y = -steer * 0.5;
      steerGroup.rotation.y = -steer * 1.2;
    },
  };
}

function makeBike(color: number): { object: THREE.Group; seat: THREE.Vector3; armReach: number; update: MowerModel['update'] } {
  const object = new THREE.Group();
  const deckPaint = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.8) });
  const metal = new THREE.MeshStandardMaterial({ color: METAL, metalness: 0.4, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: SEAT });

  // Round flat deck with a footplate on its rear.
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 20), deckPaint);
  deck.position.set(0, 0.2, 0);
  deck.castShadow = true;
  object.add(deck);
  object.add(box(0.4, 0.03, 0.3, dark, 0, 0.27, -0.4));

  // Engine block with a pull-cord handle on top.
  object.add(box(0.3, 0.25, 0.3, metal, 0, 0.4, 0));
  object.add(box(0.12, 0.04, 0.04, dark, 0, 0.56, -0.1));

  // Four small wheels.
  const wheels = [
    makeWheel(-0.28, 0.1, 0.3, 0.1, 0.06),
    makeWheel(0.28, 0.1, 0.3, 0.1, 0.06),
    makeWheel(-0.28, 0.1, -0.3, 0.1, 0.06),
    makeWheel(0.28, 0.1, -0.3, 0.1, 0.06),
  ];
  for (const w of wheels) object.add(w.holder);

  // Blade disc under the deck.
  const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 16), metal);
  blade.position.set(0, 0.09, 0);
  object.add(blade);

  // U-shaped push handle, ahead of the gnome, yawing with the steering.
  const handle = new THREE.Group();
  handle.position.set(0, 0.3, -0.1);
  const postL0 = new THREE.Vector3(-0.25, 0, 0);
  const postR0 = new THREE.Vector3(0.25, 0, 0);
  const postL1 = new THREE.Vector3(-0.25, 0.7, 0.3);
  const postR1 = new THREE.Vector3(0.25, 0.7, 0.3);
  handle.add(bar(postL0, postL1, 0.02, metal));
  handle.add(bar(postR0, postR1, 0.02, metal));
  handle.add(bar(postL1, postR1, 0.025, dark));
  object.add(handle);

  return {
    object,
    seat: new THREE.Vector3(0, 0.25, -0.45),
    armReach: -1.4,
    update(speed, steer, dt) {
      for (const w of wheels) w.spin.rotation.x += (speed / w.radius) * dt;
      if (Math.abs(speed) > 0.5) blade.rotation.y += 80 * dt;
      handle.rotation.y = -steer * 0.35;
    },
  };
}

export function createMower(vehicle: VehicleId, color: number): MowerModel {
  const parts = vehicle === 'bike' ? makeBike(color) : makeCart(color);
  parts.object.scale.setScalar(VEHICLES[vehicle].scale);
  return parts;
}
