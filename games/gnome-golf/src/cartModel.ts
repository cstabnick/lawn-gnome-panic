// Riding lawn-mower golf cart, built from three.js primitives. Built facing +z, base at y = 0.
// Roughly 2.4 yd long, 1.5 yd wide. party.ts parks it and seats the gnomes on `seats`.
import * as THREE from 'three';

const RED = 0xd8342c;
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

export function createCartModel(): { group: THREE.Group; seats: THREE.Vector3[]; animate(dt: number, speed: number): void } {
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
  wheel(0.3, 0.18, -0.7, -0.85);
  wheel(0.3, 0.18, 0.7, -0.85);
  wheel(0.2, 0.16, -0.68, 0.85);
  wheel(0.2, 0.16, 0.68, 0.85);

  const seats = [new THREE.Vector3(0.32, SEAT_Y, -0.1), new THREE.Vector3(-0.32, SEAT_Y, -0.1)];

  let clock = 0;
  return {
    group,
    seats,
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
