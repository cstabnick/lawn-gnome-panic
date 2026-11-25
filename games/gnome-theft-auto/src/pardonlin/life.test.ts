import { describe, expect, it } from 'vitest';
import { insideEuroYard } from './layout';
import { PIGEON_SPOTS, flushTarget } from './life';

describe('Pardonlin life', () => {
  it('has five pigeon spots, all inside the euro zone', () => {
    expect(PIGEON_SPOTS).toHaveLength(5);
    for (const s of PIGEON_SPOTS) expect(insideEuroYard(s.x, s.z), `${s.x},${s.z}`).toBe(true);
  });

  it('flushes a pigeon away from the player at the given height', () => {
    const t = flushTarget(10, 0, 0, 0, 12);
    expect(t.y).toBe(12);
    expect(t.x).toBeGreaterThan(10);
    expect(Math.hypot(t.x - 10, t.z)).toBeCloseTo(10, 6);
  });

  it('flushes straight away when the player is on the bird', () => {
    const t = flushTarget(5, 5, 5, 5, 9);
    expect(Math.hypot(t.x - 5, t.z - 5)).toBeCloseTo(10, 6);
    expect(t.y).toBe(9);
  });
});
