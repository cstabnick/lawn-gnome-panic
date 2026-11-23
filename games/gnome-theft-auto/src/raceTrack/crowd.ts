// The Speedway crowd: hundreds of little spectator gnomes on the grandstand decks, cheering harder when cars pass.
// Three InstancedMeshes (shirt, head, hat) share one instance order; per-instance colour gives the variety.
import * as THREE from 'three';
import type { Deck } from './track';

export interface Crowd {
  /** Per frame. `excitement` 0..1 (a race running, a car going past); far from the player the crowd stands still. */
  update(dt: number, px: number, pz: number, excitement: number): void;
}

const SEED = 0x5eed;
const MAX_SPECTATORS = 900;
const ROW_GAP = 1.1;
const COL_GAP = 0.85;
const MARGIN = 0.3;
const JITTER = 0.12;
const SKIP_CHANCE = 0.12;
const ANIMATE_RANGE = 220;
const HIDE_RANGE = 450;
const MIN_FRAME = 1 / 30;

const SHIRTS = [0xe53935, 0x1e88e5, 0x43a047, 0xfdd835, 0x8e24aa, 0x00acc1, 0xff8f00, 0xf06292];
const HATS_RED = 0xd8342c;
const HAT_YELLOW = 0xffd21f; // Dandelion Fizz fans
const HAT_ORANGE = 0xff7a00; // Razor-Back fans
const SKINS = [0xf1c27d, 0xc68642, 0x8d5524];

// Local heights above the deck surface (the gnome stands about 1 m tall).
const BODY_Y = 0.25;
const HEAD_Y = 0.58;
const HAT_Y = 0.78;

/** Small seeded PRNG so the crowd is identical on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Spectator {
  x: number;
  y: number;
  z: number;
  yaw: number;
  col: number;
  phase: number;
}

function gatherSpectators(decks: readonly Deck[], rand: () => number): Spectator[] {
  const all: Spectator[] = [];
  decks.forEach((deck, di) => {
    const fx = Math.sin(deck.yaw);
    const fz = Math.cos(deck.yaw);
    // Right-hand vector across the facing.
    const rx = Math.cos(deck.yaw);
    const rz = -Math.sin(deck.yaw);
    const usable = (length: number) => Math.max(0, length - 2 * MARGIN);
    const cols = Math.floor(usable(deck.w) / COL_GAP) + 1;
    const rows = Math.floor(usable(deck.d) / ROW_GAP) + 1;
    const acrossStart = -((cols - 1) * COL_GAP) / 2;
    const depthStart = -((rows - 1) * ROW_GAP) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() < SKIP_CHANCE) continue;
        const across = acrossStart + c * COL_GAP + (rand() * 2 - 1) * JITTER;
        const depth = depthStart + r * ROW_GAP + (rand() * 2 - 1) * JITTER;
        all.push({
          x: deck.x + rx * across + fx * depth,
          y: deck.y,
          z: deck.z + rz * across + fz * depth,
          yaw: deck.yaw,
          col: c,
          phase: rand() * Math.PI * 2 + di * 0.1,
        });
      }
    }
  });
  if (all.length <= MAX_SPECTATORS) return all;
  // Thin evenly: keep spectator i when the kept count would step up at i.
  const total = all.length;
  const kept: Spectator[] = [];
  for (let i = 0; i < total; i++) {
    if (Math.floor(((i + 1) * MAX_SPECTATORS) / total) > Math.floor((i * MAX_SPECTATORS) / total)) {
      kept.push(all[i]);
    }
  }
  return kept;
}

export function createCrowd(scene: THREE.Scene, decks: readonly Deck[]): Crowd {
  const rand = mulberry32(SEED);
  const spectators = gatherSpectators(decks, rand);
  const count = spectators.length;

  const bodyGeo = new THREE.CylinderGeometry(0.16, 0.26, 0.5, 6);
  const headGeo = new THREE.IcosahedronGeometry(0.15, 0);
  const hatGeo = new THREE.ConeGeometry(0.17, 0.4, 6);
  const material = new THREE.MeshLambertMaterial();

  const body = new THREE.InstancedMesh(bodyGeo, material, count);
  const head = new THREE.InstancedMesh(headGeo, material, count);
  const hat = new THREE.InstancedMesh(hatGeo, material, count);
  const meshes = [body, head, hat];
  for (const mesh of meshes) {
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  }

  const colour = new THREE.Color();
  for (let i = 0; i < count; i++) {
    colour.setHex(SHIRTS[Math.floor(rand() * SHIRTS.length)]);
    body.setColorAt(i, colour);
    colour.setHex(SKINS[Math.floor(rand() * SKINS.length)]);
    head.setColorAt(i, colour);
    const roll = rand();
    colour.setHex(roll < 0.7 ? HATS_RED : roll < 0.85 ? HAT_YELLOW : HAT_ORANGE);
    hat.setColorAt(i, colour);
  }
  for (const mesh of meshes) {
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  // Bounding centre of the decks (for the distance gates) and a sphere covering every spectator.
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const deck of decks) {
    minX = Math.min(minX, deck.x);
    maxX = Math.max(maxX, deck.x);
    minZ = Math.min(minZ, deck.z);
    maxZ = Math.max(maxZ, deck.z);
  }
  const cx = decks.length ? (minX + maxX) / 2 : 0;
  const cz = decks.length ? (minZ + maxZ) / 2 : 0;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);

  function writeMatrices(t: number, excitement: number): void {
    const bobHeight = 0.05 + 0.25 * excitement;
    const wave = excitement > 0.5 ? (excitement - 0.5) * 2 : 0;
    for (let i = 0; i < count; i++) {
      const s = spectators[i];
      const bob = bobHeight * Math.abs(Math.sin(t * 6 + s.phase));
      const crest = wave > 0 ? 0.35 * wave * Math.max(0, Math.sin(t * 5 - s.col * 0.6)) : 0;
      const sway = 0.08 * Math.sin(t * 2.5 + s.phase);
      quaternion.setFromAxisAngle(up, s.yaw + sway);
      scale.set(1, 1, 1);
      const lift = bob + crest;
      position.set(s.x, s.y + BODY_Y + lift, s.z);
      body.setMatrixAt(i, matrix.compose(position, quaternion, scale));
      position.set(s.x, s.y + HEAD_Y + lift, s.z);
      head.setMatrixAt(i, matrix.compose(position, quaternion, scale));
      position.set(s.x, s.y + HAT_Y + lift, s.z);
      hat.setMatrixAt(i, matrix.compose(position, quaternion, scale));
    }
    for (const mesh of meshes) mesh.instanceMatrix.needsUpdate = true;
  }

  // Initial, still pose, then a sphere that covers every spectator plus animation headroom.
  writeMatrices(0, 0);
  for (const mesh of meshes) {
    mesh.computeBoundingSphere();
    if (mesh.boundingSphere) mesh.boundingSphere.radius += 1.5;
    scene.add(mesh);
  }

  let clock = 0;
  let acc = 0;

  return {
    update(dt, px, pz, excitement) {
      const dist = Math.hypot(px - cx, pz - cz);
      for (const mesh of meshes) mesh.visible = dist <= HIDE_RANGE;
      if (dist > ANIMATE_RANGE || count === 0) return;
      acc += dt;
      if (acc < MIN_FRAME) return;
      clock += acc;
      acc = 0;
      writeMatrices(clock, Math.min(1, Math.max(0, excitement)));
    },
  };
}
