// Rootwell University's grounds (E13 issue A12): the gate and drive, the car park, the quad (striped lawn, ring and cross
// paths, the founder's statue), gravel paths to every door, hedges, trees, lamps, benches, banners and bins.
// Buildings, their name plates, vignettes and posters are other workers' (buildings.ts, story.ts): the strip in front of
// each building is left free of everything but paths.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYER, flatLayer } from '@lawn/depth';
import { getPrefab } from '@lawn/prefabs';
import { registerCull } from '../cull';
import { buildPieces, prefabBox, textPlate, type HomePiece } from '../homes/pieces';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { CAMPUS, CAMPUS_BUILDINGS } from './types';

type Pt = [number, number];

const HALF_PI = Math.PI / 2;
const GRAVEL_W = 3;
const RING_IN = 1.5; // the ring path's centre line, metres inside the quad edge
const PLAZA_R = 7;

// ---- Flat surfaces (follow the ground) --------------------------------------------------------------------------------

/** A grid surface: pt(u, v) -> (x, z), u and v in 0..1 (v rotated a quarter turn from u, so the face looks up). */
function surface(pt: (u: number, v: number) => Pt, nu: number, nv: number, lift: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= nu; i++) {
    for (let j = 0; j <= nv; j++) {
      const [x, z] = pt(i / nu, j / nv);
      pos.push(x, heightAt(x, z) + lift, z);
    }
  }
  const row = nv + 1;
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A strip of width w from a to b. */
function strip(a: Pt, b: Pt, w: number, lift: number): THREE.BufferGeometry {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  const nx = -dz / l, nz = dx / l;
  return surface((u, v) => [a[0] + dx * u + nx * (v - 0.5) * w, a[1] + dz * u + nz * (v - 0.5) * w],
    Math.max(1, Math.ceil(l / 6)), Math.max(1, Math.ceil(w / 4)), lift);
}

/** A path along a polyline: each joint is squared off with half a width of overlap. */
function poly(pts: Pt[], w: number, lift: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let k = 0; k + 1 < pts.length; k++) {
    let a = pts[k], b = pts[k + 1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ux = (b[0] - a[0]) / l, uz = (b[1] - a[1]) / l;
    if (k > 0) a = [a[0] - ux * w / 2, a[1] - uz * w / 2];
    if (k + 2 < pts.length) b = [b[0] + ux * w / 2, b[1] + uz * w / 2];
    out.push(strip(a, b, w, lift));
  }
  return out;
}

function rect(x0: number, z0: number, x1: number, z1: number, lift: number): THREE.BufferGeometry {
  return surface((u, v) => [x0 + (x1 - x0) * u, z0 + (z1 - z0) * v],
    Math.max(1, Math.ceil((x1 - x0) / 6)), Math.max(1, Math.ceil((z1 - z0) / 6)), lift);
}

function disc(cx: number, cz: number, r: number, lift: number): THREE.BufferGeometry {
  return surface((u, v) => [cx + Math.cos(v * Math.PI * 2) * r * u, cz + Math.sin(v * Math.PI * 2) * r * u], 4, 28, lift);
}

function layerMat(color: number, layer: number): THREE.MeshLambertMaterial {
  return flatLayer(new THREE.MeshLambertMaterial({ color }), layer);
}

function addMerged(group: THREE.Group, geoms: THREE.BufferGeometry[], mat: THREE.Material, name: string): void {
  if (!geoms.length) return;
  const m = new THREE.Mesh(mergeGeometries(geoms, false), mat);
  m.name = name;
  m.receiveShadow = true;
  group.add(m);
  geoms.forEach((g) => g.dispose());
}

// ---- Plan -------------------------------------------------------------------------------------------------------------

interface Seg { a: Pt; b: Pt; w: number }

const Q = CAMPUS.quad;
const QC = CAMPUS.quadCentre;
const RING = { minX: Q.minX + RING_IN, maxX: Q.maxX - RING_IN, minZ: Q.minZ + RING_IN, maxZ: Q.maxZ - RING_IN };

/** Gravel paths from each door to the quad ring (or the drive): polylines starting at the door spot. */
const DOOR_PATHS: Pt[][] = [
  [[1110, -277.5], [1110, RING.minZ]],
  [[1180, -278.5], [1180, RING.minZ]],
  [[1110, -125.5], [1110, RING.maxZ]],
  [[1180, -122.5], [1180, RING.maxZ]],
  [[1231.5, -215], [RING.maxX, -215]],
  [[1239.5, -160], [RING.maxX, -160]],
  [[1274.5, -215], [1266, -215], [1266, -180], [RING.maxX, -180]],
  [[1265, -94.5], [1265, RING.maxZ], [RING.maxX, RING.maxZ]],
  [[1262, -308.5], [1262, RING.minZ], [RING.maxX, RING.minZ]],
  [[1030, -305.5], [1030, RING.minZ], [RING.minX, RING.minZ]],
  [[1063.5, -245], [RING.minX, -245]],
  [[1000, -208.5], [1000, -204]],
  [[1040, -116.5], [1040, RING.maxZ], [RING.minX, RING.maxZ]],
];

/** The two diagonal cross paths: from each quad corner in to the plaza's edge. */
function diagonals(): Pt[][] {
  const out: Pt[][] = [];
  for (const c of [[RING.minX, RING.minZ], [RING.maxX, RING.minZ], [RING.minX, RING.maxZ], [RING.maxX, RING.maxZ]] as Pt[]) {
    const dx = c[0] - QC.x, dz = c[1] - QC.z;
    const l = Math.hypot(dx, dz);
    out.push([[QC.x + (dx / l) * (PLAZA_R - 0.5), QC.z + (dz / l) * (PLAZA_R - 0.5)], c]);
  }
  return out;
}

function pathSegs(): Seg[] {
  const segs: Seg[] = [];
  for (const p of [...DOOR_PATHS, ...diagonals()]) {
    for (let k = 0; k + 1 < p.length; k++) segs.push({ a: p[k], b: p[k + 1], w: GRAVEL_W });
  }
  // The ring.
  segs.push({ a: [Q.minX, RING.minZ], b: [Q.maxX, RING.minZ], w: GRAVEL_W });
  segs.push({ a: [Q.minX, RING.maxZ], b: [Q.maxX, RING.maxZ], w: GRAVEL_W });
  segs.push({ a: [RING.minX, RING.minZ], b: [RING.minX, RING.maxZ], w: GRAVEL_W });
  segs.push({ a: [RING.maxX, RING.minZ], b: [RING.maxX, RING.maxZ], w: GRAVEL_W });
  // The drive.
  segs.push({ a: [CAMPUS.drive.from.x, CAMPUS.drive.from.z], b: [CAMPUS.drive.to.x, CAMPUS.drive.to.z], w: CAMPUS.drive.width });
  return segs;
}

function distToSeg(px: number, pz: number, s: Seg): number {
  const dx = s.b[0] - s.a[0], dz = s.b[1] - s.a[1];
  const l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - s.a[0]) * dx + (pz - s.a[1]) * dz) / l2));
  return Math.hypot(px - (s.a[0] + dx * t), pz - (s.a[1] + dz * t)) - s.w / 2;
}

/** Footprint of a building (x, z ranges), grown by m metres. */
function footprint(b: (typeof CAMPUS_BUILDINGS)[number], m = 0): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const swap = Math.abs(Math.sin(b.yaw)) > 0.5;
  const hx = (swap ? b.d : b.w) / 2 + m, hz = (swap ? b.w : b.d) / 2 + m;
  return { minX: b.x - hx, maxX: b.x + hx, minZ: b.z - hz, maxZ: b.z + hz };
}

/** The 10 m strip in front of a building's door side, as a rectangle. */
function frontZone(b: (typeof CAMPUS_BUILDINGS)[number]): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const f = footprint(b);
  const sx = Math.round(Math.sin(b.yaw)), sz = Math.round(Math.cos(b.yaw));
  if (sx > 0) return { ...f, minX: f.maxX, maxX: f.maxX + 10 };
  if (sx < 0) return { ...f, minX: f.minX - 10, maxX: f.minX };
  if (sz > 0) return { ...f, minZ: f.maxZ, maxZ: f.maxZ + 10 };
  return { ...f, minZ: f.minZ - 10, maxZ: f.minZ };
}

const inRect = (r: { minX: number; maxX: number; minZ: number; maxZ: number }, x: number, z: number): boolean =>
  x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ;

/** A tree spot is fine when it is 4 m from every path, building, door and the drive and outside every front strip. */
function treeSpotOk(x: number, z: number, segs: Seg[]): boolean {
  if (x < CAMPUS.site.minX + 4 || x > CAMPUS.site.maxX - 4 || z < CAMPUS.site.minZ + 4 || z > CAMPUS.site.maxZ - 4) return false;
  if (segs.some((s) => distToSeg(x, z, s) < 4)) return false;
  if (inRect({ minX: Q.minX - 4, maxX: Q.maxX + 4, minZ: Q.minZ - 4, maxZ: Q.maxZ + 4 }, x, z)) return false;
  for (const b of CAMPUS_BUILDINGS) {
    if (inRect(footprint(b, 4), x, z) || inRect(frontZone(b), x, z)) return false;
    if (Math.hypot(x - b.door.x, z - b.door.z) < 4) return false;
  }
  return true;
}

// ---- The grounds ------------------------------------------------------------------------------------------------------

export function buildCampusGrounds(scene: THREE.Scene, boxes: Box[]): void {
  const root = new THREE.Group();
  root.name = 'campus-grounds';
  const g = (x: number, z: number): number => heightAt(x, z);

  // Materials, one per layer and colour.
  const asphalt = layerMat(0x3a3c41, LAYER.road);
  const gravel = layerMat(0xd6cba3, LAYER.road);
  const lot = layerMat(0x44464b, LAYER.area);
  const plazaMat = layerMat(0xc9c2b0, LAYER.area);
  const lawnLight = layerMat(0x73b848, LAYER.tint);
  const lawnDark = layerMat(0x5aa03c, LAYER.tint);
  const paint = layerMat(0xf4f1e6, LAYER.marking);
  const LIFT = { tint: 0.02, area: 0.03, road: 0.04, marking: 0.05 };

  // ---- Drive, gate, car park (west) ----
  const west = new THREE.Group();
  west.name = 'campus-flat-west';
  const dv = CAMPUS.drive;
  // Starts at the road's edge (x ~950), not on it: two road surfaces on one layer would z-fight.
  const driveX0 = dv.from.x + 5;
  addMerged(west, [strip([driveX0, dv.from.z], [dv.to.x, dv.to.z], dv.width, LIFT.road)], asphalt, 'drive');
  const dashes: THREE.BufferGeometry[] = [];
  for (let x = driveX0 + 3; x + 3 <= dv.to.x; x += 6) dashes.push(strip([x, dv.from.z], [x + 3, dv.from.z], 0.2, LIFT.marking));
  addMerged(west, dashes, paint, 'drive-dashes');

  // The car park: asphalt joined to the drive by a short apron, 14 bays in two rows round a central aisle.
  const P = CAMPUS.parking;
  const lotZ0 = P.minZ, lotZ1 = P.minZ + 20;
  addMerged(west, [
    rect(P.minX, lotZ0, P.maxX, lotZ1, LIFT.area),
    rect(P.minX + 2, dv.from.z + dv.width / 2 - 1, P.minX + 10, lotZ0 + 0.5, LIFT.area),
  ], lot, 'car-park');
  const lines: THREE.BufferGeometry[] = [];
  const bayX0 = P.minX + 14, bayW = 5;
  const rowN = [lotZ0 + 1, lotZ0 + 6.5], rowS = [lotZ1 - 6.5, lotZ1 - 1];
  for (const [z0, z1] of [rowN, rowS]) {
    for (let k = 0; k <= 7; k++) lines.push(strip([bayX0 + k * bayW, z0], [bayX0 + k * bayW, z1], 0.12, LIFT.marking));
  }
  lines.push(strip([bayX0, rowN[1]], [bayX0 + 7 * bayW, rowN[1]], 0.12, LIFT.marking));
  lines.push(strip([bayX0, rowS[0]], [bayX0 + 7 * bayW, rowS[0]], 0.12, LIFT.marking));
  addMerged(west, lines, paint, 'bay-lines');
  root.add(west);
  registerCull(west, 'building');

  // ---- The quad and the paths ----
  const quad = new THREE.Group();
  quad.name = 'campus-flat-quad';
  const light: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  for (let k = 0, x = Q.minX; x < Q.maxX; k++, x += 6) {
    (k % 2 ? dark : light).push(rect(x, Q.minZ, Math.min(x + 6, Q.maxX), Q.maxZ, LIFT.tint));
  }
  addMerged(quad, light, lawnLight, 'lawn-light');
  addMerged(quad, dark, lawnDark, 'lawn-dark');
  addMerged(quad, [disc(QC.x, QC.z, PLAZA_R, LIFT.area)], plazaMat, 'plaza');
  root.add(quad);
  registerCull(quad, 'building');

  const paths = new THREE.Group();
  paths.name = 'campus-flat-paths';
  const gv: THREE.BufferGeometry[] = [];
  for (const p of [...DOOR_PATHS, ...diagonals()]) gv.push(...poly(p, GRAVEL_W, LIFT.road));
  gv.push(strip([Q.minX, RING.minZ], [Q.maxX, RING.minZ], GRAVEL_W, LIFT.road));
  gv.push(strip([Q.minX, RING.maxZ], [Q.maxX, RING.maxZ], GRAVEL_W, LIFT.road));
  gv.push(strip([RING.minX, RING.minZ + GRAVEL_W / 2], [RING.minX, RING.maxZ - GRAVEL_W / 2], GRAVEL_W, LIFT.road));
  gv.push(strip([RING.maxX, RING.minZ + GRAVEL_W / 2], [RING.maxX, RING.maxZ - GRAVEL_W / 2], GRAVEL_W, LIFT.road));
  addMerged(paths, gv, gravel, 'gravel');
  root.add(paths);
  registerCull(paths, 'building');

  // ---- Architecture: gate pillars, railings, sign post ----
  const stone = new THREE.MeshLambertMaterial({ color: 0x9d968a });
  const iron = new THREE.MeshLambertMaterial({ color: 0x23262b });
  const arch = new THREE.Group();
  arch.name = 'campus-gate';
  const gx = CAMPUS.gate.x;
  for (const pz of [CAMPUS.gate.z - 5.5, CAMPUS.gate.z + 5.5]) {
    const y0 = g(gx, pz);
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 1.2), stone);
    pillar.position.set(gx, y0 + 1.6, pz);
    pillar.castShadow = true;
    arch.add(pillar);
    boxes.push({ minX: gx - 0.6, maxX: gx + 0.6, minZ: pz - 0.6, maxZ: pz + 0.6, h: y0 + 3.2 });
    arch.add(textPlate('ROOTWELL\nUNIVERSITY', gx - 0.63, y0 + 2.3, pz, -HALF_PI, { w: 1.0, h: 0.7, bg: 0xf2e8c8 }));
  }

  // The railing along the west edge, north and south of the gate (the drive stays open).
  const fx = CAMPUS.site.minX + 1;
  const iron3: THREE.BufferGeometry[] = [];
  const runs: [number, number][] = [[CAMPUS.gate.z - 66.5, CAMPUS.gate.z - 6.5], [CAMPUS.gate.z + 6.5, CAMPUS.gate.z + 66.5]];
  for (const [z0, z1] of runs) {
    const n = Math.round((z1 - z0) / 2.5);
    for (let k = 0; k <= n; k++) {
      const z = z0 + k * ((z1 - z0) / n);
      const post = new THREE.BoxGeometry(0.12, 1.5, 0.12);
      post.translate(fx, g(fx, z) + 0.75, z);
      iron3.push(post);
      if (k < n) {
        const zm = z + (z1 - z0) / n / 2;
        for (const y of [0.4, 1.2]) {
          const rail = new THREE.BoxGeometry(0.06, 0.06, (z1 - z0) / n);
          rail.translate(fx, g(fx, zm) + y, zm);
          iron3.push(rail);
        }
      }
    }
    boxes.push({ minX: fx - 0.1, maxX: fx + 0.1, minZ: z0, maxZ: z1, h: g(fx, (z0 + z1) / 2) + 1.5 });
  }
  const fence = new THREE.Mesh(mergeGeometries(iron3, false), iron);
  fence.name = 'campus-railings';
  fence.castShadow = true;
  arch.add(fence);
  iron3.forEach((geo) => geo.dispose());

  // The car park sign: VISITORS / FACULTY / DEAN (ALL OF THEM), at the aisle's east end, facing the entrance.
  const sx = P.minX + 14 + 7 * 5 + 5.5, sz = (lotZ0 + lotZ1) / 2;
  const sy = g(sx, sz);
  const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), iron);
  signPost.position.set(sx, sy + 1.3, sz);
  arch.add(signPost);
  boxes.push({ minX: sx - 0.1, maxX: sx + 0.1, minZ: sz - 0.1, maxZ: sz + 0.1, h: sy + 2.6 });
  arch.add(textPlate('VISITORS\nFACULTY\nDEAN (ALL OF THEM)', sx - 0.13, sy + 2.0, sz, -HALF_PI, { w: 1.8, h: 0.9, bg: 0xf2e8c8 }));
  root.add(arch);

  // ---- Prefab dressing ----
  const pieces: HomePiece[] = [];
  const add = (p: HomePiece): void => { pieces.push(p); };
  const segs = pathSegs();

  // The founder and the sundial.
  const statueSize = 3.6;
  add({ prefab: 'founder-statue', x: QC.x, z: QC.z, yaw: 0, size: statueSize, solid: true });
  add({ prefab: 'quad-sundial', x: QC.x + 6.4, z: QC.z + 6.4, yaw: 0, size: 1.6, solid: false });
  if (getPrefab('founder-statue')) {
    const b = prefabBox('founder-statue');
    const longest = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
    const s = longest > 0 ? statueSize / longest : 1;
    root.add(textPlate('OUR FOUNDER\nWHO FELL FIRST', QC.x, g(QC.x, QC.z) + 0.55, QC.z + b.max.z * s + 0.05, 0, { w: 1.1, h: 0.45, bg: 0xd4af37 }));
  }

  // Low clipped hedges along the quad's north and south sides, gaps where the door paths cross.
  const hs = 1.5, hLen = 1.96 * hs;
  for (const hz of [Q.minZ + 3.8, Q.maxZ - 3.8]) {
    for (let x = Q.minX + 10 + hLen / 2; x < Q.maxX - 10; x += hLen) {
      if ([1110, 1180].some((px) => Math.abs(x - px) < GRAVEL_W / 2 + hLen / 2 + 0.5)) continue;
      add({ prefab: 'euro-box-hedge', x, z: hz, yaw: 0, scale: hs, solid: true });
    }
  }

  // Trees: an avenue of planes along the drive, oaks round the corners and between the halls.
  const planeSpots: [number, number, number][] = [
    [1016, -209.5, 1], [1030, -209.5, 1.15], [1044, -209.5, 0.95], [1058, -209.5, 1.1], [1070, -189, 1], [1070, -176, 1.1],
    [1010, -240, 1.05], [1020, -252, 0.95], [1000, -252, 1.1], [1045, -285, 1], [1060, -295, 1.1],
    [1100, -90, 1], [1215, -85, 1.05], [1285, -150, 1], [1290, -180, 1.1], [1285, -120, 0.95],
  ];
  const oakSpots: [number, number][] = [
    [1068, -274], [1222, -274], [1068, -130], [1222, -130], [1147, -292], [1147, -118], [1266, -255], [1060, -320],
  ];
  let trees = 0;
  for (const [x, z, s] of planeSpots) {
    if (!treeSpotOk(x, z, segs)) continue;
    add({ prefab: 'euro-plane-tree', x, z, yaw: (x * 7 + z) % 6.28, scale: s, solid: true });
    trees++;
  }
  for (const [x, z] of oakSpots) {
    if (!treeSpotOk(x, z, segs)) continue;
    add({ prefab: 'giant-oak', x, z, yaw: (x + z * 3) % 6.28, scale: 3, solid: true });
    trees++;
  }
  if (trees < 18) console.warn(`campus grounds: only ${trees} trees placed`);

  // Lamps along the drive and the quad ring.
  for (const x of [1000, 1020, 1040, 1060, 1076]) add({ prefab: 'euro-lamp-post', x, z: -193, yaw: 0, solid: false });
  for (const x of [1030, 1050, 1070]) add({ prefab: 'euro-lamp-post', x, z: -207, yaw: 0, solid: false });
  for (const [x, z] of [[1100, -257.5], [1190, -257.5], [1100, -146.5], [1190, -146.5], [1086.5, -222], [1086.5, -182], [1203.5, -222], [1203.5, -182]]) {
    add({ prefab: 'garden-lamp-post', x, z, yaw: 0, solid: false });
  }

  // Benches round the ring, facing the lawn; red-flower planters at path junctions.
  for (const [x, z, yaw] of [[1128, -257.5, 0], [1162, -257.5, 0], [1128, -146.5, Math.PI], [1162, -146.5, Math.PI], [1203.5, -202, -HALF_PI], [1086.5, -160, HALF_PI]]) {
    add({ prefab: 'park-bench', x, z, yaw, solid: false });
  }
  for (const [x, z] of [[1088, -259], [1202, -259], [1088, -145], [1202, -145], [1105, -259], [1175, -259]]) {
    add({ prefab: 'roundabout-planter', x, z, yaw: 0, solid: false });
  }

  // College banners on the quad corners and at the gate.
  for (const [x, z] of [[1077, -268], [1213, -268], [1077, -137], [1213, -137]]) {
    add({ prefab: 'college-banner', x, z, yaw: Math.atan2(QC.x - x, QC.z - z), solid: false, tint: 0xb02a2a, trim: 0xd4af37 });
  }
  for (const z of [-210, -190]) add({ prefab: 'college-banner', x: 985.5, z, yaw: -HALF_PI, solid: false, tint: 0xb02a2a, trim: 0xd4af37 });

  // Bike racks by Bedstraw House and the Long Shelf (beside them, off the front strips), bins, noticeboard, meter.
  for (const [x, z] of [[1008, -312], [1008, -318], [1085, -296], [1085, -290]]) add({ prefab: 'bike-rack', x, z, yaw: HALF_PI, solid: false });
  for (const [x, z] of [[1090, -209], [1090, -191], [1200, -209], [1200, -191], [1010, -208], [1243, -146]]) {
    add({ prefab: 'litter-bin', x, z, yaw: 0, solid: false });
  }
  add({ prefab: 'park-noticeboard', x: 1075, z: -210, yaw: HALF_PI, solid: false });
  add({ prefab: 'parking-meter', x: P.minX + 11, z: (lotZ0 + lotZ1) / 2, yaw: HALF_PI, solid: false });

  boxes.push(...buildPieces(scene, pieces, 'campus-grounds-pieces'));
  scene.add(root);
}
