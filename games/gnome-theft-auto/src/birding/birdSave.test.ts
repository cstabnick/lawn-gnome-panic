import { describe, expect, it } from 'vitest';
import { BIRD_KEY, createBirdStore, emptyBirdSave, mergeBirdSaves, parseBirdSave } from './birdSave';

function fakeStorage(): Pick<Storage, 'getItem' | 'setItem'> & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

describe('parseBirdSave', () => {
  it('returns an empty save for null, garbage and non-objects', () => {
    expect(parseBirdSave(null)).toEqual(emptyBirdSave());
    expect(parseBirdSave('')).toEqual(emptyBirdSave());
    expect(parseBirdSave('{not json')).toEqual(emptyBirdSave());
    expect(parseBirdSave('[1,2,3]')).toEqual(emptyBirdSave());
    expect(parseBirdSave('"hello"')).toEqual(emptyBirdSave());
  });

  it('keeps good entries and drops broken ones from a partial save', () => {
    const raw = JSON.stringify({
      seen: {
        robin: { first: '2026-03-01', count: 3 },
        '': { first: '2026-03-01', count: 1 },
        badDate: { first: 'yesterday', count: 1 },
        zeroCount: { first: '2026-03-01', count: 0 },
        floatCount: { first: '2026-03-01', count: 1.5 },
      },
      heard: ['owl', '', 'owl', 7, 'crow'],
      photos: 'not-an-array',
      claimed: 99,
      optics: -1,
    });
    const d = parseBirdSave(raw);
    expect(Object.keys(d.seen)).toEqual(['robin']);
    expect(d.seen.robin).toEqual({ first: '2026-03-01', count: 3 });
    expect(d.heard).toEqual(['crow', 'owl']);
    expect(d.photos).toEqual([]);
    expect(d.claimed).toBe(0);
    expect(d.optics).toBe(0);
  });
});

describe('createBirdStore', () => {
  it('markSeen is true the first time and false after, counting up', () => {
    const store = createBirdStore(fakeStorage());
    const now = new Date('2026-05-04T10:00:00Z');
    expect(store.markSeen('robin', now)).toBe(true);
    expect(store.markSeen('robin', now)).toBe(false);
    expect(store.data().seen.robin).toEqual({ first: '2026-05-04', count: 2 });
    expect(store.hasSeen('robin')).toBe(true);
    expect(store.seenCount()).toBe(1);
  });

  it('persists to storage under BIRD_KEY', () => {
    const storage = fakeStorage();
    const store = createBirdStore(storage);
    store.markHeard('wren');
    const back = parseBirdSave(storage.map.get(BIRD_KEY) ?? null);
    expect(back.heard).toEqual(['wren']);
  });

  it('keeps heard and photos sorted and reports newly added', () => {
    const store = createBirdStore(fakeStorage());
    expect(store.markHeard('wren')).toBe(true);
    expect(store.markHeard('crow')).toBe(true);
    expect(store.markHeard('wren')).toBe(false);
    expect(store.data().heard).toEqual(['crow', 'wren']);
    expect(store.markPhoto('wren')).toBe(true);
    expect(store.markPhoto('wren')).toBe(false);
    expect(store.photoCount()).toBe(1);
    expect(store.hasPhoto('wren')).toBe(true);
  });

  it('claimable with 5 seen gives the first milestone only; claim pays it and then nothing is claimable', () => {
    const store = createBirdStore(fakeStorage());
    for (const id of ['a', 'b', 'c', 'd', 'e']) store.markSeen(id);
    const total = 40;
    expect(store.claimable(total).map((m) => m.acorns)).toEqual([50]);
    expect(store.claim(total)).toBe(50);
    expect(store.claimable(total)).toEqual([]);
    expect(store.claim(total)).toBe(0);
  });

  it('the count-0 milestone needs the species total', () => {
    const store = createBirdStore(fakeStorage());
    for (let i = 0; i < 30; i++) store.markSeen(`bird${i}`);
    // 30 seen: the 5..25 milestones are reached; the full list (count 0) needs the total.
    expect(store.claimable(31).map((m) => m.count)).toEqual([5, 10, 15, 20, 25]);
    expect(store.claimable(28).map((m) => m.count)).toEqual([5, 10, 15, 20, 25, 0]);
    expect(store.claim(31)).toBe(50 + 120 + 200 + 300 + 450);
    expect(store.claimable(31)).toEqual([]);
    expect(store.claim(28)).toBe(800);
    expect(store.claimable(28)).toEqual([]);
  });

  it('the count-0 milestone is reached when seen covers the total', () => {
    const store = createBirdStore(fakeStorage());
    for (let i = 0; i < 30; i++) store.markSeen(`x${i}`);
    expect(store.claimable(30).map((m) => m.count)).toEqual([5, 10, 15, 20, 25, 0]);
    expect(store.claim(30)).toBe(50 + 120 + 200 + 300 + 450 + 800);
    expect(store.claimable(30)).toEqual([]);
  });

  it('setOptics keeps the max', () => {
    const store = createBirdStore(fakeStorage());
    store.setOptics(2);
    store.setOptics(1);
    expect(store.optics()).toBe(2);
  });

  it('a storage that throws on setItem does not throw out of markSeen', () => {
    const throwing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    };
    const store = createBirdStore(throwing);
    expect(() => store.markSeen('robin', new Date('2026-01-01T00:00:00Z'))).not.toThrow();
    expect(store.hasSeen('robin')).toBe(true);
  });
});

describe('mergeBirdSaves', () => {
  const a = JSON.stringify({
    v: 1,
    seen: { robin: { first: '2026-03-10', count: 2 }, owl: { first: '2026-04-01', count: 1 } },
    heard: ['wren'],
    photos: ['robin'],
    claimed: 2,
    optics: 1,
  });
  const b = JSON.stringify({
    v: 1,
    seen: { robin: { first: '2026-03-01', count: 5 }, crow: { first: '2026-02-20', count: 1 } },
    heard: ['crow', 'wren'],
    photos: [],
    claimed: 1,
    optics: 2,
  });

  it('is symmetric as text', () => {
    expect(mergeBirdSaves(a, b)).toBe(mergeBirdSaves(b, a));
  });

  it('keeps the earliest first date, the larger count, unions and the max of claimed and optics', () => {
    const merged = parseBirdSave(mergeBirdSaves(a, b));
    expect(merged.seen.robin).toEqual({ first: '2026-03-01', count: 5 });
    expect(merged.seen.owl).toEqual({ first: '2026-04-01', count: 1 });
    expect(merged.seen.crow).toEqual({ first: '2026-02-20', count: 1 });
    expect(merged.heard).toEqual(['crow', 'wren']);
    expect(merged.photos).toEqual(['robin']);
    expect(merged.claimed).toBe(2);
    expect(merged.optics).toBe(2);
  });

  it('merging with a null or broken side keeps the other side', () => {
    expect(parseBirdSave(mergeBirdSaves(a, 'garbage')).seen.robin).toEqual({ first: '2026-03-10', count: 2 });
  });
});
