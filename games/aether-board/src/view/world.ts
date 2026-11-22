// The ethereal plane, drawn: sky, fog, light, cel-shaded islands, kickers, rails, ley-lines, the gate, decor.
import * as THREE from 'three';
import { buildPrefab, buildPrefabInstances } from '@lawn/prefabs';
import { PALETTE, ISLAND_TOPS } from '../config';
import { GRADIENT, toonMat, addOutline, toonify } from './toon';
import { surfaceY, kickerHeight, groundAt, pipeY, runY } from '../world';
import type { Hazard, Island, Kicker, Pipe, Rail, World } from '../world';

export interface WorldView {
  update(dt: number, t: number, camPos: THREE.Vector3, flow: number): void;
  /** Remove everything createWorldView added to the scene (lights, sky, meshes) and free its GPU memory. */
  dispose(): void;
}

type V3 = [number, number, number];

/** Shared clock and flow: every shader reads these, so update() sets them once. */
const U = { time: { value: 0 }, flow: { value: 0 } };

const glowMat = new THREE.MeshBasicMaterial({
  color: PALETTE.cyan, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false,
});

// ---------------------------------------------------------------- helpers


/** A point on an island's ellipse: angle th, radius rad on the round island, stretched along the fall line. */
function ellX(isl: Island, th: number, rad: number): number {
  return isl.cx + isl.dx * Math.cos(th) * rad * isl.stretch + isl.dz * Math.sin(th) * rad;
}
function ellZ(isl: Island, th: number, rad: number): number {
  return isl.cz + isl.dz * Math.cos(th) * rad * isl.stretch - isl.dx * Math.sin(th) * rad;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Linear colour of a hex, times k. */
function rgb(hex: number, k = 1): V3 {
  const c = new THREE.Color(hex);
  return [c.r * k, c.g * k, c.b * k];
}

/** The world being drawn (set by createWorldView), so meshes use the same blended ground as the physics. */
let WORLD: World | null = null;
const yAt = (isl: Island, x: number, z: number): number => (WORLD ? runY(WORLD, isl, x, z) : null) ?? surfaceY(isl, x, z) ?? isl.baseY;

/** Collects triangles; each is wound so its normal points along the given want direction. */
class Builder {
  private p: V3[] = [];
  private c: V3[] = [];
  private tris: number[] = [];

  vert(p: V3, c: V3): number {
    this.p.push(p);
    this.c.push(c);
    return this.p.length - 1;
  }

  tri(a: number, b: number, c: number, want: V3): void {
    const A = this.p[a];
    const B = this.p[b];
    const C = this.p[c];
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
    const vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    if (nx * want[0] + ny * want[1] + nz * want[2] < 0) this.tris.push(a, c, b);
    else this.tris.push(a, b, c);
  }

  /** flat: hard-edged normals (one vertex per corner). */
  build(flat: boolean): THREE.BufferGeometry {
    const pos = new Float32Array(this.p.length * 3);
    const col = new Float32Array(this.c.length * 3);
    this.p.forEach((p, i) => pos.set(p, i * 3));
    this.c.forEach((c, i) => col.set(c, i * 3));
    let g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(this.tris);
    if (flat) g = g.toNonIndexed();
    g.computeVertexNormals();
    return g;
  }
}

// ---------------------------------------------------------------- islands

/** Snow theme (Descent): white snow tops, grey rock on steep ground, grey-blue undersides. */
const SNOW_TOP = 0xf4f8ff;
const SNOW_ROCK = 0x6d6a7a;
const SNOW_UNDER = 0x5b6478;

/** Snow colour at shade k: a touch bluer where it is darker. */
function snowCol(k: number): V3 {
  const c = rgb(SNOW_TOP, k);
  c[2] = Math.min(1, c[2] + Math.max(0, 1 - k) * 0.5);
  return c;
}

/** Polar grid top of one island, lit by its ISLAND_TOPS colour with noise and a darker outer ring. */
function buildTop(isl: Island, snow: boolean): THREE.Mesh {
  // A grid down the run: rows every STEP metres along it, COLS columns across its width there (runs are long).
  const STEP = 2.5;
  const COLS = 48;
  const ra = isl.r * isl.stretch;
  const b = new Builder();
  const rnd = rng(isl.id * 7919 + 17);
  const base = ISLAND_TOPS[isl.color % ISLAND_TOPS.length];
  const up: V3 = [0, 1, 0];
  const n = Math.max(8, Math.ceil((2 * ra) / STEP));
  const grid: { x: number; y: number; z: number; k: number }[][] = [];
  for (let i = 0; i <= n; i++) {
    const al = -ra * 0.999 + (i / n) * ra * 1.998;
    const half = isl.r * 0.998 * Math.sqrt(Math.max(0, 1 - (al / ra) ** 2));
    const row: { x: number; y: number; z: number; k: number }[] = [];
    for (let j = 0; j <= COLS; j++) {
      const sd = -half + (j / COLS) * 2 * half;
      const x = isl.cx + isl.dx * al + isl.dz * sd;
      const z = isl.cz + isl.dz * al - isl.dx * sd;
      const edge = half > 0 ? Math.abs(sd) / half : 1;
      const k = (1 + (rnd() * 2 - 1) * 0.06) * (edge > 0.92 ? 0.75 : 1);
      row.push({ x, y: yAt(isl, x, z), z, k });
    }
    grid.push(row);
  }
  // Snow: grey rock where the ground drops more than 2 m across one row (cliff faces), white snow elsewhere.
  const rows: number[][] = grid.map((row, i) =>
    row.map((p, j) => {
      let col = rgb(base, p.k);
      if (snow) {
        const steep =
          (i > 0 && Math.abs(p.y - grid[i - 1][j].y) > 2) || (i < n && Math.abs(grid[i + 1][j].y - p.y) > 2);
        col = steep ? rgb(SNOW_ROCK, p.k) : snowCol(p.k);
      }
      return b.vert([p.x, p.y, p.z], col);
    }),
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < COLS; j++) {
      const a = rows[i][j];
      const bb = rows[i][j + 1];
      const c = rows[i + 1][j];
      const d = rows[i + 1][j + 1];
      b.tri(a, bb, c, up);
      b.tri(bb, d, c, up);
    }
  }
  return new THREE.Mesh(b.build(false), toonMat(0xffffff, { vertexColors: true }));
}

/** Jagged crystal underside, a rim band, and crystal shards stuck in the cone. */
function buildUnderside(isl: Island, snow: boolean): THREE.Group {
  const SEG = 24;
  const g = new THREE.Group();
  const rnd = rng(isl.id * 104729 + 3);
  const base = ISLAND_TOPS[isl.color % ISLAND_TOPS.length];
  const rimY: number[] = [];
  for (let j = 0; j < SEG; j++) {
    const th = (j / SEG) * Math.PI * 2;
    rimY.push(yAt(isl, ellX(isl, th, isl.r * 0.998), ellZ(isl, th, isl.r * 0.998)));
  }
  // The tip hangs well below the lowest point of the rim (long runs drop a lot from top to bottom).
  const tipY = Math.min(...rimY) - isl.r * 1.1;
  const topAvg = rimY.reduce((s, y) => s + y, 0) / SEG;

  // Cone: levels 0..3 are rings (level 0 at the rim), then the tip.
  const cone = new Builder();
  const lv: number[][] = [];
  for (let k = 0; k < 4; k++) {
    const row: number[] = [];
    const col = snow ? SNOW_UNDER : k % 2 === 0 ? PALETTE.purple : PALETTE.lilac;
    const f = k / 4;
    for (let j = 0; j < SEG; j++) {
      const th = (j / SEG) * Math.PI * 2;
      const top = rimY[j] - 0.2;
      if (k === 0) {
        row.push(cone.vert([ellX(isl, th, isl.r), top, ellZ(isl, th, isl.r)], rgb(col)));
      } else {
        const rad = isl.r * (1 - f) * (0.85 + 0.3 * rnd());
        const y = top + (tipY - top) * f + (rnd() * 2 - 1) * 1.5;
        row.push(cone.vert([ellX(isl, th, rad), y, ellZ(isl, th, rad)], rgb(col)));
      }
    }
    lv.push(row);
  }
  const tip = cone.vert([isl.cx, tipY, isl.cz], rgb(snow ? SNOW_UNDER : PALETTE.purple));
  const depth = topAvg - tipY;
  for (let j = 0; j < SEG; j++) {
    const j1 = (j + 1) % SEG;
    const m = ((j + 0.5) / SEG) * Math.PI * 2;
    const want: V3 = [Math.cos(m) * depth, -isl.r, Math.sin(m) * depth];
    for (let k = 0; k < 3; k++) {
      cone.tri(lv[k][j], lv[k][j1], lv[k + 1][j], want);
      cone.tri(lv[k][j1], lv[k + 1][j1], lv[k + 1][j], want);
    }
    cone.tri(lv[3][j], lv[3][j1], tip, want);
  }
  const coneMesh = new THREE.Mesh(cone.build(true), toonMat(0xffffff, { vertexColors: true }));
  addOutline(coneMesh, 0.35);
  g.add(coneMesh);

  // Rim band: a 1.2 m open ring under the rim edge, darkened island colour.
  const band = new Builder();
  const bandCol = snow ? rgb(SNOW_UNDER) : rgb(base, 0.6);
  const top: number[] = [];
  const bot: number[] = [];
  for (let j = 0; j < SEG; j++) {
    const th = (j / SEG) * Math.PI * 2;
    const x = ellX(isl, th, isl.r);
    const z = ellZ(isl, th, isl.r);
    top.push(band.vert([x, rimY[j], z], bandCol));
    bot.push(band.vert([x, rimY[j] - 1.2, z], bandCol));
  }
  for (let j = 0; j < SEG; j++) {
    const j1 = (j + 1) % SEG;
    const m = ((j + 0.5) / SEG) * Math.PI * 2;
    const want: V3 = [Math.cos(m), 0, Math.sin(m)];
    band.tri(top[j], bot[j], top[j1], want);
    band.tri(top[j1], bot[j], bot[j1], want);
  }
  const bandMesh = new THREE.Mesh(band.build(false), toonMat(0xffffff, { vertexColors: true }));
  addOutline(bandMesh, 0.15);
  g.add(bandMesh);

  // Crystal shards stuck into the cone.
  const n = 4 + Math.floor(rnd() * 4);
  for (let s = 0; s < n; s++) {
    const t = 0.15 + rnd() * 0.6;
    const ang = rnd() * Math.PI * 2;
    const rad = isl.r * (1 - t) * 0.95;
    const y = topAvg - 0.2 - t * (topAvg - 0.2 - tipY);
    const size = 1.2 + rnd() * 1.3;
    const colr = s % 2 === 0 ? PALETTE.cyan : PALETTE.pink;
    const geo = new THREE.OctahedronGeometry(size, 0);
    geo.scale(0.4, 1, 0.4);
    const m = new THREE.Mesh(
      geo,
      snow ? toonMat(SNOW_UNDER) : toonMat(colr, { emissive: colr, emissiveIntensity: 0.25 }),
    );
    m.position.set(ellX(isl, ang, rad), y, ellZ(isl, ang, rad));
    m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    addOutline(m, 0.09);
    g.add(m);
  }
  return g;
}

/** A kicker ramp: the top grid sampled from the physics surface, lip and side walls down to the island. */
function buildKicker(isl: Island, k: Kicker): THREE.Mesh {
  const fx = Math.sin(k.yaw);
  const fz = Math.cos(k.yaw);
  const nu = Math.max(1, Math.ceil(k.len / 0.5));
  const nv = Math.max(1, Math.ceil(k.width / 0.5));
  const hw = k.width / 2;
  const base = k.big ? PALETTE.pink : PALETTE.cyan;
  const stripe = k.big ? PALETTE.yellow : 0xffffff;
  const b = new Builder();
  const xz = (u: number, v: number): [number, number] => [k.x + fx * u + fz * v, k.z + fz * u - fx * v];
  const top = (u: number, v: number): V3 => {
    const [x, z] = xz(u, v);
    return [x, yAt(isl, x, z) + 0.03, z];
  };
  // Surface without this kicker: the bottom of the walls.
  const low = (u: number, v: number): V3 => {
    const [x, z] = xz(u, v);
    return [x, yAt(isl, x, z) - kickerHeight(k, x, z), z];
  };
  const UP: V3 = [0, 1, 0];

  const grid: number[][] = [];
  for (let i = 0; i <= nu; i++) {
    const u = (k.len * i) / nu;
    const colr = Math.floor(i / 2) % 2 === 1 ? stripe : base;
    const row: number[] = [];
    for (let j = 0; j <= nv; j++) row.push(b.vert(top(u, -hw + (k.width * j) / nv), rgb(colr)));
    grid.push(row);
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      b.tri(grid[i][j], grid[i][j + 1], grid[i + 1][j], UP);
      b.tri(grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j], UP);
    }
  }

  // A vertical strip of walls along a line of (u, v) points.
  const wallCol = rgb(base, 0.9);
  const strip = (uv: [number, number][], want: V3): void => {
    const T = uv.map(([u, v]) => b.vert(top(u, v), wallCol));
    const B = uv.map(([u, v]) => b.vert(low(u, v), wallCol));
    for (let i = 0; i < uv.length - 1; i++) {
      b.tri(T[i], B[i], T[i + 1], want);
      b.tri(T[i + 1], B[i], B[i + 1], want);
    }
  };
  const alongU = (v: number): [number, number][] =>
    Array.from({ length: nu + 1 }, (_, i) => [(k.len * i) / nu, v] as [number, number]);
  strip(alongU(-hw), [-fz, 0, fx]);
  strip(alongU(hw), [fz, 0, -fx]);
  strip(Array.from({ length: nv + 1 }, (_, j) => [k.len, -hw + (k.width * j) / nv] as [number, number]), [fx, 0, fz]);

  const mesh = new THREE.Mesh(b.build(false), toonMat(0xffffff, { vertexColors: true }));
  addOutline(mesh, 0.09);
  return mesh;
}

// ---------------------------------------------------------------- halfpipes

/** Coping glow, shared by every pipe so update() pulses them together. */
const pipeGlowMat = new THREE.MeshBasicMaterial({
  color: PALETTE.cyan, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false,
});

const lin = (c: THREE.Color): V3 => [c.r, c.g, c.b];

/** Cross-section samples (v): 14 steps up each wall, 12 across the floor, so the floor edges fall on grid lines. */
function pipeCols(pp: Pipe): number[] {
  const w = pp.halfW - pp.flatHalf;
  const vs: number[] = [];
  for (let k = 0; k < 14; k++) vs.push(-pp.halfW + (k * w) / 14);
  for (let k = 0; k < 12; k++) vs.push(-pp.flatHalf + (k * 2 * pp.flatHalf) / 12);
  for (let k = 0; k <= 14; k++) vs.push(pp.flatHalf + (k * w) / 14);
  return vs;
}

/** Along-pipe rows (u): every metre, plus the stripe edges (yellow every 6 m, 1.2 m wide). An edge gets two rows at
 *  the same u, so its colour cut is sharp. */
function pipeRows(len: number): { u: number; stripe: boolean }[] {
  const stripeAt = (u: number): boolean => u % 6 < 1.2;
  const pts: number[] = [];
  for (let k = 0; k < Math.ceil(len); k++) pts.push(k);
  pts.push(len);
  for (let k = 0; 6 * k < len; k++) pts.push(6 * k, 6 * k + 1.2);
  pts.sort((a, b) => a - b);
  const P = pts.filter((p, i) => p <= len && (i === 0 || p - pts[i - 1] > 1e-6));
  const flag = (i: number): boolean => stripeAt((P[i] + P[i + 1]) / 2);
  const rows: { u: number; stripe: boolean }[] = [];
  for (let i = 0; i < P.length; i++) {
    const before = i > 0 ? flag(i - 1) : null;
    const after = i < P.length - 1 ? flag(i) : null;
    rows.push({ u: P[i], stripe: before ?? after ?? false });
    if (before !== null && after !== null && after !== before) rows.push({ u: P[i], stripe: after });
  }
  return rows;
}

/** Surface height from the pipe's own formula (same as pipeY, without the footprint test). */
function pipeSurf(pp: Pipe, u: number, v: number): number {
  const av = Math.abs(v);
  const wall = av > pp.flatHalf ? pp.wallH * ((av - pp.flatHalf) / (pp.halfW - pp.flatHalf)) ** pp.exp : 0;
  return pp.y0 - pp.slope * u + wall;
}

/** World (x, z) of pipe-local (u, v): f = (sin yaw, 0, cos yaw), r = (−cos yaw, 0, sin yaw). */
function pipeXZ(pp: Pipe, u: number, v: number): [number, number] {
  const fx = Math.sin(pp.yaw);
  const fz = Math.cos(pp.yaw);
  return [pp.sx + fx * u - fz * v, pp.sz + fz * u + fx * v];
}

/** One halfpipe: the channel, its outer shell, glowing coping along both lips, and crystal supports below. */
function buildPipe(pp: Pipe, index: number): THREE.Group {
  const g = new THREE.Group();
  const rnd = rng(index * 3331 + 11);
  const fx = Math.sin(pp.yaw);
  const fz = Math.cos(pp.yaw);
  const cols = pipeCols(pp);
  const rows = pipeRows(pp.len);
  const nc = cols.length;
  const floorC = rgb(0x7a5cff);
  const yellowC = rgb(PALETTE.yellow);
  const pinkC = new THREE.Color(PALETTE.pink);
  const white = new THREE.Color(0xffffff);
  const floorY = (u: number): number => pp.y0 - pp.slope * u;

  // Channel: a grid over (rows, cols), each cell oriented to face into the pipe.
  const b = new Builder();
  const grid: number[][] = [];
  for (const row of rows) {
    const line: number[] = [];
    for (let c = 0; c < nc; c++) {
      const v = cols[c];
      const [x, z] = pipeXZ(pp, row.u, v);
      const y = (pipeY(pp, x, z) ?? pipeSurf(pp, row.u, v)) + 0.02;
      let col: V3;
      if (Math.abs(v) <= pp.flatHalf) col = floorC;
      else {
        const t = (Math.abs(v) - pp.flatHalf) / (pp.halfW - pp.flatHalf);
        col = row.stripe ? yellowC : lin(pinkC.clone().lerp(white, 0.4 * t));
      }
      line.push(b.vert([x, y, z], col));
    }
    grid.push(line);
  }
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < nc - 1; c++) {
      const vm = (cols[c] + cols[c + 1]) / 2;
      // Floor faces up; each wall faces into the pipe.
      const want: V3 = Math.abs(vm) <= pp.flatHalf ? [0, 1, 0] : vm > 0 ? [fz, 0, -fx] : [-fz, 0, fx];
      b.tri(grid[r][c], grid[r][c + 1], grid[r + 1][c], want);
      b.tri(grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c], want);
    }
  }
  g.add(new THREE.Mesh(b.build(false), toonMat(0xffffff, { vertexColors: true, side: THREE.DoubleSide })));

  // Outer shell: the back of each wall down to 3 m under the floor, and a flat bottom. Dark purple, inked.
  const sh = new Builder();
  const shellC = rgb(0x3b1d6b);
  const SHELL_DEPTH = 3;
  const OUT = 0.12;
  for (const s of [-1, 1]) {
    const v = s * (pp.halfW + OUT);
    const want: V3 = [-s * fz, 0, s * fx]; // outward
    const top: number[] = [];
    const bot: number[] = [];
    for (const row of rows) {
      const [x, z] = pipeXZ(pp, row.u, v);
      top.push(sh.vert([x, floorY(row.u) + pp.wallH, z], shellC));
      bot.push(sh.vert([x, floorY(row.u) - SHELL_DEPTH, z], shellC));
    }
    for (let i = 0; i < rows.length - 1; i++) {
      sh.tri(top[i], bot[i], top[i + 1], want);
      sh.tri(top[i + 1], bot[i], bot[i + 1], want);
    }
  }
  const bl: number[] = [];
  const br: number[] = [];
  for (const row of rows) {
    const yb = floorY(row.u) - SHELL_DEPTH;
    const [xl, zl] = pipeXZ(pp, row.u, -(pp.halfW + OUT));
    const [xr, zr] = pipeXZ(pp, row.u, pp.halfW + OUT);
    bl.push(sh.vert([xl, yb, zl], shellC));
    br.push(sh.vert([xr, yb, zr], shellC));
  }
  for (let i = 0; i < rows.length - 1; i++) {
    sh.tri(bl[i], br[i], bl[i + 1], [0, -1, 0]);
    sh.tri(bl[i + 1], br[i], br[i + 1], [0, -1, 0]);
  }
  const shell = new THREE.Mesh(sh.build(false), toonMat(0xffffff, { vertexColors: true, side: THREE.DoubleSide }));
  addOutline(shell, 0.15);
  g.add(shell);

  // Coping: a cyan tube along each lip, with a soft additive glow around it.
  const copingMat = toonMat(PALETTE.cyan, { emissive: PALETTE.cyan, emissiveIntensity: 1.2 });
  const segs = Math.max(8, Math.ceil(pp.len));
  for (const s of [-1, 1]) {
    const pts: THREE.Vector3[] = [];
    const n = Math.max(2, Math.ceil(pp.len / 2));
    for (let i = 0; i <= n; i++) {
      const u = (pp.len * i) / n;
      const [x, z] = pipeXZ(pp, u, s * pp.halfW);
      pts.push(new THREE.Vector3(x, floorY(u) + pp.wallH + 0.05, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const coping = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.18, 8), copingMat);
    addOutline(coping, 0.04);
    const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.5, 8), pipeGlowMat);
    g.add(coping, glow);
  }

  // Crystal supports: one every 20 m, hanging under the channel.
  for (let u = 10; u < pp.len - 5; u += 20) {
    const L = 20 + rnd() * 15;
    const geo = new THREE.OctahedronGeometry(1, 0);
    geo.scale(0.6, L / 2, 0.6);
    const m = new THREE.Mesh(geo, toonMat(PALETTE.lilac, { emissive: PALETTE.lilac, emissiveIntensity: 0.25 }));
    const [x, z] = pipeXZ(pp, u, 0);
    m.position.set(x, floorY(u) - 2.5 - L / 2, z);
    m.rotation.set((rnd() * 2 - 1) * 0.15, 0, (rnd() * 2 - 1) * 0.15);
    addOutline(m, 0.12);
    g.add(m);
  }
  return g;
}

// ---------------------------------------------------------------- hazards

/** Warning ring under every hazard, shared so update() pulses them together. */
const hazardRingMat = new THREE.MeshBasicMaterial({
  color: PALETTE.yellow, transparent: true, opacity: 0.7, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -2,
});

/** A Descent hazard: 5 to 7 glowing aether spikes leaning outward inside a yellow warning ring. */
function buildHazard(hz: Hazard, index: number): THREE.Group {
  const g = new THREE.Group();
  const rnd = rng(index * 6121 + 31);
  const isl = WORLD?.islands[hz.island];
  const ground = (x: number, z: number): number => (isl ? yAt(isl, x, z) : hz.y);
  const spikeMat = toonMat(0xff2d4b, { emissive: 0xff2d4b, emissiveIntensity: 0.3 });
  const n = 5 + Math.floor(rnd() * 3);
  for (let s = 0; s < n; s++) {
    const a = rnd() * Math.PI * 2;
    const dist = Math.sqrt(rnd()) * hz.r * 0.7;
    const x = hz.x + Math.cos(a) * dist;
    const z = hz.z + Math.sin(a) * dist;
    const radius = 0.35 + rnd() * 0.25;
    const height = hz.h * (0.6 + rnd() * 0.5);
    const lean = rnd() * 0.35;
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 5), spikeMat);
    mesh.position.set(x, ground(x, z) + height / 2 - 0.1, z);
    // Tilt the tip outward, away from the hazard centre.
    mesh.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean);
    addOutline(mesh, 0.06);
    g.add(mesh);
  }
  const ringGeo = new THREE.RingGeometry(hz.r, hz.r + 0.35, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, hazardRingMat);
  ring.position.set(hz.x, hz.y + 0.08, hz.z);
  ring.renderOrder = 1;
  g.add(ring);
  return g;
}

/** Island pine prefab: its height in prefab units (the top of its highest tier), so a copy scales to hz.h. */
const PINE_HEIGHT = 2.3;
/** Garden rock prefab: its radii in prefab units (the stone ball), so a copy scales to the hazard's size. */
const ROCK_RADIUS = { x: 0.35, y: 0.2625, z: 0.315 };

/** Every snowy pine (kind 'tree'), one island-pine prefab instanced per tree. */
function buildTrees(trees: Hazard[]): THREE.Group {
  const g = new THREE.Group();
  if (trees.length === 0) return g;
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const matrices = trees.map((hz, i) => {
    const rnd = rng(i * 7001 + 101);
    const isl = WORLD?.islands[hz.island];
    const ground = isl ? yAt(isl, hz.x, hz.z) : hz.y;
    const s = 0.9 + rnd() * 0.2;
    q.setFromAxisAngle(up, rnd() * Math.PI * 2);
    // Sunk 0.2 m into the ground, and scaled so the top reaches the hazard's height.
    const k = (hz.h * s) / PINE_HEIGHT;
    return new THREE.Matrix4().compose(new THREE.Vector3(hz.x, ground - 0.2, hz.z), q, new THREE.Vector3(k, k, k));
  });
  const pines = buildPrefabInstances('island-pine', matrices);
  toonify(pines, 0.045);
  pines.userData.shared = true;
  g.add(pines);
  return g;
}

/** Every boulder (kind 'rock'), one garden-rock prefab instanced per rock, sunk 0.3 m into the ground. */
function buildRocks(rocks: Hazard[]): THREE.Group {
  const g = new THREE.Group();
  if (rocks.length === 0) return g;
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion();
  const matrices = rocks.map((hz, i) => {
    const rnd = rng(i * 5233 + 77);
    const isl = WORLD?.islands[hz.island];
    const ground = isl ? yAt(isl, hz.x, hz.z) : hz.y;
    const sx = hz.r * (0.85 + rnd() * 0.3);
    const sy = hz.h * (0.85 + rnd() * 0.3);
    const sz = hz.r * 0.9 * (0.85 + rnd() * 0.3);
    q.setFromAxisAngle(up, rnd() * Math.PI * 2);
    const scl = new THREE.Vector3(sx / ROCK_RADIUS.x, sy / ROCK_RADIUS.y, sz / ROCK_RADIUS.z);
    return new THREE.Matrix4().compose(new THREE.Vector3(hz.x, ground - 0.3, hz.z), q, scl);
  });
  const rockGroup = buildPrefabInstances('garden-rock', matrices);
  toonify(rockGroup, 0.028);
  rockGroup.userData.shared = true;
  g.add(rockGroup);
  return g;
}

/** True for a node under a prefab group (marked userData.shared or userData.prefab): its geometry is the prefab's cache, never disposed. */
function isShared(o: THREE.Object3D): boolean {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p.userData.shared || p.userData.prefab) return true;
  return false;
}

/** Frees the GPU buffers and materials of everything under obj (three's dispose() is safe to repeat). */
function disposeTree(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (!(o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.Line)) return;
    if (isShared(o)) return;
    if (o instanceof THREE.InstancedMesh) o.dispose();
    o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) m.dispose();
  });
}

// ---------------------------------------------------------------- rails and ley-lines

const VERT_UV = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const LEY_FRAG = /* glsl */ `
  uniform float time;
  uniform float len;
  varying vec2 vUv;
  void main() {
    vec3 cyan = vec3(0.18, 0.89, 0.9);
    vec3 pink = vec3(1.0, 0.25, 0.64);
    vec3 base = mix(cyan, pink, vUv.x);
    float ph = fract(vUv.x * len / 6.0 - time * 1.5);
    float band = smoothstep(0.0, 0.2, ph) * (1.0 - smoothstep(0.2, 0.5, ph));
    vec3 col = base * (0.9 + 0.5 * band) + vec3(1.0) * band * 0.6;
    gl_FragColor = vec4(col, 1.0);
  }`;

function buildRail(w: World, rail: Rail): THREE.Group {
  const grp = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(rail.pts);
  const segs = Math.max(16, rail.pts.length * 2);
  if (!rail.ley) {
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segs, rail.side ? 0.095 : 0.08, 8),
      toonMat(PALETTE.yellow),
    );
    addOutline(tube, rail.side ? 0.05 : 0.045);
    grp.add(tube);
    // Support posts every 4 m, down to the island under each point (or cantilevered into the mountain side).
    const postMat = toonMat(0x3b1d6b);
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < rail.pts.length; i += 4) {
      const p = rail.pts[i];
      const ground = groundAt(w, p.x, p.z, p.y);
      if (ground || !rail.side) {
        const gy = ground ? ground.y : p.y - 1.1;
        const h = p.y - gy;
        if (h < 0.05) continue;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 6), postMat);
        post.position.set(p.x, (p.y + gy) / 2, p.z);
        addOutline(post, 0.02);
        grp.add(post);
      } else {
        // Cantilevered diagonal strut anchored back into the mountain side.
        let anchor: THREE.Vector3 | null = null;
        for (let d = 2; d <= 24; d += 2) {
          const ax = p.x - rail.side.outX * d;
          const az = p.z - rail.side.outZ * d;
          const g = groundAt(w, ax, az, p.y + 4);
          if (g) {
            anchor = new THREE.Vector3(ax, Math.min(p.y - 1.5, g.y - 1.2), az);
            break;
          }
        }
        if (!anchor) continue;
        const delta = p.clone().sub(anchor);
        const len = delta.length();
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, len, 6), postMat);
        strut.position.copy(anchor).addScaledVector(delta, 0.5);
        strut.quaternion.setFromUnitVectors(up, delta.normalize());
        addOutline(strut, 0.025);
        const mount = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), postMat);
        mount.position.copy(anchor);
        grp.add(strut, mount);
      }
    }
  } else {
    const core = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segs, 0.22, 8),
      new THREE.ShaderMaterial({
        uniforms: { time: U.time, len: { value: rail.len } },
        vertexShader: VERT_UV,
        fragmentShader: LEY_FRAG,
        fog: false,
      }),
    );
    const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.7, 8), glowMat);
    grp.add(core, glow);
  }
  return grp;
}

// ---------------------------------------------------------------- gate

const GATE_FRAG = /* glsl */ `
  uniform float time;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x);
    float sw = sin(a * 3.0 + r * 9.0 - time * 3.0);
    vec3 c = mix(vec3(1.0, 0.25, 0.64), vec3(0.18, 0.89, 0.9), 0.5 + 0.5 * sin(a * 2.0 - time));
    c = mix(c, vec3(1.0, 0.88, 0.3), smoothstep(0.6, 1.0, sw));
    float alpha = (0.35 + 0.35 * sw) * (1.0 - smoothstep(0.7, 1.0, r));
    gl_FragColor = vec4(c, alpha);
  }`;

// ---------------------------------------------------------------- sky

const SKY_FRAG = /* glsl */ `
  uniform float time;
  uniform float flow;
  varying vec3 vDir;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }

  float ribbon(float y, float az, float yc, float w, float ph) {
    float wave = yc + 0.08 * sin(az * 3.0 + ph + time * 0.15);
    float q = (y - wave) / w;
    return exp(-q * q) * (0.6 + 0.4 * sin(az * 7.0 - time * 0.4 + ph));
  }

  void main() {
    vec3 d = normalize(vDir);
    float y = d.y;
    vec3 peach = vec3(1.0, 0.839, 0.647);
    vec3 pink = vec3(1.0, 0.31, 0.627);
    vec3 purple = vec3(0.482, 0.184, 0.969);
    vec3 violet = vec3(0.169, 0.039, 0.478);
    vec3 cyan = vec3(0.176, 0.886, 0.902);
    vec3 teal = vec3(0.024, 0.188, 0.42);
    vec3 lime = vec3(0.714, 1.0, 0.231);

    vec3 c;
    if (y >= 0.0) {
      c = y < 0.06 ? mix(peach, pink, y / 0.06)
        : y < 0.35 ? mix(pink, purple, (y - 0.06) / 0.29)
        : mix(purple, violet, clamp((y - 0.35) / 0.65, 0.0, 1.0));
    } else {
      c = y > -0.06 ? mix(peach, cyan, -y / 0.06)
        : mix(cyan, teal, clamp((-y - 0.06) / 0.44, 0.0, 1.0));
    }

    // Stars: one per hashed cell of the direction, above the horizon.
    vec3 g = d * 160.0;
    float r = hash(floor(g));
    float core = 1.0 - smoothstep(0.0, 0.3, length(fract(g) - 0.5));
    float star = step(0.985, r) * core * (0.7 + 0.3 * sin(time * 2.0 + r * 60.0));
    c += vec3(1.0, 0.97, 0.9) * star * smoothstep(0.25, 0.5, y);

    // Aurora ribbons.
    float az = atan(d.z, d.x);
    float k = 0.6 + 0.8 * flow;
    float up = smoothstep(0.12, 0.3, y);
    c += (pink * ribbon(y, az, 0.5, 0.06, 0.0)
        + cyan * ribbon(y, az, 0.6, 0.05, 2.1)
        + lime * ribbon(y, az, 0.42, 0.04, 4.2)) * 0.9 * k * up;

    // Aether sun, low and ahead.
    vec3 sunDir = normalize(vec3(0.35, 0.14, 0.92));
    float a = 1.0 - dot(d, sunDir);
    float disc = 1.0 - smoothstep(0.0022, 0.0028, a);
    float halo = exp(-a * 40.0) * 0.9 + exp(-a * 6.0) * 0.3;
    c = mix(c, vec3(1.0, 0.97, 0.85), disc);
    c += vec3(1.0, 0.82, 0.6) * halo;

    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, 1.0 + 0.25 * flow);
    gl_FragColor = vec4(c, 1.0);
  }`;

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

// ---------------------------------------------------------------- view

export function createWorldView(scene: THREE.Scene, w: World): WorldView {
  WORLD = w;
  // Everything this view puts into the scene, so dispose() can take it out again.
  const owned: THREE.Object3D[] = [];
  const add = (o: THREE.Object3D): void => {
    scene.add(o);
    owned.push(o);
  };
  // Snow (Descent) is a pale-blue mountain; free ride keeps its pink aether sky.
  const snow = w.theme === 'snow';
  const skyCol = snow ? 0xcfe6ff : 0xff9ad5;
  scene.background = new THREE.Color(skyCol);
  scene.fog = snow ? new THREE.Fog(skyCol, 140, 1100) : new THREE.Fog(skyCol, 160, 1300);
  add(new THREE.HemisphereLight(0xfff5ff, snow ? 0x6b93d6 : 0x6b35d6, 0.7));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(0.65, 0.85, 0.4);
  add(sun);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1800, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  // The aether sky shader is pink-only, so snow hides the dome and shows the pale-blue background.
  sky.visible = !snow;
  add(sky);

  const root = new THREE.Group();
  add(root);

  for (const isl of w.islands) {
    root.add(buildTop(isl, snow), buildUnderside(isl, snow));
    for (const k of isl.kickers) root.add(buildKicker(isl, k));
  }
  const POP_DIST = 9;
  const popRails: { grp: THREE.Group; center: THREE.Vector3; outX: number; outZ: number; t: number; popped: boolean }[] = [];
  for (const rail of w.rails) {
    const grp = buildRail(w, rail);
    if (rail.side) {
      grp.position.set(-rail.side.outX * POP_DIST, 0, -rail.side.outZ * POP_DIST);
      popRails.push({ grp, center: rail.center, outX: rail.side.outX, outZ: rail.side.outZ, t: 0, popped: false });
    }
    root.add(grp);
  }
  w.pipes.forEach((pp, i) => root.add(buildPipe(pp, i)));
  w.hazards.forEach((hz, i) => {
    if (hz.kind === 'spike') root.add(buildHazard(hz, i));
  });
  root.add(buildTrees(w.hazards.filter((hz) => hz.kind === 'tree')));
  root.add(buildRocks(w.hazards.filter((hz) => hz.kind === 'rock')));

  // Gate: a hue-cycling torus with a swirling disc in its hole.
  const gate = new THREE.Group();
  gate.position.copy(w.gate.pos);
  gate.rotation.y = w.gate.yaw;
  const ringMat = new THREE.MeshToonMaterial({
    color: 0xffffff, emissive: PALETTE.pink, emissiveIntensity: 1, gradientMap: GRADIENT,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(w.gate.r, 1.4, 12, 64), ringMat);
  addOutline(ring, 0.25);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(w.gate.r - 1, 48),
    new THREE.ShaderMaterial({
      uniforms: { time: U.time },
      vertexShader: VERT_UV,
      fragmentShader: GATE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  gate.add(ring, disc);
  root.add(gate);

  // Decor: rocks, crystals and clouds around each gap. Each bobs with its own phase.
  const decorObjs: { obj: THREE.Object3D; y: number; phase: number; rot: number; spin: boolean }[] = [];
  const crystalCols = [PALETTE.pink, PALETTE.cyan, PALETTE.yellow];
  w.decor.forEach((d, i) => {
    const rnd = rng(i * 977 + 5);
    const obj = new THREE.Group();
    obj.position.set(d.x, d.y, d.z);
    if (d.kind === 'rock') {
      // A garden rock, centred on the decor point (its base sits 0.26 prefab units up from its origin).
      const k = d.s / ROCK_RADIUS.x;
      const m = buildPrefab('garden-rock', { scale: k });
      toonify(m, 0.028, snow ? {} : { color: PALETTE.lilac });
      m.position.y = -ROCK_RADIUS.y * k;
      m.userData.shared = true;
      obj.add(m);
    } else if (d.kind === 'crystal') {
      // An aether crystal (two cones, point to point), centred on the decor point.
      const col = crystalCols[i % crystalCols.length];
      const m = buildPrefab('aether-crystal', { tint: col, scale: d.s });
      toonify(m, 0.06, { includeBasic: true, color: col, emissive: col, emissiveIntensity: 0.25 });
      m.position.y = -d.s;
      m.userData.shared = true;
      obj.add(m);
    } else {
      for (let c = 0; c < 5; c++) {
        const r = d.s * (0.5 + rnd() * 0.4);
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), toonMat(0xfff0fb));
        m.position.set((rnd() * 2 - 1) * d.s * 0.8, (rnd() * 2 - 1) * d.s * 0.2, (rnd() * 2 - 1) * d.s * 0.6);
        obj.add(m);
      }
    }
    root.add(obj);
    decorObjs.push({ obj, y: d.y, phase: rnd() * Math.PI * 2, rot: d.rot, spin: d.kind !== 'cloud' });
  });

  // Sparkles: 700 points in a 160 m box that follows the camera.
  const N = 700;
  const sparkPos = new Float32Array(N * 3);
  const sparkCol = new Float32Array(N * 3);
  const srnd = rng(4242);
  const pal = [PALETTE.pink, PALETTE.cyan, PALETTE.lime, PALETTE.yellow, PALETTE.lilac].map((c) => rgb(c));
  for (let i = 0; i < N; i++) {
    const o = i * 3;
    sparkPos[o] = (srnd() - 0.5) * 160;
    sparkPos[o + 1] = (srnd() - 0.5) * 160;
    sparkPos[o + 2] = (srnd() - 0.5) * 160;
    const c = pal[Math.floor(srnd() * pal.length)];
    sparkCol[o] = c[0];
    sparkCol[o + 1] = c[1];
    sparkCol[o + 2] = c[2];
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkCol, 3));
  const sparkles = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, sizeAttenuation: true,
    }),
  );
  sparkles.frustumCulled = false;
  root.add(sparkles);
  // Sparkles and the gate live under root; root is tracked, so dispose() reaches them.

  // Offset from the camera, wrapped into [-80, 80].
  const wrap = (d: number): number => d - 160 * Math.round(d / 160);

  return {
    update(dt, t, camPos, flow) {
      U.time.value = t;
      U.flow.value = flow;
      sky.position.copy(camPos);
      ring.rotation.z = t * 0.4;
      disc.rotation.z = -t * 0.6;
      ringMat.emissive.setHSL((t * 0.08) % 1, 1, 0.5);
      pipeGlowMat.opacity = 0.2 + 0.06 * Math.sin(t * 2.2);
      hazardRingMat.opacity = 0.55 + 0.15 * Math.sin(t * 3);
      for (const d of decorObjs) {
        d.obj.position.y = d.y + Math.sin(t * 0.35 + d.phase) * 1.5;
        if (d.spin) d.obj.rotation.y = d.rot + t * 0.2;
      }
      for (const pr of popRails) {
        if (!pr.popped && camPos.distanceTo(pr.center) < 120) pr.popped = true;
        if (pr.popped && pr.t < 1) {
          pr.t = Math.min(1, pr.t + dt / 0.45);
          const c1 = 1.70158;
          const x = pr.t - 1;
          const ease = 1 + (c1 + 1) * x * x * x + c1 * x * x;
          const shift = -POP_DIST * (1 - ease);
          pr.grp.position.set(pr.outX * shift, 0, pr.outZ * shift);
        }
      }
      for (let i = 0; i < N; i++) {
        const o = i * 3;
        sparkPos[o + 1] += dt * 0.4;
        sparkPos[o] = camPos.x + wrap(sparkPos[o] - camPos.x);
        sparkPos[o + 1] = camPos.y + wrap(sparkPos[o + 1] - camPos.y);
        sparkPos[o + 2] = camPos.z + wrap(sparkPos[o + 2] - camPos.z);
      }
      sparkGeo.attributes.position.needsUpdate = true;
    },
    dispose() {
      for (const o of owned) {
        scene.remove(o);
        disposeTree(o);
      }
      owned.length = 0;
      scene.fog = null;
      scene.background = null;
    },
  };
}
