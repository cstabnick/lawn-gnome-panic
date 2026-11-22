// Turns prefab data into Three.js meshes. Static parts (those without a `name` or `group`) are pre-baked into
// vertex-colored merged geometries per (glow, alpha) render bucket and cached per (prefab, tint, trim), cutting
// draw calls from 10-30 per prefab down to 1-2. Named/articulated parts stay as individual meshes/pivot groups.
// Never dispose a prefab's meshes from a game: geometries and materials are cached and shared.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { colorOf, type Swatch } from './palette';
import type { BuildOptions, Part, PrefabDef, Vec3 } from './types';
import { allPrefabs, getPrefab } from './registry';
import { blendToSoot, damagedDef, darkenOf, prefabDamageLevels } from './damage';
import { modeDef } from './modes';

const DEG = Math.PI / 180;
const geoCache = new Map<string, THREE.BufferGeometry>();
const matCache = new Map<string, THREE.Material>();
const bakedMatCache = new Map<string, THREE.Material>();

const _pos = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'XYZ');
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _color = new THREE.Color();

export interface BakedBucket {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  glow: boolean;
  alpha: number;
  isTint: boolean;
}

export interface PrefabTemplate {
  buckets: readonly BakedBucket[];
  dynamicParts: readonly Part[];
}

interface DefCache {
  usesStaticTint: boolean;
  usesStaticTrim: boolean;
  variants: Map<string, PrefabTemplate>;
}

const templateCache = new WeakMap<PrefabDef, DefCache>();

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
      : new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
    if (alpha < 1) {
      mat.transparent = true;
      mat.opacity = alpha;
      mat.depthWrite = false;
    }
    matCache.set(key, mat);
  }
  return mat;
}

/** Shared vertex-colored material for baked prefab geometry buckets. */
export function bakedMaterial(glow: boolean, alpha: number): THREE.Material {
  const key = `${glow}:${alpha}`;
  let mat = bakedMatCache.get(key);
  if (!mat) {
    mat = glow
      ? new THREE.MeshBasicMaterial({ vertexColors: true })
      : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 });
    if (alpha < 1) {
      mat.transparent = true;
      mat.opacity = alpha;
      mat.depthWrite = false;
    }
    bakedMatCache.set(key, mat);
  }
  return mat;
}

function isStaticPart(p: Part): boolean {
  return !p.name && !p.group;
}

/** Clones a part's primitive geometry, strips unused attributes, applies its local transform, and bakes vertex color. */
function bakePartGeometry(p: Part, colorHex: number, mirrored: boolean): THREE.BufferGeometry {
  const src = geometry(p);
  const g = src.index ? src.toNonIndexed() : src.clone();

  // Keep only position and normal so all primitive types merge cleanly and skip unused UV memory.
  for (const attr of Object.keys(g.attributes)) {
    if (attr !== 'position' && attr !== 'normal') g.deleteAttribute(attr);
  }
  if (!g.getAttribute('normal')) g.computeVertexNormals();

  const [x, y, z] = p.at ?? [0, 0, 0];
  const [rx, ry, rz] = p.rot ?? [0, 0, 0];
  _pos.set(mirrored ? -x : x, y, z);
  _euler.set(rx * DEG, (mirrored ? -ry : ry) * DEG, (mirrored ? -rz : rz) * DEG, 'XYZ');
  _quat.setFromEuler(_euler);
  if (p.scale) _scale.set(p.scale[0], p.scale[1], p.scale[2]);
  else _scale.set(1, 1, 1);
  _mat4.compose(_pos, _quat, _scale);
  g.applyMatrix4(_mat4);

  _color.setHex(colorHex);
  if (p.glow) _color.multiplyScalar(1.15);
  const count = g.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  const r = _color.r;
  const gr = _color.g;
  const b = _color.b;
  for (let i = 0; i < count; i++) {
    const o = i * 3;
    colors[o] = r;
    colors[o + 1] = gr;
    colors[o + 2] = b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

/** Resolves tint/trim defaults for a prefab definition and build options. */
export function resolveTintTrim(def: PrefabDef, opts: Pick<BuildOptions, 'tint' | 'trim'> = {}): { tintHex: number; trimHex: number } {
  const tint: Swatch | number = opts.tint ?? def.tint ?? 'white';
  const trim: Swatch | number = opts.trim ?? def.trim ?? 'wood-dark';
  const soot = darkenOf(def);
  return { tintHex: blendToSoot(colorOf(tint), soot), trimHex: blendToSoot(colorOf(trim), soot) };
}

/** Compiles (or fetches from cache) the baked static geometry buckets and dynamic parts for a prefab variant. */
export function getPrefabTemplate(def: PrefabDef, tintHex: number, trimHex: number, separateTint = false): PrefabTemplate {
  let entry = templateCache.get(def);
  if (!entry) {
    let usesStaticTint = false;
    let usesStaticTrim = false;
    for (const p of def.parts) {
      if (!isStaticPart(p)) continue;
      if (p.c === 'tint') usesStaticTint = true;
      else if (p.c === 'trim') usesStaticTrim = true;
    }
    entry = { usesStaticTint, usesStaticTrim, variants: new Map() };
    templateCache.set(def, entry);
  }

  const key = `${entry.usesStaticTint && !separateTint ? tintHex : ''}:${entry.usesStaticTrim ? trimHex : ''}:${separateTint ? 'sep' : ''}`;
  const cached = entry.variants.get(key);
  if (cached) return cached;

  const bucketGeos = new Map<string, { glow: boolean; alpha: number; isTint: boolean; geos: THREE.BufferGeometry[] }>();
  const dynamicParts: Part[] = [];

  for (const p of def.parts) {
    if (!isStaticPart(p)) {
      dynamicParts.push(p);
      continue;
    }
    const isTint = separateTint && p.c === 'tint';
    const color = isTint ? 0xffffff : p.c === 'tint' ? tintHex : p.c === 'trim' ? trimHex : colorOf(p.c);
    const glow = !!p.glow;
    const alpha = p.alpha ?? (p.c === 'glass' ? 0.35 : 1);
    const bKey = `${glow}:${alpha}:${isTint}`;
    let bucket = bucketGeos.get(bKey);
    if (!bucket) {
      bucket = { glow, alpha, isTint, geos: [] };
      bucketGeos.set(bKey, bucket);
    }
    bucket.geos.push(bakePartGeometry(p, color, false));
    if (p.mirror) bucket.geos.push(bakePartGeometry(p, color, true));
  }

  const buckets: BakedBucket[] = [];
  for (const { glow, alpha, isTint, geos } of bucketGeos.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!merged) throw new Error(`Failed to merge prefab geometry for ${def.id}`);
    if (geos.length > 1) {
      for (const g of geos) g.dispose();
    }
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    buckets.push({
      geometry: merged,
      material: bakedMaterial(glow, alpha),
      glow,
      alpha,
      isTint,
    });
  }

  const template: PrefabTemplate = { buckets, dynamicParts };
  entry.variants.set(key, template);
  return template;
}

function addPart(
  parent: THREE.Object3D,
  p: Part,
  color: number,
  mirrored: boolean,
  shadows: boolean,
  offset: Vec3 = [0, 0, 0],
): void {
  const alpha = p.alpha ?? (p.c === 'glass' ? 0.35 : 1);
  const m = new THREE.Mesh(geometry(p), material(color, !!p.glow, alpha));
  if (alpha < 1) m.renderOrder = 1; // after the opaque liquid inside it
  if (p.c === 'tint') m.userData.tint = true;
  if (p.name) {
    m.name = mirrored ? `${p.name}-mirror` : p.name;
    m.userData.part = p.name;
  }
  const [x, y, z] = p.at ?? [0, 0, 0];
  const [rx, ry, rz] = p.rot ?? [0, 0, 0];
  m.position.set((mirrored ? -x : x) - offset[0], y - offset[1], z - offset[2]);
  m.rotation.set(rx * DEG, (mirrored ? -ry : ry) * DEG, (mirrored ? -rz : rz) * DEG);
  if (p.scale) m.scale.set(p.scale[0], p.scale[1], p.scale[2]);
  m.castShadow = shadows && !p.glow;
  m.receiveShadow = shadows;
  parent.add(m);
}

/** Attaches named/pivoted parts of a prefab onto `root`. Shared by `buildPrefab` and static batching. */
export function attachDynamicParts(
  root: THREE.Group,
  def: PrefabDef,
  dynamicParts: readonly Part[],
  tintHex: number,
  trimHex: number,
  shadows: boolean,
): void {
  const groups = new Map<string, { node: THREE.Group; offset: Vec3 }>();
  for (const [name, pos] of Object.entries(def.pivots ?? {})) {
    const g = new THREE.Group();
    g.name = name;
    g.userData.part = name;
    g.position.set(pos[0], pos[1], pos[2]);
    root.add(g);
    groups.set(name, { node: g, offset: pos });
  }
  for (const p of dynamicParts) {
    const color = p.c === 'tint' ? tintHex : p.c === 'trim' ? trimHex : colorOf(p.c);
    let parent: THREE.Object3D = root;
    let offset: Vec3 = [0, 0, 0];
    if (p.group) {
      let entry = groups.get(p.group);
      if (!entry) {
        const g = new THREE.Group();
        g.name = p.group;
        g.userData.part = p.group;
        root.add(g);
        entry = { node: g, offset: [0, 0, 0] };
        groups.set(p.group, entry);
      }
      parent = entry.node;
      offset = entry.offset;
    }
    addPart(parent, p, color, false, shadows, offset);
    if (p.mirror) addPart(parent, p, color, true, shadows, offset);
  }
}

export interface InternalBuildOptions extends BuildOptions {
  /** Keep 'tint' parts in their own bucket marked `userData.tint = true` (used by `buildPrefabInstances`). */
  separateTint?: boolean;
}

/** Fills an (empty) root with the meshes and lights of `def`. Shared by buildPrefab and setPrefabDamage. */
function fillPrefab(root: THREE.Group, def: PrefabDef, opts: InternalBuildOptions): void {
  const { tintHex, trimHex } = resolveTintTrim(def, opts);
  const shadows = opts.shadows ?? true;
  const template = getPrefabTemplate(def, tintHex, trimHex, !!opts.separateTint);

  for (const bucket of template.buckets) {
    const m = new THREE.Mesh(bucket.geometry, bucket.material);
    if (bucket.alpha < 1) m.renderOrder = 1;
    if (bucket.isTint) m.userData.tint = true;
    m.castShadow = shadows && !bucket.glow;
    m.receiveShadow = shadows;
    root.add(m);
  }

  if (template.dynamicParts.length > 0 || (def.pivots && Object.keys(def.pivots).length > 0)) {
    attachDynamicParts(root, def, template.dynamicParts, tintHex, trimHex, shadows);
  }

  if (opts.lights ?? true) {
    for (const l of def.lights ?? []) {
      const light = new THREE.PointLight(colorOf(l.c), l.intensity, l.distance, 1);
      light.position.set(l.at[0], l.at[1], l.at[2]);
      root.add(light);
    }
  }
}

/** Build a prefab by id or from a def. Throws on an unknown id. The group's userData.prefab is the id. */
export function buildPrefab(idOrDef: string | PrefabDef, opts: InternalBuildOptions = {}): THREE.Group {
  const base = typeof idOrDef === 'string' ? getPrefab(idOrDef) : idOrDef;
  if (!base) throw new Error(`Unknown prefab: ${String(idOrDef)}`);
  const level = Math.max(0, Math.min(prefabDamageLevels(base), Math.floor(opts.damage ?? 0)));
  const root = new THREE.Group();
  root.name = base.id;
  root.userData.prefab = base.id;
  root.userData.damage = level;
  // Remembered so setPrefabDamage can rebuild the same look at another level.
  root.userData.buildOpts = { tint: opts.tint, trim: opts.trim, shadows: opts.shadows, lights: opts.lights, separateTint: opts.separateTint, mode: opts.mode };
  fillPrefab(root, damagedDef(modeDef(base, opts.mode), level), opts);
  if (opts.scale && opts.scale !== 1) root.scale.setScalar(opts.scale);
  return root;
}

/**
 * Change the damage level of a prefab built by `buildPrefab`, in place: same root, same position and scale, new meshes.
 * The old child meshes are dropped (their geometry and materials are shared, so nothing is disposed) and the named pivots
 * (`wheel-0`, `steer`, ...) are NEW objects: look them up again afterwards. Returns the level applied (clamped to the stages).
 */
export function setPrefabDamage(root: THREE.Group, level: number): number {
  const id = root.userData.prefab as string | undefined;
  const base = id ? getPrefab(id) : undefined;
  if (!base) throw new Error('setPrefabDamage: not a prefab root');
  const lv = Math.max(0, Math.min(prefabDamageLevels(base), Math.floor(level)));
  if (lv === (root.userData.damage as number)) return lv;
  for (const child of [...root.children]) root.remove(child);
  const opts = (root.userData.buildOpts ?? {}) as InternalBuildOptions;
  fillPrefab(root, damagedDef(modeDef(base, opts.mode), lv), opts);
  root.userData.damage = lv;
  return lv;
}

/**
 * Build a prefab for a hand: the result is offset so the prefab's grip sits at the returned group's origin.
 * Add it to a hand or arm pivot and rotate that. Prefabs without a grip are held by their centre.
 */
export function buildHeld(idOrDef: string | PrefabDef, opts: BuildOptions = {}): THREE.Group {
  const def = typeof idOrDef === 'string' ? getPrefab(idOrDef) : idOrDef;
  if (!def) throw new Error(`Unknown prefab: ${String(idOrDef)}`);
  const id = def.id;
  const inner = buildPrefab(def, { ...opts, scale: 1 });
  const g = def.grip ?? centreOf(inner);
  inner.position.set(-g[0], -g[1], -g[2]);
  const holder = new THREE.Group();
  holder.name = `${id}:held`;
  holder.add(inner);
  if (opts.scale && opts.scale !== 1) holder.scale.setScalar(opts.scale);
  return holder;
}

export interface PrewarmOptions {
  /** Optional WebGLRenderer to pre-compile shared prefab shaders up front. */
  renderer?: THREE.WebGLRenderer;
  /** Optional scene camera for shader compilation. */
  camera?: THREE.Camera;
}

/**
 * Pre-bakes and caches prefab geometries up front so mid-game spawns (drops, gear swaps, room entries) have
 * near-zero CPU cost. When `renderer` is passed, also pre-compiles the shared vertex-colored prefab shaders.
 */
export function prewarmPrefabs(ids?: readonly string[], opts: PrewarmOptions = {}): void {
  const list = ids ? ids.map((id) => getPrefab(id)).filter((d): d is PrefabDef => !!d) : allPrefabs();
  for (const def of list) {
    const { tintHex, trimHex } = resolveTintTrim(def);
    getPrefabTemplate(def, tintHex, trimHex);
  }
  if (opts.renderer) {
    const dummyScene = new THREE.Scene();
    dummyScene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
    tri.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
    tri.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3));
    for (const [glow, alpha] of [[false, 1], [true, 1], [false, 0.35]] as const) {
      dummyScene.add(new THREE.Mesh(tri, bakedMaterial(glow, alpha)));
    }
    const cam = opts.camera ?? new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    opts.renderer.compile(dummyScene, cam);
    tri.dispose();
  }
}

function centreOf(obj: THREE.Object3D): [number, number, number] {
  const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
  return [c.x, c.y, c.z];
}
