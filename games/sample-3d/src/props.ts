import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { COLORS, type Obstacle } from './config';
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

/** The mesh for one obstacle, positioned on the terrain at (o.x, heightAt(o.x, o.z) - 0.15, o.z). Collision is the cylinder in `o`; the mesh may be any shape that roughly fills it. */
export function buildProp(o: Obstacle): THREE.Object3D {
  const k = new Kit(o);
  switch (o.kind) {
    case 'stump': stump(k, o); break;
    case 'rock': rock(k, o); break;
    case 'bush': bush(k, o); break;
    case 'birdbath': birdbath(k, o); break;
    case 'brick': brick(k, o); break;
    case 'flowerpot': flowerpot(k, o); break;
    case 'bucket': bucket(k, o); break;
    case 'pool': pool(k, o); break;
    case 'statue': statue(k, o); break;
    case 'flower': flower(k, o); break;
    case 'tree': tree(k, o); break;
    case 'wateringCan': wateringCan(k, o); break;
    case 'cactus': cactus(k, o); break;
    case 'tumbleweed': tumbleweed(k, o); break;
  }
  return k.build();
}

function stump(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  k.add(new THREE.CylinderGeometry(r, r * 1.15, h, 20), mat(COLORS.stump), xf(0, h / 2, 0));
  k.add(new THREE.CylinderGeometry(r, r, 0.02, 20), mat(0xc9a46a), xf(0, h + 0.01, 0));
  const ring = mat(0x9c7a48);
  for (let i = 1; i <= 3; i++) {
    k.add(new THREE.TorusGeometry(r * i * 0.22, r * 0.03, 6, 24), ring, xf(0, h + 0.02, 0, Math.PI / 2));
  }
}

function rock(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const stone = mat(COLORS.stone, { flat: true });
  // The dodecahedron's vertices reach 0.934 * radius from its centre, so this scale makes it span exactly 0..h.
  k.add(new THREE.DodecahedronGeometry(r), stone, xf(0, h / 2, 0, 0, 0, 0, 1, h / (2 * 0.934 * r), 1));
  const r2 = Math.min(r * 0.55, h * 0.45);
  k.add(new THREE.DodecahedronGeometry(r2), stone, xf(r * 0.8, r2 * 0.6, r * 0.2, 0.3, 0.5, 0.4));
}

function bush(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const dark = mat(COLORS.bush);
  const light = mat(0x3d8f3d);
  const cy = h - r * 0.85; // the main sphere's centre, so its top is at h
  k.add(new THREE.SphereGeometry(r * 0.85, 14, 10), dark, xf(0, cy, 0));
  k.add(new THREE.SphereGeometry(r * 0.6, 12, 8), dark, xf(r * 0.5, r * 0.6, r * 0.2));
  k.add(new THREE.SphereGeometry(r * 0.6, 12, 8), light, xf(-r * 0.45, r * 0.55, -r * 0.35));
  k.add(new THREE.SphereGeometry(r * 0.55, 12, 8), light, xf(r * 0.1, r * 0.5, -r * 0.55));
  k.add(new THREE.SphereGeometry(r * 0.5, 12, 8), dark, xf(-r * 0.2, r * 0.45, r * 0.55));
  // Flower dots on the upper surface of the main sphere.
  const pink = mat(0xff7eb6);
  const white = mat(0xffffff);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26 + 0.4;
    const e = 0.35 + 0.12 * i; // elevation above the equator
    const R = r * 0.85;
    const x = Math.cos(e) * Math.cos(a) * R;
    const y = cy + Math.sin(e) * R;
    const z = Math.cos(e) * Math.sin(a) * R;
    k.add(new THREE.SphereGeometry(0.12, 6, 5), i % 2 ? white : pink, xf(x, y, z));
  }
}

function birdbath(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const stone = mat(COLORS.stone);
  k.add(new THREE.CylinderGeometry(r * 0.25, r * 0.4, h * 0.9, 16), stone, xf(0, h * 0.45, 0));
  // Open-ended bowl, so the water disc inside stays visible from above.
  k.add(new THREE.CylinderGeometry(r, r * 0.6, h * 0.14, 24, 1, true), stone, xf(0, h * 0.93, 0));
  k.add(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.04, 24), mat(COLORS.water), xf(0, h - 0.06, 0));
  const bird = mat(0x6d4c41);
  k.add(new THREE.SphereGeometry(r * 0.22, 12, 8), bird, xf(r * 0.2, h + r * 0.2, 0));
  k.add(new THREE.SphereGeometry(r * 0.14, 10, 8), bird, xf(r * 0.34, h + r * 0.4, 0));
  k.add(new THREE.ConeGeometry(r * 0.05, r * 0.12, 6), bird, xf(r * 0.5, h + r * 0.4, 0, 0, 0, -Math.PI / 2));
}

function brick(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const clay = mat(0xa0522d);
  for (let i = 0; i < 3; i++) {
    k.add(new THREE.BoxGeometry(2 * r, h / 3, r), clay, xf(0, (h / 3) * (i + 0.5), 0, 0, i === 1 ? Math.PI / 12 : 0));
  }
}

function flowerpot(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const terracotta = mat(0xc8643b);
  const top = h * 0.92;
  k.add(new THREE.CylinderGeometry(r, r * 0.8, top, 20), terracotta, xf(0, top / 2, 0));
  k.add(new THREE.TorusGeometry(r, r * 0.08, 8, 20), terracotta, xf(0, top, 0, Math.PI / 2));
  k.add(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.04, 20), mat(0x3e2723), xf(0, top - 0.02, 0));
  const leaf = mat(0x43a047);
  const ch = r * 1.1;
  k.add(new THREE.ConeGeometry(r * 0.3, ch, 6), leaf, xf(0, top + ch / 2, 0));
  k.add(new THREE.ConeGeometry(r * 0.25, ch * 0.9, 6), leaf, xf(r * 0.25, top + ch * 0.45, 0, 0, 0, -0.5));
  k.add(new THREE.ConeGeometry(r * 0.25, ch * 0.9, 6), leaf, xf(-r * 0.25, top + ch * 0.45, 0, 0, 0, 0.5));
}

function bucket(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const metal = mat(0xa8b2b8, { metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide });
  k.add(new THREE.CylinderGeometry(r, r * 0.85, h, 24, 1, true), metal, xf(0, h / 2, 0));
  k.add(new THREE.CylinderGeometry(r * 0.85, r * 0.85, 0.04, 24), metal, xf(0, 0.02, 0));
  k.add(new THREE.TorusGeometry(r, r * 0.05, 8, 24), metal, xf(0, h, 0, Math.PI / 2));
  // Handle: the upper half of a ring in the plane through the axis, ends on the rim.
  k.add(new THREE.TorusGeometry(r, r * 0.05, 6, 16, Math.PI), metal, xf(0, h, 0));
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

let plaqueMat: THREE.MeshStandardMaterial | undefined;
/** Shared plaque material with a "COMING SOON" canvas texture. */
function plaqueMaterial(): THREE.MeshStandardMaterial {
  if (!plaqueMat) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const g = c.getContext('2d');
    if (g) {
      g.fillStyle = '#c9b77a';
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#3e2f1c';
      g.font = 'bold 64px Georgia, serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('COMING SOON', c.width / 2, c.height / 2 + 4);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    plaqueMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
  }
  return plaqueMat;
}

function statue(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const stone = mat(0xb0b0b0);
  const base = h * 0.12; // top of the plinth
  // The figure below is 1.55 units tall in its own units; scale it to fill the rest of o.height.
  const s = (h - base) / 1.55;
  const at = (y: number) => base + y * s;
  const side = Math.max(r * 1.6, 0.66 * s); // plinth width
  k.add(new THREE.BoxGeometry(side, base, side), stone, xf(0, base / 2, 0));
  k.add(new THREE.CylinderGeometry(0.22 * s, 0.28 * s, 0.6 * s, 12), stone, xf(0, at(0.3), 0));
  k.add(new THREE.SphereGeometry(0.2 * s, 12, 10), stone, xf(0, at(0.75), 0));
  k.add(new THREE.ConeGeometry(0.2 * s, 0.45 * s, 12), stone, xf(0, at(0.55), 0, Math.PI));
  k.add(new THREE.ConeGeometry(0.22 * s, 0.6 * s, 12), stone, xf(0, at(1.25), 0));
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(side * 0.7, base * 0.6), plaqueMaterial());
  plaque.position.set(0, base * 0.5, side / 2 + 0.01);
  plaque.receiveShadow = true;
  k.root.add(plaque);
}

const PETALS = [0xff5d8f, 0xffd54f, 0xffffff, 0xb388ff] as const;

function flower(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const green = mat(0x3c8d2f);
  k.add(new THREE.CylinderGeometry(r, r, h, 8), green, xf(0, h / 2, 0));
  k.add(new THREE.SphereGeometry(0.5, 10, 8), green, xf(-0.7, h * 0.35, 0, 0, 0, 0.35, 1.4, 0.2, 0.7));
  k.add(new THREE.SphereGeometry(0.5, 10, 8), green, xf(0.7, h * 0.3, 0, 0, 0, -0.35, 1.4, 0.2, 0.7));
  // The bloom: a stable colour per flower, from a hash of its position.
  const hash = Math.abs(Math.imul(Math.round(o.x * 10), 73856093) ^ Math.imul(Math.round(o.z * 10), 19349663));
  const petal = mat(PETALS[hash % PETALS.length]);
  const tilt = new THREE.Matrix4().makeRotationX(0.15);
  const bloom = (m: THREE.Matrix4) => new THREE.Matrix4().makeTranslation(0, h, 0).multiply(tilt).multiply(m);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    // Long axis (z) turned to point outward at angle a.
    k.add(new THREE.SphereGeometry(1.2, 10, 8), petal, bloom(xf(Math.cos(a), 0, Math.sin(a), 0, Math.PI / 2 - a, 0, 0.55, 0.2, 1.0)));
  }
  k.add(new THREE.SphereGeometry(0.6, 10, 8), mat(0xffd54f), bloom(xf(0, 0, 0)));
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

function wateringCan(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const green = mat(0x43a047);
  const bodyH = h * 0.8;
  k.add(new THREE.CylinderGeometry(r, r * 0.95, bodyH, 16), green, xf(0, bodyH / 2, 0));
  // Spout: 35 degrees above horizontal, leaving the lower side of the body.
  const a = (35 * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const spoutL = r * 1.6;
  const baseX = r * 0.9;
  const baseY = h * 0.3;
  const rz = -(Math.PI / 2 - a);
  k.add(new THREE.CylinderGeometry(r * 0.1, r * 0.08, spoutL, 8), green, xf(baseX + (dx * spoutL) / 2, baseY + (dy * spoutL) / 2, 0, 0, 0, rz));
  k.add(new THREE.CylinderGeometry(r * 0.28, r * 0.28, r * 0.12, 10), green, xf(baseX + dx * spoutL, baseY + dy * spoutL, 0, 0, 0, rz));
  // Handle: upper half-ring squashed so its peak sits at o.height.
  const arcR = r * 0.9;
  k.add(new THREE.TorusGeometry(arcR, r * 0.1, 8, 20, Math.PI), green, xf(0, bodyH, 0, 0, 0, 0, 1, (h - bodyH) / arcR, 1));
}

const UP = new THREE.Vector3(0, 1, 0);

/** Matrix that turns a primitive built along +Y into one running from a to b (its top at b), and that primitive's length. */
function aim(a: THREE.Vector3, b: THREE.Vector3): { m: THREE.Matrix4; len: number } {
  const d = b.clone().sub(a);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(UP, d.divideScalar(len));
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
  return { m, len };
}

/** A straight cylinder of radius `rad` from a to b. */
function limb(k: Kit, material: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, rad: number): void {
  const { m, len } = aim(a, b);
  k.add(new THREE.CylinderGeometry(rad, rad, len, 8), material, m);
}

/** Small seeded PRNG (mulberry32), so a prop looks the same on every build. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cactus(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  if (h > 12) saguaro(k, r, h);
  else barrel(k, r, h);
}

/** Tall cactus with arms. Its top is at h. */
function saguaro(k: Kit, r: number, h: number): void {
  const green = mat(0x4f8f4a);
  const ribMat = mat(0x3f7a3d);
  const spineMat = mat(0xf3ecd0);
  const trunkH = h * 0.92;
  k.add(new THREE.CylinderGeometry(r, r * 1.05, trunkH, 12), green, xf(0, trunkH / 2, 0));
  k.add(new THREE.SphereGeometry(r * 1.05, 12, 8), green, xf(0, h - r * 1.05, 0));
  // Vertical ribs: thin darker strips just proud of the trunk.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    k.add(new THREE.BoxGeometry(r * 0.14, trunkH * 0.9, r * 0.12), ribMat, xf(Math.cos(a) * r, trunkH / 2, Math.sin(a) * r, 0, -a, 0));
  }
  // Arms: out from the trunk, then upright, each with a sphere cap.
  const arms = h > 20 ? 3 : 2;
  const ra = r * 0.6;
  const reach = r * 2.2;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2 + 0.6;
    const y = h * (0.4 + 0.12 * i);
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const elbow = new THREE.Vector3(dx * reach, y, dz * reach);
    const tip = elbow.clone().add(new THREE.Vector3(0, h * 0.18, 0));
    limb(k, green, new THREE.Vector3(dx * r * 0.5, y, dz * r * 0.5), elbow, ra);
    limb(k, green, elbow, tip, ra);
    k.add(new THREE.SphereGeometry(ra, 10, 8), green, xf(tip.x, tip.y, tip.z));
  }
  // Light spines: tiny cones pointing out from the trunk.
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4;
    const y = trunkH * (0.1 + 0.07 * i);
    const base = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const tip = new THREE.Vector3(Math.cos(a) * r * 1.3, y + r * 0.15, Math.sin(a) * r * 1.3);
    const { m, len } = aim(base, tip);
    k.add(new THREE.ConeGeometry(r * 0.04, len, 4), spineMat, m);
  }
}

/** Squat barrel cactus filling radius r and height h, with a few flowers on top. */
function barrel(k: Kit, r: number, h: number): void {
  const green = mat(0x4f8f4a);
  const ribMat = mat(0x3f7a3d);
  k.add(new THREE.SphereGeometry(r, 16, 12), green, xf(0, h / 2, 0, 0, 0, 0, 1, h / (2 * r), 1));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    k.add(new THREE.BoxGeometry(r * 0.1, h * 0.5, r * 0.1), ribMat, xf(Math.cos(a) * r * 0.93, h / 2, Math.sin(a) * r * 0.93, 0, -a, 0));
  }
  // Height of the squashed sphere's surface at horizontal distance rho from its axis.
  const yTop = (rho: number) => h / 2 + (h / 2) * Math.sqrt(Math.max(0, 1 - (rho / r) ** 2));
  const rho = r * 0.35;
  const flowerR = Math.max(0.12, r * 0.18);
  for (let i = 0; i < 4; i++) {
    const a = i * (Math.PI / 2) + 0.5;
    k.add(new THREE.SphereGeometry(flowerR, 8, 6), mat(i % 2 ? 0xffd54f : 0xff6fa3), xf(Math.cos(a) * rho, yTop(rho) + flowerR * 0.4, Math.sin(a) * rho));
  }
}

/** A loose ball of dry twigs filling radius r, top at h. Layout is seeded from the position. */
function tumbleweed(k: Kit, o: Obstacle): void {
  const { radius: r, height: h } = o;
  const rnd = rng(Math.imul(Math.round(o.x * 100), 73856093) ^ Math.imul(Math.round(o.z * 100), 19349663));
  const twigA = mat(0xa07a4a);
  const twigB = mat(0x8a6a3e);
  const count = 25 + Math.floor(rnd() * 16);
  const sy = h / (2 * r);
  for (let i = 0; i < count; i++) {
    const R = r * (0.45 + 0.5 * rnd());
    const rot = xf(0, 0, 0, rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    // Rotate first, then squash to h and move the centre to h/2.
    const place = new THREE.Matrix4().makeTranslation(0, h / 2, 0).multiply(new THREE.Matrix4().makeScale(1, sy, 1));
    k.add(new THREE.TorusGeometry(R, r * 0.04, 4, 12), i % 2 ? twigB : twigA, place.multiply(rot));
  }
}
