import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createChampionV2Bot } from '../src/ai';
import { DEFAULT_BALANCE_CONFIG, type SimBalanceConfig } from '../src/balance';
import { mulberry32, quantile, type BotFactory, type MatchTelemetry } from '../src/ai/eval';
import {
  cliffsDelta,
  latinHypercube,
  leadChanges,
  varghaDelaneyA12,
  wilcoxonSignedRankP,
  winnerMaxDeficit,
} from './analytics';
import { recordMatch, type MatchEvents } from './events';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Ticks are simulated at 60 Hz (simulateMatch default dt). */
const DT_SEC = 1 / 60;
/** Lead of this size or more counts as a comeback for the winner. */
const COMEBACK_DEFICIT = 8;
/** Seed for the Latin hypercube itself (independent of the match seeds). */
const SAMPLER_SEED = 20260421;

/** Knobs swept by this script, with their sampling ranges (linear). */
export const SWEEP_KNOBS = [
  { key: 'moveSpeedScale', lo: 0.65, hi: 0.9 },
  { key: 'dunkBaseReach', lo: 1.6, hi: 2.2 },
  { key: 'stealBaseChance', lo: 0.1, hi: 0.35 },
  { key: 'shoveTurnoverChance', lo: 0.1, hi: 0.5 },
  { key: 'shoveTurboCost', lo: 30, hi: 60 },
  { key: 'shoveWhiffCooldownSec', lo: 1.0, hi: 2.5 },
  { key: 'threeBaseChance', lo: 0.08, hi: 0.2 },
  { key: 'contestScale', lo: 1.0, hi: 1.8 },
] as const satisfies ReadonlyArray<{ key: keyof SimBalanceConfig; lo: number; hi: number }>;

export type SweepKnob = (typeof SWEEP_KNOBS)[number]['key'];

/** Metrics computed per config (pooled over that config's mirror matches). */
export const METRIC_KEYS = [
  'ppg',
  'dunkShare',
  'swing',
  'possSec',
  'passesPerPoss',
  'comebackRate',
  'leadChanges',
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

export const METRIC_LABELS: Record<MetricKey, string> = {
  ppg: 'Points per team per game',
  dunkShare: 'Dunk share of scores',
  swing: 'Swing per score (median, see notes)',
  possSec: 'Mean possession seconds',
  passesPerPoss: 'Mean passes per possession',
  comebackRate: 'Comeback rate (winner was down 8+)',
  leadChanges: 'Mean lead changes',
};

interface MatchStats {
  /** Points per team in this match. */
  ppg: number;
  dunks: number;
  scores: number;
  /** Sum of |change in home-away diff| across score steps. */
  swingSum: number;
  possSecSum: number;
  possCount: number;
  passesSum: number;
  comeback: boolean;
  leadChanges: number;
}

interface ConfigResult {
  index: number;
  knobs: Record<SweepKnob, number>;
  metrics: Record<MetricKey, number>;
  /** Per-match points per team, paired by seed with the other configs (CRN). */
  perMatchPpg: number[];
}

interface DefaultComparison {
  index: number;
  a12: number;
  cliffsDelta: number;
  wilcoxonP: number;
  meanPpgDelta: number;
}

function argValue(args: string[], flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i < 0 || i + 1 >= args.length) return fallback;
  const v = Number(args[i + 1]);
  if (!Number.isFinite(v)) throw new Error(`${flag} expects a number`);
  return v;
}

function argString(args: string[], flag: string, fallback: string): string {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : fallback;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Average ranks (ties share the mean rank). */
function averageRanks(values: number[]): number[] {
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const ranks = new Array<number>(values.length).fill(0);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && values[order[j + 1]] === values[order[i]]) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k]] = avgRank;
    i = j + 1;
  }
  return ranks;
}

/** Spearman rank correlation (Pearson on average ranks). Returns 0 when either side is constant. */
export function spearman(xs: number[], ys: number[]): number {
  const rx = averageRanks(xs);
  const ry = averageRanks(ys);
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

function matchStats(ev: MatchEvents, tel: MatchTelemetry): MatchStats {
  const diffs = [0, ...ev.scores.map((s) => s.homeScore - s.awayScore)];
  let swingSum = 0;
  for (let i = 1; i < diffs.length; i++) swingSum += Math.abs(diffs[i] - diffs[i - 1]);
  let possSecSum = 0;
  let passesSum = 0;
  for (const p of ev.possessions) {
    possSecSum += (p.endTick - p.startTick) * DT_SEC;
    passesSum += p.passes;
  }
  const homeWon = tel.homeScore > tel.awayScore;
  return {
    ppg: (tel.homeScore + tel.awayScore) / 2,
    dunks: ev.scores.filter((s) => s.kind === 'dunk').length,
    scores: ev.scores.length,
    swingSum,
    possSecSum,
    possCount: ev.possessions.length,
    passesSum,
    comeback: winnerMaxDeficit(diffs, homeWon) >= COMEBACK_DEFICIT,
    leadChanges: leadChanges(diffs),
  };
}

/** Pooled metrics over one config's matches. */
function aggregate(stats: MatchStats[]): Record<MetricKey, number> {
  const sum = (f: (s: MatchStats) => number) => stats.reduce((acc, s) => acc + f(s), 0);
  const scores = sum((s) => s.scores);
  const possCount = sum((s) => s.possCount);
  // Per-score swing: each match's swing divided by its score count, then the median across matches.
  const perMatchSwing = stats
    .map((s) => (s.scores > 0 ? s.swingSum / s.scores : 0))
    .sort((a, b) => a - b);
  return {
    ppg: mean(stats.map((s) => s.ppg)),
    dunkShare: scores > 0 ? sum((s) => s.dunks) / scores : 0,
    swing: quantile(perMatchSwing, 0.5),
    possSec: possCount > 0 ? sum((s) => s.possSecSum) / possCount : 0,
    passesPerPoss: possCount > 0 ? sum((s) => s.passesSum) / possCount : 0,
    comebackRate: mean(stats.map((s) => (s.comeback ? 1 : 0))),
    leadChanges: mean(stats.map((s) => s.leadChanges)),
  };
}

function fmt(v: number, digits = 3): string {
  return Number.isFinite(v) ? v.toFixed(digits) : 'n/a';
}

export async function main(args: string[]): Promise<void> {
  const configCount = Math.max(1, Math.round(argValue(args, '--configs', 40)));
  const seedCount = Math.max(1, Math.round(argValue(args, '--seeds', 12)));
  const seed0 = Math.round(argValue(args, '--seed0', 1));
  const label = argString(args, '--label', 'default');
  const vsDefault = args.includes('--vs-default');

  const strong: BotFactory = { id: 'champion-v2', name: 'Champion v2', create: () => createChampionV2Bot() };
  const seeds = Array.from({ length: seedCount }, (_, i) => seed0 + i);
  const start = Date.now();

  // Same seed list for every config (common random numbers).
  const runMirror = (balance: Partial<SimBalanceConfig>) =>
    seeds.map((seed) => {
      const { telemetry, events } = recordMatch({
        homeBot: strong,
        awayBot: strong,
        seed,
        quarterSeconds: 45,
        decisionCadenceMs: 150,
        balance,
      });
      return matchStats(events, telemetry);
    });

  const samples = latinHypercube(configCount, SWEEP_KNOBS.length, mulberry32(SAMPLER_SEED));

  const configs: ConfigResult[] = [];
  for (let c = 0; c < configCount; c++) {
    const knobs = {} as Record<SweepKnob, number>;
    const balance: Partial<SimBalanceConfig> = {};
    SWEEP_KNOBS.forEach((spec, d) => {
      const v = spec.lo + samples[c][d] * (spec.hi - spec.lo);
      knobs[spec.key] = v;
      (balance as Record<string, number>)[spec.key] = v;
    });
    const stats = runMirror({ ...DEFAULT_BALANCE_CONFIG, ...balance });
    configs.push({
      index: c,
      knobs,
      metrics: aggregate(stats),
      perMatchPpg: stats.map((s) => s.ppg),
    });
    console.log(`config ${c + 1}/${configCount} done`);
  }

  // Knob x metric Spearman correlations across configs.
  const rho: Record<SweepKnob, Record<MetricKey, number>> = {} as never;
  for (const spec of SWEEP_KNOBS) {
    const xs = configs.map((c) => c.knobs[spec.key]);
    rho[spec.key] = {} as Record<MetricKey, number>;
    for (const m of METRIC_KEYS) {
      rho[spec.key][m] = spearman(xs, configs.map((c) => c.metrics[m]));
    }
  }

  let comparisons: DefaultComparison[] | null = null;
  let defaultMeanPpg = 0;
  if (vsDefault) {
    const defaultStats = runMirror({ ...DEFAULT_BALANCE_CONFIG });
    const a = defaultStats.map((s) => s.ppg);
    defaultMeanPpg = mean(a);
    comparisons = configs.map((c) => ({
      index: c.index,
      // a = default, b = sampled config; A12 > 0.5 means the sampled config scores more.
      a12: varghaDelaneyA12(a, c.perMatchPpg),
      cliffsDelta: cliffsDelta(a, c.perMatchPpg),
      wilcoxonP: wilcoxonSignedRankP(a, c.perMatchPpg),
      meanPpgDelta: c.metrics.ppg - defaultMeanPpg,
    }));
  }

  const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
  const outDir = path.resolve(__dirname, 'results', 'sweep', label);
  fs.mkdirSync(outDir, { recursive: true });

  const sweepJson = {
    label,
    configs: configCount,
    seeds: seeds,
    samplerSeed: SAMPLER_SEED,
    knobRanges: SWEEP_KNOBS,
    metricKeys: METRIC_KEYS,
    configResults: configs.map(({ index, knobs, metrics }) => ({ index, knobs, metrics })),
    perMatchPpg: configs.map((c) => ({ index: c.index, ppg: c.perMatchPpg })),
    spearman: rho,
    defaultMeanPpg: vsDefault ? defaultMeanPpg : null,
    vsDefault: comparisons,
    elapsedSec: Number(elapsedSec),
  };
  fs.writeFileSync(path.join(outDir, 'sweep.json'), JSON.stringify(sweepJson, null, 2));

  // REPORT.md
  const L: string[] = [];
  L.push(`# CRN knob sweep: ${label}`, '');
  L.push(
    `${configCount} Latin-hypercube configs x ${seedCount} mirror matches (champion-v2 vs champion-v2, 45 s quarters, 150 ms cadence). ` +
      `Seeds ${seeds[0]}..${seeds[seeds.length - 1]} are shared by every config (common random numbers). Elapsed ${elapsedSec}s.`,
    '',
  );
  L.push(
    '## Notes',
    '',
    '- Swing is the median over matches of (sum of |change in home-away diff| per score step) / (score count). ' +
      'Score-step paths only move by the points scored, so this equals points per score; it is a coarse proxy. ' +
      'Real GEI needs per-tick win probability (see scorecard).',
    '- Dunk share, possession seconds and passes per possession are pooled over all matches in a config.',
    '',
    '## Sampled configs',
    '',
    `| # | ${SWEEP_KNOBS.map((k) => k.key).join(' | ')} |`,
    `|---:|${SWEEP_KNOBS.map(() => '---:').join('|')}|`,
  );
  for (const c of configs) {
    L.push(`| ${c.index + 1} | ${SWEEP_KNOBS.map((k) => fmt(c.knobs[k.key])).join(' | ')} |`);
  }
  L.push('', '## Metrics per config', '');
  L.push(`| # | ${METRIC_KEYS.map((m) => METRIC_LABELS[m]).join(' | ')} |`);
  L.push(`|---:|${METRIC_KEYS.map(() => '---:').join('|')}|`);
  for (const c of configs) {
    L.push(`| ${c.index + 1} | ${METRIC_KEYS.map((m) => fmt(c.metrics[m])).join(' | ')} |`);
  }
  L.push('', '## Spearman rho: knob vs metric (across configs)', '');
  L.push(`| Knob | ${METRIC_KEYS.join(' | ')} |`);
  L.push(`|---|${METRIC_KEYS.map(() => '---:').join('|')}|`);
  for (const spec of SWEEP_KNOBS) {
    L.push(`| ${spec.key} | ${METRIC_KEYS.map((m) => fmt(rho[spec.key][m], 2)).join(' | ')} |`);
  }
  L.push('', '## Which knob moves which metric (ranked by |rho|)', '');
  for (const m of METRIC_KEYS) {
    const ranked = SWEEP_KNOBS.map((k) => ({ key: k.key, r: rho[k.key][m] })).sort(
      (a, b) => Math.abs(b.r) - Math.abs(a.r),
    );
    L.push(`- **${METRIC_LABELS[m]}**: ` + ranked.map((x) => `${x.key} (${fmt(x.r, 2)})`).join(', '));
  }
  if (comparisons) {
    L.push('', `## Versus DEFAULT (same seeds, paired per match on points per team)`, '');
    L.push(`DEFAULT mean PPG: ${fmt(defaultMeanPpg, 2)}. A12 > 0.5 means the sampled config scores more than DEFAULT.`, '');
    L.push('| # | PPG delta | A12 | Cliff delta | Wilcoxon p |');
    L.push('|---:|---:|---:|---:|---:|');
    for (const d of comparisons) {
      L.push(
        `| ${d.index + 1} | ${fmt(d.meanPpgDelta, 2)} | ${fmt(d.a12)} | ${fmt(d.cliffsDelta)} | ${fmt(d.wilcoxonP)} |`,
      );
    }
  }
  L.push('');
  fs.writeFileSync(path.join(outDir, 'REPORT.md'), L.join('\n'));

  console.log(`\nSweep "${label}" done in ${elapsedSec}s.`);
  console.log(`Wrote ${path.join(outDir, 'REPORT.md')}`);
  console.log(`Wrote ${path.join(outDir, 'sweep.json')}`);
}
