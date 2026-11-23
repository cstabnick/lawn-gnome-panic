// DayG headless sim runner: bundles src/sim/cli.ts with esbuild, runs it, prints its output and writes the daily rows.
// Usage: npm run sim -w games/dayg -- [--seeds N] [--days D] [--profile <path.json>] [--check] [--chronicle [seed]] [--seed S] [--json]
import { build } from 'esbuild';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const rootDir = join(here, '..');
const dir = mkdtempSync(join(tmpdir(), 'dayg-sim-'));
const out = join(dir, 'sim-bundle.mjs');

await build({
  entryPoints: [join(rootDir, 'src/sim/cli.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: out,
  logLevel: 'error',
});

let cli;
try {
  cli = await import(pathToFileURL(out).href);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const argv = process.argv.slice(2);
let profile;
const pi = argv.indexOf('--profile');
if (pi !== -1) {
  const path = argv[pi + 1];
  if (!path || path.startsWith('--')) throw new Error('--profile needs a JSON file path');
  profile = JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
}

const t0 = Date.now();
const res = cli.runCli(argv, { profile });
const ms = Date.now() - t0;
if (res.stdout) process.stdout.write(res.stdout.endsWith('\n') ? res.stdout : res.stdout + '\n');
if (res.rows) {
  const outDir = join(rootDir, 'sim-out');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'rows.jsonl'), res.rows.endsWith('\n') ? res.rows : res.rows + '\n');
}
process.stderr.write(`(${ms} ms)\n`);
process.exit(res.exitCode);
