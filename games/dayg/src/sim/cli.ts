// Headless sim CLI: runs worlds and returns a scorecard, a chronicle or a daily-row table as strings.
// Pure: no node modules, no DOM, no Date (performance.now is used only for timing). scripts/sim.mjs prints stdout,
// writes rows to sim-out/rows.jsonl and exits.
import { packSnapshot, makeSnapshot } from '../net/snapshot';
import { runWithBots, divergence, type BotKind, type BotRow } from './bots';
import { formatScorecard, score, type ScoreExtra } from './scorecard';
import { TUNING, withOverrides } from './tuning';
import type { DailyRow, MapKind, Tuning } from './types';
import { createWorld, runWorld, stepWorld } from './world';

const BOT_KINDS: readonly BotKind[] = ['quester', 'scavenger', 'solo', 'friends'];
const PERTURB_DAY = 30;
const PERF_DAYS = [30, 120];

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  return v === undefined || v.startsWith('--') ? undefined : v;
}

function intFlag(argv: string[], name: string, def: number): number {
  const v = flag(argv, name);
  if (v === undefined) return def;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new Error(`${name} needs a positive integer, got "${v}"`);
  return n;
}

function botKindsFlag(argv: string[]): BotKind[] {
  const v = flag(argv, '--bots');
  if (v === undefined) return [];
  return v.split(',').map((s) => s.trim()).filter((s) => s.length > 0).map((s) => {
    if (!(BOT_KINDS as readonly string[]).includes(s)) throw new Error(`--bots: unknown kind "${s}" (use ${BOT_KINDS.join(', ')})`);
    return s as BotKind;
  });
}

function rowTable(rows: readonly DailyRow[]): string {
  const head = ['day', 'alive', 'hatless', 'alone', 'pack', 'band', 'settl', 'food', 'water', 'pFood', 'sinks', 'deaths', 'chron'];
  const body = rows.map((r) => [
    String(r.day), `${r.alive}/${r.start}`, `${r.hatless}/${r.hatlessStart}`,
    String(r.modes.alone), String(r.modes.pack), String(r.modes.band), String(r.modes.settlement),
    r.lootLeft.food.toFixed(2), r.lootLeft.water.toFixed(2), r.prices.food.toFixed(2), r.hordeInSinks.toFixed(2),
    String(Object.values(r.deaths).reduce((a, b) => a + b, 0)), String(r.chronicleLines),
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i].length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padStart(widths[i])).join('  ');
  return [line(head), ...body.map(line)].join('\n');
}

/** Times every stepWorld of one run and packs snapshots at day 30 and day 120 (when the run reaches them). */
async function timeRun(seed: number, days: number, tuning: Tuning, map: MapKind): Promise<{ stepMs: number; snapshotBytes: number[] }> {
  const { world: w, streams: s } = createWorld(seed, tuning, undefined, { map });
  const tpd = w.tuning.clock.ticksPerDay;
  const total = days * tpd;
  const snapAt = new Set(PERF_DAYS.map((d) => d * tpd));
  const snapshotBytes: number[] = [];
  let ms = 0;
  for (let i = 1; i <= total; i++) {
    const t0 = performance.now();
    stepWorld(w, s);
    ms += performance.now() - t0;
    if (snapAt.has(i)) snapshotBytes.push((await packSnapshot(makeSnapshot(w, s, []))).length);
  }
  return { stepMs: total > 0 ? ms / total : 0, snapshotBytes };
}

export async function runCli(argv: string[], opts: { profile?: unknown }): Promise<{ exitCode: number; stdout: string; rows: string }> {
  const days = intFlag(argv, '--days', 60);
  const tuning = opts.profile === undefined ? TUNING : withOverrides(TUNING, opts.profile);
  const map: MapKind = flag(argv, '--map') === 'full' ? 'full' : 'slice';
  const rows: string[] = [];
  const keep = (seed: number, daily: readonly DailyRow[]) => { for (const r of daily) rows.push(JSON.stringify({ seed, ...r })); };

  if (argv.includes('--chronicle')) {
    const seed = intFlag(argv, '--chronicle', 1);
    const { world, rows: daily } = runWorld(seed, days, tuning, { map });
    keep(seed, daily);
    const out = [`DayG sim: 1 seeds x ${days} days (chronicle of seed ${seed})`];
    for (const l of world.chronicle) out.push(l.text); // each chronicle text already starts with its date
    const last = daily[daily.length - 1];
    out.push(`seed ${seed}: ${world.chronicle.length} chronicle lines over ${days} days, alive ${last ? last.alive : 0}/${world.ledger.npcsStart},` +
      ` hatless ${last ? last.hatless : world.ledger.hatlessStart}/${world.ledger.hatlessStart}`);
    return { exitCode: 0, stdout: out.join('\n'), rows: rows.join('\n') };
  }

  if (argv.includes('--seed')) {
    const seed = intFlag(argv, '--seed', 1);
    const { rows: daily } = runWorld(seed, days, tuning, { map });
    keep(seed, daily);
    return { exitCode: 0, stdout: [`DayG sim: 1 seeds x ${days} days (seed ${seed})`, rowTable(daily)].join('\n'), rows: rows.join('\n') };
  }

  const seeds = intFlag(argv, '--seeds', 50);
  const seedBase = argv.includes('--holdout') ? 1001 : 1;
  const kinds = botKindsFlag(argv);
  const perturb = argv.includes('--perturb');
  const botsOn = kinds.length > 0 || perturb;
  const useKinds: BotKind[] = kinds.length > 0 ? kinds : ['quester', 'solo'];

  const runs: DailyRow[][] = [];
  const bots: BotRow[][] = [];
  const divergences: { bot: number; null: number }[] = [];
  for (let i = 0; i < seeds; i++) {
    const seed = seedBase + i;
    const { rows: daily } = runWorld(seed, days, tuning, { map });
    keep(seed, daily);
    runs.push(daily);
    if (botsOn) {
      const b = runWithBots(seed, days, useKinds, { tuning, map });
      bots.push(b.bots);
      for (const r of b.bots) rows.push(JSON.stringify({ ...r, bot: true }));
    }
    if (perturb && days >= PERTURB_DAY) {
      const none = runWithBots(seed, PERTURB_DAY, [], { tuning, map });
      const nudged = runWithBots(seed, PERTURB_DAY, [], { tuning, map, perturb: true });
      const withBot = runWithBots(seed, PERTURB_DAY, useKinds, { tuning, map });
      divergences.push({ bot: divergence(withBot.world, none.world), null: divergence(nudged.world, none.world) });
    }
  }

  const extra: ScoreExtra = {};
  if (botsOn) extra.bots = bots;
  if (divergences.length > 0) extra.divergence = divergences;
  if (argv.includes('--perf')) extra.perf = await timeRun(seedBase, days, tuning, map);
  const card = score(runs, days, extra);
  const failed = card.results.some((r) => r.pass === false);
  // Failed bands never change the exit code (contract): only a crash exits non-zero.
  const exitCode = 0;

  if (argv.includes('--json')) {
    const json = {
      seeds: card.seeds, days: card.days, joint: card.joint,
      results: card.results.map((r) => ({
        id: r.band.id, label: r.band.label, lo: r.band.lo, hi: r.band.hi, share: r.band.share, weight: r.band.weight,
        inBand: r.inBand, measured: r.measured, passShare: r.passShare, pass: r.pass, values: r.values,
      })),
    };
    return { exitCode, stdout: JSON.stringify(json, null, 2), rows: rows.join('\n') };
  }

  const out = [`DayG sim: ${seeds} seeds x ${days} days${opts.profile === undefined ? '' : ' (profile)'}`, '', formatScorecard(card)];
  if (argv.includes('--check')) out.push(failed ? 'check: FAIL' : 'check: PASS');
  return { exitCode, stdout: out.join('\n'), rows: rows.join('\n') };
}
