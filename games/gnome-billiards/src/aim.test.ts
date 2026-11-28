import { describe, expect, it } from 'vitest';
import { BALL_R, CUE_BALL, TABLE_W } from './config';
import { aimTargetRay, backRoom, deltaAngle, rotateDir } from './aim';
import type { Ball } from './physics';

const cue = (x: number, y: number): Ball => ({ id: CUE_BALL, x, y, vx: 0, vy: 0, pocketed: false });
const ball = (id: number, x: number, y: number): Ball => ({ id, x, y, vx: 0, vy: 0, pocketed: false });

describe('cue stick room', () => {
  it('a cue ball by the rail has little room behind it, so the stick cannot pass through the cushion', () => {
    // The shot runs +x, so the butt points -x toward the left rail at x = 0.
    const room = backRoom([cue(0.1, 0.5)], 0.1, 0.5, -1, 0);
    expect(room).toBeLessThan(0.1);
    expect(room).toBeGreaterThanOrEqual(0);
  });

  it('a cue ball in the middle of the cloth has room for a full stick', () => {
    expect(backRoom([cue(1, 0.5)], 1, 0.5, -1, 0)).toBeGreaterThan(0.85);
  });

  it('a ball behind the cue ball shortens the room, so the stick does not pass through it', () => {
    const room = backRoom([cue(1, 0.5), ball(3, 0.7, 0.5)], 1, 0.5, -1, 0);
    expect(room).toBeLessThan(0.3);
    expect(room).toBeGreaterThan(0.2);
  });

  it('room never goes past the far rail for a diagonal butt', () => {
    expect(backRoom([cue(TABLE_W - 0.05, 0.05)], TABLE_W - 0.05, 0.05, 0.7, 0.7)).toBeLessThanOrEqual(BALL_R * 2);
  });
});

describe('fine aim math', () => {
  it('rotateDir rotates by exact angle and preserves unit length', () => {
    const r = rotateDir(1, 0, Math.PI / 2);
    expect(r.dx).toBeCloseTo(0, 8);
    expect(r.dy).toBeCloseTo(1, 8);
    expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(1, 8);

    const fine = rotateDir(Math.SQRT1_2, Math.SQRT1_2, 0.01);
    expect(Math.hypot(fine.dx, fine.dy)).toBeCloseTo(1, 8);
    expect(deltaAngle(Math.SQRT1_2, Math.SQRT1_2, fine.dx, fine.dy)).toBeCloseTo(0.01, 8);
  });

  it('deltaAngle handles positive, negative, and +-PI wrap-around', () => {
    expect(deltaAngle(1, 0, 0, 1)).toBeCloseTo(Math.PI / 2, 8);
    expect(deltaAngle(1, 0, 0, -1)).toBeCloseTo(-Math.PI / 2, 8);
    const a1 = Math.PI - 0.1;
    const a2 = -Math.PI + 0.1;
    expect(deltaAngle(Math.cos(a1), Math.sin(a1), Math.cos(a2), Math.sin(a2))).toBeCloseTo(0.2, 8);
    expect(deltaAngle(Math.cos(a2), Math.sin(a2), Math.cos(a1), Math.sin(a1))).toBeCloseTo(-0.2, 8);
  });

  it('aimTargetRay detects pocketed lines and 1-rail bounces', () => {
    const balls = [cue(1.15, 0.5), ball(1, 1.68, 0.2)];
    const u = Math.hypot(2.0 - 1.68, 0.0 - 0.2);
    const gx = 1.68 - ((2.0 - 1.68) / u) * 2 * BALL_R;
    const gy = 0.2 - ((0.0 - 0.2) / u) * 2 * BALL_R;
    const pocketRay = aimTargetRay(balls, 1, gx, gy, 1.2);
    expect(pocketRay.pocketed).toBe(true);

    const bankBalls = [cue(0.7, 0.4), ball(2, 0.7, 0.7)];
    const bankRay = aimTargetRay(bankBalls, 2, 0.7, 0.7 - 2 * BALL_R, 1.0);
    expect(bankRay.pocketed).toBe(false);
    expect(bankRay.bounce).toBeDefined();
  });
});
