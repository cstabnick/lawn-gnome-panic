// Models for the world's creatures, villagers and loot piles. Every one is wrapped in a CreatureRig so entities.ts can drive them the same way.
import * as THREE from 'three';
import { createGnomeModel } from '@lawn/gnome';
import type { GnomeLook } from '@lawn/gnome';
import { PLAYER_LOOK } from './config';
import type { CreatureModel, EnemyDef, NpcDef } from './config';

export interface CreatureRig {
  object: THREE.Group;
  update(position: THREE.Vector3, facing: number, speed: number, dt: number): void;
  setDead(dead: boolean): void;
  swing(): void;
}

const SWING_SECONDS = 0.35;
const LUNGE_SECONDS = 0.25;
const LUNGE_DISTANCE = 0.3;

const lambert = (color: number): THREE.MeshLambertMaterial => new THREE.MeshLambertMaterial({ color, flatShading: true });
const black = (): THREE.MeshLambertMaterial => new THREE.MeshLambertMaterial({ color: 0x111111 });

/** A mesh that casts a shadow, placed at (x, y, z). */
function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/**
 * Wraps a creature's root group. Handles facing, the death roll (upside down, sunk 0.2),
 * and the lunge on attack. `animate` runs the creature's own movement animation.
 */
function creatureRig(root: THREE.Group, animate: (speed: number, time: number) => void, scale = 1): CreatureRig {
  root.rotation.order = 'YZX'; // yaw first, then the death roll
  root.scale.setScalar(scale);
  let time = 0;
  let lungeT = Infinity;
  let dead = false;
  return {
    object: root,
    update(position, facing, speed, dt) {
      time += dt;
      lungeT += dt;
      animate(speed, time);
      const lunge = lungeT < LUNGE_SECONDS ? LUNGE_DISTANCE * Math.sin((Math.PI * lungeT) / LUNGE_SECONDS) : 0;
      root.position.set(
        position.x + Math.sin(facing) * lunge,
        position.y - (dead ? 0.2 : 0),
        position.z + Math.cos(facing) * lunge,
      );
      root.rotation.set(0, facing, dead ? Math.PI : 0);
    },
    setDead(d) {
      dead = d;
    },
    swing() {
      lungeT = 0;
    },
  };
}

/** A real gnome from @lawn/gnome, with a right-arm chop on swing. */
function gnomeRig(look: GnomeLook): CreatureRig {
  const model = createGnomeModel(look);
  const velocity = new THREE.Vector3();
  let swingT = Infinity;
  return {
    object: model.object,
    update(position, facing, speed, dt) {
      velocity.set(Math.sin(facing) * speed, 0, Math.cos(facing) * speed);
      model.update({ position, velocity, facing, grounded: true, jumpsUsed: 0 }, dt);
      swingT += dt;
      // Applied after the model's own update, which overwrites the arm rotations every call.
      if (swingT < SWING_SECONDS) {
        model.arms.right.rotation.x = -2.4 * Math.sin((Math.PI * swingT) / SWING_SECONDS);
      }
    },
    setDead(dead) {
      model.setDead(dead);
    },
    swing() {
      swingT = 0;
    },
  };
}

function slugRig(color: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const body = mesh(new THREE.SphereGeometry(0.5, 10, 8), skin, 0, 0.225, 0);
  body.scale.set(0.6, 0.45, 1.3);
  root.add(body);
  for (const x of [-0.14, 0.14]) {
    root.add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 5), skin, x, 0.42, 0.5)); // eye stalk
    root.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), black(), x, 0.58, 0.5)); // eye
  }
  return creatureRig(root, (speed, time) => {
    // Squash and stretch along z while moving.
    const pulse = speed > 0.05 ? Math.sin(time * 8) : 0;
    body.scale.set(0.6 * (1 - 0.05 * pulse), 0.45, 1.3 * (1 + 0.1 * pulse));
  });
}

function beetleRig(color: number): CreatureRig {
  const root = new THREE.Group();
  const shell = new THREE.MeshPhongMaterial({ color, shininess: 80 });
  const body = mesh(new THREE.SphereGeometry(0.6, 10, 8), shell, 0, 0.3, 0);
  body.scale.set(0.8, 0.5, 1.1);
  root.add(body);
  root.add(mesh(new THREE.SphereGeometry(0.25, 8, 6), shell, 0, 0.28, 0.75)); // head
  const dark = lambert(0x2a1a0a);
  for (const side of [-1, 1]) {
    // Mandible: a pivot splays it out, the cone points forward (+z).
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.12, 0.25, 0.9);
    pivot.rotation.y = side * 0.3;
    const jaw = mesh(new THREE.ConeGeometry(0.08, 0.6, 5), dark, 0, 0, 0.3);
    jaw.rotation.x = Math.PI / 2;
    pivot.add(jaw);
    root.add(pivot);
  }
  // Six legs, three a side, each wiggling with its own phase.
  const legs: { mesh: THREE.Mesh; side: number; phase: number }[] = [];
  let i = 0;
  for (const side of [-1, 1]) {
    for (const z of [-0.3, 0, 0.3]) {
      const leg = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 4), dark, side * 0.5, 0.2, z);
      leg.rotation.z = side * 0.9;
      root.add(leg);
      legs.push({ mesh: leg, side, phase: i * 1.1 });
      i++;
    }
  }
  return creatureRig(root, (speed, time) => {
    const moving = speed > 0.05 ? 1 : 0;
    for (const leg of legs) {
      leg.mesh.rotation.z = leg.side * 0.9 + moving * 0.25 * Math.sin(time * 12 + leg.phase);
    }
  });
}

function moleRig(color: number, crowned: boolean): CreatureRig {
  const root = new THREE.Group();
  const fur = lambert(color);
  const pink = lambert(0xf0a0a0);
  const body = mesh(new THREE.SphereGeometry(0.55, 10, 8), fur, 0, 0.4675, 0);
  body.scale.y = 0.85;
  root.add(body);
  root.add(mesh(new THREE.SphereGeometry(0.18, 8, 6), pink, 0, 0.38, 0.6)); // snout
  for (const x of [-0.3, 0.3]) root.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), pink, x, 0.14, 0.3)); // paws
  for (const x of [-0.2, 0.2]) root.add(mesh(new THREE.SphereGeometry(0.04, 6, 5), black(), x, 0.6, 0.48)); // eyes
  if (crowned) {
    // Gold crown: an open band plus five points.
    const gold = new THREE.MeshLambertMaterial({ color: 0xffd700, side: THREE.DoubleSide });
    root.add(mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.22, 8, 1, true), gold, 0, 0.98, 0));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      root.add(mesh(new THREE.ConeGeometry(0.06, 0.14, 5), gold, Math.cos(a) * 0.28, 1.16, Math.sin(a) * 0.28));
    }
  }
  return creatureRig(root, () => {
    // Moles have no walk cycle; the body just slides along.
  });
}

// ---------------------------------------------------------------- creature rigs by model
// Each takes a body colour and a scale. Limbs hinge from their own groups or rotate on their base angle.

/** A group at (x, y, z), the hinge for a limb or wing. */
function pivotAt(x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}

interface Leg { mesh: THREE.Mesh; base: number; phase: number }

/** Legs down both sides at the given z positions, each hinged on its base angle. */
function addLegs(root: THREE.Group, zs: readonly number[], x: number, y: number, radius: number, length: number, angle: number, mat: THREE.Material): Leg[] {
  const legs: Leg[] = [];
  let i = 0;
  for (const side of [-1, 1]) {
    for (const z of zs) {
      const leg = mesh(new THREE.CylinderGeometry(radius, radius, length, 4), mat, side * x, y, z);
      leg.rotation.z = side * angle;
      root.add(leg);
      legs.push({ mesh: leg, base: side * angle, phase: i * 1.1 });
      i++;
    }
  }
  return legs;
}

/** Scuttles the legs while moving. */
function wiggleLegs(legs: readonly Leg[], speed: number, time: number): void {
  const moving = speed > 0.05 ? 1 : 0;
  for (const leg of legs) leg.mesh.rotation.z = leg.base + moving * 0.25 * Math.sin(time * 12 + leg.phase);
}

function ratRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const fur = lambert(color);
  const pink = lambert(0xf0a0a0);
  root.add(mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 8).rotateX(Math.PI / 2), fur, 0, 0.32, 0)); // body
  root.add(mesh(new THREE.SphereGeometry(0.2, 8, 6), fur, 0, 0.4, 0.55)); // head
  root.add(mesh(new THREE.SphereGeometry(0.04, 5, 4), pink, 0, 0.36, 0.76)); // nose
  const tail = mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.9, 4).rotateX(Math.PI / 2), pink, 0, 0.25, -0.9);
  root.add(tail);
  return creatureRig(root, (speed, time) => {
    // The tail lashes while running.
    tail.rotation.y = 0.4 * Math.sin(time * 6) * (speed > 0.05 ? 1 : 0.3);
  }, scale);
}

function frogRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const hop = new THREE.Group(); // everything hops together
  root.add(hop);
  const body = mesh(new THREE.SphereGeometry(0.4, 10, 8), skin, 0, 0.25, 0);
  body.scale.set(1.2, 0.7, 1);
  hop.add(body);
  for (const x of [-0.22, 0.22]) {
    hop.add(mesh(new THREE.SphereGeometry(0.15, 8, 6), skin, x, 0.5, 0.15)); // big eye
    hop.add(mesh(new THREE.SphereGeometry(0.08, 6, 5), black(), x, 0.6, 0.25)); // pupil
  }
  return creatureRig(root, (speed, time) => {
    // Hops in arcs while moving.
    hop.position.y = speed > 0.05 ? 0.25 * Math.abs(Math.sin(time * 5)) : 0;
  }, scale);
}

function wormRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const segs: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const r = 0.22 - i * 0.012;
    const seg = mesh(new THREE.SphereGeometry(r, 8, 6), skin, 0, r, -0.45 + i * 0.18);
    segs.push(seg);
    root.add(seg);
  }
  return creatureRig(root, (speed, time) => {
    // A wave runs down the body; it is bigger while moving.
    const amp = speed > 0.05 ? 0.12 : 0.03;
    for (let i = 0; i < segs.length; i++) segs[i].position.x = amp * Math.sin(time * 5 + i * 0.9);
  }, scale);
}

function leechRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const body = mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 8).rotateX(Math.PI / 2), lambert(color), 0, 0.12, 0);
  root.add(body);
  return creatureRig(root, (speed, time) => {
    // Inches along: stretches and squashes while moving.
    const inch = speed > 0.05 ? Math.sin(time * 6) : 0;
    body.scale.set(1, 0.5 * (1 - 0.1 * inch), 1 + 0.2 * inch);
  }, scale);
}

function antRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const dark = black();
  root.add(mesh(new THREE.SphereGeometry(0.16, 8, 6), skin, 0, 0.2, 0.42)); // head
  root.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), skin, 0, 0.18, 0)); // thorax
  root.add(mesh(new THREE.SphereGeometry(0.24, 8, 6), skin, 0, 0.24, -0.4)); // abdomen
  for (const side of [-1, 1]) {
    const antenna = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 4), dark, side * 0.08, 0.38, 0.55);
    antenna.rotation.set(0.6, 0, -side * 0.3);
    root.add(antenna);
  }
  const legs = addLegs(root, [-0.2, 0, 0.2], 0.2, 0.12, 0.018, 0.5, 0.9, dark);
  return creatureRig(root, (speed, time) => wiggleLegs(legs, speed, time), scale);
}

function aphidRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const body = mesh(new THREE.SphereGeometry(0.2, 8, 6), skin, 0, 0.18, -0.03);
  body.scale.set(1, 1.1, 1.3); // pear: fat at the back
  root.add(body);
  root.add(mesh(new THREE.SphereGeometry(0.12, 7, 5), skin, 0, 0.22, 0.2)); // head
  root.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), black(), 0, 0.27, 0.3)); // eye
  return creatureRig(root, () => {
    // Aphids sit still; the body does not animate.
  }, scale);
}

function snailRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const shellMat = lambert(0x9b6b3c);
  const dark = black();
  const foot = mesh(new THREE.CapsuleGeometry(0.18, 0.5, 4, 8).rotateX(Math.PI / 2), skin, 0, 0.14, 0);
  foot.scale.y = 0.6;
  root.add(foot);
  // Spiral shell: a dome with a ring wound on its side.
  root.add(mesh(new THREE.SphereGeometry(0.25, 8, 6), shellMat, 0, 0.42, -0.1));
  root.add(mesh(new THREE.TorusGeometry(0.14, 0.05, 6, 12).rotateY(Math.PI / 2), dark, 0.22, 0.42, -0.1));
  const stalks: THREE.Group[] = [];
  for (const x of [-0.08, 0.08]) {
    const stalk = pivotAt(x, 0.2, 0.42);
    stalk.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4), skin, 0, 0.1, 0));
    stalk.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), dark, 0, 0.25, 0));
    root.add(stalk);
    stalks.push(stalk);
  }
  return creatureRig(root, (speed, time) => {
    // Eye stalks sway; the foot stretches while moving.
    for (const s of stalks) s.rotation.x = (speed > 0.05 ? 0.3 : 0.1) * Math.sin(time * 2);
  }, scale);
}

function crowRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const feather = lambert(color);
  const body = mesh(new THREE.SphereGeometry(0.3, 10, 8), feather, 0, 0.5, 0);
  body.scale.set(0.8, 0.7, 1.3);
  root.add(body);
  root.add(mesh(new THREE.SphereGeometry(0.18, 8, 6), feather, 0, 0.78, 0.3)); // head
  root.add(mesh(new THREE.ConeGeometry(0.06, 0.2, 5).rotateX(Math.PI / 2), lambert(0xe0a030), 0, 0.76, 0.5)); // beak
  root.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.4), feather, 0, 0.55, -0.45)); // tail
  const wings: { pivot: THREE.Group; side: number }[] = [];
  for (const side of [-1, 1]) {
    const pivot = pivotAt(side * 0.18, 0.6, 0);
    pivot.add(mesh(new THREE.BoxGeometry(0.6, 0.05, 0.35), feather, side * 0.3, 0, 0));
    root.add(pivot);
    wings.push({ pivot, side });
  }
  return creatureRig(root, (speed, time) => {
    // Flaps fast while moving, holds a glide when still.
    const flap = speed > 0.05 ? Math.abs(Math.sin(time * 12)) : 0;
    for (const w of wings) w.pivot.rotation.z = w.side * (0.2 + 0.7 * flap);
  }, scale);
}

function waspRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const yellow = lambert(color);
  const dark = black();
  const body = mesh(new THREE.SphereGeometry(0.22, 10, 8), yellow, 0, 0.5, 0);
  body.scale.set(0.9, 0.9, 1.9);
  root.add(body);
  for (const z of [-0.12, 0.1]) root.add(mesh(new THREE.TorusGeometry(0.2, 0.035, 6, 12), dark, 0, 0.5, z)); // stripes
  root.add(mesh(new THREE.SphereGeometry(0.13, 8, 6), dark, 0, 0.52, 0.45)); // head
  root.add(mesh(new THREE.ConeGeometry(0.03, 0.15, 5).rotateX(-Math.PI / 2), dark, 0, 0.5, -0.5)); // stinger
  const wingMat = new THREE.MeshLambertMaterial({ color: 0xeaffff, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
  const wings: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const pivot = pivotAt(side * 0.1, 0.72, 0.05);
    pivot.add(mesh(new THREE.PlaneGeometry(0.5, 0.22).rotateX(-Math.PI / 2), wingMat, side * 0.25, 0, 0));
    root.add(pivot);
    wings.push(pivot);
  }
  return creatureRig(root, (_speed, time) => {
    // The wings blur: they swing back and forth fast.
    for (const w of wings) w.rotation.y = 0.3 * Math.sin(time * 40);
  }, scale);
}

function mothRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  root.add(mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 6).rotateX(Math.PI / 2), lambert(0x6b5a45), 0, 0.3, 0));
  const wingMat = new THREE.MeshLambertMaterial({ color, flatShading: true, side: THREE.DoubleSide });
  const wings: { pivot: THREE.Group; side: number }[] = [];
  for (const side of [-1, 1]) {
    const pivot = pivotAt(side * 0.06, 0.32, 0);
    pivot.add(mesh(new THREE.PlaneGeometry(0.7, 0.55).rotateX(-Math.PI / 2), wingMat, side * 0.35, 0, 0));
    root.add(pivot);
    wings.push({ pivot, side });
  }
  return creatureRig(root, (speed, time) => {
    // Broad, slow flutter; quicker while moving.
    const amp = speed > 0.05 ? 0.4 : 0.15;
    for (const w of wings) w.pivot.rotation.z = w.side * (0.2 + amp * Math.sin(time * 4));
  }, scale);
}

function spiderRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const dark = black();
  root.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), skin, 0, 0.3, -0.2)); // abdomen
  root.add(mesh(new THREE.SphereGeometry(0.2, 9, 7), skin, 0, 0.28, 0.2)); // head
  for (const x of [-0.07, 0.07]) root.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), lambert(0xcc2222), x, 0.36, 0.38)); // eyes
  const legs = addLegs(root, [-0.2, -0.06, 0.08, 0.22], 0.3, 0.28, 0.02, 0.6, 0.7, dark);
  return creatureRig(root, (speed, time) => wiggleLegs(legs, speed, time), scale);
}

function cricketRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const skin = lambert(color);
  const dark = black();
  const hop = new THREE.Group();
  root.add(hop);
  const body = mesh(new THREE.SphereGeometry(0.22, 9, 7), skin, 0, 0.35, 0);
  body.scale.set(0.9, 0.9, 1.3);
  hop.add(body);
  hop.add(mesh(new THREE.SphereGeometry(0.13, 8, 6), skin, 0, 0.4, 0.3)); // head
  const hips: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    // Long hind leg: the thigh angles up and back, the shin folds down.
    const hip = pivotAt(side * 0.15, 0.3, -0.1);
    const thigh = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 4), dark, 0, 0.12, -0.2);
    thigh.rotation.x = -0.6;
    const shin = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4), dark, 0, -0.1, -0.5);
    shin.rotation.x = 1.2;
    hip.add(thigh, shin);
    hop.add(hip);
    hips.push(hip);
  }
  return creatureRig(root, (speed, time) => {
    // Hops, and the hind legs kick while moving.
    const moving = speed > 0.05;
    hop.position.y = moving ? 0.1 * Math.abs(Math.sin(time * 6)) : 0;
    for (const hip of hips) hip.rotation.x = moving ? 0.3 * Math.sin(time * 6) : 0;
  }, scale);
}

function earwigRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const shell = lambert(color);
  const dark = black();
  root.add(mesh(new THREE.SphereGeometry(0.13, 8, 6), shell, 0, 0.14, 0.3)); // head
  root.add(mesh(new THREE.SphereGeometry(0.12, 8, 6), shell, 0, 0.13, 0.05)); // thorax
  root.add(mesh(new THREE.CapsuleGeometry(0.12, 0.4, 4, 8).rotateX(Math.PI / 2), shell, 0, 0.13, -0.42)); // abdomen
  const pincers: { pivot: THREE.Group; side: number }[] = [];
  for (const side of [-1, 1]) {
    const pivot = pivotAt(side * 0.05, 0.13, -0.7);
    pivot.add(mesh(new THREE.ConeGeometry(0.03, 0.3, 5).rotateX(-Math.PI / 2), dark, 0, 0, -0.15));
    root.add(pivot);
    pincers.push({ pivot, side });
  }
  return creatureRig(root, (speed, time) => {
    // Pincers snap open and shut; faster while moving.
    const snap = speed > 0.05 ? 0.15 * Math.sin(time * 8) : 0.05 * Math.sin(time * 2);
    for (const p of pincers) p.pivot.rotation.y = p.side * (0.3 + snap);
  }, scale);
}

function centipedeRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const shell = lambert(color);
  const dark = black();
  const segs: THREE.Mesh[] = [];
  const zs: number[] = [];
  for (let i = 0; i < 10; i++) {
    const z = -0.5 + i * 0.11;
    const seg = mesh(new THREE.SphereGeometry(0.12, 8, 6), shell, 0, 0.12, z);
    seg.scale.set(1, 0.7, 1);
    segs.push(seg);
    zs.push(z);
    root.add(seg);
  }
  root.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), shell, 0, 0.12, 0.6)); // head
  const legs = addLegs(root, zs, 0.15, 0.08, 0.012, 0.28, 1.1, dark);
  return creatureRig(root, (speed, time) => {
    // A wave runs along the segments while moving.
    const moving = speed > 0.05;
    for (let i = 0; i < segs.length; i++) segs[i].position.y = 0.12 + (moving ? 0.03 * Math.sin(time * 6 + i * 0.6) : 0);
    wiggleLegs(legs, speed, time);
  }, scale);
}

function strawRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const straw = lambert(color);
  const sack = lambert(0xc8a878);
  const dark = black();
  root.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 5), straw, 0, 0.6, 0)); // pole
  root.add(mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.5, 6), straw, 0, 0.4, 0)); // straw bundle
  const arms = pivotAt(0, 0.8, 0);
  arms.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 5).rotateZ(Math.PI / 2), straw, 0, 0, 0));
  root.add(arms);
  root.add(mesh(new THREE.SphereGeometry(0.2, 9, 7), sack, 0, 1.2, 0)); // sack head
  for (const x of [-0.07, 0.07]) root.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), dark, x, 1.22, 0.18)); // eyes
  for (const x of [-0.1, 0.1]) root.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.45, 5), straw, x, 0.2, 0)); // legs
  return creatureRig(root, (speed, time) => {
    // The arms sway in the wind, more while moving.
    arms.rotation.z = speed > 0.05 ? 0.15 * Math.sin(time * 6) : 0.03 * Math.sin(time * 2);
  }, scale);
}

function clayRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const clay = lambert(color);
  const dark = black();
  const body = mesh(new THREE.SphereGeometry(0.3, 10, 8), clay, 0, 0.36, 0);
  body.scale.y = 1.2;
  root.add(body);
  root.add(mesh(new THREE.SphereGeometry(0.2, 9, 7), clay, 0, 0.8, 0)); // head
  root.add(mesh(new THREE.ConeGeometry(0.2, 0.5, 6), clay, 0, 1.1, 0)); // pointed hat, same unglazed clay
  root.add(mesh(new THREE.SphereGeometry(0.05, 5, 4), clay, 0, 0.78, 0.2)); // nose
  for (const x of [-0.07, 0.07]) root.add(mesh(new THREE.SphereGeometry(0.03, 5, 4), dark, x, 0.85, 0.17)); // eyes
  for (const x of [-0.12, 0.12]) root.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 6), clay, x, 0.12, 0)); // legs
  const arms: { pivot: THREE.Group; side: number }[] = [];
  for (const side of [-1, 1]) {
    const pivot = pivotAt(side * 0.3, 0.55, 0);
    pivot.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 5), clay, 0, -0.2, 0));
    root.add(pivot);
    arms.push({ pivot, side });
  }
  return creatureRig(root, (speed, time) => {
    // Arms swing while walking.
    for (const a of arms) a.pivot.rotation.x = speed > 0.05 ? 0.5 * Math.sin(time * 8 + (a.side > 0 ? Math.PI : 0)) : 0;
  }, scale);
}

function metalRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const rust = lambert(color);
  const dark = black();
  root.add(mesh(new THREE.BoxGeometry(0.7, 0.25, 0.9), rust, 0, 0.25, 0)); // carapace
  const legs = addLegs(root, [-0.25, 0, 0.25], 0.42, 0.22, 0.03, 0.5, 0.9, rust);
  for (const side of [-1, 1]) {
    root.add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), rust, side * 0.15, 0.4, 0.4)); // eye stalk
    root.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), dark, side * 0.15, 0.52, 0.4)); // eye
  }
  const claws: { pivot: THREE.Group; side: number }[] = [];
  for (const side of [-1, 1]) {
    const pivot = pivotAt(side * 0.4, 0.25, 0.4);
    pivot.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), rust, 0, 0, 0.2)); // arm
    pivot.add(mesh(new THREE.BoxGeometry(0.25, 0.15, 0.25), rust, 0, 0, 0.5)); // pincer
    root.add(pivot);
    claws.push({ pivot, side });
  }
  return creatureRig(root, (speed, time) => {
    // Legs scuttle; the claws open and shut.
    wiggleLegs(legs, speed, time);
    for (const c of claws) c.pivot.rotation.y = c.side * 0.3 * Math.sin(time * 2);
  }, scale);
}

function mowerRig(color: number, scale: number): CreatureRig {
  const root = new THREE.Group();
  const red = lambert(color);
  const dark = black();
  root.add(mesh(new THREE.BoxGeometry(1.2, 0.3, 1.6), red, 0, 0.35, 0)); // deck
  const wheels: THREE.Mesh[] = [];
  for (const x of [-0.6, 0.6]) {
    for (const z of [-0.5, 0.5]) {
      const wheel = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 8).rotateZ(Math.PI / 2), dark, x, 0.2, z);
      wheels.push(wheel);
      root.add(wheel);
    }
  }
  // Handle: two bars rising from the back of the deck to a grip.
  for (const x of [-0.25, 0.25]) {
    const bar = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), dark, x, 0.85, -1.0);
    bar.rotation.x = -0.6;
    root.add(bar);
  }
  root.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 5).rotateZ(Math.PI / 2), dark, 0, 1.35, -1.35)); // grip
  return creatureRig(root, (speed, time) => {
    // Wheels spin with the movement.
    const spin = speed > 0.05 ? time * 6 : 0;
    for (const w of wheels) w.rotation.x = spin;
  }, scale);
}

/** A non-gnome creature rig for a CreatureModel. Unknown models fall back to the beetle. */
function creatureByModel(model: CreatureModel, color: number, scale: number, crowned: boolean): CreatureRig {
  switch (model) {
    case 'slug': return slugRig(color);
    case 'beetle': return beetleRig(color);
    case 'mole': return moleRig(color, crowned);
    case 'rat': return ratRig(color, scale);
    case 'frog': return frogRig(color, scale);
    case 'worm': return wormRig(color, scale);
    case 'leech': return leechRig(color, scale);
    case 'ant': return antRig(color, scale);
    case 'aphid': return aphidRig(color, scale);
    case 'snail': return snailRig(color, scale);
    case 'crow': return crowRig(color, scale);
    case 'wasp': return waspRig(color, scale);
    case 'moth': return mothRig(color, scale);
    case 'spider': return spiderRig(color, scale);
    case 'cricket': return cricketRig(color, scale);
    case 'earwig': return earwigRig(color, scale);
    case 'centipede': return centipedeRig(color, scale);
    case 'straw': return strawRig(color, scale);
    case 'clay': return clayRig(color, scale);
    case 'metal': return metalRig(color, scale);
    case 'mower': return mowerRig(color, scale);
    default: return beetleRig(color);
  }
}

/** The rig for an enemy, by its def.model. */
export function createEnemyRig(def: EnemyDef): CreatureRig {
  if (def.model === 'gnome') {
    return gnomeRig({ ...PLAYER_LOOK, hat: def.color, shirt: 0x4a4a4a, pants: 0x2b2b2b, beard: 0x555555 });
  }
  if (def.model === 'slug') return slugRig(def.color);
  if (def.model === 'beetle') return beetleRig(def.color);
  return creatureByModel(def.model, def.color, def.scale, def.id === 'mole-king');
}

/** A villager: a gnome built from its look. */
export function createNpcRig(def: NpcDef): CreatureRig {
  // Non-gnome NPCs (an ant, the Gleaner, a mole) render as their creature, in their shirt colour.
  const rig = def.model && def.model !== 'gnome'
    ? creatureByModel(def.model, def.look.shirt, 1, false)
    : gnomeRig(def.look);
  // Set on the root object, which the rig's update never resets.
  rig.object.scale.setScalar(def.scale ?? 1);
  return rig;
}

/** A loot pile: a tied sack with three gold coins beside it. It bobs gently. */
export function createLootRig(): CreatureRig {
  const root = new THREE.Group();
  const cloth = lambert(0x9b7a4c);
  const sack = mesh(new THREE.SphereGeometry(0.3, 8, 6), cloth, 0, 0.24, 0);
  sack.scale.y = 0.8;
  root.add(sack);
  root.add(mesh(new THREE.ConeGeometry(0.08, 0.14, 6), cloth, 0, 0.5, 0)); // tied top
  const gold = new THREE.MeshLambertMaterial({ color: 0xffd700 });
  for (const [x, z] of [[0.45, 0.1], [0.32, -0.3], [-0.42, 0.15]]) {
    root.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 10), gold, x, 0.015, z));
  }
  let time = 0;
  return {
    object: root,
    update(position, _facing, _speed, dt) {
      time += dt;
      root.position.set(position.x, position.y + 0.05 * Math.sin(time * 3), position.z);
    },
    setDead(_dead) {
      // Loot does not die.
    },
    swing() {
      // Loot does not swing.
    },
  };
}
