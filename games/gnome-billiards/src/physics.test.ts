import { describe, expect, it } from 'vitest';
import { BALL_R, CUE_BALL, TABLE_H, TABLE_W } from './config';
import { beginShot, canPlaceCue, isMoving, settle, stepOnce, type Ball } from './physics';

const ball = (id: number, x: number, y: number): Ball => ({ id, x, y, vx: 0, vy: 0, pocketed: false });

describe('table physics', () => {
  it('a struck cue hits the object ball in its line and the object ball moves on', () => {
    const balls = [ball(CUE_BALL, 0.5, 0.5), ball(1, 0.8, 0.5)];
    const t = beginShot(balls, 1.2, 0);
    for (let i = 0; i < 240 && isMoving(t); i++) stepOnce(t);
    expect(t.events.firstHit).toBe(1);
    const object = t.balls.find((b) => b.id === 1)!;
    expect(object.x).toBeGreaterThan(0.8);
    expect(Math.abs(object.y - 0.5)).toBeLessThan(1e-9);
  });

  it('a ball rolled straight into a corner pocket is pocketed', () => {
    const balls = [ball(CUE_BALL, 0.6, 0.4), ball(1, 0.3, 0.2)];
    const t = beginShot(balls, -0.998, -0.666);
    settle(t);
    expect(t.events.pocketed).toContain(1);
    expect(t.balls.find((b) => b.id === 1)!.pocketed).toBe(true);
  });

  it('balls stay on the cloth and come to rest', () => {
    const balls = [ball(CUE_BALL, 0.4, 0.3), ball(2, 1.0, 0.5), ball(3, 1.2, 0.52)];
    const t = beginShot(balls, 2.0, 1.1);
    settle(t);
    expect(isMoving(t)).toBe(false);
    for (const b of t.balls) {
      if (b.pocketed) continue;
      expect(b.x).toBeGreaterThanOrEqual(BALL_R - 1e-9);
      expect(b.x).toBeLessThanOrEqual(TABLE_W - BALL_R + 1e-9);
      expect(b.y).toBeGreaterThanOrEqual(BALL_R - 1e-9);
      expect(b.y).toBeLessThanOrEqual(TABLE_H - BALL_R + 1e-9);
    }
  });

  it('the same shot gives the same result every time (online play relies on it)', () => {
    const run = () => {
      const t = beginShot([ball(CUE_BALL, 0.5, 0.4), ball(1, 0.9, 0.45), ball(9, 1.0, 0.5), ball(4, 1.1, 0.42)], 1.7, 0.31);
      settle(t);
      return JSON.stringify(t.balls) + JSON.stringify(t.events);
    };
    expect(run()).toBe(run());
  });

  it('cue placement rejects the rails, the pockets and overlapping balls', () => {
    const balls = [ball(CUE_BALL, 0.5, 0.5), ball(1, 1.0, 0.5)];
    expect(canPlaceCue(balls, 0.3, 0.3)).toBe(true);
    expect(canPlaceCue(balls, 0.01, 0.5)).toBe(false);
    expect(canPlaceCue(balls, 0.02, 0.02)).toBe(false);
    expect(canPlaceCue(balls, 1.0, 0.5 + BALL_R)).toBe(false);
  });

  it('tracks cushionHits for cue and object balls', () => {
    const balls = [ball(CUE_BALL, 0.7, 0.5), ball(1, 0.7, 0.8)];
    const t = beginShot(balls, 0, 2.2);
    settle(t);
    expect(t.events.cushionHits?.[1]).toBeGreaterThanOrEqual(1);
    expect(t.events.cushionHits?.[CUE_BALL]).toBeGreaterThanOrEqual(0);
  });
});
