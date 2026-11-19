// Fails the build when the shipped walkability bake was not made from the current zone data, terrain and world settings.
// Usage (from the repo root): npm run check-bake -w games/gnomes-of-gnomomia   (also run by npm run build)
// Fix a failure with: npm run bake-walk -w games/gnomes-of-gnomomia, then commit src/data/levels/walk.bake.json.
import { build } from 'esbuild';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const bakeFile = join(root, 'src/data/levels/walk.bake.json');

const dir = mkdtempSync(join(tmpdir(), 'gnomomia-check-bake-'));
const out = join(dir, 'bake.mjs');
let M;
try {
  await build({
    stdin: {
      contents: `export * from './src/bakeWalk.ts';
export * from './src/terrainCore.ts';
export { ZONES, OBJECTS } from './src/content.ts';
export { loadWorldDeltas } from './src/worldDeltas.ts';`,
      resolveDir: root, sourcefile: 'check-entry.ts', loader: 'ts',
    },
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
    external: ['three', '@lawn/gnome'],
  });
  M = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const { ZONES, OBJECTS, createTerrain, walkTileSpecs, computeBakeHash, loadWorldDeltas } = M;
const t = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => true });
const deltas = loadWorldDeltas();
if (deltas) t.setDeltas(deltas);

const stale = (why) => {
  console.error(`walk bake is stale: run "npm run bake-walk -w games/gnomes-of-gnomomia" and commit the result (${why})`);
  process.exit(1);
};

let file;
try {
  file = JSON.parse(readFileSync(bakeFile, 'utf8'));
} catch (e) {
  stale(`cannot read ${bakeFile}: ${e.message}`);
}
const hash = computeBakeHash(t, ZONES);
if (file.inputHash !== hash) stale(`hash ${file.inputHash || '(none)'} vs ${hash}`);
const want = walkTileSpecs(ZONES).map((s) => s.id).sort();
const have = file.tiles.map((tile) => tile.id).sort();
if (JSON.stringify(want) !== JSON.stringify(have)) stale(`tiles [${have.join(', ')}] vs [${want.join(', ')}]`);
console.log('walk bake is up to date');
process.exit(0);
