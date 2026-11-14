// Low-poly 2008 Nissan 350Z (Z33, VQ35HR) coupe: the secret ride, unlocked by typing 350z on the title screen.
// Same interface as cartModel.ts so party.ts can swap them. Built facing +z, base at y = 0, units are yards.
// Real car: 169.8 in long, 71.5 in wide, 52.1 in tall, 104.3 in wheelbase, 60.5 in track, 18 in wheels.
// That is 4.7 x 2.0 x 1.45 yd, about the height of a standing gnome, so the gnomes sit low with only their
// heads and hats showing through the glass. Width is trimmed to 1.85 yd so the parked car clears the partner.
import * as THREE from 'three';
import type { CartModel } from './cartModel';

const PAINT = 0xc3c8cd; // Chrome Silver Metallic, a 2008 color
const GLASS = 0x1c2630;
const BLACK = 0x161616;
const TRIM = 0x2a2a2a;
const ALLOY = 0xb9c0c6;
const CHROME = 0xd8dde2;
const HEADLIGHT = 0xe9f1f6;
const TAILLIGHT = 0xd0161c;
const PLATE = 0xf2f2ea;

const LENGTH = 4.7;
const WIDTH = 1.85;
const HALF_L = LENGTH / 2;
const HALF_W = WIDTH / 2;
const WHEELBASE = 2.9;
const TRACK_HALF = 0.82;
const WHEEL_R = 0.37;
const WHEEL_W = 0.3;
/** Gnome feet sit low in the footwell: the beltline hides the body, heads and hats show through the glass. */
const SEAT_Y = 0.06;
const SEAT_Z = -0.4;

/** Rounded side edges: bevel depth across the width, and how far the bevel eats into the outline. */
const BEVEL_T = 0.13;
const BEVEL_S = 0.1;

/** Draws a side profile in (z, y) with curves; returns the shape. */
type Draw = (s: THREE.Shape) => void;

/** A curved side profile (z, y) extruded across the car's width with rounded edges, centred on x = 0.
 * The bevel is kept inside the outline and the width, so `width` is the true overall width. */
function profile(draw: Draw, width: number, bevelT = BEVEL_T, bevelS = BEVEL_S): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  draw(shape);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width - 2 * bevelT,
    curveSegments: 8,
    bevelEnabled: true,
    bevelThickness: bevelT,
    bevelSize: bevelS,
    bevelOffset: -bevelS,
    bevelSegments: 3,
  });
  // Shape x is the car's z, the extrusion runs along the car's x.
  geo.rotateY(-Math.PI / 2);
  geo.translate(width / 2 - bevelT, 0, 0);
  return geo;
}

/** Greenhouse outline: windshield curving into a short arched roof that sweeps down the fastback. */
const drawGreenhouse: Draw = (s) => {
  s.moveTo(0.82, 0.84);
  s.quadraticCurveTo(0.3, 1.36, -0.4, 1.45);
  s.quadraticCurveTo(-1.25, 1.47, -2.0, 0.96);
  s.lineTo(-2.0, 0.84);
  s.lineTo(0.82, 0.84);
};

export function createZ33Model(): CartModel {
  const group = new THREE.Group();
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (color: number, opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial => {
    const key = `${color}|${JSON.stringify(opts)}`;
    let m = mats.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, flatShading: true, ...opts });
      mats.set(key, m);
    }
    return m;
  };
  const add = (
    geo: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = group,
  ): THREE.Mesh => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const paint = mat(PAINT, { roughness: 0.35, metalness: 0.25 });

  // Lower body: rounded nose, long domed hood rising to the cowl, high round shoulder, ducktail, rounded tail.
  add(
    profile((p) => {
      p.moveTo(-2.2, 0.16);
      p.lineTo(2.2, 0.16);
      p.quadraticCurveTo(HALF_L + 0.03, 0.17, HALF_L, 0.38); // chin
      p.quadraticCurveTo(HALF_L - 0.02, 0.6, 2.0, 0.67); // round nose into the headlights
      p.quadraticCurveTo(1.4, 0.8, 0.75, 0.86); // domed hood
      p.quadraticCurveTo(-0.6, 0.93, -1.95, 0.95); // shoulder under the glass
      p.quadraticCurveTo(-2.25, 0.99, -HALF_L + 0.02, 0.95); // ducktail lip
      p.quadraticCurveTo(-HALF_L - 0.06, 0.6, -HALF_L + 0.02, 0.3); // round tail
      p.quadraticCurveTo(-HALF_L + 0.05, 0.16, -2.2, 0.16);
    }, WIDTH),
    paint,
    0,
    0,
    0,
  );

  // Swollen fenders: a rounded arch lip flaring out over each wheel.
  for (const side of [-1, 1]) {
    for (const z of [WHEELBASE / 2, -WHEELBASE / 2]) {
      const arch = new THREE.TorusGeometry(WHEEL_R + 0.1, 0.1, 6, 12, Math.PI);
      arch.rotateY(Math.PI / 2);
      arch.scale(0.9, 1, 1.12);
      add(arch, paint, side * (HALF_W - 0.06), WHEEL_R, z);
    }
  }

  // Greenhouse: tinted, see-through glass so the gnomes show, with rounded edges (tumblehome).
  const glass = new THREE.MeshStandardMaterial({
    color: GLASS,
    roughness: 0.1,
    metalness: 0.4,
    transparent: true,
    opacity: 0.45,
  });
  const greenhouse = add(profile(drawGreenhouse, WIDTH - 0.32), glass, 0, 0, 0);
  greenhouse.castShadow = false;
  greenhouse.renderOrder = 1;

  // Painted roof skin following the glass's arch from the top of the windshield down the fastback.
  const top = new THREE.Shape();
  drawGreenhouse(top);
  const arch = top.getPoints(16).filter((v) => v.y > 1.2 && v.x < 0.2 && v.x > -1.45);
  add(
    profile((p) => {
      arch.forEach((v, i) => (i === 0 ? p.moveTo(v.x, v.y + 0.015) : p.lineTo(v.x, v.y + 0.015)));
      for (let i = arch.length - 1; i >= 0; i--) p.lineTo(arch[i].x, arch[i].y - 0.06);
    }, WIDTH - 0.3, 0.1, 0.02), // thin skin: a small in-plane bevel so the outline cannot invert
    paint,
    0,
    0,
    0,
  );

  // Front: wide black mouth, swept-back headlights climbing the fenders, side mirrors.
  add(new THREE.BoxGeometry(0.95, 0.15, 0.06), mat(BLACK), 0, 0.3, HALF_L - 0.06);
  for (const side of [-1, 1]) {
    const head = add(
      new THREE.BoxGeometry(0.4, 0.05, 0.42),
      mat(HEADLIGHT, { emissive: 0x555a5e, roughness: 0.2 }),
      side * 0.56,
      0.65,
      HALF_L - 0.33,
    );
    head.rotation.set(0.3, side * 0.3, 0); // lies on the nose, swept back toward the fenders
    const mirror = add(new THREE.BoxGeometry(0.16, 0.1, 0.12), paint, side * (HALF_W + 0.04), 0.98, 0.6);
    mirror.rotation.y = side * 0.2;
  }

  // Rear: boomerang tail lights wrapping onto the fenders, plate, twin exhausts at the corners.
  for (const side of [-1, 1]) {
    const lower = add(new THREE.BoxGeometry(0.4, 0.09, 0.05), mat(TAILLIGHT, { emissive: 0x4a0000 }), side * 0.55, 0.8, -HALF_L - 0.03);
    lower.rotation.z = side * 0.25;
    const upper = add(new THREE.BoxGeometry(0.05, 0.09, 0.34), mat(TAILLIGHT, { emissive: 0x4a0000 }), side * (HALF_W - 0.01), 0.87, -HALF_L + 0.18);
    upper.rotation.x = 0.25;
    const pipe = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
    pipe.rotateX(Math.PI / 2);
    add(pipe, mat(CHROME, { metalness: 0.8, roughness: 0.25 }), side * 0.62, 0.24, -HALF_L + 0.02);
  }
  add(new THREE.BoxGeometry(0.42, 0.2, 0.02), mat(PLATE), 0, 0.58, -HALF_L - 0.06);
  add(new THREE.BoxGeometry(WIDTH - 0.1, 0.1, 0.06), mat(TRIM), 0, 0.2, -HALF_L + 0.06); // diffuser

  // Doors: the 350Z's vertical door handles and a black rocker strip between the wheels.
  for (const side of [-1, 1]) {
    add(new THREE.BoxGeometry(0.03, 0.18, 0.05), mat(CHROME, { metalness: 0.8, roughness: 0.25 }), side * (HALF_W + 0.01), 0.8, -0.72);
    add(new THREE.BoxGeometry(0.02, 0.08, 1.9), mat(TRIM), side * (HALF_W + 0.005), 0.22, 0);
  }

  // Wheels: tyre plus a five-spoke alloy face on the outside. Each wheel spins about its axis (local x).
  const wheels: { mesh: THREE.Mesh; radius: number }[] = [];
  const tyreGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 14);
  tyreGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(WHEEL_R * 0.66, WHEEL_R * 0.66, 0.03, 10);
  rimGeo.rotateZ(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(0.035, WHEEL_R * 0.62, 0.07);
  spokeGeo.translate(0, WHEEL_R * 0.31, 0); // from the hub outward
  for (const side of [-1, 1]) {
    for (const z of [WHEELBASE / 2, -WHEELBASE / 2]) {
      const tyre = add(tyreGeo, mat(BLACK, { roughness: 0.9 }), side * TRACK_HALF, WHEEL_R, z);
      const face = side * (WHEEL_W / 2 + 0.005);
      add(rimGeo, mat(TRIM), face, 0, 0, tyre);
      for (let i = 0; i < 5; i++) {
        const spoke = add(spokeGeo, mat(ALLOY, { metalness: 0.7, roughness: 0.3 }), face + side * 0.015, 0, 0, tyre);
        spoke.rotation.x = (i / 5) * Math.PI * 2;
      }
      wheels.push({ mesh: tyre, radius: WHEEL_R });
    }
  }

  // US car: driver on the left (+x), passenger on the right (-x).
  const seats = [new THREE.Vector3(0.4, SEAT_Y, SEAT_Z), new THREE.Vector3(-0.4, SEAT_Y, SEAT_Z)];

  let clock = 0;
  return {
    group,
    seats,
    seatFacing: seats.map(() => 0),
    animate(dt: number, speed: number): void {
      for (const w of wheels) w.mesh.rotation.x += (speed / w.radius) * dt;
      clock += dt;
      // A smooth V6 idle: a faint rumble parked or moving, a little squat under throttle.
      group.rotation.z = Math.sin(clock * 30) * 0.002;
      group.rotation.x = speed > 0.01 ? -0.01 : 0;
    },
  };
}
