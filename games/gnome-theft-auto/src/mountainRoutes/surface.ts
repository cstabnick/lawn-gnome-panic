// E33: the drawn surfaces of the mountain routes: asphalt with lines on the roads, gravel on the Hatband, a dirt path on
// the Brim Walk. Draped on the ground on draw layers (@lawn/depth), no colliders.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LAYER, flatLayer } from '@lawn/depth';
import { TILE, groundTexture, planarUv, type GroundKind } from '../textures';
import { addGroundToGeometry, drapedRibbon } from '../terrainMesh';
import type { Track } from '../raceTrack/trackDef';
import { ALL_PADS } from './pads';
import { ALL_ROUTES, ROUTE_IDS } from './routes';
import type { RouteDef } from './types';

type Pt = readonly [number, number];

const WHITE_LINE = 0xf2f2f2;
const PAD_CELL = 2;

/** A material for one draw layer (flatLayer sets the polygon offset in place). */
function mat(layer: number, color: number, map?: THREE.Texture): THREE.MeshStandardMaterial {
  return flatLayer(new THREE.MeshStandardMaterial({ color, map, roughness: 1 }), layer);
}

/** Points `lat` metres left of a route's centre line, every 2nd sample (open: ends at the last sample). */
function laneOf(track: Track, lat: number): Pt[] {
  const S = track.samples();
  const pts: Pt[] = [];
  for (let k = 0; k < S.length; k += 2) pts.push([S[k].x + S[k].nx * lat, S[k].z + S[k].nz * lat]);
  if ((S.length - 1) % 2 !== 0) {
    const e = S[S.length - 1];
    pts.push([e.x + e.nx * lat, e.z + e.nz * lat]);
  }
  return pts;
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

/** A flat quad with corners c[0..3] (world x, z), lifted `lift` above the ground and draped on it. */
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

/** Merge pieces into one named mesh on its own material (receives shadows, casts none). */
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

/** The ribbon along a route for its whole length, `width` wide, lifted and draped. */
function ribbon(track: Track, lat: number, width: number, lift: number): THREE.BufferGeometry {
  return drapedRibbon(laneOf(track, lat), width, lift);
}

/** Road: asphalt, a solid edge line on each side, a dashed white centre line, gravel verges beyond the edges. */
function buildRoad(scene: THREE.Scene, id: string, track: Track, def: RouteDef): void {
  const half = def.width / 2;
  const edgeLat = half - 0.35;
  addMesh(scene, `e33-${id}-road`, [ribbon(track, 0, def.width, 0.08)],
    mat(LAYER.road, 0xffffff, groundTexture('asphalt')), TILE.asphalt);

  const lines: THREE.BufferGeometry[] = [];
  for (const side of [1, -1]) lines.push(ribbon(track, side * edgeLat, 0.15, 0.11));
  const centre = laneOf(track, 0);
  for (const piece of dashes(centre, 3, 5)) lines.push(drapedRibbon(piece, 0.15, 0.11));
  addMesh(scene, `e33-${id}-lines`, lines, mat(LAYER.marking, WHITE_LINE));

  if (def.shoulder > 0) {
    const verge: THREE.BufferGeometry[] = [];
    for (const side of [1, -1]) verge.push(ribbon(track, side * (half + def.shoulder / 2), def.shoulder, 0.05));
    // Under the road and the pads (LAYER.tint), so where the draped edges meet, the asphalt and the pads win.
    addMesh(scene, `e33-${id}-verge`, verge, mat(LAYER.tint, 0xffffff, groundTexture('gravel')), TILE.gravel);
  }
}

/**
 * The centre line of `track` (every 2nd sample) cut into pieces that leave out where it lies on one of `over` (a wider
 * route drawn on the same layer: the Hatband where it joins the road, the Brim Walk where it crosses the road or the
 * Hatband), so two ribbons never share a spot and flicker.
 */
function piecesOff(track: Track, over: readonly Track[]): Pt[][] {
  const S = track.samples();
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (let k = 0; k < S.length; k += 2) {
    const p = S[k];
    const covered = over.some((o) => {
      const reach = o.def.width / 2 + o.def.shoulder + track.def.width / 2 + 0.3;
      const spot = o.locate(p.x, p.z, reach);
      return spot !== null && Math.abs(spot.lat) <= reach;
    });
    if (covered) {
      if (cur.length >= 2) out.push(cur);
      cur = [];
    } else cur.push([p.x, p.z]);
  }
  if (cur.length >= 2) out.push(cur);
  return out;
}

/** Track: a narrow gravel shelf (left out where it runs onto a road). */
function buildTrack(scene: THREE.Scene, id: string, track: Track): void {
  const roads = ALL_ROUTES.filter((t) => (t.def as RouteDef).kind === 'road');
  addMesh(scene, `e33-${id}-road`, piecesOff(track, roads).map((pts) => drapedRibbon(pts, track.def.width, 0.07)),
    mat(LAYER.road, 0xffffff, groundTexture('gravel')), TILE.gravel);
}

/** Trail: a dirt footpath, tinted to read as trodden (left out where it crosses a road or the Hatband). */
function buildTrail(scene: THREE.Scene, id: string, track: Track): void {
  const wider = ALL_ROUTES.filter((t) => (t.def as RouteDef).kind !== 'trail');
  addMesh(scene, `e33-${id}-path`, piecesOff(track, wider).map((pts) => drapedRibbon(pts, track.def.width, 0.06)),
    mat(LAYER.road, 0xd8c8a8, groundTexture('dirt')), TILE.dirt);
}

const PAD_KINDS: readonly GroundKind[] = ['asphalt', 'gravel', 'dirt', 'rock'];

/** Pads: flat rectangles cut into ~2 m cells (so they drape), skipping cells on any route's road. */
function buildPads(scene: THREE.Scene, routes: readonly Track[]): void {
  const byKind = new Map<GroundKind, THREE.BufferGeometry[]>(PAD_KINDS.map((k) => [k, []]));
  for (const p of ALL_PADS) {
    const kind = p.surface ?? 'gravel';
    const out = byKind.get(kind)!;
    const cu = Math.max(1, Math.ceil((2 * p.hw) / PAD_CELL));
    const cv = Math.max(1, Math.ceil((2 * p.hd) / PAD_CELL));
    const du = (2 * p.hw) / cu, dv = (2 * p.hd) / cv;
    const c = Math.cos(p.yaw), s = Math.sin(p.yaw);
    // Local (u across, v along) to world: u * (cos, -sin) + v * (sin, cos).
    const world = (u: number, v: number): Pt => [p.x + u * c + v * s, p.z - u * s + v * c];
    for (let i = 0; i < cu; i++) {
      for (let j = 0; j < cv; j++) {
        const u0 = -p.hw + i * du, u1 = u0 + du;
        const v0 = -p.hd + j * dv, v1 = v0 + dv;
        const mid = world((u0 + u1) / 2, (v0 + v1) / 2);
        if (routes.some((t) => t.onRoad(mid[0], mid[1]))) continue;
        out.push(quad([world(u0, v0), world(u1, v0), world(u1, v1), world(u0, v1)], 0.05));
      }
    }
  }
  for (const kind of PAD_KINDS) {
    const geos = byKind.get(kind) ?? [];
    addMesh(scene, `e33-pads-${kind}`, geos, mat(LAYER.area, 0xffffff, groundTexture(kind)), TILE[kind]);
  }
}

/** Build every drawn surface of the mountain routes and their pads into `scene` (merged meshes, draw layers). */
export function buildRouteSurfaces(scene: THREE.Scene): void {
  ALL_ROUTES.forEach((track, i) => {
    const id = ROUTE_IDS[i];
    const def = track.def as RouteDef;
    if (def.kind === 'road') buildRoad(scene, id, track, def);
    else if (def.kind === 'track') buildTrack(scene, id, track);
    else buildTrail(scene, id, track);
  });
  buildPads(scene, ALL_ROUTES);
}
