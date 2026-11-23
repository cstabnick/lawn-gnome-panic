// Scores many worlds' daily rows (and bot rows, divergence and performance when measured) against the bands and
// formats the result as a plain-text table.
import { BANDS, BOT_BANDS, DIVERGENCE_BAND, PERF_BANDS, WORLD_BOT_BANDS, type BandBase } from './bands';
import type { BotRow } from './bots';
import type { DailyRow } from './types';

export interface BandResult { band: BandBase; values: number[]; inBand: number; measured: number; passShare: number; pass: boolean | null }
export interface Scorecard { seeds: number; days: number; results: BandResult[]; joint: number } // joint = sum(weight x pass) / sum(weight) over measured bands

/** Optional measurements. Without them the scorecard is the society and world bands only, as before. */
export interface ScoreExtra {
  bots?: readonly (readonly BotRow[])[];                         // one bot-row list per seed
  divergence?: readonly { bot: number; null: number }[];         // per seed, divergence at day 30
  perf?: { stepMs: number; snapshotBytes: number[] };            // snapshotBytes: [day 30, day 120] when reached
}

const MIB = 1024 * 1024;
const GROUPS = ['World', 'Society', 'Players', 'Performance'] as const;
type Group = (typeof GROUPS)[number];
const SOCIETY_IDS = new Set(['factions-d60', 'hhi-d60', 'top-share-d60', 'havens-up', 'handovers', 'quests-open-d10', 'reach']);
const PLAYER_IDS = new Set([...BOT_BANDS.map((b) => b.id), DIVERGENCE_BAND.id]);

function groupOf(id: string): Group {
  if (id.startsWith('perf')) return 'Performance';
  if (PLAYER_IDS.has(id)) return 'Players';
  if (SOCIETY_IDS.has(id)) return 'Society';
  return 'World';
}

function resultOf(band: BandBase, values: number[]): BandResult {
  const inBand = values.filter((v) => v >= band.lo && v <= band.hi).length;
  const measured = values.length;
  const passShare = measured > 0 ? inBand / measured : 0;
  return { band, values, inBand, measured, passShare, pass: measured > 0 ? passShare >= band.share : null };
}

/** One value per run, skipping runs where the metric cannot be measured. */
function perRun<T>(runs: readonly (readonly T[])[], metric: (xs: readonly T[]) => number | null): number[] {
  const values: number[] = [];
  for (const xs of runs) {
    const v = metric(xs);
    if (v !== null && Number.isFinite(v)) values.push(v);
  }
  return values;
}

export function score(runs: readonly (readonly DailyRow[])[], days: number, extra: ScoreExtra = {}): Scorecard {
  const results: BandResult[] = BANDS.map((band) => resultOf(band, days >= band.day ? perRun(runs, band.metric) : []));
  if (extra.bots) {
    for (const band of BOT_BANDS) results.push(resultOf(band, perRun(extra.bots, band.metric)));
    for (const band of WORLD_BOT_BANDS) results.push(resultOf(band, days >= band.day ? perRun(runs, band.metric) : []));
  }
  if (extra.divergence) {
    results.push(resultOf(DIVERGENCE_BAND, extra.divergence.map((d) => (d.bot > 2 * d.null ? 1 : 0))));
  }
  if (extra.perf) {
    const { stepMs, snapshotBytes } = extra.perf;
    results.push(resultOf(PERF_BANDS.step, [stepMs]));
    if (snapshotBytes[0] !== undefined) results.push(resultOf(PERF_BANDS.snap30, [snapshotBytes[0] / MIB]));
    if (snapshotBytes[1] !== undefined) results.push(resultOf(PERF_BANDS.snap120, [snapshotBytes[1] / MIB]));
  }
  let wSum = 0, wPass = 0;
  for (const r of results) {
    if (r.pass === null) continue;
    wSum += r.band.weight;
    if (r.pass) wPass += r.band.weight;
  }
  return { seeds: runs.length, days, results, joint: wSum > 0 ? wPass / wSum : 0 };
}

export function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const num = (x: number): string => (Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(3));

function table(head: string[], body: string[][]): string {
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((r) => r[i].length)));
  const line = (cells: string[]) => cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ').trimEnd();
  return [line(head), widths.map((w) => '-'.repeat(w)).join('  '), ...body.map(line)].join('\n');
}

export function formatScorecard(card: Scorecard): string {
  const head = ['band', 'target', 'in band', 'needed', 'result', 'median'];
  const sections = GROUPS.map((group) => {
    const rs = card.results.filter((r) => groupOf(r.band.id) === group);
    if (rs.length === 0) return null;
    const body = rs.map((r) => {
      const med = median(r.values);
      return [
        r.band.label,
        `[${num(r.band.lo)}, ${num(r.band.hi)}]`,
        r.measured > 0 ? `${pct(r.passShare)} (${r.inBand}/${r.measured})` : '-',
        pct(r.band.share),
        r.pass === null ? 'n/a' : r.pass ? 'PASS' : 'FAIL',
        med === null ? '-' : num(med),
      ];
    });
    return [group, table(head, body)].join('\n');
  }).filter((s): s is string => s !== null);
  return [
    sections.join('\n\n'),
    '',
    `joint score ${card.joint.toFixed(2)}`,
  ].join('\n');
}
