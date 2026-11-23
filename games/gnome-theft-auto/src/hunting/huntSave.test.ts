import { describe, expect, it } from 'vitest';
import { createHuntStore, HUNT_KEY, parseHuntSave, emptyHuntSave, itemInfo } from './huntSave';
import { HUNT, SPECIES, speciesById } from './species';

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

const fox = speciesById('fox')!;
const hedgehog = speciesById('hedgehog')!;

describe('parseHuntSave', () => {
  it('returns an empty save for junk', () => {
    expect(parseHuntSave(null)).toEqual(emptyHuntSave());
    expect(parseHuntSave('not json {')).toEqual(emptyHuntSave());
    expect(parseHuntSave('[1,2,3]')).toEqual(emptyHuntSave());
    expect(parseHuntSave('"hello"')).toEqual(emptyHuntSave());
  });

  it('drops broken bag, journal and totals but keeps the good parts', () => {
    const raw = JSON.stringify({
      licensed: 'yes',
      bag: { 'tuft-fox': 3, 'no-such-item': 2, 'tuft-hare': -1, 'keep-fox': 1.5 },
      journal: {
        fox: { taken: 2, keepsakes: 0, first: '2026-01-01', bestShot: 12 },
        dragon: { taken: 1, keepsakes: 0, first: '2026-01-01', bestShot: 1 },
        hedgehog: { taken: -1, keepsakes: 0, first: '2026-01-01', bestShot: 1 },
      },
      sold: -4,
      earned: 30,
    });
    const d = parseHuntSave(raw);
    expect(d.licensed).toBe(false);
    expect(d.bag).toEqual({ 'tuft-fox': 3 });
    expect(Object.keys(d.journal)).toEqual(['fox']);
    expect(d.sold).toBe(0);
    expect(d.earned).toBe(30);
  });
});

describe('itemInfo', () => {
  it('finds every tuft and keepsake and nothing else', () => {
    for (const s of SPECIES) {
      expect(itemInfo(s.tuft.id)?.kind).toBe('tuft');
      expect(itemInfo(s.keepsake.id)?.kind).toBe('keepsake');
      expect(itemInfo(s.keepsake.id)?.species).toBe(s.id);
    }
    expect(itemInfo('nope')).toBeNull();
  });
});

describe('createHuntStore', () => {
  it('buyLicense charges once, and only when the spend succeeds', () => {
    const storage = fakeStorage();
    const store = createHuntStore(storage);
    expect(store.buyLicense(() => false)).toBe(false);
    expect(store.licensed()).toBe(false);
    let spent = 0;
    expect(
      store.buyLicense((amount) => {
        spent = amount;
        return true;
      }),
    ).toBe(true);
    expect(spent).toBe(HUNT.licensePrice);
    expect(store.licensed()).toBe(true);
    expect(store.buyLicense(() => true)).toBe(false);
  });

  it('recordComb fills the journal and reports firstOfSpecies once', () => {
    const store = createHuntStore(fakeStorage());
    const now = new Date('2026-03-04T10:00:00Z');
    const a = store.recordComb(fox, false, 12.4, now);
    expect(a).toEqual({ added: true, firstOfSpecies: true });
    const b = store.recordComb(fox, true, 8, now);
    expect(b).toEqual({ added: true, firstOfSpecies: false });
    const entry = store.data().journal.fox!;
    expect(entry.taken).toBe(2);
    expect(entry.keepsakes).toBe(1);
    expect(entry.first).toBe('2026-03-04');
    expect(entry.bestShot).toBe(12);
    expect(store.data().bag[fox.tuft.id]).toBe(2);
    expect(store.data().bag[fox.keepsake.id]).toBe(1);
    expect(store.speciesTaken()).toBe(1);
  });

  it('the bag stops at HUNT.bagSize', () => {
    const store = createHuntStore(fakeStorage());
    for (let i = 0; i < HUNT.bagSize; i++) {
      expect(store.recordComb(hedgehog, false, 5).added).toBe(true);
    }
    expect(store.bagFull()).toBe(true);
    expect(store.bagCount()).toBe(HUNT.bagSize);
    expect(store.recordComb(hedgehog, true, 5)).toEqual({ added: false, firstOfSpecies: false });
    expect(store.bagCount()).toBe(HUNT.bagSize);
    expect(store.data().journal.hedgehog!.taken).toBe(HUNT.bagSize);
  });

  it('sellAll totals the prices, empties the bag and tallies sold and earned', () => {
    const store = createHuntStore(fakeStorage());
    store.recordComb(fox, false, 5);
    store.recordComb(fox, true, 5);
    store.recordComb(hedgehog, false, 5);
    const expected = fox.tuft.price * 2 + fox.keepsake.price + hedgehog.tuft.price;
    expect(store.bagValue()).toBe(expected);
    const r = store.sellAll();
    expect(r).toEqual({ acorns: expected, items: 4 });
    expect(store.bagCount()).toBe(0);
    expect(store.data().sold).toBe(4);
    expect(store.data().earned).toBe(expected);
  });

  it('survives a reload with the same storage', () => {
    const storage = fakeStorage();
    const first = createHuntStore(storage);
    first.buyLicense(() => true);
    first.recordComb(fox, true, 20, new Date('2026-05-01T00:00:00Z'));
    expect(storage.map.has(HUNT_KEY)).toBe(true);

    const second = createHuntStore(storage);
    expect(second.licensed()).toBe(true);
    expect(second.bagCount()).toBe(2);
    expect(second.data().journal.fox).toEqual({ taken: 1, keepsakes: 1, first: '2026-05-01', bestShot: 20 });
    expect(second.speciesTaken()).toBe(1);
  });
});
