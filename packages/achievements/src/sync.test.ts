import type { CloudDeps, PlatformApi } from '@lawn/cloudsave';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ACHIEVEMENTS } from './catalog';
import { ACHIEVEMENTS_STORAGE_KEY } from './store';
import { mergeAchievementStates, SyncedAchievementStore } from './sync';

class FakeStorage {
  m = new Map<string, string>();
  getItem = (k: string): string | null => (this.m.has(k) ? (this.m.get(k) as string) : null);
  setItem = (k: string, v: string): void => {
    this.m.set(k, String(v));
  };
  removeItem = (k: string): void => {
    this.m.delete(k);
  };
}

class ConnectError extends Error {
  constructor(public code: number) {
    super('connect error');
  }
}

const NOT_FOUND = 5;
const ARCADE = 8;
const GOLF_NICE = 'golf-nice';
const GOLF_HOW = 'golf-how';

function save(records: Record<string, { progress: number; unlockedAt?: string }>): string {
  return JSON.stringify({ version: 1, records });
}

/** A fake account save: remote is the account's save text, or null for "no save yet". */
function makePlatform(remote: string | null) {
  let stored = remote;
  let revision = remote === null ? 0n : 1n;
  const getSave = vi.fn(async () => {
    if (stored === null) throw new ConnectError(NOT_FOUND);
    return { save: { game: ARCADE, data: stored, summary: '', revision, updatedAt: undefined } };
  });
  const putSave = vi.fn(async (req: { data: string; baseRevision: bigint }) => {
    stored = req.data;
    revision = req.baseRevision + 1n;
    return { save: { game: ARCADE, data: req.data, summary: '', revision, updatedAt: undefined } };
  });
  const api = {
    getAccessToken: vi.fn(async () => 'tok'),
    saveClient: () => ({ getSave, putSave }),
    ConnectError,
    Code: { NotFound: NOT_FOUND, Aborted: 10 },
    Game: { ARCADE },
  };
  return { api, getSave, putSave };
}

function slotDeps(storage: FakeStorage, platform: ReturnType<typeof makePlatform>, signedIn = true): Partial<CloudDeps> {
  return {
    storage,
    signedIn: () => signedIn,
    load: async () => platform.api as unknown as PlatformApi,
    now: () => 0,
  };
}

describe('mergeAchievementStates', () => {
  it('unions the ids of both sides', () => {
    const local = save({ [GOLF_HOW]: { progress: 1, unlockedAt: '2026-01-01T00:00:00.000Z' } });
    const remote = save({ [GOLF_NICE]: { progress: 1, unlockedAt: '2026-01-02T00:00:00.000Z' } });
    const merged = JSON.parse(mergeAchievementStates(local, remote));
    expect(Object.keys(merged.records).sort()).toEqual([GOLF_HOW, GOLF_NICE]);
  });

  it('keeps the higher progress', () => {
    const merged = JSON.parse(
      mergeAchievementStates(save({ x: { progress: 2 } }), save({ x: { progress: 5 } })),
    );
    expect(merged.records.x).toEqual({ progress: 5 });
  });

  it('keeps the earlier unlockedAt when both have one', () => {
    const merged = JSON.parse(
      mergeAchievementStates(
        save({ x: { progress: 1, unlockedAt: '2026-03-01T00:00:00.000Z' } }),
        save({ x: { progress: 1, unlockedAt: '2026-02-01T00:00:00.000Z' } }),
      ),
    );
    expect(merged.records.x.unlockedAt).toBe('2026-02-01T00:00:00.000Z');
  });

  it('takes the unlockedAt that exists when only one side has it', () => {
    const merged = JSON.parse(
      mergeAchievementStates(save({ x: { progress: 1 } }), save({ x: { progress: 1, unlockedAt: '2026-02-01T00:00:00.000Z' } })),
    );
    expect(merged.records.x).toEqual({ progress: 1, unlockedAt: '2026-02-01T00:00:00.000Z' });
  });

  it('accepts a null local save', () => {
    const remote = save({ [GOLF_NICE]: { progress: 1, unlockedAt: '2026-02-01T00:00:00.000Z' } });
    expect(JSON.parse(mergeAchievementStates(null, remote)).records[GOLF_NICE]).toEqual({
      progress: 1,
      unlockedAt: '2026-02-01T00:00:00.000Z',
    });
  });

  it('treats garbage on either side as empty', () => {
    const remote = save({ [GOLF_NICE]: { progress: 1 } });
    expect(JSON.parse(mergeAchievementStates('{not json', remote)).records).toEqual({ [GOLF_NICE]: { progress: 1 } });
    expect(JSON.parse(mergeAchievementStates(save({ [GOLF_HOW]: { progress: 1 } }), 'garbage')).records).toEqual({
      [GOLF_HOW]: { progress: 1 },
    });
    expect(JSON.parse(mergeAchievementStates(null, 'nope'))).toEqual({ version: 1, records: {} });
  });

  it('is deterministic: sorted ids and the same output in either order', () => {
    const a = save({ b: { progress: 1 }, a: { progress: 2 } });
    const b = save({ c: { progress: 3 } });
    const ab = mergeAchievementStates(a, b);
    expect(ab).toBe(mergeAchievementStates(b, a));
    expect(Object.keys(JSON.parse(ab).records)).toEqual(['a', 'b', 'c']);
  });
});

describe('SyncedAchievementStore', () => {
  it('merges the account save with this browser on startup and keeps both', async () => {
    const storage = new FakeStorage();
    storage.setItem(ACHIEVEMENTS_STORAGE_KEY, save({ [GOLF_HOW]: { progress: 1, unlockedAt: '2026-01-01T00:00:00.000Z' } }));
    const platform = makePlatform(save({ [GOLF_NICE]: { progress: 1, unlockedAt: '2026-01-02T00:00:00.000Z' } }));
    const store = new SyncedAchievementStore({ storage, slotDeps: slotDeps(storage, platform) });

    const state = await store.getState();
    expect(Object.keys(state.records).sort()).toEqual([GOLF_HOW, GOLF_NICE]);

    expect(platform.putSave).toHaveBeenCalledTimes(1);
    const sent = JSON.parse(platform.putSave.mock.calls[0][0].data);
    expect(Object.keys(sent.records).sort()).toEqual([GOLF_HOW, GOLF_NICE]);
  });

  it('pushes an unlock to the account right away', async () => {
    const storage = new FakeStorage();
    const platform = makePlatform(null);
    const store = new SyncedAchievementStore({ storage, slotDeps: slotDeps(storage, platform) });

    const res = await store.unlock(GOLF_NICE);
    expect(res.unlockedNow).toBe(true);

    await vi.waitFor(() => expect(platform.putSave).toHaveBeenCalledTimes(1));
    const sent = JSON.parse(platform.putSave.mock.calls[0][0].data);
    expect(sent.records[GOLF_NICE].unlockedAt).toEqual(expect.any(String));
  });

  it('does not touch the platform when not signed in', async () => {
    const storage = new FakeStorage();
    const platform = makePlatform(save({ [GOLF_NICE]: { progress: 1 } }));
    const store = new SyncedAchievementStore({ storage, slotDeps: slotDeps(storage, platform, false) });

    expect(Object.keys((await store.getState()).records)).toEqual([]);
    await store.unlock(GOLF_HOW);
    expect(platform.getSave).not.toHaveBeenCalled();
    expect(platform.putSave).not.toHaveBeenCalled();
  });

  it('catalog ids used in these tests exist', () => {
    expect(ACHIEVEMENTS.some((d) => d.id === GOLF_NICE)).toBe(true);
    expect(ACHIEVEMENTS.some((d) => d.id === GOLF_HOW)).toBe(true);
  });
});

describe('SyncedAchievementStore same-tick unlocks', () => {
  const THIRD = 'bowling-all-gnomes-down';

  /** The records in the last save pushed to the account. */
  function lastPushed(platform: ReturnType<typeof makePlatform>): Record<string, unknown> {
    const calls = platform.putSave.mock.calls;
    return JSON.parse(calls[calls.length - 1][0].data).records;
  }

  /** Lets the debounced push (30 s window, faked) and any pending microtasks run. */
  async function flushPush(): Promise<void> {
    await vi.advanceTimersByTimeAsync(31_000);
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps both of two unlocks started in the same tick', async () => {
    const storage = new FakeStorage();
    const platform = makePlatform(null);
    const store = new SyncedAchievementStore({ storage, slotDeps: slotDeps(storage, platform) });

    await Promise.all([store.unlock(GOLF_NICE), store.unlock(GOLF_HOW)]);

    const state = await store.getState();
    expect(state.records[GOLF_NICE]?.unlockedAt).toBeTruthy();
    expect(state.records[GOLF_HOW]?.unlockedAt).toBeTruthy();

    const stored = JSON.parse(storage.getItem(ACHIEVEMENTS_STORAGE_KEY) as string);
    expect(Object.keys(stored.records).sort()).toEqual([GOLF_HOW, GOLF_NICE]);

    await flushPush();
    expect(Object.keys(lastPushed(platform)).sort()).toEqual([GOLF_HOW, GOLF_NICE]);
  });

  it('keeps an increment and an unlock started in the same tick', async () => {
    const storage = new FakeStorage();
    const platform = makePlatform(null);
    const store = new SyncedAchievementStore({ storage, slotDeps: slotDeps(storage, platform) });

    await Promise.all([store.increment(THIRD, 1), store.unlock(GOLF_HOW)]);

    const stored = JSON.parse(storage.getItem(ACHIEVEMENTS_STORAGE_KEY) as string);
    expect(Object.keys(stored.records).sort()).toEqual([GOLF_HOW, THIRD].sort());

    await flushPush();
    const pushed = lastPushed(platform);
    expect(Object.keys(pushed).sort()).toEqual([GOLF_HOW, THIRD].sort());
  });

  it('keeps all three when the account already has a third achievement', async () => {
    const storage = new FakeStorage();
    const platform = makePlatform(save({ [THIRD]: { progress: 1, unlockedAt: '2026-01-01T00:00:00.000Z' } }));
    const store = new SyncedAchievementStore({ storage, slotDeps: slotDeps(storage, platform) });

    await Promise.all([store.unlock(GOLF_NICE), store.unlock(GOLF_HOW)]);

    const stored = JSON.parse(storage.getItem(ACHIEVEMENTS_STORAGE_KEY) as string);
    expect(Object.keys(stored.records).sort()).toEqual([GOLF_HOW, GOLF_NICE, THIRD].sort());

    await flushPush();
    expect(Object.keys(lastPushed(platform)).sort()).toEqual([GOLF_HOW, GOLF_NICE, THIRD].sort());
  });
});
