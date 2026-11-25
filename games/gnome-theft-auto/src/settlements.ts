// Outer-region settlements (terrain pass): clusters of gnome houses with yards, driveways and fences along the outer
// roads of each region, in that region's theme (regionThemes.ts). Pure planner (planSettlements) plus one static prefab
// batch (buildSettlements). Deterministic: a fixed seed, so the same world always gets the same villages.
import * as THREE from 'three';
import { buildPrefab, type StaticPrefabPlacement, type Swatch } from '@lawn/prefabs';
import { buildStaticCells } from './cull';
import { mulberry32 } from '@lawn/level';
import { AIRFIELD, BASE, CITY_HALF, HIGHWAYS, PLACES, ROAD_WIDTH, SPAWN, type Highway } from './config';
import { REGION_IDS, regionAt, type RegionId } from './levels';
import { HAMLETS, HIGH_TARN } from './living/config';
import { reservedRects } from './sites';
import type { Box } from './types';
import { heightAt } from './terrain';
import { nearTrack } from './raceTrack/tracks';
import { onWaterCourse } from './water';
import { stageKeepOut } from './stageClear';
import { stageSetBoxes } from './quests/stages';
import { REGION_THEMES, themeAt, themeSize } from './regionThemes';
import { distToPolyline } from './landforms/noise';

/** One prefab of a settlement. `y` is absolute. `tint`/`trim` recolour a house's walls/roof (palette name or number). */
export interface SettlementPlacement {
  id: string; x: number; y: number; z: number; yaw: number; scale: number;
  tint?: string | number; trim?: string | number;
}

export interface SettlementPlan {
  placements: SettlementPlacement[];
  /** Colliders (houses, sheds, fences), `h` = absolute top height. */
  boxes: Box[];
  /** One entry per house: its centre and the region it is in (tests, minimap). */
  houses: { x: number; z: number; region: string }[];
}

const MAX_HOUSES = 140;
const MAX_PLACEMENTS = 2400;
/** Cluster centres every SITE_MIN..SITE_MAX metres along each outer highway. */
const SITE_MIN = 180;
const SITE_MAX = 260;
const CLUSTER_MIN = 3;
const CLUSTER_MAX = 6;
/** Candidate lot spots along the road, in multiples of LOT_GAP from the cluster centre (nearest first). */
const LOT_SPOTS = [0, 1, -1, 2, -2, 3, -3];
/** Lots along the road, spaced this far apart. */
const LOT_GAP = 18;
/** The house centre's distance from the road centre line. */
const LOT_DEPTH = 21;
/** A driveway starts one metre past the road edge (distance from the road centre line). */
const DRIVE_START = ROAD_WIDTH / 2 + 1;
/** The yard fence: a rectangle 14 wide (half FENCE_HALF) and 16 deep (half FENCE_BACK), open on the road side. */
const FENCE_HALF = 7;
const FENCE_BACK = 8;
const FENCE_TOP = 1.1;
/** Turfton (the city) and the band of countryside kept clear of houses around it. */
const CITY_GROW = 140;
/** The world's playable square half size: nothing is built beyond it. */
const MAP_EDGE = 860;
const SPAWN_CLEAR = 30;
/** Other highways must stay this far from a house centre. */
const OTHER_ROAD_CLEAR = 14;
const RESERVE_GROW = 12;
const LEVEL_GROW = 4;
const LEVEL_DROP = 1.0;
const WATER_MARGIN = 6;
/** Decor (driveways, fences, yard items) keeps this far from water. */
const DECOR_WATER = 2;
/** Houses keep this far from existing colliders (stage spots included). */
const COLLIDER_CLEAR = 3;
const CELL = 16;

interface Pt { x: number; z: number }
interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

const protoCache = new Map<string, THREE.Box3>();
function localBox(id: string): THREE.Box3 {
  let b = protoCache.get(id);
  if (!b) {
    b = new THREE.Box3().setFromObject(buildPrefab(id, { lights: false }));
    protoCache.set(id, b);
  }
  return b;
}

/** Scale that makes a prefab's longest horizontal side equal its theme size (1 for life-size prefabs). */
function scaleOf(id: string): number {
  const size = themeSize(id);
  if (size === null) return 1;
  const lb = localBox(id);
  return size / Math.max(lb.max.x - lb.min.x, lb.max.z - lb.min.z);
}

/** Half sizes of a prefab's footprint at a scale and yaw (its axes rotated, then measured), and its height. */
function footprintOf(id: string, scale: number, yaw: number): { hw: number; hd: number; h: number } {
  const lb = localBox(id);
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let hw = 0, hd = 0;
  for (const x0 of [lb.min.x, lb.max.x]) {
    for (const z0 of [lb.min.z, lb.max.z]) {
      const x = x0 * scale, z = z0 * scale;
      hw = Math.max(hw, Math.abs(c * x + s * z));
      hd = Math.max(hd, Math.abs(-s * x + c * z));
    }
  }
  return { hw, hd, h: lb.max.y * scale };
}

const rectAt = (x: number, z: number, hw: number, hd: number): Rect =>
  ({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });

const grow = (r: Rect, g: number): Rect => ({ minX: r.minX - g, maxX: r.maxX + g, minZ: r.minZ - g, maxZ: r.maxZ + g });

const overlaps = (a: Rect, b: Rect): boolean =>
  a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;

/**
 * Separation of two rectangles: the Euclidean gap when apart, or a negative overlap depth when they overlap (the larger
 * of the two axis overlaps).
 */
function sepOf(a: Rect, b: Rect): number {
  const dx = Math.max(a.minX - b.maxX, b.minX - a.maxX);
  const dz = Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ);
  if (dx < 0 && dz < 0) return Math.max(dx, dz);
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
}

/** Distance from (x, z) to the nearest highway centre line, optionally ignoring one highway by id. */
function highwayGap(x: number, z: number, skip?: string): number {
  let best = Infinity;
  for (const h of HIGHWAYS as readonly Highway[]) {
    if (h.id === skip) continue;
    best = Math.min(best, distToPolyline(x, z, h.points));
  }
  return best;
}

/** Keep-out rectangles of the reserved flat sites: every reserve marker, the fort and the airfield. */
function reserveRects(): Rect[] {
  const out: Rect[] = [];
  // Every reserve marker and every slot (sites.ts).
  for (const r of reservedRects()) out.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ });
  out.push({ minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ });
  // The airfield: the runway (along x) and the parked planes, as one rectangle.
  const pts: Pt[] = [
    { x: AIRFIELD.x - AIRFIELD.length / 2, z: AIRFIELD.z - AIRFIELD.width / 2 },
    { x: AIRFIELD.x + AIRFIELD.length / 2, z: AIRFIELD.z + AIRFIELD.width / 2 },
    ...AIRFIELD.planeSpots.map((p) => ({ x: p.x, z: p.z })),
  ];
  const pad = 6;
  out.push({
    minX: Math.min(...pts.map((p) => p.x)) - pad, maxX: Math.max(...pts.map((p) => p.x)) + pad,
    minZ: Math.min(...pts.map((p) => p.z)) - pad, maxZ: Math.max(...pts.map((p) => p.z)) + pad,
  });
  return out;
}

/** Points along a polyline every SITE_MIN..SITE_MAX metres, with the unit direction of the segment each lies on. */
function sitesAlong(points: readonly (readonly [number, number])[], rnd: () => number): { x: number; z: number; dx: number; dz: number }[] {
  const out: { x: number; z: number; dx: number; dz: number }[] = [];
  let next = SITE_MIN + rnd() * (SITE_MAX - SITE_MIN);
  let acc = 0;
  for (let k = 0; k + 1 < points.length; k++) {
    const [ax, az] = points[k], [bx, bz] = points[k + 1];
    const L = Math.hypot(bx - ax, bz - az);
    if (L <= 0) continue;
    const dx = (bx - ax) / L, dz = (bz - az) / L;
    while (next <= acc + L) {
      const t = next - acc;
      out.push({ x: ax + dx * t, z: az + dz * t, dx, dz });
      next += SITE_MIN + rnd() * (SITE_MAX - SITE_MIN);
    }
    acc += L;
  }
  return out;
}

export interface SettlementOpts {
  seed?: number;
  maxHouses?: number;
  maxPlacements?: number;
  /** Chebyshev distance max(|x|, |z|) a house centre must be beyond (default: the CITY_HALF + CITY_GROW rule only). */
  minEdge?: number;
  /** A house centre must lie within this Chebyshev distance (default MAP_EDGE). */
  maxEdge?: number;
  /** Only these regions get houses (default: all). */
  regions?: readonly RegionId[];
  /** Per-region house prefab ids used instead of the theme's `houses` (a region with an override counts as having houses). */
  housesFor?: Readonly<Partial<Record<RegionId, readonly string[]>>>;
  /** Circles houses keep out of (centre + radius, metres). */
  keepOut?: readonly { x: number; z: number; r: number }[];
}

/** The outer bands (Trellisdown, Snowcap Rise, the Saltbucket hinterland): roadside houses beyond 900 m. */
export const BAND_SETTLEMENTS: SettlementOpts = {
  seed: 9311,
  maxHouses: 70,
  maxPlacements: 1400,
  minEdge: 905,
  maxEdge: 1780,
  regions: ['west-estates', 'north-highlands', 'south-shore'],
  housesFor: {
    'west-estates': ['gnome-cottage', 'thatched-cottage'],
    'north-highlands': ['snow-cottage', 'log-cabin'],
    'south-shore': ['gnome-cottage', 'stilt-cottage'],
  },
  keepOut: [...HAMLETS, HIGH_TARN].map((p) => ({ x: p.x, z: p.z, r: p.r + 30 })),
};

/** The settlements: pure and deterministic. `existing` are colliders already in the world (keep clear of them). */
export function planSettlements(existing: readonly Box[], opts: SettlementOpts = {}): SettlementPlan {
  const rnd = mulberry32(opts.seed ?? 7331);
  const maxHouses = opts.maxHouses ?? MAX_HOUSES;
  const maxPlacements = opts.maxPlacements ?? MAX_PLACEMENTS;
  const maxEdge = opts.maxEdge ?? MAP_EDGE;
  /** The house ids a region offers under these options (the theme's, or the override). */
  const housesOf = (region: RegionId, themed: readonly string[]): readonly string[] => {
    if (opts.regions && !opts.regions.includes(region)) return [];
    return opts.housesFor?.[region] ?? themed;
  };
  const placements: SettlementPlacement[] = [];
  const boxes: Box[] = [];
  const houses: { x: number; z: number; region: string }[] = [];
  const reserves = reserveRects();
  let stop = false;

  // Box lookup: every collider is filed under the 16 m cells its bounds touch.
  const cells = new Map<string, Box[]>();
  const file = (b: Box): void => {
    for (let cx = Math.floor(b.minX / CELL); cx <= Math.floor(b.maxX / CELL); cx++) {
      for (let cz = Math.floor(b.minZ / CELL); cz <= Math.floor(b.maxZ / CELL); cz++) {
        const k = `${cx},${cz}`;
        const list = cells.get(k);
        if (list) list.push(b); else cells.set(k, [b]);
      }
    }
  };
  for (const b of existing) file(b);
  /** True when r keeps at least `g` metres (negative: may overlap by that much) from every filed collider and `extra`. */
  const clear = (r: Rect, g: number, extra: readonly Box[] = []): boolean => {
    const q = grow(r, Math.max(g, 0));
    const seen = new Set<Box>();
    for (let cx = Math.floor(q.minX / CELL); cx <= Math.floor(q.maxX / CELL); cx++) {
      for (let cz = Math.floor(q.minZ / CELL); cz <= Math.floor(q.maxZ / CELL); cz++) {
        for (const b of cells.get(`${cx},${cz}`) ?? []) {
          if (seen.has(b)) continue;
          seen.add(b);
          if (sepOf(r, b) < g) return false;
        }
      }
    }
    for (const b of extra) if (sepOf(r, b) < g) return false;
    return true;
  };

  const nearSpawn = (p: Pt): boolean => {
    if (Math.hypot(p.x - SPAWN.x, p.z - SPAWN.z) < SPAWN_CLEAR) return true;
    return PLACES.some((q) => Math.hypot(p.x - q.x, p.z - q.z) < SPAWN_CLEAR);
  };

  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];

  /** A decor piece (no collider unless `collider`): skipped when it sits on water or overlaps a collider. */
  const placeDecor = (out: { pl: SettlementPlacement[]; boxes: Box[] }, id: string, p: Pt, yaw: number, scale: number, collider: boolean): void => {
    if (onWaterCourse(p.x, p.z, DECOR_WATER)) return;
    const f = footprintOf(id, scale, yaw);
    const r = rectAt(p.x, p.z, f.hw, f.hd);
    if (!clear(r, -0.05, out.boxes)) return;
    const y = heightAt(p.x, p.z);
    out.pl.push({ id, x: p.x, y, z: p.z, yaw, scale });
    if (collider && Math.min(2 * f.hw, 2 * f.hd) >= 1) out.boxes.push({ ...r, h: y + f.h });
  };

  /** One lot: a house on the side of the road at distance `s` along it. True when the house was placed. */
  const placeLot = (road: Highway, R: Pt, d: Pt, s: number, side: number): boolean => {
    // n: unit normal from the road towards the lot. t: unit from the house towards the road (the house's front).
    const n = { x: -d.z * side, z: d.x * side };
    const t = { x: -n.x, z: -n.z };
    const H: Pt = { x: R.x + d.x * s + n.x * LOT_DEPTH, z: R.z + d.z * s + n.z * LOT_DEPTH };
    const at = (u: number, v: number): Pt => ({ x: H.x + d.x * u + t.x * v, z: H.z + d.z * u + t.z * v });

    if (Math.abs(H.x) > maxEdge || Math.abs(H.z) > maxEdge) return false;
    const edge = Math.max(Math.abs(H.x), Math.abs(H.z));
    if (edge <= CITY_HALF + CITY_GROW) return false;
    if (opts.minEdge !== undefined && edge <= opts.minEdge) return false;
    if (nearSpawn(H)) return false;
    const theme = themeAt(H.x, H.z, rnd());
    const houseIds = housesOf(regionAt(H.x, H.z), theme.houses);
    if (houseIds.length === 0) return false;
    if (opts.keepOut?.some((k) => Math.hypot(H.x - k.x, H.z - k.z) < k.r)) return false;

    const houseId = pick(houseIds);
    const scale = scaleOf(houseId) * (0.9 + 0.25 * rnd());
    const tint = pick(theme.palette.walls);
    const trim = pick(theme.palette.roofs);
    const yaw = Math.atan2(t.x, t.z);
    const fp = footprintOf(houseId, scale, yaw);
    const lb = localBox(houseId);
    const frontV = lb.max.z * scale;
    const halfU = ((lb.max.x - lb.min.x) * scale) / 2;
    const hRect = rectAt(H.x, H.z, fp.hw, fp.hd);

    // Level ground under the house and a margin round it.
    const g4 = rectAt(H.x, H.z, fp.hw + LEVEL_GROW, fp.hd + LEVEL_GROW);
    const hs = [
      heightAt(H.x, H.z),
      heightAt(g4.minX, g4.minZ), heightAt(g4.maxX, g4.minZ),
      heightAt(g4.minX, g4.maxZ), heightAt(g4.maxX, g4.maxZ),
    ];
    if (Math.max(...hs) - Math.min(...hs) > LEVEL_DROP) return false;
    for (const fx of [-1, 0, 1]) {
      for (const fz of [-1, 0, 1]) {
        if (onWaterCourse(H.x + fx * fp.hw, H.z + fz * fp.hd, WATER_MARGIN)) return false;
      }
    }
    if (!clear(hRect, COLLIDER_CLEAR)) return false;
    if (reserves.some((r) => overlaps(grow(r, RESERVE_GROW), hRect))) return false;
    if (nearTrack(H.x, H.z, 20)) return false;
    if (highwayGap(H.x, H.z, road.id) < OTHER_ROAD_CLEAR) return false;

    const y = heightAt(H.x, H.z);
    const pl: SettlementPlacement[] = [{ id: houseId, x: H.x, y, z: H.z, yaw, scale, tint, trim }];
    const lotBoxes: Box[] = [{ ...hRect, h: y + fp.h }];
    const out = { pl, boxes: lotBoxes };

    // Driveway: from one metre past the road edge to the house front, paving pieces end to end.
    const drivePaving = theme.paving;
    const Lp = localBox(drivePaving).max.z - localBox(drivePaving).min.z;
    const driveFrom = LOT_DEPTH - DRIVE_START;
    const driveLen = driveFrom - frontV;
    const nDrive = Lp > 0 ? Math.floor(driveLen / Lp) : 0;
    for (let k = 0; k < nDrive; k++) {
      const v = driveFrom - (driveLen - nDrive * Lp) / 2 - (k + 0.5) * Lp;
      const p = at(0, v);
      if (onWaterCourse(p.x, p.z, DECOR_WATER)) continue;
      // A drive never lies on a road (at a bend or a junction): its ends and middle stay off every carriageway.
      if ([-Lp / 2, 0, Lp / 2].some((dv) => { const q = at(0, v + dv); return highwayGap(q.x, q.z) < ROAD_WIDTH / 2 + 1.6; })) continue;
      pl.push({ id: drivePaving, x: p.x, y: heightAt(p.x, p.z), z: p.z, yaw, scale: 1 });
    }

    // Mailbox at the drive's road end, 1.5 m to one side (only where the region's yard has one).
    if (theme.yard.includes('mailbox')) {
      placeDecor(out, 'mailbox', at(1.5, driveFrom), yaw, scaleOf('mailbox'), false);
    }

    // Yard fence: three runs round the house, the road side open. Pieces end to end along the run.
    const fenceId = theme.fence;
    const fLb = localBox(fenceId);
    const fScale = scaleOf(fenceId);
    const fLong = fLb.max.x - fLb.min.x >= fLb.max.z - fLb.min.z;
    const fLen = Math.max(fLb.max.x - fLb.min.x, fLb.max.z - fLb.min.z) * fScale;
    const runs: { a: Pt; dir: Pt; len: number }[] = [
      { a: at(-FENCE_HALF, -FENCE_BACK), dir: t, len: 2 * FENCE_BACK },
      { a: at(FENCE_HALF, -FENCE_BACK), dir: t, len: 2 * FENCE_BACK },
      { a: at(-FENCE_HALF, -FENCE_BACK), dir: d, len: 2 * FENCE_HALF },
    ];
    for (const run of runs) {
      const nP = fLen > 0 ? Math.floor(run.len / fLen) : 0;
      const off = (run.len - nP * fLen) / 2;
      for (let k = 0; k < nP; k++) {
        const s0 = off + (k + 0.5) * fLen;
        const c: Pt = { x: run.a.x + run.dir.x * s0, z: run.a.z + run.dir.z * s0 };
        const e1: Pt = { x: c.x - run.dir.x * fLen / 2, z: c.z - run.dir.z * fLen / 2 };
        const e2: Pt = { x: c.x + run.dir.x * fLen / 2, z: c.z + run.dir.z * fLen / 2 };
        const yawF = fLong ? Math.atan2(-run.dir.z, run.dir.x) : Math.atan2(run.dir.x, run.dir.z);
        const f = footprintOf(fenceId, fScale, yawF);
        const r = rectAt(c.x, c.z, f.hw, f.hd);
        if (onWaterCourse(c.x, c.z, DECOR_WATER)) continue;
        if (!clear(r, -0.05, lotBoxes)) continue;
        const y = Math.min(heightAt(e1.x, e1.z), heightAt(e2.x, e2.z)) - 0.05;
        pl.push({ id: fenceId, x: c.x, y, z: c.z, yaw: yawF, scale: fScale });
        lotBoxes.push({ ...r, h: y + FENCE_TOP });
      }
    }

    // Yard dressing: one item 3 to 4 m beside the house, one or two plantings in front.
    const yardIds = theme.yard.filter((id) => id !== 'mailbox');
    if (yardIds.length > 0) {
      const side = rnd() < 0.5 ? -1 : 1;
      const id = pick(yardIds);
      const u = side * (halfU + 3 + rnd());
      placeDecor(out, id, at(u, 0), rnd() * Math.PI * 2, scaleOf(id), true);
    }
    const nPlant = 1 + Math.floor(rnd() * 2);
    for (let j = 0; j < nPlant; j++) {
      const id = pick(theme.planting);
      const u = (j % 2 === 0 ? -1 : 1) * 2.5;
      placeDecor(out, id, at(u, frontV + 1.5), rnd() * Math.PI * 2, scaleOf(id), false);
    }

    // Budget: a lot that would overflow the placement budget ends the planning.
    if (placements.length + pl.length > maxPlacements) { stop = true; return false; }
    for (const p of pl) placements.push(p);
    for (const b of lotBoxes) { boxes.push(b); file(b); }
    houses.push({ x: H.x, z: H.z, region: regionAt(H.x, H.z) });
    if (houses.length >= maxHouses) stop = true;
    return true;
  };

  /** One cluster of k houses centred on road point site (direction dx, dz) of highway h. */
  const cluster = (h: Highway, site: { x: number; z: number; dx: number; dz: number }): void => {
    const k = CLUSTER_MIN + Math.floor(rnd() * (CLUSTER_MAX - CLUSTER_MIN + 1));
    const R: Pt = { x: site.x, z: site.z };
    const d: Pt = { x: site.dx, z: site.dz };
    // Lots go out from the centre along the road, alternating sides. A rejected lot is replaced by the next candidate
    // (the next spot along the road, then the other side), until the cluster has k houses or the spots run out.
    let placed = 0;
    for (const q of LOT_SPOTS) {
      const pref = placed % 2 === 0 ? 1 : -1;
      for (const side of [pref, -pref]) {
        if (placed >= k || stop) break;
        if (placeLot(h, R, d, q * LOT_GAP, side)) placed++;
      }
      if (placed >= k || stop) break;
    }
  };

  // Clusters: along every highway, a centre every 180-260 m; beyond Turfton, in a region that has houses.
  for (const h of HIGHWAYS as readonly Highway[]) {
    for (const site of sitesAlong(h.points, rnd)) {
      if (stop) break;
      if (Math.max(Math.abs(site.x), Math.abs(site.z)) <= CITY_HALF + CITY_GROW) continue;
      if (opts.minEdge !== undefined && Math.max(Math.abs(site.x), Math.abs(site.z)) <= opts.minEdge - LOT_DEPTH) continue;
      if (housesOf(regionAt(site.x, site.z), themeAt(site.x, site.z).houses).length === 0) continue;
      cluster(h, site);
    }
    if (stop) break;
  }

  // Every region with houses in its theme gets a hamlet: a region the regular spacing missed (its stretch of road is
  // short, like Tallgrass Commons' end of the commons spur) is tried every 30 m along its own roads.
  for (const region of REGION_IDS) {
    if (stop || housesOf(region, REGION_THEMES[region].houses).length === 0) continue;
    for (const h of HIGHWAYS as readonly Highway[]) {
      for (let k = 0; k + 1 < h.points.length; k++) {
        const [ax, az] = h.points[k], [bx, bz] = h.points[k + 1];
        const L = Math.hypot(bx - ax, bz - az);
        for (let t = 15; t < L; t += 30) {
          if (stop || houses.filter((x) => x.region === region).length >= CLUSTER_MIN) break;
          const x = ax + ((bx - ax) * t) / L, z = az + ((bz - az) * t) / L;
          if (regionAt(x, z) !== region || Math.max(Math.abs(x), Math.abs(z)) <= CITY_HALF + CITY_GROW) continue;
          if (opts.minEdge !== undefined && Math.max(Math.abs(x), Math.abs(z)) <= opts.minEdge - LOT_DEPTH) continue;
          cluster(h, { x, z, dx: (bx - ax) / L, dz: (bz - az) / L });
        }
      }
    }
  }

  return { placements, boxes, houses };
}

/** Builds planSettlements() as one static prefab batch on `scene` and pushes its colliders into `boxes`. */
export function buildSettlements(scene: THREE.Scene, boxes: Box[]): void {
  // Stage spots (cutscene marks, walks, drive paths) and the solid pieces of stage sets count as existing colliders
  // here, so houses keep clear of them.
  const plan = planSettlements([...boxes, ...stageKeepOut(), ...stageSetBoxes()]);
  const batch: StaticPrefabPlacement[] = plan.placements.map((p) => ({
    ...p,
    tint: p.tint as Swatch | number | undefined,
    trim: p.trim as Swatch | number | undefined,
  }));
  // Per cell, culled as buildings (cull.ts).
  scene.add(buildStaticCells(batch, { lights: false, name: 'settlements', cls: 'building' }));
  for (const b of plan.boxes) boxes.push(b);

  // Second pass: roadside houses in the outer bands.
  const bands = planSettlements([...boxes, ...plan.boxes, ...stageKeepOut(), ...stageSetBoxes()], BAND_SETTLEMENTS);
  const bandBatch: StaticPrefabPlacement[] = bands.placements.map((p) => ({
    ...p,
    tint: p.tint as Swatch | number | undefined,
    trim: p.trim as Swatch | number | undefined,
  }));
  scene.add(buildStaticCells(bandBatch, { lights: false, name: 'settlements-bands', cls: 'building' }));
  for (const b of bands.boxes) boxes.push(b);
}
