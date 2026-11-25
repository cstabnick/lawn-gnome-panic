import { afterEach, describe, expect, it } from 'vitest';
import {
  addItem,
  count,
  createInventory,
  INVENTORY_KEY,
  installInventory,
  ITEMS,
  type InventoryStorage,
  type ItemDef,
  itemDef,
  registerItem,
  STACK_MAX,
  useItem,
} from './inventory';

function memoryStorage(): InventoryStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

afterEach(() => {
  installInventory(null);
});

describe('createInventory counts', () => {
  it('add caps at STACK_MAX and returns what fitted', () => {
    const inv = createInventory(memoryStorage());
    expect(inv.add('crab-apple', STACK_MAX - 2)).toBe(STACK_MAX - 2);
    expect(inv.add('crab-apple', 5)).toBe(2);
    expect(inv.count('crab-apple')).toBe(STACK_MAX);
    expect(inv.add('crab-apple')).toBe(0);
    expect(inv.count('crab-apple')).toBe(STACK_MAX);
  });

  it('add rounds, ignores n <= 0 and defaults to 1', () => {
    const inv = createInventory(memoryStorage());
    expect(inv.add('seed-cake')).toBe(1);
    expect(inv.add('seed-cake', 0)).toBe(0);
    expect(inv.add('seed-cake', -3)).toBe(0);
    expect(inv.add('seed-cake', 2.4)).toBe(2);
    expect(inv.count('seed-cake')).toBe(3);
  });

  it('unknown ids can be added and are saved', () => {
    const storage = memoryStorage();
    const inv = createInventory(storage);
    expect(inv.add('mystery-plum', 2)).toBe(2);
    expect(inv.count('mystery-plum')).toBe(2);
    const saved = JSON.parse(storage.map.get(INVENTORY_KEY) ?? 'null');
    expect(saved.items['mystery-plum']).toBe(2);
  });

  it('remove takes up to n and returns how many', () => {
    const inv = createInventory(memoryStorage());
    inv.add('cheese-wedge', 3);
    expect(inv.remove('cheese-wedge', 2)).toBe(2);
    expect(inv.remove('cheese-wedge', 5)).toBe(1);
    expect(inv.remove('cheese-wedge')).toBe(0);
    expect(inv.count('cheese-wedge')).toBe(0);
  });

  it('list follows ITEMS order and only shows held items', () => {
    const inv = createInventory(memoryStorage());
    inv.add('rust-oil', 1);
    inv.add('crab-apple', 2);
    inv.add('party-popper', 1);
    const ids = inv.list().map((e) => e.def.id);
    expect(ids).toEqual(['crab-apple', 'party-popper', 'rust-oil']);
    expect(inv.list()[0].count).toBe(2);
  });
});

describe('createInventory use', () => {
  it('decrements, calls onItemUse with the def and refuses at 0', () => {
    const inv = createInventory(memoryStorage());
    const used: ItemDef[] = [];
    inv.onItemUse((def) => used.push(def));
    inv.add('espresso-cup', 1);
    expect(inv.use('espresso-cup')).toBe(true);
    expect(used.map((d) => d.id)).toEqual(['espresso-cup']);
    expect(used[0]).toBe(itemDef('espresso-cup'));
    expect(inv.count('espresso-cup')).toBe(0);
    expect(inv.use('espresso-cup')).toBe(false);
    expect(used).toHaveLength(1);
  });

  it('refuses unregistered ids even when held', () => {
    const inv = createInventory(memoryStorage());
    inv.add('mystery-plum', 1);
    expect(inv.use('mystery-plum')).toBe(false);
    expect(inv.count('mystery-plum')).toBe(1);
  });

  it('fires onChange after use and after add', () => {
    const inv = createInventory(memoryStorage());
    let changes = 0;
    const off = inv.onChange(() => changes++);
    inv.add('bread-loaf', 1);
    inv.use('bread-loaf');
    expect(changes).toBe(2);
    off();
    inv.add('bread-loaf', 1);
    expect(changes).toBe(2);
  });

  it('keeps the quick slot when its item runs out', () => {
    const inv = createInventory(memoryStorage());
    inv.add('seed-cake', 1);
    inv.setQuick('seed-cake');
    inv.use('seed-cake');
    expect(inv.quick()).toBe('seed-cake');
  });
});

describe('quick slot and pickQuick', () => {
  it('quick slot persists across instances', () => {
    const storage = memoryStorage();
    const inv = createInventory(storage);
    inv.add('seed-cake', 1);
    inv.setQuick('seed-cake');
    expect(createInventory(storage).quick()).toBe('seed-cake');
    inv.setQuick(null);
    expect(createInventory(storage).quick()).toBeNull();
  });

  it('the quick item wins when held', () => {
    const inv = createInventory(memoryStorage());
    inv.add('honeydew-flask', 1);
    inv.add('crab-apple', 1);
    inv.setQuick('crab-apple');
    expect(inv.pickQuick(0.9)).toBe('crab-apple');
  });

  it('returns null when full health and no quick item', () => {
    const inv = createInventory(memoryStorage());
    inv.add('honeydew-flask', 1);
    expect(inv.pickQuick(0)).toBeNull();
    expect(inv.pickQuick(-1)).toBeNull();
  });

  it('picks the smallest covering heal', () => {
    const inv = createInventory(memoryStorage());
    inv.add('honeydew-flask', 1);
    inv.add('bread-loaf', 1);
    inv.add('cheese-wedge', 1);
    expect(inv.pickQuick(0.2)).toBe('cheese-wedge');
  });

  it('picks the biggest heal when none covers it', () => {
    const inv = createInventory(memoryStorage());
    inv.add('crab-apple', 1);
    inv.add('bread-loaf', 1);
    expect(inv.pickQuick(0.9)).toBe('bread-loaf');
  });

  it('ignores fun items and tools', () => {
    const inv = createInventory(memoryStorage());
    inv.add('party-popper', 1);
    inv.add('rust-oil', 1);
    expect(inv.pickQuick(0.5)).toBeNull();
  });
});

describe('persistence', () => {
  it('reloads counts from storage on a second instance', () => {
    const storage = memoryStorage();
    const first = createInventory(storage);
    first.add('crab-apple', 2);
    first.add('sky-tonic', 1);
    const second = createInventory(storage);
    expect(second.count('crab-apple')).toBe(2);
    expect(second.count('sky-tonic')).toBe(1);
  });

  it('malformed JSON loads empty', () => {
    const storage = memoryStorage();
    storage.setItem(INVENTORY_KEY, '{not json');
    const inv = createInventory(storage);
    expect(inv.list()).toEqual([]);
    expect(inv.quick()).toBeNull();
    expect(inv.count('crab-apple')).toBe(0);
  });

  it('clamps and drops bad counts on load', () => {
    const storage = memoryStorage();
    storage.setItem(
      INVENTORY_KEY,
      JSON.stringify({ v: 1, items: { 'crab-apple': 99, 'seed-cake': 0, 'bread-loaf': 'x', 'cheese-wedge': 2.6 }, quick: 5 }),
    );
    const inv = createInventory(storage);
    expect(inv.count('crab-apple')).toBe(STACK_MAX);
    expect(inv.count('seed-cake')).toBe(0);
    expect(inv.count('bread-loaf')).toBe(0);
    expect(inv.count('cheese-wedge')).toBe(3);
    expect(inv.quick()).toBeNull();
  });

  it('tolerates a storage that throws', () => {
    const broken: InventoryStorage = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    const inv = createInventory(broken);
    expect(inv.list()).toEqual([]);
    expect(inv.add('crab-apple', 1)).toBe(1);
    expect(inv.count('crab-apple')).toBe(1);
  });
});

describe('registry and installed instance', () => {
  it('registerItem adds a def and replaces one with the same id', () => {
    const extra: ItemDef = { id: 'test-plum', name: 'Test Plum', prefab: 'crab-apple', kind: 'snack', heal: 0.1, blurb: 'x' };
    const original = itemDef('crab-apple');
    const before = ITEMS.length;
    try {
      registerItem(extra);
      expect(ITEMS.length).toBe(before + 1);
      expect(itemDef('test-plum')).toBe(extra);

      const replacement: ItemDef = { ...original!, name: 'Replaced Apple' };
      registerItem(replacement);
      expect(ITEMS.length).toBe(before + 1);
      expect(itemDef('crab-apple')?.name).toBe('Replaced Apple');
    } finally {
      registerItem(original!);
      const i = ITEMS.findIndex((d) => d.id === 'test-plum');
      if (i >= 0) ITEMS.splice(i, 1);
    }
    expect(itemDef('crab-apple')).toBe(original);
    expect(ITEMS.length).toBe(before);
  });

  it('module-level helpers work after installInventory and are harmless after null', () => {
    expect(addItem('crab-apple', 1)).toBe(0);
    expect(useItem('crab-apple')).toBe(false);
    expect(count('crab-apple')).toBe(0);

    installInventory(createInventory(memoryStorage()));
    expect(addItem('crab-apple', 2)).toBe(2);
    expect(count('crab-apple')).toBe(2);
    expect(useItem('crab-apple')).toBe(true);
    expect(count('crab-apple')).toBe(1);

    installInventory(null);
    expect(count('crab-apple')).toBe(0);
    expect(useItem('crab-apple')).toBe(false);
    expect(addItem('crab-apple')).toBe(0);
  });
});
