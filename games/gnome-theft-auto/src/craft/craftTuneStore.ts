// The tuning the player owns per boat / aircraft model: one JSON object { [kind]: CraftTune } under CRAFT_TUNE_KEY, kept in
// this browser (and carried by the cloud save via saveHook). Blocked storage or a corrupt save gives an empty store.
import type { CraftTune } from './model';
import type { VehicleKind } from '../types';
import { VEHICLES } from '../config';
import { notifySaveChanged } from '../saveHook';
import { NO_TUNE, clampTune } from './tuning';

export const CRAFT_TUNE_KEY = 'gta-craft-tune-v1';

export interface TuneStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

const owned = new Map<VehicleKind, CraftTune>();
const listeners = new Set<(kind: VehicleKind) => void>();

function defaultStorage(): TuneStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

let backend: TuneStorage | null = defaultStorage();

function isTuneKind(kind: string): kind is VehicleKind {
  return Object.prototype.hasOwnProperty.call(VEHICLES, kind);
}

function isZeroTune(t: CraftTune): boolean {
  return t.engine === 0 && t.topSpeed === 0 && t.handling === 0 && t.lift === 0;
}

/** Fill `owned` from the backend. Never throws: unreadable or garbage data leaves the store empty for that part. */
function load(): void {
  owned.clear();
  if (!backend) return;
  let parsed: unknown;
  try {
    const raw = backend.getItem(CRAFT_TUNE_KEY);
    if (raw === null) return;
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
  for (const [kind, t] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isTuneKind(kind) || !t || typeof t !== 'object') continue;
    const c = clampTune(t);
    if (!isZeroTune(c)) owned.set(kind, c);
  }
}

/** Write `owned` to the backend. Storage may be blocked: a failed write is ignored (the change still holds this visit). */
function persist(): void {
  if (!backend) return;
  const out: Partial<Record<VehicleKind, CraftTune>> = {};
  for (const [kind, t] of owned) out[kind] = { ...t };
  try {
    backend.setItem(CRAFT_TUNE_KEY, JSON.stringify(out));
    notifySaveChanged();
  } catch {
    // storage may be full or blocked
  }
}

load();

/** The owned tune for a boat or aircraft model (a copy; stock when none is saved). */
export function getCraftTune(kind: VehicleKind): CraftTune {
  const t = owned.get(kind);
  return t ? { ...t } : { ...NO_TUNE };
}

/** Save the tune the player now owns for a model. All stock deletes the entry. */
export function saveCraftTune(kind: VehicleKind, t: CraftTune): void {
  const c = clampTune(t);
  if (isZeroTune(c)) owned.delete(kind);
  else owned.set(kind, c);
  persist();
  for (const cb of listeners) cb(kind);
}

/** Be told when a model's owned tune changes. Returns the unsubscribe function. */
export function onCraftTuneChange(cb: (kind: VehicleKind) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Tests only: swap the storage backend (null = none) and reload from it, so tests need no localStorage. */
export function craftTuneStorageForTest(s: TuneStorage | null): void {
  backend = s;
  load();
}
