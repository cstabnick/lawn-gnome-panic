import { describe, expect, it } from 'vitest';
import { MAX_PROBLEM_PENALTY } from '../balance.ts';
import { runBot } from './bots.ts';
import { act, computeStats, mowingDay, simulateOffline, stepMowerRide, tick } from './engine.ts';
import { createInitialState, exportSaveString, importSaveString } from './state.ts';

describe('Incregnomtal pure sim & balance guard rails', () => {
  it('clicker bot reaches the ending in 50-65 minutes with no long stalls', () => {
    const r = runBot('clicker', 90);
    expect(r.ended).toBe(true);
    expect(r.totalMinutes).toBeGreaterThanOrEqual(45);
    expect(r.totalMinutes).toBeLessThanOrEqual(68);
    expect(r.maxStallSec).toBeLessThanOrEqual(90);
    expect(r.maxProblemPenalty).toBeLessThanOrEqual(MAX_PROBLEM_PENALTY);
    expect(r.maxNumberSeen).toBeLessThan(1e12);
  });

  it('idle bot reaches the ending in 75-115 minutes without tapping', () => {
    const r = runBot('idle', 130);
    expect(r.ended).toBe(true);
    expect(r.totalMinutes).toBeGreaterThanOrEqual(65);
    expect(r.totalMinutes).toBeLessThanOrEqual(115);
    expect(r.maxProblemPenalty).toBeLessThanOrEqual(MAX_PROBLEM_PENALTY);
    expect(r.maxNumberSeen).toBeLessThan(1e12);
  });

  it('free respec refunds spent Mulch while keeping lifetime Mulch bonus', () => {
    const s = createInitialState();
    s.clippingsThisWeek = 100_000;
    mowingDay(s);
    const earned = s.mulch;
    expect(earned).toBeGreaterThan(0);
    expect(s.lifetimeMulch).toBe(earned);

    act(s, { type: 'buy-tree-node', id: 'root' });
    expect(s.mulch).toBe(earned - 1);
    act(s, { type: 'respec-tree' });
    expect(s.mulch).toBe(earned);
    expect(s.lifetimeMulch).toBe(earned);
    expect(s.treeNodes).toHaveLength(0);
  });

  it('offline catch-up never advances the week clock and caps at one day', () => {
    const s = createInitialState();
    s.clippings = 500;
    act(s, { type: 'sow-all', grass: 'crabgrass' });
    const prevElapsed = s.weekElapsedSec;
    const res = simulateOffline(s, 99999);
    expect(s.weekElapsedSec).toBe(prevElapsed);
    expect(res.secondsApplied).toBeLessThanOrEqual(120);
    expect(res.clippingsEarned).toBeGreaterThan(0);
  });

  it('export/import round-trips state cleanly', () => {
    const s = createInitialState();
    s.acorns = 42;
    s.week = 3;
    const str = exportSaveString(s);
    const restored = importSaveString(str);
    expect(restored).not.toBeNull();
    expect(restored?.acorns).toBe(42);
    expect(restored?.week).toBe(3);
  });

  it('mower ride finishes and unlocks Golden Grass + Yard of the Year', () => {
    const s = createInitialState();
    s.treeNodes = ['root', 'deep-roots', 'seed-sense', 'overseeding', 'golden-blades', 'spare-hat', 'whistle', 'foreman', 'tea-break', 'tame-mower'];
    mowingDay(s);
    expect(s.mowerRide.active).toBe(true);
    for (let i = 0; i < 65; i++) {
      stepMowerRide(s, 1, 1, 0);
    }
    expect(s.ended).toBe(true);
    expect(s.unlockedGrasses).toContain('golden');
    expect(computeStats(s).signTitle).toBe('Yard of the Year');
  });

  it('problem penalty never exceeds 40% even if every tile has every problem', () => {
    const s = createInitialState();
    for (const t of s.tiles) {
      if (t.unlocked) {
        t.grass = 'bluegrass';
        t.weed = true;
        t.puddle = true;
        t.grub = true;
        t.mole = true;
        t.dogSpot = true;
        t.scorched = true;
      }
    }
    s.activeProblems.push('crows');
    tick(s, 0.1);
    expect(computeStats(s).problemPenalty).toBeLessThanOrEqual(0.4);
  });
});
