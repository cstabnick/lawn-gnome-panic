import { describe, it, expect } from 'vitest';
import { GB, newGame, flap, step } from './gnomeyBirdSim';

describe('gnomey bird sim', () => {
  it('falls without flaps and ends on the ground', () => {
    const s = newGame(3);
    flap(s);
    for (let i = 0; i < 300 && !s.over; i++) step(s, 1 / 60);
    expect(s.over).toBe(true);
    expect(s.y + GB.gnomeR).toBeGreaterThanOrEqual(GB.height - GB.groundH - 0.001);
  });

  it('a flap rises', () => {
    const s = newGame(3);
    flap(s);
    const y0 = s.y;
    for (let i = 0; i < 6; i++) step(s, 1 / 60);
    expect(s.y).toBeLessThan(y0);
  });

  it('passing a gap scores exactly once', () => {
    const s = newGame(5);
    flap(s);
    const g = s.gaps[0];
    // Park the gnome in the gap and slide the hedge past, holding the gnome there.
    for (let i = 0; i < 400 && s.score === 0; i++) {
      s.y = g.gapY;
      s.vy = 0;
      step(s, 1 / 60);
    }
    expect(s.over).toBe(false);
    expect(s.score).toBe(1);
    for (let i = 0; i < 20; i++) { s.y = g.gapY; s.vy = 0; step(s, 1 / 60); }
    expect(s.score).toBe(1);
  });

  it('hitting a hedge ends the run', () => {
    const s = newGame(5);
    flap(s);
    const g = s.gaps[0];
    for (let i = 0; i < 400 && !s.over; i++) {
      s.y = g.gapY - GB.gapH / 2 - 2; // inside the top hedge
      s.vy = 0;
      step(s, 1 / 60);
    }
    expect(s.over).toBe(true);
    expect(s.score).toBe(0);
  });

  it('same seed gives the same gaps', () => {
    const run = (seed: number) => {
      const s = newGame(seed);
      flap(s);
      for (let i = 0; i < 400; i++) { s.y = GB.height / 2; s.vy = 0; step(s, 1 / 60); }
      return s.gaps.map((g) => g.gapY.toFixed(3)).join(',');
    };
    expect(run(7)).toBe(run(7));
    expect(run(7)).not.toBe(run(8));
  });
});
