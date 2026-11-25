// TypeScript host bridge for Gnomomia's AssemblyScript WebAssembly kernel (assembly/kernel.ts).
// Compiles asynchronously in browsers (initGnomomiaWasm) to avoid Chromium's 4 KB main-thread sync compile cap,
// and synchronously in Node/Workers so Vitest tests and headless esbuild sim scripts use Wasm with zero API changes.
import { base64ToBytes, type DeltaGrid, type PaintGrid, type Stamp, type WalkGrid } from '@lawn/level';
import { PAINT_SURFACES, TUNING, WORLD, type Deck, type ZoneDef } from '../config';
import type { Pass, RoadSeg } from '../terrainCore';
import { KERNEL_WASM_BASE64 } from './kernelBytes';

export interface WasmDeckRecord {
  deck: Deck;
  top: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  ramp: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    along: 'x' | 'z';
    start: number;
    dir: 1 | -1;
    len: number;
  };
}

export interface WasmCircle {
  x: number;
  z: number;
  r: number;
}

export interface TerrainWasmSource {
  readonly allZones: readonly ZoneDef[];
  readonly outdoorZones: readonly ZoneDef[];
  readonly indoorZones: readonly ZoneDef[];
  readonly interiorZones: readonly ZoneDef[];
  passes(): readonly Pass[];
  passOpen(p: Pass): boolean;
  roadSegments(): readonly RoadSeg[];
  cutRoadSegments(): readonly RoadSeg[];
  decks(): readonly WasmDeckRecord[];
  stamps(): readonly Stamp[];
  staticCircles(): readonly WasmCircle[];
  extraCircles(): readonly WasmCircle[];
  ensureFloraCircles(ci: number, cj: number): readonly WasmCircle[];
  walkGrid(): WalkGrid | null;
  deltas(): DeltaGrid;
  paint(): PaintGrid;
}

export interface ChunkMeshBuffers {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  minY: number;
  maxY: number;
}

interface KernelExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  getCfgPtr(): number;
  getChunkBoundsPtr(): number;
  getZonesPtr(): number;
  getOutdoorIdsPtr(): number;
  getIndoorIdsPtr(): number;
  getInteriorIdsPtr(): number;
  getSrgbLutPtr(): number;
  getPaintPalPtr(): number;
  getRegionsPtr(): number;
  getLakesPtr(): number;
  getPassesPtr(): number;
  getDecksPtr(): number;
  getDeltaDataPtr(): number;
  getPaintDataPtr(): number;
  getWalkBitsPtr(): number;
  getOutPathPtr(): number;
  getChunkPosPtr(): number;
  getChunkNrmPtr(): number;
  getChunkColPtr(): number;
  getMinimapPtr(): number;

  setWorldConfig(zCount: number, outCount: number, inCount: number, intCount: number, pCount: number, dCount: number): void;
  resetStaticLayers(): void;
  resetExtraColliders(): void;
  invalidateHeights(): void;
  setPassMask(maskLo: number, maskHi: number): void;
  addStamp(op: number, x: number, z: number, p1: number, p2: number, p3: number): void;
  addRoadSeg(ax: number, az: number, bx: number, bz: number, isCut: number): void;
  addStaticCollider(x: number, z: number, r: number): void;
  addExtraCollider(x: number, z: number, r: number): void;
  clearWalkTiles(installed: number): void;
  addWalkTileMeta(minX: number, minZ: number, cols: number, rows: number, byteOff: number): void;
  clearDeltaChunks(): void;
  addDeltaChunkMeta(ci: number, cj: number): number;
  clearPaintChunks(): void;
  addPaintChunkMeta(ci: number, cj: number): number;

  heightAt(x: number, z: number): number;
  isWithinRoad(x: number, z: number, maxDist: number): number;
  isBlocked(x: number, z: number): number;
  standY(x: number, z: number, fromY: number): number;
  groundColourAt(x: number, z: number): number;
  buildChunkBuffers(cx: number, cz: number, chunkSize: number, segments: number): number;
  buildMinimapPixels(x0: number, z0: number, chunkSize: number, pxCount: number, waterLevel: number): number;
  findPath3Wasm(
    fromX: number, fromY: number, fromZ: number,
    goalX: number, goalY: number, goalZ: number,
    maxExpand: number, stepMode: number, costMode: number, roadBias: number, minCost: number,
  ): number;
  findPath2Wasm(fromX: number, fromZ: number, toX: number, toZ: number, maxExpand: number, blockedMode: number): number;
}

interface KernelRuntime {
  ex: KernelExports;
  u8: Uint8Array;
  i16: Int16Array;
  i32: Int32Array;
  u32: Uint32Array;
  f32: Float32Array;
  f64: Float64Array;
}

let runtime: KernelRuntime | null = null;
let initPromise: Promise<void> | null = null;
let wasmDisabled = false;

// Active callbacks for custom test closures or lazy unbaked colliders
let activeEnsureStatic: (() => void) | null = null;
let activeEnsureFlora: ((ci: number, cj: number) => void) | null = null;
let activeCustomStep: ((x: number, z: number, fromY: number) => number | null) | null = null;
let activeCustomBlocked: ((x: number, z: number) => boolean) | null = null;
let activeCustomCost: ((x: number, z: number) => number) | null = null;
let wasmBusy = false;

function buildImports(): WebAssembly.Imports {
  return {
    env: {
      ensureStaticColliders(): void {
        activeEnsureStatic?.();
      },
      ensureFloraChunk(ci: number, cj: number): void {
        activeEnsureFlora?.(ci, cj);
      },
      customStep(x: number, z: number, fromY: number): number {
        const y = activeCustomStep ? activeCustomStep(x, z, fromY) : null;
        return y === null ? NaN : y;
      },
      customBlocked(x: number, z: number): number {
        return activeCustomBlocked && activeCustomBlocked(x, z) ? 1 : 0;
      },
      customCost(x: number, z: number): number {
        return activeCustomCost ? activeCustomCost(x, z) : 1;
      },
    },
  };
}

function setupRuntime(instance: WebAssembly.Instance): KernelRuntime {
  const ex = instance.exports as KernelExports;
  const buf = ex.memory.buffer;
  const rt: KernelRuntime = {
    ex,
    u8: new Uint8Array(buf),
    i16: new Int16Array(buf),
    i32: new Int32Array(buf),
    u32: new Uint32Array(buf),
    f32: new Float32Array(buf),
    f64: new Float64Array(buf),
  };

  // Populate Three.js SRGBToLinear lookup table for byte values 0..255.
  const lutBase = ex.getSrgbLutPtr() >>> 2;
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    rt.f32[lutBase + i] = c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
  }

  // Populate surface paint palette.
  const palBase = ex.getPaintPalPtr() >>> 2;
  rt.u32.fill(0xffffffff, palBase, palBase + 256);
  for (const s of PAINT_SURFACES) {
    if (s.id >= 0 && s.id < 256) rt.u32[palBase + s.id] = s.color >>> 0;
  }

  runtime = rt;
  return rt;
}

/** Pre-compiles and instantiates Gnomomia's Wasm kernel asynchronously (call at browser startup). */
export async function initGnomomiaWasm(): Promise<void> {
  if (runtime) return;
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('wasm') === '0') {
    wasmDisabled = true;
    return;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const bytes = base64ToBytes(KERNEL_WASM_BASE64);
      const { instance } = await WebAssembly.instantiate(bytes as BufferSource, buildImports());
      setupRuntime(instance);
    })();
  }
  await initPromise;
}

/** Returns the active Wasm runtime (instantiating synchronously in Node/Workers if needed). */
export function getKernelRuntime(): KernelRuntime | null {
  if (wasmDisabled) return null;
  if (runtime) return runtime;
  const isNode = typeof process !== 'undefined' && !!process.versions?.node;
  const isWorker = 'WorkerGlobalScope' in globalThis;
  if (isNode || isWorker) {
    const bytes = base64ToBytes(KERNEL_WASM_BASE64);
    const mod = new WebAssembly.Module(bytes as BufferSource);
    setupRuntime(new WebAssembly.Instance(mod, buildImports()));
    return runtime;
  }
  return null;
}

// ---- Per-Terrain synchronization & registration ---------------------------------------------------------------------
export const ROAD_COST_TAG = Symbol('gnomomiaRoadCost');
export interface TaggedRoadCost {
  (x: number, z: number): number;
  [ROAD_COST_TAG]?: number;
}

export interface TerrainWasmBridge {
  onInvalidate(): void;
  onWalkGridChange(): void;
  onDeltasChange(): void;
  onPaintChange(): void;
  onExtraCollider(x: number, z: number, r: number): void;
  buildChunkBuffers(cx: number, cz: number, chunkSize: number, segments: number): ChunkMeshBuffers | null;
  buildMinimapPixels(x0: number, z0: number, chunkSize: number, pxCount: number, waterLevel: number): Uint32Array | null;
  syncAndPrepare(rt: KernelRuntime): void;
}

const byStepFn = new WeakMap<object, TerrainWasmBridge>();
const byBlockedFn = new WeakMap<object, TerrainWasmBridge>();
let activeBridge: TerrainWasmBridge | null = null;

export function registerTerrainWasm(
  src: TerrainWasmSource,
  standYFn: (x: number, z: number, fromY: number) => number | null,
  isBlockedFn: (x: number, z: number) => boolean,
): TerrainWasmBridge {
  let staticDirty = true;
  let staticUploaded = false;
  let walkDirty = true;
  let deltasDirty = true;
  let paintDirty = true;
  let extraSyncedCount = 0;
  const uploadedFloraChunks = new Set<number>();

  function uploadZonesAndTerrain(rt: KernelRuntime): void {
    const { ex, f64, i32 } = rt;
    ex.resetStaticLayers();
    staticUploaded = false;
    uploadedFloraChunks.clear();

    // Config scalars
    const cfgIdx = ex.getCfgPtr() >>> 3;
    f64[cfgIdx] = WORLD.blend;
    f64[cfgIdx + 1] = WORLD.ridge;
    f64[cfgIdx + 2] = WORLD.roadHalfWidth;
    f64[cfgIdx + 3] = WORLD.step;
    f64[cfgIdx + 4] = WORLD.instanceZ - 400;
    f64[cfgIdx + 5] = TUNING.waterLevel;
    f64[cfgIdx + 6] = WORLD.chunk;

    const all = src.allZones;
    const zIdxByRef = new Map<ZoneDef, number>();
    const zBase = ex.getZonesPtr() >>> 3;
    const regBase = ex.getRegionsPtr() >>> 3;
    const lakeBase = ex.getLakesPtr() >>> 3;
    let regCursor = 0;
    let lakeCursor = 0;

    for (let z = 0; z < all.length && z < 128; z++) {
      const def = all[z];
      zIdxByRef.set(def, z);
      const o = def.origin ?? { x: 0, z: 0 };
      const rStart = regCursor;
      for (const r of def.regions) {
        if (regCursor >= 512) break;
        const rp = regBase + regCursor * 4;
        f64[rp] = r.x;
        f64[rp + 1] = r.z;
        f64[rp + 2] = r.r;
        f64[rp + 3] = r.id === 'burrow' ? 1 : r.id === 'barrows' ? 2 : 0;
        regCursor++;
      }
      const lStart = lakeCursor;
      for (const l of def.lakes) {
        if (lakeCursor >= 256) break;
        const lp = lakeBase + lakeCursor * 4;
        f64[lp] = l.x;
        f64[lp + 1] = l.z;
        f64[lp + 2] = l.r;
        f64[lp + 3] = 0;
        lakeCursor++;
      }

      const zp = zBase + z * 16;
      const flags = (def.indoor ? 1 : 0) | (def.interior ? 2 : 0);
      f64[zp] = o.x;
      f64[zp + 1] = o.z;
      f64[zp + 2] = def.half;
      f64[zp + 3] = def.theme.hilliness;
      f64[zp + 4] = flags;
      f64[zp + 5] = def.interior ? def.interior.hw : 0;
      f64[zp + 6] = def.interior ? def.interior.hd : 0;
      f64[zp + 7] = def.theme.ground;
      f64[zp + 8] = def.theme.groundAlt;
      f64[zp + 9] = def.interior ? def.interior.palette.floor : 0;
      f64[zp + 10] = rStart;
      f64[zp + 11] = regCursor - rStart;
      f64[zp + 12] = lStart;
      f64[zp + 13] = lakeCursor - lStart;
    }

    const outPtr = ex.getOutdoorIdsPtr() >>> 2;
    const inPtr = ex.getIndoorIdsPtr() >>> 2;
    const intPtr = ex.getInteriorIdsPtr() >>> 2;
    src.outdoorZones.forEach((d, k) => { i32[outPtr + k] = zIdxByRef.get(d)!; });
    src.indoorZones.forEach((d, k) => { i32[inPtr + k] = zIdxByRef.get(d)!; });
    src.interiorZones.forEach((d, k) => { i32[intPtr + k] = zIdxByRef.get(d)!; });

    const passes = src.passes();
    const passBase = ex.getPassesPtr() >>> 3;
    const pCount = Math.min(passes.length, 64);
    for (let i = 0; i < pCount; i++) {
      const p = passes[i];
      const pp = passBase + i * 4;
      f64[pp] = p.a.x;
      f64[pp + 1] = p.a.z;
      f64[pp + 2] = p.b.x;
      f64[pp + 3] = p.b.z;
    }

    // Populate DECKS_PTR BEFORE setWorldConfig so setWorldConfig's 16 m deck spatial grid reads the real deck bounds.
    const decks = src.decks();
    const dCount = Math.min(decks.length, 128);
    const deckBase = ex.getDecksPtr() >>> 3;
    for (let i = 0; i < dCount; i++) {
      const d = decks[i];
      const r = d.ramp;
      const dp = deckBase + i * 20;
      f64[dp] = d.top;
      f64[dp + 1] = d.minX;
      f64[dp + 2] = d.maxX;
      f64[dp + 3] = d.minZ;
      f64[dp + 4] = d.maxZ;
      f64[dp + 5] = r.minX;
      f64[dp + 6] = r.maxX;
      f64[dp + 7] = r.minZ;
      f64[dp + 8] = r.maxZ;
      f64[dp + 9] = r.along === 'z' ? 1 : 0;
      f64[dp + 10] = r.start;
      f64[dp + 11] = r.dir;
      f64[dp + 12] = r.len;
      f64[dp + 13] = Math.min(d.minX, r.minX);
      f64[dp + 14] = Math.max(d.maxX, r.maxX);
      f64[dp + 15] = Math.min(d.minZ, r.minZ);
      f64[dp + 16] = Math.max(d.maxZ, r.maxZ);
    }

    ex.setWorldConfig(
      Math.min(all.length, 128),
      src.outdoorZones.length,
      src.indoorZones.length,
      src.interiorZones.length,
      pCount,
      dCount,
    );

    const cutSet = new Set<RoadSeg>(src.cutRoadSegments());
    const roadSet = new Set<RoadSeg>();
    for (const s of src.roadSegments()) {
      roadSet.add(s);
      ex.addRoadSeg(s.ax, s.az, s.bx, s.bz, cutSet.has(s) ? 3 : 1);
    }
    for (const c of cutSet) {
      if (roadSet.has(c)) continue;
      ex.addRoadSeg(c.ax, c.az, c.bx, c.bz, 2);
    }

    for (const st of src.stamps()) {
      if (st.op === 'flatten') ex.addStamp(1, st.x, st.z, st.inner, st.outer, st.to);
      else ex.addStamp(0, st.x, st.z, st.sigma, st.amount, 0);
    }
  }

  function ensureStaticUploaded(rt: KernelRuntime): void {
    if (staticUploaded) return;
    staticUploaded = true;
    for (const c of src.staticCircles()) {
      rt.ex.addStaticCollider(c.x, c.z, c.r);
    }
  }

  function uploadWalkGrid(rt: KernelRuntime): void {
    const { ex, u8 } = rt;
    const wg = src.walkGrid();
    if (!wg) {
      ex.clearWalkTiles(0);
      return;
    }
    const tiles = wg.tiles();
    if (tiles.length === 0) {
      ex.clearWalkTiles(0);
      return;
    }
    ex.clearWalkTiles(1);
    const bitsBase = ex.getWalkBitsPtr();
    const maxBytes = 0x1a0000;
    let byteOff = 0;
    for (const t of tiles) {
      if (byteOff + t.bits.byteLength > maxBytes) {
        // Fallback if custom huge tiles exceed arena
        ex.clearWalkTiles(0);
        return;
      }
      u8.set(t.bits, bitsBase + byteOff);
      ex.addWalkTileMeta(t.minX, t.minZ, t.cols, t.rows, byteOff);
      byteOff = (byteOff + t.bits.byteLength + 7) & ~7;
    }
  }

  function uploadDeltas(rt: KernelRuntime): void {
    const { ex, i16 } = rt;
    ex.clearDeltaChunks();
    const dg = src.deltas();
    if (dg.isEmpty()) return;
    const dataBase = ex.getDeltaDataPtr() >>> 1; // Int16 index
    dg.forEachChunk((ci, cj, data) => {
      const slot = ex.addDeltaChunkMeta(ci, cj);
      if (slot >= 0) i16.set(data, dataBase + slot * 4096);
    });
  }

  function uploadPaint(rt: KernelRuntime): void {
    const { ex, u8 } = rt;
    ex.clearPaintChunks();
    const pg = src.paint();
    if (pg.isEmpty()) return;
    const dataBase = ex.getPaintDataPtr();
    pg.forEachChunk((ci, cj, data) => {
      const slot = ex.addPaintChunkMeta(ci, cj);
      if (slot >= 0) u8.set(data, dataBase + slot * 4096);
    });
  }

  function syncPassMask(rt: KernelRuntime): void {
    const passes = src.passes();
    let lo = 0;
    let hi = 0;
    for (let i = 0; i < passes.length && i < 64; i++) {
      if (!src.passOpen(passes[i])) continue;
      if (i < 32) lo |= 1 << i;
      else hi |= 1 << (i - 32);
    }
    rt.ex.setPassMask(lo >>> 0, hi >>> 0);
  }

  function syncTerrainShape(rt: KernelRuntime): boolean {
    const switchedOwner = activeBridge !== bridge;
    if (switchedOwner) {
      activeBridge = bridge;
      staticDirty = true;
      walkDirty = true;
      deltasDirty = true;
      paintDirty = true;
      extraSyncedCount = 0;
    }
    if (deltasDirty) {
      uploadDeltas(rt);
      deltasDirty = false;
    }
    if (staticDirty) {
      uploadZonesAndTerrain(rt);
      rt.ex.invalidateHeights();
      staticDirty = false;
    }
    return switchedOwner;
  }

  const bridge: TerrainWasmBridge = {
    onInvalidate() {
      staticDirty = true;
      walkDirty = true;
      deltasDirty = true;
      paintDirty = true;
    },
    onWalkGridChange() {
      walkDirty = true;
    },
    onDeltasChange() {
      deltasDirty = true;
    },
    onPaintChange() {
      paintDirty = true;
    },
    onExtraCollider(x, z, r) {
      if (activeBridge === bridge && runtime) {
        const extras = src.extraCircles();
        if (extraSyncedCount === extras.length - 1) {
          runtime.ex.addExtraCollider(x, z, r);
          extraSyncedCount = extras.length;
        }
      }
    },
    syncAndPrepare(rt: KernelRuntime) {
      const switchedOwner = syncTerrainShape(rt);
      if (walkDirty) {
        uploadWalkGrid(rt);
        walkDirty = false;
      } else {
        // WalkGrid tiles can be mutated in-place (e.g. grid.deleteTile in editor/tests); verify count matches.
        const wg = src.walkGrid();
        if (wg && wg.tiles().length === 0) uploadWalkGrid(rt);
      }
      const extras = src.extraCircles();
      if (switchedOwner || extraSyncedCount > extras.length) {
        rt.ex.resetExtraColliders();
        extraSyncedCount = 0;
      }
      while (extraSyncedCount < extras.length) {
        const c = extras[extraSyncedCount++];
        rt.ex.addExtraCollider(c.x, c.z, c.r);
      }
      syncPassMask(rt);
      activeEnsureStatic = () => ensureStaticUploaded(rt);
      activeEnsureFlora = (ci, cj) => {
        const key = ci * 1_000_003 + cj;
        if (uploadedFloraChunks.has(key)) return;
        uploadedFloraChunks.add(key);
        for (const c of src.ensureFloraCircles(ci, cj)) {
          rt.ex.addStaticCollider(c.x, c.z, c.r);
        }
      };
    },
    buildChunkBuffers(cx, cz, chunkSize, segments) {
      const rt = getKernelRuntime();
      if (!rt || wasmBusy) return null;
      wasmBusy = true;
      try {
        syncTerrainShape(rt);
        if (paintDirty) {
          uploadPaint(rt);
          paintDirty = false;
        }
        const floatCount = rt.ex.buildChunkBuffers(cx, cz, chunkSize, segments);
        const posStart = rt.ex.getChunkPosPtr() >>> 2;
        const nrmStart = rt.ex.getChunkNrmPtr() >>> 2;
        const colStart = rt.ex.getChunkColPtr() >>> 2;
        const boundsStart = rt.ex.getChunkBoundsPtr() >>> 2;
        return {
          positions: rt.f32.slice(posStart, posStart + floatCount),
          normals: rt.f32.slice(nrmStart, nrmStart + floatCount),
          colors: rt.f32.slice(colStart, colStart + floatCount),
          minY: rt.f32[boundsStart],
          maxY: rt.f32[boundsStart + 1],
        };
      } finally {
        wasmBusy = false;
      }
    },
    buildMinimapPixels(x0, z0, chunkSize, pxCount, waterLevel) {
      const rt = getKernelRuntime();
      if (!rt || wasmBusy) return null;
      wasmBusy = true;
      try {
        syncTerrainShape(rt);
        if (paintDirty) {
          uploadPaint(rt);
          paintDirty = false;
        }
        const n = rt.ex.buildMinimapPixels(x0, z0, chunkSize, pxCount, waterLevel);
        const start = rt.ex.getMinimapPtr() >>> 2;
        return rt.u32.slice(start, start + n);
      } finally {
        wasmBusy = false;
      }
    },
  };

  byStepFn.set(standYFn, bridge);
  byBlockedFn.set(isBlockedFn, bridge);
  return bridge;
}

/** Runs 3D A* in WebAssembly (zero JS callbacks when `step` is a registered Terrain `standY`). Null if Wasm not ready. */
export function tryWasmFindPath3(
  from: { x: number; y: number; z: number },
  goal: { x: number; y: number; z: number },
  step: (x: number, z: number, fromY: number) => number | null,
  maxExpand: number,
  opts?: { cost?: (x: number, z: number) => number; minCost?: number },
): { x: number; y: number; z: number }[] | null {
  const rt = getKernelRuntime();
  if (!rt || wasmBusy) return null;

  const bridge = byStepFn.get(step);
  wasmBusy = true;
  try {
    let stepMode = 1;
    if (bridge) {
      bridge.syncAndPrepare(rt);
      stepMode = 0;
    } else {
      activeCustomStep = step;
    }

    let costMode = 0;
    let roadBias = 1;
    const minCost = opts?.minCost ?? 1;
    if (opts?.cost) {
      const tagged = (opts.cost as TaggedRoadCost)[ROAD_COST_TAG];
      if (tagged !== undefined && bridge) {
        costMode = 1;
        roadBias = tagged;
      } else {
        costMode = 2;
        activeCustomCost = opts.cost;
      }
    }

    const count = rt.ex.findPath3Wasm(
      from.x, from.y, from.z,
      goal.x, goal.y, goal.z,
      maxExpand, stepMode, costMode, roadBias, minCost,
    );
    const out: { x: number; y: number; z: number }[] = new Array(count);
    const base = rt.ex.getOutPathPtr() >>> 3;
    for (let i = 0; i < count; i++) {
      const p = base + i * 3;
      out[i] = { x: rt.f64[p], y: rt.f64[p + 1], z: rt.f64[p + 2] };
    }
    return out;
  } finally {
    activeCustomStep = null;
    activeCustomCost = null;
    wasmBusy = false;
  }
}

/** Runs 2D A* in WebAssembly (zero JS callbacks when `blocked` is a registered Terrain `isBlocked`). Null if Wasm not ready. */
export function tryWasmFindPath2(
  from: { x: number; z: number },
  to: { x: number; z: number },
  blocked: (x: number, z: number) => boolean,
  maxExpand: number,
): { x: number; z: number }[] | null {
  const rt = getKernelRuntime();
  if (!rt || wasmBusy) return null;

  const bridge = byBlockedFn.get(blocked);
  wasmBusy = true;
  try {
    let blockedMode = 1;
    if (bridge) {
      bridge.syncAndPrepare(rt);
      blockedMode = 0;
    } else {
      activeCustomBlocked = blocked;
    }

    const count = rt.ex.findPath2Wasm(from.x, from.z, to.x, to.z, maxExpand, blockedMode);
    const out: { x: number; z: number }[] = new Array(count);
    const base = rt.ex.getOutPathPtr() >>> 3;
    for (let i = 0; i < count; i++) {
      const p = base + i * 2;
      out[i] = { x: rt.f64[p], z: rt.f64[p + 1] };
    }
    return out;
  } finally {
    activeCustomBlocked = null;
    wasmBusy = false;
  }
}
