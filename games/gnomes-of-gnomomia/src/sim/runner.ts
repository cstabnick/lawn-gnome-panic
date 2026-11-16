import { mulberry32 } from '../rules';
import { createArena } from './arena';
import { formatLoadoutLabel } from './loadout';
import {
  SIM_STEP_S,
  type AgentPolicy,
  type BalanceDiagnostic,
  type LoadoutSpec,
  type ScenarioSpec,
  type SimRunResult,
  type SimSummary,
} from './types';

export function runScenario(
  scenario: ScenarioSpec,
  loadout: LoadoutSpec,
  policy: AgentPolicy,
  seed = 1,
): SimRunResult {
  const arena = createArena(scenario, loadout, seed);
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const maxSeconds = scenario.maxSeconds ?? (scenario.kind === 'boss' ? 240 : 120);
  const maxSteps = Math.ceil(maxSeconds / SIM_STEP_S);

  try {
    for (let i = 0; i < maxSteps && !arena.isDone(); i++) {
      const obs = arena.observe();
      const action = policy.decide(obs, rng);
      arena.step(action, SIM_STEP_S);
    }
    return arena.result(seed);
  } finally {
    arena.dispose();
  }
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

function normalizeRecord(totals: Record<string, number>): Record<string, number> {
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  if (sum <= 0) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(totals)) {
    out[k] = Number((v / sum).toFixed(3));
  }
  return out;
}

export function diagnoseSummary(
  scenario: ScenarioSpec,
  loadout: LoadoutSpec,
  policy: AgentPolicy,
  summary: Omit<SimSummary, 'diagnostics'>,
): BalanceDiagnostic[] {
  const diags: BalanceDiagnostic[] = [];

  if (policy.id === 'tactical') {
    const minWin = scenario.kind === 'boss' ? 0.6 : 0.7;
    if (summary.winRate < minWin) {
      const topCause = Object.entries(summary.deathCauses).sort((a, b) => b[1] - a[1])[0];
      diags.push({
        tag: 'OVERTUNED',
        message: `${scenario.id} (${summary.loadoutLabel}) Tactical winRate ${(summary.winRate * 100).toFixed(0)}% < ${(minWin * 100).toFixed(0)}%${topCause ? ` (top death: ${topCause[0]})` : ''}`,
      });
    }
    if (scenario.kind === 'duel' && summary.winRate >= 0.9 && summary.medianTtkSeconds < 4.5 && summary.hpRemainingPct.p50 > 0.85) {
      diags.push({
        tag: 'UNDERTUNED',
        message: `${scenario.id} (${summary.loadoutLabel}) dies in ${summary.medianTtkSeconds.toFixed(1)}s with ${(summary.hpRemainingPct.p50 * 100).toFixed(0)}% HP left`,
      });
    }
  }

  if (policy.id === 'greedy-berserker' && scenario.kind === 'boss' && summary.winRate >= 0.75) {
    diags.push({
      tag: 'FACE_TANKABLE_BOSS',
      message: `${scenario.id} (${summary.loadoutLabel}) beaten at ${(summary.winRate * 100).toFixed(0)}% by GreedyBerserker (no dodging/healing)`,
    });
  }

  if (policy.id === 'passive-turtler' && scenario.mechanic && summary.winRate >= 0.5) {
    diags.push({
      tag: 'PASSIVE_STALL_WIN',
      message: `${scenario.id} (${summary.loadoutLabel}) beaten at ${(summary.winRate * 100).toFixed(0)}% by PassiveTurtler despite mechanic '${scenario.mechanic}'`,
    });
  }

  if ((loadout.classId === 'mage') && summary.oomRate > 0.5) {
    diags.push({
      tag: 'HIGH_OOM_RATE',
      message: `${scenario.id} (${summary.loadoutLabel}) went OOM in ${(summary.oomRate * 100).toFixed(0)}% of runs`,
    });
  }

  return diags;
}

export function runMonteCarlo(
  scenario: ScenarioSpec,
  loadout: LoadoutSpec,
  policy: AgentPolicy,
  opts?: { seeds?: number | readonly number[] },
): SimSummary {
  const seedList: number[] = Array.isArray(opts?.seeds)
    ? [...opts.seeds]
    : Array.from({ length: typeof opts?.seeds === 'number' ? opts.seeds : 50 }, (_, i) => i + 1);

  const results: SimRunResult[] = seedList.map((s) => runScenario(scenario, loadout, policy, s));
  const runs = results.length;
  const wins = results.filter((r) => r.won);
  const winRate = runs > 0 ? wins.length / runs : 0;

  const ttkSource = wins.length > 0 ? wins : results;
  const ttks = ttkSource.map((r) => r.durationSeconds).sort((a, b) => a - b);
  const hps = results.map((r) => r.hpRemainingPct).sort((a, b) => a - b);
  const hits = results.map((r) => r.playerHitsLanded).sort((a, b) => a - b);

  const potionsUsedAvg = runs > 0 ? results.reduce((a, r) => a + r.potionsUsed, 0) / runs : 0;
  const oomRate = runs > 0 ? results.filter((r) => r.wentOom).length / runs : 0;

  const totalSpawned = results.reduce((a, r) => a + r.telegraphsSpawned, 0);
  const totalDodged = results.reduce((a, r) => a + r.telegraphsDodged, 0);
  const telegraphDodgeRate = totalSpawned > 0 ? totalDodged / totalSpawned : 1;

  const dealtTotals: Record<string, number> = {};
  const takenTotals: Record<string, number> = {};
  const deathCounts: Record<string, number> = {};

  for (const r of results) {
    for (const [k, v] of Object.entries(r.damageDealtBySource)) {
      dealtTotals[k] = (dealtTotals[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(r.damageTakenBySource)) {
      takenTotals[k] = (takenTotals[k] ?? 0) + v;
    }
    if (!r.won) {
      deathCounts[r.deathCause] = (deathCounts[r.deathCause] ?? 0) + 1;
    }
  }

  const base: Omit<SimSummary, 'diagnostics'> = {
    scenarioId: scenario.id,
    loadoutLabel: formatLoadoutLabel(loadout),
    policyId: policy.id,
    runs,
    winRate: Number(winRate.toFixed(3)),
    medianTtkSeconds: Number(percentile(ttks, 0.5).toFixed(2)),
    hpRemainingPct: {
      p10: Number(percentile(hps, 0.1).toFixed(3)),
      p50: Number(percentile(hps, 0.5).toFixed(3)),
      p90: Number(percentile(hps, 0.9).toFixed(3)),
    },
    playerHitsLanded: { p50: percentile(hits, 0.5) },
    potionsUsedAvg: Number(potionsUsedAvg.toFixed(2)),
    oomRate: Number(oomRate.toFixed(3)),
    telegraphDodgeRate: Number(telegraphDodgeRate.toFixed(3)),
    damageDealtShare: normalizeRecord(dealtTotals),
    damageTakenShare: normalizeRecord(takenTotals),
    deathCauses: normalizeRecord(deathCounts),
  };

  return {
    ...base,
    diagnostics: diagnoseSummary(scenario, loadout, policy, base),
  };
}

export function formatSummaryTable(summaries: readonly SimSummary[]): string {
  const header =
    'Scenario'.padEnd(23) +
    'Loadout'.padEnd(29) +
    'Policy'.padEnd(18) +
    'Win%'.padStart(6) +
    'MedTTK'.padStart(8) +
    'HP(p50)'.padStart(9) +
    '  Note / Top Death';
  const sep = '-'.repeat(header.length + 22);
  const lines = [header, sep];

  for (const s of summaries) {
    const winStr = `${Math.round(s.winRate * 100)}%`.padStart(6);
    const ttkStr = `${s.medianTtkSeconds.toFixed(1)}s`.padStart(8);
    const hpStr = `${Math.round(s.hpRemainingPct.p50 * 100)}%`.padStart(9);
    let note = 'OK';
    if (s.diagnostics.length > 0) {
      note = s.diagnostics.map((d) => `[${d.tag}]`).join(' ');
    } else if (s.winRate < 0.5) {
      const top = Object.entries(s.deathCauses).sort((a, b) => b[1] - a[1])[0];
      note = top ? `${top[0]} (${Math.round(top[1] * 100)}%)` : 'FAIL';
    } else if (s.potionsUsedAvg > 0) {
      note = `OK (${s.potionsUsedAvg.toFixed(1)} pot avg)`;
    }
    lines.push(
      s.scenarioId.padEnd(23) +
        s.loadoutLabel.padEnd(29) +
        s.policyId.padEnd(18) +
        winStr +
        ttkStr +
        hpStr +
        '  ' +
        note,
    );
  }
  return lines.join('\n');
}
