// Hedgeworth's playing surfaces: tee boxes, fairways (with mowing stripes), cart paths, fringes, greens (which rise and
// tilt with the ball physics), bunkers, Hosepipe Pond with its reeds, flagsticks and tee markers. Flat things take a
// draw layer (docs/rendering.md); the greens sit on courseGroundY so the tilt is real.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildStaticCells, registerCull } from '../cull';
import { addMowablePlants } from '../flora/harvest';
import { heightAt } from '../terrain';
import { getPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import type { Box } from '../types';
import { courseGroundY } from './course';
import { CART_PATHS, CART_PATH_W, HOLES, TEE_HALF_M, type HedgeworthHole } from './types';

type Pt = { x: number; z: number };

const FAIRWAY = 0x5fae3e;
const STRIPE = 0x6dbd49;
const TEE = 0x74c454;
const FRINGE = 0x6cc04c;
const GREEN = 0x7fd35f;
const CUP = 0x1d2a18;
const GRAVEL = 0xc8b48a;
const SAND = 0xe8d7a0;
const WATER = 0x4a8fb8;
const LIFT = 0.02;
const STRIPE_BAND = 6;
const SAMPLE = 2;
const RED = 0xd93636;
const YELLOW = 0xf2c230;

// One material per (layer, colour): a material shared across layers would move with flatLayer.
const mats = new Map<string, THREE.MeshBasicMaterial>();
function flat(color: number, layer: number): THREE.MeshBasicMaterial {
  const key = `${layer}:${color}`;
  let m = mats.get(key);
  if (!m) {
    m = flatLayer(new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), layer) as THREE.MeshBasicMaterial;
    mats.set(key, m);
  }
  return m;
}

/** Point at distance s along a polyline (clamped to its ends). */
function pointAt(path: readonly Pt[], s: number): Pt {
  let walked = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (s <= walked + len || i === path.length - 2) {
      const t = len > 0 ? Math.min(1, Math.max(0, (s - walked) / len)) : 0;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    }
    walked += len;
  }
  return { ...path[path.length - 1] };
}

function lengthOf(path: readonly Pt[]): number {
  let L = 0;
  for (let i = 0; i < path.length - 1; i++) L += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].z - path[i].z);
  return L;
}

/** A thin strip lying on the ground along sample points, following the terrain (as hill.ts skiTrack). */
function ribbon(pts: readonly Pt[], width: number, mat: THREE.Material, name: string): THREE.Mesh {
  const pos: number[] = [];
  const idx: number[] = [];
  pts.forEach(({ x, z }, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * width / 2, nz = (dx / l) * width / 2;
    for (const sgn of [-1, 1]) {
      const px = x + nx * sgn, pz = z + nz * sgn;
      pos.push(px, heightAt(px, pz) + LIFT, pz);
    }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = name;
  return mesh;
}

/** A filled disc as a triangle fan of rings; `heightOf` gives each vertex's height, `wobble` shapes the edge. */
function disc(
  c: Pt, r: number, seg: number, rings: number, heightOf: (x: number, z: number) => number,
  wobble: (theta: number) => number = () => 1,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const push = (x: number, z: number): void => { pos.push(x, heightOf(x, z), z); };
  push(c.x, c.z);
  for (let k = 1; k <= rings; k++) {
    const rad = (r * k) / rings;
    for (let s = 0; s < seg; s++) {
      const th = (2 * Math.PI * s) / seg;
      const rr = rad * wobble(th);
      push(c.x + Math.cos(th) * rr, c.z + Math.sin(th) * rr);
    }
  }
  const idx: number[] = [];
  const ring = (k: number, s: number): number => 1 + (k - 1) * seg + (((s % seg) + seg) % seg);
  for (let s = 0; s < seg; s++) idx.push(0, ring(1, s), ring(1, s + 1));
  for (let k = 1; k < rings; k++) {
    for (let s = 0; s < seg; s++) {
      const a = ring(k, s), b = ring(k, s + 1), cc = ring(k + 1, s + 1), d = ring(k + 1, s);
      idx.push(a, d, cc, a, cc, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/** A square patch on the terrain, split into a grid so it follows the slope. */
function square(c: Pt, half: number, n: number, lift: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      const x = c.x - half + (2 * half * i) / n, z = c.z - half + (2 * half * j) / n;
      pos.push(x, heightAt(x, z) + lift, z);
    }
  }
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i, b = a + 1, d = a + n + 1, e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/** Fairway, stripes and the rest of one hole's ground: the stripes on alternate 6 m bands along the fairway. */
function holeGround(h: HedgeworthHole): { fairway: THREE.Mesh; stripes: THREE.Mesh[] } {
  const path = h.path;
  const L = lengthOf(path);
  const s0 = h.fairwayStart;
  const s1 = Math.max(s0, L - h.green.r);
  const set = new Set<number>([s1]);
  for (let s = s0; s <= s1; s += SAMPLE) set.add(s);
  for (let s = s0; s <= s1; s += STRIPE_BAND) set.add(s);
  const all = [...set].sort((a, b) => a - b);
  const line = all.map((s) => ({ s, p: pointAt(path, s) }));
  const fairway = ribbon(line.filter((v) => v.s <= s1 + 1e-6).map((v) => v.p), h.fairwayWidth, flat(FAIRWAY, LAYER.tint), `fairway-${h.number}`);

  const stripes: THREE.Mesh[] = [];
  const bands = Math.ceil((s1 - s0) / STRIPE_BAND);
  for (let b = 1; b < bands; b += 2) {
    const a = s0 + b * STRIPE_BAND;
    const e = Math.min(s1, a + STRIPE_BAND);
    const run = line.filter((v) => v.s >= a - 1e-6 && v.s <= e + 1e-6).map((v) => v.p);
    if (run.length > 1) stripes.push(ribbon(run, h.fairwayWidth, flat(STRIPE, LAYER.area), `fairway-stripe-${h.number}-${b}`));
  }
  return { fairway, stripes };
}

/** A green disc: rings every metre, vertex heights on courseGroundY so the tilt shows. */
function greenMesh(h: HedgeworthHole): THREE.Mesh {
  const g = h.green;
  const rings = Math.max(2, Math.ceil(g.r));
  const geo = disc({ x: g.x, z: g.z }, g.r, 32, rings, (x, z) => courseGroundY(x, z) + 0.02);
  const mesh = new THREE.Mesh(geo, flat(GREEN, LAYER.marking));
  mesh.name = `green-${h.number}`;
  return mesh;
}

/** Bunker or pond disc with a slightly wobbly edge, drawn on the terrain. */
function hazardDisc(c: { x: number; z: number; r: number }, color: number, name: string, wobble: boolean, phase: number, mat?: THREE.Material): THREE.Mesh {
  const shape = wobble ? (th: number): number => 1 + 0.08 * Math.sin(3 * th + phase) + 0.05 * Math.cos(5 * th + phase) : undefined;
  const geo = disc(c, c.r, 24, Math.max(2, Math.ceil(c.r / 2)), (x, z) => heightAt(x, z) + 0.03, shape);
  const mesh = new THREE.Mesh(geo, mat ?? flat(color, LAYER.decal));
  mesh.name = name;
  return mesh;
}

/** Placements for a prefab at a ground point (y on the course surface, metres). */
function at(id: string, x: number, z: number, extra: Partial<StaticPrefabPlacement> = {}): StaticPrefabPlacement {
  return { id, x, y: courseGroundY(x, z) - 0.02, z, ...extra };
}

export function buildCourseGround(scene: THREE.Scene): { boxes: Box[] } {
  const root = new THREE.Group();
  root.name = 'hedgeworth-course';
  scene.add(root);

  const flags: StaticPrefabPlacement[] = [];
  const markers: StaticPrefabPlacement[] = [];
  const reeds: StaticPrefabPlacement[] = [];

  HOLES.forEach((h) => {
    const hole = new THREE.Group();
    hole.name = `hedgeworth-hole-${h.number}`;
    root.add(hole);

    const { fairway, stripes } = holeGround(h);
    hole.add(fairway, ...stripes);

    // Tee box: a square on the terrain, flat (no raised box); an elevated tee (the shed roof) lifts it by teeY.
    const tee = new THREE.Mesh(square(h.tee, TEE_HALF_M, 4, LIFT + (h.teeY ?? 0)), flat(TEE, LAYER.area));
    tee.name = `tee-${h.number}`;
    hole.add(tee);

    // Fringe: an annulus round the green, on the course surface.
    const g = h.green;
    const fringeRings = 2;
    const fringe = new THREE.Mesh(
      annulus({ x: g.x, z: g.z }, g.r, g.r + 1.2, 32, fringeRings, (x, z) => courseGroundY(x, z) + 0.01),
      flat(FRINGE, LAYER.edge),
    );
    fringe.name = `fringe-${h.number}`;
    hole.add(fringe);

    const green = greenMesh(h);
    hole.add(green);

    // The cup: a small dark disc at the pin, above the green.
    const cup = new THREE.Mesh(
      disc(h.pin, 0.12, 16, 1, (x, z) => courseGroundY(x, z) + 0.03),
      flat(CUP, LAYER.marker),
    );
    cup.name = `cup-${h.number}`;
    hole.add(cup);

    h.bunkers.forEach((b, i) => hole.add(hazardDisc(b, SAND, `bunker-${h.number}-${i}`, true, i * 1.7)));
    h.ponds.forEach((p, i) => {
      const water = new THREE.MeshStandardMaterial({ color: WATER, roughness: 0.2 });
      flatLayer(water, LAYER.decal);
      hole.add(hazardDisc(p, WATER, `pond-${h.number}-${i}`, true, 0.4, water));
      // Reeds every ~6 m just outside the water. Mowable plants: no collider.
      const R = p.r + 1.5;
      const n = Math.ceil((2 * Math.PI * R) / 6);
      for (let k = 0; k < n; k++) {
        const th = (2 * Math.PI * k) / n;
        const x = p.x + Math.cos(th) * R, z = p.z + Math.sin(th) * R;
        reeds.push({ id: 'reed-bed', x, y: heightAt(x, z), z, yaw: th });
      }
    });

    const flagTint = h.index === 2 ? undefined : YELLOW;
    const flag = at('golf-flagstick', h.pin.x, h.pin.z, { scale: 2.2 / 2.6, yaw: 0 });
    if (flagTint !== undefined) flag.tint = flagTint;
    if (getPrefab('golf-flagstick')) flags.push(flag);

    // Two tee markers, 2 m either side of the aim line (perpendicular to the first leg).
    const a = h.path[0], b = h.path[1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;
    for (const side of [-1, 1]) {
      const x = h.tee.x + px * 2 * side, z = h.tee.z + pz * 2 * side;
      if (getPrefab('tee-marker')) markers.push(at('tee-marker', x, z));
    }

    // Each hole's ground is one culled group (flat meshes, no colliders).
    registerCull(hole, 'cell');
  });

  // Cart paths: gravel strips on the road layer.
  const gravel = flat(GRAVEL, LAYER.road);
  const paths = new THREE.Group();
  paths.name = 'hedgeworth-cart-paths';
  CART_PATHS.forEach((p, i) => {
    const pts = p.map(([x, z]) => ({ x, z }));
    const L = lengthOf(pts);
    const samples: Pt[] = [];
    for (let s = 0; s < L; s += SAMPLE) samples.push(pointAt(pts, s));
    samples.push(pointAt(pts, L));
    paths.add(ribbon(samples, CART_PATH_W, gravel, `cart-path-${i}`));
  });
  root.add(paths);
  registerCull(paths, 'cell');

  // Flagsticks, tee markers and reeds: prefabs. Reeds go through the mowable-plant hand-over first.
  if (flags.length) root.add(buildStaticCells(flags, { lights: false, name: 'hedgeworth-flags', cls: 'prop' }));
  if (markers.length) root.add(buildStaticCells(markers, { lights: false, name: 'hedgeworth-tee-markers', cls: 'prop' }));
  const restReeds = addMowablePlants(reeds);
  if (restReeds.length) root.add(buildStaticCells(restReeds, { lights: false, name: 'hedgeworth-reeds', cls: 'detail' }));

  return { boxes: [] };
}

/** A flat ring between two radii, on heights from `heightOf`. */
function annulus(c: Pt, r0: number, r1: number, seg: number, rings: number, heightOf: (x: number, z: number) => number): THREE.BufferGeometry {
  const pos: number[] = [];
  for (let k = 0; k <= rings; k++) {
    const rad = r0 + ((r1 - r0) * k) / rings;
    for (let s = 0; s < seg; s++) {
      const th = (2 * Math.PI * s) / seg;
      const x = c.x + Math.cos(th) * rad, z = c.z + Math.sin(th) * rad;
      pos.push(x, heightOf(x, z), z);
    }
  }
  const idx: number[] = [];
  const v = (k: number, s: number): number => k * seg + (((s % seg) + seg) % seg);
  for (let k = 0; k < rings; k++) {
    for (let s = 0; s < seg; s++) {
      const a = v(k, s), b = v(k, s + 1), cc = v(k + 1, s + 1), d = v(k + 1, s);
      idx.push(a, d, cc, a, cc, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
