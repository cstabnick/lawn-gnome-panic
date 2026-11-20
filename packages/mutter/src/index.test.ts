import { describe, expect, it } from 'vitest';
import { createMutter, planMutter } from './index';

describe('planMutter', () => {
  it('makes one blip per letter and a gap per space', () => {
    const toks = planMutter('hi you');
    expect(toks.filter((t) => t.k === 'blip')).toHaveLength(5);
    expect(toks.filter((t) => t.k === 'gap')).toHaveLength(1);
  });

  it('caps the voiced letters', () => {
    expect(planMutter('a'.repeat(200), 30).filter((t) => t.k === 'blip')).toHaveLength(30);
    expect(planMutter('a'.repeat(200)).filter((t) => t.k === 'blip')).toHaveLength(48);
  });

  it('lifts the last letters of a question', () => {
    const blips = planMutter('are you ok?').filter((t) => t.k === 'blip');
    const last = blips[blips.length - 1];
    expect(last.k === 'blip' && last.mul).toBeGreaterThan(1);
  });
});

describe('createMutter', () => {
  const voice = createMutter({ gain: () => 1 });

  it('estimates longer lines as longer', () => {
    expect(voice.estimate('Oh.')).toBeLessThan(voice.estimate('Oh, what a truly splendid little photograph.'));
  });

  it('estimates silence for text with no letters', () => {
    expect(voice.estimate('... !!')).toBe(0);
  });

  it('plays nothing (and does not throw) before audio is unlocked', () => {
    expect(voice.say('hello there', 88)).toBe(0);
  });
});
