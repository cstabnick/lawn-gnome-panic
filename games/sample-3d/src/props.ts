import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildPrefab } from '@lawn/prefabs';
import type { Obstacle } from './config';
import { heightAt } from './terrain';

// Each prop is built from primitives that are transformed into place and merged into one mesh per
// material. Materials are shared module-wide, so the whole yard uses only a few dozen of them.

const IDENTITY = new THREE.Matrix4();

interface MatOpts {
  metalness?: number;
  roughness?: number;
  flat?: boolean;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

/** Shared material per (colour, finish). */
function mat(color: number, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = [color, o.metalness ?? 0, o.roughness ?? 1, o.flat ? 1 : 0, o.transparent ? 1 : 0, o.opacity ?? 1, o.side ?? THREE.FrontSide].join('|');
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      metalness: o.metalness ?? 0,
      roughness: o.roughness ?? 1,
      flatShading: o.flat ?? false,
      transparent: o.transparent ?? false,
      opacity: o.opacity ?? 1,
      depthWrite: !(o.transparent ?? false),
      side: o.side ?? THREE.FrontSide,
    });
    matCache.set(key, m);
  }
  return m;
}

/** Position, Euler rotation (XYZ) and scale as one matrix: scale first, then rotate, then move. */
function xf(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1): THREE.Matrix4 {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
}

/** Collects primitives for one prop and merges them into one mesh per material. */
class Kit {
  readonly root = new THREE.Group();
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();

  constructor(o: Obstacle) {
    // Sunk slightly so slopes do not show a gap under one side.
    // Sunk 0.15 so slopes show no gap underneath, and stretched by the same amount so the walkable top stays at heightAt + o.height.
    this.root.position.set(o.x, heightAt(o.x, o.z) - 0.15, o.z);
    this.root.scale.y = (o.height + 0.15) / o.height;
  }

  /** Takes ownership of `geo`, places it with `m`, and queues it under `material`. */
  add(geo: THREE.BufferGeometry, material: THREE.Material, m: THREE.Matrix4 = IDENTITY): void {
    geo.applyMatrix4(m);
    const flat = geo.index ? geo.toNonIndexed() : geo; // mergeGeometries needs matching (non-indexed) layouts
    if (flat !== geo) geo.dispose();
    const list = this.parts.get(material);
    if (list) list.push(flat);
    else this.parts.set(material, [flat]);
  }

  build(): THREE.Group {
    for (const [material, geos] of this.parts) {
      const merged = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
    }
    this.parts.clear();
    return this.root;
  }
}

const PREFAB_PROPS: Partial<Record<Obstacle['kind'], string>> = {
  stump: 'tree-stump',
  rock: 'garden-rock',
  birdbath: 'birdbath',
  flowerpot: 'flower-pot',
  bucket: 'tin-pail',
  statue: 'gnome-statue',
  wateringCan: 'watering-can',
  brick: 'brick-stack',
  bush: 'flowering-bush',
  tumbleweed: 'tumbleweed',
};

/** Prefab size (from its bounding box) per id, measured once: prefabs are gnome-scale and must be fitted to the yard's collision cylinders. */
const prefabSize = new Map<string, THREE.Vector3>();

/** A prefab placed on its obstacle like a Kit prop: sunk 0.15 into the terrain, its top at heightAt + o.height, and its footprint filling the collision cylinder. */
function prefabProp(id: string, o: Obstacle, tint?: number): THREE.Group {
  const model = buildPrefab(id, { tint });
  let size = prefabSize.get(id);
  if (!size) {
    size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    prefabSize.set(id, size);
  }
  // Height sets the scale (the walkable top must match the collider); the footprint may widen toward
  // the collision cylinder, but at most 1.5x, so pots and rocks do not flatten into saucers.
  const tall = (o.height + 0.15) / Math.max(size.y, 1e-3);
  const fill = (o.radius * 2) / Math.max(size.x, size.z, 1e-3);
  const across = Math.min(Math.max(fill, tall), tall * 1.5);
  model.scale.set(across, tall, across);
  const root = new THREE.Group();
  root.position.set(o.x, heightAt(o.x, o.z) - 0.15, o.z);
  root.add(model);
  return root;
}

const PETALS = [0xff5d8f, 0xffd54f, 0xffffff, 0xb388ff] as const;

/** A stable hash of an obstacle's position, so a flower keeps its colour from build to build. */
function positionHash(o: Obstacle): number {
  return Math.abs(Math.imul(Math.round(o.x * 10), 73856093) ^ Math.imul(Math.round(o.z * 10), 19349663));
}

/** The mesh for one obstacle, positioned on the terrain at (o.x, heightAt(o.x, o.z) - 0.15, o.z). Collision is the cylinder in `o`; the mesh may be any shape that roughly fills it. */
export function buildProp(o: Obstacle): THREE.Object3D {
  if (o.kind === 'cactus') return prefabProp(o.height > 12 ? 'saguaro' : 'barrel-cactus', o);
  if (o.kind === 'flower') return prefabProp('giant-flower', o, PETALS[positionHash(o) % PETALS.length]);
  const prefabId = PREFAB_PROPS[o.kind];
  if (prefabId) return prefabProp(prefabId, o);
  const k = new Kit(o);
  switch (o.kind) {
    case 'pool': pool(k, o); break;
    case 'tree': tree(k, o); break;
  }
  return k.build();
}

function pool(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const rim = r - 0.6;
  const yellow = mat(0xffd54f);
  k.add(new THREE.CylinderGeometry(r, r, h, 32, 1, true), mat(0xbfe9ff, { side: THREE.DoubleSide }), xf(0, h / 2, 0));
  k.add(new THREE.TorusGeometry(rim, 0.6, 10, 40), mat(0x2f8fe0), xf(0, h, 0, Math.PI / 2));
  k.add(new THREE.CylinderGeometry(rim, rim, 0.05, 32), mat(0x7fd6ff, { transparent: true, opacity: 0.85 }), xf(0, h - 0.2, 0));
  // Rubber duck, half sunk.
  const dx = r * 0.35;
  const dz = r * 0.2;
  k.add(new THREE.SphereGeometry(0.45, 12, 10), yellow, xf(dx, h - 0.1, dz));
  k.add(new THREE.SphereGeometry(0.25, 10, 8), yellow, xf(dx + 0.3, h + 0.15, dz));
  k.add(new THREE.ConeGeometry(0.12, 0.3, 6), mat(0xff9800), xf(dx + 0.6, h + 0.15, dz, 0, 0, -Math.PI / 2));
  // Beach ball: three coloured longitudinal bands.
  const bx = -r * 0.35;
  const bz = -r * 0.25;
  const bandColors = [0xff5d8f, 0xffffff, 0x4fc3f7];
  for (let i = 0; i < 3; i++) {
    k.add(new THREE.SphereGeometry(0.5, 16, 10, (i * Math.PI * 2) / 3, (Math.PI * 2) / 3), mat(bandColors[i]), xf(bx, h, bz));
  }
}

function tree(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const bark = mat(0x6d4c41);
  const trunkH = h * 0.55;
  k.add(new THREE.CylinderGeometry(r * 0.8, r, trunkH, 16), bark, xf(0, trunkH / 2, 0));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    k.add(new THREE.SphereGeometry(r * 0.45, 8, 6), bark, xf(Math.cos(a) * r * 0.9, r * 0.1, Math.sin(a) * r * 0.9, 0, 0, 0, 1, 0.7, 1));
  }
  const dark = mat(0x2e7d32);
  const light = mat(0x388e3c);
  const R = r * 3.5;
  k.add(new THREE.SphereGeometry(R, 16, 12), dark, xf(0, h * 0.78, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const y = h * (0.55 + 0.08 * ((i * 3) % 5)); // between 0.55h and 0.87h
    k.add(new THREE.SphereGeometry(R * 0.85, 14, 10), i % 2 ? light : dark, xf(Math.cos(a) * r * 1.6, y, Math.sin(a) * r * 1.6));
  }
}
