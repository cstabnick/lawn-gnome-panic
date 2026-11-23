// Headless sim CLI: runs worlds and returns a scorecard, a chronicle or a daily-row table as strings.
// Pure: no node modules, no DOM, no Date. scripts/sim.mjs prints stdout, writes rows to sim-out/rows.jsonl and exits.
import { formatScorecard, score } from './scorecard';
import { TUNING, withOverrides } from './tuning';
import type { DailyRow } from './types';
import { runWorld } from './world';

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

export function runCli(argv: string[], opts: { profile?: unknown }): { exitCode: number; stdout: string; rows: string } {
  const days = intFlag(argv, '--days', 60);
  const tuning = opts.profile === undefined ? TUNING : withOverrides(TUNING, opts.profile);
  const rows: string[] = [];
  const keep = (seed: number, daily: readonly DailyRow[]) => { for (const r of daily) rows.push(JSON.stringify({ seed, ...r })); };

  if (argv.includes('--chronicle')) {
    const seed = intFlag(argv, '--chronicle', 1);
    const { world, rows: daily } = runWorld(seed, days, tuning);
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
    const { rows: daily } = runWorld(seed, days, tuning);
    keep(seed, daily);
    return { exitCode: 0, stdout: [`DayG sim: 1 seeds x ${days} days (seed ${seed})`, rowTable(daily)].join('\n'), rows: rows.join('\n') };
  }

  const seeds = intFlag(argv, '--seeds', 50);
  const runs: DailyRow[][] = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const { rows: daily } = runWorld(seed, days, tuning);
    keep(seed, daily);
    runs.push(daily);
  }
  const card = score(runs, days);
  const failed = card.results.some((r) => r.pass === false);
  const exitCode = argv.includes('--check') && failed ? 1 : 0;

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
