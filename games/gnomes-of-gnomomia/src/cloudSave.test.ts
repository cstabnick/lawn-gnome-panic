import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cloudStatus,
  onCloudStatus,
  pushSave,
  resolveConflict,
  setCloudDepsForTest,
  summarize,
  syncAtStartup,
  SYNC_KEY,
  type PlatformApi,
} from './cloudSave';
import { SAVE_KEY } from './config';
import { ZONES } from './content';
import { CLASSES } from './data/classes';

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
const ABORTED = 10;
const ZONE = 'mossbottom';
const ZONE_NAME = ZONES.mossbottom.name;
const WARDEN = CLASSES.warden.name;

function saveText(level: number, classId: string | null = 'warden', zone = ZONE, extra = ''): string {
  return JSON.stringify({
    v: 2,
    state: { level, ...(classId ? { classId } : {}), inventory: [], ...(extra ? { extra } : {}) },
    zone,
    x: 1,
    z: 2,
  });
}

function makeApi() {
  const getSave = vi.fn<(req: unknown) => Promise<{ save?: unknown }>>(async () => {
    throw new ConnectError(NOT_FOUND);
  });
  const putSave = vi.fn(async (req: { data: string; summary: string; baseRevision: bigint; game: number }) => ({
    save: { ...req, revision: req.baseRevision + 1n, updatedAt: undefined },
  }));
  const api = {
    getAccessToken: vi.fn(async () => 'tok'),
    saveClient: () => ({ getSave, putSave }),
    ConnectError,
    Code: { NotFound: NOT_FOUND, Aborted: ABORTED },
    Game: { GNOMOMIA: 7 },
  };
  return { api, getSave, putSave };
}

function setup(over: Partial<{ signedIn: () => boolean }> = {}) {
  const storage = new FakeStorage();
  const fake = makeApi();
  let t = 0;
  setCloudDepsForTest({
    storage,
    signedIn: () => true,
    load: async () => fake.api as unknown as PlatformApi,
    now: () => t,
    ...over,
  });
  return {
    storage,
    ...fake,
    setNow: (v: number) => {
      t = v;
    },
  };
}

function meta(storage: FakeStorage): { rev: number; hash: string } {
  return JSON.parse(storage.getItem(SYNC_KEY) as string);
}

/** Startup with this browser holding `local` and no account save: pushes it as revision 1. */
async function baseline(s: ReturnType<typeof setup>, local: string) {
  s.storage.setItem(SAVE_KEY, local);
  const r = await syncAtStartup();
  expect(r).toEqual({ kind: 'ok', pulled: false });
  expect(meta(s.storage).rev).toBe(1);
}

async function flush() {
  for (let i = 0; i < 30; i++) await Promise.resolve();
}

afterEach(() => {
  vi.useRealTimers();
});

describe('syncAtStartup', () => {
  it('does nothing when not signed in', async () => {
    const s = setup({ signedIn: () => false });
    s.storage.setItem(SAVE_KEY, saveText(3));
    expect(await syncAtStartup()).toEqual({ kind: 'off' });
    expect(s.getSave).not.toHaveBeenCalled();
    expect(s.putSave).not.toHaveBeenCalled();
    expect(cloudStatus()).toBe('off');
  });

  it('case 1: no save on either side → synced, nothing pushed', async () => {
    const s = setup();
    expect(await syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(cloudStatus()).toBe('synced');
    expect(s.putSave).not.toHaveBeenCalled();
    expect(s.storage.getItem(SAVE_KEY)).toBeNull();
  });

  it('case 2: only this browser has a save → pushed as revision 1', async () => {
    const s = setup();
    const local = saveText(3);
    s.storage.setItem(SAVE_KEY, local);
    expect(await syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(s.putSave).toHaveBeenCalledTimes(1);
    const req = s.putSave.mock.calls[0][0];
    expect(req.game).toBe(7);
    expect(req.data).toBe(local);
    expect(req.summary).toBe(`Level 3 ${WARDEN}, ${ZONE_NAME}`);
    expect(req.baseRevision).toBe(0n);
    expect(meta(s.storage).rev).toBe(1);
    expect(meta(s.storage).hash).toMatch(/^[0-9a-f]{8}$/);
    expect(cloudStatus()).toBe('synced');
  });

  it('case 3: only the account has a save → written to localStorage', async () => {
    const s = setup();
    const remoteData = saveText(9, 'slinger');
    s.getSave.mockResolvedValueOnce({
      save: {
        game: 7,
        data: remoteData,
        summary: 'Level 9 Slinger, Mossbottom',
        revision: 3n,
        updatedAt: { seconds: 1700000000n, nanos: 0 },
      },
    });
    expect(await syncAtStartup()).toEqual({ kind: 'ok', pulled: true });
    expect(s.storage.getItem(SAVE_KEY)).toBe(remoteData);
    expect(meta(s.storage).rev).toBe(3);
    expect(cloudStatus()).toBe('synced');
    expect(s.putSave).not.toHaveBeenCalled();
  });

  it('case 4: both sides identical → bookkeeping recorded, nothing moves', async () => {
    const s = setup();
    const text = saveText(4);
    s.storage.setItem(SAVE_KEY, text);
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: text, summary: '', revision: 6n } });
    expect(await syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(meta(s.storage).rev).toBe(6);
    expect(s.putSave).not.toHaveBeenCalled();
    expect(s.storage.getItem(SAVE_KEY)).toBe(text);
  });

  it('case 4: only the account changed → take the account save', async () => {
    const s = setup();
    await baseline(s, saveText(2));
    const remoteData = saveText(5, 'mage');
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: remoteData, summary: '', revision: 5n } });
    expect(await syncAtStartup()).toEqual({ kind: 'ok', pulled: true });
    expect(s.storage.getItem(SAVE_KEY)).toBe(remoteData);
    expect(meta(s.storage).rev).toBe(5);
    expect(s.putSave).toHaveBeenCalledTimes(1); // only the baseline push
  });

  it('case 4: only this browser changed → push on top of the account revision', async () => {
    const s = setup();
    await baseline(s, saveText(2));
    const local = saveText(3);
    s.storage.setItem(SAVE_KEY, local);
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: saveText(2), summary: '', revision: 1n } });
    expect(await syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(s.putSave).toHaveBeenCalledTimes(2);
    const req = s.putSave.mock.calls[1][0];
    expect(req.data).toBe(local);
    expect(req.baseRevision).toBe(1n);
    expect(meta(s.storage).rev).toBe(2);
    expect(cloudStatus()).toBe('synced');
  });

  it('case 4: both changed → conflict, then resolveConflict("remote") takes the account save', async () => {
    const s = setup();
    await baseline(s, saveText(2));
    const local = saveText(3);
    s.storage.setItem(SAVE_KEY, local);
    const remoteData = saveText(7, 'warden', 'keep');
    s.getSave.mockResolvedValueOnce({
      save: {
        game: 7,
        data: remoteData,
        summary: 'Level 7 Warden, Keep',
        revision: 5n,
        updatedAt: { seconds: 1700000000n, nanos: 0 },
      },
    });
    const r = await syncAtStartup();
    expect(r).toEqual({
      kind: 'conflict',
      local: { summary: `Level 3 ${WARDEN}, ${ZONE_NAME}`, updatedAt: '' },
      remote: { summary: 'Level 7 Warden, Keep', updatedAt: new Date(1700000000 * 1000).toISOString() },
    });
    expect(cloudStatus()).toBe('syncing');
    expect(s.storage.getItem(SAVE_KEY)).toBe(local); // untouched until the player chooses

    await resolveConflict('remote');
    expect(s.storage.getItem(SAVE_KEY)).toBe(remoteData);
    expect(meta(s.storage).rev).toBe(5);
    expect(cloudStatus()).toBe('synced');
    expect(s.putSave).toHaveBeenCalledTimes(1);
  });

  it('case 4: both changed → resolveConflict("local") pushes over the account revision', async () => {
    const s = setup();
    await baseline(s, saveText(2));
    const local = saveText(3);
    s.storage.setItem(SAVE_KEY, local);
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: saveText(8), summary: '', revision: 5n } });
    expect((await syncAtStartup()).kind).toBe('conflict');

    await resolveConflict('local');
    expect(s.putSave).toHaveBeenCalledTimes(2);
    const req = s.putSave.mock.calls[1][0];
    expect(req.data).toBe(local);
    expect(req.baseRevision).toBe(5n);
    expect(meta(s.storage).rev).toBe(6);
    expect(s.storage.getItem(SAVE_KEY)).toBe(local);
    expect(cloudStatus()).toBe('synced');
  });

  it('resolveConflict with no pending conflict does nothing', async () => {
    const s = setup();
    await resolveConflict('local');
    await resolveConflict('remote');
    expect(s.putSave).not.toHaveBeenCalled();
    expect(cloudStatus()).toBe('off');
  });

  it('gives up after timeoutMs when getSave never resolves → off', async () => {
    const s = setup();
    s.getSave.mockImplementationOnce(() => new Promise(() => {}));
    expect(await syncAtStartup(20)).toEqual({ kind: 'off' });
    expect(cloudStatus()).toBe('off');
  });

  it('a push aborted during startup → stopped and off', async () => {
    const s = setup();
    s.storage.setItem(SAVE_KEY, saveText(3));
    s.putSave.mockRejectedValueOnce(new ConnectError(ABORTED));
    expect(await syncAtStartup()).toEqual({ kind: 'off' });
    expect(cloudStatus()).toBe('stopped');
  });
});

describe('pushSave', () => {
  it('throttles to one push per 30 s with one trailing push, and skips unchanged text', async () => {
    vi.useFakeTimers();
    const s = setup();
    await baseline(s, saveText(1));
    expect(s.putSave).toHaveBeenCalledTimes(1);

    s.setNow(1000);
    s.storage.setItem(SAVE_KEY, saveText(2));
    pushSave(); // window open: immediate
    await flush();
    expect(s.putSave).toHaveBeenCalledTimes(2);
    expect(s.putSave.mock.calls[1][0].baseRevision).toBe(1n);

    s.setNow(2000);
    s.storage.setItem(SAVE_KEY, saveText(3));
    pushSave(); // inside the window: schedules one trailing push
    s.setNow(2500);
    s.storage.setItem(SAVE_KEY, saveText(4));
    pushSave(); // extra call: no second timer
    await flush();
    expect(s.putSave).toHaveBeenCalledTimes(2);

    s.setNow(31000);
    vi.advanceTimersByTime(29000); // the window ends 29 s after the call at t=2000
    await flush();
    expect(s.putSave).toHaveBeenCalledTimes(3);
    const trailing = s.putSave.mock.calls[2][0];
    expect(trailing.data).toBe(saveText(4));
    expect(trailing.baseRevision).toBe(2n);

    // text unchanged since the last push → no push
    s.setNow(100000);
    pushSave();
    await flush();
    vi.advanceTimersByTime(60000);
    await flush();
    expect(s.putSave).toHaveBeenCalledTimes(3);
  });

  it('an aborted push → stopped, and later pushSave does nothing', async () => {
    const s = setup();
    await baseline(s, saveText(1));
    s.putSave.mockRejectedValueOnce(new ConnectError(ABORTED));
    s.storage.setItem(SAVE_KEY, saveText(2));
    pushSave();
    await flush();
    expect(cloudStatus()).toBe('stopped');

    s.setNow(100000);
    s.storage.setItem(SAVE_KEY, saveText(3));
    pushSave();
    await flush();
    expect(s.putSave).toHaveBeenCalledTimes(2);
  });

  it('a failing push other than Aborted stays synced and never throws', async () => {
    const s = setup();
    await baseline(s, saveText(1));
    s.putSave.mockRejectedValueOnce(new Error('network down'));
    s.storage.setItem(SAVE_KEY, saveText(2));
    expect(() => pushSave()).not.toThrow();
    await flush();
    expect(cloudStatus()).toBe('synced');
  });

  it('does nothing before startup has synced', () => {
    const s = setup();
    s.storage.setItem(SAVE_KEY, saveText(2));
    pushSave();
    expect(s.putSave).not.toHaveBeenCalled();
  });
});

describe('summarize', () => {
  it('reads level, class and zone from a real-shaped save', () => {
    expect(summarize(saveText(7, 'warden'))).toBe(`Level 7 ${WARDEN}, ${ZONE_NAME}`);
  });

  it('uses "gnome" when the class is missing', () => {
    expect(summarize(saveText(3, null))).toBe(`Level 3 gnome, ${ZONE_NAME}`);
  });

  it('returns "A saved gnome" for garbage', () => {
    expect(summarize('not json')).toBe('A saved gnome');
    expect(summarize('null')).toBe('A saved gnome');
    expect(summarize(JSON.stringify({ v: 2, state: { level: 'x' }, zone: ZONE }))).toBe('A saved gnome');
    expect(summarize(JSON.stringify({ v: 2, state: { level: 2 }, zone: 'nowhere' }))).toBe('A saved gnome');
  });
});

describe('onCloudStatus', () => {
  it('fires on changes and stops after unsubscribe', async () => {
    setup();
    const cb = vi.fn();
    const unsub = onCloudStatus(cb);
    expect(await syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(cb).toHaveBeenCalledWith('synced');
    unsub();
    setCloudDepsForTest({ signedIn: () => false });
    await syncAtStartup();
    expect(cloudStatus()).toBe('off');
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
