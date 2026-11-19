// Level assessment CLI: bundles src/sim/* and src/levels.ts with esbuild and plays every level in Node.
// Usage: npm run assess -w games/gnome-sweet-gnome -- [--levels=1-10|4,7] [--seeds=40] [--bots=smart,greedy,random]
//        [--tune] [--json] [--strict]
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = join(here, '..');
const dir = mkdtempSync(join(tmpdir(), 'gsg-assess-'));
const out = join(dir, 'assess-bundle.mjs');

await build({
  stdin: {
    contents: [
      "export * from './src/sim/assess.ts';",
      "export * from './src/sim/bots.ts';",
      "export * from './src/levels.ts';",
    ].join('\n'),
    resolveDir: gameDir,
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

const { LEVELS, BOT_NAMES, assessLevel, suggestMoves, curveProblems, difficultyLabel } = sim;

const flags = {};
for (const a of process.argv.slice(2)) {
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq === -1) flags[a.slice(2)] = true;
  else flags[a.slice(2, eq)] = a.slice(eq + 1);
}

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function parseLevels(spec) {
  const ids = new Set();
  for (const part of spec.split(',').map((x) => x.trim()).filter(Boolean)) {
    const range = /^(\d+)-(\d+)$/.exec(part);
    if (range) {
      for (let i = Number(range[1]); i <= Number(range[2]); i++) ids.add(i);
    } else if (/^\d+$/.test(part)) {
      ids.add(Number(part));
    } else {
      die(`bad --levels entry: ${part}`);
    }
  }
  return LEVELS.filter((lv) => ids.has(lv.id));
}

const levels = typeof flags.levels === 'string' ? parseLevels(flags.levels) : LEVELS;
if (levels.length === 0) die('no levels selected');

const seeds = Math.max(1, Number(flags.seeds ?? 40));
if (!Number.isFinite(seeds)) die('--seeds must be a number');

let bots = BOT_NAMES;
if (typeof flags.bots === 'string') {
  bots = flags.bots.split(',').map((x) => x.trim()).filter(Boolean);
  for (const b of bots) if (!BOT_NAMES.includes(b)) die(`unknown bot: ${b}`);
}

const tune = flags.tune === true;
const jsonOut = flags.json === true;
const strict = flags.strict === true;

const started = Date.now();
const reports = [];
const tuned = new Map();
for (const level of levels) {
  process.stderr.write(`assessing ${level.id} ${level.name} (${seeds} seeds)...\n`);
  const report = assessLevel(level, seeds, bots);
  if (tune) {
    const moves = suggestMoves(level, seeds);
    const after = assessLevel({ ...level, moves }, seeds, ['smart']);
    report.suggestedMoves = moves;
    tuned.set(level.id, after.suggestedStars);
  }
  reports.push(report);
}
const problems = curveProblems(reports);
const seconds = ((Date.now() - started) / 1000).toFixed(1);

if (jsonOut) {
  process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`);
} else {
  const pctOf = (x) => (x === undefined ? '-' : `${Math.round(x * 100)}%`);
  const headers = ['#', 'name', 'moves', 'target', 'smart', 'greedy', 'random', 'difficulty', 'movesLeft', 'stars', 'verdict'];
  if (tune) headers.push('try moves', 'try stars');
  const rows = reports.map((r) => {
    const row = [
      String(r.id),
      r.name,
      String(r.moves),
      pctOf(r.target),
      pctOf(r.win.smart),
      pctOf(r.win.greedy),
      pctOf(r.win.random),
      difficultyLabel(r.win.smart ?? 0),
      r.movesLeftOnWin.toFixed(1),
      r.suggestedStars.join('/'),
      r.verdict,
    ];
    if (tune) row.push(String(r.suggestedMoves), (tuned.get(r.id) ?? []).join('/'));
    return row;
  });
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
  const line = (cells) => cells.map((c, i) => (i === 1 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ');
  process.stdout.write(`${line(headers)}\n`);
  for (const row of rows) process.stdout.write(`${line(row)}\n`);
  if (problems.length === 0) {
    process.stdout.write('\nCurve OK\n');
  } else {
    process.stdout.write('\nCurve problems:\n');
    for (const p of problems) process.stdout.write(`- ${p}\n`);
  }
  process.stdout.write(`\nTotal time: ${seconds}s\n`);
}

if (strict && problems.length > 0) process.exit(1);
