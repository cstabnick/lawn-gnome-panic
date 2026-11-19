// The gnome model shared by every game. Rigid sub-assemblies (torso+head+face+beard+hair+dress+glasses-frames,
// each leg, each arm, each pigtail) are merged into vertex-colored geometries using one MeshStandardMaterial per
// gnome, cutting draw calls from ~20-40 per gnome down to 6-8 while keeping all animated pivots and disposal safe.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildHeld, buildPrefab, getPrefab } from '@lawn/prefabs';
import {
  COLORS,
  TUNING,
  GNORMAN_LOOK,
  type CreateGnomeModelOptions,
  type EquipSlot,
  type GnomeLook,
  type GnomeModel,
  type PlayerState,
} from './types';

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

const _color = new THREE.Color();
const _mat4 = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'XYZ');
const _up = new THREE.Vector3(0, 1, 0);
const _lookTarget = new THREE.Vector3();

/** Normalizes a primitive geometry (non-indexed, position+normal+vertex color) and bakes its local transform. */
function bakePart(
  src: THREE.BufferGeometry,
  colorHex: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
): THREE.BufferGeometry {
  const g = src.index ? src.toNonIndexed() : src;
  if (g !== src) src.dispose();
  for (const attr of Object.keys(g.attributes)) {
    if (attr !== 'position' && attr !== 'normal') g.deleteAttribute(attr);
  }
  if (!g.getAttribute('normal')) g.computeVertexNormals();

  _pos.set(x, y, z);
  _euler.set(rx, ry, rz, 'XYZ');
  _quat.setFromEuler(_euler);
  _scale.set(sx, sy, sz);
  _mat4.compose(_pos, _quat, _scale);
  g.applyMatrix4(_mat4);

  _color.setHex(colorHex);
  const count = g.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  const r = _color.r;
  const gr = _color.g;
  const b = _color.b;
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    colors[o] = r;
    colors[o + 1] = gr;
    colors[o + 2] = b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

/** Merges baked part geometries into one BufferGeometry and disposes the intermediates. */
function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = parts.length === 1 ? parts[0] : mergeGeometries(parts, false);
  if (!merged) throw new Error('Failed to merge gnome model parts');
  if (parts.length > 1) {
    for (const p of parts) p.dispose();
  }
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

/** Builds a gnome from a full look (character or bot). */
export function createGnomeModel(look: GnomeLook, options?: CreateGnomeModelOptions): GnomeModel {
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

  // One vertex-colored material per gnome (owned by this gnome so callers disposing it never corrupt others).
  const gnomeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });

  const bakedMesh = (parts: THREE.BufferGeometry[], castShadow = true): THREE.Mesh => {
    const m = new THREE.Mesh(mergeParts(parts), gnomeMat);
    m.castShadow = castShadow;
    return m;
  };

  // Left is +x, right is -x (right = (-cos a, 0, sin a) at yaw 0).
  const makeLeg = (x: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.3, 0);
    pivot.add(bakedMesh([
      bakePart(new THREE.BoxGeometry(0.14, 0.3, 0.14), look.pants, 0, -0.15, 0),
      bakePart(new THREE.BoxGeometry(0.16, 0.08, 0.22), look.boots, 0, -0.28, 0.03),
    ]));
    rig.add(pivot);
    return pivot;
  };
  const makeArm = (x: number): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.62, 0);
    pivot.add(bakedMesh([
      bakePart(new THREE.BoxGeometry(0.1, 0.3, 0.1), look.shirt, 0, -0.15, 0),
      bakePart(new THREE.SphereGeometry(0.06, 10, 8), look.skin, 0, -0.32, 0),
    ]));
    rig.add(pivot);
    return pivot;
  };

  const legL = makeLeg(0.1);
  const legR = makeLeg(-0.1);
  const armL = makeArm(0.27);
  const armR = makeArm(-0.27);

  // Rigid body + head + facial features + beard + hair + dress + glasses frames merged into 1 draw call.
  const bodyParts: THREE.BufferGeometry[] = [
    bakePart(new THREE.CylinderGeometry(0.18, 0.24, 0.38, 12), look.shirt, 0, 0.48, 0),
    bakePart(new THREE.CylinderGeometry(0.235, 0.235, 0.05, 14), look.dress ? look.hat : COLORS.mowerDark, 0, 0.36, 0),
    bakePart(new THREE.SphereGeometry(0.17, 16, 12), look.skin, 0, 0.8, 0),
    bakePart(new THREE.SphereGeometry(0.05, 10, 8), look.skin, 0, 0.8, 0.17),
    bakePart(new THREE.SphereGeometry(0.025, 8, 6), 0x111111, 0.06, 0.86, 0.15),
    bakePart(new THREE.SphereGeometry(0.025, 8, 6), 0x111111, -0.06, 0.86, 0.15),
  ];

  if (look.beard !== null) {
    bodyParts.push(bakePart(new THREE.ConeGeometry(0.17, 0.32, 12), look.beard, 0, 0.62, 0.07, Math.PI, 0, 0));
  }

  // Hat stays its own mesh because GnomeModel exposes `hat` (toggled when custom headgear is equipped).
  const hat = bakedMesh([bakePart(new THREE.ConeGeometry(0.2, 0.5, 16), look.hat)]);
  hat.position.set(0, 1.12, -0.02);
  hat.rotation.x = -0.15;

  // Bowl cut (bowling): a hair dome cut dead level all round just above the eyes, with a chunky rounded
  // rim at the cut line, like a bowl put on the head. The hat is shrunk and perched on top so the cut shows.
  if (look.bowlCut != null) {
    const CUT_Y = 0.895; // just above the eyes (eye tops are at ~0.885)
    const R = 0.19;
    const theta = Math.acos((CUT_Y - 0.8) / R); // polar angle of the cut line on a sphere centred on the head
    bodyParts.push(bakePart(new THREE.SphereGeometry(R, 18, 10, 0, Math.PI * 2, 0, theta), look.bowlCut, 0, 0.8, 0));
    const rimR = Math.sqrt(R * R - (CUT_Y - 0.8) ** 2);
    bodyParts.push(bakePart(new THREE.TorusGeometry(rimR, 0.02, 8, 20), look.bowlCut, 0, CUT_Y, 0, Math.PI / 2, 0, 0));
    hat.scale.setScalar(0.8);
    hat.position.set(0, 1.17, -0.02);
    hat.rotation.x = -0.25;
  }

  // Hair: pigtails behind the ears, bangs under the hat brim. Only the pigtails sway.
  const pigtails: THREE.Group[] = [];
  if (look.hair) {
    for (const side of [1, -1]) {
      const pig = new THREE.Group();
      pig.position.set(0.15 * side, 0.82, -0.05);
      // [outward offset, height below the pivot, radius], top to bottom
      const chain: readonly (readonly [number, number, number])[] = [
        [0.01, -0.03, 0.075], [0.025, -0.105, 0.065], [0.035, -0.175, 0.055],
      ];
      const pigParts: THREE.BufferGeometry[] = chain.map(([out, dy, r]) =>
        bakePart(new THREE.SphereGeometry(r, 10, 8), look.hair!.color, out * side, dy, 0),
      );
      pigParts.push(bakePart(new THREE.TorusGeometry(0.04, 0.015, 6, 12), look.shirt, 0.01 * side, 0.03, 0, Math.PI / 2, 0, 0));
      pig.add(bakedMesh(pigParts));
      pigtails.push(pig);
      rig.add(pig);
    }
    bodyParts.push(
      bakePart(new THREE.SphereGeometry(0.175, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), look.hair.color, 0, 0.83, 0, 0, 0, 0, 1, 0.85, 1),
      // Back of the head: a hair shell over the back and sides, from under the hat down to the nape.
      bakePart(new THREE.SphereGeometry(0.182, 18, 10, Math.PI - 0.35, Math.PI + 0.7, 0, 2.15), look.hair.color, 0, 0.8, -0.005),
    );
  }

  // Freckles: small dots pushed just outside the head's surface.
  if (look.freckles) {
    for (const [x, y, z] of FRECKLE_DIRS) {
      const n = new THREE.Vector3(x, y, z).normalize();
      const px = n.x * 0.1705;
      const py = 0.8 + n.y * 0.1705;
      const pz = n.z * 0.1705;
      const g = new THREE.CircleGeometry(0.0085, 8);
      const nonIdx = g.toNonIndexed();
      g.dispose();
      for (const attr of Object.keys(nonIdx.attributes)) {
        if (attr !== 'position' && attr !== 'normal') nonIdx.deleteAttribute(attr);
      }
      _pos.set(px, py, pz);
      _lookTarget.set(px + n.x, py + n.y, pz + n.z);
      _mat4.lookAt(_lookTarget, _pos, _up);
      _mat4.setPosition(px, py, pz);
      nonIdx.applyMatrix4(_mat4);
      _color.setHex(FRECKLE_COLOR);
      const count = nonIdx.getAttribute('position').count;
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        colors[i * 3] = _color.r;
        colors[i * 3 + 1] = _color.g;
        colors[i * 3 + 2] = _color.b;
      }
      nonIdx.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      bodyParts.push(nonIdx);
    }
  }

  // Round glasses: two thin rims over the eyes, faint lenses, a bridge over the nose, and arms running back.
  if (look.glasses) {
    const FRAME = 0x2b1d14;
    const z = 0.18;
    const lensGeos: THREE.BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      bodyParts.push(
        bakePart(new THREE.TorusGeometry(0.042, 0.007, 6, 16), FRAME, side * 0.062, 0.862, z),
        bakePart(new THREE.BoxGeometry(0.008, 0.008, 0.16), FRAME, side * 0.112, 0.862, z - 0.08, 0, side * -0.32, 0),
      );
      const lg = new THREE.CircleGeometry(0.04, 14);
      const lni = lg.toNonIndexed();
      lg.dispose();
      lni.translate(side * 0.062, 0.862, z - 0.002);
      lensGeos.push(lni);
    }
    bodyParts.push(bakePart(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6), FRAME, 0, 0.866, z + 0.004, 0, 0, Math.PI / 2));
    const lensMesh = new THREE.Mesh(
      mergeParts(lensGeos),
      new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 }),
    );
    rig.add(lensMesh);
  }

  // Dress: a flared skirt from the belt down over the legs, with a white hem.
  if (look.dress) {
    bodyParts.push(
      bakePart(new THREE.CylinderGeometry(0.2, 0.3, 0.24, 16), look.shirt, 0, 0.3, 0),
      bakePart(new THREE.TorusGeometry(0.29, 0.015, 8, 20), 0xffffff, 0, 0.18, 0, Math.PI / 2, 0, 0),
    );
  }

  rig.add(bakedMesh(bodyParts), hat);

  // Equipped @lawn/prefabs cosmetics (head, back, neck, hand).
  // Prefab roots carry userData.prefab; callers disposing the gnome model must skip those subtrees.
  // Games that equip their own gear override these slots via options.overrideEquipment or setEquipmentOverride(s).
  const eq = look.equipment;
  const customGear: Partial<Record<EquipSlot, THREE.Object3D>> = {};
  if (eq?.head && getPrefab(eq.head)) {
    const headgear = buildPrefab(eq.head);
    headgear.position.set(0, 0.91, 0);
    rig.add(headgear);
    customGear.head = headgear;
  }
  if (eq?.back && getPrefab(eq.back)) {
    const backgear = buildPrefab(eq.back);
    backgear.position.set(0, 0.28, -0.22);
    backgear.rotation.y = Math.PI;
    rig.add(backgear);
    customGear.back = backgear;
  }
  if (eq?.neck && getPrefab(eq.neck)) {
    const neckgear = buildPrefab(eq.neck);
    neckgear.position.set(0, 0.65, 0.05);
    rig.add(neckgear);
    customGear.neck = neckgear;
  }
  if (eq?.hand && getPrefab(eq.hand)) {
    const def = getPrefab(eq.hand)!;
    const held = def.uses.includes('hold') ? buildHeld(eq.hand) : buildPrefab(eq.hand);
    held.position.set(0, -0.32, 0.02);
    held.rotation.x = -Math.PI / 2;
    armR.add(held);
    customGear.hand = held;
  }

  const overridden: Partial<Record<EquipSlot, boolean>> = {};
  if (options?.overrideEquipment) {
    for (const slot of options.overrideEquipment) overridden[slot] = true;
  }

  const applyGearVisibility = (updateHat: boolean): void => {
    for (const slot of ['head', 'back', 'neck', 'hand'] as const satisfies readonly EquipSlot[]) {
      const node = customGear[slot];
      if (node) node.visible = !overridden[slot];
    }
    if (updateHat) {
      hat.visible = !(customGear.head && !overridden.head);
    }
  };
  applyGearVisibility(true);

  let dead = false;
  let phase = 0;
  let prevJumpsUsed = 0;
  let flipT = -1; // seconds into the current flip; -1 when not flipping
  const smooth = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);
  const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

  return {
    object,
    arms: { left: armL, right: armR },
    legs: { left: legL, right: legR },
    hat,
    rig,
    setEquipmentOverride(slot: EquipSlot, isOverridden: boolean) {
      overridden[slot] = isOverridden;
      applyGearVisibility(slot === 'head');
    },
    setEquipmentOverrides(overrides: Partial<Record<EquipSlot, boolean>>) {
      let headTouched = false;
      for (const [slot, isOverridden] of Object.entries(overrides) as [EquipSlot, boolean | undefined][]) {
        if (isOverridden === undefined) continue;
        overridden[slot] = isOverridden;
        if (slot === 'head') headTouched = true;
      }
      applyGearVisibility(headTouched);
    },
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

      if (p.sitting) {
        legL.rotation.x = lerp(legL.rotation.x, -Math.PI / 2, k);
        legR.rotation.x = lerp(legR.rotation.x, -Math.PI / 2, k);
        armL.rotation.x = lerp(armL.rotation.x, -0.35, k);
        armR.rotation.x = lerp(armR.rotation.x, -0.35, k);
        rig.position.y = lerp(rig.position.y, 0, k);
        pigtails.forEach((pig) => {
          pig.rotation.z = lerp(pig.rotation.z, 0, k);
        });
      } else if (p.grounded) {
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
      const targetY = p.sitting || p.grounded ? 1 : p.velocity.y > 0 ? 1.12 : 0.96;
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
  return createGnomeModel({ ...GNORMAN_LOOK, hat: hatColor, shirt: shirtColor });
}
