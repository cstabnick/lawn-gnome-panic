import { describe, expect, it } from 'vitest';
import { createSim, DEFAULT_PARAMS } from './bridge';
import {
  exportOptimizerJson,
  exportSweepCsv,
  runEvolutionaryOptimizer,
  runParameterSweep,
} from './optimizer';

describe('Dead Grid Scenario Sweep & ML Optimizer', () => {
  it('runs an N x M parameter sweep across multiple seeds and exports CSV', async () => {
    const sim = await createSim(101, DEFAULT_PARAMS);
    const res = await runParameterSweep({
      baseParams: {
        ...DEFAULT_PARAMS,
        initialHumans: 600,
        initialZombies: 600,
        initialAnimals: 200,
      },
      paramKey: 'cooperationBias',
      min: 0.1,
      max: 0.9,
      stepsM: 3,
      seedsN: 2,
      baseSeed: 101,
      ticks: 40,
      objective: 'balanced',
      sim,
    });

    expect(res.points.length).toBe(3);
    expect(res.seeds.length).toBe(2);
    expect(res.best.summary.meanFitness).toBeGreaterThan(0);

    const csv = exportSweepCsv(res);
    expect(csv).toContain('cooperationBias,meanFitness');
    expect(csv.split('\n').length).toBe(4);
  });

  it('runs an evolutionary ML optimizer and improves/maintains best fitness across generations', async () => {
    const sim = await createSim(202, DEFAULT_PARAMS);
    const res = await runEvolutionaryOptimizer({
      baseParams: {
        ...DEFAULT_PARAMS,
        initialHumans: 600,
        initialZombies: 600,
        initialAnimals: 200,
      },
      tunedKeys: ['cooperationBias', 'zombieSpeed'],
      generations: 2,
      popSizeM: 4,
      seedsN: 2,
      baseSeed: 202,
      ticks: 40,
      objective: 'thriving',
      sim,
    });

    expect(res.history.length).toBe(2);
    expect(res.best.meanFitness).toBeGreaterThanOrEqual(res.baseline.meanFitness);
    expect(res.history[1].bestFitness).toBeGreaterThanOrEqual(res.history[0].bestFitness);

    const json = exportOptimizerJson(res);
    expect(JSON.parse(json).objective).toBe('thriving');
  });
});
