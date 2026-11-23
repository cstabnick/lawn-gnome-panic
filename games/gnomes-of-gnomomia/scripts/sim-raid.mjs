// Raid sim: runs every raid x class in the combat arena, with its helpers, and prints win rate and median clear time
// against the 2-3 minute target (RAID_TUNING.targetSeconds). Bundles src/ with esbuild, like sim-balance.mjs.
// Usage: npm run sim:raid -w games/gnomes-of-gnomomia -- [--raid=<id>] [--class=<id>] [--seeds=30] [--json] [--check]
// --check exits 1 when any row is OUT of the band.
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, '..');
const dir = mkdtempSync(join(tmpdir(), 'gnomomia-sim-raid-'));
const out = join(dir, 'sim-raid-bundle.mjs');

await build({
  stdin: {
    contents: [
      "export * from './src/sim/raidScenarios.ts';",
      "export { RAIDS } from './src/content.ts';",
      "export { RAID_TUNING } from './src/data/raidTuning.ts';",
    ].join('\n'),
    resolveDir: rootDir,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'error',
});

let sim;
try {
  sim = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const args = process.argv.slice(2);
const flags = {};
for (const a of args) {
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq === -1) flags[a.slice(2)] = true;
  else flags[a.slice(2, eq)] = a.slice(eq + 1);
}

const seeds = Math.max(1, Number(flags.seeds ?? 30));
const raidFilter = typeof flags.raid === 'string' ? flags.raid : null;
const classFilter = typeof flags.class === 'string' ? flags.class : null;
const jsonOut = flags.json === true;
const check = flags.check === true;

const raids = Object.values(sim.RAIDS).filter((r) => !raidFilter || r.id === raidFilter);
if (raids.length === 0) {
  console.log('No raids in content yet.');
  process.exit(0);
}

const classes = classFilter ? [classFilter] : ['warden', 'slinger', 'mage'];
const [lo, hi] = sim.RAID_TUNING.targetSeconds;
const rows = sim.runRaidSims(seeds, raids.map((r) => r.id), classes);

if (jsonOut) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  console.log(`=== GNOMOMIA RAID SIM (seeds=${seeds}, target ${lo}-${hi} s, win rate >= 80%) ===\n`);
  const header = ['raid', 'level', 'class', 'win %', 'median s', ''];
  const body = rows.map((row) => {
    const raid = sim.RAIDS[row.raidId];
    return [
      row.raidId,
      String(raid?.level ?? '?'),
      row.classId,
      `${(row.winRate * 100).toFixed(0)}%`,
      row.medianSeconds.toFixed(0),
      row.inBand ? 'OK' : 'OUT',
    ];
  });
  const widths = header.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd();
  console.log(line(header));
  for (const b of body) console.log(line(b));
}

const outRows = rows.filter((row) => !row.inBand);
if (check && outRows.length > 0) {
  console.error(`\nsim:raid --check: ${outRows.length} row(s) outside the band.`);
  process.exit(1);
}
