// Whole games: two CPU players (Big Lou's own shot logic) play to the 8 ball through the same table, rules and
// settle code the browser uses. Catches stuck games, balls leaving the cloth, and rule bookkeeping that drifts.
import { describe, expect, it } from 'vitest';
import { BALL_R, TABLE_H, TABLE_W } from './config';
import { chooseCpuShot, cpuPlaceSpot } from './cpu';
import { beginShot, setCue, settle, type Table } from './physics';
import { applyVerdict, judge, newMatch, type Match } from './rules';
import { mulberry32 } from './rules';

function playGame(seed: number, maxShots = 400): { m: Match; shots: number; fouls: number } {
  const rnd = mulberry32(seed);
  const m = newMatch(seed, 0);
  let shots = 0;
  let fouls = 0;
  while (m.winner === null && shots < maxShots) {
    if (m.ballInHand) {
      const spot = cpuPlaceSpot(m.balls, rnd);
      setCue(m.balls, spot.x, spot.y);
      m.ballInHand = false;
    }
    const cue = m.balls.find((b) => b.id === 0)!;
    const s = chooseCpuShot(m.balls, cue.x, cue.y, m.groups[m.turn] ?? null, rnd);
    const before = m.balls.map((b) => ({ ...b }));
    const t: Table = beginShot(m.balls, s.vx, s.vy);
    settle(t);
    const v = judge(before, t.events, m.groups, m.turn);
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
  return { m, shots, fouls };
}

describe('CPU against CPU', () => {
  it('finishes games with a winner, and every game ends with the 8 ball or a foul-driven win', () => {
    const results = [11, 22, 33, 44, 55].map((seed) => playGame(seed));
    for (const r of results) {
      expect(r.m.winner, `no winner after ${r.shots} shots`).not.toBeNull();
      const eight = r.m.balls.find((b) => b.id === 8)!;
      expect(eight.pocketed).toBe(true);
    }
  });
});
