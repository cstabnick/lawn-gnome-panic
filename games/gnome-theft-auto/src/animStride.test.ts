import { describe, expect, it } from 'vitest';
import { ANIM_LOD, ANIM_MAX_STEP, animStride, newAnimClock, stepAnimClock } from './animStride';

describe('animStride', () => {
  it('steps near characters every frame and far ones less often', () => {
    expect(animStride(0)).toBe(1);
    expect(animStride(ANIM_LOD.near - 1)).toBe(1);
    expect(animStride(ANIM_LOD.near)).toBe(2);
    expect(animStride(ANIM_LOD.mid)).toBe(4);
    expect(animStride(ANIM_LOD.far)).toBe(0);
  });

  it('every frame passes dt straight through', () => {
    const c = newAnimClock(3);
    for (let i = 0; i < 5; i++) expect(stepAnimClock(c, 1 / 60, 1)).toBeCloseTo(1 / 60);
  });

  it('a stride of n steps once every n frames with the time gathered, so the pace is kept', () => {
    for (const stride of [2, 4]) {
      const c = newAnimClock(1);
      let steps = 0;
      let total = 0;
      for (let i = 0; i < 40; i++) {
        const s = stepAnimClock(c, 0.01, stride);
        if (s > 0) steps++;
        total += s;
      }
      expect(steps).toBe(40 / stride);
      expect(total + c.acc).toBeCloseTo(0.4);
    }
  });

  it('spreads characters with different seeds over different frames', () => {
    const a = newAnimClock(0);
    const b = newAnimClock(1);
    const fa: number[] = [];
    const fb: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (stepAnimClock(a, 0.01, 2) > 0) fa.push(i);
      if (stepAnimClock(b, 0.01, 2) > 0) fb.push(i);
    }
    expect(fa).not.toEqual(fb);
  });

  it('stride 0 steps nothing and drops the gathered time; a step never exceeds ANIM_MAX_STEP', () => {
    const c = newAnimClock(0);
    stepAnimClock(c, 0.1, 4);
    expect(stepAnimClock(c, 0.1, 0)).toBe(0);
    expect(c.acc).toBe(0);
    let s = 0;
    for (let i = 0; i < 4 && s === 0; i++) s = stepAnimClock(c, 1, 4);
    expect(s).toBe(ANIM_MAX_STEP);
  });
});
