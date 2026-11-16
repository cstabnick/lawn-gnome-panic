import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOOK } from './look';
import { getMyGnome, loadMyGnome, onLooksChanged, prefetchLooks, resolveLook } from './resolve';
import type { Gnome, GnomeStore } from './types';

/** A store that answers getMe with the given function; the other methods are not used by resolve.ts. */
function fakeStore(getMe: () => Promise<Gnome>): GnomeStore {
  return {
    getMe,
    updateGnome: async () => {
      throw new Error('not used');
    },
    batchGetGnomes: async () => [],
  };
}

const withLook: Gnome = {
  userId: 'local-test',
  displayName: 'Bob',
  createdAt: '2026-01-01T00:00:00.000Z',
  look: DEFAULT_LOOK,
};
const withoutLook: Gnome = { userId: 'local-test', displayName: 'Bob', createdAt: '2026-01-01T00:00:00.000Z' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadMyGnome', () => {
  it('gives null and no gnome when the store has no look', async () => {
    const store = fakeStore(async () => withoutLook);
    expect(await loadMyGnome(1500, store)).toBeNull();
    expect(getMyGnome()).toBeNull();
  });

  it('builds MyGnome from a stored look and remembers it', async () => {
    const store = fakeStore(async () => withLook);
    const my = await loadMyGnome(1500, store);
    expect(my).not.toBeNull();
    expect(my?.code).toBe('g1.Z1OIBN.A');
    expect(my?.look.hat).toBe(0xd93636);
    expect(my?.name).toBe('Bob');
    expect(getMyGnome()).toEqual(my);
  });

  it('gives null after timeoutMs when the store never answers', async () => {
    const store = fakeStore(() => new Promise<Gnome>(() => {}));
    expect(await loadMyGnome(20, store)).toBeNull();
    expect(getMyGnome()).toBeNull();
  });

  it('gives null when the store rejects, and never rejects itself', async () => {
    const store = fakeStore(async () => {
      throw new Error('storage broke');
    });
    await expect(loadMyGnome(1500, store)).resolves.toBeNull();
    expect(getMyGnome()).toBeNull();
  });

  it('uses the ?gnome= look from the URL even when the store has none', async () => {
    vi.stubGlobal('location', { search: '?gnome=g1.Z1OIBN.A' });
    const my = await loadMyGnome(1500, fakeStore(async () => withoutLook));
    expect(my?.code).toBe('g1.Z1OIBN.A');
    expect(my?.name).toBe('Bob'); // the store answered, so its displayName is kept
    expect(my?.look.hat).toBe(0xd93636);
  });

  it('lets the ?gnome= look win over the stored look', async () => {
    // The stored look has freckles (flag bit 1); the URL look does not, so the code ends in 'A', not 'B'.
    vi.stubGlobal('location', { search: '?gnome=g1.Z1OIBN.A' });
    const freckled: Gnome = { ...withLook, look: { ...DEFAULT_LOOK, freckles: true } };
    const my = await loadMyGnome(1500, fakeStore(async () => freckled));
    expect(my?.code).toBe('g1.Z1OIBN.A');
  });

  it('ignores an invalid ?gnome= value', async () => {
    vi.stubGlobal('location', { search: '?gnome=g1.garbage' });
    expect(await loadMyGnome(1500, fakeStore(async () => withoutLook))).toBeNull();
    const my = await loadMyGnome(1500, fakeStore(async () => withLook));
    expect(my?.code).toBe('g1.Z1OIBN.A');
  });
});

describe('resolveLook', () => {
  it('decodes a look code into the model look', () => {
    const look = resolveLook({ id: 1, character: 'g1.Z1OIBN.A' });
    expect(look).not.toBeNull();
    expect(look?.hat).toBe(0xd93636);
    expect(look?.shirt).toBe(0x2f64c9);
    expect(look?.beard).toBe(0xf4f4f4);
    expect(look?.hair).toBeNull();
  });

  it('returns null for characters that are not valid look codes', () => {
    expect(resolveLook({ id: 1, character: 'gnorman' })).toBeNull();
    expect(resolveLook({ id: 1, character: 'golfer' })).toBeNull();
    expect(resolveLook({ id: 1, character: '' })).toBeNull();
    expect(resolveLook({ id: 1, character: 'g1.garbage' })).toBeNull();
  });
});

describe('prefetchLooks and onLooksChanged', () => {
  it('prefetchLooks resolves', async () => {
    await expect(prefetchLooks([{ id: 1, character: 'g1.Z1OIBN.A', userId: 'x' }])).resolves.toBeUndefined();
  });

  it('onLooksChanged returns an unsubscribe function', () => {
    const unsubscribe = onLooksChanged(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });
});
