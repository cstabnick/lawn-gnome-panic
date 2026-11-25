// Terrain core: the open world's shape as pure data, no three.js. One height field over every zone, the ridge between
// zones and the road passes through it, where a walker may stand (ground, decks and ramps), colliders, flora placement per
// chunk, ground colours and the theme at a point. createTerrain(input) builds one terrain from a set of zones; terrain.ts
// makes the game's own instance and re-exports its functions. The level editor makes its own (all gates open).
//
// Every position here is a world position (content.ts moved each zone by its origin from src/data/layout.ts).
//
// Layers on top of the zones' own ground, applied to the finished height in this order: each zone's `stamps`
// (@lawn/level), then the brush-edit `deltas` raster. Both are empty unless a level file adds them, so a terrain without
// them is exactly the original world (terrain.golden.test.ts). Zones may also carry `paths` of kind 'road': extra roads
// (drawn, flora keeps off them, colour) that do not cut the ridge and are not passes.
//
// `invalidate(rect?)` drops every cache a change to the zone data or the layers can make stale; the editor calls it after
// each edit. `setWalkGrid` installs a baked walkability grid (see @lawn/level walkgrid.ts): inside its tiles the static
// part of isBlocked (water, houses, trees, walls, ramps) is one lookup. Quest gates, interiors and colliders added with
// addCollider() are never baked and are always checked live.
import { PAINT_SURFACES, TUNING, WORLD, type Condition, type Deck, type WorldObjectDef, type ZoneDef, type ZoneExit, type ZoneId } from './config';
import { FURNITURE_RADIUS } from './data/interiors';
import { DeltaGrid, PaintGrid, applyStamps, stampBounds, type PathDef, type Rect, type Stamp, type WalkGrid } from '@lawn/level';
import { registerTerrainWasm, type ChunkMeshBuffers } from './wasm/terrainWasm';

// ---------------------------------------------------------------- helpers

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function distToSegSq(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2)) : 0;
  const ex = px - (ax + t * dx), ez = pz - (az + t * dz);
  return ex * ex + ez * ez;
}

const surfaceColour = new Map<number, number>(PAINT_SURFACES.map((p) => [p.id, p.color]));

function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- types

export interface RoadSeg { ax: number; az: number; bx: number; bz: number }

/** The dirt roads the game derives for a zone, as editable paths: shrine to every region, and shrine to every exit (house
 * doors included). Set `roadMode: 'authored'` on the zone and give it these paths (or your own) to take over the roads. */
export function derivedRoadPaths(def: ZoneDef): PathDef[] {
  const s = def.shrine;
  const far = (x: number, z: number) => Math.hypot(x - s.x, z - s.z) > 1;
  const out: PathDef[] = [];
  for (const r of def.regions) if (far(r.x, r.z)) out.push({ id: `region-${r.id}`, kind: 'road', points: [[s.x, s.z], [r.x, r.z]] });
  def.exits.forEach((e, i) => { if (far(e.x, e.z)) out.push({ id: `exit-${i}`, kind: 'road', points: [[s.x, s.z], [e.x, e.z]] }); });
  return out;
}

/** A road between two outdoor zones: from `a`'s exit to `b`'s exit. Open when both exits' conditions hold. */
export interface Pass { from: ZoneId; to: ZoneId; a: ZoneExit; b: ZoneExit }

export type FloraKind = 'pine' | 'broad' | 'grass' | 'clover' | 'hedge' | 'boulder' | 'pipe' | 'stubble' | 'rock';
/** One flora instance: kind, world position (y is the ground), uniform scale s, and turn about y (rad). */
export interface Flora { kind: FloraKind; x: number; y: number; z: number; s: number; rot: number }

interface DeckInfo { deck: Deck; top: number; minX: number; maxX: number; minZ: number; maxZ: number; ramp: { minX: number; maxX: number; minZ: number; maxZ: number; along: 'x' | 'z'; start: number; dir: 1 | -1; len: number } }

interface Circle { x: number; z: number; r: number }
const BUCKET = 8;
type Buckets = Map<number, Circle[]>;
const bucketKey = (i: number, j: number) => i * 1_000_003 + j;

/** Placement attempts per 64 m chunk for each theme, before floraDensity (the old per-zone counts scaled to a chunk). */
const FLORA_TRIES: Record<ZoneDef['theme']['flora'], number> = {
  mushroom: 23, grass: 64, clover: 36, hedge: 9, rock: 11, pipe: 11, stubble: 50,
};
const COLLIDER_R: Partial<Record<FloraKind, number>> = { pine: 0.6, broad: 0.6, hedge: 1.2, boulder: 0.9, pipe: 0.5, rock: 0.8 };

/** What a terrain is built from. The game passes its own tables; the editor passes the same with gates open. */
export interface TerrainInput {
  zones: Record<ZoneId, ZoneDef>;
  /** World objects (bookshelves and lecterns in interiors become colliders). */
  objects: Record<string, WorldObjectDef>;
  /** Asked once per pass each time passOpen runs. */
  checkCondition: (c: Condition | undefined) => boolean;
}

export interface Terrain {
  zoneRectDistance(id: ZoneId, x: number, z: number): number;
  zoneAt(x: number, z: number): ZoneId | null;
  themeZoneAt(x: number, z: number): ZoneDef;
  roadSegments(): readonly RoadSeg[];
  passes(): readonly Pass[];
  passOpen(p: Pass): boolean;
  distToRoad(x: number, z: number): number;
  isWithinRoad(x: number, z: number, maxDist: number): boolean;
  heightAt(x: number, z: number): number;
  /** Builds non-indexed terrain chunk attributes (positions, flat normals, linear-sRGB colours) in Wasm when ready. */
  buildChunkBuffers(cx: number, cz: number, chunkSize: number, segments: number): ChunkMeshBuffers | null;
  /** Builds a pxCount x pxCount packed ABGR Uint32Array for a minimap chunk tile in Wasm when ready. */
  buildMinimapPixels(x0: number, z0: number, chunkSize: number, pxCount: number, waterLevel: number): Uint32Array | null;
  deckLayout(): readonly { deck: Deck; top: number; ramp: { minX: number; maxX: number; minZ: number; maxZ: number } }[];
  surfacesAt(x: number, z: number): number[];
  /** A collider added at run time (camp tents, standing stones...). Never baked; always checked live. */
  addCollider(x: number, z: number, r: number): void;
  chunkFlora(ci: number, cj: number): readonly Flora[];
  isBlocked(x: number, z: number): boolean;
  findFreeSpot(x: number, z: number, maxRadius?: number): { x: number; z: number };
  isBlockedAt(x: number, z: number, y: number): boolean;
  standY(x: number, z: number, fromY: number): number | null;
  groundColourAt(x: number, z: number): number;
  regionNameAt(x: number, z: number): string;
  /** The static part of isBlocked computed from scratch (water, houses, trees, rocks, walls, ramps; no gates, no
   * addCollider props, no interior walls). What the walk bake stores and what the bake check compares against. */
  staticSolidAt(x: number, z: number): boolean;
  /** Installs (or, with null, removes) the baked walkability grid. */
  setWalkGrid(grid: WalkGrid | null): void;
  readonly walkGrid: WalkGrid | null;
  /** The brush-edit raster. Mutate it, then call invalidate(rect) with the box you changed. */
  readonly deltas: DeltaGrid;
  setDeltas(grid: DeltaGrid): void;
  /** Surface paint (a surface id per metre cell, PAINT_SURFACES): colours the ground and keeps flora off it. Mutate it, then
   * call invalidate(rect) with the box you changed. */
  readonly paint: PaintGrid;
  setPaint(grid: PaintGrid): void;
  /** Re-reads the zone data (stamps, roads, houses, decks...) and drops every cache the box `rect` (default: the whole
   * world) can have made stale: height memo, decks, roads, static colliders, flora chunks and their colliders, and the
   * walk tiles it touches. Call it after editing zone data, stamps or deltas. */
  invalidate(rect?: Rect): void;
}

export function createTerrain(input: TerrainInput): Terrain {
  const { zones: ZONES, objects: OBJECTS, checkCondition } = input;
  const ALL: readonly ZoneDef[] = Object.values(ZONES);
  const OUTDOOR: readonly ZoneDef[] = ALL.filter((z) => !z.indoor);
  const INDOOR: readonly ZoneDef[] = ALL.filter((z) => z.indoor);
  /** Every instance (the Deeps, house interiors) lies south of this; overworld queries skip them all. */
  const INSTANCES_FROM_Z = WORLD.instanceZ - 400;

  const INTERIORS: readonly ZoneDef[] = INDOOR.filter((z) => z.interior);

  const STAMP_CELL = 64;
  const ROAD_CELL = 32;
  const ROAD_BUCKET_PAD = 4;

  // ---- layers and caches (all per instance; invalidate() resets them)
  let deltas = new DeltaGrid();
  let paint = new PaintGrid();
  let walk: WalkGrid | null = null;
  let stamps: Stamp[] = [];
  const stampBuckets = new Map<number, Stamp[]>();
  let memoX = NaN;
  let memoZ = NaN;
  let memoH = 0;
  const HMEMO_SIZE = 4096;
  const HMEMO_MASK = HMEMO_SIZE - 1;
  const hMemoGen = new Uint32Array(HMEMO_SIZE);
  const hMemoX = new Float64Array(HMEMO_SIZE);
  const hMemoZ = new Float64Array(HMEMO_SIZE);
  const hMemoY = new Float64Array(HMEMO_SIZE);
  const hScratchF64 = new Float64Array(2);
  const hScratchU32 = new Uint32Array(hScratchF64.buffer);
  let curHMemoGen = 1;
  function bumpHeightMemo(): void {
    memoX = NaN;
    curHMemoGen = (curHMemoGen + 1) >>> 0;
    if (curHMemoGen === 0) {
      hMemoGen.fill(0);
      curHMemoGen = 1;
    }
  }
  let roads: RoadSeg[] | null = null;
  const roadBuckets = new Map<number, RoadSeg[]>();
  const cutBuckets = new Map<number, RoadSeg[]>();
  const CUT_BUCKET_PAD = WORLD.roadHalfWidth + 10.5;
  let passList: Pass[] = [];
  /** Segments the ridge is cut along: every pass, plus the in-zone road from the shrine to each pass exit. */
  let cutRoads: RoadSeg[] = [];
  let deckInfos: DeckInfo[] | null = null;
  /** Colliders from zone data (houses, shrines, walls, deck posts, interiors), built on first use. */
  const staticColliders: Buckets = new Map();
  const staticCircleList: Circle[] = [];
  let staticDone = false;
  /** Colliders of flora chunks, by chunk key, so a chunk's can be removed again. */
  const floraColliders: Buckets = new Map();
  const floraCircles = new Map<number, Circle[]>();
  /** Colliders from addCollider(). */
  const extraColliders: Buckets = new Map();
  const extraCircleList: Circle[] = [];
  const floraCache = new Map<number, Flora[]>();

  function collectStamps(): Stamp[] {
    const out: Stamp[] = [];
    stampBuckets.clear();
    for (const def of ALL) if (def.stamps) out.push(...def.stamps);
    for (const s of out) {
      const b = stampBounds(s);
      const i0 = Math.floor(b.minX / STAMP_CELL), i1 = Math.floor(b.maxX / STAMP_CELL);
      const j0 = Math.floor(b.minZ / STAMP_CELL), j1 = Math.floor(b.maxZ / STAMP_CELL);
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const k = bucketKey(i, j);
          let list = stampBuckets.get(k);
          if (!list) { list = []; stampBuckets.set(k, list); }
          list.push(s);
        }
      }
    }
    return out;
  }
  stamps = collectStamps();

  /** The building interior whose dark surroundings (x, z) lies in (within 300 m of its square), or null. */
  function interiorNear(x: number, z: number): ZoneDef | null {
    if (z <= INSTANCES_FROM_Z) return null;
    for (const def of INTERIORS) if (zoneRectDistance(def.id, x, z) < 300) return def;
    return null;
  }

  /** For a building interior: (x, z) relative to the room centre, and whether it is on the room's floor. */
  function roomLocal(def: ZoneDef, x: number, z: number): { lx: number; lz: number; inRoom: boolean } {
    const o = origin(def);
    const lx = x - o.x, lz = z - o.z;
    const inf = def.interior!;
    return { lx, lz, inRoom: Math.abs(lx) <= inf.hw + 0.4 && Math.abs(lz) <= inf.hd + 0.4 };
  }

  function origin(def: ZoneDef): { x: number; z: number } {
    return def.origin ?? { x: 0, z: 0 };
  }

  /** Signed distance from (x, z) to a zone's square: negative inside (how deep), positive outside. */
  function zoneRectDistance(id: ZoneId, x: number, z: number): number {
    const def = ZONES[id];
    const o = origin(def);
    return Math.max(Math.abs(x - o.x), Math.abs(z - o.z)) - def.half;
  }

  /** The zone whose square contains (x, z), or null in the Wilds between zones. */
  function zoneAt(x: number, z: number): ZoneId | null {
    for (const def of z > INSTANCES_FROM_Z ? ALL : OUTDOOR) if (zoneRectDistance(def.id, x, z) <= 0) return def.id;
    return null;
  }

  /** The outdoor zone nearest to (x, z) (the one containing it, if any). For themes and flora in the Wilds. */
  function nearestOutdoor(x: number, z: number): ZoneDef {
    let best = OUTDOOR[0];
    let bestD = Infinity;
    for (const def of OUTDOOR) {
      const d = zoneRectDistance(def.id, x, z);
      if (d < bestD) { bestD = d; best = def; }
    }
    return best;
  }

  /** The zone to draw and dress (x, z) as: the containing zone, else the nearest outdoor zone. */
  function themeZoneAt(x: number, z: number): ZoneDef {
    const id = zoneAt(x, z);
    return id ? ZONES[id] : nearestOutdoor(x, z);
  }

  // ---------------------------------------------------------------- roads and passes

  function initRoads(): void {
    if (roads) return;
    const rs: RoadSeg[] = [];
    roads = rs;
    passList = [];
    cutRoads = [];
    for (const def of ALL) {
      const s = def.shrine;
      const far = (x: number, z: number) => Math.hypot(x - s.x, z - s.z) > 1;
      // roadMode 'authored': the zone's own `paths` are its roads; the shrine-to-region and shrine-to-exit star is not drawn.
      if (def.roadMode === 'authored') continue;
      for (const r of def.regions) if (far(r.x, r.z)) rs.push({ ax: s.x, az: s.z, bx: r.x, bz: r.z });
      for (const e of def.exits) if (far(e.x, e.z)) rs.push({ ax: s.x, az: s.z, bx: e.x, bz: e.z });
    }
    for (const def of OUTDOOR) {
      for (const a of def.exits) {
        const other = ZONES[a.to];
        if (a.to === def.id || other.indoor) continue;
        // Each pair once: from the zone that sorts first.
        if (def.id > a.to) continue;
        const b = other.exits.find((e) => e.to === def.id);
        if (!b) continue;
        passList.push({ from: def.id, to: a.to, a, b });
        const seg = { ax: a.x, az: a.z, bx: b.x, bz: b.z };
        rs.push(seg);
        cutRoads.push(seg);
        for (const [zone, e] of [[def, a], [other, b]] as const) {
          cutRoads.push({ ax: zone.shrine.x, az: zone.shrine.z, bx: e.x, bz: e.z });
        }
      }
    }
    // Authored roads (level files): extra roads inside a zone. They are drawn and keep flora off, but cut no ridge.
    for (const def of ALL) {
      for (const p of def.paths ?? []) {
        if (p.kind !== 'road') continue;
        for (let i = 0; i + 1 < p.points.length; i++) {
          rs.push({ ax: p.points[i][0], az: p.points[i][1], bx: p.points[i + 1][0], bz: p.points[i + 1][1] });
        }
      }
    }
    roadBuckets.clear();
    for (const s of rs) {
      const i0 = Math.floor((Math.min(s.ax, s.bx) - ROAD_BUCKET_PAD) / ROAD_CELL);
      const i1 = Math.floor((Math.max(s.ax, s.bx) + ROAD_BUCKET_PAD) / ROAD_CELL);
      const j0 = Math.floor((Math.min(s.az, s.bz) - ROAD_BUCKET_PAD) / ROAD_CELL);
      const j1 = Math.floor((Math.max(s.az, s.bz) + ROAD_BUCKET_PAD) / ROAD_CELL);
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const k = bucketKey(i, j);
          let list = roadBuckets.get(k);
          if (!list) { list = []; roadBuckets.set(k, list); }
          list.push(s);
        }
      }
    }
    cutBuckets.clear();
    for (const s of cutRoads) {
      const i0 = Math.floor((Math.min(s.ax, s.bx) - CUT_BUCKET_PAD) / ROAD_CELL);
      const i1 = Math.floor((Math.max(s.ax, s.bx) + CUT_BUCKET_PAD) / ROAD_CELL);
      const j0 = Math.floor((Math.min(s.az, s.bz) - CUT_BUCKET_PAD) / ROAD_CELL);
      const j1 = Math.floor((Math.max(s.az, s.bz) + CUT_BUCKET_PAD) / ROAD_CELL);
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const k = bucketKey(i, j);
          let list = cutBuckets.get(k);
          if (!list) { list = []; cutBuckets.set(k, list); }
          list.push(s);
        }
      }
    }
  }

  /** Every road: shrine to region, shrine to exit, the passes between zones, and authored roads. For drawing and for keeping flora off. */
  function roadSegments(): readonly RoadSeg[] {
    initRoads();
    return roads!;
  }

  /** The roads between zones. A pass is open when checkCondition holds for both its exits' `when`. */
  function passes(): readonly Pass[] {
    initRoads();
    return passList;
  }

  function passOpen(p: Pass): boolean {
    return checkCondition(p.a.when) && checkCondition(p.b.when);
  }

  function isWithinRoad(x: number, z: number, maxDist: number): boolean {
    initRoads();
    const list = roadBuckets.get(bucketKey(Math.floor(x / ROAD_CELL), Math.floor(z / ROAD_CELL)));
    if (!list) return false;
    const maxSq = maxDist * maxDist;
    for (const s of list) {
      if (distToSegSq(x, z, s.ax, s.az, s.bx, s.bz) < maxSq) return true;
    }
    return false;
  }

  function distToRoad(x: number, z: number): number {
    let bestSq = Infinity;
    for (const s of roadSegments()) {
      const d2 = distToSegSq(x, z, s.ax, s.az, s.bx, s.bz);
      if (d2 < bestSq) bestSq = d2;
    }
    return Math.sqrt(bestSq);
  }

  function distToCut(x: number, z: number): number {
    initRoads();
    const list = cutBuckets.get(bucketKey(Math.floor(x / ROAD_CELL), Math.floor(z / ROAD_CELL)));
    if (!list) return 1e3;
    let bestSq = 1e6;
    for (const s of list) {
      const d2 = distToSegSq(x, z, s.ax, s.az, s.bx, s.bz);
      if (d2 < bestSq) bestSq = d2;
    }
    return Math.sqrt(bestSq);
  }

  // ---------------------------------------------------------------- height

  /** A zone's own rolling ground at a world point, without the edge ridge: hills, flat regions, the burrow, lakes. */
  function zoneGround(def: ZoneDef, x: number, z: number): number {
    const o = origin(def);
    const lx = x - o.x, lz = z - o.z;
    let h = def.theme.hilliness * (1.6 * Math.sin(lx * 0.045 + 1.1) * Math.cos(lz * 0.038 - 0.6) + 0.8 * Math.sin((lx + lz) * 0.09) + 0.5 * Math.sin(lx * 0.13 - lz * 0.11));
    for (const r of def.regions) {
      const d = Math.hypot(x - r.x, z - r.z);
      if (d > r.r + 10) continue;
      h *= smoothstep(r.r * 0.8, r.r + 10, d);
      if (r.id === 'burrow') h += 2.5 * Math.exp(-(d * d) / (9 * 9)) - 2 * Math.exp(-(d * d) / (3 * 3));
    }
    for (const lake of def.lakes) {
      const dl = Math.hypot(x - lake.x, z - lake.z);
      if (dl > lake.r * 3) continue;
      h -= 4 * Math.exp(-(dl * dl) / (lake.r * lake.r * 0.6));
    }
    return h;
  }

  /** The Wilds between zones: plain rolling ground (the ridge is added on top). */
  function wildGround(x: number, z: number): number {
    return 1.6 * Math.sin(x * 0.045 + 1.1) * Math.cos(z * 0.038 - 0.6) + 0.8 * Math.sin((x + z) * 0.09) + 0.5 * Math.sin(x * 0.13 - z * 0.11);
  }

  /** Ground height at (x, z). Deterministic. Zones blend into their neighbours; a ridge rises along every zone's edge
   * (WORLD.ridge high, over the last 28 m) and between zones, except along a pass road, which cuts through it. Then the
   * zones' stamps and the brush deltas are added (overworld only). */
  function heightAt(x: number, z: number): number {
    // Fast 1-entry register check + 4096-slot typed-array hash memo so consecutive walking tests AND per-frame
    // entity/companion height queries hit cache in nanoseconds with exact JS IEEE-754 f64 parity.
    if (x === memoX && z === memoZ) return memoH;
    const nx = x + 0;
    const nz = z + 0;
    hScratchF64[0] = nx;
    hScratchF64[1] = nz;
    let hash = (Math.imul(hScratchU32[0] ^ hScratchU32[1], 0x9e3779b1) ^ Math.imul(hScratchU32[2] ^ hScratchU32[3], 0x85ebca6b)) >>> 0;
    hash = (hash ^ (hash >>> 16)) & HMEMO_MASK;
    if (hMemoGen[hash] === curHMemoGen && hMemoX[hash] === nx && hMemoZ[hash] === nz) {
      const cached = hMemoY[hash];
      memoX = x;
      memoZ = z;
      memoH = cached;
      return cached;
    }
    let h = computeHeight(x, z);
    if (z <= INSTANCES_FROM_Z) {
      if (stamps.length > 0) {
        const cellStamps = stampBuckets.get(bucketKey(Math.floor(x / STAMP_CELL), Math.floor(z / STAMP_CELL)));
        if (cellStamps) h = applyStamps(h, cellStamps, x, z);
      }
      if (!deltas.isEmpty()) h += deltas.sample(x, z);
    }
    hMemoGen[hash] = curHMemoGen;
    hMemoX[hash] = nx;
    hMemoZ[hash] = nz;
    hMemoY[hash] = h;
    memoH = h;
    memoX = x;
    memoZ = z;
    return memoH;
  }

  function computeHeight(x: number, z: number): number {
    // Instances stand alone: their own ground plus the edge ridge. A building interior is a flat floor with a dark pit
    // round it (its own walls stand at the room's edge; interiors.ts draws them).
    if (z > INSTANCES_FROM_Z) {
      const room = interiorNear(x, z);
      if (room) return roomLocal(room, x, z).inRoom ? 0 : -3;
      for (const def of INDOOR) {
        const d = zoneRectDistance(def.id, x, z);
        if (d > WORLD.blend) continue;
        return zoneGround(def, x, z) + WORLD.ridge * (1 - smoothstep(0, 28, -d));
      }
    }
    let sumW = 0;
    let sumH = 0;
    let inner = -Infinity;
    for (const def of OUTDOOR) {
      const d = zoneRectDistance(def.id, x, z);
      inner = Math.max(inner, -d);
      if (d >= WORLD.blend) continue;
      const w = 1 - smoothstep(0, WORLD.blend, d);
      sumW += w;
      sumH += w * zoneGround(def, x, z);
    }
    const wildW = Math.max(0, 1 - sumW);
    const base = (sumH + wildW * wildGround(x, z)) / (sumW + wildW);
    const ridgeT = 1 - smoothstep(0, 28, inner);
    if (ridgeT <= 0) return base;
    const cut = smoothstep(WORLD.roadHalfWidth, WORLD.roadHalfWidth + 7, distToCut(x, z));
    // Out here a road is a causeway: never below 0.4 m, so low wild ground cannot flood it. Scaled by ridgeT, so lakes
    // deep inside a zone (Thatchford's river beside its north road) are left alone.
    const causeway = ridgeT * (1 - cut) * Math.max(0, 0.4 - base);
    return base + WORLD.ridge * ridgeT * cut + causeway;
  }

  // ---------------------------------------------------------------- decks (raised floors) and ramps

  function initDecks(): DeckInfo[] {
    if (deckInfos) return deckInfos;
    const infos: DeckInfo[] = [];
    deckInfos = infos;
    for (const def of ALL) {
      for (const d of def.decks ?? []) {
        const top = heightAt(d.x, d.z) + d.y;
        const minX = d.x - d.w / 2, maxX = d.x + d.w / 2, minZ = d.z - d.d / 2, maxZ = d.z + d.d / 2;
        const len = 2 * d.y;
        const hw = 1.2;
        let ramp: DeckInfo['ramp'];
        switch (d.stair) {
          case 's': ramp = { minX: d.x - hw, maxX: d.x + hw, minZ: maxZ, maxZ: maxZ + len, along: 'z', start: maxZ, dir: 1, len }; break;
          case 'n': ramp = { minX: d.x - hw, maxX: d.x + hw, minZ: minZ - len, maxZ: minZ, along: 'z', start: minZ, dir: -1, len }; break;
          case 'e': ramp = { minX: maxX, maxX: maxX + len, minZ: d.z - hw, maxZ: d.z + hw, along: 'x', start: maxX, dir: 1, len }; break;
          default: ramp = { minX: minX - len, maxX: minX, minZ: d.z - hw, maxZ: d.z + hw, along: 'x', start: minX, dir: -1, len }; break;
        }
        infos.push({ deck: d, top, minX, maxX, minZ, maxZ, ramp });
      }
    }
    return infos;
  }

  /** Every deck with its floor height (world y) and the box its ramp covers. For drawing. */
  function deckLayout(): readonly { deck: Deck; top: number; ramp: { minX: number; maxX: number; minZ: number; maxZ: number } }[] {
    return initDecks();
  }

  /** Height of a ramp at (x, z), or null when (x, z) is not on it. Runs from the deck's floor down to the ground. */
  function rampY(info: DeckInfo, x: number, z: number): number | null {
    const r = info.ramp;
    if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) return null;
    const p = r.along === 'z' ? z : x;
    const t = Math.min(1, Math.max(0, ((p - r.start) * r.dir) / r.len));
    return info.top + (heightAt(x, z) - info.top) * t;
  }

  /** Every height a walker could stand at on (x, z), lowest first: the ground, then deck floors and ramps above it. */
  function surfacesAt(x: number, z: number): number[] {
    const out = [heightAt(x, z)];
    for (const info of initDecks()) {
      if (x >= info.minX && x <= info.maxX && z >= info.minZ && z <= info.maxZ) out.push(info.top);
      const ry = rampY(info, x, z);
      if (ry !== null && ry - out[0] > 0.05) out.push(ry);
    }
    return out.sort((a, b) => a - b);
  }

  /** True when (x, z) at ground level is inside a ramp's solid body (taller than a step above the ground). */
  function inRampBody(x: number, z: number): boolean {
    for (const info of initDecks()) {
      const ry = rampY(info, x, z);
      if (ry !== null && ry - heightAt(x, z) > 0.3) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- colliders

  function bucketAdd(map: Buckets, x: number, z: number, r: number): Circle {
    const c: Circle = { x, z, r };
    for (let i = Math.floor((x - r) / BUCKET); i <= Math.floor((x + r) / BUCKET); i++) {
      for (let j = Math.floor((z - r) / BUCKET); j <= Math.floor((z + r) / BUCKET); j++) {
        const key = bucketKey(i, j);
        let list = map.get(key);
        if (!list) { list = []; map.set(key, list); }
        list.push(c);
      }
    }
    return c;
  }

  function bucketRemove(map: Buckets, c: Circle): void {
    for (let i = Math.floor((c.x - c.r) / BUCKET); i <= Math.floor((c.x + c.r) / BUCKET); i++) {
      for (let j = Math.floor((c.z - c.r) / BUCKET); j <= Math.floor((c.z + c.r) / BUCKET); j++) {
        const list = map.get(bucketKey(i, j));
        if (!list) continue;
        const at = list.indexOf(c);
        if (at >= 0) list.splice(at, 1);
      }
    }
  }

  function bucketHit(map: Buckets, x: number, z: number): boolean {
    const list = map.get(bucketKey(Math.floor(x / BUCKET), Math.floor(z / BUCKET)));
    if (!list) return false;
    for (const c of list) {
      const dx = x - c.x, dz = z - c.z;
      if (dx * dx + dz * dz < c.r * c.r) return true;
    }
    return false;
  }

  /** Adds a ground-level collision circle (blocks walkers within WORLD.groundBand of the ground). world.ts calls this for
   * props it builds (camp tents, standing stones, signposts); terrain adds houses, shrines, walls, deck posts and flora. */
  function addCollider(x: number, z: number, r: number): void {
    extraCircleList.push(bucketAdd(extraColliders, x, z, r));
    wasmBridge.onExtraCollider(x, z, r);
  }

  const addStatic = (x: number, z: number, r: number): void => {
    staticCircleList.push(bucketAdd(staticColliders, x, z, r));
  };

  /** A building interior: the room's walls, its furniture, and its bookshelves and lecterns (which are objects). */
  function addInteriorColliders(def: ZoneDef): void {
    const inf = def.interior!;
    const o = origin(def);
    for (let x = -inf.hw; x <= inf.hw; x += 0.75) { addStatic(o.x + x, o.z - inf.hd - 0.4, 0.5); addStatic(o.x + x, o.z + inf.hd + 0.4, 0.5); }
    for (let z = -inf.hd; z <= inf.hd; z += 0.75) { addStatic(o.x - inf.hw - 0.4, o.z + z, 0.5); addStatic(o.x + inf.hw + 0.4, o.z + z, 0.5); }
    for (const f of inf.layout) {
      const r = FURNITURE_RADIUS[f.kind] * (f.scale ?? 1);
      if (r > 0) addStatic(o.x + f.x, o.z + f.z, r);
    }
    for (const ob of Object.values(OBJECTS)) {
      if (ob.zone !== def.id) continue;
      if (ob.model === 'bookshelf') addStatic(ob.x, ob.z, 0.5);
      else if (ob.model === 'lectern') addStatic(ob.x, ob.z, 0.35);
    }
  }

  function initStaticColliders(): void {
    if (staticDone) return;
    staticDone = true;
    for (const def of ALL) {
      for (const h of def.houses) addStatic(h.x, h.z, h.r * 0.9);
      if (def.interior) {
        addInteriorColliders(def);
        continue;
      }
      addStatic(def.shrine.x, def.shrine.z, 1.2);
      for (const w of def.walls ?? []) {
        const dx = w.x2 - w.x1, dz = w.z2 - w.z1;
        const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 1.5));
        for (let i = 0; i <= n; i++) addStatic(w.x1 + (dx * i) / n, w.z1 + (dz * i) / n, 1);
      }
      // Authored solid props (level files).
      for (const p of def.props ?? []) if (p.solidR && p.solidR > 0) addStatic(p.x, p.z, p.solidR);
      if (def.indoor) {
        // The ring wall round an instance.
        const o = origin(def);
        const h = def.half - 0.75;
        const ring: [number, number, number, number][] = [[-h, -h, h, -h], [h, -h, h, h], [h, h, -h, h], [-h, h, -h, -h]];
        for (const [x1, z1, x2, z2] of ring) {
          const n = Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 1.5);
          for (let i = 0; i <= n; i++) addStatic(o.x + x1 + ((x2 - x1) * i) / n, o.z + z1 + ((z2 - z1) * i) / n, 1);
        }
      }
    }
    for (const info of initDecks()) {
      for (const px of [info.minX + 0.3, info.maxX - 0.3]) for (const pz of [info.minZ + 0.3, info.maxZ - 0.3]) addStatic(px, pz, 0.35);
    }
  }

  // ---------------------------------------------------------------- flora (per chunk, deterministic)

  /** Trees, rocks and the like may not sit here: near a region, road, lake, house or deck, or in water. */
  function clearOfFeatures(def: ZoneDef, x: number, z: number, onRoads: boolean): boolean {
    if (def.regions.some((r) => Math.hypot(x - r.x, z - r.z) < r.r + 5)) return false;
    if (def.lakes.some((l) => Math.hypot(x - l.x, z - l.z) < l.r + 5)) return false;
    if (def.houses.some((h) => Math.hypot(x - h.x, z - h.z) < h.r + 2)) return false;
    if (onRoads && isWithinRoad(x, z, 3.5)) return false;
    if (!paint.isEmpty() && paint.at(x, z) !== 0) return false;
    for (const info of initDecks()) {
      if (x > info.ramp.minX - 3 && x < info.ramp.maxX + 3 && z > info.ramp.minZ - 3 && z < info.ramp.maxZ + 3) return false;
      if (x > info.minX - 3 && x < info.maxX + 3 && z > info.minZ - 3 && z < info.maxZ + 3) return false;
    }
    return heightAt(x, z) >= TUNING.waterLevel + 0.5;
  }

  /** The flora of chunk (ci, cj): the same every call (seeded by the chunk). The first call also adds its colliders. */
  function chunkFlora(ci: number, cj: number): readonly Flora[] {
    const key = bucketKey(ci, cj);
    const cached = floraCache.get(key);
    if (cached) return cached;
    initStaticColliders();
    const out: Flora[] = [];
    floraCache.set(key, out);
    const rng = mulberry32((ci * 73856093) ^ (cj * 19349663) ^ 7);
    const C = WORLD.chunk;
    const x0 = ci * C, z0 = cj * C;
    // No flora in or round a building interior (its floor and the dark pit around it).
    if (interiorNear(x0 + C / 2, z0 + C / 2) || interiorNear(x0, z0) || interiorNear(x0 + C, z0 + C)) return out;
    const inside = (x: number, z: number) => {
      const id = zoneAt(x, z);
      return id !== null || OUTDOOR.some((d) => zoneRectDistance(d.id, x, z) < WORLD.blend * 2);
    };
    const centre = themeZoneAt(x0 + C / 2, z0 + C / 2);
    const tries = Math.round(FLORA_TRIES[centre.theme.flora] * centre.theme.floraDensity);
    for (let i = 0; i < tries; i++) {
      const x = x0 + rng() * C, z = z0 + rng() * C;
      const def = themeZoneAt(x, z);
      const roll = rng(), s0 = rng(), rot = rng() * Math.PI * 2;
      if (!inside(x, z) || !clearOfFeatures(def, x, z, true)) continue;
      let kind: FloraKind;
      let s = 1;
      switch (def.theme.flora) {
        case 'mushroom': kind = roll < 0.5 ? 'pine' : 'broad'; s = 0.9 + s0 * 0.8; break;
        case 'grass': kind = 'grass'; break;
        case 'clover': kind = 'clover'; break;
        case 'hedge': kind = 'hedge'; break;
        case 'rock': kind = 'boulder'; s = 1.2 + s0; break;
        case 'pipe': kind = 'pipe'; break;
        default: kind = 'stubble'; break;
      }
      out.push({ kind, x, y: heightAt(x, z), z, s, rot });
    }
    // Scattered rocks everywhere (about five a chunk).
    for (let i = 0; i < 5; i++) {
      const x = x0 + rng() * C, z = z0 + rng() * C;
      const s = 0.4 + rng() * 1.0, rot = rng() * Math.PI * 2;
      if (!inside(x, z) || !clearOfFeatures(themeZoneAt(x, z), x, z, true)) continue;
      out.push({ kind: 'rock', x, y: heightAt(x, z), z, s, rot });
    }
    const circles: Circle[] = [];
    for (const f of out) {
      const r = COLLIDER_R[f.kind];
      if (r) circles.push(bucketAdd(floraColliders, f.x, f.z, r * (f.kind === 'hedge' || f.kind === 'pipe' ? 1 : f.s)));
    }
    floraCircles.set(key, circles);
    return out;
  }

  /** Makes sure flora colliders exist around (x, z) before a blocking test. */
  function ensureFloraAround(x: number, z: number): void {
    const C = WORLD.chunk;
    const i0 = Math.floor((x - 3) / C), i1 = Math.floor((x + 3) / C);
    const j0 = Math.floor((z - 3) / C), j1 = Math.floor((z + 3) / C);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) if (!floraCache.has(bucketKey(i, j))) chunkFlora(i, j);
  }

  // ---------------------------------------------------------------- walking

  /** Pass checks in one loop (passOpen asks the quest state, so once per pass): true at a closed pass's gate (the 4.5 m
   * round each end of a pass that is not open yet), or off every open pass road when `needRoad`. */
  function passBlocks(x: number, z: number, needRoad: boolean): boolean {
    let onRoad = !needRoad;
    for (const p of passes()) {
      if (passOpen(p)) {
        if (!onRoad && distToSegSq(x, z, p.a.x, p.a.z, p.b.x, p.b.z) <= WORLD.roadHalfWidth * WORLD.roadHalfWidth) onRoad = true;
      } else if (Math.hypot(x - p.a.x, z - p.a.z) < 4.5 || Math.hypot(x - p.b.x, z - p.b.z) < 4.5) {
        return true;
      }
    }
    return !onRoad;
  }

  /** The static part of isBlocked, from scratch: water, static and flora colliders, ramp bodies. */
  function staticSolidAt(x: number, z: number): boolean {
    if (heightAt(x, z) < TUNING.waterLevel + 0.1) return true;
    initStaticColliders();
    ensureFloraAround(x, z);
    if (bucketHit(staticColliders, x, z) || bucketHit(floraColliders, x, z)) return true;
    return inRampBody(x, z);
  }

  /** True where a walker on the ground may not stand: outside every zone (except on an open pass road), within 2 m of a
   * zone's edge, in water, at a closed gate, inside a ramp, or inside a house, tree, rock, wall or shrine. */
  function isBlocked(x: number, z: number): boolean {
    const id = zoneAt(x, z);
    const deepInside = id !== null && zoneRectDistance(id, x, z) <= -2;
    if (id !== null && ZONES[id].interior) {
      const { lx, lz } = roomLocal(ZONES[id], x, z);
      const inf = ZONES[id].interior!;
      if (Math.abs(lx) > inf.hw - 0.35 || Math.abs(lz) > inf.hd - 0.35) return true;
    }
    if (passBlocks(x, z, !deepInside)) return true;
    const baked = walk ? walk.solidAt(x, z) : undefined;
    if (baked === undefined ? staticSolidAt(x, z) : baked) return true;
    return bucketHit(extraColliders, x, z);
  }

  /** True when `(x, z)` and its snapped A* start cell can step onto at least one unblocked neighbour. */
  function isWalkableSpot(x: number, z: number): boolean {
    if (isBlocked(x, z)) return false;
    const cx = Math.round(x);
    const cz = Math.round(z);
    if (isBlocked(cx, cz)) return false;
    return !isBlocked(cx + 1, cz) || !isBlocked(cx - 1, cz) || !isBlocked(cx, cz + 1) || !isBlocked(cx, cz - 1);
  }

  /**
   * Nearest walkable point to `(x, z)` so teleports and respawns never land inside a shrine, well, tree, rock, or wall.
   */
  function findFreeSpot(x: number, z: number, maxRadius = 16): { x: number; z: number } {
    if (isWalkableSpot(x, z)) return { x, z };
    const cx = Math.round(x);
    const cz = Math.round(z);
    let best: { x: number; z: number; d2: number } | null = null;
    for (let di = -maxRadius; di <= maxRadius; di++) {
      for (let dz = -maxRadius; dz <= maxRadius; dz++) {
        const d2 = di * di + dz * dz;
        if (d2 > maxRadius * maxRadius) continue;
        if (best && d2 >= best.d2) continue;
        const nx = cx + di;
        const nz = cz + dz;
        if (isWalkableSpot(nx, nz)) best = { x: nx, z: nz, d2 };
      }
    }
    return best ? { x: best.x, z: best.z } : { x, z };
  }

  /** True when a walker standing at height y on (x, z) is blocked. At ground level that is isBlocked; above it, the walker
   * needs a deck floor or ramp within WORLD.step of y (railings keep them from stepping off a deck's edge). */
  function isBlockedAt(x: number, z: number, y: number): boolean {
    const ground = heightAt(x, z);
    if (y - ground <= WORLD.step) return isBlocked(x, z);
    return !surfacesAt(x, z).some((s) => s - ground > WORLD.step * 0.5 && Math.abs(s - y) <= WORLD.step);
  }

  /** Where a walker at height fromY ends up stepping onto (x, z): the surface within WORLD.step of fromY (the closest),
   * or null when there is none or it is blocked. Walking up a ramp onto a deck is a series of such steps. */
  function standY(x: number, z: number, fromY: number): number | null {
    let best: number | null = null;
    for (const s of surfacesAt(x, z)) {
      if (Math.abs(s - fromY) > WORLD.step) continue;
      if (best === null || Math.abs(s - fromY) < Math.abs(best - fromY)) best = s;
    }
    if (best === null || isBlockedAt(x, z, best)) return null;
    return best;
  }

  // ---------------------------------------------------------------- looks

  /** Ground colour at (x, z): roads, lake sand, the burrow and barrows, else the theme's two greens. */
  function groundColourAt(x: number, z: number): number {
    // A building interior: its floor in two shades of the room's palette, and dark all round it.
    const room = interiorNear(x, z);
    if (room) {
      if (!roomLocal(room, x, z).inRoom) return 0x0d0a07;
      const floor = room.interior!.palette.floor;
      if (Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1 < 0.5) return floor;
      const r = Math.round(((floor >> 16) & 255) * 0.94), g = Math.round(((floor >> 8) & 255) * 0.94), b = Math.round((floor & 255) * 0.94);
      return (r << 16) | (g << 8) | b;
    }
    const def = themeZoneAt(x, z);
    if (!paint.isEmpty()) {
      const id = paint.at(x, z);
      if (id !== 0) { const c = surfaceColour.get(id); if (c !== undefined) return c; }
    }
    if (isWithinRoad(x, z, 2.2)) return 0x9b7a4c;
    for (const lake of def.lakes) {
      if (Math.hypot(x - lake.x, z - lake.z) < lake.r * 1.5 && heightAt(x, z) < TUNING.waterLevel + 0.6) return 0xd8c78a;
    }
    for (const r of def.regions) {
      if ((r.id === 'burrow' || r.id === 'barrows') && Math.hypot(x - r.x, z - r.z) <= r.r) return r.id === 'burrow' ? 0x6b5038 : 0x6f8a55;
    }
    const t = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
    const { ground, groundAlt } = def.theme;
    if (t < 1 / 3) return ground;
    if (t < 2 / 3) {
      // ground darkened by 3.5%.
      const r = Math.round(((ground >> 16) & 255) * 0.965), g = Math.round(((ground >> 8) & 255) * 0.965), b = Math.round((ground & 255) * 0.965);
      return (r << 16) | (g << 8) | b;
    }
    return groundAlt;
  }

  /** Name of the region containing (x, z) (within r + 6 of a region of the zone there), or 'the Wilds'. */
  function regionNameAt(x: number, z: number): string {
    const id = zoneAt(x, z);
    if (!id) return 'the Wilds';
    for (const r of ZONES[id].regions) if (Math.hypot(x - r.x, z - r.z) <= r.r + 6) return r.name;
    return 'the Wilds';
  }

  // ---------------------------------------------------------------- layers, bake, invalidation

  function purgeBuckets(map: Buckets): void {
    map.clear();
  }

  function invalidate(rect?: Rect): void {
    bumpHeightMemo();
    roads = null;
    roadBuckets.clear();
    cutBuckets.clear();
    deckInfos = null;
    stamps = collectStamps();
    purgeBuckets(staticColliders);
    staticCircleList.length = 0;
    staticDone = false;
    const C = WORLD.chunk;
    // Flora reads heights, roads, regions, lakes, houses and decks within a few metres, so grow the box.
    const m = 12;
    const i0 = rect ? Math.floor((rect.minX - m) / C) : 0, i1 = rect ? Math.floor((rect.maxX + m) / C) : 0;
    const j0 = rect ? Math.floor((rect.minZ - m) / C) : 0, j1 = rect ? Math.floor((rect.maxZ + m) / C) : 0;
    for (const key of [...floraCache.keys()]) {
      if (rect) {
        // bucketKey(ci, cj) = ci * 1_000_003 + cj: recover the pair from the key.
        const cj = ((key % 1_000_003) + 1_000_003 + 500_000) % 1_000_003 - 500_000;
        const ci = (key - cj) / 1_000_003;
        if (ci < i0 || ci > i1 || cj < j0 || cj > j1) continue;
      }
      floraCache.delete(key);
      for (const c of floraCircles.get(key) ?? []) bucketRemove(floraColliders, c);
      floraCircles.delete(key);
    }
    if (walk) {
      const box = rect ?? { minX: -Infinity, maxX: Infinity, minZ: -Infinity, maxZ: Infinity };
      for (const id of walk.tilesIn(box)) walk.deleteTile(id);
    }
    wasmBridge.onInvalidate();
  }

  const wasmBridge = registerTerrainWasm(
    {
      allZones: ALL,
      outdoorZones: OUTDOOR,
      indoorZones: INDOOR,
      interiorZones: INTERIORS,
      passes,
      passOpen,
      roadSegments,
      cutRoadSegments: () => { initRoads(); return cutRoads; },
      decks: initDecks,
      stamps: () => stamps,
      staticCircles: () => { initStaticColliders(); return staticCircleList; },
      extraCircles: () => extraCircleList,
      ensureFloraCircles: (ci, cj) => {
        const key = bucketKey(ci, cj);
        if (!floraCache.has(key)) chunkFlora(ci, cj);
        return floraCircles.get(key) ?? [];
      },
      walkGrid: () => walk,
      deltas: () => deltas,
      paint: () => paint,
    },
    standY,
    isBlocked,
  );

  return {
    zoneRectDistance, zoneAt, themeZoneAt, roadSegments, passes, passOpen, distToRoad, isWithinRoad, heightAt,
    buildChunkBuffers: wasmBridge.buildChunkBuffers,
    buildMinimapPixels: wasmBridge.buildMinimapPixels,
    deckLayout, surfacesAt,
    addCollider, chunkFlora, isBlocked, findFreeSpot, isBlockedAt, standY, groundColourAt, regionNameAt, staticSolidAt,
    setWalkGrid(grid) { walk = grid; wasmBridge.onWalkGridChange(); },
    get walkGrid() { return walk; },
    get deltas() { return deltas; },
    setDeltas(grid) { deltas = grid; bumpHeightMemo(); wasmBridge.onDeltasChange(); },
    get paint() { return paint; },
    setPaint(grid) { paint = grid; wasmBridge.onPaintChange(); },
    invalidate,
  };
}
