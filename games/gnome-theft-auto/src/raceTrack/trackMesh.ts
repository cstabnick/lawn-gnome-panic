// The Speedway's flat surfaces: run-off, road, kerbs, start/finish line, grid boxes and the pit lane.
// Every surface is a merged mesh on its draw layer (@lawn/depth), draped on the ground: heights come from terrain.ts,
// so the road follows the hills, banking and jumps the track sits on. No colliders, no prefabs.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYER, flatLayer } from '@lawn/depth';
import { TILE, groundTexture, planarUv } from '../textures';
import { addGroundToGeometry, drapedRibbon } from '../terrainMesh';
import {
  BARRIER_GAPS, PIT_LANE, PIT_LANE_WIDTH, TRACK, gridSlot, sampleAt, trackFrame, trackLength, trackSamples,
} from './track';

type Pt = readonly [number, number];

const ROAD_COLOUR = 0xb8b8bc;
const KERB_RED = 0xd8342c;
const WHITE = 0xf4f4f4;
const BLACK = 0x111111;
const YELLOW = 0xffd21f;

const HALF = TRACK.width / 2;
const KERB_CENTRE = HALF + 0.6;
const KERB_WIDTH = 1.2;
const KERB_MAX_RADIUS = 80;
const KERB_BLOCK = 2;
const GRID_SLOTS = 8;
const PIT_BOXES = [714, 723, 732, 752, 761, 770, 800] as const;
const PIT_BOX_Z = -391;
const PIT_BOX_HALF = 3;
const LINE = 0.25;

/** A material for one draw layer (flatLayer sets the polygon offset in place). */
function mat(layer: number, color: number, map?: THREE.Texture): THREE.MeshStandardMaterial {
  return flatLayer(new THREE.MeshStandardMaterial({ color, map, roughness: 1 }), layer);
}

/** Points `lat` metres left of the centre line, every 2nd sample, closed (the last point is the first again). */
function lane(lat: number): Pt[] {
  const S = trackSamples();
  const pts: Pt[] = [];
  for (let k = 0; k < S.length; k += 2) pts.push([S[k].x + S[k].nx * lat, S[k].z + S[k].nz * lat]);
  pts.push(pts[0]);
  return pts;
}

/** A flat quad with corners c[0..3] (world x, z) at `lift` above the ground (the ground height is added). */
function quad(c: readonly Pt[], lift: number): THREE.BufferGeometry {
  const [a, b, d] = c;
  // y of (b - a) x (d - a): positive when the corners wind so the quad faces up.
  const up = (b[1] - a[1]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[1] - a[1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(c.flatMap(([x, z]) => [x, lift, z]), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(c.flatMap(([x, z]) => [x, -z]), 2));
  g.setIndex(up > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
  return addGroundToGeometry(g);
}

/** A rectangle centred at (cx, cz): half-length `hu` along (ux, uz), half-width `hv` along (vx, vz). */
function slab(cx: number, cz: number, ux: number, uz: number, hu: number, vx: number, vz: number, hv: number, lift: number): THREE.BufferGeometry {
  return quad([
    [cx - ux * hu - vx * hv, cz - uz * hu - vz * hv],
    [cx + ux * hu - vx * hv, cz + uz * hu - vz * hv],
    [cx + ux * hu + vx * hv, cz + uz * hu + vz * hv],
    [cx - ux * hu + vx * hv, cz - uz * hu + vz * hv],
  ], lift);
}

const segLen = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** The point a distance `d` along an open polyline (clamped to its ends). */
function pointAt(pts: readonly Pt[], d: number): Pt {
  let acc = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    const l = segLen(pts[k], pts[k + 1]);
    if (acc + l >= d || k + 2 === pts.length) {
      const t = l > 0 ? Math.min(1, Math.max(0, (d - acc) / l)) : 0;
      return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t];
    }
    acc += l;
  }
  return pts[pts.length - 1];
}

/** An open polyline cut into dashes: `on` metres drawn, `off` metres gap, along its length. */
function dashes(pts: readonly Pt[], on: number, off: number): Pt[][] {
  let total = 0;
  for (let k = 0; k + 1 < pts.length; k++) total += segLen(pts[k], pts[k + 1]);
  const out: Pt[][] = [];
  for (let a = 0; a < total; a += on + off) {
    const b = Math.min(a + on, total);
    if (b - a < 0.5) continue;
    const piece: Pt[] = [pointAt(pts, a)];
    let acc = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      acc += segLen(pts[k], pts[k + 1]);
      if (acc > a && acc < b) piece.push(pts[k + 1]);
    }
    piece.push(pointAt(pts, b));
    out.push(piece);
  }
  return out;
}

/** Merge flat pieces into one named mesh on its own material (receives shadows, casts none). */
function addMesh(scene: THREE.Scene, name: string, geos: THREE.BufferGeometry[], material: THREE.Material, tile?: number): void {
  if (geos.length === 0) return;
  const geo = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!geo) return;
  if (tile) planarUv(geo, tile);
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  scene.add(mesh);
}

/** True when the 2 m kerb block at distance `s` falls inside a barrier gap on `side`. */
function inGap(s: number, side: 'left' | 'right'): boolean {
  return BARRIER_GAPS.some((g) => g.side === side && s >= g.from && s <= g.to);
}

/** Build every flat surface of the track into `scene` (merged meshes, draw layers). No colliders. */
export function buildTrackSurface(scene: THREE.Scene): void {
  // Gravel run-off, then the asphalt road; the pit lane gets its own mesh a layer below the road.
  // The run-off is two strips beside the road (not one under it): a wide ribbon's sparse vertices would bulge through the
  // road on banked bends.
  const RUNOFF_W = TRACK.barrierOffset - TRACK.width / 2;
  addMesh(scene, 'speedway-runoff', [1, -1].map((side) => drapedRibbon(lane(side * (TRACK.width / 2 + RUNOFF_W / 2)), RUNOFF_W, 0.015)),
    mat(LAYER.tint, 0xffffff, groundTexture('gravel')), TILE.gravel);
  addMesh(scene, 'speedway-road', [drapedRibbon(lane(0), TRACK.width, 0.03)],
    mat(LAYER.road, ROAD_COLOUR, groundTexture('asphalt')), TILE.asphalt);
  // The pit lane and the apron in front of the garages: asphalt on a layer between the run-off and the road, so where
  // the pit lane meets the track the road wins (no two surfaces on one layer overlap).
  addMesh(scene, 'speedway-pit-lane', [
    drapedRibbon(PIT_LANE, PIT_LANE_WIDTH, 0.025),
    // Apron from the pit lane's north edge (z -388) to the garage fronts (z -395): touching the lane, not overlapping it.
    slab((712 + 805) / 2, -391.5, 1, 0, (805 - 712) / 2, 0, 1, 3.5, 0.025),
  ], mat(LAYER.area, 0xa8a8ac, groundTexture('asphalt')), TILE.asphalt);

  // White edge lines and the grid boxes.
  const lines: THREE.BufferGeometry[] = [
    drapedRibbon(lane(HALF - 0.4), 0.3, 0.08),
    drapedRibbon(lane(-(HALF - 0.4)), 0.3, 0.08),
  ];
  for (let slot = 0; slot < GRID_SLOTS; slot++) {
    const g = gridSlot(slot);
    // Forward (fx, fz) and left (nx, nz) across the box, for yaw = atan2(dx, dz).
    const fx = Math.sin(g.yaw), fz = Math.cos(g.yaw);
    const nx = -fz, nz = fx;
    const t = LINE;
    // Front bar, then two side bars that stop short of it (no shared faces).
    lines.push(slab(g.x + fx * (2 - t / 2), g.z + fz * (2 - t / 2), nx, nz, 1.3, fx, fz, t / 2, 0.05));
    for (const side of [1, -1]) {
      const cx = g.x + side * nx * (1.3 - t / 2) - fx * (t / 2);
      const cz = g.z + side * nz * (1.3 - t / 2) - fz * (t / 2);
      lines.push(slab(cx, cz, fx, fz, 1.875, nx, nz, t / 2, 0.05));
    }
  }
  addMesh(scene, 'speedway-lines', lines, mat(LAYER.marking, WHITE));

  // Kerbs on both edges of every corner tighter than KERB_MAX_RADIUS, in 2 m red and white blocks.
  const red: THREE.BufferGeometry[] = [];
  const white: THREE.BufferGeometry[] = [];
  const blocks = Math.floor(trackLength() / KERB_BLOCK);
  for (let b = 0; b < blocks; b++) {
    const s0 = b * KERB_BLOCK;
    const mid = s0 + KERB_BLOCK / 2;
    if (Math.abs(sampleAt(mid).curv) <= 1 / KERB_MAX_RADIUS) continue;
    for (const side of [1, -1] as const) {
      if (inGap(mid, side > 0 ? 'left' : 'right')) continue;
      const lat = side * KERB_CENTRE;
      // A hair short at both ends, so neighbouring blocks never overlap.
      const pts: Pt[] = [0.05, 1, 1.95].map((k) => {
        const p = trackFrame(s0 + k, lat);
        return [p.x, p.z];
      });
      // Lifted clear of the road and run-off, whose sparser vertices ride higher on banked bends; white above red.
      (b % 2 === 0 ? red : white).push(drapedRibbon(pts, KERB_WIDTH, b % 2 === 0 ? 0.07 : 0.08));
    }
  }
  addMesh(scene, 'speedway-kerb-red', red, mat(LAYER.edge, KERB_RED));
  // A layer up from the red: neighbouring kerb blocks overlap a little at their mitred ends (no line crosses a kerb).
  addMesh(scene, 'speedway-kerb-white', white, mat(LAYER.marking, WHITE));

  // Chequered start/finish line: a 2 m band across the full road, 1 m squares.
  const blackSquares: THREE.BufferGeometry[] = [];
  const whiteSquares: THREE.BufferGeometry[] = [];
  for (let a = 0; a < 2; a++) {
    for (let b = 0; b < TRACK.width; b++) {
      const l0 = -HALF + b, l1 = l0 + 1;
      const c = [trackFrame(a, l0), trackFrame(a + 1, l0), trackFrame(a + 1, l1), trackFrame(a, l1)]
        .map((p): Pt => [p.x, p.z]);
      (((a + b) % 2 === 0) ? blackSquares : whiteSquares).push(quad(c, 0.1));
    }
  }
  // On the decal layer: the band crosses the white edge lines (marking layer) and must win over them.
  addMesh(scene, 'speedway-start-black', blackSquares, mat(LAYER.decal, BLACK));
  addMesh(scene, 'speedway-start-white', whiteSquares, mat(LAYER.decal, WHITE));

  // Pit lane: dashed yellow centre line and the yellow pit box outlines.
  const pit: THREE.BufferGeometry[] = [];
  for (const piece of dashes(PIT_LANE, 2, 2)) pit.push(drapedRibbon(piece, LINE, 0.04));
  const h = PIT_BOX_HALF, t = LINE;
  for (const x of PIT_BOXES) {
    pit.push(slab(x, PIT_BOX_Z - h + t / 2, 1, 0, h, 0, 1, t / 2, 0.05));
    pit.push(slab(x, PIT_BOX_Z + h - t / 2, 1, 0, h, 0, 1, t / 2, 0.05));
    pit.push(slab(x - h + t / 2, PIT_BOX_Z, 0, 1, h - t, 1, 0, t / 2, 0.05));
    pit.push(slab(x + h - t / 2, PIT_BOX_Z, 0, 1, h - t, 1, 0, t / 2, 0.05));
  }
  addMesh(scene, 'speedway-pit-markings', pit, mat(LAYER.marking, YELLOW));
}
