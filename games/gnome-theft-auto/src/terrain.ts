// The one height function of the GTA world. Everything that puts something on the ground asks heightAt(x, z).
//
// How the height is built (all world coordinates, metres):
//   1. natural = TERRAIN amplitude x (relief generators + region document stamps + the test hill, when on)
//   2. roads:   flat across, following the natural height of the centre line along their length
//   3. sites:   Turfton (exactly 0), Fort Sandpit, the airfield, every `reserve` marker: flat at their centre's height
// The result is sampled once on a TERRAIN.step grid; heightAt interpolates that grid on the same triangles the ground
// mesh draws (terrainMesh.ts), so whatever stands on heightAt stands exactly on the visible ground.
//
// While the terrain is flat (amplitude 0; the shipped amplitude is 1 since Epic 5) heightAt returns exactly 0 without building
// anything, normalAt returns straight up and terrainProbe() is @lawn/vehicle's flatGround(0): the game is byte-identical
// to the flat world.
//
// Pure: no three.js, no DOM (reads location.search only when it exists).
import { applyStamps, smoothstep, type Stamp } from '@lawn/level';
import { flatGround, type GroundHit, type GroundProbe, type Vec3 } from '@lawn/vehicle';
import { AIRFIELD, BASE, CITY_HALF, HIGHWAYS, ROAD_WIDTH, TERRAIN, WORLD_HALF } from './config';
import { LAYOUT, REGION_DOCS, REGION_IDS, trails } from './levels';
import { reservedRects } from './sites';
import { macroAt, reliefAt, tiltAt } from './landforms';
import { surfaceAt as surfaceSpecAt, type SurfaceKind } from './surfaces';
import { WATER } from './config';
import { bridgeDeckAt, carveWater, resetWater, setWaterSource, waterBedAt, waterLevelAt } from './water';
import { GROUND_TRACKS, fordWaterAt } from './raceTrack/tracks';
import { applyPadRelief } from './mountainRoutes/pads';
import { waveSurfaceOffset } from './waves';
import { castDeck, deckSurfaceBelow, resetDecks } from './highways/deck';
import { INTERIOR_FLOOR_Y, INTERIOR_MIN_X } from './interiors/space';
import { rooftopSurfaceBelow } from './interiors/rooftops';
import { SKYWAY } from './highways/skyways';
import { wasmBuildBaseHeightGrid, wasmNaturalHeightAt } from './wasm/gtaWasm';

export type { SurfaceKind };

// ---- Options -----------------------------------------------------------------------------------------------------
export interface TerrainOptions {
  /** Relief multiplier: 0 = flat, 1 = as authored. */
  amplitude: number;
  /** Add the test hill (TERRAIN.testHill, one gauss stamp in the Dust Flats on the east highway). */
  testHill: boolean;
  /**
   * The authored land: the regional tilt, the region landforms (src/landforms) and the documents' stamps. Off for the
   * test-hill world (`?terrain=hill`, and setTerrainOptions({ testHill: true }) unless `landforms` is given too).
   */
  landforms: boolean;
  /** Carve the water (river, canal, loch, Puddle Sea; water.ts). Absent = WATER.carve. false = the old dry world. */
  water?: boolean;
}

/** True while the water is carved into the ground. */
function waterCarving(): boolean {
  return opts.water ?? WATER.carve;
}

function initialOptions(): TerrainOptions {
  const q = typeof location !== 'undefined' && location?.search ? new URLSearchParams(location.search).get('terrain') : null;
  if (q === 'hill') return { amplitude: 1, testHill: true, landforms: false };
  const n = q !== null && q !== '' ? Number(q) : NaN;
  return { amplitude: Number.isFinite(n) ? n : TERRAIN.amplitude, testHill: false, landforms: true };
}

let opts: TerrainOptions = initialOptions();

/** The options in use (from TERRAIN, or ?terrain= for this visit). */
export function terrainOptions(): Readonly<TerrainOptions> {
  return opts;
}

/**
 * Change the terrain (tests, dev tools). Throws away the height grid; call it BEFORE building the world, since meshes,
 * props and colliders already placed keep their old heights. Tests: `setTerrainOptions({ amplitude: 1, testHill: true })`,
 * then `resetTerrainOptions()` in afterEach/afterAll.
 */
export function setTerrainOptions(o: Partial<TerrainOptions>): void {
  opts = { ...opts, ...o };
  if (o.testHill !== undefined && o.landforms === undefined) opts.landforms = !o.testHill;
  grid = null;
  resetDecks();
}

/** Back to the defaults (TERRAIN / the URL). */
export function resetTerrainOptions(): void {
  opts = initialOptions();
  grid = null;
  resetDecks();
}

// ---- The natural (authored) height ----------------------------------------------------------------------------------
/**
 * Relief generators, summed: the regional tilt (north high, south low) and the region landforms (src/landforms: each
 * region's generator, faded out at inner borders and near rivers). Pure functions of world (x, z) returning metres.
 */
const RELIEFS: ((x: number, z: number) => number)[] = [tiltAt, reliefAt, macroAt];

/** Every region document's stamps, moved to world coordinates. */
const DOC_STAMPS: Stamp[] = REGION_IDS.flatMap((id) => {
  const o = LAYOUT.regions.find((r) => r.id === id)!.origin;
  return (REGION_DOCS[id].stamps ?? []).map((s): Stamp => ({ ...s, x: s.x + o.x, z: s.z + o.z }));
});

const EMPTY_STAMPS: readonly Stamp[] = [];
const HILL_ONLY_STAMPS: readonly Stamp[] = [
  { op: 'gauss', x: TERRAIN.testHill.x, z: TERRAIN.testHill.z, sigma: TERRAIN.testHill.sigma, amount: TERRAIN.testHill.amount },
];
const DOC_AND_HILL_STAMPS: readonly Stamp[] = [...DOC_STAMPS, HILL_ONLY_STAMPS[0]];

function stampsInUse(): readonly Stamp[] {
  if (opts.landforms) return opts.testHill ? DOC_AND_HILL_STAMPS : DOC_STAMPS;
  return opts.testHill ? HILL_ONLY_STAMPS : EMPTY_STAMPS;
}

/** True while the authored land is flat (naturalHeightAt is 0 everywhere). */
function reliefFlat(): boolean {
  return opts.amplitude === 0 || ((!opts.landforms || RELIEFS.length === 0) && stampsInUse().length === 0);
}

/** True while every point of the ground is at height 0 (nothing to build, nothing to look up): flat land, no water. */
export function terrainFlat(): boolean {
  return reliefFlat() && !waterCarving();
}

/** Height before roads and sites are flattened (amplitude applied). */
export function naturalHeightAt(x: number, z: number): number {
  if (reliefFlat()) return 0;
  const stamps = stampsInUse();
  const fromWasm = wasmNaturalHeightAt(x, z, opts.amplitude, opts.landforms, stamps);
  if (fromWasm !== null) return fromWasm;
  let h = 0;
  if (opts.landforms) for (const f of RELIEFS) h += f(x, z);
  h = applyStamps(h, stamps, x, z);
  return opts.amplitude * h;
}

// ---- The grid -----------------------------------------------------------------------------------------------------
const H = WORLD_HALF;
const S = TERRAIN.step;
/** Grid vertices per side: vertex (i, j) is at x = -H + i * S, z = -H + j * S. */
export const GRID_N = Math.round((2 * H) / S) + 1;
let grid: Float32Array | null = null;

interface FlatSite { minX: number; maxX: number; minZ: number; maxZ: number; target: number | null }

/** The flat sites, in the order they are applied (Turfton last, so the city is exactly 0). */
function flatSites(): FlatSite[] {
  const sites: FlatSite[] = [];
  sites.push({ minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ, target: null });
  // The airfield: the runway's bounds (as biomes.ts measures them) joined with the apron the planes park on.
  const hx = Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.width / 2;
  const hz = Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.width / 2;
  const px = AIRFIELD.planeSpots.map((p) => p.x);
  const pz = AIRFIELD.planeSpots.map((p) => p.z);
  sites.push({
    minX: Math.min(AIRFIELD.x - hx, Math.min(...px) - 8), maxX: Math.max(AIRFIELD.x + hx, Math.max(...px) + 8),
    minZ: Math.min(AIRFIELD.z - hz, Math.min(...pz) - 8), maxZ: Math.max(AIRFIELD.z + hz, Math.max(...pz) + 8),
    target: null,
  });
  // Every flat slot (sites.ts), then every `reserve` marker: a reserve is levelled last, so a nearby slot's blend never
  // tilts it.
  const rects = reservedRects({ flatOnly: true });
  for (const r of [...rects.filter((q) => q.source === 'slot'), ...rects.filter((q) => q.source === 'reserve')]) {
    sites.push({ minX: r.minX, maxX: r.maxX, minZ: r.minZ, maxZ: r.maxZ, target: null });
  }
  return sites;
}

function buildGrid(): Float32Array {
  const N = GRID_N;
  const clampI = (v: number): number => Math.max(0, Math.min(N - 1, v));
  const roadInner = ROAD_WIDTH / 2 + TERRAIN.roadShoulder;
  const flatPaths = [
    ...HIGHWAYS.map((hw) => {
      const inner = roadInner - (ROAD_WIDTH - hw.width) / 2;
      return { points: hw.points, inner, outer: inner + TERRAIN.roadFade };
    }),
    ...(opts.landforms ? trails() : []).map((t) => {
      const inner = (t.width || TERRAIN.trailWidth) / 2 + 1;
      return { points: t.points, inner, outer: inner + TERRAIN.trailFade };
    }),
  ];
  const sites = flatSites();

  let g = wasmBuildBaseHeightGrid(opts.amplitude, opts.landforms, stampsInUse(), flatPaths, sites);
  const rectFlatten = (arr: Float32Array, r: FlatSite, margin: number, fade: number, to: number): void => {
    const reach = margin + fade;
    const i0 = clampI(Math.floor((r.minX - reach + H) / S)), i1 = clampI(Math.ceil((r.maxX + reach + H) / S));
    const j0 = clampI(Math.floor((r.minZ - reach + H) / S)), j1 = clampI(Math.ceil((r.maxZ + reach + H) / S));
    for (let j = j0; j <= j1; j++) {
      const z = -H + j * S;
      const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
      for (let i = i0; i <= i1; i++) {
        const x = -H + i * S;
        const dx = Math.max(r.minX - x, 0, x - r.maxX);
        const d = Math.hypot(dx, dz);
        if (d >= reach) continue;
        const keep = smoothstep(margin, reach, d);
        const idx = j * N + i;
        arr[idx] = to + (arr[idx] - to) * keep;
      }
    }
  };

  if (!g) {
    g = new Float32Array(N * N);
    for (let j = 0; j < N; j++) {
      const z = -H + j * S;
      for (let i = 0; i < N; i++) g[j * N + i] = naturalHeightAt(-H + i * S, z);
    }

    // Roads and trails: the nearest segment wins. Flat across within inner, blended back to the land by outer.
    const bestW = new Float32Array(N * N);
    const target = new Float32Array(N * N);
    for (const hw of flatPaths) {
      const { inner, outer } = hw;
      for (let k = 0; k + 1 < hw.points.length; k++) {
        const [ax, az] = hw.points[k];
        const [bx, bz] = hw.points[k + 1];
        const vx = bx - ax, vz = bz - az;
        const len2 = vx * vx + vz * vz || 1e-9;
        const i0 = clampI(Math.floor((Math.min(ax, bx) - outer + H) / S)), i1 = clampI(Math.ceil((Math.max(ax, bx) + outer + H) / S));
        const j0 = clampI(Math.floor((Math.min(az, bz) - outer + H) / S)), j1 = clampI(Math.ceil((Math.max(az, bz) + outer + H) / S));
        for (let j = j0; j <= j1; j++) {
          const z = -H + j * S;
          for (let i = i0; i <= i1; i++) {
            const x = -H + i * S;
            const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / len2));
            const cx = ax + vx * t, cz = az + vz * t;
            const d = Math.hypot(x - cx, z - cz);
            if (d >= outer) continue;
            const w = 1 - smoothstep(inner, outer, d);
            const idx = j * N + i;
            if (w <= bestW[idx]) continue;
            bestW[idx] = w;
            target[idx] = naturalHeightAt(cx, cz);
          }
        }
      }
    }
    for (let idx = 0; idx < N * N; idx++) {
      const w = bestW[idx];
      if (w > 0) g[idx] = target[idx] + (g[idx] - target[idx]) * (1 - w);
    }

    for (const s of sites) {
      rectFlatten(g, s, TERRAIN.siteMargin, TERRAIN.siteFade, s.target ?? naturalHeightAt((s.minX + s.maxX) / 2, (s.minZ + s.maxZ) / 2));
    }
  }

  // The race tracks (raceTrack/tracks.ts): the Speedway and the Dirt Bowl raised on their flattened sites, the Capwood
  // Run carved into the mountain as a graded ribbon; then E33's mountain routes (mountainRoutes/routes.ts), also ribbons.
  if (opts.landforms) for (const t of GROUND_TRACKS) t.applyRelief(g, N, H, S);
  // E33: the level pads beside the mountain routes (lay-bys, the café terrace, lookouts), at their road's height.
  if (opts.landforms) applyPadRelief(g, N, H, S);
  rectFlatten(g, { minX: -CITY_HALF, maxX: CITY_HALF, minZ: -CITY_HALF, maxZ: CITY_HALF, target: 0 }, TERRAIN.cityMargin, TERRAIN.cityFade, 0);
  // Water (Epic 4, water.ts): carve the river, canal, loch and sea beds into the finished ground; record bridge decks.
  if (waterCarving()) carveWater(g, N, H, S);
  return g;
}

let building = false;
function gridNow(): Float32Array {
  if (grid) return grid;
  building = true;
  try {
    resetWater();
    grid = buildGrid();
  } finally {
    building = false;
  }
  return grid;
}

/** The height grid (built on first use). Null while the terrain is flat. terrainMesh.ts reads it for the vertices. */
export function heightGrid(): Float32Array | null {
  if (terrainFlat()) return null;
  return gridNow();
}

// water.ts getters build the grid (and so the water) on first use; while dry they see no water.
setWaterSource(() => {
  if (building) return;
  if (!heightGrid()) resetWater();
});

// ---- Queries ------------------------------------------------------------------------------------------------------
/**
 * Ground height at world (x, z), metres. Exactly 0 while the terrain is flat. Points off the map get the height of the
 * nearest edge. Each grid cell is split along its (i, j)-(i+1, j+1) diagonal, the same triangles the mesh draws.
 */
export function heightAt(x: number, z: number): number {
  if (terrainFlat()) return 0;
  if (x >= INTERIOR_MIN_X) return INTERIOR_FLOOR_Y; // an interior pocket (E05): flat floor
  const h = gridHeight(x, z);
  // A road bridge (water.ts): the deck, not the river bed under it.
  const d = bridgeDeckAt(x, z);
  return d !== null && d > h ? d : h;
}

/** The ground grid at (x, z), ignoring bridge decks. */
function gridHeight(x: number, z: number): number {
  const g = gridNow();
  const N = GRID_N;
  const u = Math.max(0, Math.min(N - 1, (x + H) / S));
  const v = Math.max(0, Math.min(N - 1, (z + H) / S));
  const i = Math.min(N - 2, Math.floor(u));
  const j = Math.min(N - 2, Math.floor(v));
  const fx = u - i, fz = v - j;
  const h00 = g[j * N + i], h10 = g[j * N + i + 1], h01 = g[(j + 1) * N + i], h11 = g[(j + 1) * N + i + 1];
  return fx >= fz
    ? h00 + (h10 - h00) * fx + (h11 - h10) * fz
    : h00 + (h11 - h01) * fx + (h01 - h00) * fz;
}

/** A unit vector, plain data. */
export interface Normal { x: number; y: number; z: number }
const UP: Readonly<Normal> = Object.freeze({ x: 0, y: 1, z: 0 });

/**
 * Unit ground normal at (x, z), smoothed (central differences one grid step either side), pointing up. Exactly
 * (0, 1, 0) while flat. Pass `out` to avoid allocating.
 */
export function normalAt(x: number, z: number, out?: Normal): Normal {
  if (terrainFlat()) {
    if (!out) return { x: 0, y: 1, z: 0 };
    out.x = 0; out.y = 1; out.z = 0;
    return out;
  }
  const dx = (heightAt(x + S, z) - heightAt(x - S, z)) / (2 * S);
  const dz = (heightAt(x, z + S) - heightAt(x, z - S)) / (2 * S);
  const l = Math.hypot(dx, 1, dz);
  const o = out ?? { x: 0, y: 1, z: 0 };
  o.x = -dx / l; o.y = 1 / l; o.z = -dz / l;
  return o;
}

/** Slope at (x, z) as rise over run (0 = level, 1 = 45 degrees). */
export function slopeAt(x: number, z: number): number {
  const n = normalAt(x, z);
  return n.y >= 1 ? 0 : Math.sqrt(1 - n.y * n.y) / n.y;
}

/** The driving surface at (x, z) (asphalt on roads and the runway, ice on the Basin, else the region's own). */
export function surfaceAt(x: number, z: number): SurfaceKind {
  return surfaceSpecAt(x, z, {}).kind;
}

/** Water at a point: the water surface height and the depth below it. `ford`: Cap-water in a track ford (never floods an engine). */
export interface WaterHit { surface: number; depth: number; ford?: boolean }

/**
 * Water at (x, z): the surface height and the depth from it down to the bed, or null where there is none (or while
 * the water is off). Ignores bridge decks: under a bridge it is the river. "In the water" means `w && y < w.surface`.
 */
export function waterAt(x: number, z: number): WaterHit | null {
  if (x >= INTERIOR_MIN_X) return null; // interior pockets are dry
  const surface = waterLevelAt(x, z);
  if (surface === null) {
    // A ford of Cap-water on a race track (E14, raceTrack/trackDef.ts): shallow, still, no waves.
    if (terrainFlat()) return null;
    const f = fordWaterAt(x, z);
    if (!f) return null;
    const fd = f.surface - gridHeight(x, z);
    return fd > 0 ? { surface: f.surface, depth: fd, ford: true } : null;
  }
  const depth = surface - (waterBedAt(x, z) ?? surface);
  // Waves (waves.ts) move the surface; depth stays the still depth so a shore never flickers dry. 0 until app ticks it.
  return depth > 0 ? { surface: surface + waveSurfaceOffset(x, z), depth } : null;
}

/** The ground under the water and under bridge decks (the river bed, the loch floor); heightAt everywhere else. */
export function bedAt(x: number, z: number): number {
  return terrainFlat() ? 0 : gridHeight(x, z);
}

/**
 * THE level-aware ground query (land, bridges and skyway decks; highways/deck.ts). Ground height under a body at
 * (x, y, z): the highest surface whose top is at or below y + SKYWAY.step (0.6 m), so a body on a deck stays on it and
 * one under a viaduct stays on the land. With y omitted: the highest surface of all (something dropped from the sky
 * lands on top). heightAt stays the land only; use groundAt for anything that can be on a skyway (vehicles, gnomes,
 * pickups, helicopters, cameras).
 */
export function groundAt(x: number, z: number, y: number = Infinity): number {
  const land = heightAt(x, z);
  const deck = deckSurfaceBelow(x, z, y + SKYWAY.step);
  let top = deck !== null && deck > land ? deck : land;
  // A walkable rooftop with no box under it (the Double Pot slab, E05 interiors/rooftops.ts). Only for a known height:
  // something dropped with y omitted lands on the land under it, not on the roof over a tunnel.
  if (y !== Infinity) {
    const roof = rooftopSurfaceBelow(x, z, y + SKYWAY.step, false);
    if (roof !== null && roof > top) top = roof;
  }
  return top;
}

/** How high world point (x, y, z) is above the ground under it (negative = below it). Skyway decks count (groundAt). */
export function aboveGround(x: number, y: number, z: number): number {
  return y - groundAt(x, z, y);
}

/**
 * A placement lifted onto the ground: `y` becomes heightAt + (p.y ?? 0). Returns `p` itself, unchanged (no `y` key
 * added), wherever the ground is at 0, so flat-world snapshots stay identical.
 */
export function withGround<T extends { x: number; z: number; y?: number }>(p: T): T {
  const h = heightAt(p.x, p.z);
  if (h === 0) return p;
  return { ...p, y: (p.y ?? 0) + h };
}

// ---- Vehicle ground probe -----------------------------------------------------------------------------------------
const FLAT_PROBE = flatGround(0);
const MARCH = 0.5;

function hitAt(origin: Vec3, dir: Vec3, t: number): GroundHit {
  const point = { x: origin.x + dir.x * t, y: origin.y + dir.y * t, z: origin.z + dir.z * t };
  point.y = heightAt(point.x, point.z);
  const n = normalAt(point.x, point.z);
  return { distance: t, normal: { x: n.x, y: n.y, z: n.z }, point };
}

/**
 * The @lawn/vehicle GroundProbe for this terrain: `new VehicleController(cfg, { ground: terrainProbe() })`. Exactly
 * flatGround(0) while the terrain is flat (it checks on every cast, so a controller made in a flat test stays right).
 * Box tops are not part of it (colliders stay in collide.ts). Skyway deck tops are (highways/deck.ts castDeck): a ray
 * that starts above a deck lands on it, one that starts under a viaduct goes on down to the land.
 */
export function terrainProbe(): GroundProbe {
  return PROBE;
}

const PROBE: GroundProbe = {
  cast(origin, dir, maxDist) {
    const land = LAND_PROBE.cast(origin, dir, maxDist);
    const deck = castDeck(origin, dir, maxDist);
    if (deck === null) return land;
    return land !== null && land.distance <= deck.distance ? land : deck;
  },
};

const LAND_PROBE: GroundProbe = {
  cast(origin, dir, maxDist) {
    if (terrainFlat()) return FLAT_PROBE.cast(origin, dir, maxDist);
    const g0 = origin.y - heightAt(origin.x, origin.z);
    if (g0 <= 0) return dir.y < 0 ? hitAt(origin, dir, 0) : null;
    // Straight down (or up): one lookup.
    if (Math.abs(dir.x) < 1e-6 && Math.abs(dir.z) < 1e-6) {
      if (dir.y >= 0) return null;
      const t = g0 / -dir.y;
      return t <= maxDist ? hitAt(origin, dir, t) : null;
    }
    // March, then bisect the step that went below the ground.
    let lo = 0;
    for (let t = MARCH; ; t += MARCH) {
      const tt = Math.min(t, maxDist);
      const g = origin.y + dir.y * tt - heightAt(origin.x + dir.x * tt, origin.z + dir.z * tt);
      if (g <= 0) {
        let hi = tt;
        for (let k = 0; k < 12; k++) {
          const mid = (lo + hi) / 2;
          const gm = origin.y + dir.y * mid - heightAt(origin.x + dir.x * mid, origin.z + dir.z * mid);
          if (gm > 0) lo = mid; else hi = mid;
        }
        return hitAt(origin, dir, hi);
      }
      if (tt >= maxDist) return null;
      lo = tt;
    }
  },
};
