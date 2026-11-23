// The GTA world's water: the river, the canal, Loch Moss and the Puddle Sea (Wild World Epic 4).
//
// Geometry comes from the region documents (levels.ts): rivers and the canal are `water` paths, still water is a
// `water` marker rectangle (drawn as a rounded superellipse inside it). Heights come from the ground itself: terrain.ts
// calls carveWater() on its height grid after the road and site flatten passes, and the water levels are worked out
// from that ground so they always run downhill, whatever relief later epics add:
//
//   - walking the chain WATER.order from the source to the sea, each course's surface is the lowest bank so far minus
//     WATER.freeboard, so it never rises along the path;
//   - a loch or sea is level, no higher than whatever feeds it and below its own rim;
//   - the canal is split into pounds by WATER.canalLocks and is level within each pound: it only steps down at a lock.
//
// Then the mouths are blended (a stretch higher than the one it flows into is lowered over its last metres), the bridge
// decks are raised clear of the water on earth ramps, and the beds are carved into the grid (min with the ground, never
// raised). heightAt (terrain.ts) returns the deck on a bridge; bedAt and waterAt see the water underneath it, so boats
// pass under.
//
// Pure: no three.js, no DOM. Imports nothing from terrain.ts (terrain.ts imports this); terrain.ts registers
// setWaterSource() so the getters here can build the grid on first use.
import { smoothstep } from '@lawn/level';
import { CITY_HALF, HIGHWAYS, ROAD_WIDTH, WATER } from './config';
import { LAYOUT, REGION_DOCS, REGION_IDS, waterBodies, waterPaths } from './levels';

// ---- Static geometry (no heights) -----------------------------------------------------------------------------------
/** A river or the canal: a polyline from upstream to downstream. */
export interface WaterCourse {
  id: string;
  kind: 'river' | 'canal';
  points: [number, number][];
  width: number;
  /** Depth at the middle, metres. */
  depth: number;
  /** Width of the slope from the waterline up to the land, metres. */
  bank: number;
}

/** A loch or sea: a superellipse (|dx/a|^4 + |dz/b|^4 <= 1) centred at (cx, cz). */
export interface StillWater {
  id: string;
  cx: number; cz: number;
  /** Half extents along x and z. */
  a: number; b: number;
  depth: number;
  /** Fraction of the radius over which the bed shelves down from the shore. */
  shelf: number;
  bank: number;
}

/** A course's mouth pool reaches this far out into a loch or sea (metres). */
const MOUTH_R = 14;

const COURSE_DEFAULT = { depth: 1.6, bank: 6 };
const BODY_DEFAULT = { depth: 3, shelf: 0.4, bank: 8 };

/** Every river and canal stretch, in document order. */
export const COURSES: readonly WaterCourse[] = waterPaths().map((p) => {
  const t = (WATER.courses as Record<string, { depth: number; bank: number }>)[p.id] ?? COURSE_DEFAULT;
  return { id: p.id, kind: p.id === 'canal' ? 'canal' : 'river', points: p.points, width: p.width, depth: t.depth, bank: t.bank };
});

/** Every loch and sea. */
export const BODIES: readonly StillWater[] = waterBodies().map((r) => {
  const t = (WATER.bodies as Record<string, { depth: number; shelf: number; bank: number }>)[r.id] ?? BODY_DEFAULT;
  return {
    id: r.id, cx: (r.minX + r.maxX) / 2, cz: (r.minZ + r.maxZ) / 2, a: (r.maxX - r.minX) / 2, b: (r.maxZ - r.minZ) / 2,
    depth: t.depth, shelf: t.shelf, bank: t.bank,
  };
});

/** Superellipse radius: < 1 inside, 1 on the shore. */
export function bodyRadius(w: StillWater, x: number, z: number): number {
  const u = (x - w.cx) / w.a, v = (z - w.cz) / w.b;
  return Math.pow(u * u * u * u + v * v * v * v, 0.25);
}

/** A point on the shore of `w` at angle `ang` (radians, 0 = +x). */
export function shorePoint(w: StillWater, ang: number): { x: number; z: number } {
  const c = Math.cos(ang), s = Math.sin(ang);
  const r = Math.pow(Math.pow(Math.abs(c), 4) + Math.pow(Math.abs(s), 4), -0.25);
  return { x: w.cx + w.a * r * c, z: w.cz + w.b * r * s };
}

function segDist(x: number, z: number, ax: number, az: number, bx: number, bz: number): { d: number; t: number } {
  const vx = bx - ax, vz = bz - az;
  const len2 = vx * vx + vz * vz || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / len2));
  return { d: Math.hypot(x - ax - vx * t, z - az - vz * t), t };
}

/** The river's source (the first point of the first course in WATER.order): no carving within WATER.sourceClear of it,
 * so the Frozen Birdbath Basin's ice bowl stays whole and the river rises at its rim. */
const SOURCE = COURSES.find((c) => c.id === WATER.order[0])?.points[0] ?? null;
function nearSource(x: number, z: number): boolean {
  return SOURCE !== null && Math.hypot(x - SOURCE[0], z - SOURCE[1]) < WATER.sourceClear;
}

/**
 * True when (x, z) is on the water (any course within width/2 + margin of its centre line, or inside a loch or sea
 * grown by margin). Static geometry only: needs no heights, so scatter code can call it to keep clear of the water.
 */
export function onWaterCourse(x: number, z: number, margin = 0): boolean {
  if (nearSource(x, z)) return false;
  for (const c of COURSES) {
    const r = c.width / 2 + margin;
    for (let k = 0; k + 1 < c.points.length; k++) {
      const [ax, az] = c.points[k];
      const [bx, bz] = c.points[k + 1];
      if (x < Math.min(ax, bx) - r || x > Math.max(ax, bx) + r || z < Math.min(az, bz) - r || z > Math.max(az, bz) + r) continue;
      if (segDist(x, z, ax, az, bx, bz).d <= r) return true;
    }
  }
  for (const w of BODIES) {
    if (bodyRadius(w, x, z) <= 1 + margin / Math.min(w.a, w.b)) return true;
  }
  return false;
}

// ---- Heights (filled by carveWater) ---------------------------------------------------------------------------------
/** One course sampled about every 2 m from upstream: arclength s, centre (x, z), water surface and bed height. */
export interface CourseProfile {
  id: string;
  s: number[];
  x: number[];
  z: number[];
  surface: number[];
  bed: number[];
}

/** A road bridge: where a highway crosses a course. The deck is a rectangle centred at (x, z) along the road. */
export interface BridgeSpan {
  id: string;
  road: string;
  course: string;
  x: number; z: number;
  /** Road direction, radians: the deck's long axis is (sin yaw, cos yaw). */
  yaw: number;
  /** Along the road, metres (water width + both banks + overhang). */
  length: number;
  /** Across the road, metres. */
  width: number;
  /** Deck top height: the higher of (the road's height before carving + WATER.deckRise) and (the water surface at the
   *  crossing + WATER.bridgeClearance for the course). The earth ramps are raised to meet it. */
  deck: number;
}

/** A canal lock: the canal steps from `upper` to `lower` here. */
export interface CanalLock {
  x: number; z: number;
  /** Canal direction, radians (downstream is (sin yaw, cos yaw)). */
  yaw: number;
  upper: number;
  lower: number;
}

interface WaterState {
  profiles: Map<string, CourseProfile>;
  levels: Map<string, number>;
  bridges: BridgeSpan[];
  locks: CanalLock[];
  /** Water surface per grid vertex (NaN = none). */
  levelGrid: Float32Array;
  /** The carved grid (shared with terrain.ts). */
  grid: Float32Array;
  N: number; half: number; step: number;
}

let state: WaterState | null = null;
let source: (() => unknown) | null = null;

/** terrain.ts registers a callback that builds its height grid (and so runs carveWater). */
export function setWaterSource(fn: (() => unknown) | null): void {
  source = fn;
}

/** Forget the carved water (terrain.ts calls this whenever it throws its grid away). */
export function resetWater(): void {
  state = null;
}

function ready(): WaterState | null {
  // Every time: the terrain may have thrown its grid away (setTerrainOptions) or gone dry since the last call.
  if (source) source();
  return state;
}

/** True once the water is carved (false while the terrain is the old dry world). */
export function waterOn(): boolean {
  return ready() !== null;
}

function pathResample(points: [number, number][], step: number): { s: number[]; x: number[]; z: number[] } {
  const s: number[] = [0], x: number[] = [points[0][0]], z: number[] = [points[0][1]];
  let acc = 0;
  for (let k = 0; k + 1 < points.length; k++) {
    const [ax, az] = points[k];
    const [bx, bz] = points[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / step));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      x.push(ax + (bx - ax) * t);
      z.push(az + (bz - az) * t);
      s.push(acc + len * t);
    }
    acc += len;
  }
  return { s, x, z };
}

/** Arclength of the point on the polyline nearest (segment k, fraction t). */
function arcAt(points: [number, number][], k: number, t: number): number {
  let acc = 0;
  for (let i = 0; i < k; i++) acc += Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
  return acc + t * Math.hypot(points[k + 1][0] - points[k][0], points[k + 1][1] - points[k][1]);
}

/** Linear interpolation of ys over sorted xs. */
function interp(xs: number[], ys: number[], v: number): number {
  if (v <= xs[0]) return ys[0];
  const n = xs.length - 1;
  if (v >= xs[n]) return ys[n];
  let lo = 0, hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= v) lo = mid; else hi = mid;
  }
  const t = (v - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return ys[lo] + (ys[hi] - ys[lo]) * t;
}

/** Bed depth factor across a course: 1 in the middle, 0 at the waterline (d = half width). */
function across(kind: 'river' | 'canal', d: number, hw: number): number {
  if (d >= hw) return 0;
  if (kind === 'canal') return d <= hw - 0.6 ? 1 : (hw - d) / 0.6;
  const u = d / hw;
  return 1 - u * u;
}

/**
 * Carve the water into a height grid (vertex (i, j) at x = -half + i * step, z = -half + j * step, N per side). The
 * grid must already hold the finished ground (relief, roads, sites, Turfton). Never raises a vertex. terrain.ts calls it
 * once per grid build, after the flatten passes; tests may call it on a synthetic grid.
 */
/** Every region document's `island` terrain feature, in world coordinates (centre and radius). */
export const ISLANDS: readonly { id: string; x: number; z: number; r: number }[] = REGION_IDS.flatMap((id) => {
  const o = LAYOUT.regions.find((r) => r.id === id)?.origin ?? { x: 0, z: 0 };
  return (REGION_DOCS[id].data.terrain?.features ?? [])
    .filter((f) => f.kind === 'island' && f.points.length > 0)
    .map((f) => ({ id: f.id, x: f.points[0][0] + o.x, z: f.points[0][1] + o.z, r: f.r ?? 1 }));
});

export function carveWater(g: Float32Array, N: number, half: number, step: number): void {
  const pre = g.slice();
  const sample = (x: number, z: number): number => {
    const u = Math.max(0, Math.min(N - 1, (x + half) / step));
    const v = Math.max(0, Math.min(N - 1, (z + half) / step));
    const i = Math.min(N - 2, Math.floor(u)), j = Math.min(N - 2, Math.floor(v));
    const fx = u - i, fz = v - j;
    const a = pre[j * N + i], b = pre[j * N + i + 1], c = pre[(j + 1) * N + i], d = pre[(j + 1) * N + i + 1];
    return (a * (1 - fx) + b * fx) * (1 - fz) + (c * (1 - fx) + d * fx) * fz;
  };
  const fb = WATER.freeboard;
  const courseById = new Map(COURSES.map((c) => [c.id, c]));
  const bodyById = new Map(BODIES.map((b) => [b.id, b]));
  const profiles = new Map<string, CourseProfile>();
  const levels = new Map<string, number>();
  const locks: CanalLock[] = [];

  // ---- Levels, walking downstream ----
  let prev = Infinity;
  const order = [...WATER.order, ...COURSES.map((c) => c.id), ...BODIES.map((b) => b.id)];
  const seen = new Set<string>();
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);
    const c = courseById.get(id);
    const w = bodyById.get(id);
    // Anything not in WATER.order starts its own chain.
    const feed = (WATER.order as readonly string[]).includes(id) ? prev : Infinity;
    if (c) {
      const r = pathResample(c.points, step);
      const n = r.s.length;
      // A course may sit deeper in its banks than the others (WATER.courses[id].freeboard).
      const cfb = (WATER.courses as Record<string, { freeboard?: number }>)[id]?.freeboard ?? fb;
      const bank = r.s.map((_, k) => {
        const kk = Math.min(n - 2, k);
        const dx = r.x[kk + 1] - r.x[kk], dz = r.z[kk + 1] - r.z[kk];
        const l = Math.hypot(dx, dz) || 1;
        const nx = -dz / l, nz = dx / l, o = c.width / 2 + 1;
        return Math.min(sample(r.x[k], r.z[k]), sample(r.x[k] + nx * o, r.z[k] + nz * o), sample(r.x[k] - nx * o, r.z[k] - nz * o));
      });
      const surface = new Array<number>(n);
      if (c.kind === 'canal') {
        // Level pounds between the locks.
        const total = r.s[n - 1];
        const cuts = [0, ...WATER.canalLocks.map((f) => f * total), Infinity];
        let level = feed;
        for (let p = 0; p + 1 < cuts.length; p++) {
          let lo = level;
          for (let k = 0; k < n; k++) if (r.s[k] >= cuts[p] && r.s[k] < cuts[p + 1]) lo = Math.min(lo, bank[k] - cfb);
          if (!Number.isFinite(lo)) lo = -cfb;
          for (let k = 0; k < n; k++) if (r.s[k] >= cuts[p] && r.s[k] < cuts[p + 1]) surface[k] = lo;
          if (p > 0) {
            const k = r.s.findIndex((s) => s >= cuts[p]);
            const kk = Math.min(n - 2, k);
            locks.push({
              x: r.x[k], z: r.z[k], yaw: Math.atan2(r.x[kk + 1] - r.x[kk], r.z[kk + 1] - r.z[kk]),
              upper: level, lower: lo,
            });
          }
          level = lo;
        }
      } else {
        let level = feed;
        for (let k = 0; k < n; k++) {
          level = Math.min(level, bank[k] - cfb);
          surface[k] = level;
        }
      }
      profiles.set(id, { id, s: r.s, x: r.x, z: r.z, surface, bed: surface.map((h) => h - c.depth) });
      prev = surface[n - 1];
    } else if (w) {
      let rim = Infinity;
      for (let k = 0; k < 96; k++) {
        const p = shorePoint(w, (k / 96) * Math.PI * 2);
        rim = Math.min(rim, sample(p.x, p.z));
      }
      const level = Math.min(feed, rim - fb);
      levels.set(id, level);
      prev = level;
    }
  }

  // ---- Mouths: a stretch higher than the one it flows into is lowered over its last metres. Downstream first, so a
  // lowered stretch can lower its feeder too. Keeps every surface non-increasing: no dry bar at a junction.
  const startOf = (id: string): number => profiles.get(id)?.surface[0] ?? levels.get(id) ?? NaN;
  for (let i = WATER.order.length - 2; i >= 0; i--) {
    const p = profiles.get(WATER.order[i]);
    if (!p) continue;
    const startN = startOf(WATER.order[i + 1]);
    const n = p.s.length, sEnd = p.s[n - 1];
    if (!(startN < p.surface[n - 1])) continue;
    for (let k = 0; k < n; k++) p.surface[k] = Math.min(p.surface[k], startN + (sEnd - p.s[k]) * WATER.mouthSlope);
    const depth = courseById.get(p.id)!.depth;
    p.bed = p.surface.map((h) => h - depth);
  }

  // ---- Bridges: highway x course crossings. The deck stands above the road and clear of the water. ----
  const bridges: BridgeSpan[] = [];
  const roads: number[] = [];
  for (const c of COURSES) {
    for (const hw of HIGHWAYS) {
      for (let i = 0; i + 1 < c.points.length; i++) {
        for (let j = 0; j + 1 < hw.points.length; j++) {
          const [ax, az] = c.points[i], [bx, bz] = c.points[i + 1];
          const [cx, cz] = hw.points[j], [dx, dz] = hw.points[j + 1];
          const den = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx);
          if (Math.abs(den) < 1e-9) continue;
          const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / den;
          const u = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / den;
          if (t < 0 || t > 1 || u < 0 || u > 1) continue;
          const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
          if (bridges.some((b) => Math.hypot(b.x - x, b.z - z) < 4)) continue;
          // The crossing angle stretches the span.
          const ry = Math.atan2(dx - cx, dz - cz);
          const cy = Math.atan2(bx - ax, bz - az);
          const sinA = Math.max(0.35, Math.abs(Math.sin(ry - cy)));
          const prof = profiles.get(c.id)!;
          const level = interp(prof.s, prof.surface, arcAt(c.points, i, t));
          const road = sample(x, z);
          const clearance = WATER.bridgeClearance[c.id] ?? WATER.bridgeClearance.default;
          bridges.push({
            id: `bridge/${c.id}/${hw.id}`, road: hw.id, course: c.id, x, z, yaw: ry,
            length: (c.width + 2 * c.bank) / sinA + 2 * WATER.bridgeOverhang,
            width: ROAD_WIDTH + 2 * WATER.bridgeMargin,
            deck: Math.max(road + WATER.deckRise, level + clearance),
          });
          roads.push(road);
        }
      }
    }
  }

  // ---- Embankments: the earth ramps that carry each road up to its raised deck. Raises only (max with the ground),
  // never inside Turfton. Ramps are raised in both pre (the carve's bank blend sees them) and g.
  const base = pre.slice();
  const cityEdge = CITY_HALF + 2;
  const hwIn = ROAD_WIDTH / 2 + 2;
  bridges.forEach((b, bi) => {
    const road = roads[bi];
    const blendW = Math.max(6, 2 * (b.deck - road));
    const reachA = b.length / 2 + (b.deck - road) / WATER.bridgeGrade + 2;
    const reachC = hwIn + blendW;
    const s = Math.sin(b.yaw), c = Math.cos(b.yaw);
    const ex = reachA * Math.abs(s) + reachC * Math.abs(c);
    const ez = reachA * Math.abs(c) + reachC * Math.abs(s);
    const clampG = (v: number): number => Math.max(0, Math.min(N - 1, v));
    const i0 = clampG(Math.floor((b.x - ex + half) / step)), i1 = clampG(Math.ceil((b.x + ex + half) / step));
    const j0 = clampG(Math.floor((b.z - ez + half) / step)), j1 = clampG(Math.ceil((b.z + ez + half) / step));
    for (let j = j0; j <= j1; j++) {
      const z = -half + j * step;
      for (let i = i0; i <= i1; i++) {
        const x = -half + i * step;
        if (Math.abs(x) <= cityEdge && Math.abs(z) <= cityEdge) continue;
        const dx = x - b.x, dz = z - b.z;
        const along = Math.abs(dx * s + dz * c), side = Math.abs(dx * c - dz * s);
        if (along > reachA || side > reachC) continue;
        // Under the deck the bank stays below the slab (0.6 thick), so the deck top never lies in the ground's plane; the
        // last grid step under each deck end sits just under it (an 0.08 m lip) so the road meets the deck.
        const t = along <= b.length / 2 - step ? b.deck - 0.6 : along <= b.length / 2 ? b.deck - 0.08 : b.deck - 0.08 - (along - b.length / 2) * WATER.bridgeGrade;
        const idx = j * N + i;
        const own = base[idx];
        const w = side <= hwIn ? 1 : 1 - smoothstep(hwIn, reachC, side);
        const v = own + (t - own) * w;
        if (v > pre[idx]) pre[idx] = g[idx] = v;
      }
    }
  });

  // ---- Carve ----
  const levelGrid = new Float32Array(N * N).fill(NaN);
  const clampI = (v: number): number => Math.max(0, Math.min(N - 1, v));
  const lay = (idx: number, level: number, bed: number, keep: number): void => {
    // keep: 0 at the waterline and below, 1 on the untouched land.
    const h = bed < level ? bed : level + (pre[idx] - level) * keep;
    if (h < g[idx]) g[idx] = h;
  };
  for (const c of COURSES) {
    const prof = profiles.get(c.id)!;
    const hw = c.width / 2;
    const reach = hw + c.bank;
    const n = c.points.length;
    const bestD = new Map<number, { d: number; s: number }>();
    for (let k = 0; k + 1 < n; k++) {
      const [ax, az] = c.points[k], [bx, bz] = c.points[k + 1];
      const i0 = clampI(Math.floor((Math.min(ax, bx) - reach + half) / step)), i1 = clampI(Math.ceil((Math.max(ax, bx) + reach + half) / step));
      const j0 = clampI(Math.floor((Math.min(az, bz) - reach + half) / step)), j1 = clampI(Math.ceil((Math.max(az, bz) + reach + half) / step));
      for (let j = j0; j <= j1; j++) {
        const z = -half + j * step;
        for (let i = i0; i <= i1; i++) {
          const x = -half + i * step;
          const r = segDist(x, z, ax, az, bx, bz);
          if (r.d >= reach) continue;
          const idx = j * N + i;
          const b = bestD.get(idx);
          if (!b || r.d < b.d) bestD.set(idx, { d: r.d, s: arcAt(c.points, k, r.t) });
        }
      }
    }
    for (const [idx, b] of bestD) {
      if (nearSource(-half + (idx % N) * step, -half + Math.floor(idx / N) * step)) continue;
      const level = interp(prof.s, prof.surface, b.s);
      const bed = level - c.depth * across(c.kind, b.d, hw);
      lay(idx, level, b.d < hw ? bed : level, smoothstep(hw, reach, b.d));
      if (b.d < hw + step && !(levelGrid[idx] < level)) levelGrid[idx] = level;
    }
  }
  for (const w of BODIES) {
    const level = levels.get(w.id)!;
    const m = Math.min(w.a, w.b);
    const i0 = clampI(Math.floor((w.cx - w.a - w.bank + half) / step)), i1 = clampI(Math.ceil((w.cx + w.a + w.bank + half) / step));
    const j0 = clampI(Math.floor((w.cz - w.b - w.bank + half) / step)), j1 = clampI(Math.ceil((w.cz + w.b + w.bank + half) / step));
    for (let j = j0; j <= j1; j++) {
      const z = -half + j * step;
      for (let i = i0; i <= i1; i++) {
        const x = -half + i * step;
        const r = bodyRadius(w, x, z);
        const out = (r - 1) * m;
        if (out >= w.bank) continue;
        const idx = j * N + i;
        const bed = level - w.depth * smoothstep(0, w.shelf, 1 - r);
        lay(idx, level, out < 0 ? bed : level, smoothstep(0, w.bank, out));
        // An island (a document `island` feature, e.g. Loch Moss's tessie-island) keeps its own ground, sunk by
        // WATER.islandSink, wherever that is above the carved bed; it only counts when its top clears the water.
        let dry = false;
        for (const isl of ISLANDS) {
          const d = Math.hypot(x - isl.x, z - isl.z);
          if (d >= isl.r * 1.3 || sample(isl.x, isl.z) - WATER.islandSink <= level) continue;
          const keepH = pre[idx] - WATER.islandSink;
          if (keepH > g[idx]) g[idx] = keepH;
          if (g[idx] >= level + 0.3) dry = true;
        }
        if (out < step) levelGrid[idx] = dry ? NaN : level;
      }
    }
  }
  // ---- Mouth pools: where a course starts or ends inside a loch or sea, its channel is dug out into the water, deepest at
  // the mouth and shoaling to the bank over MOUTH_R metres. A natural bar at the shore would otherwise stop a boat from
  // reaching the course.
  for (const c of COURSES) {
    const prof = profiles.get(c.id)!;
    const n = prof.s.length;
    const ends: [number, number, number][] = [[prof.x[0], prof.z[0], prof.surface[0]], [prof.x[n - 1], prof.z[n - 1], prof.surface[n - 1]]];
    for (const [ex, ez, L] of ends) {
      if (!BODIES.some((w) => bodyRadius(w, ex, ez) < 1.05)) continue;
      const i0 = clampI(Math.floor((ex - MOUTH_R + half) / step)), i1 = clampI(Math.ceil((ex + MOUTH_R + half) / step));
      const j0 = clampI(Math.floor((ez - MOUTH_R + half) / step)), j1 = clampI(Math.ceil((ez + MOUTH_R + half) / step));
      for (let j = j0; j <= j1; j++) {
        const z = -half + j * step;
        for (let i = i0; i <= i1; i++) {
          const x = -half + i * step;
          const d = Math.hypot(x - ex, z - ez);
          if (d >= MOUTH_R || nearSource(x, z)) continue;
          const idx = j * N + i;
          const bed = L - c.depth * (1 - d / MOUTH_R);
          if (bed < g[idx]) g[idx] = bed;
          if (g[idx] < L) levelGrid[idx] = L;
        }
      }
    }
  }
  state = { profiles, levels, bridges, locks, levelGrid, grid: g, N, half, step };
}

// ---- Queries ------------------------------------------------------------------------------------------------------
/** The water surface height at (x, z), or null where there is no water. */
export function waterLevelAt(x: number, z: number): number | null {
  const st = ready();
  if (!st) return null;
  const { N, half, step, levelGrid } = st;
  const u = (x + half) / step, v = (z + half) / step;
  if (u < 0 || v < 0 || u > N - 1 || v > N - 1) return null;
  const i = Math.min(N - 2, Math.floor(u)), j = Math.min(N - 2, Math.floor(v));
  let sum = 0, cnt = 0;
  for (const idx of [j * N + i, j * N + i + 1, (j + 1) * N + i, (j + 1) * N + i + 1]) {
    const l = levelGrid[idx];
    if (l === l) { sum += l; cnt++; }
  }
  return cnt > 0 ? sum / cnt : null;
}

/** The carved ground (river bed, loch floor) at (x, z), from the grid, ignoring bridge decks; null while dry. */
export function waterBedAt(x: number, z: number): number | null {
  const st = ready();
  if (!st) return null;
  const { N, half, step, grid: g } = st;
  const u = Math.max(0, Math.min(N - 1, (x + half) / step));
  const v = Math.max(0, Math.min(N - 1, (z + half) / step));
  const i = Math.min(N - 2, Math.floor(u)), j = Math.min(N - 2, Math.floor(v));
  const fx = u - i, fz = v - j;
  const h00 = g[j * N + i], h10 = g[j * N + i + 1], h01 = g[(j + 1) * N + i], h11 = g[(j + 1) * N + i + 1];
  return fx >= fz ? h00 + (h10 - h00) * fx + (h11 - h10) * fz : h00 + (h11 - h01) * fx + (h01 - h00) * fz;
}

/** Water depth at (x, z) (surface minus bed), or 0 where there is none. */
export function waterDepthAt(x: number, z: number): number {
  const s = waterLevelAt(x, z);
  if (s === null) return 0;
  return Math.max(0, s - (waterBedAt(x, z) ?? s));
}

/** The bridge deck top at (x, z), or null when (x, z) is not on a bridge. */
export function bridgeDeckAt(x: number, z: number): number | null {
  const st = ready();
  if (!st) return null;
  for (const b of st.bridges) {
    const dx = x - b.x, dz = z - b.z;
    if (Math.abs(dx) > b.length && Math.abs(dz) > b.length) continue;
    const s = Math.sin(b.yaw), c = Math.cos(b.yaw);
    const along = dx * s + dz * c, side = dx * c - dz * s;
    if (Math.abs(along) <= b.length / 2 && Math.abs(side) <= b.width / 2) return b.deck;
  }
  return null;
}

/** Every road bridge (empty while dry). */
export function bridges(): readonly BridgeSpan[] {
  return ready()?.bridges ?? [];
}

/** Every canal lock, upstream first (empty while dry). */
export function canalLocks(): readonly CanalLock[] {
  return ready()?.locks ?? [];
}

/** A course's sampled profile (surface and bed along it), or null. */
export function courseProfile(id: string): CourseProfile | null {
  return ready()?.profiles.get(id) ?? null;
}

/** A loch's or sea's level, or null. */
export function bodyLevel(id: string): number | null {
  return ready()?.levels.get(id) ?? null;
}
