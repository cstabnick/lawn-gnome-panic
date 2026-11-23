// The saved list of owned vehicles per storage kind (the Lock-Up's 5 slots, later a hangar and a boathouse). Pure data +
// localStorage; no three.js, no DOM. Loading never throws: garbage or bad records are dropped quietly.
import { notifySaveChanged } from '../saveHook';
import { LOCKUP } from './config';
import { STORAGE_KINDS, type LockupStorage, type LockupStore, type StorageKind, type StoredVehicle, type VehicleSnapshot } from './types';

/** A fresh unique id: 'lk-' + now in base36 + '-' + 4 base36 chars from rand. */
export function newUid(now: number, rand: () => number): string {
  return `lk-${now.toString(36)}-${Math.floor(rand() * 36 ** 4).toString(36).padStart(4, '0')}`;
}

/** localStorage when the browser exposes it and it is not blocked; null otherwise. */
function defaultStorage(): LockupStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

type Slots = Record<StorageKind, StoredVehicle[]>;

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

function finite(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

/** hp clamped to (0, 1]: zero or less becomes 0.05 (a wreck that still runs). */
function clampHp(hp: number): number {
  return hp <= 0 ? 0.05 : Math.min(1, hp);
}

/** A record copied field by field, or null when any field is wrong. */
function validRecord(rec: unknown): StoredVehicle | null {
  if (!isObj(rec)) return null;
  const { uid, kind, variant, name, tint, look, hp, enginePitch, storedAt } = rec;
  if (typeof uid !== 'string' || uid === '') return null;
  if (typeof kind !== 'string') return null;
  if (!(variant === null || typeof variant === 'string')) return null;
  if (typeof name !== 'string') return null;
  if (!finite(tint) || !finite(hp) || !finite(storedAt)) return null;
  if (!(look === null || typeof look === 'string')) return null;
  if (!(enginePitch === null || finite(enginePitch))) return null;
  return {
    uid,
    kind: kind as StoredVehicle['kind'],
    variant,
    name,
    tint,
    look,
    hp: clampHp(hp),
    enginePitch,
    storedAt,
  };
}

function emptySlots(): Slots {
  return { ground: [], air: [], water: [] };
}

/** Read the saved slots. Never throws: unreadable data gives empty slots, bad records are skipped. */
function loadSlots(storage: LockupStorage | null, capacity: Record<StorageKind, number>): Slots {
  const slots = emptySlots();
  if (!storage) return slots;
  let parsed: unknown;
  try {
    const raw = storage.getItem(LOCKUP.saveKey);
    if (raw === null) return slots;
    parsed = JSON.parse(raw);
  } catch {
    return slots;
  }
  if (!isObj(parsed) || parsed.v !== 1 || !isObj(parsed.slots)) return slots;
  const seen = new Set<string>();
  for (const kind of STORAGE_KINDS) {
    const arr = parsed.slots[kind];
    if (!Array.isArray(arr)) continue;
    for (const rec of arr) {
      if (slots[kind].length >= (capacity[kind] ?? 0)) break;
      const v = validRecord(rec);
      if (!v || seen.has(v.uid)) continue;
      seen.add(v.uid);
      slots[kind].push(v);
    }
  }
  return slots;
}

/** The snapshot fields of a record (everything except uid and storedAt), picked so stray fields never get saved. */
function snapOf(s: VehicleSnapshot): VehicleSnapshot {
  return {
    kind: s.kind,
    variant: s.variant,
    name: s.name,
    tint: s.tint,
    look: s.look,
    hp: clampHp(s.hp),
    enginePitch: s.enginePitch,
  };
}

function sameSnap(rec: StoredVehicle, s: VehicleSnapshot): boolean {
  return rec.kind === s.kind && rec.variant === s.variant && rec.name === s.name && rec.tint === s.tint
    && rec.look === s.look && rec.hp === s.hp && rec.enginePitch === s.enginePitch;
}

export function createLockupStore(
  storage: LockupStorage | null = defaultStorage(),
  capacity: Record<StorageKind, number> = LOCKUP.capacity,
  now: () => number = Date.now,
  rand: () => number = Math.random,
): LockupStore {
  const slots = loadSlots(storage, capacity);
  const listeners = new Set<() => void>();

  const cap = (kind: StorageKind): number => capacity[kind] ?? 0;
  const arr = (kind: StorageKind): StoredVehicle[] => slots[kind] ?? [];
  const freeOf = (kind: StorageKind): number => Math.max(0, cap(kind) - arr(kind).length);

  function find(uid: string): { kind: StorageKind; index: number; rec: StoredVehicle } | null {
    for (const kind of STORAGE_KINDS) {
      const index = arr(kind).findIndex((r) => r.uid === uid);
      if (index >= 0) return { kind, index, rec: arr(kind)[index] };
    }
    return null;
  }

  /** Write the slots (when there is storage), tell the save hook, then call the listeners. */
  function persist(): void {
    if (storage) {
      try {
        storage.setItem(LOCKUP.saveKey, JSON.stringify({ v: 1, slots }));
        notifySaveChanged();
      } catch {
        // storage may be full or blocked: the change still holds this visit
      }
    }
    for (const cb of listeners) cb();
  }

  return {
    list(kind?: StorageKind): readonly StoredVehicle[] {
      const kinds = kind === undefined ? STORAGE_KINDS : [kind];
      return kinds.flatMap((k) => arr(k).map((r) => ({ ...r })));
    },

    get(uid: string): StoredVehicle | null {
      const f = find(uid);
      return f ? { ...f.rec } : null;
    },

    kindOf(uid: string): StorageKind | null {
      return find(uid)?.kind ?? null;
    },

    capacity: (kind: StorageKind): number => cap(kind),

    free: (kind: StorageKind): number => freeOf(kind),

    add(snap: VehicleSnapshot, kind: StorageKind): StoredVehicle | null {
      if (freeOf(kind) === 0) return null;
      const t = now();
      let uid = newUid(t, rand);
      while (find(uid)) uid = newUid(t, rand);
      const rec: StoredVehicle = { ...snapOf(snap), uid, storedAt: t };
      arr(kind).push(rec);
      persist();
      return { ...rec };
    },

    update(uid: string, snap: VehicleSnapshot): boolean {
      const f = find(uid);
      if (!f) return false;
      const next = snapOf(snap);
      if (sameSnap(f.rec, next)) return true;
      Object.assign(f.rec, next);
      persist();
      return true;
    },

    remove(uid: string): StoredVehicle | null {
      const f = find(uid);
      if (!f) return null;
      arr(f.kind).splice(f.index, 1);
      persist();
      return { ...f.rec };
    },

    onChange(cb: () => void): () => void {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
}
