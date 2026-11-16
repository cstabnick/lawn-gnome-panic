import { describe, expect, it } from 'vitest';
import { defaultSeats, mulberry32 } from '@lawn/party';
import { testMinigame } from '@lawn/party/testkit';
import def from './oly-grass-mow';

testMinigame(def);

describe('oly-grass-mow rules', () => {
  it('steering moves and cuts the grass, and the lawn stays 400 cells', () => {
    const seats = defaultSeats(true);
    const rng = mulberry32(1);
    const s = def.init(seats, rng);
    const x0 = s.m[0].x;
    for (let i = 0; i < 120; i++) {
      def.step(s, [{ x: 1, y: 0 }, null, null, null], 1 / 60, rng);
    }
    expect(s.m[0].x).toBeGreaterThan(x0);
    expect(s.m[0].cut).toBeGreaterThan(0);
    expect(s.cells.length).toBe(400);
  });

  it('four CPUs cut most of the lawn', () => {
    const seats = defaultSeats(true);
    const rng = mulberry32(1);
    const s = def.init(seats, rng);
    for (let i = 0; i < 40 * 60; i++) {
      const inputs = seats.map((seat) => def.cpu(s, seat.seat, rng));
      def.step(s, inputs, 1 / 60, rng);
    }
    const left = s.cells.split('').filter((c) => c === '.').length;
    expect(left).toBeLessThan(80);
  });
});
