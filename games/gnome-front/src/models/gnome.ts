// src/models/gnome.ts: copied unchanged from games/sample-3d/src/gnome.ts (Lawn Gnome Panic).
import * as THREE from 'three';
import { CHARACTERS, COLORS, type GnomeLook, type GnomeModel, type PlayerState, TUNING } from './config';

/** Limb targets while airborne (radians). Left leg +, right leg -, arms both up. */
const LEG_AIR_LEFT = 0.5;
const LEG_AIR_RIGHT = -0.3;
const ARM_AIR = -2.4;

/** Double-jump front flip: seconds for one full turn, and the pivot height (about the belly). */
const FLIP_DURATION = 0.45;
const FLIP_PIVOT_Y = 0.5;

/** Freckle spots as directions from the head centre. They are normalised and pushed onto the skin in code. */
// Upper cheeks and the bridge of the nose only (between the nose at y 0 and the eyes at y +0.06):
// lower on the face they read as stubble.
const FRECKLE_DIRS: readonly (readonly [number, number, number])[] = [
  [0.065, 0.025, 0.155], [0.09, 0.03, 0.135], [0.075, 0.045, 0.15],
  [-0.065, 0.025, 0.155], [-0.09, 0.03, 0.135], [-0.075, 0.045, 0.15],
  [0.018, 0.045, 0.168], [-0.018, 0.04, 0.168],
];
/** Faint and flat: a pale tan just darker than fair skin, not orange. */
const FRECKLE_COLOR = 0xe2b49a;

/** Builds a gnome from a full look (character or bot). */
export function createGnomeModel(look: GnomeLook): GnomeModel {
  const object = new THREE.Group();
  const rig = new THREE.Group();
  // object > flip (pivot at the belly) > flipOffset (back down to the feet) > rig.
  // The flip spins round its own origin, so the gnome turns about its middle, not its boots.
  const flip = new THREE.Group();
  flip.position.y = FLIP_PIVOT_Y;
  const flipOffset = new THREE.Group();
  flipOffset.position.y = -FLIP_PIVOT_Y;
  object.add(flip);
  flip.add(flipOffset);
  flipOffset.add(rig);

  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const mat = (color: number): THREE.MeshStandardMaterial => {
    let m = materials.get(color);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      materials.set(color, m);
    }
    return m;
  };
  const mesh = (geometry: THREE.BufferGeometry, color: number): THREE.Mesh => {
    const m = new THREE.Mesh(geometry, mat(color));
    m.castShadow = true;
    return m;
  };

  // Left is +x, right is -x (right = (-cos a, 0, sin a) at yaw 0).
  const makeLeg = (x: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.3, 0);
    const pants = mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), look.pants);
    pants.position.y = -0.15;
    const boot = mesh(new THREE.BoxGeometry(0.16, 0.08, 0.22), look.boots);
    boot.position.set(0, -0.28, 0.03);
    pivot.add(pants, boot);
    rig.add(pivot);
    return pivot;
  };
  const makeArm = (x: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.62, 0);
    const sleeve = mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), look.shirt);
    sleeve.position.y = -0.15;
    const hand = mesh(new THREE.SphereGeometry(0.06), look.skin);
    hand.position.y = -0.32;
    pivot.add(sleeve, hand);
    rig.add(pivot);
    return pivot;
  };

  const legL = makeLeg(0.1);
  const legR = makeLeg(-0.1);
  const armL = makeArm(0.27);
  const armR = makeArm(-0.27);

  const body = mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.38, 12), look.shirt);
  body.position.y = 0.48;
  const belt = mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.05), look.dress ? look.hat : COLORS.mowerDark);
  belt.position.y = 0.36;

  const head = mesh(new THREE.SphereGeometry(0.17), look.skin);
  head.position.y = 0.8;
  const nose = mesh(new THREE.SphereGeometry(0.05), look.skin);
  nose.position.set(0, 0.8, 0.17);
  const eyeL = mesh(new THREE.SphereGeometry(0.025), 0x111111);
  eyeL.position.set(0.06, 0.86, 0.15);
  const eyeR = mesh(new THREE.SphereGeometry(0.025), 0x111111);
  eyeR.position.set(-0.06, 0.86, 0.15);

  const parts: THREE.Object3D[] = [body, belt, head, nose, eyeL, eyeR];

  if (look.beard !== null) {
    const beard = mesh(new THREE.ConeGeometry(0.17, 0.32, 12), look.beard);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 0.62, 0.07);
    parts.push(beard);
  }

  const hat = mesh(new THREE.ConeGeometry(0.2, 0.5, 16), look.hat);
  hat.position.set(0, 1.12, -0.02);
  hat.rotation.x = -0.15;
  parts.push(hat);

  // Hair: pigtails behind the ears, bangs under the hat brim. Only the pigtails sway.
  const pigtails: THREE.Group[] = [];
  if (look.hair) {
    const hairMat = new THREE.MeshStandardMaterial({ color: look.hair.color, roughness: 0.7 });
    const hairMesh = (geometry: THREE.BufferGeometry): THREE.Mesh => {
      const m = new THREE.Mesh(geometry, hairMat);
      m.castShadow = true;
      return m;
    };
    for (const side of [1, -1]) {
      const pig = new THREE.Group();
      pig.position.set(0.15 * side, 0.82, -0.05);
      // [outward offset, height below the pivot, radius], top to bottom
      const chain: readonly (readonly [number, number, number])[] = [
        [0.01, -0.03, 0.075], [0.025, -0.105, 0.065], [0.035, -0.175, 0.055],
      ];
      for (const [out, dy, r] of chain) {
        const s = hairMesh(new THREE.SphereGeometry(r));
        s.position.set(out * side, dy, 0);
        pig.add(s);
      }
      const tie = mesh(new THREE.TorusGeometry(0.04, 0.015), look.shirt);
      tie.rotation.x = Math.PI / 2;
      tie.position.set(0.01 * side, 0.03, 0);
      pig.add(tie);
      pigtails.push(pig);
      parts.push(pig);
    }
    const bangs = hairMesh(new THREE.SphereGeometry(0.175, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6));
    bangs.position.set(0, 0.83, 0);
    bangs.scale.set(1, 0.85, 1);
    parts.push(bangs);
    // Back of the head: a hair shell over the back and sides, from under the hat down to the nape,
    // so she is not bald from behind. Three.js spheres put z < 0 (the back) at phi in (PI, 2PI);
    // the extra 0.35 rad each side wraps it round past the ears. theta 0..2.15 runs top to nape.
    const backHair = hairMesh(new THREE.SphereGeometry(0.182, 20, 12, Math.PI - 0.35, Math.PI + 0.7, 0, 2.15));
    backHair.position.set(0, 0.8, -0.005);
    parts.push(backHair);
  }

  // Freckles: small dots pushed just outside the head's surface.
  if (look.freckles) {
    for (const [x, y, z] of FRECKLE_DIRS) {
      // A flat disc lying on the skin, facing outward (no bump).
      const n = new THREE.Vector3(x, y, z).normalize();
      const f = mesh(new THREE.CircleGeometry(0.0085, 8), FRECKLE_COLOR);
      f.castShadow = false;
      f.position.set(n.x * 0.1705, 0.8 + n.y * 0.1705, n.z * 0.1705);
      f.lookAt(f.position.x + n.x, f.position.y + n.y, f.position.z + n.z);
      parts.push(f);
    }
  }

  // Round glasses: two thin rims over the eyes (eyes at (±0.06, 0.86, ~0.15)), faint lenses,
  // a bridge over the nose, and arms running back past the ears.
  if (look.glasses) {
    const FRAME = 0x2b1d14;
    const z = 0.18;
    for (const side of [-1, 1]) {
      const rim = mesh(new THREE.TorusGeometry(0.042, 0.007, 8, 24), FRAME);
      rim.position.set(side * 0.062, 0.862, z);
      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.04, 20),
        new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 }),
      );
      lens.position.set(side * 0.062, 0.862, z - 0.002);
      const arm = mesh(new THREE.BoxGeometry(0.008, 0.008, 0.16), FRAME);
      arm.position.set(side * 0.112, 0.862, z - 0.08);
      arm.rotation.y = side * -0.32; // angles back and outward round the head
      parts.push(rim, lens, arm);
    }
    const bridge = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6), FRAME);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 0.866, z + 0.004);
    parts.push(bridge);
  }

  // Dress: a flared skirt from the belt down over the legs, with a white hem.
  if (look.dress) {
    const skirt = mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.24, 16), look.shirt);
    skirt.position.y = 0.3;
    const trim = mesh(new THREE.TorusGeometry(0.29, 0.015), 0xffffff);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 0.18;
    parts.push(skirt, trim);
  }

  rig.add(...parts);

  let dead = false;
  let phase = 0;
  let prevJumpsUsed = 0;
  let flipT = -1; // seconds into the current flip; -1 when not flipping
  const smooth = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);
  const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

  return {
    object,
    update(p: PlayerState, dt: number) {
      object.position.copy(p.position);
      object.rotation.y = p.facing;

      if (dead) {
        const k = smooth(12, dt);
        rig.rotation.x = lerp(rig.rotation.x, -Math.PI / 2, k);
        rig.scale.y = lerp(rig.scale.y, 0.25, k);
        return;
      }

      // Front flip on an air jump (the second or later jump before landing).
      if (p.jumpsUsed > prevJumpsUsed && p.jumpsUsed >= 2 && !p.grounded) flipT = 0;
      prevJumpsUsed = p.jumpsUsed;
      if (flipT >= 0) {
        flipT += dt;
        const t = Math.min(1, flipT / FLIP_DURATION);
        const eased = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t); // ease in-out
        flip.rotation.x = eased * Math.PI * 2; // positive x tips the head forward
        if (t >= 1 || p.grounded) {
          flipT = -1;
          flip.rotation.x = 0;
        }
      }

      const speed = Math.hypot(p.velocity.x, p.velocity.z);
      const k = smooth(15, dt);

      if (p.grounded) {
        phase += dt * speed * 2.2;
        const amt = 0.8 * Math.min(1, speed / TUNING.moveSpeed);
        const s = Math.sin(phase);
        legL.rotation.x = s * amt;
        legR.rotation.x = -s * amt;
        armL.rotation.x = -s * amt * 0.8;
        armR.rotation.x = s * amt * 0.8;
        rig.position.y = Math.abs(s) * 0.06 * amt;
        pigtails.forEach((pig, i) => {
          pig.rotation.z = (i === 0 ? 1 : -1) * s * 0.15 * amt;
        });
      } else {
        legL.rotation.x = lerp(legL.rotation.x, LEG_AIR_LEFT, k);
        legR.rotation.x = lerp(legR.rotation.x, LEG_AIR_RIGHT, k);
        armL.rotation.x = lerp(armL.rotation.x, ARM_AIR, k);
        armR.rotation.x = lerp(armR.rotation.x, ARM_AIR, k);
        rig.position.y = lerp(rig.position.y, 0, k);
        pigtails.forEach((pig) => {
          pig.rotation.z = lerp(pig.rotation.z, 0, k);
        });
      }

      // Squash and stretch: scale.y targets, x and z keep the volume roughly constant.
      const targetY = p.grounded ? 1 : p.velocity.y > 0 ? 1.12 : 0.96;
      const targetXZ = 1 / Math.sqrt(targetY);
      rig.scale.y = lerp(rig.scale.y, targetY, k);
      rig.scale.x = lerp(rig.scale.x, targetXZ, k);
      rig.scale.z = lerp(rig.scale.z, targetXZ, k);
    },
    setDead(d: boolean) {
      dead = d;
      flipT = -1;
      flip.rotation.x = 0;
      if (!d) {
        rig.rotation.x = 0;
        rig.scale.set(1, 1, 1);
        rig.position.y = 0;
      }
    },
  };
}

/** The bots' default look: GNORMAN's build with the hat and shirt colours swapped. */
export function createGnome(hatColor: number = COLORS.gnomeHat, shirtColor: number = COLORS.gnomeShirt): GnomeModel {
  return createGnomeModel({ ...CHARACTERS.gnorman.look, hat: hatColor, shirt: shirtColor });
}
