import { describe, expect, it } from 'vitest';
import { checkName } from '@lawn/mp/textFilter';
import { LocalGnomeStore, STORAGE_KEY, type StorageLike } from './store';
import { GnomeStoreError, type Look } from './types';

function fakeStorage(initial?: string): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(STORAGE_KEY, initial);
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

const NOW = () => new Date('2026-01-02T03:04:05.000Z');
// Fixed random: every call returns 0.5, so the id and the number are deterministic.
const RANDOM = () => 0.5;

const LOOK: Look = {
  hatRgb: 0xd93636,
  coatRgb: 0x2f64c9,
  pantsRgb: 0x6b4a2e,
  bootsRgb: 0x222222,
  skinRgb: 0xf1c27d,
  freckles: true,
  dress: false,
  glasses: false,
};

describe('LocalGnomeStore', () => {
  it('creates and persists a gnome with no look on first getMe', async () => {
    const storage = fakeStorage();
    const gnome = await new LocalGnomeStore(storage, NOW, RANDOM).getMe();
    expect(gnome.userId).toMatch(/^local-[a-z0-9]{12}$/);
    expect(gnome.look).toBeUndefined();
    expect(gnome.createdAt).toBe('2026-01-02T03:04:05.000Z');
    expect(checkName(gnome.displayName).ok).toBe(true);
    expect(JSON.parse(storage.map.get(STORAGE_KEY)!)).toEqual(gnome);
  });

  it('gives the same userId to a second store on the same storage', async () => {
    const storage = fakeStorage();
    const first = await new LocalGnomeStore(storage, NOW, RANDOM).getMe();
    const second = await new LocalGnomeStore(storage, NOW, () => 0.9).getMe();
    expect(second.userId).toBe(first.userId);
    expect(second.displayName).toBe(first.displayName);
  });

  it('makes a fresh valid gnome when the stored JSON is corrupt', async () => {
    const storage = fakeStorage('{not json');
    const gnome = await new LocalGnomeStore(storage, NOW, RANDOM).getMe();
    expect(gnome.userId).toMatch(/^local-/);
    expect(checkName(gnome.displayName).ok).toBe(true);
  });

  it('keeps the name but drops an invalid look from storage', async () => {
    const stored = {
      userId: 'local-abc',
      displayName: 'Bobo',
      createdAt: '2025-01-01T00:00:00.000Z',
      look: { ...LOOK, hatRgb: -1 },
    };
    const gnome = await new LocalGnomeStore(fakeStorage(JSON.stringify(stored)), NOW, RANDOM).getMe();
    expect(gnome.userId).toBe('local-abc');
    expect(gnome.displayName).toBe('Bobo');
    expect(gnome.look).toBeUndefined();
  });

  it('saves a look and a name that a new store sees', async () => {
    const storage = fakeStorage();
    const store = new LocalGnomeStore(storage, NOW, RANDOM);
    const saved = await store.updateGnome({ displayName: '  Fergus  ', look: LOOK });
    expect(saved.displayName).toBe('Fergus');
    expect(saved.look).toMatchObject({ hatRgb: 0xd93636, freckles: true });

    const again = await new LocalGnomeStore(storage, NOW, RANDOM).getMe();
    expect(again.displayName).toBe('Fergus');
    expect(again.look).toMatchObject({ hatRgb: 0xd93636, freckles: true });
    expect(again.userId).toBe(saved.userId);
  });

  it('rejects a too-short name with INVALID_ARGUMENT and changes nothing', async () => {
    const storage = fakeStorage();
    const store = new LocalGnomeStore(storage, NOW, RANDOM);
    const before = await store.getMe();
    const stored = storage.map.get(STORAGE_KEY);
    const err = await store.updateGnome({ displayName: 'a' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GnomeStoreError);
    expect((err as GnomeStoreError).code).toBe('INVALID_ARGUMENT');
    expect(storage.map.get(STORAGE_KEY)).toBe(stored);
    expect(await store.getMe()).toEqual(before);
  });

  it('rejects a bad colour with INVALID_ARGUMENT', async () => {
    const store = new LocalGnomeStore(fakeStorage(), NOW, RANDOM);
    const err = await store.updateGnome({ look: { ...LOOK, hatRgb: -1 } }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GnomeStoreError);
    expect((err as GnomeStoreError).code).toBe('INVALID_ARGUMENT');
  });

  it('rejects with UNAVAILABLE when setItem throws', async () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = new LocalGnomeStore(storage, NOW, RANDOM);
    const before = await store.getMe();
    const err = await store.updateGnome({ displayName: 'Bobo' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GnomeStoreError);
    expect((err as GnomeStoreError).code).toBe('UNAVAILABLE');
    expect(await store.getMe()).toEqual(before);
  });

  it('batchGetGnomes returns the gnome for its own id and nothing for another', async () => {
    const store = new LocalGnomeStore(fakeStorage(), NOW, RANDOM);
    const me = await store.getMe();
    expect(await store.batchGetGnomes([me.userId])).toEqual([me]);
    expect(await store.batchGetGnomes(['local-someoneelse'])).toEqual([]);
  });

  it('keeps one gnome in memory when storage is null', async () => {
    const store = new LocalGnomeStore(null, NOW, RANDOM);
    const first = await store.getMe();
    const second = await store.getMe();
    expect(second.userId).toBe(first.userId);
  });

  it('returns copies so callers cannot change the cache', async () => {
    const store = new LocalGnomeStore(fakeStorage(), NOW, RANDOM);
    const gnome = await store.getMe();
    gnome.displayName = 'Changed';
    expect((await store.getMe()).displayName).not.toBe('Changed');
  });
});
