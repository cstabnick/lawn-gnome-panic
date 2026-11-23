import { describe, expect, it } from 'vitest';
import { FISH_SAVE_KEY, createFishStore, emptyFishSave, parseFishSave } from './fishSave';
import { BAITS, RODS } from './tackle';
import { catchValue, fishById } from './species';
import { FISH } from './types';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

function wallet(start: number): { acorns: number; spend: (n: number) => boolean } {
  const w = {
    acorns: start,
    spend(n: number): boolean {
      if (w.acorns < n) return false;
      w.acorns -= n;
      return true;
    },
  };
  return w;
}

const gudgeon = fishById('fish-gudgeon')!;
const trout = fishById('fish-mossback-trout')!;

describe('fishing save', () => {
  it('starts empty: no rod, dough selected, unlimited dough', () => {
    const store = createFishStore(memoryStorage());
    expect(store.hasRod()).toBe(false);
    expect(store.rod()).toBeNull();
    expect(store.bait().id).toBe('dough');
    expect(store.baitCount('dough')).toBe(Infinity);
    expect(store.speciesCaught()).toBe(0);
    expect(store.cardsFull()).toBe(false);
  });

  it('buyRod pays through spend and only owns on success', () => {
    const store = createFishStore(memoryStorage());
    let calls = 0;
    const failing = (n: number): boolean => {
      calls += 1;
      expect(n).toBe(RODS[0].price);
      return false;
    };
    expect(store.buyRod('twig', failing)).toBe(false);
    expect(calls).toBe(1);
    expect(store.ownsRod('twig')).toBe(false);

    const w = wallet(100);
    expect(store.buyRod('twig', w.spend)).toBe(true);
    expect(w.acorns).toBe(100 - RODS[0].price);
    expect(store.ownsRod('twig')).toBe(true);
    expect(store.rod()?.id).toBe('twig');
  });

  it('buying the same rod twice fails without charging', () => {
    const store = createFishStore(memoryStorage());
    expect(store.buyRod('twig', () => true)).toBe(true);
    let charged = false;
    expect(
      store.buyRod('twig', () => {
        charged = true;
        return true;
      }),
    ).toBe(false);
    expect(charged).toBe(false);
  });

  it('buyBait cheese-rind adds the pack, useBait counts down and falls back to dough at 0', () => {
    const store = createFishStore(memoryStorage());
    const cheese = BAITS.find((b) => b.id === 'cheese-rind')!;
    expect(store.buyBait('cheese-rind', () => true)).toBe(true);
    expect(store.baitCount('cheese-rind')).toBe(cheese.pack);
    expect(store.selectBait('cheese-rind')).toBe(true);
    expect(store.bait().id).toBe('cheese-rind');

    store.useBait();
    expect(store.baitCount('cheese-rind')).toBe(cheese.pack - 1);
    expect(store.bait().id).toBe('cheese-rind');

    for (let i = 0; i < cheese.pack - 1; i++) store.useBait();
    expect(store.baitCount('cheese-rind')).toBe(0);
    expect(store.bait().id).toBe('dough');
    expect(store.data().bait).toBe('dough');
  });

  it('useBait with dough selected changes nothing', () => {
    const store = createFishStore(memoryStorage());
    store.useBait();
    expect(store.bait().id).toBe('dough');
    expect(store.baitCount('dough')).toBe(Infinity);
  });

  it('glitter-spinner is a lure: bought once, never used up', () => {
    const store = createFishStore(memoryStorage());
    expect(store.buyBait('glitter-spinner', () => true)).toBe(true);
    expect(store.baitCount('glitter-spinner')).toBe(1);

    let charged = false;
    expect(
      store.buyBait('glitter-spinner', () => {
        charged = true;
        return true;
      }),
    ).toBe(false);
    expect(charged).toBe(false);

    store.selectBait('glitter-spinner');
    for (let i = 0; i < 5; i++) store.useBait();
    expect(store.bait().id).toBe('glitter-spinner');
    expect(store.baitCount('glitter-spinner')).toBe(1);
  });

  it('cycleBait walks the owned baits in BAITS order and wraps', () => {
    const store = createFishStore(memoryStorage());
    store.buyBait('cheese-rind', () => true);
    store.buyBait('glitter-spinner', () => true);
    const seen = [store.cycleBait().id, store.cycleBait().id, store.cycleBait().id, store.cycleBait().id];
    expect(seen).toEqual(['cheese-rind', 'glitter-spinner', 'dough', 'cheese-rind']);
    expect(store.bait().id).toBe('cheese-rind');
  });

  it('recordCatch reports first and record, keeps the best and first date', () => {
    const store = createFishStore(memoryStorage());
    expect(store.recordCatch(gudgeon, 10, '2026-01-02')).toEqual({ first: true, record: true, card: true });
    expect(store.data().journal[gudgeon.id]).toEqual({ caught: 1, best: 10, first: '2026-01-02' });

    expect(store.recordCatch(gudgeon, 8, '2026-02-03')).toEqual({ first: false, record: false, card: true });
    expect(store.data().journal[gudgeon.id]).toEqual({ caught: 2, best: 10, first: '2026-01-02' });
    expect(store.data().caught).toBe(2);
    expect(store.speciesCaught()).toBe(1);

    expect(store.recordCatch(gudgeon, 12, '2026-03-04')).toEqual({ first: false, record: true, card: true });
    expect(store.data().journal[gudgeon.id]).toEqual({ caught: 3, best: 12, first: '2026-01-02' });
  });

  it('recordCatch defaults the date to today', () => {
    const store = createFishStore(memoryStorage());
    store.recordCatch(gudgeon, 9);
    expect(store.data().journal[gudgeon.id].first).toBe(new Date().toISOString().slice(0, 10));
  });

  it('recordCatch stops making cards at the cap but still journals the fish', () => {
    const store = createFishStore(memoryStorage());
    for (let i = 0; i < FISH.cardCap; i++) {
      expect(store.recordCatch(gudgeon, 10, '2026-01-01').card).toBe(true);
    }
    expect(store.cardsFull()).toBe(true);
    expect(store.recordCatch(gudgeon, 10, '2026-01-01').card).toBe(false);
    expect(store.data().cards).toHaveLength(FISH.cardCap);
    expect(store.data().caught).toBe(FISH.cardCap + 1);
  });

  it('sellCards pays catchValue per card, empties the cards and adds the totals', () => {
    const store = createFishStore(memoryStorage());
    expect(store.sellCards()).toEqual({ count: 0, acorns: 0 });

    store.recordCatch(gudgeon, 10, '2026-01-01');
    store.recordCatch(trout, 40, '2026-01-01');
    const expected = catchValue(gudgeon, 10) + catchValue(trout, 40);

    expect(store.sellCards()).toEqual({ count: 2, acorns: expected });
    expect(store.data().cards).toEqual([]);
    expect(store.data().sold).toBe(2);
    expect(store.data().earned).toBe(expected);
    expect(store.cardsFull()).toBe(false);
  });

  it('recordDerby stores only a better total', () => {
    const store = createFishStore(memoryStorage());
    expect(store.recordDerby(77)).toBe(true);
    expect(store.recordDerby(50)).toBe(false);
    expect(store.recordDerby(77)).toBe(false);
    expect(store.data().derbyBest).toBe(77);
  });

  it('a store re-created from the same storage reads everything back', () => {
    const mem = memoryStorage();
    const first = createFishStore(mem);
    first.buyRod('twig', () => true);
    first.buyBait('cheese-rind', () => true);
    first.selectBait('cheese-rind');
    first.recordCatch(gudgeon, 11, '2026-05-06');
    first.recordDerby(77);

    expect(mem.map.has(FISH_SAVE_KEY)).toBe(true);

    const second = createFishStore(mem);
    expect(second.rod()?.id).toBe('twig');
    expect(second.baitCount('cheese-rind')).toBe(BAITS[1].pack);
    expect(second.bait().id).toBe('cheese-rind');
    expect(second.data().journal[gudgeon.id]).toEqual({ caught: 1, best: 11, first: '2026-05-06' });
    expect(second.data().cards).toEqual([{ id: gudgeon.id, size: 11 }]);
    expect(second.data().derbyBest).toBe(77);
  });

  it('grantAll owns every rod, 20 of each consumed bait and one of each lure', () => {
    const store = createFishStore(memoryStorage());
    store.grantAll();
    expect(store.data().rods).toEqual(RODS.map((r) => r.id));
    expect(store.rod()?.id).toBe('twig');
    expect(store.baitCount('cheese-rind')).toBe(20);
    expect(store.baitCount('glitter-spinner')).toBe(1);
    expect(store.baitCount('dough')).toBe(Infinity);
  });
});

describe('parseFishSave', () => {
  it('survives junk and non-objects', () => {
    const empty = emptyFishSave();
    expect(parseFishSave(null)).toEqual(empty);
    expect(parseFishSave('')).toEqual(empty);
    expect(parseFishSave('nonsense')).toEqual(empty);
    expect(parseFishSave('[]')).toEqual(empty);
    expect(parseFishSave('null')).toEqual(empty);
    expect(parseFishSave('{')).toEqual(empty);
  });

  it('drops unknown ids and bad values, keeps the good ones', () => {
    const raw = JSON.stringify({
      rods: ['twig', 'no-such-rod', 'twig'],
      rod: 'no-such-rod',
      baits: { 'cheese-rind': 3, dough: 5, bogus: 2, 'acorn-crumb': -1, 'sock-fly': 1.5 },
      bait: 'bogus',
      journal: {
        'fish-gudgeon': { caught: 2, best: 10, first: '2026-01-01' },
        'fish-nope': { caught: 1, best: 1, first: '2026-01-01' },
        'fish-mossback-trout': { caught: 'x', best: 1, first: '2026-01-01' },
      },
      cards: [
        { id: 'fish-gudgeon', size: 9 },
        { id: 'fish-nope', size: 3 },
        { id: 'fish-gudgeon', size: 'x' },
      ],
      caught: 'x',
      sold: 4,
      earned: -5,
      derbyBest: 60,
    });
    const d = parseFishSave(raw);
    expect(d.rods).toEqual(['twig']);
    expect(d.rod).toBe('twig');
    expect(d.baits).toEqual({ 'cheese-rind': 3 });
    expect(d.bait).toBe('dough');
    expect(d.journal).toEqual({ 'fish-gudgeon': { caught: 2, best: 10, first: '2026-01-01' } });
    expect(d.cards).toEqual([{ id: 'fish-gudgeon', size: 9 }]);
    expect(d.caught).toBe(0);
    expect(d.sold).toBe(4);
    expect(d.earned).toBe(0);
    expect(d.derbyBest).toBe(60);
  });

  it('selects no rod when the chosen one is not owned and nothing is owned', () => {
    const d = parseFishSave(JSON.stringify({ rods: [], rod: 'cane' }));
    expect(d.rod).toBe('');
    expect(d.rods).toEqual([]);
  });

  it('caps the stored cards at FISH.cardCap', () => {
    const cards = Array.from({ length: FISH.cardCap + 10 }, () => ({ id: 'fish-gudgeon', size: 9 }));
    expect(parseFishSave(JSON.stringify({ cards })).cards).toHaveLength(FISH.cardCap);
  });
});
