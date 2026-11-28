// The Unmown's trail furniture (E31): waymarkers, fingerposts, rules boards, interpretive panels, benches, bird boxes and
// insect hotels. The preserve's story told in signage. The plan is pure and deterministic (planTrailDressing); the
// builder places it in one culled static batch plus a few text plates.
import * as THREE from 'three';
import { LAYER, flatLayer } from '@lawn/depth';
import { textPlate } from '../homes/pieces';
import { heightAt, waterAt } from '../terrain';
import { regionAt, trails } from '../levels';
import { valueNoise } from '../landforms/noise';
import { TILE, groundTexture, planarUv } from '../textures';
import { BOARDWALK, STATION, UNMOWN_HIDES } from '../living/config';
import { clearOfBoxes, pieceBox, placePieces, seeded, type Piece } from '../living/place';
import type { Box } from '../types';

export interface TrailPiece { id: string; x: number; z: number; yaw: number; text?: string }

type Pt = readonly [number, number];

const UNMOWN_LOOP: readonly Pt[] = [
  [-1560, -1172], [-1600, -1350], [-1500, -1500], [-1300, -1460], [-1150, -1470], [-900, -1560],
  [-750, -1460], [-550, -1440], [-330, -1560], [-300, -1460],
];
const REEDMERE_BOARDWALK: readonly Pt[] = [[-1300, -1460], [-1200, -1520], [-1100, -1560], [-1000, -1520], [-900, -1560]];
const UNMOWN_LANE: readonly Pt[] = [[-1400, -1020], [-1480, -1060], [-1540, -1120]];

/** Everything pieces must keep clear of: both trails, the lane and the boardwalk legs. */
const KEEP_CLEAR: readonly (readonly Pt[])[] = [UNMOWN_LOOP, REEDMERE_BOARDWALK, UNMOWN_LANE, BOARDWALK];
const MIN_OFF = 2.5;

function segDist(x: number, z: number, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)) : 0;
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}
function lineDist(x: number, z: number, line: readonly Pt[]): number {
  let best = Infinity;
  for (let i = 0; i + 1 < line.length; i++) best = Math.min(best, segDist(x, z, line[i], line[i + 1]));
  return best;
}
function clearDist(x: number, z: number): number {
  let best = Infinity;
  for (const l of KEEP_CLEAR) best = Math.min(best, lineDist(x, z, l));
  return best;
}
/** Nearest point on the two trails to (x, z). */
function nearestTrailPoint(x: number, z: number): { x: number; z: number; d: number } {
  let best = { x: 0, z: 0, d: Infinity };
  for (const line of [UNMOWN_LOOP, REEDMERE_BOARDWALK]) {
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i], b = line[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
      const px = a[0] + t * dx, pz = a[1] + t * dz, d = Math.hypot(x - px, z - pz);
      if (d < best.d) best = { x: px, z: pz, d };
    }
  }
  return best;
}

/** Whether a spot is usable: far enough from the paths, in the Unmown, on dry land. */
function usable(x: number, z: number, minOff = MIN_OFF): boolean {
  return clearDist(x, z) >= minOff && regionAt(x, z) === 'the-unmown' && !waterAt(x, z);
}

const RULES: readonly string[] = [
  'PLEASE KEEP TO THE PATH\nThe grass keeps to everything else.',
  'NO MOWING BEYOND THIS POINT\n(or before it)',
  'DOGS ON LEADS\nHOA INSPECTORS ON LONGER LEADS',
  'QUIET PLEASE\nBitterns nesting\nRangers napping',
  'THIS MEADOW HAS NOT BEEN CUT SINCE\n[date illegible, grass grew over it]',
  'LOST?\nGood. That is the idea.',
];

/** Candidate spots around (x, z): both sides of the direction, at each offset. */
function ring(x: number, z: number, dirx: number, dirz: number, offs: readonly number[]): Pt[] {
  const l = Math.hypot(dirx, dirz) || 1, nx = -dirz / l, nz = dirx / l;
  const out: Pt[] = [];
  for (const o of offs) for (const s of [1, -1]) out.push([x + nx * o * s, z + nz * o * s]);
  return out;
}

/** The whole plan: pure and deterministic. */
export function planTrailDressing(): TrailPiece[] {
  const out: TrailPiece[] = [];
  const rand = seeded(3107);
  const faceTo = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);
  const push = (id: string, c: Pt | undefined, yaw: number, text?: string) => {
    if (c) out.push({ id, x: c[0], z: c[1], yaw, ...(text ? { text } : {}) });
  };
  const firstUsable = (cands: readonly Pt[], minOff = MIN_OFF) => cands.find(([x, z]) => usable(x, z, minOff));

  // Waymarkers: every ~45 m, 2.5 m off, alternating sides, facing the path.
  for (const line of [UNMOWN_LOOP, REEDMERE_BOARDWALK]) {
    let side = 1, carried = 22; // first marker 22 m in
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i], b = line[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
      let t = carried;
      while (t < len) {
        const cx = a[0] + dx * t, cz = a[1] + dz * t;
        const mine: Pt = [cx - dz * 2.5 * side, cz + dx * 2.5 * side];
        const other: Pt = [cx + dz * 2.5 * side, cz - dx * 2.5 * side];
        const spot = firstUsable([mine, other], 2.4);
        if (spot) push('trail-waymarker', spot, faceTo(spot[0], spot[1], cx, cz));
        side = -side;
        t += 45;
      }
      carried = t - len;
    }
  }

  // Fingerposts: the two junctions, the trailhead, and one by each hide.
  const posts: Pt[] = [[-1300, -1460], [-900, -1560], [STATION.trailhead.x, STATION.trailhead.z]];
  for (const [px, pz] of posts) {
    const spot = firstUsable(ring(px, pz, 1, 0, [3, 4]).concat(ring(px, pz, 0, 1, [3, 4])));
    push('trail-fingerpost', spot, spot ? faceTo(spot[0], spot[1], px, pz) : 0);
  }
  for (const h of UNMOWN_HIDES) {
    const n = nearestTrailPoint(h.x, h.z);
    const dx = (n.x - h.x) / n.d, dz = (n.z - h.z) / n.d;
    const start = Math.min(8, n.d - MIN_OFF);
    const cands: Pt[] = [];
    for (let r = start; r >= 6; r -= 0.5) cands.push([h.x + dx * r, h.z + dz * r]);
    const spot = firstUsable(cands.length ? cands : [[n.x - dx * MIN_OFF, n.z - dz * MIN_OFF]]);
    push('trail-fingerpost', spot, spot ? faceTo(spot[0], spot[1], n.x, n.z) : 0);
  }

  // Rules boards at bends, each with its own text.
  const bends = [1, 2, 4, 6, 7, 8];
  bends.forEach((vi, k) => {
    const [vx, vz] = UNMOWN_LOOP[vi], [nx, nz] = UNMOWN_LOOP[vi + 1];
    const spot = firstUsable(ring(vx, vz, nx - vx, nz - vz, [3.5, 4.5, 6]));
    push('rules-board', spot, spot ? faceTo(spot[0], spot[1], vx, vz) : 0, RULES[k]);
  });

  // Interpretive panels (facing the view, north), and log benches beside them.
  const viewpoints: Pt[] = [[-560, -1450], [-1180, -1545], [-1580, -1420], [-310, -1470]];
  for (const [vx, vz] of viewpoints) {
    push('interpretive-panel', firstUsable([[vx, vz]]), Math.PI);
    push('log-bench', firstUsable([[vx + 3.2, vz], [vx - 3.2, vz], [vx + 3.2, vz + 1.5]]), Math.PI);
  }
  push('log-bench', firstUsable([[-750, -1456.5], [-750, -1463.5]]), Math.PI);
  push('log-bench', firstUsable([[-768, -1456.5], [-768, -1450]]), Math.PI);

  // Bird boxes (8) and insect hotels (3): wood edge and meadow, 4-8 m off the path.
  const wood: Pt[] = [[-1600, -1350], [-1500, -1500]];
  const meadow: Pt[] = [[-750, -1460], [-550, -1440]];
  const scatter = (id: string, ends: readonly Pt[], count: number) => {
    for (let n = 0; n < count; n++) {
      const t = 0.1 + 0.8 * rand();
      const cx = ends[0][0] + (ends[1][0] - ends[0][0]) * t, cz = ends[0][1] + (ends[1][1] - ends[0][1]) * t;
      const off = 4 + 4 * rand(), sgn = rand() < 0.5 ? 1 : -1;
      const dx = ends[1][0] - ends[0][0], dz = ends[1][1] - ends[0][1], l = Math.hypot(dx, dz);
      const mine: Pt = [cx - (dz / l) * off * sgn, cz + (dx / l) * off * sgn];
      const other: Pt = [cx + (dz / l) * off * sgn, cz - (dx / l) * off * sgn];
      const spot = firstUsable([mine, other], 4);
      push(id, spot, spot ? faceTo(spot[0], spot[1], cx, cz) : 0);
    }
  };
  scatter('bird-box', wood, 5);
  scatter('bird-box', meadow, 3);
  scatter('insect-hotel', wood, 2);
  scatter('insect-hotel', meadow, 1);
  return out;
}

// ---- The worn ribbon -----------------------------------------------------------------------------------------------
const RIBBON_STEP = 1.5;
const RIBBON_LIFT = 0.03;
const CORE_EXTRA = 1.4; // the opaque core reaches this far past width/2 (the painted 2 m cells reach about 1.4 m)
const FEATHER_EXTRA = 2.8; // alpha 0 about this far past width/2

/**
 * A soft-edged dirt ribbon along a trail polyline (world x/z): vertices every ~1.5 m and at each corner (mitred), five
 * across (outer edge, core edge, centre, core edge, outer edge). The core (width + 1.6 m) is opaque and fully hides the
 * painted 2 m cells; alpha feathers to 0 at about width/2 + 2 m, where the outer edge wobbles with smooth noise.
 * Samples on water are skipped. Pure: positions are x, y, z triples with y = heightAt + 0.03.
 */
export function planTrailRibbon(points: readonly (readonly [number, number])[], width: number): { positions: number[]; alphas: number[]; index: number[] } {
  const positions: number[] = [], alphas: number[] = [], index: number[] = [];
  if (points.length < 2) return { positions, alphas, index };
  // Samples along the line: corners are kept, long segments are cut to <= RIBBON_STEP.
  const samples: { x: number; z: number; corner: number; seg: number }[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / RIBBON_STEP));
    for (let k = 0; k < n; k++) samples.push({ x: ax + (bx - ax) * k / n, z: az + (bz - az) * k / n, corner: k === 0 && i > 0 ? i : -1, seg: i });
  }
  const last = points[points.length - 1];
  samples.push({ x: last[0], z: last[1], corner: -1, seg: points.length - 2 });
  const dirOf = (i: number): [number, number] => {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const l = Math.hypot(bx - ax, bz - az) || 1;
    return [(bx - ax) / l, (bz - az) / l];
  };
  const half = width / 2;
  const offs = [-(half + FEATHER_EXTRA), -(half + CORE_EXTRA), 0, half + CORE_EXTRA, half + FEATHER_EXTRA];
  const alpha = [0, 1, 1, 1, 0];
  const rowOf: number[] = []; // first vertex of each sample's row, -1 on water
  for (const s of samples) {
    let d: [number, number];
    let miter = 1;
    if (s.corner > 0) {
      const a = dirOf(s.corner - 1), b = dirOf(s.corner);
      const mx = a[0] + b[0], mz = a[1] + b[1], ml = Math.hypot(mx, mz);
      if (ml < 1e-6) d = b;
      else {
        d = [mx / ml, mz / ml];
        miter = Math.min(2.2, 1 / Math.max(0.45, d[0] * b[0] + d[1] * b[1]));
      }
    } else {
      d = dirOf(s.seg);
    }
    if (waterAt(s.x, s.z)) { rowOf.push(-1); continue; }
    const nx = -d[1], nz = d[0];
    rowOf.push(positions.length / 3);
    for (let j = 0; j < 5; j++) {
      const edge = j === 0 || j === 4;
      let o = offs[j];
      if (edge) o += Math.sign(o) * 0.55 * valueNoise(s.x / 7 + j * 3.1, s.z / 7, 41);
      o *= miter;
      const x = s.x + nx * o, z = s.z + nz * o;
      positions.push(x, heightAt(x, z) + RIBBON_LIFT, z);
      alphas.push(alpha[j]);
    }
  }
  for (let i = 0; i + 1 < rowOf.length; i++) {
    const a = rowOf[i], b = rowOf[i + 1];
    if (a < 0 || b < 0) continue;
    for (let j = 0; j < 4; j++) {
      index.push(a + j, a + j + 1, b + j, a + j + 1, b + j + 1, b + j);
    }
  }
  return { positions, alphas, index };
}

const RIBBON_TRAILS = ['trail/unmown-loop', 'trail/reedmere-boardwalk'];

function buildRibbons(scene: THREE.Scene): void {
  if (typeof document === 'undefined') return; // the dirt texture needs a canvas
  const mat = flatLayer(new THREE.MeshStandardMaterial({ map: groundTexture('dirt'), transparent: true, depthWrite: false, roughness: 1, vertexColors: true }), LAYER.road);
  for (const t of trails()) {
    if (!RIBBON_TRAILS.includes(t.id)) continue;
    const plan = planTrailRibbon(t.points, t.width);
    if (!plan.index.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(plan.positions, 3));
    const col: number[] = [];
    for (const a of plan.alphas) col.push(1, 1, 1, a);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    geo.setIndex(plan.index);
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(plan.alphas.flatMap(() => [0, 1, 0]), 3));
    planarUv(geo, TILE.dirt);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'unmown-trail-ribbon';
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}

const SOLID = new Set(['rules-board', 'interpretive-panel', 'log-bench', 'insect-hotel']);

/** Dresses trail/unmown-loop and trail/reedmere-boardwalk. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildUnmownTrails(scene: THREE.Scene, boxes: Box[]): void {
  buildRibbons(scene);
  const pieces: Piece[] = [];
  const plates: TrailPiece[] = [];
  for (const p of planTrailDressing()) {
    const piece: Piece = { id: p.id, x: p.x, z: p.z, yaw: p.yaw, ...(SOLID.has(p.id) ? { solid: true } : {}) };
    // Never inside a collider that is already there (non-solid pieces too).
    const b = pieceBox(piece);
    if (b && !clearOfBoxes(b, boxes, 0.1)) continue;
    pieces.push(piece);
    if (p.text) plates.push(p);
  }
  const placed = placePieces(scene, boxes, pieces, 'unmown-trails');
  const group = new THREE.Group();
  group.name = 'unmown-trail-plates';
  for (const p of plates) {
    if (!placed.some((q) => q.x === p.x && q.z === p.z && q.id === p.id)) continue;
    const y = heightAt(p.x, p.z) + 1.45;
    group.add(textPlate(p.text!, p.x + Math.sin(p.yaw) * 0.08, y, p.z + Math.cos(p.yaw) * 0.08, p.yaw, { w: 1.3, h: 0.8, bg: 0xe8dcb0, fg: 0x2b2116 }));
  }
  if (group.children.length) scene.add(group);
}
