import { distToSeg } from '@lawn/level';
import { describe, expect, it } from 'vitest';
import { TERRAIN, WORLD_HALF } from '../config';
import {
  PAINT_KINDS, borderDistAt, macroAt, regionPaintAt, reliefAt, riverDistAt, roadDistAt, tiltAt, waterDistAt,
  type GroundFacts,
} from '../landforms';
import { fbm, ridged, valueNoise } from '../landforms/noise';
import { REGION_PRIORITY, regionAt, trails } from '../levels';
import { GRID_N, heightGrid, normalAt, resetTerrainOptions, setTerrainOptions } from '../terrain';
import { paintGridBytes } from '../terrainPaint';
import { bridges } from '../water';
import {
  getGtaKernelRuntime, initGtaWasm, wasmBuildChunkPosNormals, wasmBuildDistanceFields, wasmSyncChunkGridAndBridges,
} from './gtaWasm';

const SPAN = 2 * WORLD_HALF;
const sampleX = (k: number): number => ((k * 73856093) % (SPAN * 100)) / 100 - WORLD_HALF;
const sampleZ = (k: number): number => ((k * 19349663) % (SPAN * 100)) / 100 - WORLD_HALF;

describe('GTA Wasm kernel parity', () => {
  it('matches TS noise (valueNoise, fbm, ridged) and regionAt across 2,000 world samples', async () => {
    await initGtaWasm();
    const rt = getGtaKernelRuntime()!;
    expect(rt).not.toBeNull();
    wasmBuildDistanceFields();

    for (let k = 0; k < 2000; k++) {
      const x = sampleX(k);
      const z = sampleZ(k);
      expect(rt.ex.valueNoise(x / 80, z / 80, 11)).toBeCloseTo(valueNoise(x / 80, z / 80, 11), 12);
      expect(rt.ex.fbm(x / 180, z / 180, 21, 3, 0.5, 2)).toBeCloseTo(fbm(x / 180, z / 180, 21, 3, 0.5, 2), 12);
      expect(rt.ex.ridged(x / 240, z / 60, 7, 2)).toBeCloseTo(ridged(x / 240, z / 60, 7, 2), 12);

      const wasmReg = REGION_PRIORITY[rt.ex.regionAtIdx(x, z)];
      expect(wasmReg).toBe(regionAt(x, z));
    }
  });

  it('matches the JS relief (tilt + every region landform + macro landscape) over the whole map', () => {
    const rt = getGtaKernelRuntime()!;
    expect(rt).not.toBeNull();
    wasmBuildDistanceFields();
    rt.ex.setBuildLayers(0, 0, 0);
    const seen = new Set<string>();
    for (let k = 0; k < 6000; k++) {
      const x = sampleX(k);
      const z = sampleZ(k);
      seen.add(regionAt(x, z));
      const expected = tiltAt(x, z) + reliefAt(x, z) + macroAt(x, z);
      expect(rt.ex.naturalHeightAtWasm(x, z, 1, 1)).toBeCloseTo(expected, 6);
    }
    // The samples must have reached every region, the E01 bands and the E28 ones included.
    for (const id of REGION_PRIORITY) expect(seen.has(id)).toBe(true);
  });

  it('builds the distance fields, the height grid, the paint grid and chunk pos/normals matching the reference', () => {
    setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
    try {
      const g = heightGrid()!;
      expect(g.length).toBe(GRID_N * GRID_N);
      expect(GRID_N).toBe(Math.round(SPAN / TERRAIN.step) + 1);
      expect(riverDistAt(0, 0)).toBeGreaterThanOrEqual(0);
      expect(waterDistAt(-700, -680)).toBeGreaterThanOrEqual(0);
      expect(borderDistAt(400, 100)).toBeGreaterThanOrEqual(0);
      expect(roadDistAt(0, -200)).toBeLessThan(10);

      // Paint: re-derive the JS rule for sampled cells (terrainPaint.ts buildPaint) and compare with the kernel's grid.
      const paint = paintGridBytes()!;
      const C = GRID_N - 1;
      expect(paint.length).toBe(C * C);
      const S = TERRAIN.step;
      const trailList = trails();
      const facts: GroundFacts = { height: 0, slope: 0, riverDist: 0, waterDist: 0, region: 'turfton' };
      const kinds = new Set<number>();
      for (let k = 0; k < 6000; k++) {
        const i = Math.floor(((k * 2654435761) % C + C) % C);
        const j = Math.floor(((k * 40503 + 977) * 7919) % C);
        const x = -WORLD_HALF + (i + 0.5) * S;
        const z = -WORLD_HALF + (j + 0.5) * S;
        const onTrail = trailList.some((t) => {
          const half = (t.width || TERRAIN.trailWidth) / 2;
          for (let q = 0; q + 1 < t.points.length; q++) {
            const [ax, az] = t.points[q];
            const [bx, bz] = t.points[q + 1];
            if (distToSeg(x, z, ax, az, bx, bz) <= half) return true;
          }
          return false;
        });
        if (onTrail) continue;
        const region = regionAt(x, z);
        let expected = 0;
        if (region !== 'turfton') {
          const h00 = g[j * GRID_N + i], h10 = g[j * GRID_N + i + 1], h01 = g[(j + 1) * GRID_N + i], h11 = g[(j + 1) * GRID_N + i + 1];
          const dx = (h10 - h00 + h11 - h01) / (2 * S), dz = (h01 - h00 + h11 - h10) / (2 * S);
          const slope = Math.hypot(dx, dz);
          if (slope >= TERRAIN.rockSlope) expected = PAINT_KINDS.indexOf('rock') + 1;
          else {
            facts.height = (h00 + h10 + h01 + h11) / 4;
            facts.slope = slope;
            facts.riverDist = riverDistAt(x, z);
            facts.waterDist = waterDistAt(x, z);
            facts.region = region;
            const own = regionPaintAt(x, z, facts);
            if (own) expected = PAINT_KINDS.indexOf(own) + 1;
            else if (facts.riverDist < TERRAIN.mudReach) expected = PAINT_KINDS.indexOf('mud') + 1;
          }
        }
        expect(paint[j * C + i]).toBe(expected);
        kinds.add(expected);
      }
      expect(kinds.size).toBeGreaterThan(3);

      const rt = wasmSyncChunkGridAndBridges(g, bridges())!;
      expect(rt).not.toBeNull();
      // The 65 x 65 chunk (aligned to 64 cells) with the biggest height range: a sloped one.
      let best = { i0: 0, j0: 0, range: -1 };
      for (let j0 = 0; j0 + 64 < GRID_N; j0 += 64) {
        for (let i0 = 0; i0 + 64 < GRID_N; i0 += 64) {
          let lo = Infinity, hi = -Infinity;
          for (let j = j0; j <= j0 + 64; j += 4) {
            for (let i = i0; i <= i0 + 64; i += 4) {
              const v = g[j * GRID_N + i];
              if (v < lo) lo = v;
              if (v > hi) hi = v;
            }
          }
          if (hi - lo > best.range) best = { i0, j0, range: hi - lo };
        }
      }
      expect(best.range).toBeGreaterThan(1);
      const { i0, j0 } = best;
      const i1 = i0 + 64, j1 = j0 + 64;
      const w = i1 - i0 + 1;
      const { pos, nrm } = wasmBuildChunkPosNormals(rt, i0, i1, j0, j1);
      expect(pos.length).toBe(w * w * 3);
      for (let j = j0; j <= j1; j += 8) {
        for (let i = i0; i <= i1; i += 8) {
          const idx = ((j - j0) * w + (i - i0)) * 3;
          const x = -WORLD_HALF + i * TERRAIN.step;
          const z = -WORLD_HALF + j * TERRAIN.step;
          expect(pos[idx]).toBeCloseTo(x, 5);
          expect(pos[idx + 1]).toBeCloseTo(g[j * GRID_N + i], 5);
          expect(pos[idx + 2]).toBeCloseTo(z, 5);
          const nn = normalAt(x, z);
          expect(nrm[idx]).toBeCloseTo(nn.x, 5);
          expect(nrm[idx + 1]).toBeCloseTo(nn.y, 5);
          expect(nrm[idx + 2]).toBeCloseTo(nn.z, 5);
        }
      }
    } finally {
      resetTerrainOptions();
    }
  });
});
