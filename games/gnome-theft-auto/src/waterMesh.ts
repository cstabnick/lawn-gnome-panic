// The water you see (Wild World Epic 4): river and canal ribbons, the loch and the Puddle Sea, shore foam, flow that runs
// downhill. Geometry comes from water.ts (courseProfile, bodyLevel, bodyRadius, shorePoint); this file only draws it.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { WATER } from './config';
import { BODIES, COURSES, bodyLevel, bodyRadius, canalLocks, courseProfile, shorePoint, waterOn, type StillWater, type WaterCourse } from './water';
import { registerCalmSpots, waveAmplitudeScale, waveTime } from './waves';
import { applyWaveShader, createWaveUniforms, updateWaveUniforms } from './waveShader';

export interface WaterMeshes {
  /** Animate the flow and ripples; hide what is far from (focusX, focusZ). */
  update(dt: number, focusX: number, focusZ: number): void;
}

/** Draw layer per course: the canal and upper river lie on the area layer, the ravine and farm river on the road layer. */
const COURSE_LAYER: Record<string, number> = {
  'river-upper': LAYER.area,
  canal: LAYER.area,
  'river-ravine': LAYER.road,
  'river-farm': LAYER.road,
};
const BODY_LAYER = LAYER.tint;
const FOAM_LAYER = LAYER.decal;

const FAN_SEGMENTS = 96;
const SHORE_CHECK = 0.97;
const FOAM_LIFT = 0.01;
/** Grid spacing of a loch or sea surface, metres (the waves need ~1.7 m of ripple resolved; the swell is 22 m). */
const GRID_STEP = 2.5;
/** Canal locks: the water stays calm within this radius (waves.ts registerCalmSpots). */
const LOCK_CALM_R = 12;
/** Margin added to the bounding sphere of a displaced water mesh, so frustum culling never clips a crest. */
const WAVE_BOUND_MARGIN = 1.5;

/** Mulberry32: a small seeded PRNG, so every load draws the same water. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexCss(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function rgba(c: number, a: number): string {
  return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${a})`;
}

/** The flow texture: the water colour with short lighter streaks running along v (downstream). */
function flowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = hexCss(WATER.colour);
  ctx.fillRect(0, 0, 128, 128);
  const rnd = mulberry32(0x6f10);
  for (let i = 0; i < 60; i++) {
    const x = rnd() * 128, y = rnd() * 128;
    const len = 6 + rnd() * 18;
    ctx.strokeStyle = rgba(WATER.foam, 0.15 + rnd() * 0.15);
    ctx.lineWidth = 1 + rnd();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

type Vtx = [number, number, number, number, number]; // x, y, z, u, v
type Row = [Vtx, Vtx];

/** Accumulates triangle strips into one geometry's arrays. */
interface Acc { pos: number[]; uv: number[]; idx: number[] }

/**
 * Adds a strip of rows. Each row is a pair of vertices (first, second); the first is on the +normal side of travel, so
 * the triangles face up. A null row breaks the strip (a gap where a body cuts the course).
 */
function addStrip(acc: Acc, rows: (Row | null)[]): void {
  let prev = -1;
  for (const row of rows) {
    if (!row) { prev = -1; continue; }
    const base = acc.pos.length / 3;
    for (const v of row) {
      acc.pos.push(v[0], v[1], v[2]);
      acc.uv.push(v[3], v[4]);
    }
    if (prev >= 0) {
      // (prevFirst, first, prevSecond) and (prevSecond, first, second): both face up.
      acc.idx.push(prev, base, prev + 1, prev + 1, base, base + 1);
    }
    prev = base;
  }
}

function geometryOf(acc: Acc): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uv, 2));
  g.setIndex(acc.idx);
  return g;
}

function insideBody(x: number, z: number): boolean {
  for (const b of BODIES) if (bodyRadius(b, x, z) < SHORE_CHECK) return true;
  return false;
}

/** Unit normal of the path at sample k, from its neighbours. */
function pathNormal(x: number[], z: number[], k: number): [number, number] {
  const kp = Math.max(0, k - 1), kn = Math.min(x.length - 1, k + 1);
  const dx = x[kn] - x[kp], dz = z[kn] - z[kp];
  const l = Math.hypot(dx, dz) || 1;
  return [-dz / l, dx / l];
}

function courseWater(c: WaterCourse, acc: Acc, surface: number[], x: number[], z: number[], s: number[]): void {
  const off = c.width / 2 + 1.5;
  const rows: (Row | null)[] = [];
  for (let k = 0; k < x.length; k++) {
    if (insideBody(x[k], z[k])) { rows.push(null); continue; }
    const [nx, nz] = pathNormal(x, z, k);
    const y = surface[k];
    const v = s[k] / 6;
    rows.push([
      [x[k] + nx * off, y, z[k] + nz * off, 0, v],
      [x[k] - nx * off, y, z[k] - nz * off, 1, v],
    ]);
  }
  addStrip(acc, rows);
}

function courseFoam(c: WaterCourse, acc: Acc, surface: number[], x: number[], z: number[]): void {
  const hw = c.width / 2;
  for (const side of [1, -1]) {
    const rows: (Row | null)[] = [];
    for (let k = 0; k < x.length; k++) {
      if (insideBody(x[k], z[k])) { rows.push(null); continue; }
      const [nx, nz] = pathNormal(x, z, k);
      const y = surface[k] + FOAM_LIFT;
      const far = side * (hw + 0.3), near = side * (hw - 0.6);
      // The first vertex must sit on the +normal side: order by signed offset, larger first.
      const outer: Vtx = [x[k] + nx * far, y, z[k] + nz * far, 0, 0];
      const inner: Vtx = [x[k] + nx * near, y, z[k] + nz * near, 0, 0];
      rows.push(far > near ? [outer, inner] : [inner, outer]);
    }
    addStrip(acc, rows);
  }
}

/**
 * A loch or sea surface as a regular grid (GRID_STEP m) over its box, grown like the old fan. Nodes outside the grown
 * superellipse are pulled onto its rim (the superellipse radius is homogeneous, so that lands exactly on r = grow); a
 * quad is kept while one of its corners is inside. Both triangles of a quad face up.
 */
function bodyGrid(w: StillWater, level: number): Acc {
  const acc: Acc = { pos: [], uv: [], idx: [] };
  const grow = 1 + 2 / Math.min(w.a, w.b);
  const hx = w.a * grow, hz = w.b * grow;
  const nx = Math.max(1, Math.ceil((2 * hx) / GRID_STEP)), nz = Math.max(1, Math.ceil((2 * hz) / GRID_STEP));
  const dx = (2 * hx) / nx, dz = (2 * hz) / nz;
  const x0 = w.cx - hx, z0 = w.cz - hz;
  const stride = nz + 1;
  const nodeX = new Float64Array((nx + 1) * stride), nodeZ = new Float64Array((nx + 1) * stride);
  const nodeR = new Float64Array((nx + 1) * stride);
  for (let i = 0; i <= nx; i++) {
    for (let j = 0; j <= nz; j++) {
      let x = x0 + i * dx, z = z0 + j * dz;
      const r = bodyRadius(w, x, z);
      if (r > grow) {
        x = w.cx + ((x - w.cx) * grow) / r;
        z = w.cz + ((z - w.cz) * grow) / r;
      }
      const n = i * stride + j;
      nodeX[n] = x;
      nodeZ[n] = z;
      nodeR[n] = r;
    }
  }
  const vertexOf = new Int32Array((nx + 1) * stride).fill(-1);
  const vert = (n: number): number => {
    if (vertexOf[n] < 0) {
      vertexOf[n] = acc.pos.length / 3;
      acc.pos.push(nodeX[n], level, nodeZ[n]);
      acc.uv.push(nodeX[n] / 8, nodeZ[n] / 8);
    }
    return vertexOf[n];
  };
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const a = i * stride + j, b = (i + 1) * stride + j, c = i * stride + j + 1, d = (i + 1) * stride + j + 1;
      if (nodeR[a] > grow && nodeR[b] > grow && nodeR[c] > grow && nodeR[d] > grow) continue;
      const va = vert(a), vb = vert(b), vc = vert(c), vd = vert(d);
      acc.idx.push(va, vc, vb, vb, vc, vd);
    }
  }
  return acc;
}

function bodyFoam(w: StillWater, level: number): Acc {
  const acc: Acc = { pos: [], uv: [], idx: [] };
  const y = level + FOAM_LIFT;
  const rows: Row[] = [];
  for (let k = 0; k <= FAN_SEGMENTS; k++) {
    const p = shorePoint(w, (k / FAN_SEGMENTS) * Math.PI * 2);
    const inner: Vtx = [w.cx + (p.x - w.cx) * 0.985, y, w.cz + (p.z - w.cz) * 0.985, 0, 0];
    const outer: Vtx = [w.cx + (p.x - w.cx) * 1.005, y, w.cz + (p.z - w.cz) * 1.005, 0, 0];
    // Travel runs with increasing angle, so the inner rim is the +normal side: first = inner.
    rows.push([inner, outer]);
  }
  addStrip(acc, rows);
  return acc;
}

export function buildWaterMeshes(scene: THREE.Scene): WaterMeshes {
  if (!waterOn()) return { update() { /* no water */ } };

  // Canal locks are calm water (no waves over the gates).
  registerCalmSpots(canalLocks().map((l) => ({ x: l.x, z: l.z, r: LOCK_CALM_R })));

  const group = new THREE.Group();
  group.name = 'water';
  scene.add(group);

  const riverTex = flowTexture();
  const bodyTex = riverTex.clone();
  bodyTex.needsUpdate = true;
  const waveU = createWaveUniforms();

  const waterMats = new Map<number, THREE.MeshStandardMaterial>();
  const waterMat = (layer: number, map: THREE.Texture): THREE.MeshStandardMaterial => {
    const key = layer * 1000 + (map === bodyTex ? 1 : 0);
    let m = waterMats.get(key);
    if (!m) {
      m = flatLayer(new THREE.MeshStandardMaterial({
        color: 0xffffff, map, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.88,
      }), layer);
      applyWaveShader(m, waveU);
      waterMats.set(key, m);
    }
    return m;
  };
  const foamMat = flatLayer(new THREE.MeshBasicMaterial({ color: WATER.foam, transparent: true, opacity: 0.45 }), FOAM_LAYER);

  /** `waves`: a surface the wave field displaces (gets the aWaveScale attribute and a grown bounding sphere). */
  const add = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material, waves: boolean): void => {
    geometry.computeVertexNormals();
    if (waves) {
      const pos = geometry.getAttribute('position');
      const scale = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) scale[i] = waveAmplitudeScale(pos.getX(i), pos.getZ(i));
      geometry.setAttribute('aWaveScale', new THREE.BufferAttribute(scale, 1));
      geometry.computeBoundingSphere();
      geometry.boundingSphere!.radius += WAVE_BOUND_MARGIN;
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
  };

  // Rivers and canal.
  for (const c of COURSES) {
    const p = courseProfile(c.id);
    if (!p) continue;
    const water: Acc = { pos: [], uv: [], idx: [] };
    courseWater(c, water, p.surface, p.x, p.z, p.s);
    const layer = COURSE_LAYER[c.id] ?? LAYER.area;
    add(`water:${c.id}`, geometryOf(water), waterMat(layer, riverTex), true);

    const foam: Acc = { pos: [], uv: [], idx: [] };
    courseFoam(c, foam, p.surface, p.x, p.z);
    add(`water-foam:${c.id}`, geometryOf(foam), foamMat, false);
  }

  // Lochs and the Puddle Sea.
  for (const b of BODIES) {
    const level = bodyLevel(b.id);
    if (level === null) continue;
    add(`water:${b.id}`, geometryOf(bodyGrid(b, level)), waterMat(BODY_LAYER, bodyTex), true);
    add(`water-foam:${b.id}`, geometryOf(bodyFoam(b, level)), foamMat, false);
  }

  return {
    update(dt: number) {
      riverTex.offset.y -= (WATER.flowSpeed / 6) * dt;
      bodyTex.offset.x += 0.01 * dt;
      updateWaveUniforms(waveU, waveTime());
    },
  };
}
