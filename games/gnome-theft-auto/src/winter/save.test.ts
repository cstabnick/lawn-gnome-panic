import { afterEach, describe, expect, it } from 'vitest';
import { readProbe } from '../city/probes';
import { WINTER_SAVE_KEY } from './types';
import { createWinterStore, parseWinterSave } from './save';

function fakeStorage() {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (key: string) => m.get(key) ?? null,
    setItem: (key: string, value: string) => {
      m.set(key, value);
    },
  };
}

const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe('winter save', () => {
  it('round-trips through a new store on the same storage', () => {
    const s = fakeStorage();
    const a = createWinterStore(s);
    a.recordRun('wool-run', 30.04, true);
    a.buySled();
    a.recordIceCatch();
    a.recordHole();
    a.hug('1,2');
    const b = createWinterStore(s);
    expect(b.data().runs['wool-run']).toBe(1);
    expect(b.data().best['wool-run']).toBe(30);
    expect(b.data().clean).toBe(1);
    expect(b.hasSled()).toBe(true);
    expect(b.data().iceCatches).toBe(1);
    expect(b.data().holes).toBe(1);
    expect(b.data().hugged).toEqual(['1,2']);
  });

  it('recordRun flags best and first', () => {
    const store = createWinterStore(fakeStorage());
    expect(store.recordRun('tea-tray-run', 40, false)).toEqual({ best: true, first: true });
    expect(store.recordRun('tea-tray-run', 45, false)).toEqual({ best: false, first: false });
    expect(store.recordRun('tea-tray-run', 35, false)).toEqual({ best: true, first: false });
  });

  it('counts clean runs only for clean wool runs', () => {
    const store = createWinterStore(fakeStorage());
    store.recordRun('wool-run', 25, false);
    store.recordRun('tea-tray-run', 25, true);
    store.recordRun('wool-run', 25, true);
    expect(store.data().clean).toBe(1);
  });

  it('parses garbage to safe values', () => {
    expect(parseWinterSave('{').runs).toEqual({});
    expect(parseWinterSave('[]')).toEqual(parseWinterSave(null));
    expect(parseWinterSave(null).v).toBe(2);
    const bad = parseWinterSave('{"best":{"wool-run":-3,"x":5},"clean":-1,"holes":1.5,"sled":"yes"}');
    expect(bad.best).toEqual({});
    expect(bad.clean).toBe(0);
    expect(bad.holes).toBe(0);
    expect(bad.sled).toBe(false);
    expect(parseWinterSave('null')).toEqual(parseWinterSave(null));
  });

  it('migrates an old save: the old Wool Run best becomes the Nursery best, once', () => {
    const old = JSON.stringify({ v: 1, best: { 'wool-run': 17.2, 'tea-tray-run': 40 }, runs: { 'wool-run': 3 }, clean: 2 });
    const first = parseWinterSave(old);
    expect(first.v).toBe(2);
    expect(first.best.nursery).toBe(17.2);
    expect(first.best['wool-run']).toBeUndefined();
    expect(first.best['tea-tray-run']).toBe(40);
    expect(first.runs['wool-run']).toBe(3);
    expect(first.clean).toBe(2);
    // Loading the migrated save again changes nothing, even after a new Wool Run best was set.
    expect(parseWinterSave(JSON.stringify(first))).toEqual(first);
    const later = { ...first, best: { ...first.best, 'wool-run': 38.4 } };
    expect(parseWinterSave(JSON.stringify(later))).toEqual(later);
    // A save with no marker at all migrates too.
    expect(parseWinterSave('{"best":{"wool-run":20}}').best).toEqual({ nursery: 20 });
  });

  it('migrates through the store and writes the marker back', () => {
    const s = fakeStorage();
    s.setItem(WINTER_SAVE_KEY, JSON.stringify({ v: 1, best: { 'wool-run': 17.2 }, runs: { 'wool-run': 1 } }));
    const store = createWinterStore(s);
    expect(store.data().best.nursery).toBe(17.2);
    store.recordRun('wool-run', 40, true);
    const saved = JSON.parse(s.m.get(WINTER_SAVE_KEY) ?? '{}');
    expect(saved.v).toBe(2);
    expect(saved.best).toEqual({ nursery: 17.2, 'wool-run': 40 });
    expect(createWinterStore(s).data().best).toEqual({ nursery: 17.2, 'wool-run': 40 });
  });

  it('keeps nursery as a valid run id', () => {
    const store = createWinterStore(fakeStorage());
    expect(store.recordRun('nursery', 18.04, true)).toEqual({ best: true, first: true });
    expect(store.data().best.nursery).toBe(18);
    expect(store.data().clean).toBe(0);
    expect(parseWinterSave(JSON.stringify(store.data())).best.nursery).toBe(18);
  });

  it('does not throw when setItem throws', () => {
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = createWinterStore(broken);
    expect(() => store.recordRun('wool-run', 20, true)).not.toThrow();
    expect(() => store.buySled()).not.toThrow();
    expect(store.recordIceCatch()).toBe(1);
  });

  it('hug ignores duplicates', () => {
    const store = createWinterStore(fakeStorage());
    expect(store.hug('a')).toBe(1);
    expect(store.hug('a')).toBe(1);
    expect(store.hug('b')).toBe(2);
  });

  it('the ski-runs probe reads the saved wool runs', () => {
    const s = fakeStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: s, configurable: true, writable: true });
    const store = createWinterStore(s);
    store.recordRun('wool-run', 30, true);
    store.recordRun('wool-run', 31, false);
    expect(s.m.has(WINTER_SAVE_KEY)).toBe(true);
    expect(readProbe('winter-ski-runs')).toBe(2);
  });
});
