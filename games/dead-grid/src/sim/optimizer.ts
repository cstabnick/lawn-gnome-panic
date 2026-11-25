import { createSim, DeadGridSim, type SimParams, type SimStats } from './bridge';

export type TunableKey =
  | 'zombieSpeed'
  | 'humanSpeed'
  | 'infectionChance'
  | 'hungerRate'
  | 'thirstRate'
  | 'lootRespawnRate'
  | 'cooperationBias'
  | 'banditry'
  | 'settlementGrowth'
  | 'roadDecayRate'
  | 'roadBuildCost'
  | 'waterFlowRate'
  | 'disasterRate'
  | 'initialHumans'
  | 'initialZombies';

export interface TunableParamDef {
  key: TunableKey;
  label: string;
  min: number;
  max: number;
  step: number;
  isInt?: boolean;
}

export const TUNABLE_PARAMS: TunableParamDef[] = [
  { key: 'zombieSpeed', label: 'Zombie Speed', min: 0.1, max: 1.0, step: 0.02 },
  { key: 'humanSpeed', label: 'Human Speed', min: 0.2, max: 1.0, step: 0.02 },
  { key: 'infectionChance', label: 'Infection %', min: 0.0, max: 1.0, step: 0.05 },
  { key: 'hungerRate', label: 'Hunger Drain', min: 0.2, max: 2.5, step: 0.1 },
  { key: 'thirstRate', label: 'Thirst Drain', min: 0.2, max: 2.5, step: 0.1 },
  { key: 'lootRespawnRate', label: 'Loot Respawn', min: 0.0, max: 2.5, step: 0.1 },
  { key: 'cooperationBias', label: 'PD Coop Bias', min: 0.0, max: 1.0, step: 0.05 },
  { key: 'banditry', label: 'Banditry %', min: 0.0, max: 1.0, step: 0.05 },
  { key: 'settlementGrowth', label: 'Society Growth', min: 0.2, max: 2.5, step: 0.1 },
  { key: 'roadDecayRate', label: 'Road Decay', min: 0.0, max: 1.5, step: 0.05 },
  { key: 'roadBuildCost', label: 'Road Cost', min: 0.25, max: 2.5, step: 0.05 },
  { key: 'waterFlowRate', label: 'Water Flow', min: 0.0, max: 2.0, step: 0.05 },
  { key: 'disasterRate', label: 'Disaster Rate', min: 0.0, max: 2.0, step: 0.05 },
  { key: 'initialHumans', label: 'Init Humans', min: 500, max: 12000, step: 500, isInt: true },
  { key: 'initialZombies', label: 'Init Zombies', min: 500, max: 30000, step: 500, isInt: true },
];

export type FitnessObjectiveId = 'balanced' | 'thriving' | 'republics' | 'chaotic';

export const FITNESS_OBJECTIVES: { id: FitnessObjectiveId; label: string; desc: string }[] = [
  { id: 'balanced', label: 'Balanced Apocalypse', desc: 'Sustained humans + zombies + societies + infrastructure' },
  { id: 'thriving', label: 'Thriving Civilization', desc: 'Maximizes human population, societies, farms & roads' },
  { id: 'republics', label: 'Utopian Republics', desc: 'Maximizes Republics, PD cooperation & territory' },
  { id: 'chaotic', label: 'Chaotic Survival', desc: 'Maximizes combat, disasters, zombies & narrow survival' },
];

export function computeFitness(s: SimStats, objective: FitnessObjectiveId): number {
  const pdTotal = s.pdCoops + s.pdDefects;
  const pdCoopPct = pdTotal > 0 ? (s.pdCoops / pdTotal) * 100 : 50;
  const infra = s.roadsBuilt + s.farmsBuilt * 2 + s.terraforms * 3;

  if (objective === 'thriving') {
    return (
      s.humans * 0.4 +
      s.settlements * 120 +
      s.republics * 350 +
      infra * 15 +
      pdCoopPct * 10
    );
  }
  if (objective === 'republics') {
    return (
      s.republics * 600 +
      s.settlements * 100 +
      pdCoopPct * 25 +
      s.territoryTiles * 0.15 +
      s.humans * 0.2
    );
  }
  if (objective === 'chaotic') {
    return (
      (s.humans > 20 ? 600 : 0) +
      s.totalZombiesKilled * 0.6 +
      s.totalTurned * 0.8 +
      s.disasters * 150 +
      s.zombies * 0.15
    );
  }
  // 'balanced'
  const balanceBonus = s.humans > 50 && s.zombies > 50 ? 500 : 0;
  const ratio = Math.min(s.humans, s.zombies) / Math.max(1, Math.max(s.humans, s.zombies));
  return (
    balanceBonus +
    ratio * 800 +
    s.settlements * 80 +
    s.republics * 200 +
    infra * 10 +
    s.humans * 0.15
  );
}

export interface EvalSummary {
  params: SimParams;
  meanFitness: number;
  minFitness: number;
  maxFitness: number;
  meanHumans: number;
  meanZombies: number;
  meanSettlements: number;
  meanRepublics: number;
  meanPdCoopPct: number;
  meanInfra: number;
  perSeed: { seed: number; fitness: number; stats: SimStats }[];
}

export interface SweepPoint {
  value: number;
  summary: EvalSummary;
}

export interface SweepResult {
  paramKey: TunableKey;
  paramLabel: string;
  objective: FitnessObjectiveId;
  seeds: number[];
  ticks: number;
  points: SweepPoint[];
  best: SweepPoint;
}

export interface OptimizerGenSample {
  gen: number;
  bestFitness: number;
  meanFitness: number;
  bestParams: SimParams;
  bestSummary: EvalSummary;
}

export interface OptimizerResult {
  objective: FitnessObjectiveId;
  tunedKeys: TunableKey[];
  seeds: number[];
  ticks: number;
  baseline: EvalSummary;
  best: EvalSummary;
  history: OptimizerGenSample[];
}

const yieldTick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

export function buildSeedList(baseSeed: number, count: number): number[] {
  const out: number[] = [];
  let s = baseSeed >>> 0 || 1337;
  for (let i = 0; i < count; i++) {
    out.push(s);
    s = (s * 1664525 + 1013904223) >>> 0 || i + 2;
  }
  return out;
}

export async function evaluateCandidate(
  sim: DeadGridSim,
  baseParams: SimParams,
  overrides: Partial<SimParams>,
  seeds: number[],
  ticks: number,
  objective: FitnessObjectiveId,
  onSeedDone?: () => void,
  shouldStop?: () => boolean,
): Promise<EvalSummary> {
  const candidate: SimParams = { ...baseParams, ...overrides, gridSize: 512 };
  const perSeed: { seed: number; fitness: number; stats: SimStats }[] = [];

  for (const sd of seeds) {
    if (shouldStop?.()) break;
    sim.reset(sd, candidate);
    sim.step(ticks);
    const stats = sim.readStats();
    perSeed.push({ seed: sd, fitness: computeFitness(stats, objective), stats });
    onSeedDone?.();
    await yieldTick();
  }

  const n = Math.max(1, perSeed.length);
  let sumFit = 0;
  let minFit = Infinity;
  let maxFit = -Infinity;
  let sumH = 0;
  let sumZ = 0;
  let sumSoc = 0;
  let sumRep = 0;
  let sumPd = 0;
  let sumInf = 0;

  for (const r of perSeed) {
    sumFit += r.fitness;
    if (r.fitness < minFit) minFit = r.fitness;
    if (r.fitness > maxFit) maxFit = r.fitness;
    sumH += r.stats.humans;
    sumZ += r.stats.zombies;
    sumSoc += r.stats.settlements;
    sumRep += r.stats.republics;
    const totPd = r.stats.pdCoops + r.stats.pdDefects;
    sumPd += totPd > 0 ? (r.stats.pdCoops / totPd) * 100 : 50;
    sumInf += r.stats.roadsBuilt + r.stats.farmsBuilt + r.stats.terraforms;
  }

  return {
    params: candidate,
    meanFitness: sumFit / n,
    minFitness: Number.isFinite(minFit) ? minFit : 0,
    maxFitness: Number.isFinite(maxFit) ? maxFit : 0,
    meanHumans: sumH / n,
    meanZombies: sumZ / n,
    meanSettlements: sumSoc / n,
    meanRepublics: sumRep / n,
    meanPdCoopPct: sumPd / n,
    meanInfra: sumInf / n,
    perSeed,
  };
}

export async function runParameterSweep(
  opts: {
    baseParams: SimParams;
    paramKey: TunableKey;
    min: number;
    max: number;
    stepsM: number;
    seedsN: number;
    baseSeed: number;
    ticks: number;
    objective: FitnessObjectiveId;
    sim?: DeadGridSim;
  },
  onProgress?: (done: number, total: number, points: SweepPoint[]) => void,
  shouldStop?: () => boolean,
): Promise<SweepResult> {
  const sim = opts.sim ?? (await createSim(opts.baseSeed, { ...opts.baseParams, gridSize: 512 }));
  const def = TUNABLE_PARAMS.find((p) => p.key === opts.paramKey)!;
  const seeds = buildSeedList(opts.baseSeed, opts.seedsN);
  const total = opts.stepsM * seeds.length;
  let done = 0;
  const points: SweepPoint[] = [];

  for (let m = 0; m < opts.stepsM; m++) {
    if (shouldStop?.()) break;
    const t = opts.stepsM <= 1 ? 0 : m / (opts.stepsM - 1);
    let val = opts.min + (opts.max - opts.min) * t;
    val = def.isInt ? Math.round(val) : Math.round(val * 1000) / 1000;

    const summary = await evaluateCandidate(
      sim,
      opts.baseParams,
      { [opts.paramKey]: val } as Partial<SimParams>,
      seeds,
      opts.ticks,
      opts.objective,
      () => {
        done++;
        onProgress?.(done, total, points);
      },
      shouldStop,
    );
    points.push({ value: val, summary });
    onProgress?.(done, total, points);
  }

  let best = points[0];
  for (const pt of points) {
    if (pt.summary.meanFitness > best.summary.meanFitness) best = pt;
  }

  return {
    paramKey: opts.paramKey,
    paramLabel: def.label,
    objective: opts.objective,
    seeds,
    ticks: opts.ticks,
    points,
    best,
  };
}

function clampParam(def: TunableParamDef, v: number): number {
  const clamped = Math.max(def.min, Math.min(def.max, v));
  return def.isInt ? Math.round(clamped) : Math.round(clamped * 1000) / 1000;
}

export async function runEvolutionaryOptimizer(
  opts: {
    baseParams: SimParams;
    tunedKeys: TunableKey[];
    generations: number;
    popSizeM: number;
    seedsN: number;
    baseSeed: number;
    ticks: number;
    objective: FitnessObjectiveId;
    sim?: DeadGridSim;
  },
  onProgress?: (done: number, total: number, history: OptimizerGenSample[]) => void,
  shouldStop?: () => boolean,
): Promise<OptimizerResult> {
  const sim = opts.sim ?? (await createSim(opts.baseSeed, { ...opts.baseParams, gridSize: 512 }));
  const seeds = buildSeedList(opts.baseSeed, opts.seedsN);
  const defs = TUNABLE_PARAMS.filter((d) => opts.tunedKeys.includes(d.key));
  const total = (1 + opts.generations * opts.popSizeM) * seeds.length;
  let done = 0;

  const history: OptimizerGenSample[] = [];
  const baseline = await evaluateCandidate(
    sim,
    opts.baseParams,
    {},
    seeds,
    opts.ticks,
    opts.objective,
    () => {
      done++;
      onProgress?.(done, total, history);
    },
    shouldStop,
  );

  let elites: EvalSummary[] = [baseline];

  for (let gen = 1; gen <= opts.generations; gen++) {
    if (shouldStop?.()) break;
    const pop: EvalSummary[] = [];
    // Keep top elite
    pop.push(elites[0]);

    for (let m = 1; m < opts.popSizeM; m++) {
      if (shouldStop?.()) break;
      const parentA = elites[m % elites.length].params;
      const parentB = elites[(m + 1) % elites.length].params;
      const overrides: Partial<SimParams> = {};
      const sigma = 0.35 * Math.pow(0.85, gen - 1);

      for (const def of defs) {
        const baseVal = Math.random() < 0.5 ? parentA[def.key] : parentB[def.key];
        const span = def.max - def.min;
        const delta = (Math.random() * 2 - 1) * span * sigma;
        (overrides[def.key] as number) = clampParam(def, baseVal + delta);
      }

      const summary = await evaluateCandidate(
        sim,
        opts.baseParams,
        overrides,
        seeds,
        opts.ticks,
        opts.objective,
        () => {
          done++;
          onProgress?.(done, total, history);
        },
        shouldStop,
      );
      pop.push(summary);
    }

    pop.sort((a, b) => b.meanFitness - a.meanFitness);
    elites = pop.slice(0, Math.max(2, Math.ceil(opts.popSizeM / 3)));
    const meanFitness = pop.reduce((acc, s) => acc + s.meanFitness, 0) / Math.max(1, pop.length);
    history.push({
      gen,
      bestFitness: elites[0].meanFitness,
      meanFitness,
      bestParams: { ...elites[0].params },
      bestSummary: elites[0],
    });
    onProgress?.(done, total, history);
  }

  return {
    objective: opts.objective,
    tunedKeys: opts.tunedKeys,
    seeds,
    ticks: opts.ticks,
    baseline,
    best: elites[0],
    history,
  };
}

export function exportSweepCsv(res: SweepResult): string {
  const header = [
    res.paramKey,
    'meanFitness',
    'minFitness',
    'maxFitness',
    'meanHumans',
    'meanZombies',
    'meanSettlements',
    'meanRepublics',
    'meanPdCoopPct',
    'meanInfra',
  ].join(',');
  const rows = res.points.map((pt) =>
    [
      pt.value,
      pt.summary.meanFitness.toFixed(2),
      pt.summary.minFitness.toFixed(2),
      pt.summary.maxFitness.toFixed(2),
      pt.summary.meanHumans.toFixed(1),
      pt.summary.meanZombies.toFixed(1),
      pt.summary.meanSettlements.toFixed(2),
      pt.summary.meanRepublics.toFixed(2),
      pt.summary.meanPdCoopPct.toFixed(1),
      pt.summary.meanInfra.toFixed(1),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function exportOptimizerJson(res: OptimizerResult): string {
  return JSON.stringify(res, null, 2);
}
