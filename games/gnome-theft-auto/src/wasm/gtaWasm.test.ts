import { describe, expect, it } from 'vitest';
import { TERRAIN, WORLD_HALF } from '../config';
import { borderDistAt, riverDistAt, roadDistAt, waterDistAt } from '../landforms';
import { fbm, ridged, valueNoise } from '../landforms/noise';
import { REGION_PRIORITY, regionAt } from '../levels';
import { GRID_N, heightGrid, normalAt, resetTerrainOptions, setTerrainOptions } from '../terrain';
import { paintAt } from '../terrainPaint';
import { bridges } from '../water';
import {
  KERNEL_MAX_WORLD_HALF,
  getGtaKernelRuntime, initGtaWasm, wasmBuildChunkPosNormals, wasmBuildDistanceFields, wasmSyncChunkGridAndBridges,
} from './gtaWasm';

// Skipped while the world is larger than the kernel's fixed memory map (KERNEL_MAX_WORLD_HALF); see gta-batch-3 tracking.
describe.skipIf(WORLD_HALF > KERNEL_MAX_WORLD_HALF)('GTA Wasm kernel parity', () => {
  it('matches TS noise (valueNoise, fbm, ridged) and regionAt across 2,000 world samples', async () => {
    await initGtaWasm();
    const rt = getGtaKernelRuntime()!;
    expect(rt).not.toBeNull();
    wasmBuildDistanceFields();

    for (let k = 0; k < 2000; k++) {
      const x = ((k * 73856093) % 180000) / 100 - 900;
      const z = ((k * 19349663) % 180000) / 100 - 900;
      expect(rt.ex.valueNoise(x / 80, z / 80, 11)).toBeCloseTo(valueNoise(x / 80, z / 80, 11), 12);
      expect(rt.ex.fbm(x / 180, z / 180, 21, 3, 0.5, 2)).toBeCloseTo(fbm(x / 180, z / 180, 21, 3, 0.5, 2), 12);
      expect(rt.ex.ridged(x / 240, z / 60, 7, 2)).toBeCloseTo(ridged(x / 240, z / 60, 7, 2), 12);

      const wasmReg = REGION_PRIORITY[rt.ex.regionAtIdx(x, z)];
      expect(wasmReg).toBe(regionAt(x, z));
    }
  });

  it('builds 451x451 distance fields, 901x901 heightGrid, 900x900 paintGrid, and chunk pos/normals matching reference', () => {
    setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
    try {
      const g = heightGrid()!;
      expect(g.length).toBe(GRID_N * GRID_N);
      expect(riverDistAt(0, 0)).toBeGreaterThanOrEqual(0);
      expect(waterDistAt(-700, -680)).toBeGreaterThanOrEqual(0);
      expect(borderDistAt(400, 100)).toBeGreaterThanOrEqual(0);
      expect(roadDistAt(0, -200)).toBeLessThan(10);
      expect(paintAt(-520, 60)).toBeDefined();

      const rt = wasmSyncChunkGridAndBridges(g, bridges())!;
      expect(rt).not.toBeNull();
      // Test a sloped chunk with rivers/bridges
      const i0 = 128, i1 = 192, j0 = 128, j1 = 192;
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
