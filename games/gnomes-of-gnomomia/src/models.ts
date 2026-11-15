// Models for the world's creatures, villagers and loot piles. Every one is wrapped in a CreatureRig so entities.ts can drive them the same way.
import * as THREE from 'three';
import { createGnomeModel } from '@lawn/gnome';
import type { GnomeLook } from '@lawn/gnome';
import { PLAYER_LOOK } from './config';
import type { EnemyDef, NpcDef } from './config';

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
function creatureRig(root: THREE.Group, animate: (speed: number, time: number) => void): CreatureRig {
  root.rotation.order = 'YZX'; // yaw first, then the death roll
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

function moleRig(def: EnemyDef): CreatureRig {
  const root = new THREE.Group();
  const fur = lambert(def.color);
  const pink = lambert(0xf0a0a0);
  const body = mesh(new THREE.SphereGeometry(0.55, 10, 8), fur, 0, 0.4675, 0);
  body.scale.y = 0.85;
  root.add(body);
  root.add(mesh(new THREE.SphereGeometry(0.18, 8, 6), pink, 0, 0.38, 0.6)); // snout
  for (const x of [-0.3, 0.3]) root.add(mesh(new THREE.SphereGeometry(0.14, 8, 6), pink, x, 0.14, 0.3)); // paws
  for (const x of [-0.2, 0.2]) root.add(mesh(new THREE.SphereGeometry(0.04, 6, 5), black(), x, 0.6, 0.48)); // eyes
  if (def.id === 'mole-king') {
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

/** The rig for an enemy, by its def.model. */
export function createEnemyRig(def: EnemyDef): CreatureRig {
  if (def.model === 'gnome') {
    return gnomeRig({ ...PLAYER_LOOK, hat: def.color, shirt: 0x4a4a4a, pants: 0x2b2b2b, beard: 0x555555 });
  }
  if (def.model === 'slug') return slugRig(def.color);
  if (def.model === 'beetle') return beetleRig(def.color);
  return moleRig(def);
}

/** A villager: a gnome built from its look. */
export function createNpcRig(def: NpcDef): CreatureRig {
  return gnomeRig(def.look);
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
