import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCloudSlot,
  hashText,
  MAX_SAVE_BYTES,
  type CloudDeps,
  type CloudSlot,
  type CloudSlotOptions,
  type CloudStatus,
  type PlatformApi,
} from './index';

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
const SAVE_KEY = 'test.save';
const SYNC_KEY = 'test.sync';

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
    Game: { ARCADE: 8, GNOMOMIA: 7 },
  };
  return { api, getSave, putSave };
}

/** A slot over a fake storage and fake platform. Each call is a fresh, independent slot. */
function makeSlot(
  over: Partial<CloudSlotOptions> = {},
  deps: Partial<CloudDeps> = {},
  signedIn: () => boolean = () => true,
) {
  const storage = new FakeStorage();
  const fake = makeApi();
  let t = 0;
  const slot: CloudSlot = createCloudSlot({
    game: 'GNOMOMIA',
    saveKey: SAVE_KEY,
    syncKey: SYNC_KEY,
    summarize: (text) => `summary of ${text}`,
    ...over,
    deps: {
      storage,
      signedIn,
      load: async () => fake.api as unknown as PlatformApi,
      now: () => t,
      ...deps,
    },
  });
  return {
    slot,
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

/** Lets every already-queued promise and mock resolution run (push() is fire-and-forget). */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** merge() from the achievements-style case: sorted, deduplicated comma-separated words; no local → remote. */
function union(local: string | null, remote: string): string {
  if (local === null) return remote;
  const words = new Set([...local.split(','), ...remote.split(',')].filter((w) => w !== ''));
  return [...words].sort().join(',');
}

/** Startup with this browser holding `local` and no account save: pushes it as revision 1 (choose mode). */
async function baseline(s: ReturnType<typeof makeSlot>, local: string) {
  s.storage.setItem(SAVE_KEY, local);
  expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
  expect(meta(s.storage).rev).toBe(1);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('choose mode', () => {
  it('no local save and no remote save → ok, nothing pushed', async () => {
    const s = makeSlot();
    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(s.slot.status()).toBe('synced');
    expect(s.putSave).not.toHaveBeenCalled();
    expect(s.storage.getItem(SAVE_KEY)).toBeNull();
  });

  it('local save only → pushed with baseRevision 0n', async () => {
    const s = makeSlot();
    s.storage.setItem(SAVE_KEY, 'a');
    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(s.putSave).toHaveBeenCalledTimes(1);
    const req = s.putSave.mock.calls[0][0];
    expect(req.data).toBe('a');
    expect(req.baseRevision).toBe(0n);
    expect(req.game).toBe(7);
    expect(meta(s.storage).rev).toBe(1);
  });

  it('remote save only → pulled into localStorage', async () => {
    const s = makeSlot();
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: 'remote', summary: '', revision: 3n } });
    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: true });
    expect(s.storage.getItem(SAVE_KEY)).toBe('remote');
    expect(meta(s.storage).rev).toBe(3);
    expect(s.putSave).not.toHaveBeenCalled();
  });

  it('both changed since the last sync → conflict; resolveConflict("remote") takes the account save', async () => {
    const s = makeSlot();
    await baseline(s, 'a');
    s.storage.setItem(SAVE_KEY, 'b'); // this browser changed
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: 'c', summary: 'remote summary', revision: 5n } });

    const r = await s.slot.syncAtStartup();
    expect(r.kind).toBe('conflict');
    expect(s.slot.status()).toBe('syncing');
    expect(s.storage.getItem(SAVE_KEY)).toBe('b'); // untouched until the player chooses

    await s.slot.resolveConflict('remote');
    expect(s.storage.getItem(SAVE_KEY)).toBe('c');
    expect(meta(s.storage).rev).toBe(5);
    expect(s.slot.status()).toBe('synced');
    expect(s.putSave).toHaveBeenCalledTimes(1); // only the baseline push
  });

  it('a push refused as Aborted during play → stopped', async () => {
    const s = makeSlot();
    await baseline(s, 'a');
    s.putSave.mockRejectedValueOnce(new ConnectError(ABORTED));
    s.storage.setItem(SAVE_KEY, 'b');
    s.slot.pushSave();
    await settle();
    expect(s.slot.status()).toBe('stopped');
  });
});

describe('merge mode', () => {
  it('throws when no merge function is given', () => {
    expect(() => createCloudSlot({ game: 'GNOMOMIA', saveKey: SAVE_KEY, syncKey: SYNC_KEY, summarize: String, mode: 'merge' })).toThrow();
  });

  it('startup: local "a" + remote "b" → local becomes "a,b", pushed on top of the remote revision, pulled true', async () => {
    const s = makeSlot({ mode: 'merge', merge: union });
    s.storage.setItem(SAVE_KEY, 'a');
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: 'b', summary: '', revision: 4n } });

    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: true });
    expect(s.storage.getItem(SAVE_KEY)).toBe('a,b');
    expect(s.putSave).toHaveBeenCalledTimes(1);
    const req = s.putSave.mock.calls[0][0];
    expect(req.data).toBe('a,b');
    expect(req.baseRevision).toBe(4n);
    expect(meta(s.storage).rev).toBe(5);
    expect(s.slot.status()).toBe('synced');
  });

  it('startup: remote already equals the merged text → no put, bookkeeping recorded', async () => {
    const s = makeSlot({ mode: 'merge', merge: union });
    s.storage.setItem(SAVE_KEY, 'a');
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: 'a,b', summary: '', revision: 4n } });

    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: true });
    expect(s.storage.getItem(SAVE_KEY)).toBe('a,b');
    expect(s.putSave).not.toHaveBeenCalled();
    expect(meta(s.storage).rev).toBe(4);
  });

  it('startup: no remote save → put with baseRevision 0n', async () => {
    const s = makeSlot({ mode: 'merge', merge: union });
    s.storage.setItem(SAVE_KEY, 'a');
    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(s.putSave).toHaveBeenCalledTimes(1);
    expect(s.putSave.mock.calls[0][0].baseRevision).toBe(0n);
    expect(s.putSave.mock.calls[0][0].data).toBe('a');
  });

  it('pushSave after a local change → put on top of the last synced revision', async () => {
    const s = makeSlot({ mode: 'merge', merge: union });
    s.storage.setItem(SAVE_KEY, 'a');
    await s.slot.syncAtStartup(); // revision 1
    s.storage.setItem(SAVE_KEY, 'a,c');
    s.slot.pushSave();
    await settle();
    expect(s.putSave).toHaveBeenCalledTimes(2);
    const req = s.putSave.mock.calls[1][0];
    expect(req.data).toBe('a,c');
    expect(req.baseRevision).toBe(1n);
    expect(meta(s.storage).rev).toBe(2);
  });

  it('a put refused as Aborted → re-read, merged, put again, and onLocalChanged gets the merged text', async () => {
    const onLocalChanged = vi.fn();
    const s = makeSlot({ mode: 'merge', merge: union, onLocalChanged });
    s.storage.setItem(SAVE_KEY, 'a');
    await s.slot.syncAtStartup(); // revision 1, one getSave call so far
    expect(s.getSave).toHaveBeenCalledTimes(1);

    const statuses: CloudStatus[] = [];
    s.slot.onStatus((st) => statuses.push(st));

    // another device wrote revision 3 meanwhile
    s.getSave.mockResolvedValueOnce({ save: { game: 7, data: 'b', summary: '', revision: 3n } });
    s.putSave.mockRejectedValueOnce(new ConnectError(ABORTED));
    s.storage.setItem(SAVE_KEY, 'x');
    s.slot.pushSave();
    await settle();

    expect(s.getSave).toHaveBeenCalledTimes(2);
    expect(s.putSave).toHaveBeenCalledTimes(3); // baseline, refused, retry
    const retry = s.putSave.mock.calls[2][0];
    expect(retry.data).toBe('b,x');
    expect(retry.baseRevision).toBe(3n);
    expect(s.storage.getItem(SAVE_KEY)).toBe('b,x');
    expect(onLocalChanged).toHaveBeenCalledTimes(1);
    expect(onLocalChanged).toHaveBeenCalledWith('b,x');
    expect(meta(s.storage).rev).toBe(4);
    expect(s.slot.status()).toBe('synced');
    expect(statuses).not.toContain('stopped');
  });

  it('toCloud: the uploaded data is converted, but the local text and the meta hash stay as written', async () => {
    const s = makeSlot({ mode: 'merge', merge: union, toCloud: (t) => t.toUpperCase() });
    s.storage.setItem(SAVE_KEY, 'a');
    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(s.putSave).toHaveBeenCalledTimes(1);
    expect(s.putSave.mock.calls[0][0].data).toBe('A');
    expect(s.storage.getItem(SAVE_KEY)).toBe('a');
    expect(meta(s.storage).hash).toBe(hashText('a'));
  });

  it('a cloud text over MAX_SAVE_BYTES is not put', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = makeSlot({ mode: 'merge', merge: union });
    s.storage.setItem(SAVE_KEY, 'x'.repeat(MAX_SAVE_BYTES + 1));
    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'ok', pulled: false });
    expect(s.putSave).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    expect(s.slot.status()).toBe('synced');
  });
});

describe('startup timeout', () => {
  it('getSave never resolving → off after timeoutMs', async () => {
    const s = makeSlot();
    s.getSave.mockImplementationOnce(() => new Promise(() => {}));
    expect(await s.slot.syncAtStartup(20)).toEqual({ kind: 'off' });
    expect(s.slot.status()).toBe('off');
  });
});

describe('not signed in', () => {
  it('syncAtStartup → off and no platform calls', async () => {
    const s = makeSlot({}, {}, () => false);
    s.storage.setItem(SAVE_KEY, 'a');
    expect(await s.slot.syncAtStartup()).toEqual({ kind: 'off' });
    expect(s.getSave).not.toHaveBeenCalled();
    expect(s.putSave).not.toHaveBeenCalled();
  });
});
