// Quest sim: run jobs with at most `limit` alive at once (never more than MAX_SIM_PLAYERS); the rest wait in a queue.
// Results come back in input order. A job that throws does not stop the others (its slot is freed in `finally`).
import { MAX_SIM_PLAYERS, simParallel } from './config';

export interface PoolStats {
  /** Most jobs that were running at the same moment. */
  peak: number;
  /** Jobs that had to wait for a free slot. */
  queued: number;
}

export async function runPool<T, R>(
  items: readonly T[],
  job: (item: T, index: number) => Promise<R>,
  limit: number = MAX_SIM_PLAYERS,
  stats: PoolStats = { peak: 0, queued: 0 },
): Promise<PromiseSettledResult<R>[]> {
  const slots = simParallel(limit);
  const out: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  let running = 0;
  stats.queued = Math.max(0, items.length - slots);
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const i = next++;
      running++;
      stats.peak = Math.max(stats.peak, running);
      try {
        out[i] = { status: 'fulfilled', value: await job(items[i], i) };
      } catch (reason) {
        out[i] = { status: 'rejected', reason };
      } finally {
        running--;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(slots, items.length) }, worker));
  return out;
}
