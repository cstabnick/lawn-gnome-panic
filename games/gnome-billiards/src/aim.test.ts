import { describe, expect, it } from 'vitest';
import { BALL_R, CUE_BALL, TABLE_W } from './config';
import { backRoom } from './aim';
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
