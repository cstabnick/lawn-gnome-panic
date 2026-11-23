import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_SAVE_BYTES, type PlatformApi } from '@lawn/cloudsave';
import {
  BUNDLE_KEY,
  applyBundle,
  cloudStatus,
  cloudStatusText,
  mergeBundles,
  parseBundle,
  refreshBundle,
  setCloudDepsForTest,
  startCloudSave,
  stringifyBundle,
  summarizeBundle,
  type Bundle,
} from './cloudSave';
import { notifySaveChanged } from './saveHook';
import { GTA_SAVE_KEYS, resetSaveBundle } from './saveIO';

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
const GAME_ID = 14;

/** A fake account: one save, revisioned like the real SaveService (a put on a stale base is Aborted). */
function makeApi() {
  let remote: { data: string; revision: bigint; summary: string; game: number } | null = null;
  const getSave = vi.fn(async () => {
    if (!remote) throw new ConnectError(NOT_FOUND);
    return { save: { ...remote, updatedAt: undefined } };
  });
  const putSave = vi.fn(async (req: { data: string; summary: string; baseRevision: bigint; game: number }) => {
    if ((remote?.revision ?? 0n) !== req.baseRevision) throw new ConnectError(ABORTED);
    remote = { data: req.data, summary: req.summary, game: req.game, revision: req.baseRevision + 1n };
    return { save: { ...remote, updatedAt: undefined } };
  });
  const api = {
    getAccessToken: vi.fn(async () => 'tok'),
    saveClient: () => ({ getSave, putSave }),
    ConnectError,
    Code: { NotFound: NOT_FOUND, Aborted: ABORTED },
    Game: { GNOME_THEFT_AUTO: GAME_ID },
  };
  return {
    api,
    getSave,
    putSave,
    remote: () => remote,
    /** Another device wrote this bundle. */
    setRemote(b: Bundle) {
      remote = { data: stringifyBundle(b), summary: '', game: GAME_ID, revision: (remote?.revision ?? 0n) + 1n };
    },
  };
}

function setup(over: { signedIn?: () => boolean; load?: () => Promise<PlatformApi> } = {}) {
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
  return { storage, ...fake, advance: (ms: number) => { t += ms; } };
}

const remoteBundle = (b: string) => parseBundle(b);

afterEach(() => {
  setCloudDepsForTest({ storage: null, signedIn: () => false });
  vi.useRealTimers();
});

describe('per-key merges', () => {
  it('quests merge, sets union, laps keep the faster, state keys take the newer side', () => {
    const local: Bundle = { v: 1, keys: {
      'gta-quests-v1': { t: 10, raw: JSON.stringify({ q1: { state: 'active', step: 1, cracked: ['a'] } }) },
      'gta-stunts-v1': { t: 10, raw: JSON.stringify(['jump-a']) },
      'gta-collectibles-v1': { t: 10, raw: JSON.stringify({ acorns: ['a1'], shards: [], signs: ['s1'] }) },
      'gta-speedway-laps-v1': { t: 10, raw: JSON.stringify({ best: { 'ride-on': { time: 50, splits: [1] }, lowrider: { time: 40, splits: [] } } }) },
      'gta-economy-v1': { t: 30, raw: JSON.stringify({ acorns: 300, debtRemaining: 4000, debtPaidOff: false }) },
      'gta-glaze-v1': { t: 5, raw: '{"lowrider":"old"}' },
    } };
    const remote: Bundle = { v: 1, keys: {
      'gta-quests-v1': { t: 20, raw: JSON.stringify({ q1: { state: 'done', step: 2, cracked: ['b'] }, q2: { state: 'done', step: 1, cracked: [] } }) },
      'gta-stunts-v1': { t: 20, raw: JSON.stringify(['jump-b']) },
      'gta-collectibles-v1': { t: 20, raw: JSON.stringify({ acorns: ['a2'], shards: ['x'], signs: ['s1'] }) },
      'gta-speedway-laps-v1': { t: 20, raw: JSON.stringify({ best: { 'ride-on': { time: 45, splits: [2] }, lowrider: { time: 60, splits: [] } } }) },
      'gta-economy-v1': { t: 20, raw: JSON.stringify({ acorns: 900, debtRemaining: 4000, debtPaidOff: false }) },
      'gta-glaze-v1': { t: 25, raw: '{"lowrider":"new"}' },
      'gta-boats-helmed-v1': { t: 20, raw: JSON.stringify(['gravy-boat']) },
    } };
    const out = parseBundle(mergeBundles(stringifyBundle(local), stringifyBundle(remote)));
    const quests = JSON.parse(out.keys['gta-quests-v1']!.raw!);
    expect(quests.q1).toEqual({ state: 'done', step: 2, cracked: ['a', 'b'] });
    expect(quests.q2.state).toBe('done');
    expect(JSON.parse(out.keys['gta-stunts-v1']!.raw!)).toEqual(['jump-a', 'jump-b']);
    expect(JSON.parse(out.keys['gta-collectibles-v1']!.raw!)).toEqual({ acorns: ['a1', 'a2'], shards: ['x'], signs: ['s1'] });
    const laps = JSON.parse(out.keys['gta-speedway-laps-v1']!.raw!).best;
    expect(laps['ride-on']).toEqual({ time: 45, splits: [2] });
    expect(laps.lowrider.time).toBe(40);
    expect(JSON.parse(out.keys['gta-economy-v1']!.raw!).acorns).toBe(300); // local written later
    expect(out.keys['gta-glaze-v1']!.raw).toBe('{"lowrider":"new"}'); // remote written later
    expect(out.keys['gta-boats-helmed-v1']!.raw).toBe('["gravy-boat"]'); // only one side has it
    expect(summarizeBundle(stringifyBundle(out))).toBe('2 quests done, 300 Acorns');
  });

  it('is idempotent and the same both ways round', () => {
    const a: Bundle = { v: 1, keys: {
      'gta-quests-v1': { t: 1, raw: JSON.stringify({ q2: { state: 'active', step: 0, cracked: [] } }) },
      'gta-stunts-v1': { t: 1, raw: '["b","a"]' },
      'gta-economy-v1': { t: 7, raw: '{"acorns":1}' },
    } };
    const b: Bundle = { v: 1, keys: {
      'gta-quests-v1': { t: 2, raw: JSON.stringify({ q1: { state: 'done', step: 1, cracked: [] } }) },
      'gta-stunts-v1': { t: 2, raw: '["c"]' },
      'gta-economy-v1': { t: 7, raw: '{"acorns":2}' },
    } };
    const ab = mergeBundles(stringifyBundle(a), stringifyBundle(b));
    expect(mergeBundles(stringifyBundle(b), stringifyBundle(a))).toBe(ab);
    expect(mergeBundles(ab, stringifyBundle(b))).toBe(ab);
    expect(mergeBundles(ab, ab)).toBe(ab);
  });

  it('a tombstone (reset) beats an older value, even for a growing set', () => {
    const local: Bundle = { v: 1, keys: { 'gta-stunts-v1': { t: 50, raw: null } } };
    const remote: Bundle = { v: 1, keys: { 'gta-stunts-v1': { t: 10, raw: '["a"]' } } };
    expect(parseBundle(mergeBundles(stringifyBundle(local), stringifyBundle(remote))).keys['gta-stunts-v1']).toEqual({ t: 50, raw: null });
  });

  it('keeps a full save well under the 512 KiB limit', () => {
    const s = new FakeStorage();
    const quests: Record<string, unknown> = {};
    for (let i = 0; i < 200; i++) quests[`quest-${i}`] = { state: 'done', step: 6, cracked: ['t1', 't2', 't3', 't4'] };
    s.setItem('gta-quests-v1', JSON.stringify(quests));
    s.setItem('gta-collectibles-v1', JSON.stringify({ acorns: Array.from({ length: 300 }, (_, i) => `acorn-${i}`), shards: [], signs: [] }));
    s.setItem('gta-glaze-v1', JSON.stringify(Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`kind-${i}`, 'x'.repeat(200)]))));
    const bytes = new TextEncoder().encode(refreshBundle(s, 1)).length;
    expect(bytes).toBeLessThan(MAX_SAVE_BYTES / 8);
  });
});

describe('bundle <-> keys', () => {
  it('refresh stamps changed keys, tombstones removed ones, and apply writes them back', () => {
    const s = new FakeStorage();
    s.setItem('gta-economy-v1', '{"acorns":5}');
    refreshBundle(s, 100);
    expect(parseBundle(s.getItem(BUNDLE_KEY)).keys['gta-economy-v1']).toEqual({ t: 100, raw: '{"acorns":5}' });
    refreshBundle(s, 200); // unchanged: keeps its time
    expect(parseBundle(s.getItem(BUNDLE_KEY)).keys['gta-economy-v1']!.t).toBe(100);
    resetSaveBundle(s);
    refreshBundle(s, 300);
    expect(parseBundle(s.getItem(BUNDLE_KEY)).keys['gta-economy-v1']).toEqual({ t: 300, raw: null });
    // apply: the bundle wins over the keys
    s.setItem(BUNDLE_KEY, stringifyBundle({ v: 1, keys: { 'gta-garage': { t: 1, raw: '{"lowrider":{}}' } } }));
    s.setItem('gta-economy-v1', 'stale');
    applyBundle(s);
    expect(s.getItem('gta-garage')).toBe('{"lowrider":{}}');
  });

  it('a stale write to a growing set does not drop what the bundle already holds', () => {
    const s = new FakeStorage();
    s.setItem(BUNDLE_KEY, stringifyBundle({ v: 1, keys: { 'gta-stunts-v1': { t: 1, raw: '["a","b"]' } } }));
    s.setItem('gta-stunts-v1', '["a","c"]'); // the module only knew "a"
    refreshBundle(s, 5);
    expect(parseBundle(s.getItem(BUNDLE_KEY)).keys['gta-stunts-v1']!.raw).toBe('["a","b","c"]');
  });

  it('every save key is in the bundle', () => {
    const s = new FakeStorage();
    for (const k of GTA_SAVE_KEYS) s.setItem(k, '1');
    expect(Object.keys(parseBundle(refreshBundle(s, 1)).keys).sort()).toEqual([...GTA_SAVE_KEYS].sort());
  });
});

describe('startup sync and pushes', () => {
  it('first sign-in uploads this device\'s progress under GNOME_THEFT_AUTO', async () => {
    const { storage, putSave } = setup();
    storage.setItem('gta-economy-v1', '{"acorns":77}');
    await startCloudSave();
    expect(cloudStatus()).toBe('synced');
    expect(putSave).toHaveBeenCalledTimes(1);
    const req = putSave.mock.calls[0][0];
    expect(req.game).toBe(GAME_ID);
    expect(parseBundle(req.data).keys['gta-economy-v1']!.raw).toBe('{"acorns":77}');
  });

  it('merges the account\'s progress into the keys before the game reads them', async () => {
    const f = setup();
    f.storage.setItem('gta-stunts-v1', '["here"]');
    f.setRemote({ v: 1, keys: {
      'gta-stunts-v1': { t: 1, raw: '["there"]' },
      'gta-glaze-v1': { t: 1, raw: '{"lowrider":"code"}' },
      'gta-quests-v1': { t: 1, raw: JSON.stringify({ q1: { state: 'done', step: 1, cracked: [] } }) },
    } });
    await startCloudSave();
    expect(f.storage.getItem('gta-stunts-v1')).toBe('["here","there"]');
    expect(f.storage.getItem('gta-glaze-v1')).toBe('{"lowrider":"code"}');
    expect(JSON.parse(f.storage.getItem('gta-quests-v1')!).q1.state).toBe('done');
    // and the merged bundle went back up
    expect(remoteBundle(f.remote()!.data).keys['gta-stunts-v1']!.raw).toBe('["here","there"]');
  });

  it('pushes after a save write (notifySaveChanged), throttled to one push per window', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const f = setup();
    await startCloudSave();
    expect(f.putSave).toHaveBeenCalledTimes(0); // nothing on either side
    f.storage.setItem('gta-economy-v1', '{"acorns":10}');
    notifySaveChanged();
    await vi.waitFor(() => expect(f.putSave).toHaveBeenCalledTimes(1));
    expect(parseBundle(f.remote()!.data).keys['gta-economy-v1']!.raw).toBe('{"acorns":10}');
    f.storage.setItem('gta-economy-v1', '{"acorns":11}');
    notifySaveChanged(); // inside the 30 s window: queued
    expect(f.putSave).toHaveBeenCalledTimes(1);
    f.advance(30_000);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(f.putSave).toHaveBeenCalledTimes(2);
    expect(parseBundle(f.remote()!.data).keys['gta-economy-v1']!.raw).toBe('{"acorns":11}');
  });

  it('a push that loses to another device merges both (conflict) and keeps the other device\'s data', async () => {
    const f = setup();
    await startCloudSave();
    // another device writes after our startup sync
    f.setRemote({ v: 1, keys: { 'gta-boats-helmed-v1': { t: 5, raw: '["gravy-boat"]' } } });
    f.storage.setItem('gta-boats-helmed-v1', '["walnut-dinghy"]');
    notifySaveChanged();
    await vi.waitFor(() => expect(remoteBundle(f.remote()!.data).keys['gta-boats-helmed-v1']!.raw).toBe('["gravy-boat","walnut-dinghy"]'));
    // the merge reached this device's key too (onLocalChanged)
    expect(f.storage.getItem('gta-boats-helmed-v1')).toBe('["gravy-boat","walnut-dinghy"]');
    expect(cloudStatus()).toBe('synced');
  });

  it('offline (service unreachable) never blocks startup and plays from localStorage', async () => {
    const f = setup({ load: () => new Promise<PlatformApi>(() => {}) }); // hangs forever
    f.storage.setItem('gta-economy-v1', '{"acorns":3}');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const started = startCloudSave(4000);
    await vi.advanceTimersByTimeAsync(4000);
    await started;
    expect(cloudStatus()).toBe('off');
    expect(f.storage.getItem('gta-economy-v1')).toBe('{"acorns":3}');
    notifySaveChanged(); // no throw, no push
    expect(f.putSave).not.toHaveBeenCalled();
    expect(cloudStatusText('off', true)).toMatch(/Offline/);
  });

  it('a network error at startup is offline too', async () => {
    const f = setup();
    f.getSave.mockRejectedValueOnce(new Error('network down'));
    await startCloudSave();
    expect(cloudStatus()).toBe('off');
    expect(f.putSave).not.toHaveBeenCalled();
  });

  it('not signed in: no network at all', async () => {
    const load = vi.fn();
    setup({ signedIn: () => false, load });
    await startCloudSave();
    expect(load).not.toHaveBeenCalled();
    expect(cloudStatus()).toBe('off');
    expect(cloudStatusText('off', false)).toMatch(/Sign in/);
  });
});
