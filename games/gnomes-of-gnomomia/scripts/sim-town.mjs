// Town-walk report: simulated gnomes walk between the landmarks, doorways and NPCs of every town with the game's real
// terrain (shipped deltas, paint and baked walk grid), pathfinding and walk speed. Bundles the TS with esbuild, as
// bake-walk.mjs does, and prints one row per scenario.
// Usage: npm run sim:town -w games/gnomes-of-gnomomia -- [--town=thatchford] [--policy=scripted] [--seed=7] [--json]
// Exits 1 when a scenario has a leg that fails (okRate < 1) or a threat inside a town.
import { build } from 'esbuild';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const hasBlocks = existsSync(join(root, 'src/townBlocks.ts'));

const dir = mkdtempSync(join(tmpdir(), 'gnomomia-town-'));
const out = join(dir, 'town.mjs');
let M;
try {
  await build({
    stdin: {
      contents: [
        "export * from './src/sim/townWalk.ts';",
        "export * from './src/terrainCore.ts';",
        "export { ZONES, OBJECTS, SPAWNS } from './src/content.ts';",
        "export { loadWorldDeltas } from './src/worldDeltas.ts';",
        "export { loadWorldPaint } from './src/worldPaint.ts';",
        "export { loadWalkGrid } from './src/walkBake.ts';",
        "export { TOWNS } from './src/towns.ts';",
        hasBlocks ? "export { TOWN_BLOCKS } from './src/townBlocks.ts';" : 'export const TOWN_BLOCKS = [];',
      ].join('\n'),
      resolveDir: root, sourcefile: 'town-entry.ts', loader: 'ts',
    },
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
    external: ['three', '@lawn/gnome'],
  });
  M = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const flags = {};
for (const a of process.argv.slice(2)) {
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq === -1) flags[a.slice(2)] = true;
  else flags[a.slice(2, eq)] = a.slice(eq + 1);
}
const townFilter = typeof flags.town === 'string' ? flags.town : null;
const policyFilter = typeof flags.policy === 'string' ? flags.policy : null;
const seedOverride = typeof flags.seed === 'string' ? Number(flags.seed) : null;
const jsonOut = flags.json === true;

if (townFilter && !M.TOWNS.some((t) => t.id === townFilter)) {
  console.error(`Unknown town '${townFilter}'. Valid: ${M.TOWNS.map((t) => t.id).join(', ')}`);
  process.exit(2);
}

const { ZONES, OBJECTS, SPAWNS, createTerrain, loadWorldDeltas, loadWorldPaint, loadWalkGrid } = M;
const t = createTerrain({ zones: ZONES, objects: OBJECTS, checkCondition: () => true });
const deltas = loadWorldDeltas();
if (deltas) t.setDeltas(deltas);
const paint = loadWorldPaint();
if (paint) t.setPaint(paint);
const grid = loadWalkGrid();
if (grid) t.setWalkGrid(grid);

const blocks = M.TOWN_BLOCKS ?? [];
const specs = M.TOWN_WALK_SCENARIOS
  .filter((s) => (!townFilter || s.townId === townFilter) && (!policyFilter || s.policy === policyFilter))
  .map((s) => ({
    ...s,
    seed: seedOverride ?? s.seed,
    skip: blocks.filter((b) => b.town === s.townId).map((b) => b.waypoint),
  }));

const results = [];
for (const spec of specs) {
  const t0 = performance.now();
  const r = M.simulateTownWalk(t, spec, SPAWNS);
  results.push({ id: M.townWalkId(spec), ms: Math.round(performance.now() - t0), skipped: spec.skip, ...r });
}

const median = (xs) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const bad = results.filter((r) => r.okRate < 1 || r.threats > 0);
if (jsonOut) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(`=== GNOMOMIA TOWN WALKS (${results.length} scenarios, walk grid ${grid ? 'baked' : 'live'}, ${blocks.length} known blocks) ===\n`);
  const rows = [['town', 'policy', 'legs', 'ok%', 'med s/leg', 'threats', 'skipped', 'ms']];
  for (const r of results) {
    rows.push([
      r.townId, r.policy, String(r.legs.length), (r.okRate * 100).toFixed(0),
      median(r.legs.map((l) => l.seconds)).toFixed(1), String(r.threats), String(r.skipped.length), String(r.ms),
    ]);
  }
  const widths = rows[0].map((_, c) => Math.max(...rows.map((row) => row[c].length)));
  for (const row of rows) console.log(row.map((v, c) => (c < 2 ? v.padEnd(widths[c]) : v.padStart(widths[c]))).join('  '));
  console.log('\n=== FAILURES ===');
  const lines = results.flatMap((r) => r.failures.map((f) => `[${r.policy}] ${f}`));
  if (lines.length === 0) console.log('None.');
  for (const f of [...new Set(lines)]) console.log(f);
}
if (bad.length > 0) {
  for (const r of bad) {
    const why = [];
    if (r.okRate < 1) why.push(`${r.legs.filter((l) => !l.ok).length} of ${r.legs.length} legs failed`);
    if (r.threats > 0) why.push(`${r.threats} threat samples inside a town`);
    console.error(`FAIL ${r.id}: ${why.join(', ')}`);
  }
  process.exit(1);
}
process.exit(0);
