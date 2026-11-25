// TypeScript host bridge for Gnome Theft Auto's AssemblyScript WebAssembly kernel (assembly/kernel.ts).
// Compiles asynchronously at browser startup (initGtaWasm) and synchronously in Node/Workers so Vitest tests and
// headless perf/golden scripts run Wasm transparently with zero API changes.
import { base64ToBytes, type Stamp } from '@lawn/level';
import { AIRFIELD, BASE, CITY_HALF, TERRAIN, WORLD_HALF } from '../config';
import landscapeJson from '../data/landscape.json';
import {
  LAYOUT, REGION_CELL, REGION_DOCS, REGION_IDS, REGION_PRIORITY, REGIONS, highways, markerNum, markersOf, regionAtExact,
  trails, waterBodies, waterPaths, type RegionId,
} from '../levels';
import type { BridgeSpan } from '../water';
import { KERNEL_WASM_BASE64 } from './kernelBytes';

export const CULL_CLASS_ORDER = [
  'tiny', 'detail', 'prop', 'gnome', 'vehicle', 'tree', 'building', 'cell', 'landmark',
] as const;

export const CULL_CLASS_INDEX: Record<(typeof CULL_CLASS_ORDER)[number], number> = {
  tiny: 0, detail: 1, prop: 2, gnome: 3, vehicle: 4, tree: 5, building: 6, cell: 7, landmark: 8,
};

interface KernelExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory;
  getCfgPtr(): number;
  getRegRasterPtr(): number;
  getRegOriginsPtr(): number;
  getRegPolyMetaPtr(): number;
  getRegPolyPtsPtr(): number;
  getRiverSegsPtr(): number;
  getRoadSegsPtr(): number;
  getEdgeSegsPtr(): number;
  getEdgeMetaPtr(): number;
  getWaterBodiesPtr(): number;
  getMacroSitesPtr(): number;
  getTrailMetaPtr(): number;
  getTrailPtsPtr(): number;
  getMacroFeatPtr(): number;
  getMacroPtsPtr(): number;
  getLfParamsPtr(): number;
  getLfRegMetaPtr(): number;
  getLfFeatPtr(): number;
  getLfPtsPtr(): number;
  getStampsPtr(): number;
  getFlatSegsPtr(): number;
  getFlatSitesPtr(): number;
  getBridgesPtr(): number;

  getCullLimPtr(): number;
  getCullXPtr(): number;
  getCullZPtr(): number;
  getCullRPtr(): number;
  getCullClsPtr(): number;
  getCullStatePtr(): number;
  getCullActivePtr(): number;
  getCullOutPtr(): number;

  getFieldRiverPtr(): number;
  getFieldWaterPtr(): number;
  getFieldBorderPtr(): number;
  getFieldRoadPtr(): number;
  getHeightGridPtr(): number;
  getPaintOutPtr(): number;
  getChunkPosPtr(): number;
  getChunkNrmPtr(): number;

  setStaticCounts(
    rCount: number, rRasterN: number, rvSegs: number, rdSegs: number, wBodies: number,
    mSites: number, trCount: number, mFeats: number,
  ): void;
  setBuildLayers(sCount: number, fSegs: number, fSites: number): void;
  setBridgeCount(bCount: number): void;

  valueNoise(x: number, z: number, seed: number): number;
  fbm(x: number, z: number, seed: number, octaves: number, gain: number, lacunarity: number): number;
  ridged(x: number, z: number, seed: number, octaves: number): number;
  regionAtIdx(x: number, z: number): number;
  buildDistanceFields(): void;
  naturalHeightAtWasm(x: number, z: number, amplitude: number, useLandforms: number): number;
  buildBaseHeightGrid(amplitude: number, useLandforms: number): number;
  buildPaintGrid(): number;
  buildChunkPosNormals(i0: number, i1: number, j0: number, j1: number): number;
  updateCullWasm(maxSlot: number, cx: number, cz: number, viewScale: number, shadowScale: number): number;
}

export interface GtaKernelRuntime {
  ex: KernelExports;
  u8: Uint8Array;
  i8: Int8Array;
  i32: Int32Array;
  u32: Uint32Array;
  f32: Float32Array;
  f64: Float64Array;
}

let runtime: GtaKernelRuntime | null = null;
let initPromise: Promise<void> | null = null;
let wasmDisabled = false;
/** The kernel's fixed memory map (assembly/kernel.ts) is laid out for a world of at most this half-size. Larger
 *  worlds (batch-3 expansion: worldHalf 1400) use the JS path until the kernel's layout is resized. */
export const KERNEL_MAX_WORLD_HALF = 900;
const kernelFitsWorld = (): boolean => LAYOUT.worldHalf <= KERNEL_MAX_WORLD_HALF;
let staticUploaded = false;

const LF_KIND_CODE: Record<string, number> = {
  calm: 1, mesa: 2, canyon: 3, crag: 4, glacier: 5, pond: 6, terrace: 7, pen: 8, island: 9, hill: 10,
};

function innerEdges(id: RegionId): [number, number, number, number][] {
  const b = REGIONS[id].border;
  const W = WORLD_HALF;
  const out: [number, number, number, number][] = [];
  for (let k = 0; k < b.length; k++) {
    const [ax, az] = b[k];
    const [bx, bz] = b[(k + 1) % b.length];
    const onEdge = (ax === bx && Math.abs(ax) >= W) || (az === bz && Math.abs(az) >= W);
    if (!onEdge) out.push([ax, az, bx, bz]);
  }
  return out;
}

function writeSegs(f64: Float64Array, baseIdx: number, segs: readonly [number, number, number, number, number][], maxSegs: number): number {
  const n = Math.min(segs.length, maxSegs);
  for (let i = 0; i < n; i++) {
    const [ax, az, bx, bz, off] = segs[i];
    const p = baseIdx + i * 9;
    f64[p] = ax;
    f64[p + 1] = az;
    f64[p + 2] = bx;
    f64[p + 3] = bz;
    f64[p + 4] = off;
    f64[p + 5] = Math.min(ax, bx);
    f64[p + 6] = Math.max(ax, bx);
    f64[p + 7] = Math.min(az, bz);
    f64[p + 8] = Math.max(az, bz);
  }
  return n;
}

function ensureStaticWorldUploaded(rt: GtaKernelRuntime): void {
  if (staticUploaded) return;
  staticUploaded = true;
  const { ex, i8, i32, f64 } = rt;

  const landscape = landscapeJson as unknown as {
    params: Record<string, number>;
    features: { kind: 'mountain' | 'ridge' | 'hill'; points: [number, number][]; r: number; h: number; seed?: number }[];
  };
  const mp = landscape.params;
  const MN = Math.round((2 * WORLD_HALF) / 4) + 1;
  const GN = Math.round((2 * WORLD_HALF) / TERRAIN.step) + 1;
  const RASTER_N = Math.ceil((2 * LAYOUT.worldHalf) / REGION_CELL);

  const cfg = ex.getCfgPtr() >>> 3;
  f64[cfg] = WORLD_HALF;
  f64[cfg + 1] = CITY_HALF;
  f64[cfg + 2] = REGION_CELL;
  f64[cfg + 3] = 4;
  f64[cfg + 4] = MN;
  f64[cfg + 5] = TERRAIN.step;
  f64[cfg + 6] = GN;
  f64[cfg + 7] = TERRAIN.tiltPerM;
  f64[cfg + 8] = TERRAIN.tiltFlatHalf;
  f64[cfg + 9] = TERRAIN.reliefBorderFade;
  f64[cfg + 10] = TERRAIN.riverClear;
  f64[cfg + 11] = TERRAIN.riverFade;
  f64[cfg + 12] = TERRAIN.siteMargin;
  f64[cfg + 13] = TERRAIN.siteFade;
  f64[cfg + 14] = TERRAIN.rockSlope;
  f64[cfg + 15] = TERRAIN.mudReach;
  f64[cfg + 16] = mp.roadClear;
  f64[cfg + 17] = mp.roadFade;
  f64[cfg + 18] = mp.trailClear;
  f64[cfg + 19] = mp.trailFade;
  f64[cfg + 20] = mp.waterClear;
  f64[cfg + 21] = mp.waterFade;
  f64[cfg + 22] = mp.siteClear;
  f64[cfg + 23] = mp.siteFade;
  f64[cfg + 24] = mp.cityClear;
  f64[cfg + 25] = mp.cityFade;
  f64[cfg + 26] = mp.rimHeight;
  f64[cfg + 27] = mp.rimWidth;
  f64[cfg + 28] = mp.roll;
  f64[cfg + 29] = mp.rollScale;

  // Region polygons + origins + 16 m regionAt raster (matching levels.ts buildRaster)
  const origBase = ex.getRegOriginsPtr() >>> 3;
  const polyMeta = ex.getRegPolyMetaPtr() >>> 2;
  const polyPts = ex.getRegPolyPtsPtr() >>> 3;
  let ptCursor = 0;
  for (let r = 0; r < REGION_PRIORITY.length; r++) {
    const id = REGION_PRIORITY[r];
    const reg = REGIONS[id];
    f64[origBase + r * 2] = reg.origin.x;
    f64[origBase + r * 2 + 1] = reg.origin.z;
    i32[polyMeta + r * 2] = ptCursor;
    i32[polyMeta + r * 2 + 1] = reg.border.length;
    for (const [bx, bz] of reg.border) {
      f64[polyPts + ptCursor * 2] = bx;
      f64[polyPts + ptCursor * 2 + 1] = bz;
      ptCursor++;
    }
  }

  const rasterBase = ex.getRegRasterPtr();
  const x0 = -LAYOUT.worldHalf;
  const allVerts = REGION_PRIORITY.flatMap((id) => REGIONS[id].border);
  for (let j = 0; j < RASTER_N; j++) {
    for (let i = 0; i < RASTER_N; i++) {
      const ax = x0 + i * REGION_CELL;
      const az = x0 + j * REGION_CELL;
      const bx = ax + REGION_CELL;
      const bz = az + REGION_CELL;
      const r0 = regionAtExact(ax, az);
      const same = r0 === regionAtExact(bx, az) && r0 === regionAtExact(ax, bz) && r0 === regionAtExact(bx, bz)
        && !allVerts.some(([vx, vz]) => vx >= ax && vx <= bx && vz >= az && vz <= bz);
      i8[rasterBase + j * RASTER_N + i] = same ? REGION_PRIORITY.indexOf(r0) : -1;
    }
  }

  // Distance field segments & water bodies
  const riverSegList = waterPaths().flatMap((p) =>
    p.points.slice(1).map((q, k): [number, number, number, number, number] => [p.points[k][0], p.points[k][1], q[0], q[1], p.width / 2]),
  );
  const rvCount = writeSegs(f64, ex.getRiverSegsPtr() >>> 3, riverSegList, 1024);

  const roadSegList = highways().flatMap((hw) =>
    hw.points.slice(1).map((q, k): [number, number, number, number, number] => [hw.points[k][0], hw.points[k][1], q[0], q[1], 0]),
  );
  const rdCount = writeSegs(f64, ex.getRoadSegsPtr() >>> 3, roadSegList, 1024);

  const edgeBase = ex.getEdgeSegsPtr() >>> 3;
  const edgeMeta = ex.getEdgeMetaPtr() >>> 2;
  let edgeCursor = 0;
  for (let r = 0; r < REGION_PRIORITY.length; r++) {
    const id = REGION_PRIORITY[r];
    const segs = innerEdges(id).map((e): [number, number, number, number, number] => [e[0], e[1], e[2], e[3], 0]);
    const written = writeSegs(f64, edgeBase + edgeCursor * 9, segs, 1024 - edgeCursor);
    i32[edgeMeta + r * 2] = edgeCursor;
    i32[edgeMeta + r * 2 + 1] = written;
    edgeCursor += written;
  }

  const bodies = waterBodies();
  const wbBase = ex.getWaterBodiesPtr() >>> 3;
  const wbCount = Math.min(bodies.length, 64);
  for (let i = 0; i < wbCount; i++) {
    const b = bodies[i];
    f64[wbBase + i * 4] = b.minX;
    f64[wbBase + i * 4 + 1] = b.maxX;
    f64[wbBase + i * 4 + 2] = b.minZ;
    f64[wbBase + i * 4 + 3] = b.maxZ;
  }

  // Macro keepFlat sites
  const macroSites: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
  macroSites.push({ minX: BASE.minX, maxX: BASE.maxX, minZ: BASE.minZ, maxZ: BASE.maxZ });
  const hx = Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.width / 2;
  const hz = Math.abs(Math.cos(AIRFIELD.yaw)) * AIRFIELD.length / 2 + Math.abs(Math.sin(AIRFIELD.yaw)) * AIRFIELD.width / 2;
  macroSites.push({ minX: AIRFIELD.x - hx, maxX: AIRFIELD.x + hx, minZ: AIRFIELD.z - hz, maxZ: AIRFIELD.z + hz });
  for (const p of AIRFIELD.planeSpots) macroSites.push({ minX: p.x - 8, maxX: p.x + 8, minZ: p.z - 8, maxZ: p.z + 8 });
  for (const m of markersOf('reserve')) {
    const hw = markerNum(m, 'hw');
    const hd = markerNum(m, 'hd');
    macroSites.push({ minX: m.x - hw, maxX: m.x + hw, minZ: m.z - hd, maxZ: m.z + hd });
  }
  for (const id of REGION_IDS) {
    const o = LAYOUT.regions.find((r) => r.id === id)!.origin;
    for (const f of REGION_DOCS[id].data.terrain?.features ?? []) {
      if (f.kind !== 'calm' || f.r === undefined || f.points.length === 0) continue;
      const x = f.points[0][0] + o.x;
      const z = f.points[0][1] + o.z;
      macroSites.push({ minX: x - f.r, maxX: x + f.r, minZ: z - f.r, maxZ: z + f.r });
    }
  }
  const msBase = ex.getMacroSitesPtr() >>> 3;
  const msCount = Math.min(macroSites.length, 256);
  for (let i = 0; i < msCount; i++) {
    const s = macroSites[i];
    f64[msBase + i * 4] = s.minX;
    f64[msBase + i * 4 + 1] = s.maxX;
    f64[msBase + i * 4 + 2] = s.minZ;
    f64[msBase + i * 4 + 3] = s.maxZ;
  }

  // Trails (used by macroMaskAt and buildPaintGrid)
  const trList = trails();
  const trMeta = ex.getTrailMetaPtr() >>> 3;
  const trPts = ex.getTrailPtsPtr() >>> 3;
  let trPtCursor = 0;
  const trCount = Math.min(trList.length, 128);
  for (let i = 0; i < trCount; i++) {
    const t = trList[i];
    const start = trPtCursor;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [px, pz] of t.points) {
      if (trPtCursor >= 2048) break;
      f64[trPts + trPtCursor * 2] = px;
      f64[trPts + trPtCursor * 2 + 1] = pz;
      trPtCursor++;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    }
    const p = trMeta + i * 8;
    f64[p] = start;
    f64[p + 1] = trPtCursor - start;
    f64[p + 2] = minX;
    f64[p + 3] = maxX;
    f64[p + 4] = minZ;
    f64[p + 5] = maxZ;
    f64[p + 6] = (t.width || TERRAIN.trailWidth) / 2;
    f64[p + 7] = 0;
  }

  // Macro features
  const mfList = landscape.features;
  const mfBase = ex.getMacroFeatPtr() >>> 3;
  const mfPts = ex.getMacroPtsPtr() >>> 3;
  let mfPtCursor = 0;
  const mfCount = Math.min(mfList.length, 128);
  for (let i = 0; i < mfCount; i++) {
    const f = mfList[i];
    const start = mfPtCursor;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [px, pz] of f.points) {
      if (mfPtCursor >= 1024) break;
      f64[mfPts + mfPtCursor * 2] = px;
      f64[mfPts + mfPtCursor * 2 + 1] = pz;
      mfPtCursor++;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    }
    const pad = f.r * 1.3;
    const p = mfBase + i * 10;
    f64[p] = f.kind === 'hill' ? 1 : f.kind === 'mountain' ? 2 : 3;
    f64[p + 1] = f.r;
    f64[p + 2] = f.h;
    f64[p + 3] = f.seed ?? 500 + i * 17;
    f64[p + 4] = start;
    f64[p + 5] = mfPtCursor - start;
    f64[p + 6] = minX - pad;
    f64[p + 7] = maxX + pad;
    f64[p + 8] = minZ - pad;
    f64[p + 9] = maxZ + pad;
  }

  // Per-region landform params & world-space features
  const lfpBase = ex.getLfParamsPtr() >>> 3;
  const lfrMeta = ex.getLfRegMetaPtr() >>> 2;
  const lffBase = ex.getLfFeatPtr() >>> 3;
  const lffPts = ex.getLfPtsPtr() >>> 3;
  let lfFeatCursor = 0;
  let lfPtCursor = 0;

  for (let r = 0; r < REGION_PRIORITY.length; r++) {
    const id = REGION_PRIORITY[r];
    const docT = REGION_DOCS[id].data.terrain;
    const o = LAYOUT.regions.find((x) => x.id === id)!.origin;
    const P = docT?.relief.params ?? {};
    const pb = lfpBase + r * 16;

    if (id === 'dust-flats') {
      const wind = P.windAngle ?? 0.6;
      f64.set([P.swell ?? 3, P.swellScale ?? 240, P.duneHeight ?? 1.4, P.duneSpacing ?? 60, P.duneLength ?? 240, Math.cos(wind), Math.sin(wind)], pb);
    } else if (id === 'mossy-wood') {
      f64.set([P.floor ?? 3.5, P.floorScale ?? 180, P.bank ?? 7, P.bankReach ?? 40, P.bankFall ?? 60, P.muddy ?? 14], pb);
    } else if (id === 'frostbite-fells') {
      f64.set([P.base ?? 3, P.baseScale ?? 220, P.ridgeHeight ?? 9, P.ridgeScale ?? 260], pb);
    } else if (id === 'cloverfield-farms') {
      f64.set([P.hills ?? 3.5, P.hillScale ?? 200, P.seaDip ?? 2, P.step ?? 1.5], pb);
    } else if (id === 'loch-moss') {
      f64.set([P.cx ?? -700, P.cz ?? -680, P.wall ?? 16, P.wallStart ?? 30, P.wallWidth ?? 18, P.moor ?? 5, P.moorScale ?? 150, P.shore ?? 14], pb);
    } else if (id === 'tallgrass-commons') {
      f64.set([P.swell ?? 2, P.swellScale ?? 260, P.mounds ?? 3, P.moundScale ?? 70], pb);
    }

    const fStart = lfFeatCursor;
    for (const f of docT?.features ?? []) {
      if (lfFeatCursor >= 256) break;
      const code = LF_KIND_CODE[f.kind] ?? 0;
      const pStart = lfPtCursor;
      for (const [lx, lz] of f.points) {
        if (lfPtCursor >= 2048) break;
        f64[lffPts + lfPtCursor * 2] = lx + o.x;
        f64[lffPts + lfPtCursor * 2 + 1] = lz + o.z;
        lfPtCursor++;
      }
      // Apply region-specific default r/h matching each src/landforms/<region>.ts module
      let rVal: number;
      let hVal: number;
      if (id === 'dust-flats') {
        rVal = f.r ?? 0;
        hVal = f.h ?? 0;
      } else if (id === 'mossy-wood') {
        rVal = f.r ?? 40;
        hVal = f.h ?? 0;
      } else if (id === 'frostbite-fells') {
        rVal = f.r !== undefined ? f.r : NaN;
        hVal = f.h !== undefined ? f.h : NaN;
      } else if (id === 'cloverfield-farms') {
        rVal = f.r ?? (f.kind === 'calm' ? 50 : f.kind === 'terrace' ? 60 : 10);
        hVal = f.h ?? 6;
      } else if (id === 'loch-moss') {
        rVal = f.r ?? 1;
        hVal = f.h ?? 0;
      } else {
        rVal = f.r ?? 90;
        hVal = f.h ?? 10;
      }
      const fp = lffBase + lfFeatCursor * 6;
      f64[fp] = code;
      f64[fp + 1] = rVal;
      f64[fp + 2] = hVal;
      f64[fp + 3] = pStart;
      f64[fp + 4] = lfPtCursor - pStart;
      f64[fp + 5] = 0;
      lfFeatCursor++;
    }
    i32[lfrMeta + r * 2] = fStart;
    i32[lfrMeta + r * 2 + 1] = lfFeatCursor - fStart;
  }

  ex.setStaticCounts(REGION_PRIORITY.length, RASTER_N, rvCount, rdCount, wbCount, msCount, trCount, mfCount);
}

function setupRuntime(instance: WebAssembly.Instance): GtaKernelRuntime {
  const ex = instance.exports as KernelExports;
  const buf = ex.memory.buffer;
  const rt: GtaKernelRuntime = {
    ex,
    u8: new Uint8Array(buf),
    i8: new Int8Array(buf),
    i32: new Int32Array(buf),
    u32: new Uint32Array(buf),
    f32: new Float32Array(buf),
    f64: new Float64Array(buf),
  };
  runtime = rt;
  staticUploaded = false;
  return rt;
}

/** Pre-compiles and instantiates GTA's Wasm kernel asynchronously at browser startup. */
export async function initGtaWasm(): Promise<void> {
  if (runtime) return;
  if (!kernelFitsWorld()) {
    wasmDisabled = true;
    return;
  }
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('wasm') === '0') {
    wasmDisabled = true;
    return;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const bytes = base64ToBytes(KERNEL_WASM_BASE64);
      const { instance } = await WebAssembly.instantiate(bytes as BufferSource, {});
      setupRuntime(instance);
    })();
  }
  await initPromise;
}

/** Returns the active GTA Wasm runtime (instantiating synchronously in Node/Workers if needed). */
export function getGtaKernelRuntime(): GtaKernelRuntime | null {
  if (wasmDisabled || !kernelFitsWorld()) return null;
  if (runtime) return runtime;
  const g = globalThis as { process?: { versions?: { node?: string } } };
  const isNode = !!g.process?.versions?.node;
  const isWorker = 'WorkerGlobalScope' in globalThis;
  if (isNode || isWorker) {
    const bytes = base64ToBytes(KERNEL_WASM_BASE64);
    const mod = new WebAssembly.Module(bytes as BufferSource);
    setupRuntime(new WebAssembly.Instance(mod, {}));
    return runtime;
  }
  return null;
}

// ---- High-level GTA Terrain / Paint / Mesh / Culler API -------------------------------------------------------------

export function wasmBuildDistanceFields(): {
  river: Float32Array;
  water: Float32Array;
  border: Float32Array;
  road: Float32Array;
} | null {
  const rt = getGtaKernelRuntime();
  if (!rt) return null;
  ensureStaticWorldUploaded(rt);
  rt.ex.buildDistanceFields();
  const n = (Math.round((2 * WORLD_HALF) / 4) + 1) ** 2;
  const rv = rt.ex.getFieldRiverPtr() >>> 2;
  const wt = rt.ex.getFieldWaterPtr() >>> 2;
  const bd = rt.ex.getFieldBorderPtr() >>> 2;
  const rd = rt.ex.getFieldRoadPtr() >>> 2;
  // Subarray views directly into fixed Wasm linear memory (zero-copy!).
  return {
    river: rt.f32.subarray(rv, rv + n),
    water: rt.f32.subarray(wt, wt + n),
    border: rt.f32.subarray(bd, bd + n),
    road: rt.f32.subarray(rd, rd + n),
  };
}

let syncedStampsRef: readonly Stamp[] | null = null;
let syncedStampLen = -1;

function uploadStampsOnly(rt: GtaKernelRuntime, stamps: readonly Stamp[]): void {
  if (syncedStampsRef === stamps && syncedStampLen === stamps.length) return;
  syncedStampsRef = stamps;
  syncedStampLen = stamps.length;
  const { ex, f64 } = rt;
  const stBase = ex.getStampsPtr() >>> 3;
  const n = Math.min(stamps.length, 256);
  for (let i = 0; i < n; i++) {
    const s = stamps[i];
    const p = stBase + i * 6;
    if (s.op === 'flatten') {
      f64[p] = 1;
      f64[p + 1] = s.x;
      f64[p + 2] = s.z;
      f64[p + 3] = s.inner;
      f64[p + 4] = s.outer;
      f64[p + 5] = s.to;
    } else {
      f64[p] = 0;
      f64[p + 1] = s.x;
      f64[p + 2] = s.z;
      f64[p + 3] = s.sigma;
      f64[p + 4] = s.amount;
      f64[p + 5] = 0;
    }
  }
  ex.setBuildLayers(n, 0, 0);
}

export function wasmNaturalHeightAt(x: number, z: number, amplitude: number, landforms: boolean, stamps: readonly Stamp[]): number | null {
  const rt = getGtaKernelRuntime();
  if (!rt) return null;
  ensureStaticWorldUploaded(rt);
  uploadStampsOnly(rt, stamps);
  return rt.ex.naturalHeightAtWasm(x, z, amplitude, landforms ? 1 : 0);
}

export function wasmBuildBaseHeightGrid(
  amplitude: number,
  landforms: boolean,
  stamps: readonly Stamp[],
  flatPaths: readonly { points: readonly (readonly [number, number])[]; inner: number; outer: number }[],
  flatSites: readonly { minX: number; maxX: number; minZ: number; maxZ: number; target: number | null }[],
): Float32Array | null {
  const rt = getGtaKernelRuntime();
  if (!rt) return null;
  ensureStaticWorldUploaded(rt);
  const { ex, f64, f32 } = rt;

  // Stamps
  syncedStampsRef = null;
  uploadStampsOnly(rt, stamps);
  const sCount = Math.min(stamps.length, 256);

  // Flat road/trail segments
  const segBase = ex.getFlatSegsPtr() >>> 3;
  let fSegCount = 0;
  for (const hw of flatPaths) {
    for (let k = 0; k + 1 < hw.points.length && fSegCount < 2048; k++) {
      const [ax, az] = hw.points[k];
      const [bx, bz] = hw.points[k + 1];
      const p = segBase + fSegCount * 6;
      f64[p] = ax;
      f64[p + 1] = az;
      f64[p + 2] = bx;
      f64[p + 3] = bz;
      f64[p + 4] = hw.inner;
      f64[p + 5] = hw.outer;
      fSegCount++;
    }
  }

  // Flat site rectangles
  const siteBase = ex.getFlatSitesPtr() >>> 3;
  const fSiteCount = Math.min(flatSites.length, 256);
  for (let i = 0; i < fSiteCount; i++) {
    const s = flatSites[i];
    const p = siteBase + i * 6;
    f64[p] = s.minX;
    f64[p + 1] = s.maxX;
    f64[p + 2] = s.minZ;
    f64[p + 3] = s.maxZ;
    f64[p + 4] = s.target !== null ? 1 : 0;
    f64[p + 5] = s.target ?? 0;
  }

  ex.setBuildLayers(sCount, fSegCount, fSiteCount);
  const total = ex.buildBaseHeightGrid(amplitude, landforms ? 1 : 0);
  const gStart = ex.getHeightGridPtr() >>> 2;
  // Return an owned Float32Array so JS callers (applyTrackRelief, carveWater, setTerrainOptions) can mutate/discard freely.
  return f32.slice(gStart, gStart + total);
}

let syncedGridRef: Float32Array | null = null;

function ensureFinishedGridSynced(rt: GtaKernelRuntime, g: Float32Array): void {
  if (syncedGridRef === g) return;
  syncedGridRef = g;
  rt.f32.set(g, rt.ex.getHeightGridPtr() >>> 2);
}

export function wasmBuildPaintGrid(finishedGrid: Float32Array): Uint8Array | null {
  const rt = getGtaKernelRuntime();
  if (!rt) return null;
  ensureStaticWorldUploaded(rt);
  ensureFinishedGridSynced(rt, finishedGrid);
  const total = rt.ex.buildPaintGrid();
  const pStart = rt.ex.getPaintOutPtr();
  return rt.u8.slice(pStart, pStart + total);
}

let syncedBridgesRef: readonly BridgeSpan[] | null = null;

export function wasmSyncChunkGridAndBridges(finishedGrid: Float32Array, bridgeSpans: readonly BridgeSpan[]): GtaKernelRuntime | null {
  const rt = getGtaKernelRuntime();
  if (!rt) return null;
  ensureStaticWorldUploaded(rt);
  ensureFinishedGridSynced(rt, finishedGrid);
  if (syncedBridgesRef !== bridgeSpans) {
    syncedBridgesRef = bridgeSpans;
    const { ex, f64 } = rt;
    const bBase = ex.getBridgesPtr() >>> 3;
    const count = Math.min(bridgeSpans.length, 128);
    for (let i = 0; i < count; i++) {
      const b = bridgeSpans[i];
      const p = bBase + i * 9;
      f64[p] = b.x;
      f64[p + 1] = b.z;
      f64[p + 2] = Math.sin(b.yaw);
      f64[p + 3] = Math.cos(b.yaw);
      f64[p + 4] = b.length / 2;
      f64[p + 5] = b.width / 2;
      f64[p + 6] = b.deck;
      f64[p + 7] = b.length;
      f64[p + 8] = 0;
    }
    ex.setBridgeCount(count);
  }
  return rt;
}

export function wasmBuildChunkPosNormals(
  rt: GtaKernelRuntime,
  i0: number,
  i1: number,
  j0: number,
  j1: number,
): { pos: Float32Array; nrm: Float32Array } {
  const nFloats = rt.ex.buildChunkPosNormals(i0, i1, j0, j1);
  const pStart = rt.ex.getChunkPosPtr() >>> 2;
  const nStart = rt.ex.getChunkNrmPtr() >>> 2;
  return {
    pos: rt.f32.slice(pStart, pStart + nFloats),
    nrm: rt.f32.slice(nStart, nStart + nFloats),
  };
}
