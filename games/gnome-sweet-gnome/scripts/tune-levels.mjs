// Level tuner: plays BASE_LEVELS with the smart bot and writes src/levelTuning.ts so each level's smart win rate
// lands on its target (targetFor in levels.ts). Knobs, in order:
//   1. moves: a comfortable budget that grows slowly with the level number (moveBudget below);
//   2. the collect goal's count (added to the level if it has none): binary search for the target win rate;
//   3. if the level is too hard even with no collect goal, more moves (up to 45).
// Star scores come from the smart bot's winning scores (10th / 50th / 85th percentile).
// Usage: npm run tune -w games/gnome-sweet-gnome -- [--seeds=24] [--levels=1-10]
import { build } from 'esbuild';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = join(here, '..');
const dir = mkdtempSync(join(tmpdir(), 'gsg-tune-'));
const out = join(dir, 'tune-bundle.mjs');
await build({
  stdin: {
    contents: "export * from './src/sim/assess.ts'; export * from './src/levels.ts'; export { TILE_KINDS } from './src/engine/types.ts';",
    resolveDir: gameDir,
    loader: 'ts',
  },
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error',
});
let sim;
try { sim = await import(pathToFileURL(out).href); } finally { rmSync(dir, { recursive: true, force: true }); }
const { BASE_LEVELS, applyTuning, playLevel, assessLevel, TILE_KINDS } = sim;

const flags = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('='); return [k, v ?? true];
}));
const seeds = Number(flags.seeds ?? 24);
let only = null;
if (flags.levels) {
  only = new Set();
  for (const part of String(flags.levels).split(',')) {
    const [a, b] = part.split('-').map(Number);
    for (let i = a; i <= (b || a); i++) only.add(i);
  }
}

const moveBudget = (id) => Math.min(30, 18 + Math.floor((id - 1) / 3));

function winRate(level) {
  let w = 0;
  for (let s = 1; s <= seeds; s++) if (playLevel(level, 'smart', s).won) w++;
  return w / seeds;
}

const file = join(gameDir, 'src/levelTuning.ts');
const prev = existsSync(file) ? readFileSync(file, 'utf8') : '';
const old = {};
const m = prev.match(/LEVEL_TUNING: Record<number, LevelTuning> = (\{[\s\S]*\});/);
if (m) Object.assign(old, JSON.parse(m[1].replace(/^(\s*)(\d+):/gm, '$1"$2":').replace(/,(\s*[}\]])/g, '$1')));

const result = { ...old };
const t0 = Date.now();
for (const base of BASE_LEVELS) {
  if (only && !only.has(base.id)) continue;
  const existing = base.goals.find((g) => g.type === 'collect');
  const kind = existing ? existing.kind : TILE_KINDS[base.id % base.kinds];
  const at = (moves, count) => applyTuning(base, { moves, collect: { kind, count }, stars: base.stars, measured: 0 });
  let moves = moveBudget(base.id);
  let count = 0;
  if (winRate(at(moves, 0)) < base.target) {
    // Too hard with no collect goal at all: add moves.
    while (moves < 45 && winRate(at(moves, 0)) < base.target) moves++;
  } else {
    // Largest count whose win rate is still >= target, then the closer of it and count + 1.
    let lo = 0, hi = 8;
    while (hi < 400 && winRate(at(moves, hi)) >= base.target) { lo = hi; hi *= 2; }
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (winRate(at(moves, mid)) >= base.target) lo = mid; else hi = mid; }
    const wl = winRate(at(moves, lo)), wh = winRate(at(moves, hi));
    count = Math.abs(wh - base.target) < Math.abs(wl - base.target) ? hi : lo;
  }
  const tuned = at(moves, count);
  const rep = assessLevel(tuned, seeds, ['smart']);
  result[base.id] = { moves, ...(count > 0 || existing ? { collect: { kind, count } } : {}), stars: rep.suggestedStars, measured: rep.win.smart };
  process.stderr.write(`level ${base.id}: moves ${moves}, collect ${count} ${kind}, smart ${Math.round(rep.win.smart * 100)}% (target ${Math.round(base.target * 100)}%)\n`);
}

const body = Object.keys(result).map(Number).sort((a, b) => a - b)
  .map((id) => `  ${id}: ${JSON.stringify(result[id])},`).join('\n');
const header = prev.split('export const LEVEL_TUNING')[0];
writeFileSync(file, `${header}export const LEVEL_TUNING: Record<number, LevelTuning> = {\n${body}\n};\n`);
console.log(`Wrote src/levelTuning.ts (${seeds} seeds, ${((Date.now() - t0) / 1000).toFixed(1)} s).`);
