// Benchmark for Gnome Theft Auto's Wasm terrain, distance fields, paint grid, chunk mesher, static batcher & SIMD culler.
// Usage: npm run bench:wasm -w games/gnome-theft-auto
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dir = mkdtempSync(join(tmpdir(), 'gta-bench-'));
const out = join(dir, 'bench.mjs');
let M;
try {
  await build({
    stdin: {
      contents: [
        "export * as THREE from 'three';",
        "export { buildStaticPrefabs } from '@lawn/prefabs';",
        "export { initGtaWasm, wasmBuildDistanceFields } from './src/wasm/gtaWasm.ts';",
        "export { heightGrid, resetTerrainOptions, setTerrainOptions } from './src/terrain.ts';",
        "export { paintAt } from './src/terrainPaint.ts';",
        "export { buildTerrainChunks } from './src/terrainMesh.ts';",
        "export { registerCull, unregisterCull, updateCull, setCullScale } from './src/cull.ts';",
      ].join('\n'),
      resolveDir: root,
      sourcefile: 'bench-entry.ts',
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: out,
    logLevel: 'error',
  });
  M = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

await M.initGtaWasm();

const results = [];

// 1. Distance fields (451x451 x4) + 901x901 heightGrid
setTerrainAndTime();
function setTerrainAndTime() {
  M.setTerrainOptions({ amplitude: 1, testHill: false, landforms: true });
  const t0 = performance.now();
  M.heightGrid();
  results.push({ workload: 'fields (451^2 x4) + heightGrid (901^2)', ms: +(performance.now() - t0).toFixed(2) });
}

// 2. 900x900 surface paint grid
{
  const t0 = performance.now();
  M.paintAt(100, 100);
  results.push({ workload: 'terrainPaint raster (900^2)', ms: +(performance.now() - t0).toFixed(2) });
}

// 3. 15x15 terrain chunks (pos + bridge-aware normals + index + UV)
{
  // Minimal canvas stub for procedural ground textures in Node
  globalThis.document ??= {
    createElement(tag) {
      if (tag === 'canvas') {
        return {
          width: 64,
          height: 64,
          getContext: () => ({
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 1,
            fillRect() {},
            beginPath() {},
            moveTo() {},
            lineTo() {},
            stroke() {},
            arc() {},
            fill() {},
            createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            putImageData() {},
          }),
        };
      }
      return { style: {} };
    },
  };
  const scene = new M.THREE.Scene();
  const t0 = performance.now();
  M.buildTerrainChunks(scene);
  results.push({ workload: 'buildTerrainChunks (15x15 chunks)', ms: +(performance.now() - t0).toFixed(2) });
}

// 4. Static prefab batching (2,000 placements)
{
  const placements = [];
  const ids = ['campfire', 'crate', 'barrel', 'bench', 'signpost'];
  for (let i = 0; i < 2000; i++) {
    placements.push({
      id: ids[i % ids.length],
      x: (i % 50) * 3,
      y: 0,
      z: ((i / 50) | 0) * 3,
      yaw: i * 0.37,
      scale: 0.9 + (i % 5) * 0.05,
    });
  }
  M.buildStaticPrefabs(placements.slice(0, 20)); // warmup templates
  const t0 = performance.now();
  M.buildStaticPrefabs(placements, { lights: false });
  results.push({ workload: 'buildStaticPrefabs (2,000 props)', ms: +(performance.now() - t0).toFixed(2) });
}

// 5. 100 frames of SIMD updateCull over 3,000 entries
{
  M.setCullScale(1, 1);
  const objs = [];
  const geo = new M.THREE.BoxGeometry(1, 1, 1);
  const mat = new M.THREE.MeshBasicMaterial();
  for (let i = 0; i < 3000; i++) {
    const m = new M.THREE.Mesh(geo, mat);
    m.position.set(((i * 97) % 1600) - 800, 0, ((i * 53) % 1600) - 800);
    m.castShadow = true;
    m.updateMatrixWorld(true);
    M.registerCull(m, i % 10 === 0 ? 'gnome' : 'prop', { moves: i % 15 === 0 });
    objs.push(m);
  }
  M.updateCull(0, 0);
  const t0 = performance.now();
  for (let f = 0; f < 100; f++) {
    M.updateCull(f * 2.5, f * 1.5);
  }
  results.push({ workload: '100 frames updateCull (3,000 entries, 100% checked)', ms: +(performance.now() - t0).toFixed(2) });
  for (const m of objs) M.unregisterCull(m);
}

console.table(results);
