import { describe, expect, it } from 'vitest';
import { BUBBLE, clampBubble, hudCorners, pickShown } from './bubbleClamp';

const desk = { w: 960, h: 600 };
const phone = { w: 390, h: 844 };

describe('bubbleClamp', () => {
  it('caps a big bubble', () => {
    expect(clampBubble(480, 400, 1000, 350, desk).k).toBeCloseTo(BUBBLE.maxW / 1000);
    expect(clampBubble(195, 500, 1000, 350, phone).k).toBeCloseTo((0.6 * 390) / 1000);
    expect(clampBubble(480, 400, 200, 70, desk).k).toBe(1);
  });
  it('pulls a bubble off the right edge back inside', () => {
    const r = clampBubble(940, 400, 300, 100, desk);
    expect(r.cx + 150).toBeLessThanOrEqual(desk.w - BUBBLE.margin + 1e-6);
  });
  it('moves a bubble over the top-right corner below it', () => {
    const hud = hudCorners(desk)[1];
    const r = clampBubble(desk.w - 100, 40, 300, 100, desk);
    expect(r.cy - 50).toBeGreaterThanOrEqual(hud.y + hud.h);
  });
  it('keeps the two nearest', () => {
    const s = pickShown([{ id: 'a', dist: 9 }, { id: 'b', dist: 2 }, { id: 'c', dist: 5 }]);
    expect([...s].sort()).toEqual(['b', 'c']);
  });
});
