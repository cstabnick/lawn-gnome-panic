// Shared building kit for the coast's decks (FX11 split it out of boardwalk.ts): merged-geometry bins per material and
// per 60 m chunk, plank textures, railings, deck slabs, and prefab placement helpers. Used by boardwalk.ts, pier.ts,
// stalls.ts and promenade.ts.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPrefab, getPrefab } from '@lawn/prefabs';
import type { Box } from '../types';
import { heightAt } from '../terrain';
import { placeOnGround } from '../terrainMesh';
import { waterBedAt } from '../water';
import { coastSign, type CoastSignOpts } from './sign';

export const CHUNK = 60;
export const DECK_THICK = 0.3;
export const PIER_THICK = 0.4;

/**
 * Planks painted across a slab: `n` boards of two wood tones with a dark seam, along u (stripes = x on a box's top face)
 * or along v (stripes = z). Null without a DOM (tests), then the slab is plain wood.
 */
export function plankTexture(n: number, a: number, b: number, alongV: boolean): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = alongV ? 8 : 1024;
  c.height = alongV ? 1024 : 8;
  const g = c.getContext('2d');
  if (!g) return null;
  const hex = (v: number): string => '#' + v.toString(16).padStart(6, '0');
  const step = 1024 / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = hex(i % 2 === 0 ? a : b);
    if (alongV) g.fillRect(0, i * step, 8, step); else g.fillRect(i * step, 0, step, 8);
    g.fillStyle = '#3b2a1a';
    if (alongV) g.fillRect(0, i * step, 8, Math.max(1, step * 0.06)); else g.fillRect(i * step, 0, Math.max(1, step * 0.06), 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const deckMat = (n: number, a: number, b: number, alongV: boolean): THREE.MeshStandardMaterial => {
  const map = plankTexture(n, a, b, alongV);
  return map ? new THREE.MeshStandardMaterial({ map, roughness: 0.92 }) : new THREE.MeshStandardMaterial({ color: a, roughness: 0.92 });
};

/** Materials by key; a Bins key must be one of these. Modules may add their own keys at import time (MATS.key = ...). */
export const MATS: Record<string, THREE.Material> = {
  woodA: deckMat(25, 0x9c7248, 0x86603a, false),
  pierWoodZ: deckMat(25, 0x8f6b45, 0x7c5a38, true),
  woodB: new THREE.MeshStandardMaterial({ color: 0x86603a, roughness: 0.92 }),
  rail: new THREE.MeshStandardMaterial({ color: 0xe6dcc6, roughness: 0.85 }),
  step: new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.95 }),
  skirt: new THREE.MeshStandardMaterial({ color: 0x4f3a27, roughness: 0.95 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x7f8a94, roughness: 0.4, metalness: 0.6 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xc3ced6, roughness: 0.25, metalness: 0.7 }),
  pierWood: deckMat(22, 0x8f6b45, 0x7c5a38, false),
  pierWoodB: new THREE.MeshStandardMaterial({ color: 0x7c5a38, roughness: 0.92 }),
};

/** Merged-geometry bins: material key + chunk -> geometries. */
export class Bins {
  private readonly bins = new Map<string, THREE.BufferGeometry[]>();

  add(mat: string, geo: THREE.BufferGeometry, x: number): void {
    const key = `${mat}|${Math.floor((x + 210) / CHUNK)}`;
    const list = this.bins.get(key);
    if (list) list.push(geo); else this.bins.set(key, [geo]);
  }

  /** An axis-aligned box from min to max corners. */
  box(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(mat, g, (x0 + x1) / 2);
  }

  /** A box run along x, cut at chunk boundaries so each piece lands in one chunk. */
  boxRunX(mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    let a = x0;
    while (a < x1 - 1e-6) {
      const edge = (Math.floor((a + 210) / CHUNK + 1e-9) + 1) * CHUNK - 210;
      const b = Math.min(x1, edge);
      this.box(mat, a, b, y0, y1, z0, z1);
      a = b;
    }
  }

  flush(scene: THREE.Scene): void {
    for (const [key, geos] of this.bins) {
      const mesh = new THREE.Mesh(mergeGeometries(geos), MATS[key.split('|')[0]]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = 'boardwalk-' + key;
      scene.add(mesh);
    }
    this.bins.clear();
  }
}

export function shadowed<T extends THREE.Object3D>(g: T): T {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  return g;
}

/** A prefab on the ground at (x, z) (plus lift), turned to yaw and scaled; null when the id is missing. */
export function place(scene: THREE.Scene, id: string, x: number, z: number, yaw: number, scale: number, lift = 0, tint?: number): THREE.Group | null {
  if (!getPrefab(id)) return null;
  const obj = buildPrefab(id, { lights: false, scale, ...(tint !== undefined ? { tint } : {}) });
  obj.rotation.y = yaw;
  placeOnGround(obj, x, z, lift);
  scene.add(shadowed(obj));
  return obj;
}

/** A prefab at an absolute height y (a deck), turned to yaw and scaled; null when the id is missing. */
export function placeAt(scene: THREE.Scene, id: string, x: number, y: number, z: number, yaw: number, scale: number, tint?: number): THREE.Group | null {
  if (!getPrefab(id)) return null;
  const obj = buildPrefab(id, { lights: false, scale, ...(tint !== undefined ? { tint } : {}) });
  obj.rotation.y = yaw;
  obj.position.set(x, y, z);
  scene.add(shadowed(obj));
  return obj;
}

/** A solid collider from a placed object's world bounds. */
export function solid(boxes: Box[], obj: THREE.Object3D | null): void {
  if (!obj) return;
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj);
  boxes.push({ minX: b.min.x, maxX: b.max.x, minZ: b.min.z, maxZ: b.max.z, h: b.max.y });
}

/** A painted sign standing at (x, y, z) facing yaw (0 = south, PI = north, -PI/2 = west). */
export function signAt(scene: THREE.Scene, text: string, x: number, y: number, z: number, yaw: number, opts: CoastSignOpts): THREE.Group {
  const s = coastSign(text, opts);
  s.position.set(x, y, z);
  s.rotation.y = yaw;
  scene.add(s);
  return s;
}

/**
 * A railing along a straight line at world height `baseY`: top and mid rail (merged) and posts every ~3 m. Pushes one
 * collider (the line's bounds, 0.5 m thick) with top `h`. `mat` is the Bins material key (default 'rail').
 */
export function railLine(bins: Bins, boxes: Box[], ax: number, az: number, bx: number, bz: number, baseY: number, h: number, colliderTop: number, mat = 'rail'): void {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return;
  const yaw = -Math.atan2(dz, dx);
  const pieces = Math.max(1, Math.ceil(len / 30));
  for (let i = 0; i < pieces; i++) {
    const t0 = i / pieces, t1 = (i + 1) / pieces;
    const l = len / pieces;
    const mx = ax + dx * (t0 + t1) / 2, mz = az + dz * (t0 + t1) / 2;
    for (const [fy, th] of [[h - 0.05, 0.1], [h * 0.5, 0.08]] as const) {
      bins.add(mat, new THREE.BoxGeometry(l, th, 0.1).rotateY(yaw).translate(mx, baseY + fy, mz), mx);
    }
  }
  const posts = Math.max(1, Math.ceil(len / 3));
  for (let i = 0; i <= posts; i++) {
    const px = ax + (dx * i) / posts, pz = az + (dz * i) / posts;
    // The post sinks 5 cm into the deck so its foot never shares the deck's top plane.
    bins.add(mat, new THREE.BoxGeometry(0.14, h + 0.05, 0.14).translate(px, baseY + h / 2 - 0.025, pz), px);
  }
  boxes.push({
    minX: Math.min(ax, bx) - 0.25, maxX: Math.max(ax, bx) + 0.25,
    minZ: Math.min(az, bz) - 0.25, maxZ: Math.max(az, bz) + 0.25, h: colliderTop,
  });
}

/**
 * A plank deck from a0 to a1 along `axis` (x or z), b0..b1 across it, top at `top`: one slab per 30 m run, 3 cm apart
 * (touching boxes never share a face). The planks are painted on by the material's texture (plankTexture), not built as
 * separate boxes, so no plank face lies in another's plane.
 */
export function deckSlabs(
  bins: Bins, a0: number, a1: number, top: number, b0: number, b1: number,
  mat: string, axis: 'x' | 'z', thick = DECK_THICK,
): void {
  const runs = Math.max(1, Math.ceil((a1 - a0) / 30));
  const len = (a1 - a0) / runs;
  for (let r = 0; r < runs; r++) {
    const s0 = a0 + r * len + (r > 0 ? 0.015 : 0), s1 = a0 + (r + 1) * len - (r < runs - 1 ? 0.015 : 0);
    if (axis === 'x') bins.box(mat, s0, s1, top - thick, top, b0, b1);
    else bins.box(mat, b0, b1, top - thick, top, s0, s1);
  }
}

/** Seabed (or ground) height under (x, z). */
export function bedHeight(x: number, z: number): number {
  const bed = waterBedAt(x, z);
  return bed === null ? heightAt(x, z) : Math.min(bed, heightAt(x, z));
}
