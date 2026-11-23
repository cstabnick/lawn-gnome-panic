// Birding: the save. localStorage key BIRD_KEY, in GTA_SAVE_KEYS (cloud save).
import { notifySaveChanged } from '../saveHook';
import { MILESTONES, OPTICS } from './types';
import type { BirdSaveData, BirdSighting, Milestone } from './types';

export const BIRD_KEY = 'gta-birding-v1';

export interface BirdStore {
  data(): Readonly<BirdSaveData>;
  hasSeen(id: string): boolean;
  hasHeard(id: string): boolean;
  hasPhoto(id: string): boolean;
  seenCount(): number;
  photoCount(): number;
  /** Count a sighting. True when it is the first of this species. */
  markSeen(id: string, now?: Date): boolean;
  /** True when newly heard. */
  markHeard(id: string): boolean;
  /** True when the first photo of this species. */
  markPhoto(id: string): boolean;
  optics(): number;
  setOptics(index: number): void;
  /** Milestones reached and not yet claimed (`total` = species in the table, for the count-0 milestone). */
  claimable(total: number): readonly Milestone[];
  /** Marks every claimable milestone claimed; returns their Acorns (the caller pays). */
  claim(total: number): number;
}

export function emptyBirdSave(): BirdSaveData {
  return { v: 1, seen: {}, heard: [], photos: [], claimed: 0, optics: 0 };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonNegInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

/** Non-empty strings only, deduplicated and sorted. */
function cleanIdList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const set = new Set<string>();
  for (const item of v) {
    if (typeof item === 'string' && item.length > 0) set.add(item);
  }
  return [...set].sort();
}

/** Tolerant parse: anything broken is dropped. */
export function parseBirdSave(raw: string | null): BirdSaveData {
  if (!raw) return emptyBirdSave();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyBirdSave();
  }
  if (!isRecord(parsed)) return emptyBirdSave();

  const out = emptyBirdSave();

  if (isRecord(parsed.seen)) {
    for (const [id, entry] of Object.entries(parsed.seen)) {
      if (id.length === 0 || !isRecord(entry)) continue;
      if (typeof entry.first !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.first)) continue;
      if (!isNonNegInt(entry.count) || entry.count < 1) continue;
      out.seen[id] = { first: entry.first, count: entry.count };
    }
  }

  out.heard = cleanIdList(parsed.heard);
  out.photos = cleanIdList(parsed.photos);
  out.claimed = isNonNegInt(parsed.claimed) && parsed.claimed <= MILESTONES.length ? parsed.claimed : 0;
  out.optics = isNonNegInt(parsed.optics) && parsed.optics <= OPTICS.length - 1 ? parsed.optics : 0;
  return out;
}

function sortedSeen(seen: Record<string, BirdSighting>): Record<string, BirdSighting> {
  const out: Record<string, BirdSighting> = {};
  for (const key of Object.keys(seen).sort()) {
    const s = seen[key];
    out[key] = { first: s.first, count: s.count };
  }
  return out;
}

/** Cloud merge of two saved texts: union of seen (earliest first date, larger count), heard and photos; max claimed and optics. */
export function mergeBirdSaves(a: string, b: string): string {
  const x = parseBirdSave(a);
  const y = parseBirdSave(b);

  const seen: Record<string, BirdSighting> = { ...x.seen };
  for (const [id, s] of Object.entries(y.seen)) {
    const mine = seen[id];
    if (!mine) {
      seen[id] = { first: s.first, count: s.count };
    } else {
      seen[id] = {
        first: s.first < mine.first ? s.first : mine.first,
        count: Math.max(s.count, mine.count),
      };
    }
  }

  const heard = [...new Set([...x.heard, ...y.heard])].sort();
  const photos = [...new Set([...x.photos, ...y.photos])].sort();

  // Fixed key order so merge(a, b) and merge(b, a) produce the same text.
  return JSON.stringify({
    v: 1,
    seen: sortedSeen(seen),
    heard,
    photos,
    claimed: Math.max(x.claimed, y.claimed),
    optics: Math.max(x.optics, y.optics),
  });
}

type BirdStorage = Pick<Storage, 'getItem' | 'setItem'>;

function resolveDefaultStorage(): BirdStorage {
  try {
    if (globalThis.localStorage) return globalThis.localStorage;
  } catch {
    // no storage here: fall through to memory
  }
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

function loadData(storage: BirdStorage): BirdSaveData {
  try {
    return parseBirdSave(storage.getItem(BIRD_KEY));
  } catch {
    return emptyBirdSave();
  }
}

function insertSorted(list: string[], id: string): void {
  let i = 0;
  while (i < list.length && list[i] < id) i++;
  list.splice(i, 0, id);
}

export function createBirdStore(storage?: Pick<Storage, 'getItem' | 'setItem'>): BirdStore {
  const store = storage ?? resolveDefaultStorage();
  const d = loadData(store);

  const persist = (): void => {
    try {
      store.setItem(BIRD_KEY, JSON.stringify(d));
      notifySaveChanged();
    } catch {
      // Storage quota or private-mode failure is non-fatal.
    }
  };

  const seenCount = (): number => Object.keys(d.seen).length;

  const claimable = (total: number): Milestone[] => {
    const out: Milestone[] = [];
    const seen = seenCount();
    for (let i = d.claimed; i < MILESTONES.length; i++) {
      const m = MILESTONES[i];
      const need = m.count === 0 ? total : m.count;
      if (seen < need) break;
      out.push(m);
    }
    return out;
  };

  return {
    data: () => d,
    hasSeen: (id) => Object.prototype.hasOwnProperty.call(d.seen, id),
    hasHeard: (id) => d.heard.includes(id),
    hasPhoto: (id) => d.photos.includes(id),
    seenCount,
    photoCount: () => d.photos.length,

    markSeen(id, now = new Date()) {
      const existing = Object.prototype.hasOwnProperty.call(d.seen, id) ? d.seen[id] : undefined;
      if (existing) {
        existing.count += 1;
        persist();
        return false;
      }
      d.seen[id] = { first: now.toISOString().slice(0, 10), count: 1 };
      persist();
      return true;
    },

    markHeard(id) {
      if (d.heard.includes(id)) return false;
      insertSorted(d.heard, id);
      persist();
      return true;
    },

    markPhoto(id) {
      if (d.photos.includes(id)) return false;
      insertSorted(d.photos, id);
      persist();
      return true;
    },

    optics: () => d.optics,

    setOptics(index) {
      d.optics = Math.max(d.optics, index);
      persist();
    },

    claimable,

    claim(total) {
      const due = claimable(total);
      if (due.length === 0) return 0;
      const acorns = due.reduce((sum, m) => sum + m.acorns, 0);
      d.claimed += due.length;
      persist();
      return acorns;
    },
  };
}
