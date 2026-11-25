// Windfall Croft (E16 issue D2): the croft's static scenery. The fence and gate, the farmhouse and barn, the eight beds
// (soil only: the living crops are src/farm/), the stall, seed rack, For Sale board and water butt, the orchard, a
// scarecrow, the oak's soil patch, the dirt tracks, and three vignettes that tell the croft's story without text.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPieces, textPlate, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { BEDS, CROFT } from '../farm/types';

const HALF_PI = Math.PI / 2;
const FENCE_SEG = 4;
const FENCE_H = 1.1;
const SITE = CROFT.site;
const INSET = 1;

/** A fence run from a to b along x (alongX) or z, at the fixed coordinate `at`, in segments of about 4 m. */
function fenceRun(a: number, b: number, at: number, alongX: boolean): HomePiece[] {
  const n = Math.max(1, Math.round((b - a) / FENCE_SEG));
  const len = (b - a) / n;
  const out: HomePiece[] = [];
  for (let i = 0; i < n; i++) {
    const t = a + (i + 0.5) * len;
    out.push(alongX
      ? { prefab: 'croft-fence', x: t, z: at, yaw: 0, scale: len / FENCE_SEG, solid: false }
      : { prefab: 'croft-fence', x: at, z: t, yaw: HALF_PI, scale: len / FENCE_SEG, solid: false });
  }
  return out;
}

/** One thin collider (0.2 m) for a fence side. */
function wall(boxes: Box[], minX: number, maxX: number, minZ: number, maxZ: number): void {
  boxes.push({ minX, maxX, minZ, maxZ, h: heightAt((minX + maxX) / 2, (minZ + maxZ) / 2) + FENCE_H });
}

/** A flat decal on the ground at (x, z), its own material on the given draw layer. */
function flatPatch(scene: THREE.Scene, name: string, geo: THREE.BufferGeometry, x: number, z: number,
  layer: 'road' | 'area' | 'decal', color: number, lift: number): void {
  const mat = flatLayer(new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }), LAYER[layer]);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -HALF_PI;
  mesh.position.set(x, heightAt(x, z) + lift, z);
  mesh.name = name;
  scene.add(mesh);
}

/** A rectangle x0..x1, z0..z1 as a flat patch. */
function rectPatch(scene: THREE.Scene, name: string, x0: number, x1: number, z0: number, z1: number,
  layer: 'road' | 'area', color: number, lift: number): void {
  flatPatch(scene, name, new THREE.PlaneGeometry(x1 - x0, z1 - z0), (x0 + x1) / 2, (z0 + z1) / 2, layer, color, lift);
}

export function buildCroft(scene: THREE.Scene, boxes: Box[]): void {
  const { x: gx, z: gz } = CROFT.gate;
  const pieces: HomePiece[] = [];

  // Fence: a 1 m inset rectangle, with the 8 m gate gap in the west side (z 531..539).
  const x0 = SITE.minX + INSET, x1 = SITE.maxX - INSET, z0 = SITE.minZ + INSET, z1 = SITE.maxZ - INSET;
  pieces.push(...fenceRun(x0, x1, z0, true), ...fenceRun(x0, x1, z1, true));
  pieces.push(...fenceRun(z0, z1, x1, false));
  pieces.push(...fenceRun(z0, gz - 4, x0, false), ...fenceRun(gz + 4, z1, x0, false));
  wall(boxes, x0, x1, z0 - 0.1, z0 + 0.1);
  wall(boxes, x0, x1, z1 - 0.1, z1 + 0.1);
  wall(boxes, x1 - 0.1, x1 + 0.1, z0, z1);
  wall(boxes, x0 - 0.1, x0 + 0.1, z0, gz - 4);
  wall(boxes, x0 - 0.1, x0 + 0.1, gz + 4, z1);

  // Gate sign on a post just outside the gap (north of it), facing the road.
  const signX = 60.3, signZ = gz - 5.5;
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x5a4330 }));
  post.position.set(signX, heightAt(signX, signZ) + 0.65, signZ);
  post.name = 'croft-gate-post';
  scene.add(post);
  scene.add(textPlate('WINDFALL CROFT', signX - 0.15, heightAt(signX, signZ) + 1.3, signZ, -HALF_PI,
    { w: 1.4, h: 0.35, bg: 0x5f7d4a, fg: 0xf3e9cf }));

  // Buildings (explicit colliders: the rotated footprints, see the issue).
  pieces.push({ prefab: 'croft-farmhouse', x: CROFT.farmhouse.x, z: CROFT.farmhouse.z, yaw: -HALF_PI, solid: false });
  pieces.push({ prefab: 'croft-barn', x: CROFT.barn.x, z: CROFT.barn.z, yaw: -HALF_PI, solid: false });
  boxes.push({ minX: 123, maxX: 133, minZ: 506, maxZ: 520, h: heightAt(128, 513) + 7 });
  boxes.push({ minX: 122, maxX: 134, minZ: 546, maxZ: 560, h: heightAt(128, 553) + 8 });

  // Beds: soil only, walked onto to plant, so no colliders.
  for (const b of BEDS) pieces.push({ prefab: 'croft-bed', x: b.x, z: b.z, yaw: 0, solid: false });

  // The stall, seed rack, For Sale board and water butt (small colliders from their prefabs).
  pieces.push({ prefab: 'croft-stall', x: CROFT.stall.x, z: CROFT.stall.z, yaw: -HALF_PI });
  pieces.push({ prefab: 'croft-seed-rack', x: CROFT.seedRack.x, z: CROFT.seedRack.z, yaw: -HALF_PI });
  pieces.push({ prefab: 'croft-for-sale', x: CROFT.forSale.x, z: CROFT.forSale.z, yaw: -HALF_PI });
  pieces.push({ prefab: 'croft-water-butt', x: CROFT.waterButt.x, z: CROFT.waterButt.z, yaw: 0 });

  // Orchard along the south wall: five trees with trunk colliders, windfalls over the wall and a few inside.
  const treeZ = 559;
  for (const tx of [70, 82, 94, 106, 114]) {
    pieces.push({ prefab: 'croft-apple-tree', x: tx, z: treeZ, yaw: 0, solid: false });
    boxes.push({ minX: tx - 0.4, maxX: tx + 0.4, minZ: treeZ - 0.4, maxZ: treeZ + 0.4, h: heightAt(tx, treeZ) + 3 });
  }
  for (let i = 0; i < 9; i++) {
    const x = 68 + i * 5.4 + (i % 2) * 0.8;
    const z = i % 3 === 0 ? 561 : 566 + ((i * 7) % 5) * 0.8;
    pieces.push({ prefab: 'crab-apple', x, z, yaw: i * 1.3, solid: false });
  }

  // Scarecrow in the field, facing west, in its Levelright hard hat.
  pieces.push({ prefab: 'croft-scarecrow', x: 78, z: 540, yaw: -HALF_PI });

  // Vignette 1 (110, 512): "The last owner left". A hand cart with a trunk, a lamp and a birdcage (a feeder stands in
  // for the cage) and a hat left on the handle.
  pieces.push({ prefab: 'wooden-cart', x: 110, z: 511, yaw: 0.4, solid: false });
  pieces.push({ prefab: 'wooden-chest', x: 109.6, z: 510.4, yaw: 0.2, solid: false });
  pieces.push({ prefab: 'lamp', x: 111.6, z: 512.8, yaw: 0, solid: false });
  pieces.push({ prefab: 'bird-feeder', x: 108.2, z: 513.2, yaw: 0, solid: false });
  pieces.push({ prefab: 'croft-straw-hat', x: 107.2, z: 510.6, yaw: 0, solid: false });

  // Vignette 2 (80, 510): "The bargain is the weeds". A wheelbarrow of pulled weeds, a fork stuck in the ground and a
  // ring of weeds left standing round it. The weeds are small tufts with no colliders.
  pieces.push({ prefab: 'wheelbarrow', x: 80, z: 510, yaw: 0.3, solid: false });
  pieces.push({ prefab: 'hand-fork', x: 81.8, z: 511.6, yaw: 0.6, solid: false });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pieces.push({ prefab: 'grass-tuft', x: 80 + Math.cos(a) * 2.4, z: 510 + Math.sin(a) * 2.4, yaw: a, solid: false });
  }

  // Vignette 3 (135, 534): "The apples stayed". Three crates by the farmhouse's south-east corner, all full of apples,
  // and a price board leaning on them.
  pieces.push({ prefab: 'crate', x: 134.2, z: 532.4, yaw: 0, solid: false });
  pieces.push({ prefab: 'crate', x: 135.8, z: 532.4, yaw: 0.1, solid: false });
  pieces.push({ prefab: 'crate', x: 135, z: 533.9, yaw: -0.1, solid: false });
  for (let i = 0; i < 6; i++) {
    pieces.push({ prefab: 'crab-apple', x: 134 + (i % 3) * 0.9, z: 531.8 + Math.floor(i / 3) * 0.6, yaw: i, solid: false, y: 0.8 });
  }

  boxes.push(...buildPieces(scene, pieces, 'croft'));

  scene.add(textPlate('APPLES FREE. PLEASE.', 136.4, heightAt(136.4, 533.6) + 0.7, 533.6, -HALF_PI,
    { w: 0.6, h: 0.3, bg: 0xf3e9cf, fg: 0x3b2a1a }));

  // Ground: the oak's soil patch, the dirt tracks (gate to beds and to the farmhouse door), the farmyard in front of
  // the barn.
  const oak = CROFT.oak;
  flatPatch(scene, 'croft-oak-soil', new THREE.CircleGeometry(1.2, 24), oak.x, oak.z, 'decal', 0x4a3a28, 0.03);
  rectPatch(scene, 'croft-track-gate', gx, 112, 534.2, 535.8, 'road', 0x8a6e4b, 0.04);
  rectPatch(scene, 'croft-track-house', 111, 112.6, 512.5, 535.8, 'road', 0x8a6e4b, 0.04);
  rectPatch(scene, 'croft-track-door', 112, 121.5, 512.5, 514.1, 'road', 0x8a6e4b, 0.04);
  rectPatch(scene, 'croft-farmyard', 116, 121.5, 546, 558, 'area', 0x9c9385, 0.03);
}
