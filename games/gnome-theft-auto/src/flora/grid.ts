// The plant store and its uniform grid (flora/types.ts PlantStore). Plan: docs/roadmaps/gta-mowable-plants.md.
// queryCircle and nearestPlant run every frame for every vehicle: they must not allocate.
import type { PlantSeed, PlantStore } from './types';
import { STANDING } from './types';

/**
 * Flat typed arrays for `seeds` (every plant STANDING) and a uniform grid of `cell` m over their contact centres.
 * Positions are stored as Float32 and filed by those stored values, so the grid and the distance test agree exactly.
 */
export function createPlantStore(seeds: readonly PlantSeed[], cell = 4): PlantStore {
  const n = seeds.length;
  const cx = new Float32Array(n), cz = new Float32Array(n), r = new Float32Array(n), kind = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const s = seeds[i];
    cx[i] = s.cx; cz[i] = s.cz; r[i] = s.r; kind[i] = s.kind;
  }

  let ox = 0, oz = 0, nx = 1, nz = 1, maxR = 0;
  const cellStart = new Int32Array(2);
  let cellItems = new Int32Array(0);

  if (n > 0) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < n; i++) {
      if (cx[i] < minX) minX = cx[i];
      if (cx[i] > maxX) maxX = cx[i];
      if (cz[i] < minZ) minZ = cz[i];
      if (cz[i] > maxZ) maxZ = cz[i];
      if (r[i] > maxR) maxR = r[i];
    }
    ox = minX; oz = minZ;
    nx = Math.floor((maxX - ox) / cell) + 1;
    nz = Math.floor((maxZ - oz) / cell) + 1;
  }

  const nc = nx * nz;
  const cellOf = new Int32Array(n);
  const counts = new Int32Array(nc + 1);
  for (let i = 0; i < n; i++) {
    const ix = Math.min(nx - 1, Math.max(0, Math.floor((cx[i] - ox) / cell)));
    const iz = Math.min(nz - 1, Math.max(0, Math.floor((cz[i] - oz) / cell)));
    const c = iz * nx + ix;
    cellOf[i] = c;
    counts[c + 1]++;
  }
  // counts[c + 1] held the size of cell c; prefix sums turn it into the start of each cell.
  for (let c = 0; c < nc; c++) counts[c + 1] += counts[c];
  const cursor = counts.slice(0, nc);
  cellItems = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    cellItems[cursor[cellOf[i]]++] = i;
  }
  const cellStartFinal = n > 0 ? counts : cellStart;

  return {
    count: n, seeds,
    cx, cz, r, kind,
    state: new Uint8Array(n).fill(STANDING), t: new Float32Array(n), wait: new Float32Array(n),
    active: new Int32Array(n), activeAt: new Int32Array(n).fill(-1), activeCount: 0,
    cell, ox, oz, nx, nz, maxR,
    cellStart: cellStartFinal, cellItems,
  };
}

/** Writes into `out` the indices of plants whose contact circle overlaps the circle (x, z, r); returns how many (at most out.length). Zero allocations. */
export function queryCircle(s: PlantStore, x: number, z: number, r: number, out: Int32Array): number {
  const reach = r + s.maxR;
  const fx0 = Math.floor((x - reach - s.ox) / s.cell);
  const fx1 = Math.floor((x + reach - s.ox) / s.cell);
  const fz0 = Math.floor((z - reach - s.oz) / s.cell);
  const fz1 = Math.floor((z + reach - s.oz) / s.cell);
  if (fx1 < 0 || fx0 > s.nx - 1 || fz1 < 0 || fz0 > s.nz - 1) return 0;
  const ix0 = fx0 < 0 ? 0 : fx0, ix1 = fx1 > s.nx - 1 ? s.nx - 1 : fx1;
  const iz0 = fz0 < 0 ? 0 : fz0, iz1 = fz1 > s.nz - 1 ? s.nz - 1 : fz1;
  const cap = out.length;
  const { cx, cz, r: pr, cellStart, cellItems, nx } = s;
  let count = 0;
  for (let iz = iz0; iz <= iz1; iz++) {
    for (let ix = ix0; ix <= ix1; ix++) {
      const c = iz * nx + ix;
      const end = cellStart[c + 1];
      for (let k = cellStart[c]; k < end; k++) {
        const j = cellItems[k];
        const dx = cx[j] - x, dz = cz[j] - z;
        const rr = r + pr[j];
        if (dx * dx + dz * dz < rr * rr) {
          out[count++] = j;
          if (count === cap) return count;
        }
      }
    }
  }
  return count;
}

/** Index of the plant whose contact centre is nearest (x, z) within maxR, or -1. */
export function nearestPlant(s: PlantStore, x: number, z: number, maxR: number): number {
  if (s.count === 0) return -1;
  const fx0 = Math.floor((x - maxR - s.ox) / s.cell);
  const fx1 = Math.floor((x + maxR - s.ox) / s.cell);
  const fz0 = Math.floor((z - maxR - s.oz) / s.cell);
  const fz1 = Math.floor((z + maxR - s.oz) / s.cell);
  if (fx1 < 0 || fx0 > s.nx - 1 || fz1 < 0 || fz0 > s.nz - 1) return -1;
  const ix0 = fx0 < 0 ? 0 : fx0, ix1 = fx1 > s.nx - 1 ? s.nx - 1 : fx1;
  const iz0 = fz0 < 0 ? 0 : fz0, iz1 = fz1 > s.nz - 1 ? s.nz - 1 : fz1;
  const { cx, cz, cellStart, cellItems, nx } = s;
  const limit = maxR * maxR;
  let best = -1, bestD = Infinity;
  for (let iz = iz0; iz <= iz1; iz++) {
    for (let ix = ix0; ix <= ix1; ix++) {
      const c = iz * nx + ix;
      const end = cellStart[c + 1];
      for (let k = cellStart[c]; k < end; k++) {
        const j = cellItems[k];
        const dx = cx[j] - x, dz = cz[j] - z;
        const d = dx * dx + dz * dz;
        if (d <= limit && d < bestD) { bestD = d; best = j; }
      }
    }
  }
  return best;
}
