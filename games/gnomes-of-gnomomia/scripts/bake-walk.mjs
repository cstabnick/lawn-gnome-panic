// Bakes the walkability grid the game ships (src/data/levels/walk.bake.json). Bundles the terrain code with esbuild and runs
// it in Node, so the bake uses exactly the code and zone data the game does.
// Usage (from the repo root): npm run bake-walk -w games/gnomes-of-gnomomia
// Run it after any change to zone data, stamps, deltas, WORLD or TUNING, then commit the file. check-bake fails until you do.
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outFile = join(root, 'src/data/levels/walk.bake.json');

const dir = mkdtempSync(join(tmpdir(), 'gnomomia-bake-'));
const out = join(dir, 'bake.mjs');
let M;
try {
  await build({
    stdin: {
      contents: `export * from './src/bakeWalk.ts';
export * from './src/terrainCore.ts';
export { ZONES, OBJECTS } from './src/content.ts';
export { loadWorldDeltas } from './src/worldDeltas.ts';`,
      resolveDir: root, sourcefile: 'bake-entry.ts', loader: 'ts',
    },
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
    // three and @lawn/gnome are not needed for terrain; the linter leaves them out the same way.
    external: ['three', '@lawn/gnome'],
  });
  M = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const { ZONES, OBJECTS, createTerrain, walkTileSpecs, bakeWalkTiles, computeBakeHash, loadWorldDeltas } = M;
const t = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => true });
const deltas = loadWorldDeltas();
if (deltas) t.setDeltas(deltas);

const specs = walkTileSpecs(ZONES);
const grid = bakeWalkTiles(t, []);
for (const spec of specs) {
  const t0 = performance.now();
  bakeWalkTiles(t, [spec], grid);
  console.log(`tile ${spec.id}: ${(performance.now() - t0).toFixed(0)} ms`);
}
grid.inputHash = computeBakeHash(t, ZONES);

writeFileSync(outFile, JSON.stringify(grid.toJSON(), null, 1) + '\n');
console.log(`wrote ${outFile} (${(statSync(outFile).size / 1024).toFixed(0)} KB, ${specs.length} tiles, hash ${grid.inputHash})`);
process.exit(0);
