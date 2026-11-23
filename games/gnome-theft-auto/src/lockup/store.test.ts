import { describe, expect, it } from 'vitest';
import { LOCKUP } from './config';
import { createLockupStore, newUid } from './store';
import type { LockupStorage, StorageKind, VehicleSnapshot } from './types';

class MemStorage implements LockupStorage {
  data = new Map<string, string>();
  getItem(k: string): string | null { return this.data.get(k) ?? null; }
  setItem(k: string, v: string): void { this.data.set(k, v); }
}

const CAP: Record<StorageKind, number> = { ground: 5, air: 0, water: 0 };

function snap(name: string, over: Partial<VehicleSnapshot> = {}): VehicleSnapshot {
  return {
    kind: 'push-bike' as VehicleSnapshot['kind'],
    variant: null,
    name,
    tint: 0x336699,
    look: null,
    hp: 1,
    enginePitch: 1.2,
    ...over,
  };
}

/** A clock and rand that give distinct uids on every call. */
function clock() {
  let t = 1000;
  let n = 0;
  return {
    now: () => (t += 10),
    rand: () => ((n += 0.1337) % 1),
  };
}

describe('newUid', () => {
  it('builds lk-<base36 time>-<4 chars>', () => {
    expect(newUid(36, () => 0)).toBe('lk-10-0000');
  });
});

describe('createLockupStore', () => {
  it('adds up to 5 ground slots, then the 6th returns null', () => {
    const s = createLockupStore(new MemStorage(), CAP, clock().now, clock().rand);
    for (let i = 0; i < 5; i++) expect(s.add(snap(`car${i}`), 'ground')).not.toBeNull();
    expect(s.free('ground')).toBe(0);
    expect(s.add(snap('extra'), 'ground')).toBeNull();
    expect(s.list('ground')).toHaveLength(5);
  });

  it('has three air slots (Hangar Two) at the default capacity', () => {
    const c = clock();
    const s = createLockupStore(new MemStorage(), LOCKUP.capacity, c.now, c.rand);
    expect(s.capacity('air')).toBe(3);
    expect(s.capacity('water')).toBe(3);
    for (let i = 0; i < 3; i++) expect(s.add(snap('plane'), 'air')).not.toBeNull();
    expect(s.add(snap('plane'), 'air')).toBeNull();
  });

  it('gives every stored vehicle a unique uid and a storedAt', () => {
    const c = clock();
    const s = createLockupStore(new MemStorage(), CAP, c.now, c.rand);
    const uids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const r = s.add(snap(`car${i}`), 'ground');
      expect(r).not.toBeNull();
      uids.add(r!.uid);
      expect(r!.storedAt).toBeGreaterThan(0);
    }
    expect(uids.size).toBe(5);
  });

  it('round-trips through storage', () => {
    const st = new MemStorage();
    const c = clock();
    const a = createLockupStore(st, CAP, c.now, c.rand);
    const first = a.add(snap('Bike', { look: 'abc', enginePitch: null }), 'ground')!;
    a.add(snap('Van'), 'ground');
    const b = createLockupStore(st, CAP);
    expect(b.list('ground')).toEqual(a.list('ground'));
    expect(b.get(first.uid)?.look).toBe('abc');
    expect(b.kindOf(first.uid)).toBe('ground');
  });

  it('loads garbage, a wrong version or a bad record as empty or skipped, without throwing', () => {
    const st = new MemStorage();
    st.setItem(LOCKUP.saveKey, '{not json');
    expect(createLockupStore(st, CAP).list()).toEqual([]);

    st.setItem(LOCKUP.saveKey, JSON.stringify({ v: 2, slots: { ground: [] } }));
    expect(createLockupStore(st, CAP).list()).toEqual([]);

    const good = { uid: 'lk-a', kind: 'push-bike', variant: null, name: 'ok', tint: 1, look: null, hp: 1, enginePitch: null, storedAt: 5 };
    const bad = { ...good, uid: 'lk-b', name: 42 };
    st.setItem(LOCKUP.saveKey, JSON.stringify({ v: 1, slots: { ground: [bad, good] } }));
    const loaded = createLockupStore(st, CAP).list('ground');
    expect(loaded.map((r) => r.uid)).toEqual(['lk-a']);
  });

  it('clamps hp and drops duplicate uids on load', () => {
    const st = new MemStorage();
    const rec = { uid: 'lk-x', kind: 'push-bike', variant: null, name: 'n', tint: 1, look: null, hp: -3, enginePitch: null, storedAt: 1 };
    st.setItem(LOCKUP.saveKey, JSON.stringify({ v: 1, slots: { ground: [rec, { ...rec, hp: 0.5 }] } }));
    const loaded = createLockupStore(st, CAP).list('ground');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].hp).toBe(0.05);
  });

  it('update changes fields, keeps uid and storedAt, and returns false for an unknown uid', () => {
    const c = clock();
    const s = createLockupStore(new MemStorage(), CAP, c.now, c.rand);
    const r = s.add(snap('Old'), 'ground')!;
    expect(s.update(r.uid, snap('New', { hp: 0.4 }))).toBe(true);
    const after = s.get(r.uid)!;
    expect(after.name).toBe('New');
    expect(after.hp).toBe(0.4);
    expect(after.uid).toBe(r.uid);
    expect(after.storedAt).toBe(r.storedAt);
    expect(s.update('lk-nope', snap('x'))).toBe(false);
  });

  it('remove frees a slot and returns the record, or null when unknown', () => {
    const c = clock();
    const s = createLockupStore(new MemStorage(), CAP, c.now, c.rand);
    const r = s.add(snap('Gone'), 'ground')!;
    for (let i = 0; i < 4; i++) s.add(snap(`c${i}`), 'ground');
    expect(s.free('ground')).toBe(0);
    expect(s.remove(r.uid)?.name).toBe('Gone');
    expect(s.free('ground')).toBe(1);
    expect(s.get(r.uid)).toBeNull();
    expect(s.remove(r.uid)).toBeNull();
  });

  it('onChange fires on add, update and remove, and stops after unsubscribe', () => {
    const c = clock();
    const s = createLockupStore(new MemStorage(), CAP, c.now, c.rand);
    let calls = 0;
    const off = s.onChange(() => { calls++; });
    const r = s.add(snap('A'), 'ground')!;
    expect(calls).toBe(1);
    s.update(r.uid, snap('B'));
    expect(calls).toBe(2);
    s.remove(r.uid);
    expect(calls).toBe(3);
    off();
    s.add(snap('C'), 'ground');
    expect(calls).toBe(3);
  });

  it('update with identical fields does not call onChange', () => {
    const c = clock();
    const s = createLockupStore(new MemStorage(), CAP, c.now, c.rand);
    const r = s.add(snap('Same'), 'ground')!;
    let calls = 0;
    s.onChange(() => { calls++; });
    expect(s.update(r.uid, snap('Same'))).toBe(true);
    expect(calls).toBe(0);
  });

  it('works with no storage (null) and still notifies listeners', () => {
    const c = clock();
    const s = createLockupStore(null, CAP, c.now, c.rand);
    let calls = 0;
    s.onChange(() => { calls++; });
    expect(s.add(snap('Nowhere'), 'ground')).not.toBeNull();
    expect(calls).toBe(1);
  });
});
