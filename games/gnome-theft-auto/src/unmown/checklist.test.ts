import { describe, expect, it } from 'vitest';
import { CHECKLIST, CHECKLIST_KEY, createChecklistStore, sightings } from './checklist';

function fakeStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(CHECKLIST_KEY, initial);
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
}

const noBirds = () => false;

describe('createChecklistStore', () => {
  it('starts empty', () => {
    const store = createChecklistStore(fakeStorage());
    expect(store.seen().size).toBe(0);
    expect(store.complete()).toBe(false);
  });

  it('mark returns true only the first time', () => {
    const store = createChecklistStore(fakeStorage());
    expect(store.mark('hare')).toBe(true);
    expect(store.mark('hare')).toBe(false);
    expect(store.seen().has('hare')).toBe(true);
  });

  it('ignores unknown ids', () => {
    const storage = fakeStorage();
    const store = createChecklistStore(storage);
    expect(store.mark('dodo')).toBe(false);
    expect(store.seen().size).toBe(0);
    expect(storage.data.has(CHECKLIST_KEY)).toBe(false);
  });

  it('garbage storage starts empty', () => {
    expect(createChecklistStore(fakeStorage('{not json')).seen().size).toBe(0);
    expect(createChecklistStore(fakeStorage('{"a":1}')).seen().size).toBe(0);
    expect(createChecklistStore(fakeStorage('["dodo", 3, null]')).seen().size).toBe(0);
  });

  it('persists through the storage', () => {
    const storage = fakeStorage();
    createChecklistStore(storage).mark('fox');
    const again = createChecklistStore(storage);
    expect(again.seen().has('fox')).toBe(true);
    expect(again.mark('fox')).toBe(false);
  });

  it('complete once every entry is ticked', () => {
    const store = createChecklistStore(fakeStorage());
    for (const e of CHECKLIST) store.mark(e.id);
    expect(store.complete()).toBe(true);
  });
});

describe('sightings', () => {
  const hare = (x: number, z: number) => [{ kind: 'hare' as const, x, z }];

  it('a hare within 12 m inside the Unmown ticks the hare entry', () => {
    expect(sightings(0, 0, true, hare(6, 8), noBirds, new Set())).toEqual(['hare']);
  });

  it('a hare outside the Unmown does not tick it', () => {
    expect(sightings(0, 0, false, hare(1, 1), noBirds, new Set())).toEqual([]);
  });

  it('a hare beyond 12 m does not tick it', () => {
    expect(sightings(0, 0, true, hare(13, 0), noBirds, new Set())).toEqual([]);
  });

  it('a seen bird ticks its entry anywhere, even outside the Unmown', () => {
    const out = sightings(500, 500, false, [], (id) => id === 'marsh-harrier', new Set());
    expect(out).toEqual(['harrier']);
  });

  it('already-ticked ids are not returned', () => {
    expect(sightings(0, 0, true, hare(1, 1), noBirds, new Set(['hare']))).toEqual([]);
    expect(sightings(0, 0, false, [], (id) => id === 'marsh-harrier', new Set(['harrier']))).toEqual([]);
  });
});
