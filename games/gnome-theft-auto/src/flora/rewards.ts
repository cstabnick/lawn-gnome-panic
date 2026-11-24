// Mowing progress: the Mowed total (and per kind), Lawn Service on a mower, the two mowing achievements (fed in batches),
// and the save (key 'gta-mowing-v1'). record() and update() run every mow / frame: no allocation there.
import type { StorageLike } from '../saveIO';
import { notifySaveChanged } from '../saveHook';
import { FLORA } from './kinds';

export const MOW_SAVE_KEY = 'gta-mowing-v1';

export interface MowSave {
  v: 1;
  /** Plants mowed, all kinds. */
  total: number;
  /** Long-grass cuts made on a mower (Lawn Service counts these). */
  lawn: number;
  /** Plants mowed by prefab id. */
  byKind: Record<string, number>;
}

export function emptyMowSave(): MowSave {
  return { v: 1, total: 0, lawn: 0, byKind: {} };
}

/** A saved count: a finite number >= 0, floored; anything else is null. */
function count(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : null;
}

/** Tolerant parse: broken JSON gives the empty save; a broken field is dropped to 0 / omitted. */
export function parseMowSave(raw: string | null): MowSave {
  if (raw === null) return emptyMowSave();
  let o: unknown;
  try {
    o = JSON.parse(raw);
  } catch {
    return emptyMowSave();
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return emptyMowSave();
  const r = o as Record<string, unknown>;
  const s = emptyMowSave();
  const total = count(r.total);
  if (total !== null) s.total = total;
  const lawn = count(r.lawn);
  if (lawn !== null) s.lawn = lawn;
  const bk = r.byKind;
  if (bk && typeof bk === 'object' && !Array.isArray(bk)) {
    for (const [k, v] of Object.entries(bk as Record<string, unknown>)) {
      const n = count(v);
      if (n !== null && k !== '__proto__') s.byKind[k] = n;
    }
  }
  return s;
}

/** cloudSave.ts merge: per-field maximum of two saved texts. */
export function mergeMowSave(a: string, b: string): string {
  const pa = parseMowSave(a);
  const pb = parseMowSave(b);
  const merged = emptyMowSave();
  merged.total = Math.max(pa.total, pb.total);
  merged.lawn = Math.max(pa.lawn, pb.lawn);
  for (const k of Object.keys(pa.byKind)) merged.byKind[k] = pa.byKind[k];
  for (const k of Object.keys(pb.byKind)) merged.byKind[k] = Math.max(merged.byKind[k] ?? 0, pb.byKind[k]);
  return JSON.stringify(merged);
}

export interface MowRewardsDeps {
  increment(id: string, by?: number): void;
  earn(amount: number, reason?: string): void;
  toast(text: string, ms?: number): void;
  storage?: StorageLike | null;
}
export interface MowRewards {
  /** The player mowed one plant of prefab `kindId`. */
  record(kindId: string, longGrass: boolean, onMower: boolean): void;
  update(dt: number): void;
  save(): Readonly<MowSave>;
  reset(): void;
}

/** Seconds between achievement flushes, and between save writes once dirty. */
const ACH_EVERY = 2;
const SAVE_EVERY = 5;

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function createMowRewards(deps: MowRewardsDeps): MowRewards {
  const storage: StorageLike | null = deps.storage !== undefined ? deps.storage : defaultStorage();

  let save: MowSave = emptyMowSave();
  if (storage) {
    try {
      save = parseMowSave(storage.getItem(MOW_SAVE_KEY));
    } catch {
      save = emptyMowSave();
    }
  }
  // The first-mow toast is shown once ever: a save that already has mows counts as seen.
  let toasted = save.total > 0;

  let run = 0;
  let pending = 0;
  let dirty = false;
  let achTimer = 0;
  let sinceWrite = 0;

  function write(): void {
    dirty = false;
    sinceWrite = 0;
    if (!storage) return;
    try {
      storage.setItem(MOW_SAVE_KEY, JSON.stringify(save));
      notifySaveChanged();
    } catch {
      // a full or blocked localStorage must not break play
    }
  }

  return {
    record(kindId, longGrass, onMower) {
      save.total += 1;
      save.byKind[kindId] = (save.byKind[kindId] ?? 0) + 1;
      pending += 1;
      dirty = true;
      if (!toasted) {
        toasted = true;
        deps.toast('Mowed! Plants grow back in a minute or two.', 3500);
      }
      if (longGrass && onMower) {
        save.lawn += 1;
        run += 1;
        if (run >= FLORA.lawn.every) {
          run = 0;
          deps.earn(FLORA.lawn.pay, 'Lawn Service');
          deps.toast(`Lawn Service: +${FLORA.lawn.pay} Acorns`, 2500);
        }
      }
    },
    update(dt) {
      achTimer += dt;
      if (achTimer >= ACH_EVERY) {
        achTimer = 0;
        if (pending > 0) {
          deps.increment(FLORA.achievements.shortBack, pending);
          deps.increment(FLORA.achievements.groundskeeper, pending);
          pending = 0;
        }
      }
      sinceWrite += dt;
      if (dirty && sinceWrite >= SAVE_EVERY) write();
    },
    save() {
      return save;
    },
    reset() {
      save = emptyMowSave();
      pending = 0;
      run = 0;
      write();
    },
  };
}
