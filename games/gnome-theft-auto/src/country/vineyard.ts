// Trellisdown Vineyard (E16 issue C1): the vine rows on the hill (one static batch, a thin collider per run of row),
// the gate, Chicory's lodge, the press-house with the first vine on its wall, frost-pots, the path and the gravel
// apron laid on the ground.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPieces, textPlate, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { VINEYARD, type Footprint, type Rect, type Spot } from './types';

const SEG = 5;
const HALF_PI = Math.PI / 2;
const WOOD = 0x5a4330;

/** Distance from a point to an axis-aligned rectangle (0 inside). */
function distToRect(x: number, z: number, r: Rect): number {
  const dx = Math.max(r.minX - x, 0, x - r.maxX);
  const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.hypot(dx, dz);
}

function footprintRect(f: Footprint): Rect {
  return { minX: f.x - f.w / 2, maxX: f.x + f.w / 2, minZ: f.z - f.d / 2, maxZ: f.z + f.d / 2 };
}

/** A sheet over x0..x1, z0..z1 lying on the ground plus `lift`: a grid of nx by nz cells, so it follows a hill. */
function groundSheet(x0: number, x1: number, z0: number, z1: number, nz: number, lift: number, nx = 1): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nz; j++) {
    const z = z0 + ((z1 - z0) * j) / nz;
    for (let i = 0; i <= nx; i++) {
      const x = x0 + ((x1 - x0) * i) / nx;
      pos.push(x, heightAt(x, z) + lift, z);
    }
  }
  const row = nx + 1;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * row + i;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildVineyard(scene: THREE.Scene, boxes: Box[]): void {
  const { rows, path, pressHouse, lodge, gate, firstVine, story, chicoryLoop } = VINEYARD;
  const points: readonly Spot[] = [...story, ...chicoryLoop];
  const buildings = [footprintRect(lodge), footprintRect(pressHouse)];
  const px = pressHouse.x, pz = pressHouse.z;

  // A segment is left out if it crosses the path, comes within 3 m of a building or within 4 m of a story or loop spot.
  const segmentFree = (x0: number, z: number): boolean => {
    if (x0 < path.maxX && x0 + SEG > path.minX) return false;
    const seg: Rect = { minX: x0, maxX: x0 + SEG, minZ: z, maxZ: z };
    if (buildings.some((b) => rectDist(seg, b) < 3)) return false;
    return !points.some((p) => distToRect(p.x, p.z, seg) < 4);
  };

  // Rows: 5 m segments end to end, one static batch. Colliders: one thin box per run of placed segments.
  const rowPieces: HomePiece[] = [];
  let rowIndex = 0;
  for (let z = rows.minZ; z <= rows.maxZ; z += VINEYARD.rowStep, rowIndex++) {
    let run: { minX: number; maxX: number; h: number } | null = null;
    const closeRun = (): void => {
      if (!run) return;
      boxes.push({ minX: run.minX, maxX: run.maxX, minZ: z - 0.15, maxZ: z + 0.15, h: run.h + 1.6 });
      run = null;
    };
    for (let x0 = rows.minX; x0 + SEG <= rows.maxX; x0 += SEG) {
      if (!segmentFree(x0, z)) { closeRun(); continue; }
      const cx = x0 + SEG / 2;
      const crooked = z === VINEYARD.crookedRowZ && x0 >= path.maxX;
      rowPieces.push({ prefab: crooked ? 'vine-row-crooked' : 'vine-row', x: cx, z, yaw: 0, solid: false });
      const g = heightAt(cx, z);
      if (!run) run = { minX: x0, maxX: x0 + SEG, h: g };
      else { run.maxX = x0 + SEG; run.h = Math.max(run.h, g); }
    }
    closeRun();
    // Frost-pots 1 m beyond both ends of every third row.
    if (rowIndex % 3 === 0) {
      rowPieces.push({ prefab: 'frost-pot', x: rows.minX - 1, z, yaw: 0, solid: false });
      rowPieces.push({ prefab: 'frost-pot', x: rows.maxX + 1, z, yaw: 0, solid: false });
    }
  }
  buildPieces(scene, rowPieces, 'vineyard-rows');

  // Gate: piers are the only colliders; the 8 m gap stays open.
  const gatePieces: HomePiece[] = [
    { prefab: 'vineyard-gate', x: gate.x, z: gate.z, yaw: gate.yaw, solid: false },
    { prefab: 'gardener-lodge', x: lodge.x, z: lodge.z, yaw: lodge.yaw, solid: false },
    { prefab: 'press-house', x: pressHouse.x, z: pressHouse.z, yaw: pressHouse.yaw, solid: false },
    // Trough: 1 m off the back wall (inner face at z - 4), long side along x.
    { prefab: 'grape-trough', x: pressHouse.x, z: pressHouse.z - 4 + 1 + 0.6, yaw: 0 },
    // The first vine: 0.1 m off the press-house west wall (outer face at x = px - 6).
    { prefab: 'vine-first', x: px - 6.4, z: firstVine.z, yaw: -HALF_PI },
    { prefab: 'grape-crate', x: pressHouse.x - 2.4, z: pressHouse.z + 5.3, yaw: 0 },
    { prefab: 'grape-crate', x: pressHouse.x + 2.4, z: pressHouse.z + 5.3, yaw: 0 },
  ];
  for (const x of [gate.x - 4.2, gate.x + 4.2]) {
    boxes.push({ minX: x - 0.5, maxX: x + 0.5, minZ: gate.z - 0.5, maxZ: gate.z + 0.5, h: heightAt(x, gate.z) + 2.6 });
  }
  const lodgeTop = heightAt(lodge.x, lodge.z) + 5;
  boxes.push({ minX: lodge.x - 4, maxX: lodge.x + 4, minZ: lodge.z - 3, maxZ: lodge.z + 3, h: lodgeTop });
  // Press-house: back and side walls, not the arch on +z.
  const pressTop = heightAt(px, pz) + 4.5;
  boxes.push({ minX: px - 6, maxX: px + 6, minZ: pz - 4.5, maxZ: pz - 4.0, h: pressTop });
  boxes.push({ minX: px - 6, maxX: px - 5.5, minZ: pz - 4.0, maxZ: pz + 4.0, h: pressTop });
  boxes.push({ minX: px + 5.5, maxX: px + 6, minZ: pz - 4.0, maxZ: pz + 4.0, h: pressTop });
  boxes.push(...buildPieces(scene, gatePieces, 'vineyard-buildings'));

  // Signs and the gate post (plain architecture; no collider).
  const postX = gate.x + 5.8, postZ = gate.z + 0.6;
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 1.4, 0.12),
    new THREE.MeshLambertMaterial({ color: WOOD }),
  );
  post.position.set(postX, heightAt(postX, postZ) + 0.7, postZ);
  post.name = 'vineyard-sign-post';
  scene.add(post);
  scene.add(textPlate('TRELLISDOWN VINEYARD\nKEEP OFF THE ROWS\nBY ORDER OF THE GARDENER',
    postX, heightAt(postX, postZ) + 1.25, postZ + 0.1, 0, { w: 1.4, h: 0.4 }));
  const lodgeSignX = lodge.x + 2.6, lodgeSignZ = lodge.z + 3 + 0.05;
  scene.add(textPlate('C. SNIPS, HEAD GARDENER.\nKNOCK. THEN WAIT.\nTHEN GO AWAY.',
    lodgeSignX, heightAt(lodgeSignX, lodgeSignZ) + 1.5, lodgeSignZ, 0, { w: 0.9, h: 0.4 }));

  // Ground: the path up the middle and a gravel apron in front of the press-house arch.
  const pathMat = flatLayer(new THREE.MeshLambertMaterial({ color: 0x8a6e4b, side: THREE.DoubleSide }), LAYER.road);
  const pathMesh = new THREE.Mesh(groundSheet(path.minX, path.maxX, path.minZ, path.maxZ, 104, 0.06, 6), pathMat);
  pathMesh.name = 'vineyard-path';
  scene.add(pathMesh);
  const apronMat = flatLayer(new THREE.MeshLambertMaterial({ color: 0x9c9385, side: THREE.DoubleSide }), LAYER.area);
  const apron = new THREE.Mesh(groundSheet(px - 5, px + 5, pz + 4.6, pz + 8.5, 2, 0.04), apronMat);
  apron.name = 'vineyard-apron';
  scene.add(apron);
}

/** Distance between two axis-aligned rectangles (0 when they overlap). */
function rectDist(a: Rect, b: Rect): number {
  const dx = Math.max(a.minX - b.maxX, 0, b.minX - a.maxX);
  const dz = Math.max(a.minZ - b.maxZ, 0, b.minZ - a.maxZ);
  return Math.hypot(dx, dz);
}
