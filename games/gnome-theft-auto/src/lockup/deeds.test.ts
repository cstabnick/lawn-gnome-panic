import { describe, expect, it } from 'vitest';
import { createDeedStore } from './deeds';
import { ESTATES } from './config';
import type { LockupStorage } from './types';

function memoryStorage(): LockupStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
  };
}

describe('createDeedStore', () => {
  it('empty storage owns only the ground', () => {
    const s = createDeedStore(memoryStorage());
    expect(s.owns('ground')).toBe(true);
    expect(s.owns('air')).toBe(false);
    expect(s.owns('water')).toBe(false);
  });

  it('grant persists, and a new store on the same storage owns it', () => {
    const st = memoryStorage();
    const s = createDeedStore(st);
    expect(s.grant('air')).toBe(true);
    expect(s.owns('air')).toBe(true);
    expect(s.owns('water')).toBe(false);
    const again = createDeedStore(st);
    expect(again.owns('air')).toBe(true);
    expect(again.owns('water')).toBe(false);
  });

  it('grant twice returns false the second time', () => {
    const s = createDeedStore(memoryStorage());
    expect(s.grant('water')).toBe(true);
    expect(s.grant('water')).toBe(false);
  });

  it('revoke clears the deed and persists', () => {
    const st = memoryStorage();
    const s = createDeedStore(st);
    expect(s.revoke('air')).toBe(false);
    s.grant('air');
    expect(s.revoke('air')).toBe(true);
    expect(s.owns('air')).toBe(false);
    expect(createDeedStore(st).owns('air')).toBe(false);
  });

  it('garbage saved data owns nothing', () => {
    const cases = ['not json', JSON.stringify({ v: 2, owned: { air: true, water: true } }), JSON.stringify({ v: 1, owned: { air: 'yes' } })];
    for (const raw of cases) {
      const st = memoryStorage();
      st.data.set(ESTATES.saveKey, raw);
      const s = createDeedStore(st);
      expect(s.owns('air')).toBe(false);
      expect(s.owns('water')).toBe(false);
    }
  });

  it('a storage that throws never throws out of the store', () => {
    const broken: LockupStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    const s = createDeedStore(broken);
    expect(s.owns('air')).toBe(false);
    expect(s.grant('air')).toBe(true);
    expect(s.owns('air')).toBe(true);
  });

  it('onChange is called on grant and unsubscribe works', () => {
    const s = createDeedStore(memoryStorage());
    let calls = 0;
    const off = s.onChange(() => { calls += 1; });
    s.grant('air');
    expect(calls).toBe(1);
    off();
    s.grant('water');
    expect(calls).toBe(1);
  });
});
