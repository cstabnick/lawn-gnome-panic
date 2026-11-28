// Pardonlin's laid ground (FX09, D9): where the town is paved, cobbled or gravelled. Pure data and geometry (no
// three.js); ground.ts turns it into draped decal meshes on @lawn/depth layers.
//
//   - Pavements: every town road gets a stone-flag band from its centre out to PAVE_OUTER on both sides (the road
//     ribbon draws over the middle), and a granite kerb stripe along each edge. Roundabout rings are paved on the
//     outside only (the islands are their own). Nothing is laid over the Thymes or its bridges.
//   - Footpaths: the town's `trail/...` paths get their own surface (lanes cobbled, the Jardin
//     walks gravelled). The two river walks are laid by the Thymes plan (districts/thymes.ts) as quay bands.
//   - Patches: each district plan lists its squares, courtyards and walks (`DistrictPlan.ground`).
//
// Layers, low to high: patches and footpaths on 'tint', pavements and accents on 'area', kerbs on 'edge' (roads are
// 'road', between area and edge). Two patches on the same layer must not overlap (use `accent` for a ring or border on
// top of a square).
import { HIGHWAYS } from '../config';
import { trails } from '../levels';
import { PARDONLIN_RECT, pathPoints, RIVER_KEEP } from './layout';

/** What a paved surface is made of. */
export type PavingKind = 'flags' | 'setts' | 'cobble' | 'gravel' | 'kerb' | 'quay';

/**
 * A laid surface in a district plan. Shapes: a rectangle (centre, size along local x / z, yaw), a disc, a line (a
 * footpath-like ribbon `width` wide along world points), or a band (a ribbon between signed offsets `from`..`to` from a
 * line: positive is the line's left, the side the normal (dz, -dx) points to). `accent` puts it one layer up (a border
 * or a ring of setts on a square); otherwise it is on the patch layer, under the pavements.
 */
export type GroundPatch = { kind: PavingKind; accent?: boolean } & (
  | { rect: { x: number; z: number; w: number; d: number; yaw?: number } }
  | { circle: { x: number; z: number; r: number; r0?: number } }
  | { line: readonly (readonly [number, number])[]; width: number }
  | { band: readonly (readonly [number, number])[]; from: number; to: number }
);

/** How far a laid footpath reaches past its trail's edge (m). */
export const FOOTPATH_SKIRT = 2;
/** Road half-width in town (m). */
export const ROAD_HALF = 3.5;
/** Pavements reach this far from a road's centre line (the street rows' fronts stand at 8-8.6 m). */
export const PAVE_OUTER = 9.6;
/** Kerb stripe width (m), laid just outside the road edge. */
export const KERB = 0.32;
/** Nothing is laid within this distance of the Thymes' centre line on a road (its bridges). */
export const BRIDGE_KEEP = RIVER_KEEP + 1;

/** The roads Pardonlin paves: its own `pl-` roads and its two roundabouts. */
export function townRoads(): { id: string; points: [number, number][]; ring: boolean }[] {
  return HIGHWAYS.filter((h) => h.id.startsWith('pl-') || h.id === 'roundabout/hatwheel' || h.id === 'roundabout/place-du-pot')
    .map((h) => ({ id: h.id, points: h.points.map(([x, z]) => [x, z] as [number, number]), ring: h.id.startsWith('roundabout/') }));
}

/** Surface of a town footpath by id, or null when it is not laid. */
export function footpathKind(id: string): PavingKind | null {
  if (id.startsWith('trail/pl-')) return 'cobble';
  if (id.startsWith('trail/jardin')) return 'gravel';
  return null;
}

/** The town footpaths that get a surface (id, points, width). */
export function townFootpaths(): { id: string; kind: PavingKind; points: [number, number][]; width: number }[] {
  const out: { id: string; kind: PavingKind; points: [number, number][]; width: number }[] = [];
  for (const t of trails()) {
    const kind = footpathKind(t.id);
    if (kind) out.push({ id: t.id, kind, points: t.points, width: t.width || 4 });
  }
  return out;
}

function distToSeg(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

export function distToLine(x: number, z: number, pts: readonly (readonly [number, number])[]): number {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) d = Math.min(d, distToSeg(x, z, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
  return d;
}

let thymesPts: [number, number][] | null = null;
/** Distance from (x, z) to the Thymes' centre line. */
export function thymesDist(x: number, z: number): number {
  thymesPts ??= pathPoints('thymes');
  return distToLine(x, z, thymesPts);
}

/** Inside the town's rectangle. */
export function inTown(x: number, z: number): boolean {
  return x >= PARDONLIN_RECT.minX && x <= PARDONLIN_RECT.maxX && z >= PARDONLIN_RECT.minZ && z <= PARDONLIN_RECT.maxZ;
}

/** A point on a road may carry pavement: in town and off the Thymes and its bridges. */
export function paveable(x: number, z: number): boolean {
  return inTown(x, z) && thymesDist(x, z) >= BRIDGE_KEEP;
}

/** A kerb point is on another road's surface (a junction mouth), so no kerb is laid there. */
export function onOtherRoad(x: number, z: number, self: string): boolean {
  for (const r of townRoads()) {
    if (r.id === self) continue;
    if (distToLine(x, z, r.points) < ROAD_HALF + 0.2) return true;
  }
  return false;
}

/** A cross-section row of a ribbon: the centre-line point and its side vector (unit normal scaled by the mitre). */
export interface Row { x: number; z: number; nx: number; nz: number; s: number }

/**
 * Rows every `step` metres along a polyline, with mitred side normals (left of travel: (dz, -dx) seen with +z down),
 * like terrainMesh.drapedRibbon. `s` is the distance along the line.
 */
export function ribbonRows(points: readonly (readonly [number, number])[], step = 2): Row[] {
  const n = points.length;
  if (n < 2) return [];
  const closed = n > 3 && Math.hypot(points[0][0] - points[n - 1][0], points[0][1] - points[n - 1][1]) < 1e-6;
  const dirs = points.slice(0, -1).map(([ax, az], k) => {
    const [bx, bz] = points[k + 1];
    const l = Math.hypot(bx - ax, bz - az) || 1;
    return [(bx - ax) / l, (bz - az) / l] as const;
  });
  const sideAt = (k: number): [number, number] => {
    const last = dirs.length - 1;
    const a = dirs[k > 0 ? k - 1 : closed ? last : 0];
    const b = dirs[k <= last ? k : closed ? 0 : last];
    let mx = a[0] + b[0], mz = a[1] + b[1];
    const ml = Math.hypot(mx, mz) || 1;
    mx /= ml; mz /= ml;
    const cos = Math.max(0.5, mx * b[0] + mz * b[1]);
    return [mz / cos, -mx / cos];
  };
  const rows: Row[] = [];
  let s0 = 0;
  for (let k = 0; k + 1 < n; k++) {
    const [ax, az] = points[k];
    const [bx, bz] = points[k + 1];
    const [sax, saz] = sideAt(k);
    const [sbx, sbz] = sideAt(k + 1);
    const len = Math.hypot(bx - ax, bz - az);
    const m = Math.max(1, Math.ceil(len / step));
    for (let j = k === 0 ? 0 : 1; j <= m; j++) {
      const t = j / m;
      rows.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, nx: sax + (sbx - sax) * t, nz: saz + (sbz - saz) * t, s: s0 + len * t });
    }
    s0 += len;
  }
  return rows;
}

/** Split rows into runs of consecutive rows that pass `keep` (each run at least two rows). */
export function runsOf(rows: readonly Row[], keep: (r: Row) => boolean): Row[][] {
  const out: Row[][] = [];
  let cur: Row[] = [];
  for (const r of rows) {
    if (keep(r)) cur.push(r);
    else { if (cur.length > 1) out.push(cur); cur = []; }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

/** A ribbon to lay: rows, the signed offsets it spans, the surface and whether it is an accent / kerb. */
export interface Strip { kind: PavingKind; rows: Row[]; from: number; to: number; layer: 'tint' | 'area' | 'edge' }

/** Signed side (+1 left, -1 right) of a closed ring that faces away from its centre. */
function outerSide(points: readonly (readonly [number, number])[]): number {
  const rows = ribbonRows(points, 4);
  let cx = 0, cz = 0;
  for (const [x, z] of points) { cx += x; cz += z; }
  cx /= points.length; cz /= points.length;
  const r = rows[1];
  return (r.x + r.nx - cx) ** 2 + (r.z + r.nz - cz) ** 2 > (r.x - cx) ** 2 + (r.z - cz) ** 2 ? 1 : -1;
}

/** Every pavement and kerb strip in town. */
export function pavementStrips(): Strip[] {
  const out: Strip[] = [];
  for (const road of townRoads()) {
    const rows = ribbonRows(road.points, 2);
    // A row is laid when its centre and both outer edges are paveable (keeps the band off the bridges' ramps).
    const runs = runsOf(rows, (r) => paveable(r.x, r.z) && paveable(r.x + r.nx * PAVE_OUTER, r.z + r.nz * PAVE_OUTER) && paveable(r.x - r.nx * PAVE_OUTER, r.z - r.nz * PAVE_OUTER));
    const sides = road.ring ? [outerSide(road.points)] : [1, -1];
    for (const run of runs) {
      if (road.ring) out.push({ kind: 'flags', rows: run, from: sides[0] * ROAD_HALF, to: sides[0] * PAVE_OUTER, layer: 'area' });
      else out.push({ kind: 'flags', rows: run, from: -PAVE_OUTER, to: PAVE_OUTER, layer: 'area' });
    }
    // Kerbs: finer rows, cut at junction mouths.
    const fine = ribbonRows(road.points, 1);
    for (const side of sides) {
      const off = side * (ROAD_HALF + KERB / 2);
      const kerbRuns = runsOf(fine, (r) => {
        const x = r.x + r.nx * off, z = r.z + r.nz * off;
        return paveable(x, z) && paveable(r.x, r.z) && !onOtherRoad(x, z, road.id);
      });
      for (const run of kerbRuns) out.push({ kind: 'kerb', rows: run, from: off - KERB / 2, to: off + KERB / 2, layer: 'edge' });
    }
  }
  return out;
}

/** Every footpath strip in town (on the patch layer). */
export function footpathStrips(): Strip[] {
  const out: Strip[] = [];
  for (const p of townFootpaths()) {
    const rows = ribbonRows(p.points, 1.5);
    for (const run of runsOf(rows, (r) => inTown(r.x, r.z))) {
      // The terrain paints a trail's 2 m cells dirt (feathered by a cell), so the surface reaches FOOTPATH_SKIRT past
      // the trail's edge to cover that border; lane houses stand over its outer metre.
      out.push({ kind: p.kind, rows: run, from: -p.width / 2 - FOOTPATH_SKIRT, to: p.width / 2 + FOOTPATH_SKIRT, layer: 'tint' });
    }
  }
  return out;
}

/** A plan's line / band patch as a strip. */
export function patchStrip(p: GroundPatch): Strip | null {
  const layer = p.accent ? 'area' : 'tint';
  if ('line' in p) return { kind: p.kind, rows: ribbonRows(p.line, 1.5), from: -p.width / 2, to: p.width / 2, layer };
  if ('band' in p) return { kind: p.kind, rows: ribbonRows(p.band, 1.5), from: p.from, to: p.to, layer };
  return null;
}
