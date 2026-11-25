// The Unmown's trail furniture (E31): waymarkers, fingerposts, rules boards, interpretive panels, benches, bird boxes and
// insect hotels. The preserve's story told in signage. The plan is pure and deterministic (planTrailDressing); the
// builder places it in one culled static batch plus a few text plates.
import * as THREE from 'three';
import { textPlate } from '../homes/pieces';
import { heightAt, waterAt } from '../terrain';
import { regionAt } from '../levels';
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

const SOLID = new Set(['rules-board', 'interpretive-panel', 'log-bench', 'insect-hotel']);

/** Dresses trail/unmown-loop and trail/reedmere-boardwalk. Pushes its colliders into `boxes`. Runs once from living/build.ts during the world build (also in tests: no DOM). */
export function buildUnmownTrails(scene: THREE.Scene, boxes: Box[]): void {
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
