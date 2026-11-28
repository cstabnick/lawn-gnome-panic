import { describe, expect, it } from 'vitest';
import { BALL_R, CUE_BALL, MAX_SHOT_SPEED, TABLE_H, TABLE_W } from './config';
import { beginShot, POCKETS, settle } from './physics';
import { CHALLENGES, challengeBalls, checkChallenge } from './challenges';

function aimGhost(cx: number, cy: number, tx: number, ty: number, px: number, py: number, speed = 1.6): { vx: number; vy: number } {
  const ux = px - tx;
  const uy = py - ty;
  const L = Math.hypot(ux, uy) || 1;
  const gx = tx - (ux / L) * 2 * BALL_R;
  const gy = ty - (uy / L) * 2 * BALL_R;
  const dx = gx - cx;
  const dy = gy - cy;
  const D = Math.hypot(dx, dy) || 1;
  return { vx: (dx / D) * speed, vy: (dy / D) * speed };
}

describe('challenge mode', () => {
  it('every challenge has valid non-overlapping balls inside the cushions and outside pockets', () => {
    expect(CHALLENGES).toHaveLength(10);
    for (const c of CHALLENGES) {
      const balls = challengeBalls(c);
      expect(balls.some((b) => b.id === CUE_BALL), `${c.id} missing cue ball`).toBe(true);
      expect(balls.filter((b) => b.id !== CUE_BALL).length, `${c.id} needs object balls`).toBeGreaterThanOrEqual(1);
      for (const b of balls) {
        expect(b.x, `${c.id} ball ${b.id} x`).toBeGreaterThanOrEqual(BALL_R);
        expect(b.x, `${c.id} ball ${b.id} x`).toBeLessThanOrEqual(TABLE_W - BALL_R);
        expect(b.y, `${c.id} ball ${b.id} y`).toBeGreaterThanOrEqual(BALL_R);
        expect(b.y, `${c.id} ball ${b.id} y`).toBeLessThanOrEqual(TABLE_H - BALL_R);
        for (const p of POCKETS) {
          const d = Math.hypot(b.x - p.x, b.y - p.y);
          expect(d, `${c.id} ball ${b.id} inside pocket`).toBeGreaterThanOrEqual(p.r);
        }
      }
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const d = Math.hypot(balls[i].x - balls[j].x, balls[i].y - balls[j].y);
          expect(d, `${c.id} overlap ${balls[i].id}/${balls[j].id}`).toBeGreaterThanOrEqual(2 * BALL_R - 1e-6);
        }
      }
    }
  });

  it('checkChallenge detects win, scratch loss, avoidIds loss, requireBank loss, and out-of-shots loss', () => {
    const def = CHALLENGES[0]; // straight-in
    const before = challengeBalls(def);
    const wonBalls = before.map((b) => (b.id === 1 ? { ...b, pocketed: true } : b));
    expect(checkChallenge(def, before, wonBalls, { firstHit: 1, pocketed: [1] }, 1).status).toBe('won');

    const scratchBalls = before.map((b) => (b.id === CUE_BALL ? { ...b, pocketed: true } : b));
    expect(checkChallenge(def, before, scratchBalls, { firstHit: 1, pocketed: [CUE_BALL] }, 1).status).toBe('lost');
    expect(checkChallenge(def, before, before, { firstHit: 1, pocketed: [] }, 1).status).toBe('lost');

    const danger = CHALLENGES.find((c) => c.id === 'danger-zone')!;
    const dangerBefore = challengeBalls(danger);
    const dangerLost = dangerBefore.map((b) => (b.id === 1 || b.id === 8 ? { ...b, pocketed: true } : b));
    expect(checkChallenge(danger, dangerBefore, dangerLost, { firstHit: 1, pocketed: [1, 8] }, 1).status).toBe('lost');

    const bank = CHALLENGES.find((c) => c.id === 'rail-bank')!;
    const bankBefore = challengeBalls(bank);
    const bankAfter = bankBefore.map((b) => (b.id === 8 ? { ...b, pocketed: true } : b));
    expect(checkChallenge(bank, bankBefore, bankAfter, { firstHit: 8, pocketed: [8], cushionHits: {} }, 1).status).toBe('lost');
    expect(checkChallenge(bank, bankBefore, bankAfter, { firstHit: 8, pocketed: [8], cushionHits: { 8: 1 } }, 1).status).toBe('won');
  });

  it('1-shot challenges are physics-solvable', () => {
    const oneShotIds = ['straight-in', 'long-cut', 'combo-strike', 'danger-zone'];
    for (const id of oneShotIds) {
      const def = CHALLENGES.find((c) => c.id === id)!;
      const before = challengeBalls(def);
      const cue = before.find((b) => b.id === CUE_BALL)!;
      const firstObj = before.find((b) => b.id !== CUE_BALL)!;
      const s = aimGhost(cue.x, cue.y, firstObj.x, firstObj.y, 2.0, 0.0, MAX_SHOT_SPEED * 0.85);
      const t = beginShot(before, s.vx, s.vy);
      settle(t);
      const res = checkChallenge(def, before, t.balls, t.events, 1);
      expect(res.status, `${id} failed: ${res.reason}`).toBe('won');
    }

    // rail-bank: bank 8-ball off top rail into bottom side pocket (1.0, 1.0)
    const bank = CHALLENGES.find((c) => c.id === 'rail-bank')!;
    const bankBefore = challengeBalls(bank);
    const bankCue = bankBefore.find((b) => b.id === CUE_BALL)!;
    const eight = bankBefore.find((b) => b.id === 8)!;
    const mirrorPocketY = BALL_R - (TABLE_H - BALL_R) / 0.72;
    const base = aimGhost(bankCue.x, bankCue.y, eight.x, eight.y, 1.0, mirrorPocketY, MAX_SHOT_SPEED);
    let bankWon = false;
    for (let da = -0.08; da <= 0.08; da += 0.005) {
      const c = Math.cos(da);
      const s = Math.sin(da);
      const t = beginShot(bankBefore, base.vx * c - base.vy * s, base.vx * s + base.vy * c);
      settle(t);
      if (checkChallenge(bank, bankBefore, t.balls, t.events, 1).status === 'won') {
        bankWon = true;
        break;
      }
    }
    expect(bankWon, 'rail-bank not solvable in 1 shot').toBe(true);
    // double-drop: drive 2 into 1 at the top-right corner (2.0, 0.0)
    const dbl = CHALLENGES.find((c) => c.id === 'double-drop')!;
    const dblBefore = challengeBalls(dbl);
    const dblCue = dblBefore.find((b) => b.id === CUE_BALL)!;
    const dblTwo = dblBefore.find((b) => b.id === 2)!;
    const sd = aimGhost(dblCue.x, dblCue.y, dblTwo.x, dblTwo.y, 2.0, 0.0, MAX_SHOT_SPEED);
    let dblWon = false;
    for (let da = -0.15; da <= 0.15; da += 0.01) {
      const c = Math.cos(da);
      const s = Math.sin(da);
      const td = beginShot(dblBefore, sd.vx * c - sd.vy * s, sd.vx * s + sd.vy * c);
      settle(td);
      if (checkChallenge(dbl, dblBefore, td.balls, td.events, 1).status === 'won') {
        dblWon = true;
        break;
      }
    }
    expect(dblWon, 'double-drop not solvable in 1 shot').toBe(true);
  });
});
