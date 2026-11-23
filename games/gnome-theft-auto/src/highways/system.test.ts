import { describe, expect, it } from 'vitest';
import { gapCleared, runComplete } from './system';

describe('skyway achievement helpers', () => {
  it('a run counts as end to end within 12 m of the full length', () => {
    expect(runComplete(0, 300, 300)).toBe(true);
    expect(runComplete(0, 288, 300)).toBe(true);
    expect(runComplete(0, 287, 300)).toBe(false);
    expect(runComplete(40, 300, 300)).toBe(false);
  });

  it('a run is not complete when the player only covered one end', () => {
    expect(runComplete(0, 100, 300)).toBe(false);
    expect(runComplete(200, 300, 300)).toBe(false);
  });

  it('a landing counts as Mind the Gap only 25 m or more from the launch point', () => {
    expect(gapCleared(0, 0, 0, 25)).toBe(true);
    expect(gapCleared(0, 0, 3, 4)).toBe(false);
    expect(gapCleared(10, 10, 10, 34.9)).toBe(false);
    expect(gapCleared(10, 10, 10, 35)).toBe(true);
    expect(gapCleared(10, 10, 10, 20)).toBe(false);
  });
});
