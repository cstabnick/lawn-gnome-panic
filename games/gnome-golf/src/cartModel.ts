// Riding lawn-mower golf cart, built from three.js primitives. Built facing +z, base at y = 0.
// The 2-seat cart (solo) is roughly 2.4 yd long, 1.5 yd wide. The 4-seat cart (online convoy) is 3 yd long and
// fits CART_BOX (|x| <= 0.8, |z| <= 1.5, height <= 2.1, centred on the origin). party.ts parks it and seats the gnomes on `seats`.
import * as THREE from 'three';

const RED_DEFAULT = 0xd8342c;
const CREAM = 0xf3e6c4;
const DARK = 0x222222;
const BLACK = 0x1a1a1a;
const SEAT = 0x3a3a3a;
const METAL = 0x8a9399;
const CANOPY = 0xffffff;
const BAG = 0x9c6b3c;
const CLUB_HEAD = 0x444444;
const STRIPE = 0xf2c230;

/** Seat feet positions (cart local): driver on the left (+x), passenger on the right (-x). */
const SEAT_Y = 0.75;

export interface CartOptions {
  /** Body colour (default red). */
  color?: number;
  /** 2 (the solo cart: driver and partner) or 4 (online: a front bench and a backward-facing rear bench). */
  seats?: 2 | 4;
}

export interface CartModel {
  group: THREE.Group;
  /** Seat feet positions, cart local. Seat 0 is the driver (left, +x). */
  seats: THREE.Vector3[];
  /** Yaw of each seat relative to the cart: 0 = facing forward (+z), Math.PI = facing backward. */
  seatFacing: number[];
  animate(dt: number, speed: number): void;
}

export function createCartModel(opts: CartOptions = {}): CartModel {
  const RED = opts.color ?? RED_DEFAULT;
  const group = new THREE.Group();
  const mats = new Map<number, THREE.MeshStandardMaterial>();
  const mat = (color: number): THREE.MeshStandardMaterial => {
    let m = mats.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      mats.set(color, m);
    }
    return m;
  };
  const add = (geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number, parent: THREE.Object3D = group): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Wheels: a rear pair (bigger) and a front pair. Each wheel spins about its axis (local x).
  const wheels: { mesh: THREE.Mesh; radius: number }[] = [];
  const wheel = (radius: number, width: number, x: number, z: number): void => {
    const geo = new THREE.CylinderGeometry(radius, radius, width, 14);
    geo.rotateZ(Math.PI / 2); // axis along x
    const m = add(geo, BLACK, x, radius, z);
    // A stripe across the tread so the spin shows.
    add(new THREE.BoxGeometry(width + 0.02, 0.05, 0.05), STRIPE, 0, 0, radius * 0.8, m);
    wheels.push({ mesh: m, radius });
  };

  let seats: THREE.Vector3[];
  let seatFacing: number[];

  if (opts.seats === 4) {
    // Body: rear tub under the rear bench, front tub under the front bench, front connector, cream hood, mower deck.
    add(new THREE.BoxGeometry(1.3, 0.4, 1.0), RED, 0, 0.4, -1.0);
    add(new THREE.BoxGeometry(1.3, 0.4, 0.6), RED, 0, 0.4, -0.2);
    add(new THREE.BoxGeometry(1.3, 0.3, 0.3), RED, 0, 0.35, 0.3);
    add(new THREE.BoxGeometry(1.1, 0.2, 0.6), CREAM, 0, 0.45, 0.85);
    add(new THREE.BoxGeometry(1.2, 0.14, 1.0), DARK, 0, 0.12, 0);

    // Front bench (driver and passenger face forward). Its backrest is the wall both benches lean on.
    add(new THREE.BoxGeometry(1.2, 0.12, 0.5), SEAT, 0, SEAT_Y - 0.06, -0.2);
    add(new THREE.BoxGeometry(1.2, 0.55, 0.1), SEAT, 0, 0.99, -0.52);

    // Rear bench: the two passengers face backwards, toward that wall. A footrest sits at the tail.
    add(new THREE.BoxGeometry(1.2, 0.12, 0.5), SEAT, 0, SEAT_Y - 0.06, -0.95);
    add(new THREE.BoxGeometry(1.1, 0.05, 0.24), DARK, 0, 0.63, -1.37);

    // Steering column leaning back from the driver's seat, with a wheel on top.
    const column = add(new THREE.CylinderGeometry(0.03, 0.03, 0.39, 8), METAL, 0.33, 0.925, 0.185);
    column.rotation.x = 0.45;
    add(new THREE.TorusGeometry(0.16, 0.025, 6, 16), DARK, 0.33, 1.1, 0.265).rotation.x = -0.45;

    // Longer canopy over both benches, on four thin posts.
    add(new THREE.BoxGeometry(1.5, 0.08, 2.1), CANOPY, 0, 2.06, -0.4);
    for (const x of [-0.68, 0.68]) {
      for (const z of [-1.3, 0.5]) {
        add(new THREE.CylinderGeometry(0.025, 0.025, 1.35, 6), METAL, x, 1.425, z);
      }
    }

    // Golf bags strapped on the outside, one per side, with a club each.
    for (const x of [-0.7, 0.7]) {
      add(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 10), BAG, x, 0.9, -0.6);
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 6), METAL, x, 1.45, -0.6);
    }

    wheel(0.3, 0.18, -0.68, -1.05);
    wheel(0.3, 0.18, 0.68, -1.05);
    wheel(0.2, 0.16, -0.66, 0.9);
    wheel(0.2, 0.16, 0.66, 0.9);

    seats = [
      new THREE.Vector3(0.33, SEAT_Y, -0.2), // 0: driver, front bench, +x
      new THREE.Vector3(-0.33, SEAT_Y, -0.2), // 1: front bench passenger
      new THREE.Vector3(0.33, SEAT_Y, -0.95), // 2: rear bench, faces backwards
      new THREE.Vector3(-0.33, SEAT_Y, -0.95), // 3: rear bench, faces backwards
    ];
    seatFacing = [0, 0, Math.PI, Math.PI];
  } else {
    // Body: rear tub, front connector, cream hood, dark mower deck under the middle.
    add(new THREE.BoxGeometry(1.3, 0.4, 1.2), RED, 0, 0.4, -0.5);
    add(new THREE.BoxGeometry(1.3, 0.3, 0.3), RED, 0, 0.35, 0.25);
    add(new THREE.BoxGeometry(1.0, 0.2, 0.8), CREAM, 0, 0.45, 0.75);
    add(new THREE.BoxGeometry(1.1, 0.14, 1.0), DARK, 0, 0.12, 0.1);

    // Bench seat and its backrest.
    add(new THREE.BoxGeometry(1.1, 0.12, 0.6), SEAT, 0, SEAT_Y - 0.06, -0.25);
    add(new THREE.BoxGeometry(1.2, 0.55, 0.1), SEAT, 0, 0.99, -0.6);

    // Steering column leaning back from the driver's seat, with a wheel on top.
    const column = add(new THREE.CylinderGeometry(0.03, 0.03, 0.39, 8), METAL, 0.32, 0.925, 0.035);
    column.rotation.x = 0.45;
    add(new THREE.TorusGeometry(0.16, 0.025, 6, 16), DARK, 0.32, 1.1, 0.12).rotation.x = -0.45;

    // Canopy roof on four thin posts.
    add(new THREE.BoxGeometry(1.5, 0.08, 1.6), CANOPY, 0, 2.06, -0.25);
    for (const x of [-0.7, 0.7]) {
      for (const z of [-1.0, 0.5]) {
        add(new THREE.CylinderGeometry(0.025, 0.025, 1.35, 6), METAL, x, 1.425, z);
      }
    }

    // Golf bag strapped behind the seat, with three club heads poking out of the top.
    const bagX = -0.3;
    const bagZ = -0.85;
    add(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 10), BAG, bagX, 1.0, bagZ);
    const clubs: [number, number][] = [[-0.06, -0.03], [0.02, 0.05], [0.07, -0.02]];
    for (const [dx, dz] of clubs) {
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), METAL, bagX + dx, 1.45, bagZ + dz);
      add(new THREE.BoxGeometry(0.06, 0.04, 0.12), CLUB_HEAD, bagX + dx, 1.82, bagZ + dz);
    }

    wheel(0.3, 0.18, -0.7, -0.85);
    wheel(0.3, 0.18, 0.7, -0.85);
    wheel(0.2, 0.16, -0.68, 0.85);
    wheel(0.2, 0.16, 0.68, 0.85);

    seats = [new THREE.Vector3(0.32, SEAT_Y, -0.1), new THREE.Vector3(-0.32, SEAT_Y, -0.1)];
    seatFacing = seats.map(() => 0);
  }

  let clock = 0;
  return {
    group,
    seats,
    seatFacing,
    animate(dt: number, speed: number): void {
      for (const w of wheels) w.mesh.rotation.x += (speed / w.radius) * dt;
      if (speed > 0.01) {
        clock += dt;
        group.rotation.z = Math.sin(clock * 45) * 0.012; // engine shake
      } else {
        group.rotation.z = 0;
      }
    },
  };
}
