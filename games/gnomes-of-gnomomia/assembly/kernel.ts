// High-performance WebAssembly kernel for Gnomes of Gnomomia (AssemblyScript, --runtime stub -O3 --enable simd).
// Holds the world's terrain geometry, zones, spatial-bucketed roads/cuts/decks, WalkGrid bitsets, dynamic colliders,
// DeltaGrid/PaintGrid rasters, a 64k-slot generation-stamped f64 height memo, 2D & 3D grid A* with line-of-sight
// smoothing, terrain chunk vertex/normal/linear-colour meshing, and minimap RGBA tile rasterisation.

@external("env", "ensureStaticColliders") declare function hostEnsureStaticColliders(): void;
@external("env", "ensureFloraChunk") declare function hostEnsureFloraChunk(ci: i32, cj: i32): void;
@external("env", "customStep") declare function hostCustomStep(x: f64, z: f64, fromY: f64): f64;
@external("env", "customBlocked") declare function hostCustomBlocked(x: f64, z: f64): i32;
@external("env", "customCost") declare function hostCustomCost(x: f64, z: f64): f64;

@inline function fastSin(x: f64): f64 { return Math.sin(x); }
@inline function fastCos(x: f64): f64 { return Math.cos(x); }
@inline function fastExp(x: f64): f64 { return Math.exp(x); }

// ---- Compact fixed linear-memory layout (124 pages = 7.75 MB, mobile-friendly, views never detach) ------------------
// 0x000000 .. 0x008000 : Wasm stack (32 KB)
const CFG_PTR: usize          = 0x008000; // 16 * f64 (128 B)
const CHUNK_BOUNDS_PTR: usize = 0x008080; // 2 * f32 (minY, maxY)
const ZONES_PTR: usize        = 0x008100; // 128 * 16 * f64 (16 KB)
const OUTDOOR_IDS_PTR: usize  = 0x00C100; // 128 * i32 (512 B)
const INDOOR_IDS_PTR: usize   = 0x00C300; // 128 * i32 (512 B)
const INTERIOR_IDS_PTR: usize = 0x00C500; // 128 * i32 (512 B)
const SRGB_LUT_PTR: usize     = 0x00C800; // 256 * f32 (1 KB)
const PAINT_PAL_PTR: usize    = 0x00CC00; // 256 * u32 (1 KB)

const REGIONS_PTR: usize      = 0x00D000; // 512 * 4 * f64 (16 KB)
const LAKES_PTR: usize        = 0x011000; // 256 * 4 * f64 (8 KB)
const STAMPS_PTR: usize       = 0x013000; // 512 * 6 * f64 (24 KB)
const ROADS_PTR: usize        = 0x019000; // 2048 * 4 * f64 (64 KB)
const CUT_ROADS_PTR: usize    = 0x029000; // 512 * 4 * f64 (16 KB)
const PASSES_PTR: usize       = 0x02D000; // 64 * 4 * f64 (2 KB)
const DECKS_PTR: usize        = 0x02D800; // 128 * 20 * f64 (20 KB)
const DECK_GRID_PTR: usize    = 0x032800; // 4096 * u16 (8 KB)

// Chained spatial hash tables: Head = (gen: u32, firstNode: i32) = 8 B; Node = (ci: i32, cj: i32, idx: i32, next: i32) = 16 B
const STAMP_HEADS_PTR: usize  = 0x035000; // 1024 * 8 = 8 KB
const STAMP_NODES_PTR: usize  = 0x037000; // 4096 * 16 = 64 KB
const ROAD_HEADS_PTR: usize   = 0x047000; // 4096 * 8 = 32 KB
const ROAD_NODES_PTR: usize   = 0x04F000; // 16384 * 16 = 256 KB
const CUT_HEADS_PTR: usize    = 0x08F000; // 2048 * 8 = 16 KB
const CUT_NODES_PTR: usize    = 0x093000; // 8192 * 16 = 128 KB

// Collider circles: (x: f64, z: f64, r2: f64) = 24 B (static colliders loaded lazily only outside baked WalkGrid)
const STATIC_CIRC_PTR: usize  = 0x0B3000; // 24576 * 24 = 576 KB
const STATIC_HEADS_PTR: usize = 0x143000; // 16384 * 8 = 128 KB
const STATIC_NODES_PTR: usize = 0x163000; // 98304 * 16 = 1536 KB

const EXTRA_CIRC_PTR: usize   = 0x2E3000; // 2048 * 24 = 48 KB
const EXTRA_HEADS_PTR: usize  = 0x2EF000; // 2048 * 8 = 16 KB
const EXTRA_NODES_PTR: usize  = 0x2F3000; // 8192 * 16 = 128 KB

// Loaded flora chunk set (when WalkGrid is absent/outside tile): 2048 * 12 B (gen: u32, ci: i32, cj: i32)
const FLORA_SET_PTR: usize    = 0x313000; // 24 KB

// DeltaGrid (up to 64 chunks * 4096 i16 = 512 KB) + PaintGrid (up to 64 chunks * 4096 u8 = 256 KB)
const DELTA_META_PTR: usize   = 0x319000; // 64 * 8 B (ci: i32, cj: i32)
const DELTA_DATA_PTR: usize   = 0x319200; // 64 * 8192 B = 512 KB
const PAINT_META_PTR: usize   = 0x399200; // 64 * 8 B
const PAINT_DATA_PTR: usize   = 0x399400; // 64 * 4096 B = 256 KB

// WalkGrid tiles: 32 headers * 32 B + 1.625 MB bitsets (actual bake is 1.36 MB across 7 tiles)
const WALK_META_PTR: usize    = 0x3D9400; // 1 KB
const WALK_BITS_PTR: usize    = 0x3DA000; // 0x1A0000 -> ends at 0x57A000

// Height & blocked memo: 16384 slots * 32 B (gen: u32, blockedTag: u32, x: f64, z: f64, h: f64) = 512 KB
const HMEMO_PTR: usize        = 0x57A000; // 0x080000 -> ends at 0x5FA000

// A* SoA node pool (MAX_NODES = 32768) + open-addressed state hash (STATE_CAP = 65536)
const NODE_I_PTR: usize       = 0x5FA000; // 128 KB
const NODE_J_PTR: usize       = 0x61A000; // 128 KB
const NODE_PAR_PTR: usize     = 0x63A000; // 128 KB
const HEAP_PTR: usize         = 0x65A000; // 128 KB
const NODE_Y_PTR: usize       = 0x67A000; // 256 KB
const NODE_G_PTR: usize       = 0x6BA000; // 256 KB
const NODE_H_PTR: usize       = 0x6FA000; // 256 KB
const NODE_F_PTR: usize       = 0x73A000; // 256 KB
const STATE_GEN_PTR: usize    = 0x77A000; // 65536 * u32 = 256 KB
const STATE_KEY_PTR: usize    = 0x7BA000; // 65536 * u64 = 512 KB
const STATE_G_PTR: usize      = 0x83A000; // 65536 * f64 = 512 KB -> ends at 0x8BA000

// Output buffers
const OUT_PATH_PTR: usize     = 0x8BA000; // 8192 * 3 * f64 = 192 KB
const CHUNK_GRID_PTR: usize   = 0x8EA000; // 65 * 65 * f64 = 36 KB
const CHUNK_POS_PTR: usize    = 0x8F3000; // 18432 * f32 = 72 KB
const CHUNK_NRM_PTR: usize    = 0x905000; // 18432 * f32 = 72 KB
const CHUNK_COL_PTR: usize    = 0x917000; // 18432 * f32 = 72 KB
const MINIMAP_PTR: usize      = 0x929000; // 4096 * u32 = 16 KB -> ends at 0x92D000 (9.18 MB < 148 pages)

// ---- Counts & generation counters -----------------------------------------------------------------------------------
let zoneCount: i32 = 0;
let outdoorCount: i32 = 0;
let indoorCount: i32 = 0;
let interiorCount: i32 = 0;
let stampCount: i32 = 0;
let roadCount: i32 = 0;
let cutRoadCount: i32 = 0;
let passCount: i32 = 0;
let deckCount: i32 = 0;
let walkTileCount: i32 = 0;
let hasWalkGrid: i32 = 0;
let deltaChunkCount: i32 = 0;
let paintChunkCount: i32 = 0;

let stampHashGen: u32 = 1;
let stampNodeCount: i32 = 0;
let roadHashGen: u32 = 1;
let roadNodeCount: i32 = 0;
let cutHashGen: u32 = 1;
let cutNodeCount: i32 = 0;

let staticLoaded: i32 = 0;
let staticCircCount: i32 = 0;
let staticHashGen: u32 = 1;
let staticNodeCount: i32 = 0;

let extraCircCount: i32 = 0;
let extraHashGen: u32 = 1;
let extraNodeCount: i32 = 0;

let floraSetGen: u32 = 1;
let heightMemoGen: u32 = 1;
let blockedMemoGen: u32 = 1;
let astarStateGen: u32 = 1;
let deckGridGen: u16 = 1;
let lastOutdoorSlot: i32 = 0;
let lastWalkSlot: i32 = 0;

let openPassMask: u64 = 0;

// Cached config scalars
let cfgBlend: f64 = 40.0;
let cfgRidge: f64 = 9.0;
let cfgRoadHalfWidth: f64 = 3.5;
let cfgStep: f64 = 0.6;
let cfgInstancesFromZ: f64 = 2600.0;
let cfgWaterLevel: f64 = -0.6;
let cfgChunk: f64 = 64.0;

// ---- Pointer exports for zero-copy JS views -------------------------------------------------------------------------
export function getCfgPtr(): usize { return CFG_PTR; }
export function getChunkBoundsPtr(): usize { return CHUNK_BOUNDS_PTR; }
export function getZonesPtr(): usize { return ZONES_PTR; }
export function getOutdoorIdsPtr(): usize { return OUTDOOR_IDS_PTR; }
export function getIndoorIdsPtr(): usize { return INDOOR_IDS_PTR; }
export function getInteriorIdsPtr(): usize { return INTERIOR_IDS_PTR; }
export function getSrgbLutPtr(): usize { return SRGB_LUT_PTR; }
export function getPaintPalPtr(): usize { return PAINT_PAL_PTR; }
export function getRegionsPtr(): usize { return REGIONS_PTR; }
export function getLakesPtr(): usize { return LAKES_PTR; }
export function getPassesPtr(): usize { return PASSES_PTR; }
export function getDecksPtr(): usize { return DECKS_PTR; }
export function getDeltaDataPtr(): usize { return DELTA_DATA_PTR; }
export function getPaintDataPtr(): usize { return PAINT_DATA_PTR; }
export function getWalkBitsPtr(): usize { return WALK_BITS_PTR; }
export function getOutPathPtr(): usize { return OUT_PATH_PTR; }
export function getChunkPosPtr(): usize { return CHUNK_POS_PTR; }
export function getChunkNrmPtr(): usize { return CHUNK_NRM_PTR; }
export function getChunkColPtr(): usize { return CHUNK_COL_PTR; }
export function getMinimapPtr(): usize { return MINIMAP_PTR; }

// ---- Math & hash helpers --------------------------------------------------------------------------------------------
@inline function smoothstep(a: f64, b: f64, x: f64): f64 {
  let t = (x - a) / (b - a);
  if (t < 0.0) t = 0.0;
  else if (t > 1.0) t = 1.0;
  return t * t * (3.0 - 2.0 * t);
}

@inline function distToSegSq(px: f64, pz: f64, ax: f64, az: f64, bx: f64, bz: f64): f64 {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  let t = 0.0;
  if (len2 > 0.0) {
    t = ((px - ax) * dx + (pz - az) * dz) / len2;
    if (t < 0.0) t = 0.0;
    else if (t > 1.0) t = 1.0;
  }
  const ex = px - (ax + t * dx);
  const ez = pz - (az + t * dz);
  return ex * ex + ez * ez;
}

@inline function jsRound(x: f64): i32 {
  const fl = Math.floor(x);
  return <i32>(x - fl >= 0.5 ? fl + 1.0 : fl);
}

@inline function hashPair(ci: i32, cj: i32, mask: i32): i32 {
  let h = (<u32>ci * 0x9e3779b1) ^ (<u32>cj * 0x85ebca6b);
  h ^= h >>> 16;
  return <i32>(h & <u32>mask);
}

function insertBucket(headsPtr: usize, nodesPtr: usize, mask: i32, gen: u32, nodeIdx: i32, ci: i32, cj: i32, itemIdx: i32): void {
  const slot = hashPair(ci, cj, mask);
  const hp = headsPtr + (<usize>slot << 3);
  const prevHead = load<u32>(hp) == gen ? load<i32>(hp + 4) : -1;
  const np = nodesPtr + (<usize>nodeIdx << 4);
  store<i32>(np, ci);
  store<i32>(np + 4, cj);
  store<i32>(np + 8, itemIdx);
  store<i32>(np + 12, prevHead);
  store<u32>(hp, gen);
  store<i32>(hp + 4, nodeIdx);
}

@inline function firstBucketNode(headsPtr: usize, mask: i32, gen: u32, ci: i32, cj: i32): i32 {
  const slot = hashPair(ci, cj, mask);
  const hp = headsPtr + (<usize>slot << 3);
  return load<u32>(hp) == gen ? load<i32>(hp + 4) : -1;
}

// ---- World upload API -----------------------------------------------------------------------------------------------
export function setWorldConfig(
  zCount: i32, outCount: i32, inCount: i32, intCount: i32,
  pCount: i32, dCount: i32
): void {
  cfgBlend = load<f64>(CFG_PTR);
  cfgRidge = load<f64>(CFG_PTR + 8);
  cfgRoadHalfWidth = load<f64>(CFG_PTR + 16);
  cfgStep = load<f64>(CFG_PTR + 24);
  cfgInstancesFromZ = load<f64>(CFG_PTR + 32);
  cfgWaterLevel = load<f64>(CFG_PTR + 40);
  cfgChunk = load<f64>(CFG_PTR + 48);

  zoneCount = zCount;
  outdoorCount = outCount;
  indoorCount = inCount;
  interiorCount = intCount;
  passCount = pCount;
  deckCount = dCount;
  lastOutdoorSlot = 0;
  lastWalkSlot = 0;

  deckGridGen++;
  if (deckGridGen == 0) {
    memory.fill(DECK_GRID_PTR, 0, 8192);
    deckGridGen = 1;
  }
  for (let i = 0; i < dCount; i++) {
    const dp = DECKS_PTR + <usize>(i * 160);
    const i0 = <i32>Math.floor(load<f64>(dp + 104) / 16.0);
    const i1 = <i32>Math.floor(load<f64>(dp + 112) / 16.0);
    const j0 = <i32>Math.floor(load<f64>(dp + 120) / 16.0);
    const j1 = <i32>Math.floor(load<f64>(dp + 128) / 16.0);
    for (let cx = i0; cx <= i1; cx++) {
      for (let cz = j0; cz <= j1; cz++) {
        store<u16>(DECK_GRID_PTR + (<usize>hashPair(cx, cz, 4095) << 1), deckGridGen);
      }
    }
  }
}

@inline function bumpBlockedMemo(): void {
  blockedMemoGen++;
  if (blockedMemoGen >= 0x7ffffff0) {
    heightMemoGen++;
    blockedMemoGen = 1;
  }
}

export function resetStaticLayers(): void {
  stampCount = 0;
  stampHashGen++;
  stampNodeCount = 0;

  roadCount = 0;
  roadHashGen++;
  roadNodeCount = 0;

  cutRoadCount = 0;
  cutHashGen++;
  cutNodeCount = 0;

  staticLoaded = 0;
  staticCircCount = 0;
  staticHashGen++;
  staticNodeCount = 0;

  floraSetGen++;
  heightMemoGen++;
  bumpBlockedMemo();
}

export function resetExtraColliders(): void {
  extraCircCount = 0;
  extraHashGen++;
  extraNodeCount = 0;
  bumpBlockedMemo();
}

export function invalidateHeights(): void {
  heightMemoGen++;
  bumpBlockedMemo();
}

export function setPassMask(maskLo: u32, maskHi: u32): void {
  const next = (<u64>maskHi << 32) | <u64>maskLo;
  if (next != openPassMask) {
    openPassMask = next;
    bumpBlockedMemo();
  }
}

export function addStamp(op: f64, x: f64, z: f64, p1: f64, p2: f64, p3: f64): void {
  if (stampCount >= 512) return;
  const idx = stampCount++;
  const sp = STAMPS_PTR + <usize>(idx * 48);
  store<f64>(sp, op);
  store<f64>(sp + 8, x);
  store<f64>(sp + 16, z);
  store<f64>(sp + 24, p1);
  store<f64>(sp + 32, p2);
  store<f64>(sp + 40, p3);

  const r = op == 1.0 ? p2 : 4.0 * p1;
  const i0 = <i32>Math.floor((x - r) / 64.0);
  const i1 = <i32>Math.floor((x + r) / 64.0);
  const j0 = <i32>Math.floor((z - r) / 64.0);
  const j1 = <i32>Math.floor((z + r) / 64.0);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      if (stampNodeCount < 4096) {
        insertBucket(STAMP_HEADS_PTR, STAMP_NODES_PTR, 1023, stampHashGen, stampNodeCount++, i, j, idx);
      }
    }
  }
}

export function addRoadSeg(ax: f64, az: f64, bx: f64, bz: f64, flags: i32): void {
  if ((flags & 1) != 0 && roadCount < 2048) {
    const idx = roadCount++;
    const rp = ROADS_PTR + <usize>(idx * 32);
    store<f64>(rp, ax);
    store<f64>(rp + 8, az);
    store<f64>(rp + 16, bx);
    store<f64>(rp + 24, bz);

    const minX = ax < bx ? ax : bx;
    const maxX = ax > bx ? ax : bx;
    const minZ = az < bz ? az : bz;
    const maxZ = az > bz ? az : bz;
    const i0 = <i32>Math.floor((minX - 4.0) / 32.0);
    const i1 = <i32>Math.floor((maxX + 4.0) / 32.0);
    const j0 = <i32>Math.floor((minZ - 4.0) / 32.0);
    const j1 = <i32>Math.floor((maxZ + 4.0) / 32.0);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        if (roadNodeCount < 16384) {
          insertBucket(ROAD_HEADS_PTR, ROAD_NODES_PTR, 4095, roadHashGen, roadNodeCount++, i, j, idx);
        }
      }
    }
  }
  if ((flags & 2) != 0 && cutRoadCount < 512) {
    const cIdx = cutRoadCount++;
    const cp = CUT_ROADS_PTR + <usize>(cIdx * 32);
    store<f64>(cp, ax);
    store<f64>(cp + 8, az);
    store<f64>(cp + 16, bx);
    store<f64>(cp + 24, bz);

    const minX = ax < bx ? ax : bx;
    const maxX = ax > bx ? ax : bx;
    const minZ = az < bz ? az : bz;
    const maxZ = az > bz ? az : bz;
    // Smoothstep saturates at roadHalfWidth + 7 (10.5 m); pad 14 m covers all ridge-cut influence.
    const pad = cfgRoadHalfWidth + 10.5;
    const i0 = <i32>Math.floor((minX - pad) / 32.0);
    const i1 = <i32>Math.floor((maxX + pad) / 32.0);
    const j0 = <i32>Math.floor((minZ - pad) / 32.0);
    const j1 = <i32>Math.floor((maxZ + pad) / 32.0);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        if (cutNodeCount < 8192) {
          insertBucket(CUT_HEADS_PTR, CUT_NODES_PTR, 2047, cutHashGen, cutNodeCount++, i, j, cIdx);
        }
      }
    }
  }
}

export function addStaticCollider(x: f64, z: f64, r: f64): void {
  if (staticCircCount >= 24576) return;
  const idx = staticCircCount++;
  const cp = STATIC_CIRC_PTR + <usize>(idx * 24);
  store<f64>(cp, x);
  store<f64>(cp + 8, z);
  store<f64>(cp + 16, r * r);

  const i0 = <i32>Math.floor((x - r) / 8.0);
  const i1 = <i32>Math.floor((x + r) / 8.0);
  const j0 = <i32>Math.floor((z - r) / 8.0);
  const j1 = <i32>Math.floor((z + r) / 8.0);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      if (staticNodeCount < 98304) {
        insertBucket(STATIC_HEADS_PTR, STATIC_NODES_PTR, 16383, staticHashGen, staticNodeCount++, i, j, idx);
      }
    }
  }
  bumpBlockedMemo();
}

export function addExtraCollider(x: f64, z: f64, r: f64): void {
  if (extraCircCount >= 2048) return;
  const idx = extraCircCount++;
  const cp = EXTRA_CIRC_PTR + <usize>(idx * 24);
  store<f64>(cp, x);
  store<f64>(cp + 8, z);
  store<f64>(cp + 16, r * r);

  const i0 = <i32>Math.floor((x - r) / 8.0);
  const i1 = <i32>Math.floor((x + r) / 8.0);
  const j0 = <i32>Math.floor((z - r) / 8.0);
  const j1 = <i32>Math.floor((z + r) / 8.0);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      if (extraNodeCount < 8192) {
        insertBucket(EXTRA_HEADS_PTR, EXTRA_NODES_PTR, 2047, extraHashGen, extraNodeCount++, i, j, idx);
      }
    }
  }
  bumpBlockedMemo();
}

export function clearWalkTiles(installed: i32): void {
  walkTileCount = 0;
  hasWalkGrid = installed;
  lastWalkSlot = 0;
  bumpBlockedMemo();
}

export function addWalkTileMeta(minX: f64, minZ: f64, cols: i32, rows: i32, byteOff: i32): void {
  if (walkTileCount >= 32) return;
  const tp = WALK_META_PTR + <usize>(walkTileCount * 32);
  store<f64>(tp, minX);
  store<f64>(tp + 8, minZ);
  store<i32>(tp + 16, cols);
  store<i32>(tp + 20, rows);
  store<i32>(tp + 24, byteOff);
  walkTileCount++;
  bumpBlockedMemo();
}

export function clearDeltaChunks(): void {
  deltaChunkCount = 0;
  heightMemoGen++;
}

export function addDeltaChunkMeta(ci: i32, cj: i32): i32 {
  if (deltaChunkCount >= 64) return -1;
  const idx = deltaChunkCount++;
  const mp = DELTA_META_PTR + <usize>(idx * 8);
  store<i32>(mp, ci);
  store<i32>(mp + 4, cj);
  heightMemoGen++;
  return idx;
}

export function clearPaintChunks(): void {
  paintChunkCount = 0;
}

export function addPaintChunkMeta(ci: i32, cj: i32): i32 {
  if (paintChunkCount >= 64) return -1;
  const idx = paintChunkCount++;
  const mp = PAINT_META_PTR + <usize>(idx * 8);
  store<i32>(mp, ci);
  store<i32>(mp + 4, cj);
  return idx;
}

// ---- Terrain queries inside Wasm ------------------------------------------------------------------------------------
@inline function zoneRectDist(zIdx: i32, x: f64, z: f64): f64 {
  const zp = ZONES_PTR + <usize>(zIdx * 128);
  const dx = Math.abs(x - load<f64>(zp));
  const dz = Math.abs(z - load<f64>(zp + 8));
  return (dx > dz ? dx : dz) - load<f64>(zp + 16);
}

function interiorNearIdx(x: f64, z: f64): i32 {
  if (z <= cfgInstancesFromZ) return -1;
  for (let k = 0; k < interiorCount; k++) {
    const zIdx = load<i32>(INTERIOR_IDS_PTR + (<usize>k << 2));
    if (zoneRectDist(zIdx, x, z) < 300.0) return zIdx;
  }
  return -1;
}

function zoneAtIdx(x: f64, z: f64): i32 {
  if (z > cfgInstancesFromZ) {
    for (let zIdx = 0; zIdx < zoneCount; zIdx++) {
      if (zoneRectDist(zIdx, x, z) <= 0.0) return zIdx;
    }
    return -1;
  }
  if (outdoorCount > 0) {
    const hintIdx = load<i32>(OUTDOOR_IDS_PTR + (<usize>lastOutdoorSlot << 2));
    if (zoneRectDist(hintIdx, x, z) <= 0.0) return hintIdx;
  }
  for (let k = 0; k < outdoorCount; k++) {
    if (k == lastOutdoorSlot) continue;
    const zIdx = load<i32>(OUTDOOR_IDS_PTR + (<usize>k << 2));
    if (zoneRectDist(zIdx, x, z) <= 0.0) {
      lastOutdoorSlot = k;
      return zIdx;
    }
  }
  return -1;
}

function themeZoneIdx(x: f64, z: f64): i32 {
  const zIdx = zoneAtIdx(x, z);
  if (zIdx >= 0) return zIdx;
  let best = load<i32>(OUTDOOR_IDS_PTR);
  let bestD = Infinity;
  for (let k = 0; k < outdoorCount; k++) {
    const id = load<i32>(OUTDOOR_IDS_PTR + (<usize>k << 2));
    const d = zoneRectDist(id, x, z);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

function zoneGround(zIdx: i32, x: f64, z: f64): f64 {
  const zp = ZONES_PTR + <usize>(zIdx * 128);
  const ox = load<f64>(zp);
  const oz = load<f64>(zp + 8);
  const hilliness = load<f64>(zp + 24);
  const lx = x - ox;
  const lz = z - oz;
  let h = hilliness * (
    1.6 * fastSin(lx * 0.045 + 1.1) * fastCos(lz * 0.038 - 0.6) +
    0.8 * fastSin((lx + lz) * 0.09) +
    0.5 * fastSin(lx * 0.13 - lz * 0.11)
  );
  const rStart = <i32>load<f64>(zp + 80);
  const rCount = <i32>load<f64>(zp + 88);
  for (let i = 0; i < rCount; i++) {
    const rp = REGIONS_PTR + <usize>((rStart + i) * 32);
    const rx = load<f64>(rp);
    const rz = load<f64>(rp + 8);
    const rr = load<f64>(rp + 16);
    const dx = x - rx;
    const dz = z - rz;
    const d2 = dx * dx + dz * dz;
    const lim = rr + 10.0;
    if (d2 > lim * lim) continue;
    const d = Math.sqrt(d2);
    h *= smoothstep(rr * 0.8, lim, d);
    if (load<f64>(rp + 24) == 1.0) {
      h += 2.5 * fastExp(-d2 / 81.0) - 2.0 * fastExp(-d2 / 9.0);
    }
  }
  const lStart = <i32>load<f64>(zp + 96);
  const lCount = <i32>load<f64>(zp + 104);
  for (let i = 0; i < lCount; i++) {
    const lp = LAKES_PTR + <usize>((lStart + i) * 32);
    const lx0 = load<f64>(lp);
    const lz0 = load<f64>(lp + 8);
    const lr = load<f64>(lp + 16);
    const dx = x - lx0;
    const dz = z - lz0;
    const d2 = dx * dx + dz * dz;
    const lim = lr * 3.0;
    if (d2 > lim * lim) continue;
    h -= 4.0 * fastExp(-d2 / (lr * lr * 0.6));
  }
  return h;
}

@inline function wildGround(x: f64, z: f64): f64 {
  return 1.6 * fastSin(x * 0.045 + 1.1) * fastCos(z * 0.038 - 0.6) +
    0.8 * fastSin((x + z) * 0.09) +
    0.5 * fastSin(x * 0.13 - z * 0.11);
}

function distToCutCapped(x: f64, z: f64): f64 {
  const ci = <i32>Math.floor(x / 32.0);
  const cj = <i32>Math.floor(z / 32.0);
  let node = firstBucketNode(CUT_HEADS_PTR, 2047, cutHashGen, ci, cj);
  let bestSq = 1e6;
  while (node >= 0) {
    const np = CUT_NODES_PTR + (<usize>node << 4);
    if (load<i32>(np) == ci && load<i32>(np + 4) == cj) {
      const sIdx = load<i32>(np + 8);
      const sp = CUT_ROADS_PTR + <usize>(sIdx * 32);
      const d2 = distToSegSq(x, z, load<f64>(sp), load<f64>(sp + 8), load<f64>(sp + 16), load<f64>(sp + 24));
      if (d2 < bestSq) bestSq = d2;
    }
    node = load<i32>(np + 12);
  }
  return Math.sqrt(bestSq);
}

export function isWithinRoad(x: f64, z: f64, maxDist: f64): i32 {
  const ci = <i32>Math.floor(x / 32.0);
  const cj = <i32>Math.floor(z / 32.0);
  let node = firstBucketNode(ROAD_HEADS_PTR, 4095, roadHashGen, ci, cj);
  const maxSq = maxDist * maxDist;
  while (node >= 0) {
    const np = ROAD_NODES_PTR + (<usize>node << 4);
    if (load<i32>(np) == ci && load<i32>(np + 4) == cj) {
      const sIdx = load<i32>(np + 8);
      const sp = ROADS_PTR + <usize>(sIdx * 32);
      if (distToSegSq(x, z, load<f64>(sp), load<f64>(sp + 8), load<f64>(sp + 16), load<f64>(sp + 24)) < maxSq) {
        return 1;
      }
    }
    node = load<i32>(np + 12);
  }
  return 0;
}

function deltaUnitsAt(ix: i32, iz: i32): i32 {
  const ci = ix >> 6;
  const cj = iz >> 6;
  for (let k = 0; k < deltaChunkCount; k++) {
    const mp = DELTA_META_PTR + <usize>(k * 8);
    if (load<i32>(mp) == ci && load<i32>(mp + 4) == cj) {
      const off = ((iz & 63) << 6) | (ix & 63);
      return <i32>load<i16>(DELTA_DATA_PTR + <usize>(k * 8192 + (off << 1)));
    }
  }
  return 0;
}

function sampleDeltas(x: f64, z: f64): f64 {
  if (deltaChunkCount == 0) return 0.0;
  const flx = Math.floor(x);
  const flz = Math.floor(z);
  const ix = <i32>flx;
  const iz = <i32>flz;
  const fx = x - flx;
  const fz = z - flz;
  const a = <f64>deltaUnitsAt(ix, iz);
  const b = <f64>deltaUnitsAt(ix + 1, iz);
  const c = <f64>deltaUnitsAt(ix, iz + 1);
  const d = <f64>deltaUnitsAt(ix + 1, iz + 1);
  return (a * (1.0 - fx) * (1.0 - fz) + b * fx * (1.0 - fz) + c * (1.0 - fx) * fz + d * fx * fz) * 0.01;
}

function paintIdAt(x: f64, z: f64): u32 {
  if (paintChunkCount == 0) return 0;
  const ix = <i32>Math.floor(x);
  const iz = <i32>Math.floor(z);
  const ci = ix >> 6;
  const cj = iz >> 6;
  for (let k = 0; k < paintChunkCount; k++) {
    const mp = PAINT_META_PTR + <usize>(k * 8);
    if (load<i32>(mp) == ci && load<i32>(mp + 4) == cj) {
      const off = ((iz & 63) << 6) | (ix & 63);
      return <u32>load<u8>(PAINT_DATA_PTR + <usize>(k * 4096 + off));
    }
  }
  return 0;
}

function computeHeightUncached(x: f64, z: f64): f64 {
  let h = 0.0;
  let computed = false;
  if (z > cfgInstancesFromZ) {
    const room = interiorNearIdx(x, z);
    if (room >= 0) {
      const zp = ZONES_PTR + <usize>(room * 128);
      const lx = x - load<f64>(zp);
      const lz = z - load<f64>(zp + 8);
      const hw = load<f64>(zp + 40);
      const hd = load<f64>(zp + 48);
      h = (Math.abs(lx) <= hw + 0.4 && Math.abs(lz) <= hd + 0.4) ? 0.0 : -3.0;
      computed = true;
    } else {
      for (let k = 0; k < indoorCount; k++) {
        const id = load<i32>(INDOOR_IDS_PTR + (<usize>k << 2));
        const d = zoneRectDist(id, x, z);
        if (d > cfgBlend) continue;
        h = zoneGround(id, x, z) + cfgRidge * (1.0 - smoothstep(0.0, 28.0, -d));
        computed = true;
        break;
      }
    }
  }
  if (!computed) {
    let sumW = 0.0;
    let sumH = 0.0;
    let inner = -Infinity;
    for (let k = 0; k < outdoorCount; k++) {
      const id = load<i32>(OUTDOOR_IDS_PTR + (<usize>k << 2));
      const d = zoneRectDist(id, x, z);
      if (-d > inner) inner = -d;
      if (d >= cfgBlend) continue;
      const w = 1.0 - smoothstep(0.0, cfgBlend, d);
      sumW += w;
      sumH += w * zoneGround(id, x, z);
    }
    const wildW = 1.0 - sumW > 0.0 ? 1.0 - sumW : 0.0;
    const base = (sumH + wildW * wildGround(x, z)) / (sumW + wildW);
    const ridgeT = 1.0 - smoothstep(0.0, 28.0, inner);
    if (ridgeT <= 0.0) {
      h = base;
    } else {
      const cut = smoothstep(cfgRoadHalfWidth, cfgRoadHalfWidth + 7.0, distToCutCapped(x, z));
      const diff = 0.4 - base;
      const causeway = ridgeT * (1.0 - cut) * (diff > 0.0 ? diff : 0.0);
      h = base + cfgRidge * ridgeT * cut + causeway;
    }
  }

  if (z <= cfgInstancesFromZ) {
    if (stampCount > 0) {
      const ci = <i32>Math.floor(x / 64.0);
      const cj = <i32>Math.floor(z / 64.0);
      let node = firstBucketNode(STAMP_HEADS_PTR, 1023, stampHashGen, ci, cj);
      // Bucket inserts prepend, so collect matching indices onto a small stack segment to apply in ascending order.
      let matchCount = 0;
      while (node >= 0) {
        const np = STAMP_NODES_PTR + (<usize>node << 4);
        if (load<i32>(np) == ci && load<i32>(np + 4) == cj && matchCount < 64) {
          // Reuse top of CHUNK_GRID_PTR tail safely only if not in chunk build? Better: scan stamps in ascending index!
          matchCount++;
        }
        node = load<i32>(np + 12);
      }
      if (matchCount > 0) {
        // Stamps are rare (< 20 total in world); when the 64m cell has at least one stamp, apply in exact order.
        for (let s = 0; s < stampCount; s++) {
          const sp = STAMPS_PTR + <usize>(s * 48);
          const op = load<f64>(sp);
          const dx = x - load<f64>(sp + 8);
          const dz = z - load<f64>(sp + 16);
          const d2 = dx * dx + dz * dz;
          if (op == 1.0) {
            const outer = load<f64>(sp + 32);
            if (d2 >= outer * outer) continue;
            const t = smoothstep(load<f64>(sp + 24), outer, Math.sqrt(d2));
            const to = load<f64>(sp + 40);
            h = to + (h - to) * t;
          } else {
            const sigma = load<f64>(sp + 24);
            const reach = 4.0 * sigma;
            if (d2 > reach * reach) continue;
            h += load<f64>(sp + 32) * fastExp(-d2 / (sigma * sigma));
          }
        }
      }
    }
    if (deltaChunkCount > 0) {
      h += sampleDeltas(x, z);
    }
  }
  return h;
}

@inline function coordSlot0(nx: f64, nz: f64): usize {
  let ux = reinterpret<u64>(nx);
  let uz = reinterpret<u64>(nz);
  ux ^= ux >>> 32;
  uz ^= uz >>> 32;
  ux ^= ux >>> 16;
  uz ^= uz >>> 16;
  let hash = (ux * 0x9e3779b97f4a7c15) ^ (uz * 0xbf58476d1ce4e5b9);
  hash ^= hash >>> 32;
  hash ^= hash >>> 16;
  return <usize>(hash & 16383);
}

export function heightAt(x: f64, z: f64): f64 {
  const nx = x + 0.0;
  const nz = z + 0.0;
  const slot0 = coordSlot0(nx, nz);
  const p0 = HMEMO_PTR + (slot0 << 5);
  if (load<u32>(p0) == heightMemoGen && load<f64>(p0 + 8) == nx && load<f64>(p0 + 16) == nz) {
    return load<f64>(p0 + 24);
  }
  const p1 = HMEMO_PTR + ((slot0 ^ 1) << 5);
  if (load<u32>(p1) == heightMemoGen && load<f64>(p1 + 8) == nx && load<f64>(p1 + 16) == nz) {
    return load<f64>(p1 + 24);
  }
  const h = computeHeightUncached(nx, nz);
  const dst = load<u32>(p0) != heightMemoGen ? p0 : p1;
  store<u32>(dst, heightMemoGen);
  store<u32>(dst + 4, 0);
  store<f64>(dst + 8, nx);
  store<f64>(dst + 16, nz);
  store<f64>(dst + 24, h);
  return h;
}

// ---- Decks, colliders & walkability ---------------------------------------------------------------------------------
@inline function rampY(dp: usize, x: f64, z: f64): f64 {
  const rMinX = load<f64>(dp + 40);
  const rMaxX = load<f64>(dp + 48);
  const rMinZ = load<f64>(dp + 56);
  const rMaxZ = load<f64>(dp + 64);
  if (x < rMinX || x > rMaxX || z < rMinZ || z > rMaxZ) return NaN;
  const p = load<f64>(dp + 72) != 0.0 ? z : x;
  let t = ((p - load<f64>(dp + 80)) * load<f64>(dp + 88)) / load<f64>(dp + 96);
  if (t < 0.0) t = 0.0;
  else if (t > 1.0) t = 1.0;
  const top = load<f64>(dp);
  return top + (heightAt(x, z) - top) * t;
}

@inline function mayHaveDeck(x: f64, z: f64): bool {
  if (deckCount == 0) return false;
  const cx = <i32>Math.floor(x / 16.0);
  const cz = <i32>Math.floor(z / 16.0);
  return load<u16>(DECK_GRID_PTR + (<usize>hashPair(cx, cz, 4095) << 1)) == deckGridGen;
}

function inRampBody(x: f64, z: f64): bool {
  if (!mayHaveDeck(x, z)) return false;
  for (let i = 0; i < deckCount; i++) {
    const dp = DECKS_PTR + <usize>(i * 160);
    if (x < load<f64>(dp + 104) || x > load<f64>(dp + 112) || z < load<f64>(dp + 120) || z > load<f64>(dp + 128)) continue;
    const ry = rampY(dp, x, z);
    if (!isNaN(ry) && ry - heightAt(x, z) > 0.3) return true;
  }
  return false;
}

function circleBucketHit(headsPtr: usize, nodesPtr: usize, circPtr: usize, mask: i32, gen: u32, x: f64, z: f64): bool {
  const ci = <i32>Math.floor(x / 8.0);
  const cj = <i32>Math.floor(z / 8.0);
  let node = firstBucketNode(headsPtr, mask, gen, ci, cj);
  while (node >= 0) {
    const np = nodesPtr + (<usize>node << 4);
    if (load<i32>(np) == ci && load<i32>(np + 4) == cj) {
      const cIdx = load<i32>(np + 8);
      const cp = circPtr + <usize>(cIdx * 24);
      const dx = x - load<f64>(cp);
      const dz = z - load<f64>(cp + 8);
      if (dx * dx + dz * dz < load<f64>(cp + 16)) return true;
    }
    node = load<i32>(np + 12);
  }
  return false;
}

function ensureFloraChunkLoaded(ci: i32, cj: i32): void {
  let slot = hashPair(ci, cj, 2047);
  for (let probe = 0; probe < 2048; probe++) {
    const fp = FLORA_SET_PTR + <usize>(slot * 12);
    if (load<u32>(fp) != floraSetGen) {
      store<u32>(fp, floraSetGen);
      store<i32>(fp + 4, ci);
      store<i32>(fp + 8, cj);
      hostEnsureFloraChunk(ci, cj);
      return;
    }
    if (load<i32>(fp + 4) == ci && load<i32>(fp + 8) == cj) return;
    slot = (slot + 1) & 2047;
  }
  hostEnsureFloraChunk(ci, cj);
}

function staticSolidAt(x: f64, z: f64): bool {
  if (heightAt(x, z) < cfgWaterLevel + 0.1) return true;
  if (staticLoaded == 0) {
    staticLoaded = 1;
    hostEnsureStaticColliders();
  }
  const i0 = <i32>Math.floor((x - 3.0) / cfgChunk);
  const i1 = <i32>Math.floor((x + 3.0) / cfgChunk);
  const j0 = <i32>Math.floor((z - 3.0) / cfgChunk);
  const j1 = <i32>Math.floor((z + 3.0) / cfgChunk);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      ensureFloraChunkLoaded(i, j);
    }
  }
  if (circleBucketHit(STATIC_HEADS_PTR, STATIC_NODES_PTR, STATIC_CIRC_PTR, 16383, staticHashGen, x, z)) return true;
  return inRampBody(x, z);
}

/** -1 = outside every tile, 0 = free, 1 = solid */
@inline function walkGridLookup(x: f64, z: f64): i32 {
  if (hasWalkGrid == 0 || walkTileCount == 0) return -1;
  const tp0 = WALK_META_PTR + <usize>(lastWalkSlot * 32);
  const c0 = <i32>Math.floor((x - load<f64>(tp0)) * 4.0);
  const r0 = <i32>Math.floor((z - load<f64>(tp0 + 8)) * 4.0);
  const cols0 = load<i32>(tp0 + 16);
  const rows0 = load<i32>(tp0 + 20);
  if (c0 >= 0 && r0 >= 0 && c0 < cols0 && r0 < rows0) {
    const bitIdx = r0 * cols0 + c0;
    const bytePtr = WALK_BITS_PTR + <usize>load<i32>(tp0 + 24) + (<usize>bitIdx >> 3);
    return ((load<u8>(bytePtr) >> (bitIdx & 7)) & 1) == 1 ? 1 : 0;
  }
  for (let k = 0; k < walkTileCount; k++) {
    if (k == lastWalkSlot) continue;
    const tp = WALK_META_PTR + <usize>(k * 32);
    const c = <i32>Math.floor((x - load<f64>(tp)) * 4.0);
    const r = <i32>Math.floor((z - load<f64>(tp + 8)) * 4.0);
    const cols = load<i32>(tp + 16);
    const rows = load<i32>(tp + 20);
    if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
    lastWalkSlot = k;
    const bitIdx = r * cols + c;
    const bytePtr = WALK_BITS_PTR + <usize>load<i32>(tp + 24) + (<usize>bitIdx >> 3);
    return ((load<u8>(bytePtr) >> (bitIdx & 7)) & 1) == 1 ? 1 : 0;
  }
  return -1;
}

function passBlocks(x: f64, z: f64, needRoad: bool): bool {
  let onRoad = !needRoad;
  const roadSq = cfgRoadHalfWidth * cfgRoadHalfWidth;
  for (let i = 0; i < passCount; i++) {
    const pp = PASSES_PTR + <usize>(i * 32);
    const ax = load<f64>(pp);
    const az = load<f64>(pp + 8);
    const bx = load<f64>(pp + 16);
    const bz = load<f64>(pp + 24);
    if (((openPassMask >> <u64>i) & 1) != 0) {
      if (!onRoad && distToSegSq(x, z, ax, az, bx, bz) <= roadSq) onRoad = true;
    } else {
      const dax = x - ax, daz = z - az;
      if (dax * dax + daz * daz < 20.25) return true;
      const dbx = x - bx, dbz = z - bz;
      if (dbx * dbx + dbz * dbz < 20.25) return true;
    }
  }
  return !onRoad;
}

function computeIsBlockedUncached(x: f64, z: f64): i32 {
  const zIdx = zoneAtIdx(x, z);
  let deepInside = false;
  if (zIdx >= 0) {
    if (zoneRectDist(zIdx, x, z) <= -2.0) deepInside = true;
    const zp = ZONES_PTR + <usize>(zIdx * 128);
    if (((<i32>load<f64>(zp + 32)) & 2) != 0) {
      const lx = x - load<f64>(zp);
      const lz = z - load<f64>(zp + 8);
      if (Math.abs(lx) > load<f64>(zp + 40) - 0.35 || Math.abs(lz) > load<f64>(zp + 48) - 0.35) return 1;
    }
  }
  if (passBlocks(x, z, !deepInside)) return 1;
  const baked = walkGridLookup(x, z);
  if (baked < 0 ? staticSolidAt(x, z) : baked != 0) return 1;
  return circleBucketHit(EXTRA_HEADS_PTR, EXTRA_NODES_PTR, EXTRA_CIRC_PTR, 2047, extraHashGen, x, z) ? 1 : 0;
}

export function isBlocked(x: f64, z: f64): i32 {
  const nx = x + 0.0;
  const nz = z + 0.0;
  const slot0 = coordSlot0(nx, nz);
  const p0 = HMEMO_PTR + (slot0 << 5);
  if (load<u32>(p0) == heightMemoGen && load<f64>(p0 + 8) == nx && load<f64>(p0 + 16) == nz) {
    const tag = load<u32>(p0 + 4);
    if ((tag >>> 1) == blockedMemoGen) return <i32>(tag & 1);
    const b = computeIsBlockedUncached(nx, nz);
    if (load<u32>(p0) == heightMemoGen && load<f64>(p0 + 8) == nx && load<f64>(p0 + 16) == nz) {
      store<u32>(p0 + 4, (blockedMemoGen << 1) | <u32>b);
    }
    return b;
  }
  const p1 = HMEMO_PTR + ((slot0 ^ 1) << 5);
  if (load<u32>(p1) == heightMemoGen && load<f64>(p1 + 8) == nx && load<f64>(p1 + 16) == nz) {
    const tag = load<u32>(p1 + 4);
    if ((tag >>> 1) == blockedMemoGen) return <i32>(tag & 1);
    const b = computeIsBlockedUncached(nx, nz);
    if (load<u32>(p1) == heightMemoGen && load<f64>(p1 + 8) == nx && load<f64>(p1 + 16) == nz) {
      store<u32>(p1 + 4, (blockedMemoGen << 1) | <u32>b);
    }
    return b;
  }
  return computeIsBlockedUncached(nx, nz);
}

function isBlockedAt(x: f64, z: f64, y: f64, ground: f64): bool {
  if (y - ground <= cfgStep) return isBlocked(x, z) != 0;
  const minAbove = cfgStep * 0.5;
  for (let i = 0; i < deckCount; i++) {
    const dp = DECKS_PTR + <usize>(i * 160);
    if (x < load<f64>(dp + 104) || x > load<f64>(dp + 112) || z < load<f64>(dp + 120) || z > load<f64>(dp + 128)) continue;
    if (x >= load<f64>(dp + 8) && x <= load<f64>(dp + 16) && z >= load<f64>(dp + 24) && z <= load<f64>(dp + 32)) {
      const top = load<f64>(dp);
      if (top - ground > minAbove && Math.abs(top - y) <= cfgStep) return false;
    }
    const ry = rampY(dp, x, z);
    if (!isNaN(ry) && ry - ground > 0.05 && ry - ground > minAbove && Math.abs(ry - y) <= cfgStep) return false;
  }
  return true;
}

/** Returns landing y, or NaN when blocked / unreachable within cfgStep. */
export function standY(x: f64, z: f64, fromY: f64): f64 {
  const ground = heightAt(x, z);
  const gDiff = Math.abs(ground - fromY);
  if (!mayHaveDeck(x, z)) {
    if (gDiff > cfgStep || isBlocked(x, z) != 0) return NaN;
    return ground;
  }
  let best = NaN;
  let bestDiff = Infinity;
  if (gDiff <= cfgStep) {
    best = ground;
    bestDiff = gDiff;
  }
  for (let i = 0; i < deckCount; i++) {
    const dp = DECKS_PTR + <usize>(i * 160);
    if (x < load<f64>(dp + 104) || x > load<f64>(dp + 112) || z < load<f64>(dp + 120) || z > load<f64>(dp + 128)) continue;
    // Check surfaces in ascending height order (matching surfacesAt().sort((a,b)=>a-b) tie-breaking '<').
    const hasTop = x >= load<f64>(dp + 8) && x <= load<f64>(dp + 16) && z >= load<f64>(dp + 24) && z <= load<f64>(dp + 32);
    const top = load<f64>(dp);
    const ry = rampY(dp, x, z);
    const hasRamp = !isNaN(ry) && ry - ground > 0.05;
    if (hasRamp && (!hasTop || ry <= top)) {
      const rd = Math.abs(ry - fromY);
      if (rd <= cfgStep && rd < bestDiff) { best = ry; bestDiff = rd; }
    }
    if (hasTop) {
      const td = Math.abs(top - fromY);
      if (td <= cfgStep && td < bestDiff) { best = top; bestDiff = td; }
    }
    if (hasRamp && hasTop && ry > top) {
      const rd = Math.abs(ry - fromY);
      if (rd <= cfgStep && rd < bestDiff) { best = ry; bestDiff = rd; }
    }
  }
  if (isNaN(best) || isBlockedAt(x, z, best, ground)) return NaN;
  return best;
}

// ---- Ground colour, chunk meshing & minimap rasterisation -----------------------------------------------------------
export function groundColourAt(x: f64, z: f64): u32 {
  const room = interiorNearIdx(x, z);
  if (room >= 0) {
    const zp = ZONES_PTR + <usize>(room * 128);
    const lx = x - load<f64>(zp);
    const lz = z - load<f64>(zp + 8);
    if (Math.abs(lx) > load<f64>(zp + 40) + 0.4 || Math.abs(lz) > load<f64>(zp + 48) + 0.4) {
      return 0x0d0a07;
    }
    const floor = <u32>load<f64>(zp + 72);
    const n = Math.abs(fastSin(x * 12.9898 + z * 78.233) * 43758.5453) % 1.0;
    if (n < 0.5) return floor;
    const r = <u32>jsRound(<f64>((floor >> 16) & 255) * 0.94);
    const g = <u32>jsRound(<f64>((floor >> 8) & 255) * 0.94);
    const b = <u32>jsRound(<f64>(floor & 255) * 0.94);
    return (r << 16) | (g << 8) | b;
  }
  const zIdx = themeZoneIdx(x, z);
  const zp = ZONES_PTR + <usize>(zIdx * 128);
  if (paintChunkCount > 0) {
    const pid = paintIdAt(x, z);
    if (pid != 0) {
      const pc = load<u32>(PAINT_PAL_PTR + (<usize>(pid & 255) << 2));
      if (pc != 0xffffffff) return pc;
    }
  }
  if (isWithinRoad(x, z, 2.2) != 0) return 0x9b7a4c;

  const lStart = <i32>load<f64>(zp + 96);
  const lCount = <i32>load<f64>(zp + 104);
  for (let i = 0; i < lCount; i++) {
    const lp = LAKES_PTR + <usize>((lStart + i) * 32);
    const dx = x - load<f64>(lp);
    const dz = z - load<f64>(lp + 8);
    const lr = load<f64>(lp + 16);
    if (dx * dx + dz * dz < lr * lr * 2.25 && heightAt(x, z) < cfgWaterLevel + 0.6) {
      return 0xd8c78a;
    }
  }

  const rStart = <i32>load<f64>(zp + 80);
  const rCount = <i32>load<f64>(zp + 88);
  for (let i = 0; i < rCount; i++) {
    const rp = REGIONS_PTR + <usize>((rStart + i) * 32);
    const kind = load<f64>(rp + 24);
    if (kind == 1.0 || kind == 2.0) {
      const dx = x - load<f64>(rp);
      const dz = z - load<f64>(rp + 8);
      const rr = load<f64>(rp + 16);
      if (dx * dx + dz * dz <= rr * rr) {
        return kind == 1.0 ? 0x6b5038 : 0x6f8a55;
      }
    }
  }

  const t = Math.abs(fastSin(x * 12.9898 + z * 78.233) * 43758.5453) % 1.0;
  const ground = <u32>load<f64>(zp + 56);
  const groundAlt = <u32>load<f64>(zp + 64);
  if (t < 1.0 / 3.0) return ground;
  if (t < 2.0 / 3.0) {
    const r = <u32>jsRound(<f64>((ground >> 16) & 255) * 0.965);
    const g = <u32>jsRound(<f64>((ground >> 8) & 255) * 0.965);
    const b = <u32>jsRound(<f64>(ground & 255) * 0.965);
    return (r << 16) | (g << 8) | b;
  }
  return groundAlt;
}

@inline function emitFlatTri(
  vIdx: i32,
  ax: f32, ay: f32, az: f32,
  bx: f32, by: f32, bz: f32,
  cx: f32, cy: f32, cz: f32
): void {
  const off = <usize>(vIdx * 12);
  store<f32>(CHUNK_POS_PTR + off, ax);
  store<f32>(CHUNK_POS_PTR + off + 4, ay);
  store<f32>(CHUNK_POS_PTR + off + 8, az);
  store<f32>(CHUNK_POS_PTR + off + 12, bx);
  store<f32>(CHUNK_POS_PTR + off + 16, by);
  store<f32>(CHUNK_POS_PTR + off + 20, bz);
  store<f32>(CHUNK_POS_PTR + off + 24, cx);
  store<f32>(CHUNK_POS_PTR + off + 28, cy);
  store<f32>(CHUNK_POS_PTR + off + 32, cz);

  // Matches THREE.BufferGeometry.computeVertexNormals(): (pC - pB) x (pA - pB)
  const cbX = <f64>(cx - bx), cbY = <f64>(cy - by), cbZ = <f64>(cz - bz);
  const abX = <f64>(ax - bx), abY = <f64>(ay - by), abZ = <f64>(az - bz);
  let nx = cbY * abZ - cbZ * abY;
  let ny = cbZ * abX - cbX * abZ;
  let nz = cbX * abY - cbY * abX;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len > 0.0) {
    nx /= len; ny /= len; nz /= len;
  }
  const fnx = <f32>nx, fny = <f32>ny, fnz = <f32>nz;
  store<f32>(CHUNK_NRM_PTR + off, fnx);
  store<f32>(CHUNK_NRM_PTR + off + 4, fny);
  store<f32>(CHUNK_NRM_PTR + off + 8, fnz);
  store<f32>(CHUNK_NRM_PTR + off + 12, fnx);
  store<f32>(CHUNK_NRM_PTR + off + 16, fny);
  store<f32>(CHUNK_NRM_PTR + off + 20, fnz);
  store<f32>(CHUNK_NRM_PTR + off + 24, fnx);
  store<f32>(CHUNK_NRM_PTR + off + 28, fny);
  store<f32>(CHUNK_NRM_PTR + off + 32, fnz);

  const midX = (<f64>ax + <f64>bx + <f64>cx) / 3.0;
  const midZ = (<f64>az + <f64>bz + <f64>cz) / 3.0;
  const hex = groundColourAt(midX, midZ);
  const cr = load<f32>(SRGB_LUT_PTR + (<usize>((hex >> 16) & 255) << 2));
  const cg = load<f32>(SRGB_LUT_PTR + (<usize>((hex >> 8) & 255) << 2));
  const cb = load<f32>(SRGB_LUT_PTR + (<usize>(hex & 255) << 2));
  store<f32>(CHUNK_COL_PTR + off, cr);
  store<f32>(CHUNK_COL_PTR + off + 4, cg);
  store<f32>(CHUNK_COL_PTR + off + 8, cb);
  store<f32>(CHUNK_COL_PTR + off + 12, cr);
  store<f32>(CHUNK_COL_PTR + off + 16, cg);
  store<f32>(CHUNK_COL_PTR + off + 20, cb);
  store<f32>(CHUNK_COL_PTR + off + 24, cr);
  store<f32>(CHUNK_COL_PTR + off + 28, cg);
  store<f32>(CHUNK_COL_PTR + off + 32, cb);
}

/** Builds non-indexed positions, normals and linear-RGB vertex colours for one chunk. Returns float count (verts * 3). */
export function buildChunkBuffers(cx: f64, cz: f64, chunkSize: f64, segments: i32): i32 {
  const n1 = segments + 1;
  const half = chunkSize * 0.5;
  const step = chunkSize / <f64>segments;
  const xStart = cx - half;
  const zStart = cz - half;

  let minY: f32 = Infinity;
  let maxY: f32 = -Infinity;
  for (let iy = 0; iy < n1; iy++) {
    const wz = <f64>(<f32>(zStart + <f64>iy * step));
    for (let ix = 0; ix < n1; ix++) {
      const wx = <f64>(<f32>(xStart + <f64>ix * step));
      const h = heightAt(wx, wz);
      const fh = <f32>h;
      if (fh < minY) minY = fh;
      if (fh > maxY) maxY = fh;
      store<f64>(CHUNK_GRID_PTR + (<usize>(iy * n1 + ix) << 3), h);
    }
  }
  store<f32>(CHUNK_BOUNDS_PTR, minY);
  store<f32>(CHUNK_BOUNDS_PTR + 4, maxY);

  let vIdx = 0;
  for (let iy = 0; iy < segments; iy++) {
    const z0 = <f32>(zStart + <f64>iy * step);
    const z1 = <f32>(zStart + <f64>(iy + 1) * step);
    for (let ix = 0; ix < segments; ix++) {
      const x0 = <f32>(xStart + <f64>ix * step);
      const x1 = <f32>(xStart + <f64>(ix + 1) * step);
      const a = iy * n1 + ix;
      const b = (iy + 1) * n1 + ix;
      const c = b + 1;
      const d = a + 1;
      const ha = <f32>load<f64>(CHUNK_GRID_PTR + (<usize>a << 3));
      const hb = <f32>load<f64>(CHUNK_GRID_PTR + (<usize>b << 3));
      const hc = <f32>load<f64>(CHUNK_GRID_PTR + (<usize>c << 3));
      const hd = <f32>load<f64>(CHUNK_GRID_PTR + (<usize>d << 3));

      emitFlatTri(vIdx, x0, ha, z0, x0, hb, z1, x1, hd, z0);
      vIdx += 3;
      emitFlatTri(vIdx, x0, hb, z1, x1, hc, z1, x1, hd, z0);
      vIdx += 3;
    }
  }
  return vIdx * 3;
}

/** Fills MINIMAP_PTR with pxCount * pxCount packed ABGR u32 pixels ready for ImageData. */
export function buildMinimapPixels(x0: f64, z0: f64, chunkSize: f64, pxCount: i32, waterLevel: f64): i32 {
  const step = chunkSize / <f64>pxCount;
  // #2d6a9f -> R=0x2d, G=0x6a, B=0x9f -> little-endian ABGR = 0xff9f6a2d
  const waterAbgr: u32 = 0xff9f6a2d;
  let outIdx = 0;
  for (let py = 0; py < pxCount; py++) {
    const wz = z0 + (<f64>py + 0.5) * step;
    for (let px = 0; px < pxCount; px++) {
      const wx = x0 + (<f64>px + 0.5) * step;
      let pixel = waterAbgr;
      if (heightAt(wx, wz) >= waterLevel) {
        const hex = groundColourAt(wx, wz);
        const r = (hex >> 16) & 255;
        const g = (hex >> 8) & 255;
        const b = hex & 255;
        pixel = 0xff000000 | (b << 16) | (g << 8) | r;
      }
      store<u32>(MINIMAP_PTR + (<usize>outIdx << 2), pixel);
      outIdx++;
    }
  }
  return outIdx;
}

// ---- 2D & 3D Grid A* with line-of-sight smoothing -------------------------------------------------------------------
const SQRT2: f64 = 1.4142135623730951;
const SAMPLE: f64 = 0.2;
const LEVEL_HEIGHT: f64 = 2.0;
const HEIGHT_TOL: f64 = 1.5;
const GOAL_SNAP: i32 = 12;
const STALL_EXPAND: i32 = 8000;
const HOPELESS_EXPAND: i32 = 3000;
const MAX_NODES: i32 = 32768;
const STATE_MASK: u32 = 65535; // 65536 - 1

// DIRS: [1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]
@inline function dirX(d: i32): i32 {
  if (d == 0 || d == 4 || d == 5) return 1;
  if (d == 1 || d == 6 || d == 7) return -1;
  return 0;
}
@inline function dirZ(d: i32): i32 {
  if (d == 2 || d == 4 || d == 6) return 1;
  if (d == 3 || d == 5 || d == 7) return -1;
  return 0;
}
@inline function orthoXIdx(di: i32): i32 {
  return di > 0 ? 0 : 1;
}
@inline function orthoZIdx(dj: i32): i32 {
  return dj > 0 ? 2 : 3;
}

@inline function makeStateKey3(i: i32, j: i32, y: f64): u64 {
  let lvl = <i32>Math.floor(y / LEVEL_HEIGHT);
  if (lvl < -32) lvl = -32;
  else if (lvl > 31) lvl = 31;
  return ((<u64><u32>(i + 16384)) << 22) | ((<u64><u32>(j + 16384)) << 6) | <u64><u32>(lvl + 32);
}

@inline function makeStateKey2(i: i32, j: i32): u64 {
  return ((<u64><u32>(i + 16384)) << 16) | <u64><u32>(j + 16384);
}

@inline function findStateSlot(key: u64, baseGen: u32): u32 {
  let h = key * 0x9e3779b97f4a7c15;
  h ^= h >>> 30;
  let slot = <u32>h & STATE_MASK;
  for (let probe: u32 = 0; probe <= STATE_MASK; probe++) {
    const g = load<u32>(STATE_GEN_PTR + (<usize>slot << 2));
    if (g < baseGen) return slot;
    if (load<u64>(STATE_KEY_PTR + (<usize>slot << 3)) == key) return slot;
    slot = (slot + 1) & STATE_MASK;
  }
  return slot;
}

@inline function nodeLess(a: i32, b: i32): bool {
  const fa = load<f64>(NODE_F_PTR + (<usize>a << 3));
  const fb = load<f64>(NODE_F_PTR + (<usize>b << 3));
  if (fa != fb) return fa < fb;
  return load<f64>(NODE_H_PTR + (<usize>a << 3)) < load<f64>(NODE_H_PTR + (<usize>b << 3));
}

function heapPush(heapLen: i32, nodeIdx: i32): i32 {
  let k = heapLen;
  store<i32>(HEAP_PTR + (<usize>k << 2), nodeIdx);
  while (k > 0) {
    const p = (k - 1) >> 1;
    const pIdx = load<i32>(HEAP_PTR + (<usize>p << 2));
    if (!nodeLess(nodeIdx, pIdx)) break;
    store<i32>(HEAP_PTR + (<usize>k << 2), pIdx);
    store<i32>(HEAP_PTR + (<usize>p << 2), nodeIdx);
    k = p;
  }
  return heapLen + 1;
}

function heapPop(heapLen: i32): i32 {
  const top = load<i32>(HEAP_PTR);
  const newLen = heapLen - 1;
  if (newLen > 0) {
    const last = load<i32>(HEAP_PTR + (<usize>newLen << 2));
    store<i32>(HEAP_PTR, last);
    let k = 0;
    for (;;) {
      const l = (k << 1) + 1;
      if (l >= newLen) break;
      const r = l + 1;
      let m = k;
      let mIdx = last;
      const lIdx = load<i32>(HEAP_PTR + (<usize>l << 2));
      if (nodeLess(lIdx, mIdx)) {
        m = l;
        mIdx = lIdx;
      }
      if (r < newLen) {
        const rIdx = load<i32>(HEAP_PTR + (<usize>r << 2));
        if (nodeLess(rIdx, mIdx)) {
          m = r;
          mIdx = rIdx;
        }
      }
      if (m == k) break;
      store<i32>(HEAP_PTR + (<usize>k << 2), mIdx);
      store<i32>(HEAP_PTR + (<usize>m << 2), last);
      k = m;
    }
  }
  return top;
}

// stepMode: 0 = terrain standY, 1 = hostCustomStep
@inline function evalStep3(stepMode: i32, x: f64, z: f64, fromY: f64): f64 {
  return stepMode == 0 ? standY(x, z, fromY) : hostCustomStep(x, z, fromY);
}

// costMode: 0 = none (1.0), 1 = terrain roadBias, 2 = hostCustomCost
@inline function evalCost(costMode: i32, roadBias: f64, x: f64, z: f64): f64 {
  if (costMode == 0) return 1.0;
  if (costMode == 1) {
    const i = <f64>jsRound(x);
    const j = <f64>jsRound(z);
    return isWithinRoad(i, j, cfgRoadHalfWidth) != 0 ? roadBias : 1.0;
  }
  return hostCustomCost(x, z);
}

function walkLine3(stepMode: i32, ax: f64, az: f64, ay: f64, bx: f64, bz: f64): f64 {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.sqrt(dx * dx + dz * dz);
  let steps = <i32>Math.ceil(len / SAMPLE);
  if (steps < 1) steps = 1;
  const fSteps = <f64>steps;
  let y = ay;
  for (let s = 1; s <= steps; s++) {
    const t = <f64>s / fSteps;
    const ny = evalStep3(stepMode, ax + dx * t, az + dz * t, y);
    if (isNaN(ny)) return NaN;
    y = ny;
  }
  return y;
}

@inline function lineClear3(stepMode: i32, ax: f64, ay: f64, az: f64, bx: f64, by: f64, bz: f64): bool {
  const y = walkLine3(stepMode, ax, az, ay, bx, bz);
  return !isNaN(y) && Math.abs(y - by) < HEIGHT_TOL;
}

function segCostSum(costMode: i32, roadBias: f64, ax: f64, az: f64, bx: f64, bz: f64): f64 {
  const dx = bx - ax;
  const dz = bz - az;
  let steps = <i32>Math.ceil(Math.sqrt(dx * dx + dz * dz));
  if (steps < 1) steps = 1;
  const fSteps = <f64>steps;
  let sum = 0.0;
  for (let s = 1; s <= steps; s++) {
    const t = <f64>s / fSteps;
    sum += evalCost(costMode, roadBias, ax + dx * t, az + dz * t);
  }
  return sum;
}

function segCostSamples(ax: f64, az: f64, bx: f64, bz: f64): i32 {
  const dx = bx - ax;
  const dz = bz - az;
  let steps = <i32>Math.ceil(Math.sqrt(dx * dx + dz * dz));
  return steps < 1 ? 1 : steps;
}

/**
 * 3D height-aware A* search + line-of-sight smoothing.
 * stepMode: 0 = internal terrain standY (zero JS callbacks!), 1 = hostCustomStep
 * costMode: 0 = none, 1 = internal roadBias, 2 = hostCustomCost
 * Returns number of Point3 waypoints written to OUT_PATH_PTR (3 f64s per waypoint).
 */
export function findPath3Wasm(
  fromX: f64, fromY: f64, fromZ: f64,
  goalX: f64, goalY: f64, goalZ: f64,
  maxExpandIn: i32,
  stepMode: i32,
  costMode: i32,
  roadBias: f64,
  minCost: f64
): i32 {
  const si = jsRound(fromX);
  const sj = jsRound(fromZ);

  // snapGoal
  let toX = goalX, toY = goalY, toZ = goalZ;
  let snapped = false;
  const g0i = jsRound(goalX);
  const g0j = jsRound(goalZ);
  if (!isNaN(evalStep3(stepMode, <f64>g0i, <f64>g0j, goalY))) {
    snapped = true;
  } else {
    for (let r = 1; r <= GOAL_SNAP; r++) {
      let bestD2 = Infinity;
      let foundRing = false;
      for (let di = -r; di <= r; di++) {
        for (let dj = -r; dj <= r; dj++) {
          const adx = di < 0 ? -di : di;
          const adz = dj < 0 ? -dj : dj;
          if ((adx > adz ? adx : adz) != r) continue;
          const tx = <f64>(g0i + di);
          const tz = <f64>(g0j + dj);
          const d2 = (tx - goalX) * (tx - goalX) + (tz - goalZ) * (tz - goalZ);
          if (d2 >= bestD2) continue;
          const y = evalStep3(stepMode, tx, tz, goalY);
          if (isNaN(y)) continue;
          toX = tx; toY = y; toZ = tz;
          bestD2 = d2;
          foundRing = true;
        }
      }
      if (foundRing) {
        snapped = true;
        break;
      }
    }
  }

  let maxExpand = maxExpandIn;
  if (!snapped && HOPELESS_EXPAND < maxExpand) maxExpand = HOPELESS_EXPAND;
  const gi = jsRound(toX);
  const gj = jsRound(toZ);
  const hasCost = costMode != 0;

  astarStateGen += 2;
  if (astarStateGen >= 0xfffffff0) {
    memory.fill(STATE_GEN_PTR, 0, 65536 * 4);
    astarStateGen = 2;
  }
  const genOpen = astarStateGen;
  const genClosed = astarStateGen + 1;

  const dx0 = <f64>(si > gi ? si - gi : gi - si);
  const dz0 = <f64>(sj > gj ? sj - gj : gj - sj);
  const oct0 = (dx0 > dz0 ? dx0 : dz0) + (SQRT2 - 1.0) * (dx0 < dz0 ? dx0 : dz0);
  const h0 = hasCost ? oct0 * minCost : oct0;

  // Node 0 = start
  store<i32>(NODE_I_PTR, si);
  store<i32>(NODE_J_PTR, sj);
  store<i32>(NODE_PAR_PTR, -1);
  store<f64>(NODE_Y_PTR, fromY);
  store<f64>(NODE_G_PTR, 0.0);
  store<f64>(NODE_H_PTR, h0);
  store<f64>(NODE_F_PTR, h0);
  let nodeCount = 1;
  let heapLen = heapPush(0, 0);

  const startKey = makeStateKey3(si, sj, fromY);
  const startSlot = findStateSlot(startKey, genOpen);
  store<u32>(STATE_GEN_PTR + (<usize>startSlot << 2), genOpen);
  store<u64>(STATE_KEY_PTR + (<usize>startSlot << 3), startKey);
  store<f64>(STATE_G_PTR + (<usize>startSlot << 3), 0.0);

  const startBlocked = isNaN(evalStep3(stepMode, fromX, fromZ, fromY));
  let closestIdx = 0;
  let closestScore = h0 + Math.abs(fromY - toY);
  let reachedIdx = -1;
  let expanded = 0;
  let lastGain = 0;

  // Scratch around[8] stored in first 8 f64s of CHUNK_GRID_PTR (disjoint from A*)
  const aroundPtr = CHUNK_GRID_PTR;

  while (heapLen > 0) {
    const nIdx = heapPop(heapLen);
    heapLen--;
    const ni0 = load<i32>(NODE_I_PTR + (<usize>nIdx << 2));
    const nj0 = load<i32>(NODE_J_PTR + (<usize>nIdx << 2));
    const ny0 = load<f64>(NODE_Y_PTR + (<usize>nIdx << 3));

    const k = makeStateKey3(ni0, nj0, ny0);
    const kSlot = findStateSlot(k, genOpen);
    if (load<u32>(STATE_GEN_PTR + (<usize>kSlot << 2)) == genClosed) continue;

    const hGap = Math.abs(ny0 - toY);
    if (ni0 == gi && nj0 == gj && hGap < HEIGHT_TOL) {
      reachedIdx = nIdx;
      break;
    }

    store<u32>(STATE_GEN_PTR + (<usize>kSlot << 2), genClosed);
    store<u64>(STATE_KEY_PTR + (<usize>kSlot << 3), k);
    expanded++;

    const nh0 = load<f64>(NODE_H_PTR + (<usize>nIdx << 3));
    const score = nh0 + hGap;
    if (score < closestScore) {
      closestIdx = nIdx;
      closestScore = score;
      lastGain = expanded;
    }
    if (expanded >= maxExpand) break;
    if (expanded - lastGain >= STALL_EXPAND) break;

    for (let d = 0; d < 8; d++) {
      store<f64>(aroundPtr + (<usize>d << 3), evalStep3(stepMode, <f64>(ni0 + dirX(d)), <f64>(nj0 + dirZ(d)), ny0));
    }

    const ng0 = load<f64>(NODE_G_PTR + (<usize>nIdx << 3));

    for (let d = 0; d < 8; d++) {
      const di = dirX(d);
      const dj = dirZ(d);
      const ni = ni0 + di;
      const nj = nj0 + dj;
      const diagonal = di != 0 && dj != 0;
      if (diagonal) {
        const oxY = load<f64>(aroundPtr + (<usize>orthoXIdx(di) << 3));
        const ozY = load<f64>(aroundPtr + (<usize>orthoZIdx(dj) << 3));
        const canOx = (ni == si && nj0 == sj) || !isNaN(oxY);
        const canOz = (ni0 == si && nj == sj) || !isNaN(ozY);
        if (!canOx || !canOz) continue;
      }
      let ny = load<f64>(aroundPtr + (<usize>d << 3));
      if (isNaN(ny)) continue;

      const preKey = makeStateKey3(ni, nj, ny);
      const preSlot = findStateSlot(preKey, genOpen);
      if (load<u32>(STATE_GEN_PTR + (<usize>preSlot << 2)) == genClosed) continue;

      if (!(nIdx == 0 && startBlocked)) {
        ny = walkLine3(stepMode, nIdx == 0 ? fromX : <f64>ni0, nIdx == 0 ? fromZ : <f64>nj0, ny0, <f64>ni, <f64>nj);
        if (isNaN(ny)) continue;
      }

      const nk = makeStateKey3(ni, nj, ny);
      const nSlot = findStateSlot(nk, genOpen);
      const slotGen = load<u32>(STATE_GEN_PTR + (<usize>nSlot << 2));
      if (slotGen == genClosed) continue;

      let stepCost = 1.0;
      if (hasCost) {
        const c = evalCost(costMode, roadBias, <f64>ni, <f64>nj);
        stepCost = c > minCost ? c : minCost;
      }
      const g = ng0 + (diagonal ? SQRT2 : 1.0) * stepCost;
      const prevBest = slotGen == genOpen ? load<f64>(STATE_G_PTR + (<usize>nSlot << 3)) : Infinity;
      if (g < prevBest && nodeCount < MAX_NODES) {
        store<u32>(STATE_GEN_PTR + (<usize>nSlot << 2), genOpen);
        store<u64>(STATE_KEY_PTR + (<usize>nSlot << 3), nk);
        store<f64>(STATE_G_PTR + (<usize>nSlot << 3), g);

        const dxi = <f64>(ni > gi ? ni - gi : gi - ni);
        const dzi = <f64>(nj > gj ? nj - gj : gj - nj);
        const oct = (dxi > dzi ? dxi : dzi) + (SQRT2 - 1.0) * (dxi < dzi ? dxi : dzi);
        const h = hasCost ? oct * minCost : oct;

        const child = nodeCount++;
        store<i32>(NODE_I_PTR + (<usize>child << 2), ni);
        store<i32>(NODE_J_PTR + (<usize>child << 2), nj);
        store<i32>(NODE_PAR_PTR + (<usize>child << 2), nIdx);
        store<f64>(NODE_Y_PTR + (<usize>child << 3), ny);
        store<f64>(NODE_G_PTR + (<usize>child << 3), g);
        store<f64>(NODE_H_PTR + (<usize>child << 3), h);
        store<f64>(NODE_F_PTR + (<usize>child << 3), g + h);
        heapLen = heapPush(heapLen, child);
      }
    }
  }

  const endIdx = reachedIdx >= 0 ? reachedIdx : closestIdx;
  if (reachedIdx < 0 && endIdx == 0) return 0;

  // Reconstruct chain in reverse into HEAP_PTR (no longer needed), then drop start cell.
  let chainLen = 0;
  let curIdx = endIdx;
  while (curIdx >= 0) {
    store<i32>(HEAP_PTR + (<usize>chainLen << 2), curIdx);
    chainLen++;
    curIdx = load<i32>(NODE_PAR_PTR + (<usize>curIdx << 2));
  }

  // Raw pts stored temporarily in NODE_G_PTR (x), NODE_H_PTR (y), NODE_F_PTR (z) for indices 0..ptsLen-1
  let ptsLen = chainLen - 1;
  for (let idx = 0; idx < ptsLen; idx++) {
    const srcNode = load<i32>(HEAP_PTR + (<usize>(chainLen - 2 - idx) << 2));
    store<f64>(NODE_G_PTR + (<usize>idx << 3), <f64>load<i32>(NODE_I_PTR + (<usize>srcNode << 2)));
    store<f64>(NODE_H_PTR + (<usize>idx << 3), load<f64>(NODE_Y_PTR + (<usize>srcNode << 3)));
    store<f64>(NODE_F_PTR + (<usize>idx << 3), <f64>load<i32>(NODE_J_PTR + (<usize>srcNode << 2)));
  }

  if (reachedIdx >= 0) {
    const prevX = ptsLen >= 2 ? load<f64>(NODE_G_PTR + (<usize>(ptsLen - 2) << 3)) : fromX;
    const prevY = ptsLen >= 2 ? load<f64>(NODE_H_PTR + (<usize>(ptsLen - 2) << 3)) : fromY;
    const prevZ = ptsLen >= 2 ? load<f64>(NODE_F_PTR + (<usize>(ptsLen - 2) << 3)) : fromZ;
    const ey = walkLine3(stepMode, prevX, prevZ, prevY, toX, toZ);
    const reachedY = load<f64>(NODE_Y_PTR + (<usize>reachedIdx << 3));
    if (!isNaN(ey) && Math.abs(ey - reachedY) < HEIGHT_TOL) {
      if (ptsLen == 0) {
        ptsLen = 1;
      }
      store<f64>(NODE_G_PTR + (<usize>(ptsLen - 1) << 3), toX);
      store<f64>(NODE_H_PTR + (<usize>(ptsLen - 1) << 3), ey);
      store<f64>(NODE_F_PTR + (<usize>(ptsLen - 1) << 3), toZ);
    }
  }

  // Smooth waypoints into OUT_PATH_PTR
  let outCount = 0;
  let curX = fromX, curY = fromY, curZ = fromZ;
  let k = 0;
  while (k < ptsLen) {
    let far = k;
    let polySum = 0.0;
    let polySamples = 0;
    if (hasCost) {
      const kX = load<f64>(NODE_G_PTR + (<usize>k << 3));
      const kZ = load<f64>(NODE_F_PTR + (<usize>k << 3));
      polySum = segCostSum(costMode, roadBias, curX, curZ, kX, kZ);
      polySamples = segCostSamples(curX, curZ, kX, kZ);
    }
    for (let m = k + 1; m < ptsLen; m++) {
      const mX = load<f64>(NODE_G_PTR + (<usize>m << 3));
      const mY = load<f64>(NODE_H_PTR + (<usize>m << 3));
      const mZ = load<f64>(NODE_F_PTR + (<usize>m << 3));
      if (!lineClear3(stepMode, curX, curY, curZ, mX, mY, mZ)) break;
      if (hasCost) {
        const pmX = load<f64>(NODE_G_PTR + (<usize>(m - 1) << 3));
        const pmZ = load<f64>(NODE_F_PTR + (<usize>(m - 1) << 3));
        polySum += segCostSum(costMode, roadBias, pmX, pmZ, mX, mZ);
        polySamples += segCostSamples(pmX, pmZ, mX, mZ);
        const directAvg = segCostSum(costMode, roadBias, curX, curZ, mX, mZ) / <f64>segCostSamples(curX, curZ, mX, mZ);
        const polyAvg = polySum / <f64>polySamples;
        if (directAvg > 1.05 * polyAvg) break;
      }
      far = m;
    }
    curX = load<f64>(NODE_G_PTR + (<usize>far << 3));
    curY = load<f64>(NODE_H_PTR + (<usize>far << 3));
    curZ = load<f64>(NODE_F_PTR + (<usize>far << 3));
    const op = OUT_PATH_PTR + <usize>(outCount * 24);
    store<f64>(op, curX);
    store<f64>(op + 8, curY);
    store<f64>(op + 16, curZ);
    outCount++;
    k = far + 1;
  }
  return outCount;
}

/** 2D A* (`findPath`) with line-of-sight smoothing. blockedMode: 0 = terrain isBlocked, 1 = hostCustomBlocked. */
export function findPath2Wasm(fromX: f64, fromZ: f64, toX: f64, toZ: f64, maxExpand: i32, blockedMode: i32): i32 {
  const si = jsRound(fromX);
  const sj = jsRound(fromZ);
  const gi = jsRound(toX);
  const gj = jsRound(toZ);

  astarStateGen += 2;
  if (astarStateGen >= 0xfffffff0) {
    memory.fill(STATE_GEN_PTR, 0, 65536 * 4);
    astarStateGen = 2;
  }
  const genOpen = astarStateGen;
  const genClosed = astarStateGen + 1;

  const dx0 = <f64>(si > gi ? si - gi : gi - si);
  const dz0 = <f64>(sj > gj ? sj - gj : gj - sj);
  const h0 = (dx0 > dz0 ? dx0 : dz0) + (SQRT2 - 1.0) * (dx0 < dz0 ? dx0 : dz0);

  store<i32>(NODE_I_PTR, si);
  store<i32>(NODE_J_PTR, sj);
  store<i32>(NODE_PAR_PTR, -1);
  store<f64>(NODE_G_PTR, 0.0);
  store<f64>(NODE_H_PTR, h0);
  store<f64>(NODE_F_PTR, h0);
  let nodeCount = 1;
  let heapLen = heapPush(0, 0);

  const startKey = makeStateKey2(si, sj);
  const startSlot = findStateSlot(startKey, genOpen);
  store<u32>(STATE_GEN_PTR + (<usize>startSlot << 2), genOpen);
  store<u64>(STATE_KEY_PTR + (<usize>startSlot << 3), startKey);
  store<f64>(STATE_G_PTR + (<usize>startSlot << 3), 0.0);

  const startBlocked = (blockedMode == 0 ? isBlocked(fromX, fromZ) : hostCustomBlocked(fromX, fromZ)) != 0;
  let closestIdx = 0;
  let closestH = h0;
  let reachedIdx = -1;
  let expanded = 0;

  while (heapLen > 0) {
    const nIdx = heapPop(heapLen);
    heapLen--;
    const ni0 = load<i32>(NODE_I_PTR + (<usize>nIdx << 2));
    const nj0 = load<i32>(NODE_J_PTR + (<usize>nIdx << 2));
    const k = makeStateKey2(ni0, nj0);
    const kSlot = findStateSlot(k, genOpen);
    if (load<u32>(STATE_GEN_PTR + (<usize>kSlot << 2)) == genClosed) continue;

    if (ni0 == gi && nj0 == gj) {
      reachedIdx = nIdx;
      break;
    }

    store<u32>(STATE_GEN_PTR + (<usize>kSlot << 2), genClosed);
    store<u64>(STATE_KEY_PTR + (<usize>kSlot << 3), k);
    expanded++;
    const nh0 = load<f64>(NODE_H_PTR + (<usize>nIdx << 3));
    if (nh0 < closestH) {
      closestIdx = nIdx;
      closestH = nh0;
    }
    if (expanded >= maxExpand) break;

    const ng0 = load<f64>(NODE_G_PTR + (<usize>nIdx << 3));
    for (let d = 0; d < 8; d++) {
      const di = dirX(d);
      const dj = dirZ(d);
      const ni = ni0 + di;
      const nj = nj0 + dj;
      const freeN = (ni == si && nj == sj) || (blockedMode == 0 ? isBlocked(<f64>ni, <f64>nj) : hostCustomBlocked(<f64>ni, <f64>nj)) == 0;
      if (!freeN) continue;
      const diagonal = di != 0 && dj != 0;
      if (diagonal) {
        const freeOx = (ni == si && nj0 == sj) || (blockedMode == 0 ? isBlocked(<f64>ni, <f64>nj0) : hostCustomBlocked(<f64>ni, <f64>nj0)) == 0;
        if (!freeOx) continue;
        const freeOz = (ni0 == si && nj == sj) || (blockedMode == 0 ? isBlocked(<f64>ni0, <f64>nj) : hostCustomBlocked(<f64>ni0, <f64>nj)) == 0;
        if (!freeOz) continue;
      }
      if (!(nIdx == 0 && startBlocked)) {
        const ax = nIdx == 0 ? fromX : <f64>ni0;
        const az = nIdx == 0 ? fromZ : <f64>nj0;
        const dx = <f64>ni - ax, dz = <f64>nj - az;
        let steps = <i32>Math.ceil(Math.sqrt(dx * dx + dz * dz) / SAMPLE);
        if (steps < 1) steps = 1;
        let ok = true;
        for (let s = 1; s <= steps; s++) {
          const t = <f64>s / <f64>steps;
          if ((blockedMode == 0 ? isBlocked(ax + dx * t, az + dz * t) : hostCustomBlocked(ax + dx * t, az + dz * t)) != 0) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
      }

      const nk = makeStateKey2(ni, nj);
      const nSlot = findStateSlot(nk, genOpen);
      const slotGen = load<u32>(STATE_GEN_PTR + (<usize>nSlot << 2));
      if (slotGen == genClosed) continue;
      const g = ng0 + (diagonal ? SQRT2 : 1.0);
      const prevBest = slotGen == genOpen ? load<f64>(STATE_G_PTR + (<usize>nSlot << 3)) : Infinity;
      if (g < prevBest && nodeCount < MAX_NODES) {
        store<u32>(STATE_GEN_PTR + (<usize>nSlot << 2), genOpen);
        store<u64>(STATE_KEY_PTR + (<usize>nSlot << 3), nk);
        store<f64>(STATE_G_PTR + (<usize>nSlot << 3), g);

        const dxi = <f64>(ni > gi ? ni - gi : gi - ni);
        const dzi = <f64>(nj > gj ? nj - gj : gj - nj);
        const h = (dxi > dzi ? dxi : dzi) + (SQRT2 - 1.0) * (dxi < dzi ? dxi : dzi);
        const child = nodeCount++;
        store<i32>(NODE_I_PTR + (<usize>child << 2), ni);
        store<i32>(NODE_J_PTR + (<usize>child << 2), nj);
        store<i32>(NODE_PAR_PTR + (<usize>child << 2), nIdx);
        store<f64>(NODE_G_PTR + (<usize>child << 3), g);
        store<f64>(NODE_H_PTR + (<usize>child << 3), h);
        store<f64>(NODE_F_PTR + (<usize>child << 3), g + h);
        heapLen = heapPush(heapLen, child);
      }
    }
  }

  const endIdx = reachedIdx >= 0 ? reachedIdx : closestIdx;
  if (reachedIdx < 0 && endIdx == 0) return 0;

  let chainLen = 0;
  let curIdx = endIdx;
  while (curIdx >= 0) {
    store<i32>(HEAP_PTR + (<usize>chainLen << 2), curIdx);
    chainLen++;
    curIdx = load<i32>(NODE_PAR_PTR + (<usize>curIdx << 2));
  }

  let ptsLen = chainLen - 1;
  for (let idx = 0; idx < ptsLen; idx++) {
    const srcNode = load<i32>(HEAP_PTR + (<usize>(chainLen - 2 - idx) << 2));
    store<f64>(NODE_G_PTR + (<usize>idx << 3), <f64>load<i32>(NODE_I_PTR + (<usize>srcNode << 2)));
    store<f64>(NODE_F_PTR + (<usize>idx << 3), <f64>load<i32>(NODE_J_PTR + (<usize>srcNode << 2)));
  }

  if (reachedIdx >= 0) {
    const prevX = ptsLen >= 2 ? load<f64>(NODE_G_PTR + (<usize>(ptsLen - 2) << 3)) : fromX;
    const prevZ = ptsLen >= 2 ? load<f64>(NODE_F_PTR + (<usize>(ptsLen - 2) << 3)) : fromZ;
    const dx = toX - prevX, dz = toZ - prevZ;
    let steps = <i32>Math.ceil(Math.sqrt(dx * dx + dz * dz) / SAMPLE);
    if (steps < 1) steps = 1;
    let ok = true;
    for (let s = 1; s <= steps; s++) {
      const t = <f64>s / <f64>steps;
      if ((blockedMode == 0 ? isBlocked(prevX + dx * t, prevZ + dz * t) : hostCustomBlocked(prevX + dx * t, prevZ + dz * t)) != 0) {
        ok = false;
        break;
      }
    }
    if (ok) {
      if (ptsLen == 0) ptsLen = 1;
      store<f64>(NODE_G_PTR + (<usize>(ptsLen - 1) << 3), toX);
      store<f64>(NODE_F_PTR + (<usize>(ptsLen - 1) << 3), toZ);
    }
  }

  let outCount = 0;
  let curX = fromX, curZ = fromZ;
  let k = 0;
  while (k < ptsLen) {
    let far = k;
    for (let m = k + 1; m < ptsLen; m++) {
      const mX = load<f64>(NODE_G_PTR + (<usize>m << 3));
      const mZ = load<f64>(NODE_F_PTR + (<usize>m << 3));
      const dx = mX - curX, dz = mZ - curZ;
      let steps = <i32>Math.ceil(Math.sqrt(dx * dx + dz * dz) / SAMPLE);
      if (steps < 1) steps = 1;
      let ok = true;
      for (let s = 1; s <= steps; s++) {
        const t = <f64>s / <f64>steps;
        if ((blockedMode == 0 ? isBlocked(curX + dx * t, curZ + dz * t) : hostCustomBlocked(curX + dx * t, curZ + dz * t)) != 0) {
          ok = false;
          break;
        }
      }
      if (ok) far = m;
      else break;
    }
    curX = load<f64>(NODE_G_PTR + (<usize>far << 3));
    curZ = load<f64>(NODE_F_PTR + (<usize>far << 3));
    const op = OUT_PATH_PTR + <usize>(outCount * 16);
    store<f64>(op, curX);
    store<f64>(op + 8, curZ);
    outCount++;
    k = far + 1;
  }
  return outCount;
}
