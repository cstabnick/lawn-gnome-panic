// Fishing save (key 'gta-fishing-v1'): rods owned, bait, the journal of species landed, catch cards to sell, totals.
// Tolerant parse like huntSave.ts: anything broken is dropped, a fully broken save is an empty one.
import { notifySaveChanged } from '../saveHook';
import { BAITS, DEFAULT_BAIT, RODS, baitById, rodById } from './tackle';
import { catchValue, fishById } from './species';
import { FISH } from './types';
import type { BaitDef, FishSpecies, RodDef } from './types';

export const FISH_SAVE_KEY = 'gta-fishing-v1';

export interface FishRecord {
  caught: number;
  /** Longest landed, cm. */
  best: number;
  /** First landed, YYYY-MM-DD. */
  first: string;
}

export interface CatchCard {
  id: string;
  size: number;
}

export interface FishSaveData {
  v: 1;
  /** Rod ids owned. */
  rods: string[];
  /** Selected rod id ('' with none). */
  rod: string;
  /** Bait counts by id (dough is never stored: it is unlimited). */
  baits: Record<string, number>;
  /** Selected bait id. */
  bait: string;
  journal: Record<string, FishRecord>;
  cards: CatchCard[];
  /** Lifetime fish landed, cards sold, Acorns earned from cards. */
  caught: number;
  sold: number;
  earned: number;
  /** Best derby total, cm. */
  derbyBest: number;
}

export interface FishStore {
  data(): Readonly<FishSaveData>;
  hasRod(): boolean;
  ownsRod(id: string): boolean;
  /** Pay rod.price through spend(); on success own and select it. False when owned, unknown or not paid. */
  buyRod(id: string, spend: (n: number) => boolean): boolean;
  /** Select an owned rod. */
  selectRod(id: string): boolean;
  /** The selected rod, or null with none. */
  rod(): RodDef | null;
  /** The selected bait (dough when the selected one has run out). */
  bait(): BaitDef;
  /** How many of a bait: Infinity for dough (price 0); 0 for an unknown id. */
  baitCount(id: string): number;
  /** Pay bait.price; on success add bait.pack. A lure (consumed false) owned already: false. */
  buyBait(id: string, spend: (n: number) => boolean): boolean;
  /** Select a bait you have (count > 0). */
  selectBait(id: string): boolean;
  /** Select the next bait in BAITS order that you have, wrapping. Returns it. */
  cycleBait(): BaitDef;
  /** One of the selected bait is used up (if consumed); at 0 the selection falls back to dough. */
  useBait(): void;
  /** A landed fish: journal (caught + 1, best, first date), lifetime caught, and a card when there is room. */
  recordCatch(s: FishSpecies, size: number, date?: string): { first: boolean; record: boolean; card: boolean };
  cardsFull(): boolean;
  /** Sell every card (catchValue each): clears cards, adds to sold and earned. The caller pays the Acorns. */
  sellCards(): { count: number; acorns: number };
  /** True when total beats derbyBest (then stored). */
  recordDerby(total: number): boolean;
  /** Species with caught > 0. */
  speciesCaught(): number;
  /** Debug trainer: own every rod and 20 of every consumed bait and every lure. */
  grantAll(): void;
}

export function emptyFishSave(): FishSaveData {
  return { v: 1, rods: [], rod: '', baits: {}, bait: 'dough', journal: {}, cards: [], caught: 0, sold: 0, earned: 0, derbyBest: 0 };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

function isNonNegNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

/** Tolerant parse: anything broken is dropped; a fully broken save is an empty one. */
export function parseFishSave(raw: string | null): FishSaveData {
  if (!raw) return emptyFishSave();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyFishSave();
  }
  if (!isRecord(parsed)) return emptyFishSave();

  const out = emptyFishSave();

  if (Array.isArray(parsed.rods)) {
    for (const id of parsed.rods) {
      if (typeof id === 'string' && rodById(id) && !out.rods.includes(id)) out.rods.push(id);
    }
  }
  const selectedRod = parsed.rod;
  out.rod = typeof selectedRod === 'string' && out.rods.includes(selectedRod) ? selectedRod : (out.rods[0] ?? '');

  if (isRecord(parsed.baits)) {
    for (const [id, count] of Object.entries(parsed.baits)) {
      if (id !== DEFAULT_BAIT && baitById(id) && isNonNegInt(count)) out.baits[id] = count;
    }
  }
  const selectedBait = parsed.bait;
  out.bait = typeof selectedBait === 'string' && baitById(selectedBait) ? selectedBait : DEFAULT_BAIT;

  if (isRecord(parsed.journal)) {
    for (const [id, entry] of Object.entries(parsed.journal)) {
      if (!fishById(id) || !isRecord(entry)) continue;
      const { caught, best, first } = entry;
      if (!isNonNegNumber(caught) || !isNonNegNumber(best) || typeof first !== 'string') continue;
      out.journal[id] = { caught, best, first };
    }
  }

  if (Array.isArray(parsed.cards)) {
    for (const card of parsed.cards) {
      if (out.cards.length >= FISH.cardCap) break;
      if (!isRecord(card)) continue;
      const { id, size } = card;
      if (typeof id !== 'string' || !fishById(id) || !isNonNegNumber(size)) continue;
      out.cards.push({ id, size });
    }
  }

  if (isNonNegNumber(parsed.caught)) out.caught = parsed.caught;
  if (isNonNegNumber(parsed.sold)) out.sold = parsed.sold;
  if (isNonNegNumber(parsed.earned)) out.earned = parsed.earned;
  if (isNonNegNumber(parsed.derbyBest)) out.derbyBest = parsed.derbyBest;
  return out;
}

type FishStorage = Pick<Storage, 'getItem' | 'setItem'>;

function resolveDefaultStorage(): FishStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function memoryStorage(): FishStorage {
  const m = new Map<string, string>();
  return {
    getItem: (key) => m.get(key) ?? null,
    setItem: (key, value) => {
      m.set(key, value);
    },
  };
}

function loadData(storage: FishStorage): FishSaveData {
  try {
    return parseFishSave(storage.getItem(FISH_SAVE_KEY));
  } catch {
    return emptyFishSave();
  }
}

export function createFishStore(storage?: Pick<Storage, 'getItem' | 'setItem'>): FishStore {
  const store: FishStorage = storage ?? resolveDefaultStorage() ?? memoryStorage();
  const d = loadData(store);
  const dough: BaitDef = baitById(DEFAULT_BAIT) ?? BAITS[0];

  const save = (): void => {
    try {
      store.setItem(FISH_SAVE_KEY, JSON.stringify(d));
    } catch {
      // Storage quota or private-mode access failure is non-fatal.
    }
    notifySaveChanged();
  };

  const baitCount = (id: string): number => {
    if (id === DEFAULT_BAIT) return Infinity;
    if (!baitById(id)) return 0;
    return d.baits[id] ?? 0;
  };

  const bait = (): BaitDef => {
    const selected = baitById(d.bait);
    if (selected && baitCount(selected.id) > 0) return selected;
    if (d.bait !== DEFAULT_BAIT) {
      d.bait = DEFAULT_BAIT;
      save();
    }
    return dough;
  };

  return {
    data: () => d,
    hasRod: () => d.rods.length > 0,
    ownsRod: (id) => d.rods.includes(id),

    buyRod(id, spend) {
      const rod = rodById(id);
      if (!rod || d.rods.includes(id)) return false;
      if (!spend(rod.price)) return false;
      d.rods.push(id);
      d.rod = id;
      save();
      return true;
    },

    selectRod(id) {
      if (!d.rods.includes(id)) return false;
      d.rod = id;
      save();
      return true;
    },

    rod: () => (d.rods.includes(d.rod) ? (rodById(d.rod) ?? null) : null),

    bait,
    baitCount,

    buyBait(id, spend) {
      const b = baitById(id);
      if (!b || b.id === DEFAULT_BAIT) return false;
      if (!b.consumed && baitCount(id) > 0) return false;
      if (!spend(b.price)) return false;
      d.baits[id] = (d.baits[id] ?? 0) + b.pack;
      save();
      return true;
    },

    selectBait(id) {
      if (baitCount(id) <= 0) return false;
      d.bait = id;
      save();
      return true;
    },

    cycleBait() {
      const start = Math.max(0, BAITS.findIndex((b) => b.id === d.bait));
      for (let i = 1; i <= BAITS.length; i++) {
        const next = BAITS[(start + i) % BAITS.length];
        if (baitCount(next.id) > 0) {
          d.bait = next.id;
          save();
          return next;
        }
      }
      d.bait = DEFAULT_BAIT;
      save();
      return dough;
    },

    useBait() {
      const b = baitById(d.bait);
      if (!b || !b.consumed) return;
      const left = Math.max(0, (d.baits[b.id] ?? 0) - 1);
      d.baits[b.id] = left;
      if (left === 0) d.bait = DEFAULT_BAIT;
      save();
    },

    recordCatch(s, size, date = new Date().toISOString().slice(0, 10)) {
      const existing = d.journal[s.id];
      const first = existing === undefined;
      const oldBest = existing?.best ?? 0;
      const record = first || size > oldBest;
      const entry: FishRecord = existing ?? { caught: 0, best: 0, first: date };
      entry.caught += 1;
      entry.best = Math.max(oldBest, size);
      d.journal[s.id] = entry;
      d.caught += 1;

      const card = d.cards.length < FISH.cardCap;
      if (card) d.cards.push({ id: s.id, size });
      save();
      return { first, record, card };
    },

    cardsFull: () => d.cards.length >= FISH.cardCap,

    sellCards() {
      let acorns = 0;
      for (const c of d.cards) {
        const sp = fishById(c.id);
        if (sp) acorns += catchValue(sp, c.size);
      }
      const count = d.cards.length;
      d.cards = [];
      d.sold += count;
      d.earned += acorns;
      save();
      return { count, acorns };
    },

    recordDerby(total) {
      if (total <= d.derbyBest) return false;
      d.derbyBest = total;
      save();
      return true;
    },

    speciesCaught: () => Object.values(d.journal).filter((e) => e !== undefined && e.caught > 0).length,

    grantAll() {
      d.rods = RODS.map((r) => r.id);
      if (!d.rods.includes(d.rod)) d.rod = 'twig';
      for (const b of BAITS) {
        if (b.id === DEFAULT_BAIT) continue;
        d.baits[b.id] = b.consumed ? (d.baits[b.id] ?? 0) + 20 : 1;
      }
      save();
    },
  };
}
