// Pebblewick's save (key 'gta-outskirts-v1'): arrived yet, the counters bought from, souvenirs, wishes in the well,
// the jackpot and the night knock. Tolerant parse like fishing/fishSave.ts: broken fields are dropped. Everything here
// only grows, so the cloud merge (mergeOutskirtsSaves) is a union.
import { notifySaveChanged } from '../saveHook';
import type { CounterId } from './town';

export const OUTSKIRTS_KEY = 'gta-outskirts-v1';

export interface OutskirtsSave {
  v: 1;
  /** The player has arrived in Pebblewick at least once ("Pop. 32"). */
  visited: boolean;
  /** Counters bought from at least once. */
  shops: CounterId[];
  /** Souvenir ids bought at Twine's General. */
  souvenirs: string[];
  /** Acorns tossed in the wishing well, lifetime. */
  wished: number;
  /** The wishing well has paid out its jackpot at least once. */
  wellJackpot: boolean;
  /** Knocked on the Old Chrome Combine at night. */
  knocked: boolean;
}

export interface OutskirtsStore {
  get(): Readonly<OutskirtsSave>;
  /** True the first time (it was not visited before). */
  markVisited(): boolean;
  /** True when this counter is new to the list. */
  markShop(id: CounterId): boolean;
  /** True when the souvenir is new. */
  addSouvenir(id: string): boolean;
  hasSouvenir(id: string): boolean;
  /** Count one Acorn wished; returns the lifetime count. */
  addWish(): number;
  /** True the first time. */
  markJackpot(): boolean;
  /** True the first time. */
  markKnocked(): boolean;
}

const COUNTER_IDS: readonly CounterId[] = ['store', 'diner', 'workshop'];

export function emptyOutskirtsSave(): OutskirtsSave {
  return { v: 1, visited: false, shops: [], souvenirs: [], wished: 0, wellJackpot: false, knocked: false };
}

function uniq<T>(list: readonly T[]): T[] {
  return [...new Set(list)];
}

export function parseOutskirtsSave(raw: string | null): OutskirtsSave {
  if (!raw) return emptyOutskirtsSave();
  let p: unknown;
  try {
    p = JSON.parse(raw);
  } catch {
    return emptyOutskirtsSave();
  }
  if (!p || typeof p !== 'object' || (p as { v?: unknown }).v !== 1) return emptyOutskirtsSave();
  const o = p as Record<string, unknown>;
  const out = emptyOutskirtsSave();
  out.visited = o.visited === true;
  if (Array.isArray(o.shops)) out.shops = uniq(o.shops.filter((s): s is CounterId => COUNTER_IDS.includes(s as CounterId)));
  if (Array.isArray(o.souvenirs)) out.souvenirs = uniq(o.souvenirs.filter((s): s is string => typeof s === 'string' && s.length > 0));
  if (typeof o.wished === 'number' && Number.isFinite(o.wished) && o.wished >= 0) out.wished = Math.floor(o.wished);
  out.wellJackpot = o.wellJackpot === true;
  out.knocked = o.knocked === true;
  return out;
}

/** Cloud merge: union of the lists (sorted), OR of the flags, the larger wish count. Symmetric and idempotent. */
export function mergeOutskirtsSaves(a: string, b: string): string {
  const x = parseOutskirtsSave(a);
  const y = parseOutskirtsSave(b);
  const m: OutskirtsSave = {
    v: 1,
    visited: x.visited || y.visited,
    shops: uniq([...x.shops, ...y.shops]).sort(),
    souvenirs: uniq([...x.souvenirs, ...y.souvenirs]).sort(),
    wished: Math.max(x.wished, y.wished),
    wellJackpot: x.wellJackpot || y.wellJackpot,
    knocked: x.knocked || y.knocked,
  };
  return JSON.stringify(m);
}

type Storage2 = Pick<Storage, 'getItem' | 'setItem'>;

function memoryStorage(): Storage2 {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); } };
}

export function createOutskirtsStore(storage?: Storage2): OutskirtsStore {
  const st: Storage2 = storage ?? (typeof localStorage !== 'undefined' ? localStorage : memoryStorage());
  let s: OutskirtsSave;
  try {
    s = parseOutskirtsSave(st.getItem(OUTSKIRTS_KEY));
  } catch {
    s = emptyOutskirtsSave();
  }
  const write = (): void => {
    try {
      st.setItem(OUTSKIRTS_KEY, JSON.stringify(s));
    } catch {
      // storage full or blocked: keep playing
    }
    notifySaveChanged();
  };
  const flag = (k: 'visited' | 'wellJackpot' | 'knocked'): boolean => {
    if (s[k]) return false;
    s[k] = true;
    write();
    return true;
  };
  return {
    get: () => s,
    markVisited: () => flag('visited'),
    markShop(id) {
      if (s.shops.includes(id)) return false;
      s.shops.push(id);
      write();
      return true;
    },
    addSouvenir(id) {
      if (s.souvenirs.includes(id)) return false;
      s.souvenirs.push(id);
      write();
      return true;
    },
    hasSouvenir: (id) => s.souvenirs.includes(id),
    addWish() {
      s.wished += 1;
      write();
      return s.wished;
    },
    markJackpot: () => flag('wellJackpot'),
    markKnocked: () => flag('knocked'),
  };
}
