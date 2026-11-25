// The bag (E08, docs/roadmaps/gta-batch-3/E08/contracts.md): consumable items the player carries. Snacks heal, fun
// items do something silly, tools fix things. Pure data and counts: no DOM, no three.js. Using an item only takes it
// out of the bag and tells the onItemUse listeners; the game (bag/runtime.ts) applies the effect.
// Saved under INVENTORY_KEY (saveIO.ts GTA_SAVE_KEYS, cloudSave.ts MERGES). Icons: @lawn/prefabs ids (def.prefab).

import { notifySaveChanged } from './saveHook';

export const INVENTORY_KEY = 'gta-inventory-v1';
/** Most of one item the bag holds. */
export const STACK_MAX = 9;

export type ItemKind = 'snack' | 'tool' | 'fun';
/** What a fun item or tool does (bag/runtime.ts): fizz = run and jump faster a while, float = jump much higher a while,
 *  confetti = a burst of confetti, whoopee = a rude noise, patch = +patchHp hit points on the vehicle you sit in. */
export type ItemEffect = 'fizz' | 'float' | 'confetti' | 'whoopee' | 'patch';

export interface ItemDef {
  id: string;
  name: string;
  /** @lawn/prefabs id for the icon (prefabIconElement) and the world pickup model. */
  prefab: string;
  kind: ItemKind;
  /** Snacks: mends this much of full health (0..1). */
  heal?: number;
  effect?: ItemEffect;
  /** Price at Crumbs & Co. (the bag's shop tab). Absent = not sold (found or cooked only). */
  price?: number;
  /** One line for the bag. */
  blurb: string;
}

/** Seconds a fizz / float lasts, and their multipliers; hit points a patch mends. */
export const ITEM_TUNING = {
  fizzS: 20,
  fizzSpeed: 1.3,
  fizzJump: 1.2,
  floatS: 20,
  floatJump: 1.8,
  patchHp: 0.25,
} as const;

export const ITEMS: ItemDef[] = [
  { id: 'crab-apple', name: 'Crab Apple', prefab: 'crab-apple', kind: 'snack', heal: 0.15, price: 4,
    blurb: 'Sour enough to make a gnome blink. Mends a hairline crack.' },
  { id: 'seed-cake', name: 'Seed Cake', prefab: 'seed-cake', kind: 'snack', heal: 0.25, price: 8,
    blurb: 'Dense, nutty and slightly too dry. Mends a small chip.' },
  { id: 'cheese-wedge', name: 'Cheese Wedge', prefab: 'cheese-wedge', kind: 'snack', heal: 0.3, price: 10,
    blurb: 'Smells like a garage. Mends more than you would think.' },
  { id: 'bread-loaf', name: 'Bread Loaf', prefab: 'bread-loaf', kind: 'snack', heal: 0.4, price: 14,
    blurb: 'A whole loaf. Nobody is watching. Mends a good crack.' },
  { id: 'toadstool-stew', name: 'Toadstool Stew', prefab: 'toadstool-stew', kind: 'snack', heal: 0.7, price: 24,
    blurb: 'Hot, brown and better than it looks. Mends most of the damage.' },
  { id: 'honeydew-flask', name: 'Honeydew Flask', prefab: 'honeydew-flask', kind: 'snack', heal: 1, price: 40,
    blurb: 'A full flask of it. Good as new, glaze and all.' },
  { id: 'espresso-cup', name: 'Espresso Cup', prefab: 'espresso-cup', kind: 'fun', effect: 'fizz', price: 15,
    blurb: 'Run faster and jump higher for a while. Your hat may vibrate.' },
  { id: 'sky-tonic', name: 'Sky Tonic', prefab: 'sky-tonic', kind: 'fun', effect: 'float', price: 25,
    blurb: 'Jump very high for a while. Landing is your own business.' },
  { id: 'party-popper', name: 'Party Popper', prefab: 'party-popper', kind: 'fun', effect: 'confetti', price: 6,
    blurb: 'Pull the string. Confetti. That is the whole thing.' },
  { id: 'whoopee-cushion', name: 'Whoopee Cushion', prefab: 'whoopee-cushion', kind: 'fun', effect: 'whoopee', price: 5,
    blurb: 'Timeless. Every gnome within earshot will pretend not to laugh.' },
  { id: 'rust-oil', name: 'Rust Oil', prefab: 'rust-oil', kind: 'tool', effect: 'patch', price: 45,
    blurb: 'A roadside fix: mends a quarter of the damage on the vehicle you sit in.' },
];

/** Add an item kind (E16 produce, E18 dishes) or replace the one with the same id. */
export function registerItem(def: ItemDef): void {
  const i = ITEMS.findIndex((d) => d.id === def.id);
  if (i >= 0) ITEMS[i] = def;
  else ITEMS.push(def);
}

export function itemDef(id: string): ItemDef | undefined {
  return ITEMS.find((d) => d.id === id);
}

/** The saved JSON under INVENTORY_KEY. */
export interface InventorySave {
  v: 1;
  /** Item id -> count (1..STACK_MAX). Unknown ids are kept (an epic may register them later). */
  items: Record<string, number>;
  /** The quick-use slot's item id, or null = the best snack for the damage taken. */
  quick: string | null;
}

export interface InventoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface Inventory {
  count(id: string): number;
  /** Add n (default 1), capped at STACK_MAX. Returns how many were actually added (0 when full or n <= 0). Persists,
   *  calls onChange listeners. Unknown ids are allowed (counted and saved). */
  add(id: string, n?: number): number;
  /** Take one out and call the onItemUse listeners with its def. False (nothing changes) when the count is 0 or the
   *  id is not a registered item. Persists. */
  use(id: string): boolean;
  /** Take n out without using (sold, given away). Returns how many were removed. Persists. */
  remove(id: string, n?: number): number;
  /** Everything held, in ITEMS order (registered items only), counts > 0. */
  list(): { def: ItemDef; count: number }[];
  quick(): string | null;
  setQuick(id: string | null): void;
  /** The item the quick-use button eats now: the quick slot when held; else, when hurt (missing > 0), the snack whose
   *  heal is the smallest one >= missing, or the biggest heal held when none covers it; null when nothing fits. */
  pickQuick(missing: number): string | null;
  onItemUse(cb: (def: ItemDef) => void): () => void;
  /** After any count or quick-slot change. */
  onChange(cb: () => void): () => void;
}

function resolveDefaultInventoryStorage(): InventoryStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function loadInventory(store: InventoryStorage | undefined): { items: Map<string, number>; quick: string | null } {
  const empty = { items: new Map<string, number>(), quick: null };
  if (!store) return empty;
  try {
    const raw = store.getItem(INVENTORY_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<InventorySave> | null;
    if (!parsed || typeof parsed !== 'object') return empty;
    const items = new Map<string, number>();
    if (parsed.items && typeof parsed.items === 'object') {
      for (const [id, n] of Object.entries(parsed.items)) {
        if (typeof n !== 'number' || !Number.isFinite(n)) continue;
        const r = Math.round(n);
        if (r <= 0) continue;
        items.set(id, Math.min(STACK_MAX, r));
      }
    }
    const quick = typeof parsed.quick === 'string' ? parsed.quick : null;
    return { items, quick };
  } catch {
    return empty;
  }
}

/** The bag: counts, the quick-use slot, and listeners. Saved under INVENTORY_KEY after every change. */
export function createInventory(storage?: InventoryStorage): Inventory {
  const store = storage ?? resolveDefaultInventoryStorage();
  const loaded = loadInventory(store);
  const counts = loaded.items;
  let quickId: string | null = loaded.quick;
  const useListeners = new Set<(def: ItemDef) => void>();
  const changeListeners = new Set<() => void>();

  const persist = (): void => {
    if (!store) return;
    try {
      const save: InventorySave = { v: 1, items: Object.fromEntries(counts), quick: quickId };
      store.setItem(INVENTORY_KEY, JSON.stringify(save));
      notifySaveChanged();
    } catch {
      // Storage quota or private-mode access failure is non-fatal.
    }
  };

  const emitChange = (): void => {
    for (const cb of [...changeListeners]) cb();
  };

  const count = (id: string): number => counts.get(id) ?? 0;

  const setCount = (id: string, c: number): void => {
    if (c <= 0) counts.delete(id);
    else counts.set(id, c);
  };

  return {
    count,

    add(id, n = 1) {
      if (!Number.isFinite(n)) return 0;
      const want = Math.round(n);
      if (want <= 0) return 0;
      const fits = Math.min(want, STACK_MAX - count(id));
      if (fits <= 0) return 0;
      setCount(id, count(id) + fits);
      persist();
      emitChange();
      return fits;
    },

    use(id) {
      const def = itemDef(id);
      if (!def || count(id) <= 0) return false;
      setCount(id, count(id) - 1);
      persist();
      for (const cb of [...useListeners]) cb(def);
      emitChange();
      return true;
    },

    remove(id, n = 1) {
      if (!Number.isFinite(n)) return 0;
      const want = Math.round(n);
      if (want <= 0) return 0;
      const taken = Math.min(want, count(id));
      if (taken <= 0) return 0;
      setCount(id, count(id) - taken);
      persist();
      emitChange();
      return taken;
    },

    list() {
      const out: { def: ItemDef; count: number }[] = [];
      for (const def of ITEMS) {
        const c = count(def.id);
        if (c > 0) out.push({ def, count: c });
      }
      return out;
    },

    quick() {
      return quickId;
    },

    setQuick(id) {
      quickId = id;
      persist();
      emitChange();
    },

    pickQuick(missing) {
      if (quickId && count(quickId) > 0) return quickId;
      if (!(missing > 0)) return null;
      const held = ITEMS.filter((d) => d.kind === 'snack' && (d.heal ?? 0) > 0 && count(d.id) > 0);
      if (held.length === 0) return null;
      const covering = held.filter((d) => (d.heal ?? 0) >= missing);
      if (covering.length > 0) {
        return covering.reduce((best, d) => ((d.heal ?? 0) < (best.heal ?? 0) ? d : best)).id;
      }
      return held.reduce((best, d) => ((d.heal ?? 0) > (best.heal ?? 0) ? d : best)).id;
    },

    onItemUse(cb) {
      useListeners.add(cb);
      return () => {
        useListeners.delete(cb);
      };
    },

    onChange(cb) {
      changeListeners.add(cb);
      return () => {
        changeListeners.delete(cb);
      };
    },
  };
}

// ---- The installed instance (the game installs one; other epics call these) ----

let active: Inventory | null = null;

export function installInventory(inv: Inventory | null): void {
  active = inv;
}

export function activeInventory(): Inventory | null {
  return active;
}

/** Put n of an item in the bag (E16 produce, E18 dishes). Returns how many fitted. */
export function addItem(id: string, n = 1): number {
  return active ? active.add(id, n) : 0;
}

export function useItem(id: string): boolean {
  return active ? active.use(id) : false;
}

export function count(id: string): number {
  return active ? active.count(id) : 0;
}

export function onItemUse(cb: (def: ItemDef) => void): () => void {
  return active ? active.onItemUse(cb) : () => {};
}
