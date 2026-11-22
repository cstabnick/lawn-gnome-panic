// Distance fields the landforms read (4 m cells, bilinear, built once on first use): from river banks, from any water,
// from a region's inner border, from the highways. Pure: no three.js, no DOM. Reads the documents' current water paths,
// so a river course moved in a document moves its clearance with it.
import { distToSeg } from '@lawn/level';
import { WORLD_HALF } from '../config';
import { REGION_IDS, REGIONS, highways, regionAt, waterBodies, waterPaths, type RegionId } from '../levels';

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
  const river = new Float32Array(MN * MN);
  const water = new Float32Array(MN * MN);
  const border = new Float32Array(MN * MN);
  const road = new Float32Array(MN * MN);
  const paths = waterPaths();
  const roads = highways();
  const bodies = waterBodies();
  const edges = Object.fromEntries(REGION_IDS.map((id) => [id, innerEdges(id)])) as Record<RegionId, [number, number, number, number][]>;
  for (let j = 0; j < MN; j++) {
    const z = -WORLD_HALF + j * MC;
    for (let i = 0; i < MN; i++) {
      const x = -WORLD_HALF + i * MC;
      let r = Infinity;
      for (const p of paths) {
        for (let k = 0; k + 1 < p.points.length; k++) {
          const d = distToSeg(x, z, p.points[k][0], p.points[k][1], p.points[k + 1][0], p.points[k + 1][1]) - p.width / 2;
          if (d < r) r = d;
        }
      }
      r = Math.max(0, r);
      let w = r;
      for (const b of bodies) {
        const dx = Math.max(b.minX - x, 0, x - b.maxX), dz = Math.max(b.minZ - z, 0, z - b.maxZ);
        w = Math.min(w, Math.hypot(dx, dz));
      }
      let e = Infinity;
      for (const [ax, az, bx, bz] of edges[regionAt(x, z)]) e = Math.min(e, distToSeg(x, z, ax, az, bx, bz));
      let rd = Infinity;
      for (const hw of roads) {
        for (let k = 0; k + 1 < hw.points.length; k++) {
          const d = distToSeg(x, z, hw.points[k][0], hw.points[k][1], hw.points[k + 1][0], hw.points[k + 1][1]);
          if (d < rd) rd = d;
        }
      }
      const idx = j * MN + i;
      road[idx] = Math.min(rd, 1e4);
      river[idx] = Math.min(r, 1e4);
      water[idx] = Math.min(w, 1e4);
      border[idx] = Math.min(e, 1e4);
    }
  }
  return { river, water, border, road };
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
