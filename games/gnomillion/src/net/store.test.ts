import { beforeEach, describe, expect, it } from 'vitest';
import { newRoom } from '../engine';
import type { PublicRoom } from './protocol';
import * as store from './store';

/** A tiny in-memory localStorage, installed on globalThis (the tests run in Node). */
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string): string | null { return this.data.has(k) ? (this.data.get(k) as string) : null; }
  setItem(k: string, v: string): void { this.data.set(k, String(v)); }
  removeItem(k: string): void { this.data.delete(k); }
  clear(): void { this.data.clear(); }
  key(i: number): string | null { return [...this.data.keys()][i] ?? null; }
  get length(): number { return this.data.size; }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
});

describe('identity', () => {
  it('saves and loads my pid and name', () => {
    expect(store.loadMe()).toBeNull();
    store.saveMe({ pid: 'p-1', name: 'Fern' });
    expect(store.loadMe()).toEqual({ pid: 'p-1', name: 'Fern' });
  });
});

describe('rooms', () => {
  it('saves a host room and marks it as the last room', () => {
    const room = newRoom('ABC12', { pid: 'h', name: 'Host' }, 600_000, [0, 1, 2]);
    store.saveHostRoom(room);
    expect(store.loadHostRoom('ABC12')).toEqual(room);
    expect(store.loadLast()).toEqual({ code: 'ABC12', host: true });
  });

  it('saves a guest state and marks it as the last room', () => {
    const pub: PublicRoom = {
      code: 'XYZ99', hostPid: 'h', players: [{ pid: 'g', name: 'Guest' }], windowMs: 600_000, totalRounds: 10, current: null, history: [],
    };
    store.saveGuestRoom(pub);
    expect(store.loadGuestRoom('XYZ99')).toEqual(pub);
    expect(store.loadLast()).toEqual({ code: 'XYZ99', host: false });
  });

  it('returns null for an unknown room and clears the last room', () => {
    expect(store.loadHostRoom('NOPE1')).toBeNull();
    store.saveLast({ code: 'ABC12', host: true });
    store.clearLast();
    expect(store.loadLast()).toBeNull();
  });
});

describe('pending answers', () => {
  const base = { code: 'ABC12', pid: 'p1', round: 1, at: 100 };

  it('adds, replaces the same round, and lists by code', () => {
    store.addPending({ ...base, text: 'Mushroom' });
    store.addPending({ ...base, text: 'Slug', at: 200 });
    store.addPending({ ...base, code: 'OTHER', text: 'Hat' });
    expect(store.listPending('ABC12')).toEqual([{ ...base, text: 'Slug', at: 200 }]);
    expect(store.listPending()).toHaveLength(2);
  });

  it('keeps a second round as its own answer', () => {
    store.addPending({ ...base, text: 'Mushroom' });
    store.addPending({ ...base, round: 2, text: 'Hat' });
    expect(store.listPending('ABC12')).toHaveLength(2);
  });

  it('removes one answer and prunes old rounds', () => {
    store.addPending({ ...base, text: 'Mushroom' });
    store.addPending({ ...base, pid: 'p2', text: 'Hat' });
    store.addPending({ ...base, round: 3, text: 'Snail' });
    store.removePending('ABC12', 'p1', 1);
    expect(store.listPending('ABC12').map((p) => p.pid + p.round)).toEqual(['p21', 'p13']);
    store.prunePending('ABC12', 3);
    expect(store.listPending('ABC12').map((p) => p.round)).toEqual([3]);
  });

  it('is empty when nothing is saved', () => {
    expect(store.listPending()).toEqual([]);
  });
});
