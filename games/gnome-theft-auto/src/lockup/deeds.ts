// The deeds: which estates (Hangar Two 'air', the Mossbank Boathouse 'water') the player has bought. Pure data + localStorage.
import { notifySaveChanged } from '../saveHook';
import { ESTATES } from './config';
import type { DeedStore, EstateKind, EstatesSave, LockupStorage, StorageKind } from './types';

/** localStorage when the browser exposes it and it is not blocked; null otherwise. */
function defaultStorage(): LockupStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

/** The owned flags read from storage. Never throws: anything unreadable means nothing owned. */
function loadOwned(storage: LockupStorage | null): Record<EstateKind, boolean> {
  const owned: Record<EstateKind, boolean> = { air: false, water: false };
  if (!storage) return owned;
  let parsed: unknown;
  try {
    const raw = storage.getItem(ESTATES.saveKey);
    if (raw === null) return owned;
    parsed = JSON.parse(raw);
  } catch {
    return owned;
  }
  if (!isObj(parsed) || parsed.v !== 1 || !isObj(parsed.owned)) return owned;
  const flags = parsed.owned;
  for (const kind of ['air', 'water'] as const) {
    if (flags[kind] === true) owned[kind] = true;
  }
  return owned;
}

export function createDeedStore(storage: LockupStorage | null = defaultStorage()): DeedStore {
  const owned = loadOwned(storage);
  const listeners = new Set<() => void>();

  /** Write the flags (when there is storage), tell the save hook, then call the listeners. */
  function persist(): void {
    if (storage) {
      try {
        const save: EstatesSave = { v: 1, owned: { air: owned.air, water: owned.water } };
        storage.setItem(ESTATES.saveKey, JSON.stringify(save));
        notifySaveChanged();
      } catch {
        // storage may be full or blocked: the change still holds this visit
      }
    }
    for (const cb of listeners) cb();
  }

  return {
    owns(kind: StorageKind): boolean {
      if (kind === 'ground') return true;
      return owned[kind];
    },

    grant(kind: EstateKind): boolean {
      if (owned[kind]) return false;
      owned[kind] = true;
      persist();
      return true;
    },

    revoke(kind: EstateKind): boolean {
      if (!owned[kind]) return false;
      owned[kind] = false;
      persist();
      return true;
    },

    onChange(cb: () => void): () => void {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
  };
}
