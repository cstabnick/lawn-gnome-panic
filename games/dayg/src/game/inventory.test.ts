import { describe, it, expect } from 'vitest';
import { createInventory } from './inventory';
import { START_KIT } from '../config';
import type { ItemStack } from '../sim/types';

const stack = (def: string, count = 1, condition = 1): ItemStack => ({ def, count, condition });

describe('createInventory: start', () => {
  it('puts the loot-sack on the back and the trowel in hand', () => {
    const inv = createInventory(START_KIT);
    expect(inv.state.worn.back?.def).toBe('loot-sack');
    expect(inv.held()?.def).toBe('old-trowel');
    expect(inv.state.hands[1]).toBeNull();
  });

  it('copies the start stacks instead of keeping the caller objects', () => {
    const kit = [stack('bread-loaf', 2)];
    const inv = createInventory(kit);
    inv.take({ where: 'pack', index: 0 }, 1);
    expect(kit[0].count).toBe(2);
  });
});

describe('createInventory: bulk', () => {
  it('limits the pack to 4 L without a sack, and adds 12 L with one', () => {
    expect(createInventory(START_KIT.filter((s) => s.def !== 'loot-sack')).bulkCapacity()).toBe(4);
    expect(createInventory(START_KIT).bulkCapacity()).toBe(16);
  });

  it('stops adding to the pack when bulk is full and leaves the rest in hands', () => {
    const inv = createInventory([]);
    const left = inv.add(stack('stone-chunk', 10));
    expect(left).toBeNull();
    expect(inv.bulkUsed()).toBeLessThanOrEqual(4);
    const packCount = inv.state.pack.reduce((n, s) => n + s.count, 0);
    const handCount = inv.state.hands.reduce((n, s) => n + (s?.count ?? 0), 0);
    expect(packCount + handCount).toBe(10);
    expect(packCount).toBe(8);
  });
});

describe('createInventory: add', () => {
  it('merges into a same-def stack and averages the condition', () => {
    const inv = createInventory([stack('bread-loaf', 1, 1)]);
    expect(inv.add(stack('bread-loaf', 2, 0.5))).toBeNull();
    expect(inv.state.pack).toHaveLength(1);
    expect(inv.state.pack[0].count).toBe(3);
    expect(inv.state.pack[0].condition).toBeCloseTo(2 / 3);
  });
});

describe('createInventory: tags', () => {
  it('consumeTag is all or nothing', () => {
    const inv = createInventory([stack('twig-bundle', 2)]);
    expect(inv.consumeTag('FUEL', 3)).toBe(false);
    expect(inv.countTag('FUEL')).toBe(2);
    expect(inv.consumeTag('FUEL', 2)).toBe(true);
    expect(inv.countTag('FUEL')).toBe(0);
  });
});

describe('createInventory: liquids', () => {
  it('a tin pail filled with 2 L clean water and one bottle gives 2.5 L clean water', () => {
    const inv = createInventory([stack('loot-sack'), stack('tin-pail'), stack('spigot-water')]);
    expect(inv.fillLiquid('clean', 2)).toBe(2);
    expect(inv.cleanWater()).toBe(2.5);
  });

  it('useWater takes liquid out of containers before whole bottles', () => {
    const inv = createInventory([stack('loot-sack'), stack('tin-pail'), stack('spigot-water')]);
    inv.fillLiquid('clean', 2);
    expect(inv.useWater(1)).toBe(1);
    expect(inv.cleanWater()).toBe(1.5);
    expect(inv.findTag('DRINK')).not.toBeNull();
  });

  it('weight includes liquid at 1 kg per litre', () => {
    const inv = createInventory([stack('tin-pail')]);
    inv.fillLiquid('clean', 2);
    expect(inv.weight()).toBeCloseTo(0.4 + 2);
  });
});

describe('createInventory: move', () => {
  it('wears a wearable item only in its slot', () => {
    const inv = createInventory([stack('acorn-club')]);
    inv.add(stack('wool-scarf'));
    inv.add(stack('bucket-helm'));
    expect(inv.state.pack.map((s) => s.def)).toEqual(['wool-scarf', 'bucket-helm']);
    expect(inv.move({ where: 'pack', index: 1 }, { where: 'worn', slot: 'neck' })).toBe(false);
    expect(inv.move({ where: 'pack', index: 0 }, { where: 'worn', slot: 'neck' })).toBe(true);
    expect(inv.state.worn.neck?.def).toBe('wool-scarf');
  });
});
