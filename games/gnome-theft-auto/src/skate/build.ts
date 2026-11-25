// The Gutter Bowls' look (batch 3 E19): a concrete pad, the ridable surfaces meshed from the same height function the
// board rides (skate/park.ts pieceHeight), skirts down to the ground, rails, prefab props and a little graffiti.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYER, flatLayer } from '@lawn/depth';
import { buildPrefab, type StaticPrefabPlacement } from '@lawn/prefabs';
import { buildStaticCells } from '../cull';
import { heightAt } from '../terrain';
import type { Box } from '../types';
import { parkHeight, pieceHeight } from './park';
import { BOARD_LIBRARY, BOWL_OUTER, SKATE_ORIGIN, SKATE_PIECES, SKATE_RAILS, SKATE_SITE } from './types';
import type { SkatePiece, SkateRailDef } from './types';

export interface SkateBuild { boxes: Box[]; group: THREE.Group }

const PAD_LIFT = 0.02;
// Ridable surfaces sit above the pad (PAD_LIFT) and the terrain, on their own draw layer (no z-fighting where they meet).
const SURF_LIFT = 0.03;
const PAD_CELL = 0.5;
const JOINT_EVERY = 5;

const PAD = 0xbdbdb6;
const JOINT = 0x8d8d88;
const GUTTER = 0xa9bac4;
const GUTTER_SEAM = 0x8196a3;
const GUTTER_RIVET = 0x6f8290;
const CONCRETE = 0xb4b4ad;
const CONCRETE_SEAM = 0x9a9a93;
const STEEL = 0x9aa3a9;

const wx = (u: number): number => SKATE_ORIGIN.x + u;
const wz = (v: number): number => SKATE_ORIGIN.z + v;
const mix = (c: number, k: number): THREE.Color => new THREE.Color(c).multiplyScalar(k);

// ---- Patches: every ridable piece as a parametric grid of cells --------------------------------------------------------

interface Cell { a0: number; a1: number; tone: 'seam' | 'base' | 'rivet' }
interface Patch {
  piece: SkatePiece;
  kind: 'gutter' | 'concrete';
  /** Cell breakpoints along each axis: A (cells with a tone) and B (sample values). */
  cellsA: Cell[];
  bs: number[];
  periodic: boolean;
  pos(a: number, b: number): [number, number];
  /** A point inside the piece, to nudge boundary samples towards. */
  centre: [number, number];
}

/** Height of one piece at (u, v): at its border the sample is nudged inward until the piece accepts it. */
function surfaceH(p: SkatePiece, u: number, v: number, c: [number, number]): number {
  let x = u, y = v;
  const dx = c[0] - u, dy = c[1] - v;
  const len = Math.hypot(dx, dy) || 1;
  for (let k = 0; k < 8; k++) {
    const h = pieceHeight(p, x, y);
    if (h !== null) return h;
    x += (dx / len) * 1e-4 * (k + 1) * (k + 1);
    y += (dy / len) * 1e-4 * (k + 1) * (k + 1);
  }
  return 0;
}

/** Profile breakpoints (distance from the centre line) of a trough or bowl, flat floor first, 0.25 m along the curve. */
function profileDs(p: { flat: number; radius: number; height: number; deck: number }): number[] {
  const tEnd = Math.sqrt(p.radius * p.radius - (p.radius - p.height) * (p.radius - p.height));
  const n = Math.max(2, Math.ceil(tEnd / 0.25));
  const out = [p.flat];
  for (let k = 1; k <= n; k++) out.push(p.flat + (tEnd * k) / n);
  out.push(p.flat + tEnd + p.deck);
  return out;
}

function seamCells(from: number, to: number, every: number, seam: number): Cell[] {
  const out: Cell[] = [];
  for (let t = from; t < to - 1e-9; t += every) {
    const e = Math.min(to, t + every);
    out.push({ a0: t, a1: Math.min(e, t + seam), tone: 'seam' });
    if (e > t + seam) out.push({ a0: t + seam, a1: e, tone: 'base' });
  }
  return out;
}

function evenCells(from: number, to: number, n: number): Cell[] {
  return Array.from({ length: n }, (_, i) => ({ a0: from + ((to - from) * i) / n, a1: from + ((to - from) * (i + 1)) / n, tone: 'base' as const }));
}

function patchesOf(p: SkatePiece): Patch[] {
  switch (p.kind) {
    case 'halfpipe': {
      const ds = profileDs(p);
      const bs = [...ds].reverse().map((d) => -d).concat(ds);
      return [{
        piece: p, kind: 'gutter', cellsA: seamCells(p.u0, p.u1, 1.5, 0.05), bs, periodic: false,
        pos: (a, b) => [a, p.v + b], centre: [(p.u0 + p.u1) / 2, p.v],
      }];
    }
    case 'bowl': {
      const bs = [0, ...profileDs(p)];
      const n = 48;
      const cellsA = evenCells(0, Math.PI * 2, n).map((c, i) => (i % 6 === 0 ? { ...c, tone: 'seam' as const } : c));
      return [{
        piece: p, kind: 'gutter', cellsA, bs, periodic: true,
        pos: (a, b) => [p.u + Math.sin(a) * b, p.v + Math.cos(a) * b], centre: [p.u, p.v],
      }];
    }
    case 'wedge': {
      const s = Math.sin(p.yaw), c = Math.cos(p.yaw), hw = p.width / 2;
      const nb = Math.max(1, Math.round(p.width));
      const bs = Array.from({ length: nb + 1 }, (_, i) => -hw + (p.width * i) / nb);
      return [{
        piece: p, kind: 'concrete', cellsA: evenCells(0, p.length, Math.max(1, Math.round(p.length))), bs, periodic: false,
        pos: (a, b) => [p.u + a * s + b * c, p.v + a * c - b * s],
        centre: [p.u + (p.length / 2) * s, p.v + (p.length / 2) * c],
      }];
    }
    case 'box':
      if (p.prefab) return [];
      return [{
        piece: p, kind: 'concrete', cellsA: evenCells(-p.hw, p.hw, Math.max(1, Math.round(p.hw))),
        bs: Array.from({ length: Math.max(1, Math.round(p.hd)) + 1 }, (_, i) => -p.hd + (2 * p.hd * i) / Math.max(1, Math.round(p.hd))),
        periodic: false, pos: (a, b) => [p.u + a, p.v + b], centre: [p.u, p.v],
      }];
    case 'stairs': {
      const s = Math.sin(p.yaw), c = Math.cos(p.yaw), hw = p.width / 2;
      return Array.from({ length: p.steps }, (_, i): Patch => ({
        piece: p, kind: 'concrete', cellsA: [{ a0: i * p.run, a1: (i + 1) * p.run, tone: 'base' }], bs: [-hw, hw], periodic: false,
        pos: (a, b) => [p.u + a * s + b * c, p.v + a * c - b * s],
        centre: [p.u + ((i + 0.5) * p.run) * s, p.v + ((i + 0.5) * p.run) * c],
      }));
    }
  }
}

/** True when a piece's own mesh (not a prefab) covers (u, v). */
function meshCovered(u: number, v: number): boolean {
  for (const p of SKATE_PIECES) {
    if (p.kind === 'box' && p.prefab) continue;
    if (pieceHeight(p, u, v) !== null) return true;
  }
  return false;
}

/** Highest surface of any piece at (u, v), 0 outside all of them. */
function anyHeight(u: number, v: number): number {
  return parkHeight(wx(u), wz(v));
}

class Mesher {
  pos: number[] = [];
  col: number[] = [];
  vert(u: number, v: number, h: number, c: THREE.Color): void {
    const x = wx(u), z = wz(v);
    this.pos.push(x, heightAt(x, z) + h + SURF_LIFT, z);
    this.col.push(c.r, c.g, c.b);
  }
  tri(a: number[], b: number[], c: number[], col: THREE.Color): void {
    for (const q of [a, b, c]) this.vert(q[0], q[1], q[2], col);
  }
  quad(a: number[], b: number[], c: number[], d: number[], col: THREE.Color): void {
    this.tri(a, b, c, col);
    this.tri(a, c, d, col);
  }
  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    return g;
  }
  get empty(): boolean { return this.pos.length === 0; }
}

const toneColor = (kind: 'gutter' | 'concrete', tone: Cell['tone'], rivet: boolean): THREE.Color => {
  if (rivet) return new THREE.Color(GUTTER_RIVET);
  if (kind === 'gutter') return new THREE.Color(tone === 'seam' ? GUTTER_SEAM : GUTTER);
  return new THREE.Color(tone === 'seam' ? CONCRETE_SEAM : CONCRETE);
};

/** Surface cells of one patch plus the skirts under every border segment that stands above what is beside it. */
function meshPatch(pt: Patch, surf: Mesher, skirt: Mesher): void {
  const p = pt.piece;
  const sample = (a: number, b: number): number[] => {
    const [u, v] = pt.pos(a, b);
    return [u, v, surfaceH(p, u, v, pt.centre)];
  };
  const lipH = p.kind === 'halfpipe' || p.kind === 'bowl' ? p.height : Infinity;
  for (const cell of pt.cellsA) {
    for (let j = 0; j < pt.bs.length - 1; j++) {
      const b0 = pt.bs[j], b1 = pt.bs[j + 1];
      const q = [sample(cell.a0, b0), sample(cell.a1, b0), sample(cell.a1, b1), sample(cell.a0, b1)];
      // The rivet stripe: the last transition cell below the lip, on either side.
      const top = Math.max(q[0][2], q[1][2], q[2][2], q[3][2]);
      const rivet = lipH !== Infinity && top >= lipH - 0.3 && Math.min(q[0][2], q[1][2], q[2][2], q[3][2]) < lipH - 1e-6;
      surf.quad(q[0], q[1], q[2], q[3], toneColor(pt.kind, cell.tone, rivet));
    }
  }

  // Skirts: border segments of the patch, outward normal from the patch centre.
  const wall = (p0: number[], p1: number[], col: THREE.Color): void => {
    const mu = (p0[0] + p1[0]) / 2, mv = (p0[1] + p1[1]) / 2;
    let nu = -(p1[1] - p0[1]), nv = p1[0] - p0[0];
    const nl = Math.hypot(nu, nv);
    if (nl < 1e-9) return;
    nu /= nl; nv /= nl;
    if (nu * (mu - pt.centre[0]) + nv * (mv - pt.centre[1]) < 0) { nu = -nu; nv = -nv; }
    const hn = anyHeight(mu + nu * 0.05, mv + nv * 0.05);
    if (Math.max(p0[2], p1[2]) <= hn + 0.01) return;
    const b0 = Math.min(hn, p0[2]), b1 = Math.min(hn, p1[2]);
    skirt.quad([p0[0], p0[1], b0 - SURF_LIFT], [p1[0], p1[1], b1 - SURF_LIFT], [p1[0], p1[1], p1[2]], [p0[0], p0[1], p0[2]], col);
  };
  const skirtCol = mix(pt.kind === 'gutter' ? GUTTER : CONCRETE, 0.8);
  const nB = pt.bs.length - 1;
  const first = pt.cellsA[0], last = pt.cellsA[pt.cellsA.length - 1];
  for (let j = 0; j < nB; j++) {
    if (!pt.periodic) {
      wall(sample(first.a0, pt.bs[j]), sample(first.a0, pt.bs[j + 1]), skirtCol);
      wall(sample(last.a1, pt.bs[j]), sample(last.a1, pt.bs[j + 1]), skirtCol);
    }
  }
  for (const cell of pt.cellsA) {
    if (!pt.periodic) wall(sample(cell.a0, pt.bs[0]), sample(cell.a1, pt.bs[0]), skirtCol);
    wall(sample(cell.a0, pt.bs[nB]), sample(cell.a1, pt.bs[nB]), skirtCol);
  }
}

function litMaterial(): THREE.MeshLambertMaterial {
  return flatLayer(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }), LAYER.road);
}

// ---- The pad ---------------------------------------------------------------------------------------------------------

function buildPad(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'skate-pad';
  const pos: number[] = [];
  const nx = Math.round((SKATE_SITE.maxX - SKATE_SITE.minX) / PAD_CELL);
  const nz = Math.round((SKATE_SITE.maxZ - SKATE_SITE.minZ) / PAD_CELL);
  const put = (x: number, z: number): void => { pos.push(x, heightAt(x, z) + PAD_LIFT, z); };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x0 = SKATE_SITE.minX + i * PAD_CELL, z0 = SKATE_SITE.minZ + j * PAD_CELL;
      const x1 = x0 + PAD_CELL, z1 = z0 + PAD_CELL;
      // A cell wholly under a piece's mesh is left out, so the pad never overlaps a piece's flat floor.
      const pts: Array<[number, number]> = [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) / 2, (z0 + z1) / 2]];
      if (pts.every(([x, z]) => meshCovered(x - SKATE_ORIGIN.x, z - SKATE_ORIGIN.z))) continue;
      put(x0, z0); put(x0, z1); put(x1, z0);
      put(x1, z0); put(x0, z1); put(x1, z1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const mat = flatLayer(new THREE.MeshLambertMaterial({ color: PAD, side: THREE.DoubleSide }), LAYER.area);
  const pad = new THREE.Mesh(geo, mat);
  pad.name = 'skate-pad-surface';
  g.add(pad);

  // Expansion joints: thin dark strips every 5 m, left out where a piece's mesh sits.
  const jp: number[] = [];
  const W = 0.03;
  const seg = 0.5;
  const strip = (x0: number, z0: number, x1: number, z1: number): void => {
    const mu = (x0 + x1) / 2 - SKATE_ORIGIN.x, mv = (z0 + z1) / 2 - SKATE_ORIGIN.z;
    if (meshCovered(x0 - SKATE_ORIGIN.x, z0 - SKATE_ORIGIN.z) || meshCovered(x1 - SKATE_ORIGIN.x, z1 - SKATE_ORIGIN.z) || meshCovered(mu, mv)) return;
    const y = (x: number, z: number): number => heightAt(x, z) + PAD_LIFT + 0.01;
    const ax = x0 - (x1 === x0 ? W : 0), bx = x1 + (x1 === x0 ? W : 0);
    const az = z0 - (z1 === z0 ? W : 0), bz = z1 + (z1 === z0 ? W : 0);
    jp.push(ax, y(ax, az), az, ax, y(ax, bz), bz, bx, y(bx, az), az);
    jp.push(bx, y(bx, az), az, ax, y(ax, bz), bz, bx, y(bx, bz), bz);
  };
  for (let k = JOINT_EVERY; k < SKATE_SITE.maxX - SKATE_SITE.minX; k += JOINT_EVERY) {
    const x = SKATE_SITE.minX + k, z = SKATE_SITE.minZ + k;
    for (let s = SKATE_SITE.minZ; s < SKATE_SITE.maxZ - 1e-9; s += seg) strip(x, s, x, s + seg);
    for (let s = SKATE_SITE.minX; s < SKATE_SITE.maxX - 1e-9; s += seg) strip(s, z, s + seg, z);
  }
  const jg = new THREE.BufferGeometry();
  jg.setAttribute('position', new THREE.Float32BufferAttribute(jp, 3));
  jg.computeVertexNormals();
  const joints = new THREE.Mesh(jg, flatLayer(new THREE.MeshLambertMaterial({ color: JOINT, side: THREE.DoubleSide }), LAYER.marking));
  joints.name = 'skate-pad-joints';
  g.add(joints);
  return g;
}

// ---- Rails -----------------------------------------------------------------------------------------------------------

function tube(ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number): THREE.BufferGeometry {
  const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
  const len = a.distanceTo(b);
  const geo = new THREE.CylinderGeometry(r, r, len, 6, 1, true); // open ends: no cap coplanar with a skirt
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  geo.applyQuaternion(q);
  const m = a.clone().add(b).multiplyScalar(0.5);
  geo.translate(m.x, m.y, m.z);
  return geo;
}

const BOWL_P = SKATE_PIECES.find((p) => p.kind === 'bowl');

/** Steel pipes for 'coping' and 'handrail' rails (the bowl's coping follows the real lip circle, not the 16 chords). */
function buildPipes(): THREE.Mesh | null {
  const parts: THREE.BufferGeometry[] = [];
  const R = 0.035;
  const add = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, r = R): void => {
    parts.push(tube(ax, ay, az, bx, by, bz, r));
  };
  for (const r of SKATE_RAILS) {
    if (r.look === 'coping' && r.id.startsWith('bowl-coping') && BOWL_P && BOWL_P.kind === 'bowl') {
      const a0 = Math.atan2(r.a.u - BOWL_P.u, r.a.v - BOWL_P.v);
      let a1 = Math.atan2(r.b.u - BOWL_P.u, r.b.v - BOWL_P.v);
      if (a1 < a0 - 1e-9) a1 += Math.PI * 2;
      const rad = Math.hypot(r.a.u - BOWL_P.u, r.a.v - BOWL_P.v);
      const n = 3;
      for (let k = 0; k < n; k++) {
        const t0 = a0 + ((a1 - a0) * k) / n, t1 = a0 + ((a1 - a0) * (k + 1)) / n;
        const x0 = wx(BOWL_P.u + Math.sin(t0) * rad), z0 = wz(BOWL_P.v + Math.cos(t0) * rad);
        const x1 = wx(BOWL_P.u + Math.sin(t1) * rad), z1 = wz(BOWL_P.v + Math.cos(t1) * rad);
        add(x0, heightAt(x0, z0) + r.a.y - R, z0, x1, heightAt(x1, z1) + r.a.y - R, z1);
      }
    } else if (r.look === 'coping' || r.look === 'handrail') {
      const ax = wx(r.a.u), az = wz(r.a.v), bx = wx(r.b.u), bz = wz(r.b.v);
      const ay = heightAt(ax, az) + r.a.y - (r.look === 'coping' ? R : 0);
      const by = heightAt(bx, bz) + r.b.y - (r.look === 'coping' ? R : 0);
      add(ax, ay, az, bx, by, bz);
      if (r.look === 'handrail') {
        // Posts from the stair nosing (or platform) up to the rail.
        for (const f of [0, 1 / 3, 2 / 3, 1]) {
          const x = ax + (bx - ax) * f, z = az + (bz - az) * f, y = ay + (by - ay) * f;
          const base = heightAt(x, z) + parkHeight(x, z) + SURF_LIFT;
          if (y - base > 0.05) add(x, base, z, x, y, z, 0.025);
        }
      }
    }
  }
  if (!parts.length) return null;
  const merged = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  if (!merged) return null;
  const mesh = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ color: STEEL, metalness: 0.5, roughness: 0.45 }));
  mesh.name = 'skate-pipes';
  return mesh;
}

function railPrefab(r: SkateRailDef): THREE.Object3D | null {
  if (r.look !== 'prefab' || !r.prefab) return null;
  const ax = wx(r.a.u), az = wz(r.a.v), bx = wx(r.b.u), bz = wz(r.b.v);
  const o = buildPrefab(r.prefab);
  const x = (ax + bx) / 2, z = (az + bz) / 2;
  o.position.set(x, heightAt(x, z) + PAD_LIFT, z);
  o.rotation.y = Math.atan2(-(bz - az), bx - ax);
  o.name = `skate-rail-${r.id}`;
  o.userData.skate = r.id;
  return o;
}

// ---- Graffiti --------------------------------------------------------------------------------------------------------

class Paint {
  pos: number[] = [];
  col: number[] = [];
  constructor(private ox: number, private oy: number, private oz: number, private tx: number, private tz: number, private sc: number) {}
  private v(s: number, y: number, c: THREE.Color): void {
    this.pos.push(this.ox + this.tx * s * this.sc, this.oy + y * this.sc, this.oz + this.tz * s * this.sc);
    this.col.push(c.r, c.g, c.b);
  }
  tri(a: [number, number], b: [number, number], c: [number, number], col: number): void {
    const k = new THREE.Color(col);
    this.v(a[0], a[1], k); this.v(b[0], b[1], k); this.v(c[0], c[1], k);
  }
  rect(cx: number, cy: number, w: number, h: number, col: number): void {
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    this.tri([x0, y0], [x1, y0], [x1, y1], col);
    this.tri([x0, y0], [x1, y1], [x0, y1], col);
  }
  disc(cx: number, cy: number, rx: number, ry: number, col: number, from = 0, to = Math.PI * 2, n = 12): void {
    for (let i = 0; i < n; i++) {
      const a = from + ((to - from) * i) / n, b = from + ((to - from) * (i + 1)) / n;
      this.tri([cx, cy], [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry], [cx + Math.cos(b) * rx, cy + Math.sin(b) * ry], col);
    }
  }
}

type Art = 'acorn' | 'crown' | 'gb';

/** One piece of graffiti at world point (x, z) on a wall with outward normal (nx, nz), its centre `y` m up. */
function paint(art: Art, x: number, z: number, nx: number, nz: number, y: number, sc: number, out: { pos: number[]; col: number[] }): void {
  const tx = nz, tz = -nx;
  const ground = heightAt(x, z);
  const off = 0.02;
  const p = new Paint(x + nx * off, ground + y, z + nz * off, tx, tz, sc);
  if (art === 'acorn') {
    p.disc(0, -0.1, 0.3, 0.38, 0xb06a2c, Math.PI, Math.PI * 2, 10);   // nut
    p.disc(0, 0.0, 0.34, 0.26, 0x5a3a1c, 0, Math.PI, 10);              // cap
    p.rect(0, 0.3, 0.06, 0.14, 0x5a3a1c);                               // stem
  } else if (art === 'crown') {
    p.rect(0, -0.1, 0.8, 0.22, 0xf2c230);
    for (const s of [-0.3, 0, 0.3]) p.tri([s - 0.13, 0.01], [s + 0.13, 0.01], [s, 0.3], 0xf2c230);
    for (const s of [-0.3, 0, 0.3]) p.disc(s, 0.32, 0.04, 0.04, 0xd9453a, 0, Math.PI * 2, 6);
  } else {
    const white = 0xf4f1e6, hot = 0xe4572e;
    // G
    p.rect(-0.5, 0, 0.1, 0.6, white); p.rect(-0.35, 0.25, 0.3, 0.1, white); p.rect(-0.35, -0.25, 0.3, 0.1, white);
    p.rect(-0.2, -0.1, 0.1, 0.3, white); p.rect(-0.28, -0.05, 0.14, 0.08, white);
    // B
    p.rect(0.1, 0, 0.1, 0.6, hot); p.rect(0.3, 0.25, 0.3, 0.1, hot); p.rect(0.3, 0, 0.3, 0.1, hot); p.rect(0.3, -0.25, 0.3, 0.1, hot);
    p.rect(0.45, 0.125, 0.1, 0.2, hot); p.rect(0.45, -0.125, 0.1, 0.2, hot);
  }
  out.pos.push(...p.pos);
  out.col.push(...p.col);
}

function buildGraffiti(): THREE.Mesh {
  const out = { pos: [] as number[], col: [] as number[] };
  const gutter = SKATE_PIECES.find((p) => p.kind === 'halfpipe');
  if (gutter && gutter.kind === 'halfpipe') {
    const back = 1.5 + Math.sqrt(2.5 * 2.5 - 0.5 * 0.5) + 1.5;
    const zn = wz(gutter.v - back), zs = wz(gutter.v + back);
    paint('gb', wx(-10), zn, 0, -1, 1.1, 1, out);
    paint('acorn', wx(-3), zn, 0, -1, 1.0, 1, out);
    paint('crown', wx(6), zn, 0, -1, 1.1, 1, out);
    paint('acorn', wx(-8), zs, 0, 1, 1.0, 1, out);
    paint('gb', wx(4), zs, 0, 1, 1.1, 1, out);
  }
  if (BOWL_P && BOWL_P.kind === 'bowl') {
    const n = 48, R = BOWL_OUTER * Math.cos(Math.PI / n);
    for (const [k, art] of [[24, 'crown'], [36, 'acorn']] as const) {
      const th = ((k + 0.5) * Math.PI * 2) / n;
      const nx = Math.sin(th), nz = Math.cos(th);
      paint(art, wx(BOWL_P.u + nx * R), wz(BOWL_P.v + nz * R), nx, nz, 1.0, 0.7, out);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(out.col, 3));
  const mat = flatLayer(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }), LAYER.decal);
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = 'skate-graffiti';
  return mesh;
}

// ---- Everything ------------------------------------------------------------------------------------------------------

export function buildGutterBowls(scene: THREE.Scene): SkateBuild {
  const group = new THREE.Group();
  group.name = 'gutter-bowls';
  const boxes: Box[] = [];

  group.add(buildPad());

  // Ridable surfaces, one mesh per material, and their skirts.
  const surf = { gutter: new Mesher(), concrete: new Mesher() };
  const skirts = { gutter: new Mesher(), concrete: new Mesher() };
  for (const p of SKATE_PIECES) {
    for (const pt of patchesOf(p)) meshPatch(pt, surf[pt.kind], skirts[pt.kind]);
  }
  for (const kind of ['gutter', 'concrete'] as const) {
    for (const [set, name] of [[surf, 'surface'], [skirts, 'skirt']] as const) {
      const m = set[kind];
      if (m.empty) continue;
      const mesh = new THREE.Mesh(m.geometry(), litMaterial());
      mesh.name = `skate-${name}-${kind}`;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }

  // Rails: prefabs, steel pipes.
  for (const r of SKATE_RAILS) {
    const o = railPrefab(r);
    if (o) group.add(o);
  }
  const pipes = buildPipes();
  if (pipes) group.add(pipes);

  // Prefab pieces: the ledge and Fennel's deck stand on their piece, bottom centre on the ground.
  for (const p of SKATE_PIECES) {
    if (p.kind !== 'box' || !p.prefab) continue;
    const o = buildPrefab(p.prefab);
    const x = wx(p.u), z = wz(p.v);
    o.position.set(x, heightAt(x, z) + PAD_LIFT, z);
    o.name = `skate-piece-${p.id}`;
    o.userData.skate = p.id;
    group.add(o);
  }

  // Brackets on the outside of the Long Gutter's deck backs and round the bowl (decoration, no colliders).
  const brackets: StaticPrefabPlacement[] = [];
  const gutter = SKATE_PIECES.find((p) => p.kind === 'halfpipe');
  if (gutter && gutter.kind === 'halfpipe') {
    const back = 1.5 + Math.sqrt(2.5 * 2.5 - 0.5 * 0.5) + 1.5;
    for (let u = gutter.u0 + 1.5; u < gutter.u1; u += 3) {
      for (const side of [-1, 1]) {
        const x = wx(u), z = wz(gutter.v + side * (back + 0.012));
        brackets.push({ id: 'gutter-bracket', x, y: heightAt(x, z) + PAD_LIFT, z, yaw: side < 0 ? Math.PI : 0 });
      }
    }
  }
  if (BOWL_P && BOWL_P.kind === 'bowl') {
    const n = 48, R = BOWL_OUTER * Math.cos(Math.PI / n) + 0.012;
    for (let k = 2; k < n; k += 4) {
      const th = ((k + 0.5) * Math.PI * 2) / n;
      if (Math.abs(th - Math.PI / 2) < 0.45) continue; // the bank comes in from the east
      const x = wx(BOWL_P.u + Math.sin(th) * R), z = wz(BOWL_P.v + Math.cos(th) * R);
      brackets.push({ id: 'gutter-bracket', x, y: heightAt(x, z) + PAD_LIFT, z, yaw: th });
    }
  }
  if (brackets.length) group.add(buildStaticCells(brackets, { lights: false, name: 'skate-brackets', cls: 'prop' }));

  // The Board Library rack at the north entrance.
  const rack = buildPrefab('board-library-rack');
  rack.position.set(BOARD_LIBRARY.x, heightAt(BOARD_LIBRARY.x, BOARD_LIBRARY.z) + PAD_LIFT, BOARD_LIBRARY.z);
  rack.rotation.y = BOARD_LIBRARY.yaw;
  rack.name = 'skate-board-library';
  group.add(rack);
  boxes.push({
    minX: BOARD_LIBRARY.x - 0.8, maxX: BOARD_LIBRARY.x + 0.8,
    minZ: BOARD_LIBRARY.z - 0.2, maxZ: BOARD_LIBRARY.z + 0.2,
    h: heightAt(BOARD_LIBRARY.x, BOARD_LIBRARY.z) + 1.1,
  });

  group.add(buildGraffiti());
  scene.add(group);
  return { boxes, group };
}
