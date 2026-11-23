import { describe, expect, it } from 'vitest';
import { createCooldowns, nextLevel, tensionTarget } from './tension';

describe('tension target', () => {
  it('is calm with nothing near and full Calm', () => {
    expect(tensionTarget({ hatlessNear: 0, calm: 100, fight: false })).toBe(0);
  });

  it('rises with Hatless near and saturates at three', () => {
    expect(tensionTarget({ hatlessNear: 1, calm: 100, fight: false })).toBeCloseTo(0.3, 5);
    expect(tensionTarget({ hatlessNear: 9, calm: 100, fight: false })).toBeCloseTo(0.9, 5);
  });

  it('rises as Calm falls, and a fight is the full value', () => {
    expect(tensionTarget({ hatlessNear: 0, calm: 40, fight: false })).toBeCloseTo(0.6, 5);
    expect(tensionTarget({ hatlessNear: 0, calm: 100, fight: true })).toBe(1);
  });
});

describe('tension levels', () => {
  it('climbs one level per threshold', () => {
    expect(nextLevel(0, 0.25)).toBe(1);
    expect(nextLevel(0, 0.5)).toBe(2);
    expect(nextLevel(0, 0.8)).toBe(3);
  });

  it('does not drop until the value falls under the leave line (hysteresis)', () => {
    expect(nextLevel(2, 0.40)).toBe(2);   // above 0.37: stays at Tense
    expect(nextLevel(2, 0.30)).toBe(1);   // under 0.37: drops to Uneasy
    expect(nextLevel(1, 0.15)).toBe(1);   // above 0.12: stays
    expect(nextLevel(1, 0.05)).toBe(0);
  });

  it('a flicker around an enter line does not change level', () => {
    let level = nextLevel(0, 0.21);
    for (const v of [0.19, 0.21, 0.19, 0.21, 0.18]) level = nextLevel(level, v);
    expect(level).toBe(1);
  });
});

describe('cooldowns', () => {
  it('blocks a repeat until the time has passed', () => {
    const c = createCooldowns();
    expect(c.ready('hit', 0, 20)).toBe(true);
    c.mark('hit', 0);
    expect(c.ready('hit', 10, 20)).toBe(false);
    expect(c.ready('hit', 20, 20)).toBe(true);
    expect(c.ready('bell', 1, 20)).toBe(true);   // keys are separate
  });
});
