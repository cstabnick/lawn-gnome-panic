import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BALANCE_CONFIG, ORIGINAL_BALANCE_CONFIG, type SimBalanceConfig } from '../src/balance';
import { quantile, runRoundRobin, runSeries, type BotFactory, type MatchTelemetry } from '../src/ai/eval';
import {
  entropy,
  fitWinProb,
  gei,
  geiBand,
  leadChanges,
  leverageIndex,
  mixedNashRow,
  pooledRate,
  rocAuc,
  shareBelow,
  winnerMaxDeficit,
  type TracePoint,
} from './analytics';
import { recordMatch, type MatchEvents } from './events';
import { noPassBot, noTurboBot, personas, skillLadder } from './bench';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Regulation length in live seconds (4 quarters of 45 s). */
const REGULATION_SEC = 4 * 45;
/** Seconds per sim tick at the default 60 Hz step. */
const TICK_SEC = 1 / 60;

interface MirrorMatch {
  telemetry: MatchTelemetry;
  events: MatchEvents;
  /** Score-level trace: diff (home - away) at each score, bracketed by frac 0 and frac 1. */
  trace: TracePoint[];
}

interface BandTarget {
  metric: string;
  value: number;
  display: string;
  target: string;
  pass: (v: number) => boolean;
}

function arg(args: string[], name: string, fallback: string): string {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return quantile(sorted, 0.5);
}

function mean(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

/**
 * Builds the score trace of one match from its score events. Diff is piecewise
 * constant between scores, so this is exact for the score lead, not for the clock.
 */
function traceOf(events: MatchEvents, telemetry: MatchTelemetry): TracePoint[] {
  const total = events.totalSec > 0 ? events.totalSec : 1;
  const pts: TracePoint[] = [{ frac: 0, diff: 0 }];
  for (const s of events.scores) {
    pts.push({ frac: Math.min(1, s.elapsedSec / total), diff: s.homeScore - s.awayScore });
  }
  pts.push({ frac: 1, diff: telemetry.homeScore - telemetry.awayScore });
  return pts;
}

/** Lead of the home side at the last trace point at or before frac f. */
function diffAt(trace: TracePoint[], f: number): number {
  let d = 0;
  for (const p of trace) {
    if (p.frac <= f) d = p.diff;
    else break;
  }
  return d;
}

/** Share of matches won by `a` (a is home on even games, away on odd, via runSeries). */
function winRateOf(
  a: BotFactory,
  b: BotFactory,
  games: number,
  baseSeed: number,
  balance: Partial<SimBalanceConfig>,
): number {
  const res = runSeries(a, b, {
    games,
    baseSeed,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
    balance,
  });
  let wins = 0;
  for (const m of res.matches) {
    const aWon = m.homeBotId === a.id ? m.winner === 0 : m.winner === 1;
    if (aWon) wins++;
  }
  return res.matches.length ? wins / res.matches.length : 0;
}

export async function main(args: string[]): Promise<void> {
  const t0 = performance.now();
  const orig = args.includes('--orig');
  const n = Math.max(1, Math.round(Number(arg(args, '--n', '60'))));
  const label = arg(args, '--label', orig ? 'orig' : 'default');
  const seed0 = Math.round(Number(arg(args, '--seed0', '10000')));
  const base: SimBalanceConfig = orig ? ORIGINAL_BALANCE_CONFIG : DEFAULT_BALANCE_CONFIG;
  const fireOff: Partial<SimBalanceConfig> = { ...base, fireShotBonus: 0, fireTurboDrainScale: 1 };
  // Persona round-robin: an even number of games per pair so side-swapping is balanced.
  const personaGames = 2 * Math.max(1, Math.round(n / 8));

  console.log(`Scorecard "${label}": n=${n}, seeds ${seed0}..${seed0 + n - 1}, balance=${orig ? 'ORIGINAL' : 'DEFAULT'}`);

  const ladder = skillLadder();

  // (1) Mirror matches: medium (150 ms, human-fair) vs medium, with event logs.
  const mirror: MirrorMatch[] = [];
  for (let i = 0; i < n; i++) {
    const { telemetry, events } = recordMatch({
      homeBot: ladder.medium,
      awayBot: ladder.medium,
      seed: seed0 + i,
      quarterSeconds: 45,
      difficulty: 'pro',
      balance: base,
    });
    mirror.push({ telemetry, events, trace: traceOf(events, telemetry) });
  }
  console.log(`  mirror matches done (${mirror.length})`);

  const homeWon = mirror.map((m) => m.telemetry.winner === 0);
  // Fit WP from both perspectives (home trace with homeWon, negated trace with !homeWon), so the
  // model is symmetric in the lead even when one side wins most matches.
  const model = fitWinProb(
    [
      ...mirror.map((m) => m.trace),
      ...mirror.map((m) => m.trace.map((p) => ({ frac: p.frac, diff: -p.diff }))),
    ],
    [...homeWon, ...homeWon.map((w) => !w)],
  );
  const wpPaths = mirror.map((m) => m.trace.map((p) => model.predict(p.diff, p.frac)));
  const geis = mirror.map((m, i) => gei(wpPaths[i], m.events.totalSec, REGULATION_SEC));

  const allSwings: number[] = [];
  for (const wp of wpPaths) {
    for (let i = 1; i < wp.length; i++) allSwings.push(Math.abs(wp[i] - wp[i - 1]));
  }
  const leverage = leverageIndex(allSwings);
  const garbageShare = shareBelow(leverage, 0.3);

  const bandCounts: Record<string, number> = { dud: 0, average: 0, thriller: 0, heartPounder: 0 };
  for (const g of geis) bandCounts[geiBand(g)]++;

  const allScores = mirror.flatMap((m) => m.events.scores);
  const dunkShare = allScores.length ? allScores.filter((s) => s.kind === 'dunk').length / allScores.length : 0;
  const allPossessions = mirror.flatMap((m) => m.events.possessions);
  const meanPasses = allPossessions.length ? mean(allPossessions.map((p) => p.passes)) : 0;
  const meanPossSec = allPossessions.length
    ? mean(allPossessions.map((p) => (p.endTick - p.startTick) * TICK_SEC))
    : 0;
  const ppg = mean(mirror.flatMap((m) => [m.telemetry.home.pts, m.telemetry.away.pts]));
  const leadChangeMean = mean(mirror.map((m) => leadChanges(m.trace.map((p) => p.diff))));
  const deficitMean = mean(
    mirror.map((m) => winnerMaxDeficit(m.trace.map((p) => p.diff), m.telemetry.winner === 0)),
  );
  const comebackRate = mean(mirror.map((m) => {
    const diffs = m.trace.map((p) => p.diff);
    return winnerMaxDeficit(diffs, m.telemetry.winner === 0) >= 8 ? 1 : 0;
  }));
  // Early-lead AUC is computed from both perspectives: each match contributes the home lead with
  // label homeWon, and the away lead (negated) with label !homeWon. Mirror matches can be lopsided
  // toward one side (home won every smoke match), which would leave one class empty otherwise.
  const earlyAuc = (f: number): number => {
    const scores: number[] = [];
    const labels: boolean[] = [];
    mirror.forEach((m, i) => {
      const d = diffAt(m.trace, f);
      scores.push(d, -d);
      labels.push(homeWon[i], !homeWon[i]);
    });
    return rocAuc(scores, labels);
  };
  const auc25 = earlyAuc(0.25);
  const auc50 = earlyAuc(0.5);
  const homeWinRate = mean(homeWon.map((w) => (w ? 1 : 0)));
  const fireOnRate = pooledRate(
    mirror.map((m) => m.events.shotsOnFire[1].made),
    mirror.map((m) => m.events.shotsOnFire[1].att),
  );
  const fireOffRate = pooledRate(
    mirror.map((m) => m.events.shotsOnFire[0].made),
    mirror.map((m) => m.events.shotsOnFire[0].att),
  );
  const medianGei = median(geis);
  console.log('  mirror metrics done');

  // (2) Skill spread: strong vs weak, with fire and with fire off (same seeds).
  const strongVsWeak = winRateOf(ladder.strong, ladder.weak, n, seed0, base);
  const strongVsWeakFireOff = winRateOf(ladder.strong, ladder.weak, n, seed0, fireOff);
  console.log('  skill spread done');

  // (3) Restricted play: strong vs the same bot without passing, or without turbo.
  const strongVsNoPass = winRateOf(ladder.strong, noPassBot(ladder.strong), n, seed0, base);
  const strongVsNoTurbo = winRateOf(ladder.strong, noTurboBot(ladder.strong), n, seed0, base);
  console.log('  restricted play done');

  // (4) Persona round-robin and its mixed-strategy entropy.
  const roster = personas();
  const rr = runRoundRobin(roster, {
    games: personaGames,
    baseSeed: seed0 + 100000,
    quarterSeconds: 45,
    difficulty: 'pro',
    rosterMode: 'balanced',
    balance: base,
  });
  const ids = roster.map((p) => p.id);
  const M = ids.map((a) =>
    ids.map((b) => {
      if (a === b) return 0.5;
      const cell = rr.matrix[a]?.[b];
      return cell && cell.games > 0 ? cell.wins / cell.games : 0.5;
    }),
  );
  const nash = mixedNashRow(M);
  const nashEntropy = entropy(nash) / Math.log2(ids.length);
  console.log('  persona round-robin done');

  const targets: BandTarget[] = [
    { metric: 'Points per team per game (4x45 s)', value: ppg, display: ppg.toFixed(1), target: '30-60', pass: (v) => v >= 30 && v <= 60 },
    { metric: 'Median GEI', value: medianGei, display: medianGei.toFixed(2), target: '3-7', pass: (v) => v >= 3 && v <= 7 },
    {
      metric: 'Average + thriller share of matches',
      value: (bandCounts.average + bandCounts.thriller) / n,
      display: pct((bandCounts.average + bandCounts.thriller) / n),
      target: 'above 50% (mostly average and thriller)',
      pass: (v) => v > 0.5,
    },
    { metric: 'Dunk share of scores', value: dunkShare, display: pct(dunkShare), target: '10-25%', pass: (v) => v >= 0.1 && v <= 0.25 },
    { metric: 'Mean possession seconds', value: meanPossSec, display: meanPossSec.toFixed(2), target: '4-9', pass: (v) => v >= 4 && v <= 9 },
    { metric: 'Mean passes per possession', value: meanPasses, display: meanPasses.toFixed(2), target: '1.5 or more', pass: (v) => v >= 1.5 },
    { metric: 'Mean lead changes', value: leadChangeMean, display: leadChangeMean.toFixed(2), target: '4 or more', pass: (v) => v >= 4 },
    { metric: 'Early-lead AUC at 50%', value: auc50, display: auc50.toFixed(3), target: 'below 0.85', pass: (v) => v < 0.85 },
    { metric: 'Strong vs weak win rate', value: strongVsWeak, display: pct(strongVsWeak), target: 'above 70%', pass: (v) => v > 0.7 },
    { metric: 'Strong vs noPass(strong)', value: strongVsNoPass, display: pct(strongVsNoPass), target: 'above 60%', pass: (v) => v > 0.6 },
    { metric: 'Garbage-time share (LI < 0.3)', value: garbageShare, display: pct(garbageShare), target: 'below 35%', pass: (v) => v < 0.35 },
    { metric: 'Persona Nash entropy (normalised)', value: nashEntropy, display: nashEntropy.toFixed(3), target: 'above 0.6', pass: (v) => v > 0.6 },
  ];

  const mark = (t: BandTarget): string => (t.pass(t.value) ? 'PASS' : 'FAIL');

  const lines: string[] = [];
  lines.push(`# GBA GJAM scorecard: ${label}`, '');
  lines.push(
    `Balance: ${orig ? '`ORIGINAL_BALANCE_CONFIG`' : '`DEFAULT_BALANCE_CONFIG`'}. ${n} mirror matches and ${n} matches per skill/restriction pair, seeds \`${seed0}\`+. Persona round-robin: ${personaGames} games per pair. Generated ${new Date().toISOString()}.`,
    '',
  );
  lines.push('## Targets', '', '| Metric | Value | Target | Result |', '|---|---:|---|---|');
  for (const t of targets) lines.push(`| ${t.metric} | ${t.display} | ${t.target} | ${mark(t)} |`);

  lines.push('', '## Supporting metrics', '');
  lines.push('| Metric | Value |', '|---|---:|');
  lines.push(`| Mean GEI | ${mean(geis).toFixed(2)} |`);
  lines.push(`| GEI bands (dud / average / thriller / heartPounder) | ${bandCounts.dud} / ${bandCounts.average} / ${bandCounts.thriller} / ${bandCounts.heartPounder} |`);
  lines.push(`| Early-lead AUC at 25% | ${auc25.toFixed(3)} |`);
  lines.push(`| Home-side win rate in mirror matches (should be near 50%) | ${pct(homeWinRate)} |`);
  lines.push(`| Comeback rate (winner trailed by 8+) | ${pct(comebackRate)} |`);
  lines.push(`| Winner's mean max deficit | ${deficitMean.toFixed(2)} |`);
  lines.push(`| FG% on fire (pooled) | ${pct(fireOnRate)} |`);
  lines.push(`| FG% not on fire (pooled) | ${pct(fireOffRate)} |`);
  lines.push(`| Flame lift (on fire minus off, points) | ${((fireOnRate - fireOffRate) * 100).toFixed(1)} |`);
  lines.push(`| Strong vs weak, fire off | ${pct(strongVsWeakFireOff)} |`);
  lines.push(`| Strong vs noTurbo(strong) | ${pct(strongVsNoTurbo)} |`);
  lines.push(`| Matches with a score | ${mirror.filter((m) => m.events.scores.length > 0).length} / ${n} |`);

  lines.push('', '## Persona round-robin (row wins vs column)', '');
  lines.push(`| Persona | ${ids.map((id) => `\`${id}\``).join(' | ')} | Nash weight |`);
  lines.push(`|---|${ids.map(() => '---:').join('|')}|---:|`);
  ids.forEach((id, i) => {
    lines.push(`| \`${id}\` | ${M[i].map((v) => v.toFixed(2)).join(' | ')} | ${nash[i].toFixed(3)} |`);
  });
  lines.push('');

  const reportDir = path.resolve(__dirname, 'results', 'scorecard', label);
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'REPORT.md'), lines.join('\n'));
  fs.writeFileSync(
    path.join(reportDir, 'scorecard.json'),
    JSON.stringify(
      {
        label,
        balance: orig ? 'ORIGINAL' : 'DEFAULT',
        n,
        seed0,
        personaGames,
        generatedAt: new Date().toISOString(),
        targets: targets.map((t) => ({ metric: t.metric, value: t.value, target: t.target, pass: t.pass(t.value) })),
        metrics: {
          ppg,
          medianGei,
          meanGei: mean(geis),
          geiBands: bandCounts,
          dunkShare,
          meanPossSec,
          meanPasses,
          leadChanges: leadChangeMean,
          auc25,
          auc50,
          garbageShare,
          comebackRate,
          deficitMean,
          fireOnRate,
          fireOffRate,
          strongVsWeak,
          strongVsWeakFireOff,
          strongVsNoPass,
          strongVsNoTurbo,
          nashEntropy,
        },
        personas: { ids, matrix: M, nash },
      },
      null,
      2,
    ),
  );

  const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
  console.log('');
  for (const t of targets) {
    console.log(`${mark(t).padEnd(5)} ${t.metric.padEnd(38)} ${t.display.padStart(8)}   target ${t.target}`);
  }
  console.log(`\nDone in ${elapsed}s. Wrote ${path.join(reportDir, 'REPORT.md')} and scorecard.json`);
}
