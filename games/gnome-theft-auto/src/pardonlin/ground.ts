// Pardonlin's laid ground (FX09, D9), built: pavements, kerbs, footpaths and the district plans' patches as draped
// decal meshes (groundPlan.ts says what goes where). One merged mesh per surface and draw layer per culling cell, on
// procedural stone textures (self-generated). Flat decals take @lawn/depth layers, never just a lift.
import * as THREE from 'three';
import { flatLayer } from '@lawn/depth';
import { registerCull, STATIC_CELL } from '../cull';
import { heightAt, normalAt } from '../terrain';
import { footpathStrips, patchStrip, pavementStrips, type GroundPatch, type PavingKind, type Row, type Strip } from './groundPlan';

/** Lifts grow with the layer (never a lower layer above a higher one); roads sit at 0.02 on 'road'. */
const LIFT = { tint: 0.008, area: 0.014, edge: 0.026 } as const;
/** World metres one texture tile covers, per surface. */
const TILE_M: Record<PavingKind, number> = { flags: 4, setts: 2.4, cobble: 2.4, gravel: 4, kerb: 2, quay: 4 };
/** Vertex spacing across a strip and inside patches (m): at most the terrain grid's step. */
const ACROSS = 1.6;

// ---- Textures ---------------------------------------------------------------------------------------------------------
const SIZE = 512;
const textures = new Map<PavingKind, THREE.CanvasTexture>();

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

/** A stone colour near `base` (r, g, b 0..255), varied by `v` (-1..1). */
function stone(base: [number, number, number], v: number): string {
  const f = (c: number): number => Math.max(0, Math.min(255, Math.round(c * (1 + v * 0.12))));
  return `rgb(${f(base[0])},${f(base[1])},${f(base[2])})`;
}

function makeTexture(kind: PavingKind): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const g = cv.getContext('2d')!;
  const r = rng(kind.length * 131 + kind.charCodeAt(0) * 7);
  /** Draw at (x, y) and its wrapped copies so the tile repeats seamlessly. */
  const wrapped = (fn: (ox: number, oy: number) => void): void => {
    for (const ox of [-SIZE, 0, SIZE]) for (const oy of [-SIZE, 0, SIZE]) fn(ox, oy);
  };
  const grain = (n: number, alpha: number, light: string, dark: string): void => {
    for (let i = 0; i < n; i++) {
      g.globalAlpha = alpha * r();
      g.fillStyle = r() < 0.5 ? light : dark;
      g.fillRect(r() * SIZE, r() * SIZE, 1 + r() * 2, 1 + r() * 2);
    }
    g.globalAlpha = 1;
  };
  if (kind === 'flags' || kind === 'quay') {
    // Pale limestone flags in staggered courses, mortar lines between. Quay flags are larger and greyer.
    const base: [number, number, number] = kind === 'quay' ? [178, 172, 160] : [196, 186, 166];
    g.fillStyle = kind === 'quay' ? '#8c857a' : '#9a8f7c';
    g.fillRect(0, 0, SIZE, SIZE);
    const courses = kind === 'quay' ? 4 : 5;
    const ch = SIZE / courses;
    for (let row = 0; row < courses; row++) {
      let x = (row % 2) * (SIZE / 7) - SIZE / 7;
      while (x < SIZE) {
        const w = SIZE / 6 + r() * (SIZE / 5);
        const x0 = x, cw = Math.min(w, SIZE - x0 + SIZE / 7);
        const col = stone(base, r() * 2 - 1);
        wrapped((ox, oy) => {
          g.fillStyle = col;
          g.fillRect(x0 + 3 + ox, row * ch + 3 + oy, cw - 6, ch - 6);
        });
        x += w;
      }
    }
    grain(9000, 0.18, '#ffffff', '#5a5246');
  } else if (kind === 'setts' || kind === 'cobble') {
    // Granite setts in rows (setts) or rounded cobbles (cobble), dark joints.
    const base: [number, number, number] = kind === 'setts' ? [150, 146, 140] : [158, 146, 128];
    g.fillStyle = kind === 'setts' ? '#55524c' : '#5a5144';
    g.fillRect(0, 0, SIZE, SIZE);
    const n = kind === 'setts' ? 16 : 14;
    const cell = SIZE / n;
    for (let row = 0; row < n; row++) {
      const shift = (row % 2) * cell * 0.5;
      for (let c = 0; c < n; c++) {
        const cx = c * cell + shift + (r() - 0.5) * cell * 0.12;
        const cy = row * cell + cell / 2 + (r() - 0.5) * cell * 0.12;
        const col = stone(base, r() * 2 - 1);
        const rw = cell * (0.4 + r() * 0.06), rh = cell * (0.4 + r() * 0.06);
        wrapped((ox, oy) => {
          g.fillStyle = col;
          g.beginPath();
          if (kind === 'setts') g.roundRect(cx - rw + ox, cy - rh + oy, rw * 2, rh * 2, cell * 0.12);
          else g.ellipse(cx + ox, cy + oy, rw, rh, r() * Math.PI, 0, Math.PI * 2);
          g.fill();
          // A soft highlight on the crown.
          g.globalAlpha = 0.18;
          g.fillStyle = '#ffffff';
          g.beginPath();
          g.ellipse(cx - rw * 0.25 + ox, cy - rh * 0.3 + oy, rw * 0.45, rh * 0.35, 0, 0, Math.PI * 2);
          g.fill();
          g.globalAlpha = 1;
        });
      }
    }
    grain(6000, 0.15, '#ffffff', '#2c2a26');
  } else if (kind === 'gravel') {
    // Golden park gravel: a warm base, thousands of small stones.
    g.fillStyle = '#c9b48a';
    g.fillRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < 14000; i++) {
      const x = r() * SIZE, y = r() * SIZE, rad = 0.8 + r() * 2.4;
      g.fillStyle = stone([200, 182, 144], r() * 2.4 - 1.2);
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
    }
    grain(4000, 0.25, '#fff6dc', '#6d5c3e');
  } else {
    // Kerb: long granite blocks with a worn top.
    g.fillStyle = '#6f6c66';
    g.fillRect(0, 0, SIZE, SIZE);
    let x = 0;
    while (x < SIZE) {
      const w = SIZE / 3 + r() * (SIZE / 4);
      const x0 = x, col = stone([186, 183, 176], r() * 2 - 1);
      wrapped((ox, oy) => { g.fillStyle = col; g.fillRect(x0 + 2 + ox, 0 + oy, Math.min(w, SIZE - x0) - 4, SIZE); });
      x += w;
    }
    grain(5000, 0.2, '#ffffff', '#3c3a36');
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function pavingTexture(kind: PavingKind): THREE.CanvasTexture {
  let t = textures.get(kind);
  if (!t) textures.set(kind, (t = makeTexture(kind)));
  return t;
}

// ---- Geometry -------------------------------------------------------------------------------------------------------
type Layer = Strip['layer'];

class Batches {
  private readonly cells = new Map<string, { kind: PavingKind; layer: Layer; pos: number[]; nrm: number[]; uv: number[] }>();

  /** A strip of quads between signed offsets, with texture running along the line (u = across, v = along). */
  strip(s: Strip): void {
    const cols = Math.max(1, Math.ceil(Math.abs(s.to - s.from) / ACROSS));
    const tile = TILE_M[s.kind];
    for (let i = 0; i + 1 < s.rows.length; i++) {
      const r0 = s.rows[i], r1 = s.rows[i + 1];
      for (let c = 0; c < cols; c++) {
        const o0 = s.from + ((s.to - s.from) * c) / cols, o1 = s.from + ((s.to - s.from) * (c + 1)) / cols;
        const p = (r: Row, o: number): [number, number] => [r.x + r.nx * o, r.z + r.nz * o];
        const q = [p(r0, o0), p(r0, o1), p(r1, o0), p(r1, o1)];
        const uv = [[o0, r0.s], [o1, r0.s], [o0, r1.s], [o1, r1.s]].map(([u, v]) => [u / tile, v / tile]);
        this.quadUv(s.kind, s.layer, q, uv);
      }
    }
  }

  private quadUv(kind: PavingKind, layer: Layer, q: [number, number][], uv: number[][]): void {
    const key0 = (x: number, z: number): string => `${kind}|${layer}|${Math.floor(x / STATIC_CELL)},${Math.floor(z / STATIC_CELL)}`;
    const cx = (q[0][0] + q[3][0]) / 2, cz = (q[0][1] + q[3][1]) / 2;
    const key = key0(cx, cz);
    let cell = this.cells.get(key);
    if (!cell) this.cells.set(key, (cell = { kind, layer, pos: [], nrm: [], uv: [] }));
    const tris = [[0, 1, 2], [1, 3, 2]];
    for (const t of tris) {
      const [a, b, c] = t.map((k) => q[k]);
      const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const order = cross > 0 ? [t[0], t[2], t[1]] : t;
      for (const k of order) {
        const [x, z] = q[k];
        const n = normalAt(x, z);
        cell.pos.push(x, heightAt(x, z) + LIFT[layer], z);
        cell.nrm.push(n.x, n.y, n.z);
        cell.uv.push(uv[k][0], uv[k][1]);
      }
    }
  }

  /** A grid patch: rectangle or disc, sampled every ACROSS metres. */
  patch(p: GroundPatch): void {
    const layer: Layer = p.accent ? 'area' : 'tint';
    if ('rect' in p) {
      const { x, z, w, d } = p.rect;
      const yaw = p.rect.yaw ?? 0;
      const c = Math.cos(yaw), s = Math.sin(yaw);
      const nx = Math.max(1, Math.ceil(w / ACROSS)), nz = Math.max(1, Math.ceil(d / ACROSS));
      const at = (i: number, j: number): [number, number] => {
        const lx = -w / 2 + (w * i) / nx, lz = -d / 2 + (d * j) / nz;
        return [x + lx * c + lz * s, z - lx * s + lz * c];
      };
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          const q = [at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)];
          this.quadUv(p.kind, layer, q, q.map(([qx, qz]) => [qx / TILE_M[p.kind], -qz / TILE_M[p.kind]]));
        }
      }
    } else if ('circle' in p) {
      const { x, z, r } = p.circle;
      const r0 = p.circle.r0 ?? 0;
      const rings = Math.max(1, Math.ceil((r - r0) / ACROSS));
      const segs = Math.max(12, Math.ceil((2 * Math.PI * r) / ACROSS));
      const at = (ri: number, k: number): [number, number] => {
        const rr = r0 + ((r - r0) * ri) / rings, a = (k / segs) * Math.PI * 2;
        return [x + Math.cos(a) * rr, z + Math.sin(a) * rr];
      };
      for (let ri = 0; ri < rings; ri++) {
        for (let k = 0; k < segs; k++) {
          const q = [at(ri, k), at(ri, k + 1), at(ri + 1, k), at(ri + 1, k + 1)];
          this.quadUv(p.kind, layer, q, q.map(([qx, qz]) => [qx / TILE_M[p.kind], -qz / TILE_M[p.kind]]));
        }
      }
    } else {
      const s = patchStrip(p);
      if (s) this.strip(s);
    }
  }

  build(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'pardonlin-ground';
    root.userData.cullCells = true;
    const mats = new Map<string, THREE.MeshStandardMaterial>();
    for (const [key, cell] of this.cells) {
      if (!cell.pos.length) continue;
      const mk = `${cell.kind}|${cell.layer}`;
      let mat = mats.get(mk);
      if (!mat) {
        mat = flatLayer(new THREE.MeshStandardMaterial({ map: pavingTexture(cell.kind), roughness: cell.kind === 'gravel' ? 1 : 0.92 }), cell.layer);
        mats.set(mk, mat);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(cell.pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(cell.nrm, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(cell.uv, 2));
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `pardonlin-ground:${key}`;
      mesh.receiveShadow = true;
      root.add(mesh);
      registerCull(mesh, 'cell', { owned: true });
    }
    return root;
  }
}

/** Build the town's laid ground: pavements and kerbs, footpaths, and every plan's patches. */
export function buildPardonlinGround(patches: readonly GroundPatch[]): THREE.Group {
  const b = new Batches();
  for (const s of pavementStrips()) b.strip(s);
  for (const s of footpathStrips()) b.strip(s);
  for (const p of patches) b.patch(p);
  return b.build();
}
