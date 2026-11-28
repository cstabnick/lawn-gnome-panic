import { describe, expect, it } from 'vitest';
import { murmurLevel, surfLevel } from './ambience';

describe('coast ambience levels', () => {
  it('surf is full at the shore, silent far inland, between in the middle', () => {
    expect(surfLevel(0, 1185)).toBe(1);
    expect(surfLevel(0, 900)).toBe(0);
    const mid = surfLevel(0, 1080);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(surfLevel(2000, 1185)).toBe(0);
  });
  it('murmur lives on the boardwalk and is quieter at night', () => {
    expect(murmurLevel(0, 1300)).toBe(0);
    expect(murmurLevel(0, 1117)).toBeGreaterThan(0);
    expect(murmurLevel(0, 1117, 1)).toBeLessThan(murmurLevel(0, 1117, 0));
  });
});
