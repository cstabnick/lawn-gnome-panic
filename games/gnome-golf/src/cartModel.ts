// Riding lawn-mower golf cart, built from the golf-cart / golf-cart-4 prefabs. Built facing +z, base at y = 0.
// The 2-seat cart (solo) is roughly 2.4 yd long, 1.5 yd wide. The 4-seat cart (online convoy) is 3 yd long and
// fits CART_BOX (|x| <= 0.8, |z| <= 1.5, height <= 2.1, centred on the origin). party.ts parks it and seats the gnomes on `seats`.
import * as THREE from 'three';
import { buildPrefab } from '@lawn/prefabs';

const RED_DEFAULT = 0xd8342c;

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
  const group = new THREE.Group();
  const body = buildPrefab(opts.seats === 4 ? 'golf-cart-4' : 'golf-cart', { tint: opts.color ?? RED_DEFAULT });
  group.add(body);

  // Wheels are pivot groups 'wheel-<n>' at their centres; the pivot y is the wheel radius.
  const wheels = body.children
    .filter((c) => c.name.startsWith('wheel-'))
    .map((w) => ({ node: w, radius: w.position.y }));

  let seats: THREE.Vector3[];
  let seatFacing: number[];
  if (opts.seats === 4) {
    seats = [
      new THREE.Vector3(0.33, SEAT_Y, -0.2), // 0: driver, front bench, +x
      new THREE.Vector3(-0.33, SEAT_Y, -0.2), // 1: front bench passenger
      new THREE.Vector3(0.33, SEAT_Y, -0.95), // 2: rear bench, faces backwards
      new THREE.Vector3(-0.33, SEAT_Y, -0.95), // 3: rear bench, faces backwards
    ];
    seatFacing = [0, 0, Math.PI, Math.PI];
  } else {
    seats = [new THREE.Vector3(0.32, SEAT_Y, -0.1), new THREE.Vector3(-0.32, SEAT_Y, -0.1)];
    seatFacing = seats.map(() => 0);
  }

  let clock = 0;
  return {
    group,
    seats,
    seatFacing,
    animate(dt: number, speed: number): void {
      for (const w of wheels) w.node.rotation.x += (speed / w.radius) * dt;
      if (speed > 0.01) {
        clock += dt;
        body.rotation.z = Math.sin(clock * 45) * 0.012; // engine shake
      } else {
        body.rotation.z = 0;
      }
    },
  };
}
