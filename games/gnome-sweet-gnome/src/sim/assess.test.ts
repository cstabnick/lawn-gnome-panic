import { describe, expect, it } from 'vitest';
import { LEVELS } from '../levels';
import { BOTS } from './bots';
import { assessLevel, curveProblems, difficultyLabel, playLevel, type LevelReport } from './assess';

function report(over: Partial<LevelReport> & Pick<LevelReport, 'id'>): LevelReport {
  return {
    name: `level ${over.id}`,
    moves: 20,
    target: 0.9,
    seeds: 10,
    win: { smart: 0.9 },
    movesLeftOnWin: 3,
    avgStars: 2,
    lossProgress: 0.5,
    difficulty: 0.1,
    verdict: 'ok',
    suggestedStars: [50, 100, 150],
    ...over,
  };
}

describe('playLevel', () => {
  it('is deterministic for the same level, bot and seed', () => {
    const level = LEVELS[0];
    expect(playLevel(level, 'smart', 3)).toEqual(playLevel(level, 'smart', 3));
    expect(playLevel(level, 'random', 5)).toEqual(playLevel(level, 'random', 5));
  });

  it('plays with the random bot on levels 1-30 (seeds 1-2) and ends every game', () => {
    for (const level of LEVELS) {
      for (const seed of [1, 2]) {
        const r = playLevel(level, 'random', seed);
        expect(r.movesUsed).toBeLessThanOrEqual(level.moves);
        expect(r.movesUsed + r.movesLeft).toBe(level.moves);
        expect(r.progress).toBeGreaterThanOrEqual(0);
        expect(r.progress).toBeLessThanOrEqual(1);
        if (r.won) expect(r.stars).toBeGreaterThanOrEqual(1);
        else expect(r.stars).toBe(0);
      }
    }
  });

  it('the smart bot makes more progress on average than the random bot (levels 1-10, 6 seeds)', () => {
    let smart = 0;
    let random = 0;
    let n = 0;
    for (const level of LEVELS.slice(0, 10)) {
      for (let seed = 1; seed <= 6; seed++) {
        smart += playLevel(level, 'smart', seed).progress;
        random += playLevel(level, 'random', seed).progress;
        n++;
      }
    }
    expect(smart / n).toBeGreaterThan(random / n);
  }, 120_000);

  it('the smart bot creates a mower, bomb, bee and prism (levels 1-12, 4 seeds)', () => {
    const made = { mowerH: 0, mowerV: 0, bomb: 0, bee: 0, prism: 0 };
    for (const level of LEVELS.slice(0, 12)) {
      for (let seed = 1; seed <= 4; seed++) {
        const r = playLevel(level, 'smart', seed);
        made.mowerH += r.made.mowerH;
        made.mowerV += r.made.mowerV;
        made.bomb += r.made.bomb;
        made.bee += r.made.bee;
        made.prism += r.made.prism;
      }
    }
    expect(made.mowerH + made.mowerV).toBeGreaterThan(0);
    expect(made.bomb).toBeGreaterThan(0);
    expect(made.bee).toBeGreaterThan(0);
    expect(made.prism).toBeGreaterThan(0);
  }, 300_000);

  it('exports the three bots', () => {
    expect(Object.keys(BOTS).sort()).toEqual(['greedy', 'random', 'smart']);
  });
});

describe('assessLevel', () => {
  it('reports win rates for the bots run and a suggested star list', () => {
    const r = assessLevel(LEVELS[0], 3, ['smart']);
    expect(r.seeds).toBe(3);
    expect(r.win.smart).toBeGreaterThanOrEqual(0);
    expect(r.suggestedStars[0]).toBeLessThan(r.suggestedStars[1]);
    expect(r.suggestedStars[1]).toBeLessThan(r.suggestedStars[2]);
  });
});

describe('difficultyLabel', () => {
  it('uses the thresholds 0.85, 0.6 and 0.4', () => {
    expect(difficultyLabel(1)).toBe('easy');
    expect(difficultyLabel(0.85)).toBe('easy');
    expect(difficultyLabel(0.84)).toBe('medium');
    expect(difficultyLabel(0.6)).toBe('medium');
    expect(difficultyLabel(0.59)).toBe('hard');
    expect(difficultyLabel(0.4)).toBe('hard');
    expect(difficultyLabel(0.39)).toBe('super hard');
    expect(difficultyLabel(0)).toBe('super hard');
  });
});

describe('curveProblems', () => {
  it('flags a hard level that is easier than the level before it', () => {
    const reports = [
      report({ id: 4, win: { smart: 0.6 } }),
      report({ id: 5, win: { smart: 0.8 }, verdict: 'ok' }),
    ];
    const problems = curveProblems(reports);
    expect(problems.some((p) => p.includes('Level 5') && p.includes('not harder'))).toBe(true);
  });

  it('is empty for a well-shaped curve with every verdict ok', () => {
    const reports = [
      report({ id: 1, win: { smart: 0.97 } }),
      report({ id: 2, win: { smart: 0.96 } }),
      report({ id: 3, win: { smart: 0.95 } }),
      report({ id: 4, win: { smart: 0.9 } }),
      report({ id: 5, win: { smart: 0.8 } }),
      report({ id: 6, win: { smart: 0.9 } }),
    ];
    expect(curveProblems(reports)).toEqual([]);
  });

  it('sentences a non-ok verdict and includes the suggested moves', () => {
    const problems = curveProblems([
      report({ id: 7, name: 'The Rockery', win: { smart: 0.31 }, target: 0.85, verdict: 'too hard', suggestedMoves: 27 }),
    ]);
    expect(problems).toContain(
      "Level 7 'The Rockery': too hard, smart wins 31% vs target 85% (try 27 moves)",
    );
  });
});
