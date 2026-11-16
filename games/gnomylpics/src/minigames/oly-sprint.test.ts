import { describe, expect, it } from 'vitest';
import { defaultSeats, mulberry32 } from '@lawn/party';
import { testMinigame } from '@lawn/party/testkit';
import def from './oly-sprint';

testMinigame(def);

describe('oly-sprint rules', () => {
  it('a slip slows the runner', () => {
    const seats = defaultSeats(true);
    const rng = mulberry32(7);
    const s = def.init(seats, rng);
    let taps = 0;
    for (let i = 0; i < 60; i++) {
      if (i > 0 && i % 6 === 0) taps += 1;
      def.step(s, [{ taps, slips: 0, acts: 0 }, null, null, null], 1 / 60, rng);
    }
    const before = s.seats[0].r.v;
    expect(before).toBeGreaterThan(0);
    def.step(s, [{ taps, slips: 1, acts: 0 }, null, null, null], 1 / 60, rng);
    const after = s.seats[0].r.v;
    expect(after).toBeLessThan(before / 2);
  });
});
