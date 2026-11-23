// Tuft hunting: the save. License, game bag, journal of species taken, lifetime sales. localStorage key HUNT_KEY
// (in GTA_SAVE_KEYS, so it rides the cloud save; newer side wins on merge).
import { notifySaveChanged } from '../saveHook';
import { HUNT, SPECIES, speciesById } from './species';
import type { HuntSpecies, SpeciesId } from './species';

export const HUNT_KEY = 'gta-hunting-v1';

export interface JournalEntry {
  /** Times combed. */
  taken: number;
  /** Keepsakes combed. */
  keepsakes: number;
  /** ISO date (YYYY-MM-DD) of the first comb. */
  first: string;
  /** Longest knock-down shot that led to a comb, units (0 = none recorded). */
  bestShot: number;
}

export interface HuntSaveData {
  v: 1;
  licensed: boolean;
  /** Bag item id (a tuft or keepsake id from species.ts) -> count. */
  bag: Record<string, number>;
  journal: Partial<Record<SpeciesId, JournalEntry>>;
  /** Items sold at the lodge, ever. */
  sold: number;
  /** Acorns earned at the lodge, ever. */
  earned: number;
}

export interface HuntItemInfo {
  id: string;
  name: string;
  price: number;
  color: number;
  kind: 'tuft' | 'keepsake';
  species: SpeciesId;
}

export interface HuntStore {
  data(): Readonly<HuntSaveData>;
  licensed(): boolean;
  /** Buys the license with `spend(HUNT.licensePrice)`; false when already licensed or spend returns false. */
  buyLicense(spend: (amount: number) => boolean): boolean;
  /** Items in the bag (sum of counts). */
  bagCount(): number;
  bagFull(): boolean;
  /** Acorns the bag would sell for now. */
  bagValue(): number;
  /** Record a comb. Full bag: nothing recorded, { added: false, firstOfSpecies: false }. */
  recordComb(species: HuntSpecies, keepsake: boolean, shotDist: number, now?: Date): { added: boolean; firstOfSpecies: boolean };
  /** Sell everything in the bag: empties it, adds to sold and earned, returns the Acorns and item count (caller pays). */
  sellAll(): { acorns: number; items: number };
  /** Species with taken > 0. */
  speciesTaken(): number;
}

export function emptyHuntSave(): HuntSaveData {
  return { v: 1, licensed: false, bag: {}, journal: {}, sold: 0, earned: 0 };
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
export function parseHuntSave(raw: string | null): HuntSaveData {
  if (!raw) return emptyHuntSave();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyHuntSave();
  }
  if (!isRecord(parsed)) return emptyHuntSave();

  const out = emptyHuntSave();
  out.licensed = parsed.licensed === true;

  if (isRecord(parsed.bag)) {
    for (const [id, count] of Object.entries(parsed.bag)) {
      if (itemInfo(id) && Number.isInteger(count) && (count as number) > 0) {
        out.bag[id] = count as number;
      }
    }
  }

  if (isRecord(parsed.journal)) {
    for (const [id, entry] of Object.entries(parsed.journal)) {
      if (!speciesById(id) || !isRecord(entry)) continue;
      if (
        !isNonNegInt(entry.taken) ||
        !isNonNegInt(entry.keepsakes) ||
        typeof entry.first !== 'string' ||
        !isNonNegNumber(entry.bestShot)
      ) {
        continue;
      }
      out.journal[id as SpeciesId] = {
        taken: entry.taken,
        keepsakes: entry.keepsakes,
        first: entry.first,
        bestShot: entry.bestShot,
      };
    }
  }

  if (isNonNegInt(parsed.sold)) out.sold = parsed.sold;
  if (isNonNegInt(parsed.earned)) out.earned = parsed.earned;
  return out;
}

export function itemInfo(id: string): HuntItemInfo | null {
  for (const s of SPECIES) {
    if (s.tuft.id === id) {
      return { id, name: s.tuft.name, price: s.tuft.price, color: s.tuft.color, kind: 'tuft', species: s.id };
    }
    if (s.keepsake.id === id) {
      return { id, name: s.keepsake.name, price: s.keepsake.price, color: s.keepsake.color, kind: 'keepsake', species: s.id };
    }
  }
  return null;
}

type HuntStorage = Pick<Storage, 'getItem' | 'setItem'>;

function resolveDefaultStorage(): HuntStorage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function loadData(storage: HuntStorage | undefined): HuntSaveData {
  if (!storage) return emptyHuntSave();
  try {
    return parseHuntSave(storage.getItem(HUNT_KEY));
  } catch {
    return emptyHuntSave();
  }
}

export function createHuntStore(storage?: Pick<Storage, 'getItem' | 'setItem'>): HuntStore {
  const store = storage ?? resolveDefaultStorage();
  const d = loadData(store);

  const persist = (): void => {
    if (!store) return;
    try {
      store.setItem(HUNT_KEY, JSON.stringify(d));
      notifySaveChanged();
    } catch {
      // Storage quota or private-mode access failure is non-fatal.
    }
  };

  const bagCount = (): number => Object.values(d.bag).reduce((sum, n) => sum + n, 0);

  const bagValue = (): number =>
    Object.entries(d.bag).reduce((sum, [id, n]) => sum + n * (itemInfo(id)?.price ?? 0), 0);

  return {
    data: () => d,
    licensed: () => d.licensed,

    buyLicense(spend) {
      if (d.licensed) return false;
      if (!spend(HUNT.licensePrice)) return false;
      d.licensed = true;
      persist();
      return true;
    },

    bagCount,
    bagFull: () => bagCount() >= HUNT.bagSize,
    bagValue,

    recordComb(species, keepsake, shotDist, now = new Date()) {
      if (bagCount() >= HUNT.bagSize) return { added: false, firstOfSpecies: false };

      d.bag[species.tuft.id] = (d.bag[species.tuft.id] ?? 0) + 1;
      let gotKeepsake = false;
      if (keepsake && bagCount() < HUNT.bagSize) {
        d.bag[species.keepsake.id] = (d.bag[species.keepsake.id] ?? 0) + 1;
        gotKeepsake = true;
      }

      const existing = d.journal[species.id];
      const firstOfSpecies = existing === undefined;
      const entry: JournalEntry = existing ?? {
        taken: 0,
        keepsakes: 0,
        first: now.toISOString().slice(0, 10),
        bestShot: 0,
      };
      entry.taken += 1;
      if (gotKeepsake) entry.keepsakes += 1;
      entry.bestShot = Math.max(entry.bestShot, Math.round(shotDist));
      d.journal[species.id] = entry;

      persist();
      return { added: true, firstOfSpecies };
    },

    sellAll() {
      const acorns = bagValue();
      const items = bagCount();
      d.bag = {};
      d.sold += items;
      d.earned += acorns;
      persist();
      return { acorns, items };
    },

    speciesTaken: () => Object.values(d.journal).filter((e) => e !== undefined && e.taken > 0).length,
  };
}
