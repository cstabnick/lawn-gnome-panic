import { describe, expect, it } from 'vitest';
import { SHOP_ITEMS, shownPrice } from './shopItems';
import type { CounterId } from './town';

describe('shop items', () => {
  it('every counter has at least one item', () => {
    const counters: CounterId[] = ['store', 'diner', 'workshop'];
    for (const c of counters) {
      expect(SHOP_ITEMS.some((i) => i.counter === c)).toBe(true);
    }
  });

  it('ids are unique and prices are positive', () => {
    const ids = SHOP_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of SHOP_ITEMS) expect(i.price).toBeGreaterThan(0);
  });

  it('shownPrice rounds and applies the perk scale', () => {
    const biscuits = SHOP_ITEMS.find((i) => i.id === 'dust-biscuits');
    if (!biscuits) throw new Error('dust-biscuits missing');
    expect(shownPrice(biscuits, 1)).toBe(4);
    expect(shownPrice(biscuits, 0.8)).toBe(3);
    expect(shownPrice(biscuits, 0)).toBe(0);
    const repair = SHOP_ITEMS.find((i) => i.id === 'repair');
    if (!repair) throw new Error('repair missing');
    expect(shownPrice(repair, 0.8)).toBe(28);
  });
});
