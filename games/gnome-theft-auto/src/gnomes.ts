// Town gnomes shared by pedestrians, drivers and officers: random looks, names and the hands-up pose.
import * as THREE from 'three';
import { createGnomeModel, type GnomeLook, type GnomeModel } from '@lawn/gnome';
import { NPC_FIRST, NPC_LAST } from './config';

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
