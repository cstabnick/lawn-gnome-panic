import { describe, expect, it } from 'vitest';
import { COMPETITIONS } from '../data/competitions';
import { LEVEL_ORDER } from '../levels/loader';
import { computeMedal, createCompetitionRun, isBetterMedal, stepCompetitionRun } from './competitions';

describe('Gnom Set Radio Encore Competitions', () => {
  it('defines unique Encore Competitions covering all 9 levels with valid targets and ring courses', () => {
    expect(Object.keys(COMPETITIONS)).toHaveLength(9);
    const ids = new Set<string>();
    for (const levelId of LEVEL_ORDER) {
      const def = COMPETITIONS[levelId];
      expect(def).toBeDefined();
      expect(def.areaId).toBe(levelId);
      expect(ids.has(def.id)).toBe(false);
      ids.add(def.id);
      expect(def.durationS).toBeGreaterThan(0);
      expect(def.bronzeTarget).toBeLessThan(def.silverTarget);
      expect(def.silverTarget).toBeLessThan(def.goldTarget);
      expect(def.boothPos).toHaveLength(3);
      if (def.kind === 'ring-sprint') {
        expect(def.ringPositions).toHaveLength(8);
      }
    }
    for (const [x, y, z] of COMPETITIONS['bongo-basin'].ringPositions ?? []) {
      expect(Number.isFinite(x) && Number.isFinite(z)).toBe(true);
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(8);
    }
  });

  it('creates a run and steps score-attack until time expires', () => {
    const def = COMPETITIONS['velvet-keys'];
    const run = createCompetitionRun(def);
    expect(run.timeLeft).toBe(45);
    expect(run.progress).toBe(0);
    expect(run.finished).toBe(false);
    expect(run.medal).toBeNull();

    const mid = stepCompetitionRun(run, 20, { scoreDelta: 3900 });
    expect(mid.finishedNow).toBe(false);
    expect(mid.medal).toBe('silver');
    expect(run.timeLeft).toBe(25);

    const end = stepCompetitionRun(run, 25, { scoreDelta: 1700 });
    expect(end.finishedNow).toBe(true);
    expect(end.medal).toBe('gold');
    expect(run.finished).toBe(true);
    expect(run.timeLeft).toBe(0);

    // Further steps after finish are no-ops
    const after = stepCompetitionRun(run, 5, { scoreDelta: 1000 });
    expect(after.finishedNow).toBe(false);
    expect(run.progress).toBe(5600);
  });

  it('steps ring-sprint, deduplicates rings, and finishes early when all rings are collected', () => {
    const def = COMPETITIONS['bongo-basin'];
    const run = createCompetitionRun(def);

    stepCompetitionRun(run, 1, { ringIndex: 0 });
    stepCompetitionRun(run, 1, { ringIndex: 0 }); // duplicate ignored
    expect(run.progress).toBe(1);
    expect(run.medal).toBeNull();

    for (let i = 1; i < 7; i++) {
      const res = stepCompetitionRun(run, 1, { ringIndex: i });
      expect(res.finishedNow).toBe(false);
    }
    expect(run.medal).toBe('silver');

    const finalRes = stepCompetitionRun(run, 1, { ringIndex: 7 });
    expect(finalRes.finishedNow).toBe(true);
    expect(finalRes.medal).toBe('gold');
    expect(run.finished).toBe(true);
    expect(run.timeLeft).toBeGreaterThan(0);
  });

  it('steps grind-time and computes medals accurately', () => {
    const def = COMPETITIONS['chrome-kiln'];
    const run = createCompetitionRun(def);
    stepCompetitionRun(run, 10, { grindAirDt: 6.5 });
    expect(run.progress).toBeCloseTo(6.5);
    expect(run.medal).toBe('bronze');

    const end = stepCompetitionRun(run, 35, { grindAirDt: 5.0 });
    expect(end.finishedNow).toBe(true);
    expect(end.medal).toBe('silver');
    expect(computeMedal(def, 5.9)).toBeNull();
    expect(computeMedal(def, 16)).toBe('gold');
  });

  it('compares medals correctly with isBetterMedal', () => {
    expect(isBetterMedal(null, undefined)).toBe(false);
    expect(isBetterMedal(null, 'bronze')).toBe(false);
    expect(isBetterMedal('bronze', undefined)).toBe(true);
    expect(isBetterMedal('bronze', 'bronze')).toBe(false);
    expect(isBetterMedal('silver', 'bronze')).toBe(true);
    expect(isBetterMedal('gold', 'silver')).toBe(true);
    expect(isBetterMedal('bronze', 'gold')).toBe(false);
  });
});
