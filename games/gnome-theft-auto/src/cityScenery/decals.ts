// Ground patches, painted marks and cables as merged, culled meshes (docs/roadmaps/gta-parks-and-fringe.md).
// Patches lie on LAYER.area (under roads), draped on the ground; marks use one self-drawn atlas on LAYER.decal; cables
// are thin boxes. One mesh per (kind or material, cell), each registered with the culler. Nothing runs per frame.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYER, flatLayer } from '@lawn/depth';
import { registerCull } from '../cull';
import { addGroundToGeometry, drapedRibbon } from '../terrainMesh';
import { TILE, groundTexture, planarUv } from '../textures';
import type { Cable, GroundPatch, Mark, MarkTile, PatchKind } from './types';

const PATCH_LIFT = 0.012;

/** Keeps position, normal and uv only (what mergeGeometries needs to match), indexed. */
function clean(g: THREE.BufferGeometry): THREE.BufferGeometry {
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
  if (!g.index) {
    const idx: number[] = [];
    for (let i = 0; i < g.getAttribute('position').count; i++) idx.push(i);
    g.setIndex(idx);
  }
  return g;
}

function addMesh(scene: THREE.Scene, geos: THREE.BufferGeometry[], mat: THREE.Material, name: string, cls: 'cell' | 'detail' | 'prop', shadow = true): void {
  if (geos.length === 0) return;
  const geo = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!geo) return;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = shadow;
  scene.add(mesh);
  registerCull(mesh, cls);
}

const cellKey = (x: number, z: number, size: number): string => `${Math.floor(x / size)},${Math.floor(z / size)}`;

// ---- Patches ------------------------------------------------------------------------------------------------------

const patchMats = new Map<PatchKind, THREE.MeshStandardMaterial>();
function patchMaterial(kind: PatchKind): THREE.MeshStandardMaterial {
  let m = patchMats.get(kind);
  if (!m) {
    m = kind === 'pond'
      ? new THREE.MeshStandardMaterial({ color: 0x3f6f7f, roughness: 0.2, metalness: 0.1 })
      : new THREE.MeshStandardMaterial({ color: 0xffffff, map: groundTexture(kind), roughness: 1 });
    flatLayer(m, LAYER.area);
    patchMats.set(kind, m);
  }
  return m;
}

function patchGeometry(p: GroundPatch): THREE.BufferGeometry | null {
  let g: THREE.BufferGeometry;
  if (p.shape === 'ribbon') {
    if (!p.points || p.points.length < 2) return null;
    g = drapedRibbon(p.points, p.w, PATCH_LIFT);
  } else if (p.shape === 'disc') {
    g = new THREE.CircleGeometry(p.w / 2, 28).rotateX(-Math.PI / 2).translate(p.x, PATCH_LIFT, p.z);
    addGroundToGeometry(g);
  } else {
    g = new THREE.PlaneGeometry(p.w, p.d, Math.max(1, Math.ceil(p.w / 2)), Math.max(1, Math.ceil(p.d / 2)))
      .rotateX(-Math.PI / 2).rotateY(p.yaw).translate(p.x, PATCH_LIFT, p.z);
    addGroundToGeometry(g);
  }
  if (p.kind !== 'pond') planarUv(g, TILE[p.kind]);
  return clean(g);
}

/** Draped ground patches, merged per kind per 128 m cell (LAYER.area), each cell registered with the culler. */
export function buildPatches(scene: THREE.Scene, patches: readonly GroundPatch[], name: string): void {
  const groups = new Map<string, { kind: PatchKind; geos: THREE.BufferGeometry[] }>();
  for (const p of patches) {
    const ax = p.shape === 'ribbon' && p.points?.length ? p.points[0][0] : p.x;
    const az = p.shape === 'ribbon' && p.points?.length ? p.points[0][1] : p.z;
    const key = `${p.kind}:${cellKey(ax, az, 128)}`;
    const g = patchGeometry(p);
    if (!g) continue;
    let e = groups.get(key);
    if (!e) groups.set(key, (e = { kind: p.kind, geos: [] }));
    e.geos.push(g);
  }
  for (const [key, e] of groups) addMesh(scene, e.geos, patchMaterial(e.kind), `${name}:${key}`, 'cell');
}

// ---- Marks ----------------------------------------------------------------------------------------------------------

const TILES: readonly MarkTile[] = [
  'stripe', 'manhole', 'drain', 'oil', 'chalk', 'line', 'tag-a', 'tag-b', 'tag-c', 'tag-d', 'poster-a', 'poster-b', 'poster-c',
];
const ATLAS = 1024;
const T = 256;

function drawAtlas(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = ATLAS; cv.height = ATLAS;
  const g = cv.getContext('2d');
  if (!g) return null;
  const tags = ['EVEN CUT', 'LGL', 'MOW NO MORE', '404'];
  const tagCol = ['#ff4fa3', '#3be8ff', '#f2c94c', '#7de38b'];
  const posters = [['LOST: ONE HAT', 'last seen on a mower', '#d93636'], ['VOTE MULCH', 'for a greener grid', '#2f6e3a'], ['TURFTON FM', '404.0 all night long', '#3a7ab8']];
  TILES.forEach((tile, i) => {
    const x0 = (i % 4) * T, y0 = Math.floor(i / 4) * T;
    g.save();
    g.translate(x0, y0);
    g.beginPath(); g.rect(0, 0, T, T); g.clip();
    if (tile === 'stripe' || tile === 'line') {
      g.fillStyle = '#f4f1de'; g.fillRect(0, 0, T, T);
    } else if (tile === 'manhole') {
      g.fillStyle = '#3a3c3f'; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#575a5e'; g.lineWidth = 10; g.stroke();
      g.lineWidth = 6;
      for (let k = -100; k <= 100; k += 25) { g.beginPath(); g.moveTo(28, 128 + k); g.lineTo(228, 128 + k); g.stroke(); g.beginPath(); g.moveTo(128 + k, 28); g.lineTo(128 + k, 228); g.stroke(); }
    } else if (tile === 'drain') {
      g.fillStyle = '#26282a'; g.fillRect(8, 64, 240, 128);
      g.fillStyle = '#4a4d50';
      for (let k = 20; k < 240; k += 24) g.fillRect(k, 72, 10, 112);
    } else if (tile === 'oil') {
      g.fillStyle = 'rgba(20,18,16,0.6)';
      for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(128 + Math.sin(k * 2.1) * 50, 128 + Math.cos(k * 1.7) * 40, 60 - k * 5, 40 - k * 3, k, 0, Math.PI * 2); g.fill(); }
    } else if (tile === 'chalk') {
      g.strokeStyle = '#f7c6e0'; g.lineWidth = 8; g.fillStyle = '#bfe3ff'; g.font = 'bold 40px sans-serif';
      for (let k = 0; k < 4; k++) { g.strokeRect(78, 8 + k * 60, 100, 56); g.fillText(String(k + 1), 116, 50 + k * 60); }
    } else if (tile.startsWith('tag-')) {
      const k = tile.charCodeAt(4) - 97;
      g.font = 'bold 64px Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 14; g.strokeStyle = '#1a1a1a'; g.strokeText(tags[k], 128, 128, 240);
      g.fillStyle = tagCol[k]; g.fillText(tags[k], 128, 128, 240);
    } else {
      const k = tile.charCodeAt(7) - 97;
      const [title, sub, col] = posters[k];
      g.fillStyle = '#f2ecd8'; g.fillRect(28, 8, 200, 240);
      g.fillStyle = col; g.fillRect(36, 16, 184, 90);
      g.fillStyle = '#ffffff'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(title, 128, 70, 176);
      g.fillStyle = '#333333'; g.font = '18px sans-serif'; g.fillText(sub, 128, 150, 180); g.fillText('- City Hall -', 128, 200, 180);
    }
    g.restore();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

let markMats: { flat: THREE.MeshStandardMaterial; up: THREE.MeshStandardMaterial } | null = null;
function markMaterials(): { flat: THREE.MeshStandardMaterial; up: THREE.MeshStandardMaterial } {
  if (markMats) return markMats;
  const map = drawAtlas();
  const make = (): THREE.MeshStandardMaterial => flatLayer(map
    ? new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.35, roughness: 0.9, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color: 0xf4f1de, roughness: 0.9 }), LAYER.decal);
  markMats = { flat: make(), up: make() };
  return markMats;
}

function markGeometry(m: Mark): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(m.w, m.h);
  // UVs into the tile (atlas v runs bottom-up; tile rows are counted from the top), inset 2 px.
  const i = Math.max(0, TILES.indexOf(m.tile));
  const inset = 2 / ATLAS;
  const u0 = (i % 4) / 4 + inset, u1 = ((i % 4) + 1) / 4 - inset;
  const v1 = 1 - Math.floor(i / 4) / 4 - inset, v0 = 1 - (Math.floor(i / 4) + 1) / 4 + inset;
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) < 0.5 ? u0 : u1, uv.getY(k) < 0.5 ? v0 : v1);
  if (!m.upright) g.rotateX(-Math.PI / 2);
  g.rotateY(m.yaw).translate(m.x, m.y, m.z);
  return clean(g);
}

/** Marks from one atlas texture, merged per 64 m cell (LAYER.decal), each cell registered with the culler. */
export function buildMarks(scene: THREE.Scene, marks: readonly Mark[], name: string): void {
  const mats = markMaterials();
  const groups = new Map<string, THREE.BufferGeometry[]>();
  for (const m of marks) {
    const key = `${m.upright ? 'up' : 'flat'}:${cellKey(m.x, m.z, 64)}`;
    let list = groups.get(key);
    if (!list) groups.set(key, (list = []));
    list.push(markGeometry(m));
  }
  for (const [key, geos] of groups) addMesh(scene, geos, key.startsWith('up') ? mats.up : mats.flat, `${name}:${key}`, 'detail');
}

// ---- Cables -------------------------------------------------------------------------------------------------------

let cableMat: THREE.MeshStandardMaterial | null = null;
const SEGMENTS = 6;

/** Sagging cables as thin boxes, merged per 128 m cell, each cell registered with the culler. */
export function buildCables(scene: THREE.Scene, cables: readonly Cable[], name: string): void {
  cableMat ??= new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
  const groups = new Map<string, THREE.BufferGeometry[]>();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), dir = new THREE.Vector3(), mid = new THREE.Vector3();
  const q = new THREE.Quaternion(), mtx = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), Z = new THREE.Vector3(0, 0, 1);
  const at = (c: Cable, t: number, out: THREE.Vector3): THREE.Vector3 =>
    out.set(c.ax + (c.bx - c.ax) * t, c.ay + (c.by - c.ay) * t - c.sag * 4 * t * (1 - t), c.az + (c.bz - c.az) * t);
  for (const c of cables) {
    const key = cellKey(c.ax, c.az, 128);
    let list = groups.get(key);
    if (!list) groups.set(key, (list = []));
    for (let k = 0; k < SEGMENTS; k++) {
      at(c, k / SEGMENTS, a);
      at(c, (k + 1) / SEGMENTS, b);
      dir.subVectors(b, a);
      const len = dir.length();
      if (len < 1e-4) continue;
      q.setFromUnitVectors(Z, dir.normalize());
      mid.addVectors(a, b).multiplyScalar(0.5);
      mtx.compose(mid, q, one);
      list.push(clean(new THREE.BoxGeometry(0.05, 0.05, len).applyMatrix4(mtx)));
    }
  }
  for (const [key, geos] of groups) addMesh(scene, geos, cableMat, `${name}:${key}`, 'prop', false);
}
