import { describe, expect, it } from 'vitest';
import { SERMON_DAY, SERMON_NIGHT, sermonLength, sermonLine } from './sermon';

describe('sermon lines', () => {
  it('day sermon has 8 lines and the night sermon 12', () => {
    expect(SERMON_DAY.length).toBe(8);
    expect(SERMON_NIGHT.length).toBe(12);
  });

  it('the night sermon ends with the Even Cut prophecy', () => {
    expect(SERMON_NIGHT[SERMON_NIGHT.length - 1]).toContain('Even Cut');
  });
});

describe('sermonLength', () => {
  it('is about 20 s by day and 30 s at night', () => {
    expect(sermonLength(false)).toBe(20);
    expect(sermonLength(true)).toBe(30);
  });
});

describe('sermonLine', () => {
  it('shows the first line at 0 seconds', () => {
    expect(sermonLine(SERMON_DAY, 0, sermonLength(false))).toBe(SERMON_DAY[0]);
  });

  it('shows the last line near the end', () => {
    const total = sermonLength(true);
    expect(sermonLine(SERMON_NIGHT, total - 0.1, total)).toBe(SERMON_NIGHT[SERMON_NIGHT.length - 1]);
  });

  it('clamps past the end to the last line and before the start to the first', () => {
    const total = sermonLength(false);
    expect(sermonLine(SERMON_DAY, total + 50, total)).toBe(SERMON_DAY[SERMON_DAY.length - 1]);
    expect(sermonLine(SERMON_DAY, -3, total)).toBe(SERMON_DAY[0]);
  });
});
