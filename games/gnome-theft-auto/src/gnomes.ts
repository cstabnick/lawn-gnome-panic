// Town gnomes shared by pedestrians, drivers and officers: random looks, names and the hands-up pose.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { biomeAt, NPC_FIRST, NPC_LAST } from './config';
import { districtAt } from './districts';

const HATS = [0xd93636, 0x2f64c9, 0x3fa34d, 0xf2c230, 0x8e44ad, 0xf08a24, 0x1abc9c, 0xe84393];
const COATS = [0x2f64c9, 0x6b4a2e, 0x3fa34d, 0xc0392b, 0x7f8c8d, 0xd35400, 0x16a085, 0xf5f5dc];
const PANTS = [0x4b3a2a, 0x2c3e50, 0x6b4a2e, 0x34495e];
const SKINS = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];
const BEARDS = [0xf4f4f4, 0xdddddd, 0x8b5a2b, 0x3b2a1a, 0xc0c0c0];

const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/** A random townsgnome look. Pass hat/shirt to make a uniform (officers, guards). */
export function randomTownLook(uniform?: { hat: number; shirt: number }): GnomeLook {
  const beard = Math.random() < 0.7 ? pick(BEARDS) : null;
  return {
    hat: uniform?.hat ?? pick(HATS),
    shirt: uniform?.shirt ?? pick(COATS),
    pants: pick(PANTS),
    skin: pick(SKINS),
    boots: 0x222222,
    beard,
    hair: beard === null && Math.random() < 0.6 ? { color: pick(BEARDS), style: 'pigtails' } : null,
    freckles: Math.random() < 0.2,
    dress: beard === null && Math.random() < 0.4,
    glasses: Math.random() < 0.2,
    bowlCut: null,
  };
}

/** Biome/district-themed townsgnome look so pedestrians match their neighborhood. */
export function biomeLookFor(x: number, z: number): GnomeLook {
  const base = randomTownLook();
  const d = districtAt(x, z);
  if (d === 'patio-heights') {
    return {
      ...base,
      hat: pick([0xf4f4f8, 0xe8d5b7, 0xd4af37, 0x3fa34d]),
      shirt: pick([0xf5f5dc, 0xc9b99b, 0x76b041, 0xf08bb4]),
      glasses: Math.random() < 0.55,
    };
  }
  if (d === 'greenhouse') {
    return {
      ...base,
      hat: pick([0xff3b9a, 0x3ec9b6, 0x76b041, 0xf2c230]),
      shirt: pick([0x2b2e34, 0x3b4d36, 0x8e44ad]),
    };
  }
  if (d === 'industrial') {
    return {
      ...base,
      hat: pick([0xf2c230, 0xf08a24, 0x2f64c9]),
      shirt: pick([0x3a3f45, 0x6b4a2e, 0x4b5563]),
    };
  }
  const b = biomeAt(x, z);
  if (b === 'desert') {
    return { ...base, hat: pick([0xd9b87a, 0xc29b61, 0xf08a24, 0x8d5524]), shirt: pick([0xe6d6ad, 0xc98a4b, 0x7c4a2d]) };
  }
  if (b === 'tundra') {
    return { ...base, hat: pick([0x7cf0ff, 0x2f64c9, 0xf4f4f8, 0xc0392b]), shirt: pick([0x284366, 0x3c5266, 0xe6e8f0]) };
  }
  if (b === 'forest') {
    return { ...base, hat: pick([0x2e6f40, 0x5c7344, 0xc94a2f, 0x8b5a2b]), shirt: pick([0x3b4d36, 0x5c4a32, 0x4a6b3b]) };
  }
  if (b === 'farmland') {
    return { ...base, hat: pick([0xe6731e, 0xf2c230, 0x4fa34d]), shirt: pick([0x3d6b99, 0x8e5ea2, 0x6b4a2e]) };
  }
  if (b === 'loch') {
    return { ...base, hat: pick([0x2f5d50, 0x6b8f71, 0x8a5a3b, 0x3b5f8a]), shirt: pick([0x3f4a3c, 0x5a6b5e, 0x7a6a55]) };
  }
  if (b === 'parkland') {
    return { ...base, hat: pick([0xf2c230, 0x9bd14d, 0xe85d75, 0xffffff]), shirt: pick([0x7cbf4a, 0xf0e2a8, 0x5aa0d8]) };
  }
  return base;
}

export function randomGnomeName(): string {
  return `${pick(NPC_FIRST)} ${pick(NPC_LAST)}`;
}

/** Build a gnome model, add it to the scene and turn shadows on. */
export function makeGnome(scene: THREE.Object3D, look: GnomeLook): GnomeModel {
  const model = createGnomeModel(look);
  model.object.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  scene.add(model.object);
  return model;
}

/**
 * Hands up: call AFTER model.update(...) each frame, since update() animates the arms.
 * The arm pivots hang down; rotating them by about -PI on x points them up and a little forward.
 */
export function poseHandsUp(model: GnomeModel, t = 0): void {
  const wave = Math.sin(t * 9) * 0.12;
  model.arms.left.rotation.set(-2.85 + wave, 0, 0.3);
  model.arms.right.rotation.set(-2.85 - wave, 0, -0.3);
}

/** A PlayerState-shaped object for model.update(), for gnomes that are not the player. */
export function gnomeState(x: number, y: number, z: number, yaw: number, speed: number, sitting = false) {
  return {
    position: new THREE.Vector3(x, y, z),
    velocity: new THREE.Vector3(Math.sin(yaw) * speed, 0, Math.cos(yaw) * speed),
    facing: yaw,
    grounded: true,
    jumpsUsed: 0,
    sitting,
  };
}

/** Undo poseHandsUp's sideways splay (update() resets rotation.x by itself). */
export function clearHandsUp(model: GnomeModel): void {
  model.arms.left.rotation.z = 0;
  model.arms.right.rotation.z = 0;
}
