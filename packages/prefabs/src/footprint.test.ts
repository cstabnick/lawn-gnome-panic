// Checks the solid-footprint defaults that the level editor reads: the table of ground footprints, and that no carried item has one.
// Run: npm test -w packages/prefabs
import { describe, expect, it } from 'vitest';
import { allPrefabs, prefabFootprint } from './registry';

const SOLID_IDS = [
  'stone-fountain', 'garden-shed', 'hq-tent', 'birdbath', 'veggie-bed', 'garden-rock', 'tree-stump', 'broadleaf-tree',
  'crate', 'cocktail-table', 'vending-machine', 'slot-machine-classic', 'slot-machine-deluxe', 'slot-machine-mushroom',
  'golf-cart', 'compost-heap', 'round-bush', 'flower-pot', 'cone-pine', 'barrel', 'bar-counter', 'arcade-cabinet',
  'blackjack-table',
];

const NOT_SOLID_CATEGORIES = ['weapon', 'armor', 'consumable', 'food', 'trinket'];

describe('prefab footprints', () => {
  it('returns the footprint for a solid prefab', () => {
    expect(prefabFootprint('hq-tent')).toEqual({ r: 1.2, h: 1.25 });
  });

  for (const id of SOLID_IDS) {
    it(`${id} has a sensible footprint`, () => {
      const fp = prefabFootprint(id);
      expect(fp, id).toBeDefined();
      expect(fp!.r, `${id} r`).toBeGreaterThan(0);
      expect(fp!.r, `${id} r`).toBeLessThanOrEqual(2);
      expect(fp!.h, `${id} h`).toBeGreaterThan(0);
    });
  }

  it('returns undefined for an unknown prefab', () => {
    expect(prefabFootprint('no-such-prefab')).toBeUndefined();
  });

  it('returns undefined for a prefab that is not solid', () => {
    expect(prefabFootprint('bench')).toBeUndefined();
  });

  it('never gives a carried item a footprint', () => {
    for (const p of allPrefabs()) {
      if (!p.footprint) continue;
      expect(NOT_SOLID_CATEGORIES, `${p.id} (${p.category})`).not.toContain(p.category);
    }
  });
});
