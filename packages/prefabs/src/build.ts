// Turns prefab data into Three.js meshes. Geometries and materials are cached and shared, so a hundred
// identical swords cost one geometry per part. Never dispose them from a game: call nothing, let them live.
import * as THREE from 'three';
import { colorOf, type Swatch } from './palette';
import type { BuildOptions, Part, PrefabDef } from './types';
import { getPrefab } from './registry';

const DEG = Math.PI / 180;
const geoCache = new Map<string, THREE.BufferGeometry>();
const matCache = new Map<string, THREE.Material>();

function wedgeGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-d / 2, 0);
  shape.lineTo(d / 2, 0);
  shape.lineTo(-d / 2, h);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  // Extruded along +z in the shape's x-y plane; turn it so height is y, depth is z, width is x.
  geo.rotateY(Math.PI / 2);
  geo.translate(-w / 2, -h / 2, 0);
  return geo;
}

function geometry(p: Part): THREE.BufferGeometry {
  const d = p.d;
  const key = `${p.s}:${d.join(',')}:${p.seg ?? ''}`;
  let geo = geoCache.get(key);
  if (geo) return geo;
  const seg = p.seg ?? 10;
  switch (p.s) {
    case 'box': geo = new THREE.BoxGeometry(d[0], d[1], d[2]); break;
    case 'cyl': geo = new THREE.CylinderGeometry(d[0], d[1], d[2], seg); break;
    case 'cone': geo = new THREE.ConeGeometry(d[0], d[1], seg); break;
    case 'ball': geo = new THREE.SphereGeometry(d[0], p.seg ?? 8, Math.max(4, Math.round((p.seg ?? 8) * 0.75))); break;
    case 'ring': geo = new THREE.TorusGeometry(d[0], d[1], 6, seg + 4, (d[2] ?? 360) * DEG); break;
    case 'pill': geo = new THREE.CapsuleGeometry(d[0], d[1], 3, seg); break;
    case 'wedge': geo = wedgeGeometry(d[0], d[1], d[2]); break;
  }
  geoCache.set(key, geo);
  return geo;
}

function material(color: number, glow: boolean, alpha: number): THREE.Material {
  const key = `${color}:${glow}:${alpha}`;
  let mat = matCache.get(key);
  if (!mat) {
    mat = glow
      ? new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.15) })
      : new THREE.MeshLambertMaterial({ color, flatShading: true });
    if (alpha < 1) {
      mat.transparent = true;
      mat.opacity = alpha;
      mat.depthWrite = false;
    }
    matCache.set(key, mat);
  }
  return mat;
}

function addPart(root: THREE.Group, p: Part, color: number, mirrored: boolean, shadows: boolean): void {
  const alpha = p.alpha ?? (p.c === 'glass' ? 0.35 : 1);
  const m = new THREE.Mesh(geometry(p), material(color, !!p.glow, alpha));
  if (alpha < 1) m.renderOrder = 1; // after the opaque liquid inside it
  const [x, y, z] = p.at ?? [0, 0, 0];
  const [rx, ry, rz] = p.rot ?? [0, 0, 0];
  m.position.set(mirrored ? -x : x, y, z);
  m.rotation.set(rx * DEG, (mirrored ? -ry : ry) * DEG, (mirrored ? -rz : rz) * DEG);
  if (p.scale) m.scale.set(p.scale[0], p.scale[1], p.scale[2]);
  m.castShadow = shadows && !p.glow;
  m.receiveShadow = shadows;
  root.add(m);
}

/** Build a prefab by id or from a def. Throws on an unknown id. The group's userData.prefab is the id. */
export function buildPrefab(idOrDef: string | PrefabDef, opts: BuildOptions = {}): THREE.Group {
  const def = typeof idOrDef === 'string' ? getPrefab(idOrDef) : idOrDef;
  if (!def) throw new Error(`Unknown prefab: ${String(idOrDef)}`);
  const root = new THREE.Group();
  root.name = def.id;
  root.userData.prefab = def.id;
  const tint: Swatch | number = opts.tint ?? def.tint ?? 'white';
  const trim: Swatch | number = opts.trim ?? def.trim ?? 'wood-dark';
  const shadows = opts.shadows ?? true;
  for (const p of def.parts) {
    const color = colorOf(p.c === 'tint' ? tint : p.c === 'trim' ? trim : p.c);
    addPart(root, p, color, false, shadows);
    if (p.mirror) addPart(root, p, color, true, shadows);
  }
  if (opts.lights ?? true) {
    for (const l of def.lights ?? []) {
      const light = new THREE.PointLight(colorOf(l.c), l.intensity, l.distance, 1);
      light.position.set(l.at[0], l.at[1], l.at[2]);
      root.add(light);
    }
  }
  if (opts.scale && opts.scale !== 1) root.scale.setScalar(opts.scale);
  return root;
}

/**
 * Build a prefab for a hand: the result is offset so the prefab's grip sits at the returned group's origin.
 * Add it to a hand or arm pivot and rotate that. Prefabs without a grip are held by their centre.
 */
export function buildHeld(id: string, opts: BuildOptions = {}): THREE.Group {
  const def = getPrefab(id);
  if (!def) throw new Error(`Unknown prefab: ${id}`);
  const inner = buildPrefab(def, { ...opts, scale: 1 });
  const g = def.grip ?? centreOf(inner);
  inner.position.set(-g[0], -g[1], -g[2]);
  const holder = new THREE.Group();
  holder.name = `${id}:held`;
  holder.add(inner);
  if (opts.scale && opts.scale !== 1) holder.scale.setScalar(opts.scale);
  return holder;
}

function centreOf(obj: THREE.Object3D): [number, number, number] {
  const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  return [c.x, c.y, c.z];
}
