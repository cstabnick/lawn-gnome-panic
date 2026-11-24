// The 6-sim-player cap: the pool never runs more than MAX_SIM_PLAYERS jobs at once, queues the rest, and --parallel
// can only lower the cap.
import { describe, expect, it } from 'vitest';
import { MAX_SIM_PLAYERS, simParallel } from './config';
import { runPool, type PoolStats } from './pool';

const tick = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('sim player cap', () => {
  it('is 6, and --parallel only lowers it', () => {
    expect(MAX_SIM_PLAYERS).toBe(6);
    expect(simParallel(undefined)).toBe(6);
    expect(simParallel(20)).toBe(6);
    expect(simParallel('7')).toBe(6);
    expect(simParallel(3)).toBe(3);
    expect(simParallel(0)).toBe(6);
    expect(simParallel('x')).toBe(6);
  });

  it('never runs more than 6 at once and queues the rest', async () => {
    let live = 0;
    let seen = 0;
    const stats: PoolStats = { peak: 0, queued: 0 };
    const res = await runPool(Array.from({ length: 20 }, (_, i) => i), async (i) => {
      live++;
      seen = Math.max(seen, live);
      await tick(2 + (i % 3));
      live--;
      if (i === 5) throw new Error('boom');
      return i * 2;
    }, 50, stats);
    expect(seen).toBe(6);
    expect(stats.peak).toBe(6);
    expect(stats.queued).toBe(14);
    expect(res[5].status).toBe('rejected');
    expect(res[19]).toEqual({ status: 'fulfilled', value: 38 });
  });

  it('honours a lower --parallel', async () => {
    const stats: PoolStats = { peak: 0, queued: 0 };
    await runPool([1, 2, 3, 4, 5], async () => tick(2), 2, stats);
    expect(stats.peak).toBe(2);
    expect(stats.queued).toBe(3);
  });
});
