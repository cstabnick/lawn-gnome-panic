// Whole games: CPU players play to completion across all tiers and gamemodes through the same table, rules and
// settle code the browser uses. Catches stuck games, balls leaving the cloth, and verifies Cracked CPU dominance.
import { describe, expect, it } from 'vitest';
import { BALL_R, MAX_SHOT_SPEED, TABLE_H, TABLE_W } from './config';
import { chooseCpuShot, cpuPlaceSpot, type CpuTier } from './cpu';
import { beginShot, setCue, settle, type Table } from './physics';
import { applyVerdict, judge, mulberry32, newMatch, type GameMode, type Match } from './rules';

function playGame(
  seed: number,
  tiers: [CpuTier, CpuTier] = ['regular', 'regular'],
  gameMode: GameMode = '8ball',
  maxShots = 400,
): { m: Match; shots: number; fouls: number; breakSpeed: number } {
  const rnd = mulberry32(seed);
  const m = newMatch(seed, 0, gameMode);
  let shots = 0;
  let fouls = 0;
  let breakSpeed = 0;
  while (m.winner === null && shots < maxShots) {
    const tier = tiers[m.turn];
    if (m.ballInHand) {
      const spot = cpuPlaceSpot(m.balls, rnd, { tier, group: m.groups[m.turn] ?? null, gameMode });
      setCue(m.balls, spot.x, spot.y);
      m.ballInHand = false;
    }
    const cue = m.balls.find((b) => b.id === 0)!;
    const s = chooseCpuShot(m.balls, cue.x, cue.y, m.groups[m.turn] ?? null, rnd, {
      tier,
      gameMode,
      isBreak: shots === 0,
    });
    if (shots === 0) breakSpeed = Math.hypot(s.vx, s.vy);
    const before = m.balls.map((b) => ({ ...b }));
    const t: Table = beginShot(m.balls, s.vx, s.vy);
    settle(t);
    const v = judge(before, t.events, m.groups, m.turn, gameMode, m.scores);
    if (v.foul) fouls++;
    applyVerdict(m, t.balls, v);
    shots++;
    for (const b of m.balls) {
      if (b.pocketed) continue;
      expect(b.x).toBeGreaterThanOrEqual(BALL_R - 1e-9);
      expect(b.x).toBeLessThanOrEqual(TABLE_W - BALL_R + 1e-9);
      expect(b.y).toBeGreaterThanOrEqual(BALL_R - 1e-9);
      expect(b.y).toBeLessThanOrEqual(TABLE_H - BALL_R + 1e-9);
    }
  }
  return { m, shots, fouls, breakSpeed };
}

describe('CPU against CPU', () => {
  it('finishes 8-ball games with a winner across seeds', () => {
    const results = [11, 22, 33, 44, 55].map((seed) => playGame(seed));
    for (const r of results) {
      expect(r.m.winner, `no winner after ${r.shots} shots`).not.toBeNull();
      const eight = r.m.balls.find((b) => b.id === 8)!;
      expect(eight.pocketed).toBe(true);
    }
  });

  it('finishes 9-ball, 6-ball, straight, and bank pool games cleanly', () => {
    for (const mode of ['9ball', '6ball', 'straight', 'bank'] as const) {
      const r = playGame(101, ['regular', 'shark'], mode);
      expect(r.m.winner, `${mode} did not finish`).not.toBeNull();
    }
  });

  it('cracked CPU hits breaks hard and dominates casual CPU', () => {
    let crackedWins = 0;
    const seeds = [7, 19, 31, 43, 61];
    for (const seed of seeds) {
      const r = playGame(seed, ['cracked', 'casual'], '8ball');
      expect(r.breakSpeed).toBeGreaterThanOrEqual(0.85 * MAX_SHOT_SPEED);
      if (r.m.winner === 0) crackedWins++;
    }
    expect(crackedWins).toBeGreaterThanOrEqual(4);
  });
});
