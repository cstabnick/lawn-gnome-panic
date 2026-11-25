// Micro- and scenario benchmark for Gnomomia's terrain, 3D A* pathfinding, chunk meshing and minimap tile generation.
// Usage: node games/gnomes-of-gnomomia/scripts/bench-wasm.mjs
import { build } from 'esbuild';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const hasWasm = existsSync(join(root, 'src/wasm/terrainWasm.ts'));

const dir = mkdtempSync(join(tmpdir(), 'gnomomia-bench-'));
const out = join(dir, 'bench.mjs');
let M;
try {
  await build({
    stdin: {
      contents: [
        "export { findPath3 } from './src/pathfind.ts';",
        "export { createTerrain } from './src/terrainCore.ts';",
        "export { ZONES, OBJECTS } from './src/content.ts';",
        "export { loadWalkGrid } from './src/walkBake.ts';",
        "export { loadWorldDeltas } from './src/worldDeltas.ts';",
        "export { loadWorldPaint } from './src/worldPaint.ts';",
        hasWasm ? "export * from './src/wasm/terrainWasm.ts';" : '',
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
    external: ['three', '@lawn/gnome'],
  });
  M = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (M.initGnomomiaWasm) await M.initGnomomiaWasm();

const t = M.createTerrain({ zones: M.ZONES, objects: M.OBJECTS, checkCondition: () => true });
const deltas = M.loadWorldDeltas();
if (deltas) t.setDeltas(deltas);
const paint = M.loadWorldPaint();
if (paint) t.setPaint(paint);
const walk = M.loadWalkGrid();
if (walk) t.setWalkGrid(walk);

const tLive = M.createTerrain({ zones: M.ZONES, objects: M.OBJECTS, checkCondition: () => true });
if (deltas) tLive.setDeltas(deltas);
if (paint) tLive.setPaint(paint);

const routes = [
  [{ x: 3, z: 3 }, { x: 10, z: -88 }],
  [{ x: 3, z: 0 }, { x: 10, z: -70 }],
  [{ x: 10, z: -88 }, { x: 0, z: -240 }],
  [{ x: 3, z: -240 }, { x: 65, z: -195 }],
  [{ x: 0, z: -242 }, { x: -10, z: -280 }],
  [{ x: 0, z: -242 }, { x: -10, z: -220 }],
  [{ x: 0, z: -242 }, { x: 0, z: -352 }],
  [{ x: 3, z: -240 }, { x: -10, z: -150 }],
];

function bench(name, runs, fn) {
  fn(); // warmup
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const med = samples[samples.length >> 1];
  const min = samples[0];
  return { name, medMs: +med.toFixed(2), minMs: +min.toFixed(2) };
}

const results = [];

// 1. All 8 long cross-zone & town routes (baked walk grid)
results.push(bench('8 world routes (baked)', 7, () => {
  for (const [a, b] of routes) {
    M.findPath3({ x: a.x, y: t.heightAt(a.x, a.z), z: a.z }, { x: b.x, y: t.heightAt(b.x, b.z), z: b.z }, t.standY);
  }
}));

// 2. Worst-case walled/distant click (8000-node stall cutoff — the classic 1+ s freeze)
results.push(bench('stall/unreachable click (8k nodes)', 5, () => {
  M.findPath3({ x: 3, y: t.heightAt(3, 3), z: 3 }, { x: 200, y: 0, z: -640 }, t.standY);
}));

// 3. All 8 routes with live (unbaked) collider + terrain queries
results.push(bench('8 world routes (live colliders)', 5, () => {
  for (const [a, b] of routes) {
    M.findPath3({ x: a.x, y: tLive.heightAt(a.x, a.z), z: a.z }, { x: b.x, y: tLive.heightAt(b.x, b.z), z: b.z }, tLive.standY);
  }
}));

// 4. 25 LOD-0 terrain chunks (33x33 heights + 2048 triangle colours + flat normals)
results.push(bench('25 LOD0 chunk mesh buffers', 7, () => {
  let sink = 0;
  for (let ci = -2; ci <= 2; ci++) {
    for (let cj = -6; cj <= -2; cj++) {
      const cx = ci * 64 + 32, cz = cj * 64 + 32;
      if (t.buildChunkBuffers) {
        const b = t.buildChunkBuffers(cx, cz, 64, 32);
        sink += b.positions[1] + b.colors[0];
      } else {
        const x0 = ci * 64, z0 = cj * 64;
        for (let j = 0; j <= 32; j++) for (let i = 0; i <= 32; i++) sink += t.heightAt(x0 + i * 2, z0 + j * 2);
        for (let j = 0; j < 32; j++) for (let i = 0; i < 32; i++) {
          sink += t.groundColourAt(x0 + i * 2 + 0.66, z0 + j * 2 + 0.66);
          sink += t.groundColourAt(x0 + i * 2 + 1.33, z0 + j * 2 + 1.33);
        }
      }
    }
  }
  if (sink === 1e99) console.log(sink);
}));

// 5. 25 minimap 32x32 tiles
results.push(bench('25 minimap 32x32 tiles', 7, () => {
  let sink = 0;
  for (let ci = -2; ci <= 2; ci++) {
    for (let cj = -6; cj <= -2; cj++) {
      const x0 = ci * 64, z0 = cj * 64;
      if (t.buildMinimapPixels) {
        const px = t.buildMinimapPixels(x0, z0, 64, 32, -0.6);
        sink += px[0];
      } else {
        for (let py = 0; py < 32; py++) {
          const wz = z0 + (py + 0.5) * 2;
          for (let px = 0; px < 32; px++) {
            const wx = x0 + (px + 0.5) * 2;
            sink += t.heightAt(wx, wz) < -0.6 ? 1 : t.groundColourAt(wx, wz);
          }
        }
      }
    }
  }
  if (sink === 1e99) console.log(sink);
}));

console.table(results);
