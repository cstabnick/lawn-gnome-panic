// High-performance WebAssembly kernel for Gnome Theft Auto (AssemblyScript, --runtime stub -O3 --enable simd).
// Accelerates:
//   1. 451x451 distance fields (river, water, inner region border, highway) + exact polygon regionAt
//   2. 901x901 multi-octave fBm / ridged heightfield + all 6 region landforms + macro landscape + road/trail/site flatten
//   3. 900x900 surface paint rasterisation (terrainPaint.ts)
//   4. Chunk vertex position + bridge-aware central-difference normal generation (terrainMesh.ts)
//   5. Full-scene f32x4 SIMD distance/shadow/detail culler returning only changed slot deltas (cull.ts)

// ---- Linear-memory layout: small fixed tables below 0x0AC000, then size-dependent buffers (configureLayout grows
// memory once at startup; the host re-creates its typed-array views afterwards) ----------------------------------------
// 0x000000 .. 0x008000 : Wasm stack (32 KB)
const CFG_PTR: usize           = 0x008000; // 64 * f64 (512 B)
// 0x008200 .. 0x00C200 : unused (the region raster moved to the size-dependent area)
const REG_ORIGINS_PTR: usize   = 0x00C200; // 16 * 2 * f64 (256 B -> 0x00C300)
const REG_POLY_META_PTR: usize = 0x00C300; // 16 * 2 * i32 (128 B -> 0x00C400)
const REG_POLY_PTS_PTR: usize  = 0x00C400; // 512 * 2 * f64 (8 KB -> 0x00E400)

const RIVER_SEGS_PTR: usize    = 0x00E400; // 1024 * 9 * f64 (72 KB -> 0x020400)
const ROAD_SEGS_PTR: usize     = 0x020400; // 1024 * 9 * f64 (72 KB -> 0x032400)
const EDGE_SEGS_PTR: usize     = 0x032400; // 1024 * 9 * f64 (72 KB -> 0x044400)
const EDGE_META_PTR: usize     = 0x044400; // 16 * 2 * i32 (128 B -> 0x044500)
const WATER_BODIES_PTR: usize  = 0x044800; // 64 * 4 * f64 (2 KB -> 0x045000)

const MACRO_SITES_PTR: usize   = 0x045000; // 256 * 4 * f64 (8 KB -> 0x047000)
const TRAIL_META_PTR: usize    = 0x047000; // 128 * 8 * f64 (8 KB -> 0x049000): startPt, ptCount, minX, maxX, minZ, maxZ, halfWidth, pad
const TRAIL_PTS_PTR: usize     = 0x049000; // 2048 * 2 * f64 (32 KB -> 0x051000)
const MACRO_FEAT_PTR: usize    = 0x051000; // 128 * 10 * f64 (10 KB -> 0x054000): kind, r, h, seed, startPt, ptCount, minX, maxX, minZ, maxZ
const MACRO_PTS_PTR: usize     = 0x054000; // 1024 * 2 * f64 (16 KB -> 0x058000)

const LF_PARAMS_PTR: usize     = 0x058000; // 16 * 16 * f64 (2 KB -> 0x058800)
const LF_REG_META_PTR: usize   = 0x058800; // 16 * 2 * i32 (128 B -> 0x058900): (featStart, featCount) per region
const LF_FEAT_PTR: usize       = 0x058A00; // 256 * 6 * f64 (12 KB -> 0x05BA00): kindCode, r, h, startPt, ptCount, pad
const LF_PTS_PTR: usize        = 0x05BA00; // 2048 * 2 * f64 (32 KB -> 0x063A00)

const STAMPS_PTR: usize        = 0x063A00; // 256 * 6 * f64 (12 KB -> 0x066A00): op, x, z, p1, p2, p3
const FLAT_SEGS_PTR: usize     = 0x066A00; // 2048 * 6 * f64 (96 KB -> 0x07EA00): ax, az, bx, bz, inner, outer
const FLAT_SITES_PTR: usize    = 0x07EA00; // 256 * 6 * f64 (12 KB -> 0x081A00): minX, maxX, minZ, maxZ, hasTarget, target
const BRIDGES_PTR: usize       = 0x081A00; // 128 * 9 * f64 (9 KB -> 0x084000): x, z, sinY, cosY, halfLen, halfWid, deck, reach, pad

// SIMD culler buffers (MAX_CULL = 8192)
const CULL_LIM_PTR: usize      = 0x084000; // 16 * 4 * f32 (256 B): draw, shadow, detail, pad
const CULL_X_PTR: usize        = 0x084200; // 8192 * f32 = 32 KB -> 0x08C200
const CULL_Z_PTR: usize        = 0x08C200; // 8192 * f32 = 32 KB -> 0x094200
const CULL_R_PTR: usize        = 0x094200; // 8192 * f32 = 32 KB -> 0x09C200
const CULL_CLS_PTR: usize      = 0x09C200; // 8192 * u8 = 8 KB -> 0x09E200
const CULL_STATE_PTR: usize    = 0x09E200; // 8192 * u8 = 8 KB -> 0x0A0200
const CULL_ACTIVE_PTR: usize   = 0x0A0200; // 8192 * u8 = 8 KB -> 0x0A2200
const CULL_OUT_PTR: usize      = 0x0A2200; // 8192 * u32 = 32 KB -> 0x0AA200

// Size-dependent buffers (region raster, the four distance fields, height grid, scratch A/B, chunk buffers) start at
// DYN_BASE and are laid out by configureLayout() from the world's grid sizes; it grows memory to fit.
const DYN_BASE: usize          = 0x0AC000;
let REG_RASTER_PTR: usize      = 0;  // rasterN * rasterN i8
let FIELD_RIVER_PTR: usize     = 0;  // fieldN * fieldN f32 each
let FIELD_WATER_PTR: usize     = 0;
let FIELD_BORDER_PTR: usize    = 0;
let FIELD_ROAD_PTR: usize      = 0;
let HEIGHT_GRID_PTR: usize     = 0;  // gridN * gridN f32
let SCRATCH_A_PTR: usize       = 0;  // bestW (gridN^2 f32) | paintGrid ((gridN-1)^2 u8) | chunkPos
let SCRATCH_B_PTR: usize       = 0;  // target (gridN^2 f32)
let CHUNK_POS_PTR: usize       = 0;  // 65 * 65 * 3 * f32 = 50.7 KB (inside scratch A)
let CHUNK_NRM_PTR: usize       = 0;  // 65 * 65 * 3 * f32 = 50.7 KB (inside scratch A)

@inline function align16(v: usize): usize { return (v + 15) & ~15; }

/** Lays the size-dependent buffers out after the fixed tables, grows memory to fit, returns the total bytes used. */
export function configureLayout(rRasterN: i32, fN: i32, gN: i32): i32 {
  let p = DYN_BASE;
  REG_RASTER_PTR = p;
  p = align16(p + <usize>rRasterN * <usize>rRasterN);
  const fieldBytes = align16(<usize>fN * <usize>fN * 4);
  FIELD_RIVER_PTR = p; p += fieldBytes;
  FIELD_WATER_PTR = p; p += fieldBytes;
  FIELD_BORDER_PTR = p; p += fieldBytes;
  FIELD_ROAD_PTR = p; p += fieldBytes;
  const gridBytes = align16(<usize>gN * <usize>gN * 4);
  HEIGHT_GRID_PTR = p; p += gridBytes;
  SCRATCH_A_PTR = p; p += gridBytes;
  SCRATCH_B_PTR = p; p += gridBytes;
  CHUNK_POS_PTR = SCRATCH_A_PTR;
  CHUNK_NRM_PTR = SCRATCH_A_PTR + 0x10000;
  const needPages = <i32>((p + 0xFFFF) >>> 16);
  const havePages = memory.size();
  if (needPages > havePages) {
    if (memory.grow(needPages - havePages) < 0) return -1;
  }
  fieldsBuilt = 0;
  return <i32>p;
}

// ---- Counts & cached scalars ----------------------------------------------------------------------------------------
let regionCount: i32 = 7;
let rasterN: i32 = 113;
let regionCell: f64 = 16.0;
let worldHalf: f64 = 900.0;
let cityHalf: f64 = 240.0;
let fieldN: i32 = 451;
let fieldStep: f64 = 4.0;
let gridN: i32 = 901;
let gridStep: f64 = 2.0;

let riverSegCount: i32 = 0;
let roadSegCount: i32 = 0;
let waterBodyCount: i32 = 0;
let macroSiteCount: i32 = 0;
let trailCount: i32 = 0;
let macroFeatCount: i32 = 0;
let stampCount: i32 = 0;
let flatSegCount: i32 = 0;
let flatSiteCount: i32 = 0;
let bridgeCount: i32 = 0;
let fieldsBuilt: i32 = 0;

// Terrain & macro tuning scalars
let tiltPerM: f64 = 0.004;
let tiltFlatHalf: f64 = 263.0;
let reliefBorderFade: f64 = 50.0;
let riverClear: f64 = 10.0;
let riverFade: f64 = 30.0;
let siteMargin: f64 = 6.0;
let siteFade: f64 = 30.0;
let rockSlope: f64 = 0.8;
let mudReach: f64 = 6.0;

let mRoadClear: f64 = 0.0;
let mRoadFade: f64 = 0.0;
let mTrailClear: f64 = 0.0;
let mTrailFade: f64 = 0.0;
let mWaterClear: f64 = 0.0;
let mWaterFade: f64 = 0.0;
let mSiteClear: f64 = 0.0;
let mSiteFade: f64 = 0.0;
let mCityClear: f64 = 0.0;
let mCityFade: f64 = 0.0;
let mRimHeight: f64 = 0.0;
let mRimWidth: f64 = 0.0;
let mRoll: f64 = 0.0;
let mRollScale: f64 = 1.0;

// ---- Pointer exports ------------------------------------------------------------------------------------------------
export function getCfgPtr(): usize { return CFG_PTR; }
export function getRegRasterPtr(): usize { return REG_RASTER_PTR; }
export function getRegOriginsPtr(): usize { return REG_ORIGINS_PTR; }
export function getRegPolyMetaPtr(): usize { return REG_POLY_META_PTR; }
export function getRegPolyPtsPtr(): usize { return REG_POLY_PTS_PTR; }
export function getRiverSegsPtr(): usize { return RIVER_SEGS_PTR; }
export function getRoadSegsPtr(): usize { return ROAD_SEGS_PTR; }
export function getEdgeSegsPtr(): usize { return EDGE_SEGS_PTR; }
export function getEdgeMetaPtr(): usize { return EDGE_META_PTR; }
export function getWaterBodiesPtr(): usize { return WATER_BODIES_PTR; }
export function getMacroSitesPtr(): usize { return MACRO_SITES_PTR; }
export function getTrailMetaPtr(): usize { return TRAIL_META_PTR; }
export function getTrailPtsPtr(): usize { return TRAIL_PTS_PTR; }
export function getMacroFeatPtr(): usize { return MACRO_FEAT_PTR; }
export function getMacroPtsPtr(): usize { return MACRO_PTS_PTR; }
export function getLfParamsPtr(): usize { return LF_PARAMS_PTR; }
export function getLfRegMetaPtr(): usize { return LF_REG_META_PTR; }
export function getLfFeatPtr(): usize { return LF_FEAT_PTR; }
export function getLfPtsPtr(): usize { return LF_PTS_PTR; }
export function getStampsPtr(): usize { return STAMPS_PTR; }
export function getFlatSegsPtr(): usize { return FLAT_SEGS_PTR; }
export function getFlatSitesPtr(): usize { return FLAT_SITES_PTR; }
export function getBridgesPtr(): usize { return BRIDGES_PTR; }

export function getCullLimPtr(): usize { return CULL_LIM_PTR; }
export function getCullXPtr(): usize { return CULL_X_PTR; }
export function getCullZPtr(): usize { return CULL_Z_PTR; }
export function getCullRPtr(): usize { return CULL_R_PTR; }
export function getCullClsPtr(): usize { return CULL_CLS_PTR; }
export function getCullStatePtr(): usize { return CULL_STATE_PTR; }
export function getCullActivePtr(): usize { return CULL_ACTIVE_PTR; }
export function getCullOutPtr(): usize { return CULL_OUT_PTR; }

export function getFieldRiverPtr(): usize { return FIELD_RIVER_PTR; }
export function getFieldWaterPtr(): usize { return FIELD_WATER_PTR; }
export function getFieldBorderPtr(): usize { return FIELD_BORDER_PTR; }
export function getFieldRoadPtr(): usize { return FIELD_ROAD_PTR; }
export function getHeightGridPtr(): usize { return HEIGHT_GRID_PTR; }
export function getPaintOutPtr(): usize { return SCRATCH_A_PTR; }
export function getChunkPosPtr(): usize { return CHUNK_POS_PTR; }
export function getChunkNrmPtr(): usize { return CHUNK_NRM_PTR; }

export function setStaticCounts(
  rCount: i32, rRasterN: i32,
  rvSegs: i32, rdSegs: i32, wBodies: i32,
  mSites: i32, trCount: i32, mFeats: i32
): void {
  regionCount = rCount;
  rasterN = rRasterN;
  riverSegCount = rvSegs;
  roadSegCount = rdSegs;
  waterBodyCount = wBodies;
  macroSiteCount = mSites;
  trailCount = trCount;
  macroFeatCount = mFeats;
  fieldsBuilt = 0;

  worldHalf        = load<f64>(CFG_PTR);
  cityHalf         = load<f64>(CFG_PTR + 8);
  regionCell       = load<f64>(CFG_PTR + 16);
  fieldStep        = load<f64>(CFG_PTR + 24);
  fieldN           = <i32>load<f64>(CFG_PTR + 32);
  gridStep         = load<f64>(CFG_PTR + 40);
  gridN            = <i32>load<f64>(CFG_PTR + 48);
  tiltPerM         = load<f64>(CFG_PTR + 56);
  tiltFlatHalf     = load<f64>(CFG_PTR + 64);
  reliefBorderFade = load<f64>(CFG_PTR + 72);
  riverClear       = load<f64>(CFG_PTR + 80);
  riverFade        = load<f64>(CFG_PTR + 88);
  siteMargin       = load<f64>(CFG_PTR + 96);
  siteFade         = load<f64>(CFG_PTR + 104);
  rockSlope        = load<f64>(CFG_PTR + 112);
  mudReach         = load<f64>(CFG_PTR + 120);

  mRoadClear       = load<f64>(CFG_PTR + 128);
  mRoadFade        = load<f64>(CFG_PTR + 136);
  mTrailClear      = load<f64>(CFG_PTR + 144);
  mTrailFade       = load<f64>(CFG_PTR + 152);
  mWaterClear      = load<f64>(CFG_PTR + 160);
  mWaterFade       = load<f64>(CFG_PTR + 168);
  mSiteClear       = load<f64>(CFG_PTR + 176);
  mSiteFade        = load<f64>(CFG_PTR + 184);
  mCityClear       = load<f64>(CFG_PTR + 192);
  mCityFade        = load<f64>(CFG_PTR + 200);
  mRimHeight       = load<f64>(CFG_PTR + 208);
  mRimWidth        = load<f64>(CFG_PTR + 216);
  mRoll            = load<f64>(CFG_PTR + 224);
  mRollScale       = load<f64>(CFG_PTR + 232);
}

export function setBuildLayers(sCount: i32, fSegs: i32, fSites: i32): void {
  stampCount = sCount;
  flatSegCount = fSegs;
  flatSiteCount = fSites;
}

export function setBridgeCount(bCount: i32): void {
  bridgeCount = bCount;
}

// ---- Exact math & noise helpers (bit-identical to src/landforms/noise.ts) -------------------------------------------
@inline function clamp(v: f64, lo: f64, hi: f64): f64 {
  return v < lo ? lo : v > hi ? hi : v;
}

@inline function smoothstep(a: f64, b: f64, x: f64): f64 {
  const t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

@inline function hypot2(dx: f64, dz: f64): f64 {
  return Math.sqrt(dx * dx + dz * dz);
}

@inline function distToSeg(px: f64, pz: f64, ax: f64, az: f64, bx: f64, bz: f64): f64 {
  const vx = bx - ax;
  const vz = bz - az;
  const len2 = vx * vx + vz * vz;
  const t = len2 > 0.0 ? clamp(((px - ax) * vx + (pz - az) * vz) / len2, 0.0, 1.0) : 0.0;
  return hypot2(px - (ax + vx * t), pz - (az + vz * t));
}

@inline function hash(ix: i32, iz: i32, seed: i32): f64 {
  let h: u32 = (<u32>ix * 0x27d4eb2d) ^ (<u32>iz * 0x165667b1) ^ (<u32>seed * 0x9e3779b9);
  h = (h ^ (h >>> 15)) * 0x85ebca6b;
  h = (h ^ (h >>> 13)) * 0xc2b2ae35;
  h ^= h >>> 16;
  return <f64>h / 4294967296.0;
}

@inline function fade(t: f64): f64 {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

export function valueNoise(x: f64, z: f64, seed: i32): f64 {
  const flx = Math.floor(x);
  const flz = Math.floor(z);
  const ix = <i32>flx;
  const iz = <i32>flz;
  const fx = fade(x - flx);
  const fz = fade(z - flz);
  const a = hash(ix, iz, seed);
  const b = hash(ix + 1, iz, seed);
  const c = hash(ix, iz + 1, seed);
  const d = hash(ix + 1, iz + 1, seed);
  const top = a + (b - a) * fx;
  const bot = c + (d - c) * fx;
  return (top + (bot - top) * fz) * 2.0 - 1.0;
}

export function fbm(x: f64, z: f64, seed: i32, octaves: i32, gain: f64, lacunarity: f64): f64 {
  let sum = 0.0;
  let amp = 1.0;
  let norm = 0.0;
  let f = 1.0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * f, z * f, seed + o * 101);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}

@inline function fbmStd(x: f64, z: f64, seed: i32, octaves: i32): f64 {
  return fbm(x, z, seed, octaves, 0.5, 2.0);
}

export function ridged(x: f64, z: f64, seed: i32, octaves: i32): f64 {
  let sum = 0.0;
  let amp = 1.0;
  let norm = 0.0;
  let f = 1.0;
  for (let o = 0; o < octaves; o++) {
    const n = 1.0 - Math.abs(valueNoise(x * f, z * f, seed + o * 131));
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    f *= 2.0;
  }
  return sum / norm;
}

function distToPts(ptsBase: usize, startPt: i32, ptCount: i32, x: f64, z: f64): f64 {
  if (ptCount <= 0) return Infinity;
  if (ptCount == 1) {
    const p = ptsBase + (<usize>startPt << 4);
    return hypot2(x - load<f64>(p), z - load<f64>(p + 8));
  }
  let best = Infinity;
  for (let i = 0; i + 1 < ptCount; i++) {
    const p = ptsBase + (<usize>(startPt + i) << 4);
    const d = distToSeg(x, z, load<f64>(p), load<f64>(p + 8), load<f64>(p + 16), load<f64>(p + 24));
    if (d < best) best = d;
  }
  return best;
}

// Writes (d, s, len) into scratch globals to avoid heap allocations.
let polyNearestD: f64 = 0.0;
let polyNearestS: f64 = 0.0;
let polyNearestLen: f64 = 0.0;

function nearestOnPts(ptsBase: usize, startPt: i32, ptCount: i32, x: f64, z: f64): void {
  let best = Infinity;
  let bestS = 0.0;
  let acc = 0.0;
  for (let i = 0; i + 1 < ptCount; i++) {
    const p = ptsBase + (<usize>(startPt + i) << 4);
    const ax = load<f64>(p), az = load<f64>(p + 8);
    const bx = load<f64>(p + 16), bz = load<f64>(p + 24);
    const vx = bx - ax, vz = bz - az;
    const l2 = vx * vx + vz * vz;
    const l = Math.sqrt(l2);
    const t = l2 > 0.0 ? clamp(((x - ax) * vx + (z - az) * vz) / l2, 0.0, 1.0) : 0.0;
    const d = hypot2(x - (ax + vx * t), z - (az + vz * t));
    if (d < best) {
      best = d;
      bestS = acc + t * l;
    }
    acc += l;
  }
  if (ptCount == 1) {
    const p = ptsBase + (<usize>startPt << 4);
    best = hypot2(x - load<f64>(p), z - load<f64>(p + 8));
  }
  polyNearestD = best;
  polyNearestS = bestS;
  polyNearestLen = acc;
}

// ---- Exact regionAt (raster fast path + polygon fallback matching src/levels.ts) ------------------------------------
const EDGE_EPS: f64 = 1e-9;

@inline function onSegment(px: f64, pz: f64, ax: f64, az: f64, bx: f64, bz: f64): bool {
  const vx = bx - ax, vz = bz - az;
  const cross = vx * (pz - az) - vz * (px - ax);
  const scale = hypot2(vx, vz);
  if (Math.abs(cross) > EDGE_EPS * (scale > 1.0 ? scale : 1.0)) return false;
  const minX = ax < bx ? ax : bx, maxX = ax > bx ? ax : bx;
  const minZ = az < bz ? az : bz, maxZ = az > bz ? az : bz;
  return px >= minX - EDGE_EPS && px <= maxX + EDGE_EPS && pz >= minZ - EDGE_EPS && pz <= maxZ + EDGE_EPS;
}

function inRegionPoly(regIdx: i32, x: f64, z: f64): bool {
  const mp = REG_POLY_META_PTR + (<usize>regIdx << 3);
  const start = load<i32>(mp);
  const count = load<i32>(mp + 4);
  let inside = false;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const pa = REG_POLY_PTS_PTR + (<usize>(start + j) << 4);
    const pb = REG_POLY_PTS_PTR + (<usize>(start + i) << 4);
    const ax = load<f64>(pa), az = load<f64>(pa + 8);
    const bx = load<f64>(pb), bz = load<f64>(pb + 8);
    if (onSegment(x, z, ax, az, bx, bz)) return true;
    if ((az > z) != (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) {
      inside = !inside;
    }
  }
  return inside;
}

function regionAtExactIdx(x: f64, z: f64): i32 {
  for (let r = 0; r < regionCount; r++) {
    if (inRegionPoly(r, x, z)) return r;
  }
  let best = 0;
  let bestD = Infinity;
  for (let r = 0; r < regionCount; r++) {
    const op = REG_ORIGINS_PTR + (<usize>r << 4);
    const dx = load<f64>(op) - x;
    const dz = load<f64>(op + 8) - z;
    const d = dx * dx + dz * dz;
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}

export function regionAtIdx(x: f64, z: f64): i32 {
  const i = <i32>Math.floor((x + worldHalf) / regionCell);
  const j = <i32>Math.floor((z + worldHalf) / regionCell);
  if (i < 0 || j < 0 || i >= rasterN || j >= rasterN) return regionAtExactIdx(x, z);
  const k = <i32>load<i8>(REG_RASTER_PTR + <usize>(j * rasterN + i));
  return k >= 0 ? k : regionAtExactIdx(x, z);
}

// ---- 1. Distance fields (451x451: river, water, border, road) -------------------------------------------------------
let lastHintIdx: i32 = -1;

function nearestPackedSeg(segsBase: usize, segStart: i32, segCount: i32, x: f64, z: f64, hint: i32): f64 {
  let best = Infinity;
  let bestHint = hint;
  if (hint >= 0 && hint < segCount) {
    const hp = segsBase + <usize>((segStart + hint) * 72);
    best = distToSeg(x, z, load<f64>(hp), load<f64>(hp + 8), load<f64>(hp + 16), load<f64>(hp + 24)) - load<f64>(hp + 32);
  }
  for (let k = 0; k < segCount; k++) {
    if (k == hint) continue;
    const sp = segsBase + <usize>((segStart + k) * 72);
    const off = load<f64>(sp + 32);
    const t = best + off;
    if (t < 0.0) continue;
    const minX = load<f64>(sp + 40), maxX = load<f64>(sp + 48);
    const minZ = load<f64>(sp + 56), maxZ = load<f64>(sp + 64);
    const dx = minX - x > 0.0 ? minX - x : (x - maxX > 0.0 ? x - maxX : 0.0);
    const dz = minZ - z > 0.0 ? minZ - z : (z - maxZ > 0.0 ? z - maxZ : 0.0);
    if (dx * dx + dz * dz >= t * t) continue;
    const d = distToSeg(x, z, load<f64>(sp), load<f64>(sp + 8), load<f64>(sp + 16), load<f64>(sp + 24)) - off;
    if (d < best) {
      best = d;
      bestHint = k;
    }
  }
  lastHintIdx = bestHint;
  return best;
}

export function buildDistanceFields(): void {
  if (fieldsBuilt != 0) return;
  const MN = fieldN;
  const MC = fieldStep;
  const W = worldHalf;

  let riverHint = -1;
  let roadHint = -1;
  let edgeHint = -1;
  let edgeReg = -1;

  for (let j = 0; j < MN; j++) {
    const z = -W + <f64>j * MC;
    for (let i = 0; i < MN; i++) {
      const x = -W + <f64>i * MC;
      let r = nearestPackedSeg(RIVER_SEGS_PTR, 0, riverSegCount, x, z, riverHint);
      riverHint = lastHintIdx;
      if (r < 0.0) r = 0.0;

      let w = r;
      for (let b = 0; b < waterBodyCount; b++) {
        const bp = WATER_BODIES_PTR + (<usize>b << 5);
        const bMinX = load<f64>(bp), bMaxX = load<f64>(bp + 8);
        const bMinZ = load<f64>(bp + 16), bMaxZ = load<f64>(bp + 24);
        const dx = bMinX - x > 0.0 ? bMinX - x : (x - bMaxX > 0.0 ? x - bMaxX : 0.0);
        const dz = bMinZ - z > 0.0 ? bMinZ - z : (z - bMaxZ > 0.0 ? z - bMaxZ : 0.0);
        const bd = hypot2(dx, dz);
        if (bd < w) w = bd;
      }

      const reg = regionAtIdx(x, z);
      if (reg != edgeReg) {
        edgeReg = reg;
        edgeHint = -1;
      }
      const emp = EDGE_META_PTR + (<usize>reg << 3);
      const e = nearestPackedSeg(EDGE_SEGS_PTR, load<i32>(emp), load<i32>(emp + 4), x, z, edgeHint);
      edgeHint = lastHintIdx;

      const rd = nearestPackedSeg(ROAD_SEGS_PTR, 0, roadSegCount, x, z, roadHint);
      roadHint = lastHintIdx;

      const off = <usize>((j * MN + i) << 2);
      store<f32>(FIELD_ROAD_PTR + off, <f32>(rd < 1e4 ? rd : 1e4));
      store<f32>(FIELD_RIVER_PTR + off, <f32>(r < 1e4 ? r : 1e4));
      store<f32>(FIELD_WATER_PTR + off, <f32>(w < 1e4 ? w : 1e4));
      store<f32>(FIELD_BORDER_PTR + off, <f32>(e < 1e4 ? e : 1e4));
    }
  }
  fieldsBuilt = 1;
}

@inline function sampleField(fieldBase: usize, x: f64, z: f64): f64 {
  if (fieldsBuilt == 0) buildDistanceFields();
  const MN = fieldN;
  const maxU = <f64>(MN - 1);
  const u = clamp((x + worldHalf) / fieldStep, 0.0, maxU);
  const v = clamp((z + worldHalf) / fieldStep, 0.0, maxU);
  let i = <i32>Math.floor(u);
  let j = <i32>Math.floor(v);
  if (i > MN - 2) i = MN - 2;
  if (j > MN - 2) j = MN - 2;
  const fx = u - <f64>i;
  const fz = v - <f64>j;
  const row0 = j * MN + i;
  const row1 = row0 + MN;
  const a = <f64>load<f32>(fieldBase + (<usize>row0 << 2));
  const b = <f64>load<f32>(fieldBase + (<usize>(row0 + 1) << 2));
  const c = <f64>load<f32>(fieldBase + (<usize>row1 << 2));
  const d = <f64>load<f32>(fieldBase + (<usize>(row1 + 1) << 2));
  return (a + (b - a) * fx) * (1.0 - fz) + (c + (d - c) * fx) * fz;
}

@inline function riverDistAt(x: f64, z: f64): f64 { return sampleField(FIELD_RIVER_PTR, x, z); }
@inline function waterDistAt(x: f64, z: f64): f64 { return sampleField(FIELD_WATER_PTR, x, z); }
@inline function borderDistAt(x: f64, z: f64): f64 { return sampleField(FIELD_BORDER_PTR, x, z); }
@inline function roadDistAt(x: f64, z: f64): f64 { return sampleField(FIELD_ROAD_PTR, x, z); }

// ---- 2. Tilt, region landforms, macro landscape & naturalHeightAt ---------------------------------------------------
@inline function tiltAt(z: f64): f64 {
  const F = tiltFlatHalf;
  if (z >= -F && z <= F) return 0.0;
  return -tiltPerM * (z < 0.0 ? z + F : z - F);
}

@inline function reliefMaskAt(x: f64, z: f64): f64 {
  const b = smoothstep(0.0, reliefBorderFade, borderDistAt(x, z));
  if (b <= 0.0) return 0.0;
  return b * smoothstep(riverClear, riverClear + riverFade, riverDistAt(x, z));
}

function evalRegionRelief(reg: i32, x: f64, z: f64): f64 {
  const pp = LF_PARAMS_PTR + (<usize>reg << 7); // 16 * f64 = 128 B per region
  const rmp = LF_REG_META_PTR + (<usize>reg << 3);
  const fStart = load<i32>(rmp);
  const fCount = load<i32>(rmp + 4);

  if (reg == 1) {
    // dust-flats
    const swellAmp = load<f64>(pp);
    const swellScale = load<f64>(pp + 8);
    const duneHeight = load<f64>(pp + 16);
    const duneSpacing = load<f64>(pp + 24);
    const duneLength = load<f64>(pp + 32);
    const cosA = load<f64>(pp + 40);
    const sinA = load<f64>(pp + 48);

    let calm = 1.0;
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 1) continue;
      const r = load<f64>(fp + 8);
      if (r == 0.0) continue;
      const p0 = LF_PTS_PTR + (<usize>(<i32>load<f64>(fp + 24)) << 4);
      calm *= smoothstep(r, r + 40.0, hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8)));
    }
    const swell = swellAmp * fbmStd(x / swellScale, z / swellScale, 11, 2);
    const u = x * cosA + z * sinA;
    const v = -x * sinA + z * cosA;
    const field = smoothstep(-0.1, 0.3, valueNoise(x / 420.0, z / 420.0, 5));
    const roadCalm = 0.3 + 0.7 * smoothstep(15.0, 70.0, roadDistAt(x, z));
    const dunes = duneHeight * ridged(u / duneLength, v / duneSpacing, 7, 2) * field * roadCalm;
    let h = (swell + dunes) * calm;

    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      const kind = <i32>load<f64>(fp);
      const r = load<f64>(fp + 8);
      const fh = load<f64>(fp + 16);
      if (r == 0.0 || fh == 0.0) continue;
      const ptStart = <i32>load<f64>(fp + 24);
      const ptCount = <i32>load<f64>(fp + 32);
      if (kind == 2) {
        const p0 = LF_PTS_PTR + (<usize>ptStart << 4);
        const d = hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8));
        h += fh * (1.0 - smoothstep(r, r + fh * 1.2, d));
      } else if (kind == 3) {
        const d = distToPts(LF_PTS_PTR, ptStart, ptCount, x, z);
        h -= fh * (1.0 - smoothstep(r * 0.35, r, d));
      }
    }
    return h;
  }

  if (reg == 2) {
    // mossy-wood
    const floor = load<f64>(pp);
    const floorScale = load<f64>(pp + 8);
    const bank = load<f64>(pp + 16);
    const bankReach = load<f64>(pp + 24);
    const bankFall = load<f64>(pp + 32);
    let calm = 1.0;
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 1) continue;
      const r = load<f64>(fp + 8);
      const p0 = LF_PTS_PTR + (<usize>(<i32>load<f64>(fp + 24)) << 4);
      calm *= smoothstep(r, r + 40.0, hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8)));
    }
    const rolling = floor * fbmStd(x / floorScale, z / floorScale, 21, 3);
    const banks = bank * (1.0 - smoothstep(bankReach, bankReach + bankFall, riverDistAt(x, z)))
      * smoothstep(20.0, 120.0, roadDistAt(x, z));
    return calm * (rolling + banks);
  }

  if (reg == 3) {
    // frostbite-fells
    const base = load<f64>(pp);
    const baseScale = load<f64>(pp + 8);
    const ridgeHeight = load<f64>(pp + 16);
    const ridgeScale = load<f64>(pp + 24);
    let calm = 1.0;
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 1) continue;
      const r = load<f64>(fp + 8);
      if (isNaN(r)) continue;
      const p0 = LF_PTS_PTR + (<usize>(<i32>load<f64>(fp + 24)) << 4);
      calm *= smoothstep(r, r + 40.0, hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8)));
    }
    const roadCalm = smoothstep(30.0, 120.0, roadDistAt(x, z));
    const baseH = base * roadCalm * fbmStd(x / baseScale, z / baseScale, 31, 2);
    const northRamp = smoothstep(-450.0, -750.0, z);
    const ridgeH = ridgeHeight * ridged(x / ridgeScale, z / ridgeScale, 37, 2) * northRamp * roadCalm;
    let h = (baseH + ridgeH) * calm;

    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      const kind = <i32>load<f64>(fp);
      const r = load<f64>(fp + 8);
      if (isNaN(r)) continue;
      const fh = load<f64>(fp + 16);
      const ptStart = <i32>load<f64>(fp + 24);
      const ptCount = <i32>load<f64>(fp + 32);
      if (kind == 4 && !isNaN(fh)) {
        const p0 = LF_PTS_PTR + (<usize>ptStart << 4);
        const d = hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8));
        h += fh * (1.0 - smoothstep(r * 0.3, r, d));
      } else if (kind == 5 && !isNaN(fh)) {
        nearestOnPts(LF_PTS_PTR, ptStart, ptCount, x, z);
        h += fh * (1.0 - smoothstep(0.0, r, polyNearestD)) * (1.0 - 0.6 * (polyNearestLen > 0.0 ? polyNearestS / polyNearestLen : 0.0));
      } else if (kind == 6) {
        const p0 = LF_PTS_PTR + (<usize>ptStart << 4);
        const d = hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8));
        h += -1.2 * (1.0 - smoothstep(r * 0.6, r, d));
      }
    }
    return h;
  }

  if (reg == 4) {
    // cloverfield-farms
    const hills = load<f64>(pp);
    const hillScale = load<f64>(pp + 8);
    const seaDip = load<f64>(pp + 16);
    const step = load<f64>(pp + 24);
    let rolling = hills * fbmStd(x / hillScale, z / hillScale, 41, 3);
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 1) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount <= 0) continue;
      const r = load<f64>(fp + 8);
      const d = distToPts(LF_PTS_PTR, <i32>load<f64>(fp + 24), ptCount, x, z);
      rolling *= smoothstep(r, r + 40.0, d);
    }
    let h = rolling * (1.0 - 0.8 * smoothstep(560.0, 760.0, z));
    h -= seaDip * (1.0 - smoothstep(0.0, 160.0, waterDistAt(x, z))) * smoothstep(600.0, 740.0, z);
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 7) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount <= 0) continue;
      const r = load<f64>(fp + 8);
      const top = load<f64>(fp + 16);
      const d = distToPts(LF_PTS_PTR, <i32>load<f64>(fp + 24), ptCount, x, z);
      const f1 = 1.0 - smoothstep(0.0, r, d);
      const level = top * f1;
      const q = level / step;
      const whole = Math.floor(q);
      h += step * (whole + smoothstep(0.7, 1.0, q - whole));
    }
    return h;
  }

  if (reg == 5) {
    // loch-moss
    const cx = load<f64>(pp);
    const cz = load<f64>(pp + 8);
    const wallAmp = load<f64>(pp + 16);
    const wallStart = load<f64>(pp + 24);
    const wallWidth = load<f64>(pp + 32);
    const moorAmp = load<f64>(pp + 40);
    const moorScale = load<f64>(pp + 48);

    const dx = x - cx, dz = z - cz;
    const open = (dx + dz) / (hypot2(dx, dz) * 1.4142135623730951 + 1e-6);
    const side = 1.0 - smoothstep(-0.1, 0.5, open);
    const wDist = waterDistAt(x, z);
    const wall = wallAmp * smoothstep(wallStart, wallStart + wallWidth, wDist) * side;
    const moor = moorAmp * (fbmStd(x / moorScale, z / moorScale, 61, 3) * 0.5 + 0.5)
      * smoothstep(20.0, 80.0, wDist) * smoothstep(15.0, 60.0, roadDistAt(x, z));
    let island = 0.0;
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 9) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount <= 0) continue;
      const r = load<f64>(fp + 8);
      const fh = load<f64>(fp + 16);
      const p0 = LF_PTS_PTR + (<usize>(<i32>load<f64>(fp + 24)) << 4);
      const d = hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8));
      const v = fh * (1.0 - smoothstep(r * 0.4, r, d));
      if (v > island) island = v;
    }
    return wall + moor + island;
  }

  if (reg == 6) {
    // tallgrass-commons
    const swellAmp = load<f64>(pp);
    const swellScale = load<f64>(pp + 8);
    const moundsAmp = load<f64>(pp + 16);
    const moundScale = load<f64>(pp + 24);
    const swell = swellAmp * fbmStd(x / swellScale, z / swellScale, 51, 2);
    const mVal = fbmStd(x / moundScale, z / moundScale, 53, 2);
    const mounds = moundsAmp * (mVal > 0.0 ? mVal : 0.0) * smoothstep(10.0, 50.0, roadDistAt(x, z));
    let hill = 0.0;
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 10) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount <= 0) continue;
      const r = load<f64>(fp + 8);
      const fh = load<f64>(fp + 16);
      const p0 = LF_PTS_PTR + (<usize>(<i32>load<f64>(fp + 24)) << 4);
      const d = hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8));
      hill += fh * (1.0 - smoothstep(r * 0.25, r, d));
    }
    return swell + mounds + hill;
  }

  if (reg == 7) {
    // north-highlands: swell, crags, swellScale, cragScale
    const swellScale = load<f64>(pp + 8);
    const cragScale = load<f64>(pp + 24);
    const swell = load<f64>(pp) * fbmStd(x / swellScale, z / swellScale, 61, 3);
    const rg = ridged(x / cragScale, z / cragScale, 63, 2) - 0.4;
    const crags = load<f64>(pp + 16) * (0.0 > rg ? 0.0 : rg) * smoothstep(10.0, 50.0, roadDistAt(x, z));
    return swell + crags;
  }

  if (reg == 8) {
    // south-shore: dunes, duneScale, swell, swellScale
    const duneScale = load<f64>(pp + 8);
    const swellScale = load<f64>(pp + 24);
    const dunes = load<f64>(pp) * fbmStd(x / duneScale, z / duneScale, 71, 2);
    const swell = load<f64>(pp + 16) * fbmStd(x / swellScale, z / swellScale, 73, 2);
    return dunes + swell;
  }

  if (reg == 9) {
    // east-campus: swell, swellScale
    const s = load<f64>(pp + 8);
    return load<f64>(pp) * fbmStd(x / s, z / s, 81, 2);
  }

  if (reg == 10) {
    // west-estates: swell, swellScale
    const s = load<f64>(pp + 8);
    return load<f64>(pp) * fbmStd(x / s, z / s, 91, 3);
  }

  if (reg == 11) {
    // pardonlin: swell, swellScale
    const s = load<f64>(pp + 8);
    return load<f64>(pp) * fbmStd(x / s, z / s, 101, 2);
  }

  if (reg == 12) {
    // the-unmown: swell, swellScale, hummocks, hummockScale
    const swellScale = load<f64>(pp + 8);
    const hummockScale = load<f64>(pp + 24);
    const swell = load<f64>(pp) * fbmStd(x / swellScale, z / swellScale, 111, 3);
    const hummocks = load<f64>(pp + 16) * fbmStd(x / hummockScale, z / hummockScale, 113, 2);
    return swell + hummocks;
  }

  return 0.0;
}

function reliefAt(x: f64, z: f64): f64 {
  const reg = regionAtIdx(x, z);
  if (reg <= 0 || reg > 12) return 0.0;
  const m = reliefMaskAt(x, z);
  return m > 0.0 ? m * evalRegionRelief(reg, x, z) : 0.0;
}

function macroMaskAt(x: f64, z: f64): f64 {
  const ax = Math.abs(x), az = Math.abs(z);
  const cd = (ax > az ? ax : az) - cityHalf;
  let m = smoothstep(mCityClear, mCityClear + mCityFade, cd);
  if (m <= 0.0) return 0.0;
  m *= smoothstep(mRoadClear, mRoadClear + mRoadFade, roadDistAt(x, z));
  if (m <= 0.0) return 0.0;
  m *= smoothstep(mWaterClear, mWaterClear + mWaterFade, waterDistAt(x, z));
  if (m <= 0.0) return 0.0;

  const reach = mSiteClear + mSiteFade;
  for (let i = 0; i < macroSiteCount; i++) {
    const sp = MACRO_SITES_PTR + (<usize>i << 5);
    const minX = load<f64>(sp), maxX = load<f64>(sp + 8);
    const minZ = load<f64>(sp + 16), maxZ = load<f64>(sp + 24);
    const dx = minX - x > 0.0 ? minX - x : (x - maxX > 0.0 ? x - maxX : 0.0);
    if (dx >= reach) continue;
    const dz = minZ - z > 0.0 ? minZ - z : (z - maxZ > 0.0 ? z - maxZ : 0.0);
    if (dz >= reach) continue;
    m *= smoothstep(mSiteClear, reach, hypot2(dx, dz));
    if (m <= 0.0) return 0.0;
  }

  const treach = mTrailClear + mTrailFade;
  for (let i = 0; i < trailCount; i++) {
    const tp = TRAIL_META_PTR + (<usize>i << 6); // 8 * f64 = 64 B
    if (x < load<f64>(tp + 16) - treach || x > load<f64>(tp + 24) + treach ||
        z < load<f64>(tp + 32) - treach || z > load<f64>(tp + 40) + treach) continue;
    const d = distToPts(TRAIL_PTS_PTR, <i32>load<f64>(tp), <i32>load<f64>(tp + 8), x, z);
    if (d < treach) m *= smoothstep(mTrailClear, treach, d);
    if (m <= 0.0) return 0.0;
  }
  return m;
}

function macroFeatureHeight(fIdx: i32, x: f64, z: f64): f64 {
  const fp = MACRO_FEAT_PTR + <usize>(fIdx * 80); // 10 * f64 = 80 B
  const kind = <i32>load<f64>(fp); // 1 = hill, 2 = mountain, 3 = ridge
  const r = load<f64>(fp + 8);
  const h = load<f64>(fp + 16);
  const seed = <i32>load<f64>(fp + 24);
  const ptStart = <i32>load<f64>(fp + 32);
  const ptCount = <i32>load<f64>(fp + 40);

  if (kind == 1) {
    const p0 = MACRO_PTS_PTR + (<usize>ptStart << 4);
    const cx = load<f64>(p0), cz = load<f64>(p0 + 8);
    const wob = 1.0 + 0.2 * fbmStd((x - cx) / (r * 0.8), (z - cz) / (r * 0.8), seed, 2);
    const u = hypot2(x - cx, z - cz) / (r * wob);
    if (u >= 1.0) return 0.0;
    const s = 1.0 - u * u;
    return h * s * s;
  }
  if (kind == 2) {
    const p0 = MACRO_PTS_PTR + (<usize>ptStart << 4);
    const cx = load<f64>(p0), cz = load<f64>(p0 + 8);
    const wob = 1.0 + 0.25 * fbmStd((x - cx) / (r * 0.6), (z - cz) / (r * 0.6), seed, 3);
    const u = hypot2(x - cx, z - cz) / (r * wob);
    if (u >= 1.0) return 0.0;
    const base = Math.pow(1.0 - u, 1.7);
    const ribs = 0.75 + 0.25 * ridged(x / (r * 0.35), z / (r * 0.35), seed + 3, 2);
    return h * base * ribs * smoothstep(1.0, 0.85, u);
  }
  nearestOnPts(MACRO_PTS_PTR, ptStart, ptCount, x, z);
  const wob = 1.0 + 0.25 * fbmStd(x / 90.0, z / 90.0, seed, 2);
  const u = polyNearestD / (r * wob);
  if (u >= 1.0) return 0.0;
  const t = polyNearestLen > 0.0 ? polyNearestS / polyNearestLen : 0.5;
  const taper = smoothstep(0.0, 0.18, t) * smoothstep(1.0, 0.82, t);
  const crest = 0.8 + 0.2 * fbmStd(polyNearestS / 70.0, 0.0, seed + 7, 2);
  const oneMinus = 1.0 - u * u;
  return h * taper * crest * oneMinus * oneMinus;
}

function macroAt(x: f64, z: f64): f64 {
  // Check macroMaskAt FIRST: skips 6 octaves of fbm + feature loops across all of Turfton, highways, rivers and sites!
  const m = macroMaskAt(x, z);
  if (m <= 0.0) return 0.0;

  let top = 0.0;
  for (let i = 0; i < macroFeatCount; i++) {
    const fp = MACRO_FEAT_PTR + <usize>(i * 80);
    if (x < load<f64>(fp + 48) || x > load<f64>(fp + 56) || z < load<f64>(fp + 64) || z > load<f64>(fp + 72)) continue;
    const fh = macroFeatureHeight(i, x, z);
    if (fh > top) top = fh;
  }

  const ax = Math.abs(x), az = Math.abs(z);
  const edge = worldHalf - (ax > az ? ax : az);
  let bg = 0.0;
  if (edge < mRimWidth) {
    const w = 0.6 + 0.4 * fbmStd(x / 130.0, z / 130.0, 911, 3);
    bg += mRimHeight * w * smoothstep(mRimWidth, 0.0, edge);
  }
  if (mRoll > 0.0) bg += mRoll * fbmStd(x / mRollScale, z / mRollScale, 733, 3);

  const h = bg + top;
  return h == 0.0 ? 0.0 : h * m;
}

export function naturalHeightAtWasm(x: f64, z: f64, amplitude: f64, useLandforms: i32): f64 {
  if (amplitude == 0.0 || (useLandforms == 0 && stampCount == 0)) return 0.0;
  let h = 0.0;
  if (useLandforms != 0) {
    h = tiltAt(z) + reliefAt(x, z) + macroAt(x, z);
  }
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
      h += load<f64>(sp + 32) * Math.exp(-d2 / (sigma * sigma));
    }
  }
  return amplitude * h;
}

@inline function clampGridIdx(v: i32, n: i32): i32 {
  return v < 0 ? 0 : v >= n ? n - 1 : v;
}

function rectFlattenGrid(minX: f64, maxX: f64, minZ: f64, maxZ: f64, margin: f64, fadeW: f64, to: f64): void {
  const N = gridN;
  const S = gridStep;
  const H = worldHalf;
  const reach = margin + fadeW;
  const i0 = clampGridIdx(<i32>Math.floor((minX - reach + H) / S), N);
  const i1 = clampGridIdx(<i32>Math.ceil((maxX + reach + H) / S), N);
  const j0 = clampGridIdx(<i32>Math.floor((minZ - reach + H) / S), N);
  const j1 = clampGridIdx(<i32>Math.ceil((maxZ + reach + H) / S), N);
  for (let j = j0; j <= j1; j++) {
    const z = -H + <f64>j * S;
    const dz = minZ - z > 0.0 ? minZ - z : (z - maxZ > 0.0 ? z - maxZ : 0.0);
    for (let i = i0; i <= i1; i++) {
      const x = -H + <f64>i * S;
      const dx = minX - x > 0.0 ? minX - x : (x - maxX > 0.0 ? x - maxX : 0.0);
      const d = hypot2(dx, dz);
      if (d >= reach) continue;
      const keep = smoothstep(margin, reach, d);
      const gp = HEIGHT_GRID_PTR + (<usize>(j * N + i) << 2);
      const cur = <f64>load<f32>(gp);
      store<f32>(gp, <f32>(to + (cur - to) * keep));
    }
  }
}

export function buildBaseHeightGrid(amplitude: f64, useLandforms: i32): i32 {
  if (useLandforms != 0 && fieldsBuilt == 0) buildDistanceFields();
  const N = gridN;
  const S = gridStep;
  const H = worldHalf;
  const total = N * N;

  for (let j = 0; j < N; j++) {
    const z = -H + <f64>j * S;
    const row = j * N;
    for (let i = 0; i < N; i++) {
      store<f32>(HEIGHT_GRID_PTR + (<usize>(row + i) << 2), <f32>naturalHeightAtWasm(-H + <f64>i * S, z, amplitude, useLandforms));
    }
  }

  memory.fill(SCRATCH_A_PTR, 0, <usize>(total << 2));
  memory.fill(SCRATCH_B_PTR, 0, <usize>(total << 2));

  for (let s = 0; s < flatSegCount; s++) {
    const sp = FLAT_SEGS_PTR + <usize>(s * 48);
    const ax = load<f64>(sp), az = load<f64>(sp + 8);
    const bx = load<f64>(sp + 16), bz = load<f64>(sp + 24);
    const inner = load<f64>(sp + 32), outer = load<f64>(sp + 40);
    const vx = bx - ax, vz = bz - az;
    const len2raw = vx * vx + vz * vz;
    const len2 = len2raw > 0.0 ? len2raw : 1e-9;
    const minX = ax < bx ? ax : bx, maxX = ax > bx ? ax : bx;
    const minZ = az < bz ? az : bz, maxZ = az > bz ? az : bz;
    const i0 = clampGridIdx(<i32>Math.floor((minX - outer + H) / S), N);
    const i1 = clampGridIdx(<i32>Math.ceil((maxX + outer + H) / S), N);
    const j0 = clampGridIdx(<i32>Math.floor((minZ - outer + H) / S), N);
    const j1 = clampGridIdx(<i32>Math.ceil((maxZ + outer + H) / S), N);

    for (let j = j0; j <= j1; j++) {
      const z = -H + <f64>j * S;
      const row = j * N;
      for (let i = i0; i <= i1; i++) {
        const x = -H + <f64>i * S;
        const t = clamp(((x - ax) * vx + (z - az) * vz) / len2, 0.0, 1.0);
        const cx = ax + vx * t, cz = az + vz * t;
        const d = hypot2(x - cx, z - cz);
        if (d >= outer) continue;
        const w = <f32>(1.0 - smoothstep(inner, outer, d));
        const off = <usize>((row + i) << 2);
        if (w <= load<f32>(SCRATCH_A_PTR + off)) continue;
        store<f32>(SCRATCH_A_PTR + off, w);
        store<f32>(SCRATCH_B_PTR + off, <f32>naturalHeightAtWasm(cx, cz, amplitude, useLandforms));
      }
    }
  }

  for (let idx = 0; idx < total; idx++) {
    const off = <usize>(idx << 2);
    const w = load<f32>(SCRATCH_A_PTR + off);
    if (w > 0.0) {
      const tgt = load<f32>(SCRATCH_B_PTR + off);
      const cur = load<f32>(HEIGHT_GRID_PTR + off);
      store<f32>(HEIGHT_GRID_PTR + off, tgt + (cur - tgt) * (1.0 - w));
    }
  }

  for (let k = 0; k < flatSiteCount; k++) {
    const sp = FLAT_SITES_PTR + <usize>(k * 48);
    const minX = load<f64>(sp), maxX = load<f64>(sp + 8);
    const minZ = load<f64>(sp + 16), maxZ = load<f64>(sp + 24);
    const to = load<f64>(sp + 32) != 0.0
      ? load<f64>(sp + 40)
      : naturalHeightAtWasm((minX + maxX) * 0.5, (minZ + maxZ) * 0.5, amplitude, useLandforms);
    rectFlattenGrid(minX, maxX, minZ, maxZ, siteMargin, siteFade, to);
  }

  return total;
}

// ---- 3. Surface paint grid (900x900 u8, matching src/terrainPaint.ts) -----------------------------------------------
// Paint IDs (PAINT_KINDS index + 1):
// 1=rock, 2=dirt, 3=gravel, 4=mud, 5=ice, 6=snow, 7=sand, 8=grass, 9=farm, 10=forest, 11=moss, 12=meadow
function evalRegionPaint(reg: i32, x: f64, z: f64, slope: f64, height: f64, rDist: f64, wDist: f64): u8 {
  const pp = LF_PARAMS_PTR + (<usize>reg << 7);
  const rmp = LF_REG_META_PTR + (<usize>reg << 3);
  const fStart = load<i32>(rmp);
  const fCount = load<i32>(rmp + 4);

  if (reg == 1) {
    // dust-flats
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) == 3) {
        const r = load<f64>(fp + 8);
        if (r != 0.0 && distToPts(LF_PTS_PTR, <i32>load<f64>(fp + 24), <i32>load<f64>(fp + 32), x, z) < r * 0.35) {
          return 3; // gravel
        }
      }
    }
    return 0;
  }
  if (reg == 2) {
    // mossy-wood
    if (rDist < load<f64>(pp + 40)) return 4; // mud
    if (fbmStd(x / 90.0, z / 90.0, 5, 2) > 0.35) return 11; // moss
    return 10; // forest
  }
  if (reg == 3) {
    // frostbite-fells
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      const kind = <i32>load<f64>(fp);
      const r = load<f64>(fp + 8);
      if (isNaN(r)) continue;
      const ptStart = <i32>load<f64>(fp + 24);
      const ptCount = <i32>load<f64>(fp + 32);
      if (kind == 6) {
        const p0 = LF_PTS_PTR + (<usize>ptStart << 4);
        if (hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8)) < r) return 5; // ice
      } else if (kind == 5) {
        if (distToPts(LF_PTS_PTR, ptStart, ptCount, x, z) < 0.6 * r) return 5; // ice
      }
    }
    return 0;
  }
  if (reg == 4) {
    // cloverfield-farms
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 8) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount > 0 && distToPts(LF_PTS_PTR, <i32>load<f64>(fp + 24), ptCount, x, z) < load<f64>(fp + 8)) return 4; // mud
    }
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 7) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount > 0 && distToPts(LF_PTS_PTR, <i32>load<f64>(fp + 24), ptCount, x, z) < load<f64>(fp + 8)) return 9; // farm
    }
    if (wDist < 14.0 && z > 740.0) return 7; // sand
    return 0;
  }
  if (reg == 5) {
    // loch-moss
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 9) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount <= 0) continue;
      const p0 = LF_PTS_PTR + (<usize>(<i32>load<f64>(fp + 24)) << 4);
      if (hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8)) < load<f64>(fp + 8) * 0.4) return 11; // moss
    }
    if (wDist < load<f64>(pp + 56) && slope < 0.6) return 3; // gravel
    return 0;
  }
  if (reg == 6) {
    // tallgrass-commons
    for (let k = 0; k < fCount; k++) {
      const fp = LF_FEAT_PTR + <usize>((fStart + k) * 48);
      if (<i32>load<f64>(fp) != 10) continue;
      const ptCount = <i32>load<f64>(fp + 32);
      if (ptCount <= 0) continue;
      const p0 = LF_PTS_PTR + (<usize>(<i32>load<f64>(fp + 24)) << 4);
      if (hypot2(x - load<f64>(p0), z - load<f64>(p0 + 8)) < load<f64>(fp + 8) * 0.25) return 8; // grass
    }
    return 12; // meadow
  }
  if (reg == 7) {
    // north-highlands
    if (height > 32.0) return 6; // snow
    if (slope > 0.3) return 3; // gravel
    return 12; // meadow
  }
  if (reg == 8) return z > 1130.0 ? 7 : 8; // south-shore: sand beach, grass inland
  if (reg == 9) return 8; // east-campus: grass
  if (reg == 10) return fbmStd(x / 120.0, z / 120.0, 93, 2) > 0.25 ? 12 : 8; // west-estates
  if (reg == 11) return fbmStd(x / 90.0, z / 90.0, 103, 2) > 0.35 ? 12 : 8; // pardonlin
  if (reg == 12) {
    // the-unmown
    if (slope > 0.35) return 2; // dirt
    return fbmStd(x / 150.0, z / 150.0, 115, 2) > 0.45 ? 11 : 12; // moss : meadow
  }
  return 0;
}

export function buildPaintGrid(): i32 {
  if (fieldsBuilt == 0) buildDistanceFields();
  const N = gridN;
  const C = N - 1;
  const S = gridStep;
  const H = worldHalf;
  const total = C * C;
  memory.fill(SCRATCH_A_PTR, 0, <usize>total);

  // 1. Trails -> DIRT (2)
  for (let t = 0; t < trailCount; t++) {
    const tp = TRAIL_META_PTR + (<usize>t << 6);
    const ptStart = <i32>load<f64>(tp);
    const ptCount = <i32>load<f64>(tp + 8);
    const half = load<f64>(tp + 48);
    for (let k = 0; k + 1 < ptCount; k++) {
      const pp = TRAIL_PTS_PTR + (<usize>(ptStart + k) << 4);
      const ax = load<f64>(pp), az = load<f64>(pp + 8);
      const bx = load<f64>(pp + 16), bz = load<f64>(pp + 24);
      const minX = ax < bx ? ax : bx, maxX = ax > bx ? ax : bx;
      const minZ = az < bz ? az : bz, maxZ = az > bz ? az : bz;
      let i0 = <i32>Math.floor((minX - half + H) / S) - 1;
      let i1 = <i32>Math.ceil((maxX + half + H) / S);
      let j0 = <i32>Math.floor((minZ - half + H) / S) - 1;
      let j1 = <i32>Math.ceil((maxZ + half + H) / S);
      if (i0 < 0) i0 = 0;
      if (i1 > C - 1) i1 = C - 1;
      if (j0 < 0) j0 = 0;
      if (j1 > C - 1) j1 = C - 1;
      for (let j = j0; j <= j1; j++) {
        const z = -H + (<f64>j + 0.5) * S;
        const row = j * C;
        for (let i = i0; i <= i1; i++) {
          if (distToSeg(-H + (<f64>i + 0.5) * S, z, ax, az, bx, bz) <= half) {
            store<u8>(SCRATCH_A_PTR + <usize>(row + i), 2);
          }
        }
      }
    }
  }

  const twoS = 2.0 * S;
  for (let j = 0; j < C; j++) {
    const z = -H + (<f64>j + 0.5) * S;
    const cRow = j * C;
    const gRow0 = j * N;
    const gRow1 = gRow0 + N;
    for (let i = 0; i < C; i++) {
      const idx = cRow + i;
      if (load<u8>(SCRATCH_A_PTR + <usize>idx) != 0) continue;
      const x = -H + (<f64>i + 0.5) * S;
      const reg = regionAtIdx(x, z);
      if (reg == 0) continue; // turfton

      const h00 = <f64>load<f32>(HEIGHT_GRID_PTR + (<usize>(gRow0 + i) << 2));
      const h10 = <f64>load<f32>(HEIGHT_GRID_PTR + (<usize>(gRow0 + i + 1) << 2));
      const h01 = <f64>load<f32>(HEIGHT_GRID_PTR + (<usize>(gRow1 + i) << 2));
      const h11 = <f64>load<f32>(HEIGHT_GRID_PTR + (<usize>(gRow1 + i + 1) << 2));
      const dx = (h10 - h00 + h11 - h01) / twoS;
      const dz = (h01 - h00 + h11 - h10) / twoS;
      const slope = hypot2(dx, dz);
      if (slope >= rockSlope) {
        store<u8>(SCRATCH_A_PTR + <usize>idx, 1); // rock
        continue;
      }
      const rDist = riverDistAt(x, z);
      const wDist = waterDistAt(x, z);
      const own = evalRegionPaint(reg, x, z, slope, (h00 + h10 + h01 + h11) / 4.0, rDist, wDist);
      if (own != 0) store<u8>(SCRATCH_A_PTR + <usize>idx, own);
      else if (rDist < mudReach) store<u8>(SCRATCH_A_PTR + <usize>idx, 4); // mud
    }
  }
  return total;
}

// ---- 4. Chunk vertex positions & central-difference normals (matching src/terrainMesh.ts + bridgeDeckAt) ------------
@inline function vertexHeightWithBridge(gi: i32, gj: i32, x: f64, z: f64, checkBridges: bool): f64 {
  let h = <f64>load<f32>(HEIGHT_GRID_PTR + (<usize>(gj * gridN + gi) << 2));
  if (!checkBridges) return h;
  for (let b = 0; b < bridgeCount; b++) {
    const bp = BRIDGES_PTR + <usize>(b * 72);
    const dx = x - load<f64>(bp);
    const dz = z - load<f64>(bp + 8);
    const reach = load<f64>(bp + 56);
    if (Math.abs(dx) > reach && Math.abs(dz) > reach) continue;
    const sinY = load<f64>(bp + 16);
    const cosY = load<f64>(bp + 24);
    const along = dx * sinY + dz * cosY;
    const side = dx * cosY - dz * sinY;
    if (Math.abs(along) <= load<f64>(bp + 32) && Math.abs(side) <= load<f64>(bp + 40)) {
      const deck = load<f64>(bp + 48);
      if (deck > h) h = deck;
      break;
    }
  }
  return h;
}

export function buildChunkPosNormals(i0: i32, i1: i32, j0: i32, j1: i32): i32 {
  const N = gridN;
  const S = gridStep;
  const H = worldHalf;
  const twoS = 2.0 * S;
  const w = i1 - i0 + 1;

  // Check once if this chunk's neighbourhood overlaps any road bridge; 97% of chunks skip bridge checks completely.
  const minX = -H + <f64>(i0 - 1) * S;
  const maxX = -H + <f64>(i1 + 1) * S;
  const minZ = -H + <f64>(j0 - 1) * S;
  const maxZ = -H + <f64>(j1 + 1) * S;
  let nearBridge = false;
  for (let b = 0; b < bridgeCount; b++) {
    const bp = BRIDGES_PTR + <usize>(b * 72);
    const bx = load<f64>(bp), bz = load<f64>(bp + 8), r = load<f64>(bp + 56);
    if (bx + r >= minX && bx - r <= maxX && bz + r >= minZ && bz - r <= maxZ) {
      nearBridge = true;
      break;
    }
  }

  let outFloats = 0;
  for (let j = j0; j <= j1; j++) {
    const z = -H + <f64>j * S;
    const jm = j > 0 ? j - 1 : 0;
    const jp = j < N - 1 ? j + 1 : N - 1;
    const rowOff = (j - j0) * w;
    for (let i = i0; i <= i1; i++) {
      const x = -H + <f64>i * S;
      const im = i > 0 ? i - 1 : 0;
      const ip = i < N - 1 ? i + 1 : N - 1;
      const off = <usize>(((rowOff + (i - i0)) * 3) << 2);

      store<f32>(CHUNK_POS_PTR + off, <f32>x);
      store<f32>(CHUNK_POS_PTR + off + 4, load<f32>(HEIGHT_GRID_PTR + (<usize>(j * N + i) << 2)));
      store<f32>(CHUNK_POS_PTR + off + 8, <f32>z);

      const hxp = vertexHeightWithBridge(ip, j, x + S, z, nearBridge);
      const hxm = vertexHeightWithBridge(im, j, x - S, z, nearBridge);
      const hzp = vertexHeightWithBridge(i, jp, x, z + S, nearBridge);
      const hzm = vertexHeightWithBridge(i, jm, x, z - S, nearBridge);

      const dx = (hxp - hxm) / twoS;
      const dz = (hzp - hzm) / twoS;
      const invLen = 1.0 / Math.sqrt(dx * dx + 1.0 + dz * dz);
      store<f32>(CHUNK_NRM_PTR + off, <f32>(-dx * invLen));
      store<f32>(CHUNK_NRM_PTR + off + 4, <f32>invLen);
      store<f32>(CHUNK_NRM_PTR + off + 8, <f32>(-dz * invLen));
      outFloats += 3;
    }
  }
  return outFloats;
}

// ---- 5. Full-scene f32x4 SIMD culler returning sparse state-change deltas (cull.ts) ---------------------------------
export function updateCullWasm(maxSlot: i32, cx: f32, cz: f32, viewScale: f32, shadowScale: f32): i32 {
  const vCx = f32x4.splat(cx);
  const vCz = f32x4.splat(cz);
  const vZero = f32x4.splat(0.0);
  let outCount = 0;

  let i = 0;
  const simdEnd = maxSlot & ~3;
  for (; i < simdEnd; i += 4) {
    const fOff = <usize>(i << 2);
    const dx = f32x4.sub(v128.load(CULL_X_PTR + fOff), vCx);
    const dz = f32x4.sub(v128.load(CULL_Z_PTR + fOff), vCz);
    const dist = f32x4.max(vZero, f32x4.sub(f32x4.sqrt(f32x4.add(f32x4.mul(dx, dx), f32x4.mul(dz, dz))), v128.load(CULL_R_PTR + fOff)));

    for (let lane = 0; lane < 4; lane++) {
      const slot = i + lane;
      if (load<u8>(CULL_ACTIVE_PTR + <usize>slot) == 0) continue;
      let d: f32;
      if (lane == 0) d = f32x4.extract_lane(dist, 0);
      else if (lane == 1) d = f32x4.extract_lane(dist, 1);
      else if (lane == 2) d = f32x4.extract_lane(dist, 2);
      else d = f32x4.extract_lane(dist, 3);

      const cls = <usize>load<u8>(CULL_CLS_PTR + <usize>slot);
      const lp = CULL_LIM_PTR + (cls << 4);
      const show = d <= load<f32>(lp) * viewScale;
      const cast = show && d <= load<f32>(lp + 4) * shadowScale;
      const near = d <= load<f32>(lp + 8) * viewScale;
      const bits: u8 = (show ? 1 : 0) | (cast ? 2 : 0) | (near ? 4 : 0);
      const prev = load<u8>(CULL_STATE_PTR + <usize>slot);
      if (bits != prev) {
        store<u8>(CULL_STATE_PTR + <usize>slot, bits);
        store<u32>(CULL_OUT_PTR + (<usize>outCount << 2), (<u32>slot << 3) | <u32>bits);
        outCount++;
      }
    }
  }

  for (; i < maxSlot; i++) {
    if (load<u8>(CULL_ACTIVE_PTR + <usize>i) == 0) continue;
    const fOff = <usize>(i << 2);
    const dx = load<f32>(CULL_X_PTR + fOff) - cx;
    const dz = load<f32>(CULL_Z_PTR + fOff) - cz;
    let d = Mathf.sqrt(dx * dx + dz * dz) - load<f32>(CULL_R_PTR + fOff);
    if (d < 0.0) d = 0.0;

    const cls = <usize>load<u8>(CULL_CLS_PTR + <usize>i);
    const lp = CULL_LIM_PTR + (cls << 4);
    const show = d <= load<f32>(lp) * viewScale;
    const cast = show && d <= load<f32>(lp + 4) * shadowScale;
    const near = d <= load<f32>(lp + 8) * viewScale;
    const bits: u8 = (show ? 1 : 0) | (cast ? 2 : 0) | (near ? 4 : 0);
    const prev = load<u8>(CULL_STATE_PTR + <usize>i);
    if (bits != prev) {
      store<u8>(CULL_STATE_PTR + <usize>i, bits);
      store<u32>(CULL_OUT_PTR + (<usize>outCount << 2), (<u32>i << 3) | <u32>bits);
      outCount++;
    }
  }

  return outCount;
}
