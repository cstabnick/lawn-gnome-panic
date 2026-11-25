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
    expect(parseWinterSave(null).v).toBe(1);
    const bad = parseWinterSave('{"best":{"wool-run":-3,"x":5},"clean":-1,"holes":1.5,"sled":"yes"}');
    expect(bad.best).toEqual({});
    expect(bad.clean).toBe(0);
    expect(bad.holes).toBe(0);
    expect(bad.sled).toBe(false);
    expect(parseWinterSave('null')).toEqual(parseWinterSave(null));
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
