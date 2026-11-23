// Scores many worlds' daily rows against BANDS and formats the result as a plain-text table.
import { BANDS, type Band } from './bands';
import type { DailyRow } from './types';

export interface BandResult { band: Band; values: number[]; inBand: number; measured: number; passShare: number; pass: boolean | null }
export interface Scorecard { seeds: number; days: number; results: BandResult[]; joint: number } // joint = sum(weight x pass) / sum(weight) over measured bands

export function score(runs: readonly (readonly DailyRow[])[], days: number): Scorecard {
  const results: BandResult[] = BANDS.map((band) => {
    const values: number[] = [];
    if (days >= band.day) {
      for (const rows of runs) {
        const v = band.metric(rows);
        if (v !== null && Number.isFinite(v)) values.push(v);
      }
    }
    const inBand = values.filter((v) => v >= band.lo && v <= band.hi).length;
    const measured = values.length;
    const passShare = measured > 0 ? inBand / measured : 0;
    return { band, values, inBand, measured, passShare, pass: measured > 0 ? passShare >= band.share : null };
  });
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
  const body = card.results.map((r) => {
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
  return [
    table(['band', 'target', 'in band', 'needed', 'result', 'median'], body),
    '',
    `joint score ${card.joint.toFixed(2)}`,
  ].join('\n');
}
