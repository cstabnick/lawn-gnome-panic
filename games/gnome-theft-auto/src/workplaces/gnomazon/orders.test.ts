import { describe, expect, it } from 'vitest';
import { BOX_CAP } from './types';
import type { PackedParcel } from './types';
import { STOCK, makeOrder, quotaFor, rightBox, scoreParcel, stockItem } from './orders';

function parcelFor(seconds: number, over: Partial<PackedParcel> = {}): PackedParcel {
  const order = makeOrder(2, 7, 1);
  return { order, picked: order.items.slice(), box: order.box, taped: true, label: order.dest, seconds, ...over };
}

describe('Gnomazon stock', () => {
  it('has 12 items with unique ids, a prefab and a size 1..5', () => {
    expect(STOCK).toHaveLength(12);
    expect(new Set(STOCK.map((s) => s.id)).size).toBe(12);
    for (const s of STOCK) {
      expect(s.size).toBeGreaterThanOrEqual(1);
      expect(s.size).toBeLessThanOrEqual(5);
      expect(s.prefab.length).toBeGreaterThan(0);
      expect(stockItem(s.id)).toBe(s);
    }
  });
});

describe('rightBox', () => {
  it('picks the smallest box whose capacity fits the total size', () => {
    expect(rightBox([])).toBe('S');
    expect(rightBox(['trowel'])).toBe('S');
    expect(rightBox(['can', 'pot'])).toBe('M'); // 4 + 2 = 6
    expect(rightBox(['can', 'hose'])).toBe('L'); // 4 + 5 = 9
    expect(rightBox(['can', 'hose'])).not.toBe('M');
  });
});

describe('makeOrder', () => {
  it('is deterministic for the same inputs', () => {
    expect(makeOrder(3, 42, 5)).toEqual(makeOrder(3, 42, 5));
  });

  it('keeps every order inside the L box with the right box and three distinct labels', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (let level = 1; level <= 6; level++) {
        const o = makeOrder(level, seed, seed);
        const total = o.items.reduce((sum, id) => sum + (stockItem(id)?.size ?? 0), 0);
        expect(o.items.length).toBeGreaterThanOrEqual(1);
        expect(total).toBeLessThanOrEqual(BOX_CAP.L);
        expect(BOX_CAP[o.box]).toBeGreaterThanOrEqual(total);
        expect(o.box).toBe(rightBox(o.items));
        expect(o.labels).toHaveLength(3);
        expect(new Set(o.labels).size).toBe(3);
        expect(o.labels).toContain(o.dest);
      }
    }
  });

  it('gives one item at level 1 and at most three at level 4+', () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(makeOrder(1, seed, 1).items).toHaveLength(1);
      expect(makeOrder(4, seed, 1).items.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('scoreParcel', () => {
  it('gives five stars for a perfect fast parcel', () => {
    const s = scoreParcel(parcelFor(3));
    expect(s.stars).toBe(5);
    expect(s.rightItems && s.rightBox && s.rightLabel && s.taped).toBe(true);
  });

  it('gives fewer stars for each wrong item, box or label', () => {
    const perfect = scoreParcel(parcelFor(3)).stars;
    const wrongItems = scoreParcel(parcelFor(3, { picked: ['duck'] })).stars;
    const wrongBox = scoreParcel(parcelFor(3, { box: 'L' === parcelFor(3).order.box ? 'S' : 'L' })).stars;
    const wrongLabel = scoreParcel(parcelFor(3, { label: 'Nowhere' })).stars;
    expect(wrongItems).toBeLessThan(perfect);
    expect(wrongBox).toBeLessThan(perfect);
    expect(wrongLabel).toBeLessThan(perfect);
  });

  it('lowers the score for an untaped parcel', () => {
    const taped = scoreParcel(parcelFor(3));
    const untaped = scoreParcel(parcelFor(3, { taped: false }));
    expect(untaped.taped).toBe(false);
    expect(untaped.line.length).toBeGreaterThan(0);
    expect(taped.stars).toBeGreaterThanOrEqual(untaped.stars);
  });

  it('gives a specific bad line that names the mistake', () => {
    const wrong = scoreParcel(parcelFor(3, { picked: ['duck'] }));
    expect(wrong.line).toContain('Wrong items');
  });

  it('takes stars off for slow parcels', () => {
    expect(scoreParcel(parcelFor(3)).stars).toBe(5);
    expect(scoreParcel(parcelFor(60)).stars).toBeLessThan(5);
  });
});

describe('quotaFor', () => {
  it('rises with level', () => {
    expect(quotaFor(2)).toBeGreaterThan(quotaFor(1));
    expect(quotaFor(3)).toBeGreaterThan(quotaFor(2));
    expect(quotaFor(1)).toBe(7);
  });
});
