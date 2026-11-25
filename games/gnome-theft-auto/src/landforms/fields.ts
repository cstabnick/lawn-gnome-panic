// Distance fields the landforms read (4 m cells, bilinear, built once on first use): from river banks, from any water,
// from a region's inner border, from the highways. Pure: no three.js, no DOM. Reads the documents' current water paths,
// so a river course moved in a document moves its clearance with it.
import { distToSeg } from '@lawn/level';
import { WORLD_HALF } from '../config';
import { REGION_IDS, REGIONS, highways, regionAt, waterBodies, waterPaths, type RegionId } from '../levels';
import { wasmBuildDistanceFields } from '../wasm/gtaWasm';

const MC = 4;
const MN = Math.round((2 * WORLD_HALF) / MC) + 1;
let fields: { river: Float32Array; water: Float32Array; border: Float32Array; road: Float32Array } | null = null;

/** The border edges of a region that are not on the world's edge (relief fades to 0 along these). */
function innerEdges(id: RegionId): [number, number, number, number][] {
  const b = REGIONS[id].border;
  const W = WORLD_HALF;
  const out: [number, number, number, number][] = [];
  for (let k = 0; k < b.length; k++) {
    const [ax, az] = b[k], [bx, bz] = b[(k + 1) % b.length];
    const onEdge = (ax === bx && Math.abs(ax) >= W) || (az === bz && Math.abs(az) >= W);
    if (!onEdge) out.push([ax, az, bx, bz]);
  }
  return out;
}

function buildFields(): NonNullable<typeof fields> {
  const fromWasm = wasmBuildDistanceFields();
  if (fromWasm) return fromWasm;
  const river = new Float32Array(MN * MN);
  const water = new Float32Array(MN * MN);
  const border = new Float32Array(MN * MN);
  const road = new Float32Array(MN * MN);
  const paths = waterPaths();
  const roads = highways();
  const bodies = waterBodies();
  const edges = Object.fromEntries(REGION_IDS.map((id) => [id, innerEdges(id)])) as Record<RegionId, [number, number, number, number][]>;
  // Same minimum distances as checking every segment, but segments whose bounding box is already further than the best
  // so far are skipped, starting from the previous cell's nearest segment (perf pass 2: this was a quarter of the
  // height-grid build, about 0.6 s at load).
  const riverSegs = packSegs(paths.flatMap((p) => p.points.slice(1).map((q, k) => [p.points[k][0], p.points[k][1], q[0], q[1], p.width / 2] as Seg)));
  const roadSegs = packSegs(roads.flatMap((hw) => hw.points.slice(1).map((q, k) => [hw.points[k][0], hw.points[k][1], q[0], q[1], 0] as Seg)));
  const edgeSegs = Object.fromEntries(REGION_IDS.map((id) => [id, packSegs(edges[id].map((e) => [...e, 0] as Seg))])) as Record<RegionId, Float64Array>;
  const hint = { river: -1, road: -1, edge: -1, edgeRegion: '' as string };
  for (let j = 0; j < MN; j++) {
    const z = -WORLD_HALF + j * MC;
    for (let i = 0; i < MN; i++) {
      const x = -WORLD_HALF + i * MC;
      let r = nearestSeg(riverSegs, x, z, hint, 'river');
      r = Math.max(0, r);
      let w = r;
      for (const b of bodies) {
        const dx = Math.max(b.minX - x, 0, x - b.maxX), dz = Math.max(b.minZ - z, 0, z - b.maxZ);
        w = Math.min(w, Math.hypot(dx, dz));
      }
      const reg = regionAt(x, z);
      if (reg !== hint.edgeRegion) {
        hint.edgeRegion = reg;
        hint.edge = -1;
      }
      const e = nearestSeg(edgeSegs[reg], x, z, hint, 'edge');
      const rd = nearestSeg(roadSegs, x, z, hint, 'road');
      const idx = j * MN + i;
      road[idx] = Math.min(rd, 1e4);
      river[idx] = Math.min(r, 1e4);
      water[idx] = Math.min(w, 1e4);
      border[idx] = Math.min(e, 1e4);
    }
  }
  return { river, water, border, road };
}

/** A segment [ax, az, bx, bz, off]: its distance counts as the distance to the line minus off (half a river's width). */
type Seg = [number, number, number, number, number];
/** Segments packed 9 numbers each: ax, az, bx, bz, off, then the bounding box minX, maxX, minZ, maxZ. */
function packSegs(segs: readonly Seg[]): Float64Array {
  const out = new Float64Array(segs.length * 9);
  segs.forEach(([ax, az, bx, bz, off], k) => {
    out.set([ax, az, bx, bz, off, Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz)], k * 9);
  });
  return out;
}

/** min over segments of (distance - off), exactly as a full scan; Infinity for none. `hint[key]` is the last nearest. */
function nearestSeg<K extends 'river' | 'road' | 'edge'>(s: Float64Array, x: number, z: number, hint: Record<K, number>, key: K): number {
  let best = Infinity;
  const h = hint[key];
  if (h >= 0 && h * 9 < s.length) best = distToSeg(x, z, s[h * 9], s[h * 9 + 1], s[h * 9 + 2], s[h * 9 + 3]) - s[h * 9 + 4];
  for (let k = 0, o = 0; o < s.length; k++, o += 9) {
    if (k === h) continue;
    const off = s[o + 4];
    const t = best + off;
    if (t < 0) continue;
    const dx = Math.max(s[o + 5] - x, 0, x - s[o + 6]);
    const dz = Math.max(s[o + 7] - z, 0, z - s[o + 8]);
    if (dx * dx + dz * dz >= t * t) continue;
    const d = distToSeg(x, z, s[o], s[o + 1], s[o + 2], s[o + 3]) - off;
    if (d < best) {
      best = d;
      hint[key] = k;
    }
  }
  return best;
}

function sample(f: Float32Array, x: number, z: number): number {
  const u = Math.max(0, Math.min(MN - 1, (x + WORLD_HALF) / MC));
  const v = Math.max(0, Math.min(MN - 1, (z + WORLD_HALF) / MC));
  const i = Math.min(MN - 2, Math.floor(u)), j = Math.min(MN - 2, Math.floor(v));
  const fx = u - i, fz = v - j;
  const a = f[j * MN + i], b = f[j * MN + i + 1], c = f[(j + 1) * MN + i], d = f[(j + 1) * MN + i + 1];
  return (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
}

/** Metres from the nearest river or canal bank (0 on the water). Accurate to about a metre. */
export function riverDistAt(x: number, z: number): number {
  fields ??= buildFields();
  return sample(fields.river, x, z);
}

/** Metres from any water: a river bank or the edge of a still-water body (0 inside one). */
export function waterDistAt(x: number, z: number): number {
  fields ??= buildFields();
  return sample(fields.water, x, z);
}

/** Metres from the region's nearest inner border edge (the world's own edge does not count). */
export function borderDistAt(x: number, z: number): number {
  fields ??= buildFields();
  return sample(fields.border, x, z);
}

/** Metres from the nearest highway centre line (not trails). Accurate to about a metre. */
export function roadDistAt(x: number, z: number): number {
  fields ??= buildFields();
  return sample(fields.road, x, z);
}
