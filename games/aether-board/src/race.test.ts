import { describe, expect, it } from 'vitest';
import { createRace, formatTime } from './race';

describe('race clock', () => {
  it('times a run to the gate, keeps the best, and starts the next run at 0', () => {
    const r = createRace(12);
    for (let i = 0; i < 120 * 90; i++) r.tick(1 / 120);
    r.event({ e: 'island', id: 11 });
    r.event({ e: 'bail', reason: 'Hit a rock' });
    const a = r.event({ e: 'warp' });
    expect(a?.time).toBeCloseTo(90, 3);
    expect(a?.newBest).toBe(true);
    expect(a?.prevBest).toBeNull();
    expect(a?.bails).toBe(1);
    expect(r.time).toBe(0);
    for (let i = 0; i < 120 * 100; i++) r.tick(1 / 120);
    r.event({ e: 'island', id: 11 });
    const b = r.event({ e: 'warp' });
    expect(b?.newBest).toBe(false);
    expect(r.best).toBeCloseTo(90, 3);
    expect(b?.bails).toBe(0);
  });

  it('other events do not finish a run', () => {
    const r = createRace(12, 50);
    r.tick(3);
    expect(r.event({ e: 'skyfall' })).toBeNull();
    expect(r.event({ e: 'respawn' })).toBeNull();
    expect(r.time).toBe(3);
    expect(r.bails).toBe(1);
  });

  it('a warp before reaching the last run is not a finish: the clock just starts again', () => {
    const r = createRace(12);
    r.tick(20);
    r.event({ e: 'island', id: 4 });
    expect(r.event({ e: 'warp' })).toBeNull();
    expect(r.time).toBe(0);
    expect(r.best).toBeNull();
  });

  it('formats m:ss.cc', () => {
    expect(formatTime(0)).toBe('0:00.00');
    expect(formatTime(83.456)).toBe('1:23.46');
    expect(formatTime(9.5)).toBe('0:09.50');
  });
});
