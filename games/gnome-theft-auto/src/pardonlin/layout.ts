// Pardonlin's town plan (E30): the districts, the document-to-world transform and the clearance rules every district plan
// is checked against (layout.test.ts). Pure maths: no three.js, no DOM. World: +x east, +z south, metres.
// Pardonlin's level document (src/data/levels/pardonlin.level.json) has its origin at world (-1600, 100).
import { HIGHWAYS } from '../config';
import { REGIONS, trails } from '../levels';

/** World position of a point given in Pardonlin's level-document coordinates. */
export const PL_ORIGIN = { x: -1600, z: 100 } as const;
export function pl(docX: number, docZ: number): [number, number] {
  return [docX + PL_ORIGIN.x, docZ + PL_ORIGIN.z];
}

/** The region (inside the Wickets fence at x -1397 and the world fence at -1795). */
export const PARDONLIN_RECT = { minX: -1795, maxX: -1400, minZ: -900, maxZ: 1100 } as const;

/** Inside Pardonlin (setEuroZone uses it: most new cars here are European rides). */
export function insideEuroYard(x: number, z: number): boolean {
  return x >= -1800 && x <= -1398 && z >= -900 && z <= 1100;
}

export type DistrictId = 'old-town' | 'teacup-quays' | 'left-bank' | 'gardens';

export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

export interface District {
  id: DistrictId;
  name: string;
  /** World rectangles the district owns: its plan places buildings and props only inside these. */
  rects: readonly Rect[];
  /** Three screenshot spots (world x, z, yaw: three.js rotation.y of the camera's facing, 0 = facing +z / south). */
  shots: readonly { id: string; x: number; z: number; yaw: number; what: string }[];
}

/**
 * The four districts. East bank: the Old Town north of the Hatwheel (the Bean Tower, the Grand Platz, the Rue Haute),
 * Teacup Row and the Quays south of it. West bank: the Left Bank (Radio Adagio, the Beetle Market, the backyards).
 * North and south: the Jardin, the Little Gardens and Basin Quay.
 */
export const DISTRICTS: readonly District[] = [
  {
    id: 'old-town', name: 'the Old Town',
    rects: [{ minX: -1595, maxX: -1400, minZ: -460, maxZ: -52 }],
    shots: [
      { id: 'ot-1-bean-tower', x: -1520, z: -318, yaw: Math.PI, what: 'the Bean Tower and its queue from rue-a' },
      { id: 'ot-2-grand-platz', x: -1500, z: -200, yaw: Math.PI, what: 'the Grand Platz: bandstand, café terraces, the Bean Tower beyond' },
      { id: 'ot-3-rue-haute', x: -1462, z: -200, yaw: Math.PI, what: 'the Rue Haute' },
    ],
  },
  {
    id: 'teacup-quays', name: 'Teacup Row and the Quays',
    // FX09: the river corridor (both quays, the Thymes Walk and the Rive Gauche) is the Quays' too.
    rects: [{ minX: -1595, maxX: -1400, minZ: -8, maxZ: 500 }, { minX: -1626, maxX: -1595, minZ: -540, maxZ: 1005 },
      // ... and the quay edges where the river drifts out of that strip (north-west and the east bank south of z 500).
      { minX: -1640, maxX: -1626, minZ: -540, maxZ: -460 }, { minX: -1595, maxX: -1585, minZ: -540, maxZ: -460 },
      { minX: -1595, maxX: -1585, minZ: 500, maxZ: 1005 }],
    shots: [
      { id: 'tq-1-teacup-row', x: -1522, z: 116, yaw: 0, what: 'Teacup Row, looking south down the café lane' },
      { id: 'tq-2-quay', x: -1584, z: 200, yaw: Math.PI, what: 'the east quay and the Thymes Walk' },
      { id: 'tq-3-place-du-pot', x: -1500, z: 420, yaw: Math.PI, what: 'Place du Pot' },
    ],
  },
  {
    id: 'left-bank', name: 'the Left Bank',
    rects: [
      { minX: -1795, maxX: -1626, minZ: -460, maxZ: 400 },
      { minX: -1795, maxX: -1700, minZ: 400, maxZ: 900 },
    ],
    shots: [
      { id: 'lb-1-radio-adagio', x: -1712, z: -100, yaw: Math.PI / 2, what: 'Radio Adagio from the Boulevard' },
      { id: 'lb-2-beetle-market', x: -1733, z: 124, yaw: 0, what: 'the Beetle Market, looking south down its aisles' },
      { id: 'lb-3-backyards', x: -1740, z: 600, yaw: Math.PI, what: 'the Left Bank backyards' },
    ],
  },
  {
    id: 'gardens', name: 'the Jardin and the Basin',
    rects: [
      { minX: -1795, maxX: -1400, minZ: -890, maxZ: -540 },
      { minX: -1495, maxX: -1405, minZ: 515, maxZ: 885 },
      { minX: -1660, maxX: -1405, minZ: 1005, maxZ: 1095 },
    ],
    shots: [
      { id: 'gd-1-jardin', x: -1510, z: -684, yaw: Math.PI, what: 'the Jardin parterre and its fountain' },
      { id: 'gd-2-little-gardens', x: -1451, z: 640, yaw: Math.PI, what: 'the Little Gardens' },
      { id: 'gd-3-basin-quay', x: -1495, z: 1045, yaw: -Math.PI / 2, what: 'Basin Quay, looking west to the boathouse and the Basin' },
    ],
  },
];

export function districtById(id: DistrictId): District {
  return DISTRICTS.find((d) => d.id === id)!;
}

export function inRect(r: Rect, x: number, z: number, margin = 0): boolean {
  return x >= r.minX - margin && x <= r.maxX + margin && z >= r.minZ - margin && z <= r.maxZ + margin;
}

/** The district a point is in, or null. */
export function districtAt(x: number, z: number): DistrictId | null {
  for (const d of DISTRICTS) if (d.rects.some((r) => inRect(r, x, z))) return d.id;
  return null;
}

// ---- Clearance ----------------------------------------------------------------------------------------------------
/** Clear pavement (m) between a road's edge and a building's body (front parts like awnings included). */
export const PAVEMENT = 1.5;
/** Clear ground (m) between a footpath's edge and anything solid. */
export const PATH_GAP = 0.5;
/** Half the Thymes' width plus its bank (m): nothing solid nearer the river's centre line than this (quay props too). */
export const RIVER_KEEP = 12.5;

interface Sample { x: number; z: number; half: number }

function samplePath(points: readonly (readonly [number, number])[], half: number, out: Sample[], step = 1): void {
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1];
    const [bx, bz] = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k <= n; k++) out.push({ x: ax + ((bx - ax) * k) / n, z: az + ((bz - az) * k) / n, half });
  }
}

const near = (pts: readonly (readonly [number, number])[]): boolean => pts.some(([x, z]) => x < -1340 && z > -1000 && z < 1200);

let cache: { roads: Sample[]; paths: Sample[]; river: Sample[] } | null = null;
/** Road, footpath and river centre lines in and around Pardonlin, sampled every metre (computed once). */
export function townLines(): { roads: Sample[]; paths: Sample[]; river: Sample[] } {
  if (cache) return cache;
  const roads: Sample[] = [];
  const paths: Sample[] = [];
  const river: Sample[] = [];
  for (const h of HIGHWAYS) if (near(h.points)) samplePath(h.points, h.width / 2, roads);
  for (const t of trails()) if (near(t.points)) samplePath(t.points, (t.width || 4) / 2, paths);
  const thymes = REGIONS.pardonlin.paths.find((p) => p.id === 'thymes');
  if (thymes) samplePath(thymes.points, RIVER_KEEP, river);
  cache = { roads, paths, river };
  return cache;
}

/** A rotated rectangle on the ground: centre, size along local x (w) and z (d), yaw (three.js rotation.y). */
export interface Footprint { x: number; z: number; w: number; d: number; yaw: number }

/** The point (px, pz) is inside the footprint grown by `m`. */
function inFootprint(f: Footprint, px: number, pz: number, m: number): boolean {
  const dx = px - f.x, dz = pz - f.z;
  const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
  // World -> local for rotation.y = yaw: local x = dx cos - dz sin... (three.js: world = (lx c + lz s, -lx s + lz c)).
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  return Math.abs(lx) <= f.w / 2 + m && Math.abs(lz) <= f.d / 2 + m;
}

/** World corners of a footprint. */
export function cornersOf(f: Footprint): [number, number][] {
  const c = Math.cos(f.yaw), s = Math.sin(f.yaw);
  const hx = f.w / 2, hz = f.d / 2;
  return [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([lx, lz]) => [f.x + lx * c + lz * s, f.z - lx * s + lz * c]);
}

/** Axis-aligned bounds of a footprint (for colliders). */
export function boundsOf(f: Footprint): Rect {
  const cs = cornersOf(f);
  return {
    minX: Math.min(...cs.map((p) => p[0])), maxX: Math.max(...cs.map((p) => p[0])),
    minZ: Math.min(...cs.map((p) => p[1])), maxZ: Math.max(...cs.map((p) => p[1])),
  };
}

/** Two footprints overlap (separating-axis test on the four edge normals). */
export function footprintsOverlap(a: Footprint, b: Footprint): boolean {
  const ca = cornersOf(a), cb = cornersOf(b);
  for (const f of [a, b]) {
    for (const [ax, az] of [[Math.cos(f.yaw), -Math.sin(f.yaw)], [Math.sin(f.yaw), Math.cos(f.yaw)]]) {
      const pa = ca.map(([x, z]) => x * ax + z * az), pb = cb.map(([x, z]) => x * ax + z * az);
      if (Math.max(...pa) <= Math.min(...pb) + 1e-6 || Math.max(...pb) <= Math.min(...pa) + 1e-6) return false;
    }
  }
  return true;
}

/**
 * Why a solid footprint may not stand here, or null when it may: it must keep `PAVEMENT` clear of every road's edge,
 * `PATH_GAP` clear of every footpath's edge and `RIVER_KEEP` from the Thymes' centre line, and stay in Pardonlin.
 * `pavement` overrides PAVEMENT (small props on a pavement use 0.3).
 */
export function footprintProblem(f: Footprint, pavement = PAVEMENT): string | null {
  const { roads, paths, river } = townLines();
  for (const [x, z] of cornersOf(f)) {
    if (x < PARDONLIN_RECT.minX || x > PARDONLIN_RECT.maxX || z < PARDONLIN_RECT.minZ || z > PARDONLIN_RECT.maxZ) {
      return `outside Pardonlin at (${x.toFixed(1)}, ${z.toFixed(1)})`;
    }
  }
  const r = Math.hypot(f.w, f.d) / 2;
  for (const s of roads) {
    if (Math.abs(s.x - f.x) > r + s.half + pavement || Math.abs(s.z - f.z) > r + s.half + pavement) continue;
    if (inFootprint(f, s.x, s.z, s.half + pavement)) return `on or too near a road at (${s.x.toFixed(1)}, ${s.z.toFixed(1)})`;
  }
  for (const s of paths) {
    if (Math.abs(s.x - f.x) > r + s.half + PATH_GAP || Math.abs(s.z - f.z) > r + s.half + PATH_GAP) continue;
    if (inFootprint(f, s.x, s.z, s.half + PATH_GAP)) return `on a footpath at (${s.x.toFixed(1)}, ${s.z.toFixed(1)})`;
  }
  for (const s of river) {
    if (Math.abs(s.x - f.x) > r + s.half || Math.abs(s.z - f.z) > r + s.half) continue;
    if (inFootprint(f, s.x, s.z, s.half)) return `in the Thymes or on its bank at (${s.x.toFixed(1)}, ${s.z.toFixed(1)})`;
  }
  return null;
}

/** A planStreetRow start: front-left corner on the frontage line, the row's yaw and the frontage length. */
export interface RowStart { x: number; z: number; yaw: number; length: number }

/**
 * Street rows that follow a road (or footpath, or the Thymes) on one side, fronts facing it. For every segment of the
 * path's centre line (world points from HIGHWAYS / trails / the region's paths), one row whose frontage line runs
 * `offset` metres from the centre line on `side` ('left' or 'right' of the path's point order, seen from above with
 * +z down the screen: 'left' is the side the normal (dz, -dx) points to). `gap` metres are left free at both ends of
 * each segment (bends and crossings); segments shorter than 2 x gap + 4 give no row. `from` / `to` limit which
 * segments are used (indices into the path's points: segment i runs from point i to point i + 1).
 * Feed each start to planStreetRow({ ...start, seed, corner }) and then keepClear() to drop anything that clashes.
 */
export function frontage(pathId: string, side: 'left' | 'right', offset: number, gap = 6, from = 0, to = Infinity): RowStart[] {
  const pts = pathPoints(pathId);
  const out: RowStart[] = [];
  const sgn = side === 'left' ? 1 : -1;
  for (let i = Math.max(0, from); i < Math.min(pts.length - 1, to); i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    if (len < gap * 2 + 4) continue;
    const dx = (bx - ax) / len, dz = (bz - az) / len;
    // The side normal, and the way the fronts face (back toward the path).
    const nx = dz * sgn, nz = -dx * sgn;
    const fx = -nx, fz = -nz;
    const yaw = Math.atan2(fx, fz);
    // planStreetRow runs along local +x = (cos yaw, -sin yaw) = (fz, -fx).
    const forward = fz * dx + -fx * dz > 0;
    const t = forward ? gap : len - gap;
    out.push({ x: ax + dx * t + nx * offset, z: az + dz * t + nz * offset, yaw, length: len - gap * 2 });
  }
  return out;
}

/** World points of a road, footpath ('trail/...') or water path ('thymes') by id. Throws when there is none. */
export function pathPoints(id: string): [number, number][] {
  const h = HIGHWAYS.find((p) => p.id === id);
  if (h) return h.points;
  const t = trails().find((p) => p.id === id);
  if (t) return t.points;
  const w = REGIONS.pardonlin.paths.find((p) => p.id === id);
  if (w) return w.points;
  throw new Error(`no path "${id}"`);
}

/** Distance (m) from a point to the nearest road edge in town (negative = on the road). */
export function roadClearance(x: number, z: number): number {
  let best = Infinity;
  for (const s of townLines().roads) {
    const d = Math.hypot(s.x - x, s.z - z) - s.half;
    if (d < best) best = d;
  }
  return best;
}
