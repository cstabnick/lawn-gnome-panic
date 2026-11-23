// What the player owns at Pay 'n' Glaze: one saved Loadout per vehicle model (VehicleKind), kept in this browser.
// Saved as one JSON object under GLAZE_SAVE_KEY: { [kind]: encodeLoadout code }. Blocked storage or a corrupt save gives an empty store.
import { decodeLoadout, encodeLoadout, normalizeLoadout, type Loadout } from '@lawn/glaze';
import type { VehicleKind } from './types';
import { notifySaveChanged } from './saveHook';

/** The vehicle models Pay 'n' Glaze can dress: the ground vehicles (no flyers, no boats). */
export const GLAZE_KINDS: readonly VehicleKind[] = [
  'push-bike', 'ride-on', 'zero-turn', 'combine', 'lowrider', 'boot-float', 'snail-coach', 'mulch-spreader', 'hoa-van',
];

/** The localStorage key the owned loadouts live under (also exported by the save bundle, see saveIO.ts). */
export const GLAZE_SAVE_KEY = 'gta-glaze-v1';

interface GlazeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const owned = new Map<VehicleKind, Loadout>();
const listeners = new Set<(kind: VehicleKind) => void>();

function defaultStorage(): GlazeStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

let backend: GlazeStorage | null = defaultStorage();

function isGlazeKind(kind: string): kind is VehicleKind {
  return (GLAZE_KINDS as readonly string[]).includes(kind);
}

/** Fill `owned` from the backend. Never throws: unreadable or garbage data leaves the store empty for that part. */
function load(): void {
  owned.clear();
  if (!backend) return;
  let parsed: unknown;
  try {
    const raw = backend.getItem(GLAZE_SAVE_KEY);
    if (raw === null) return;
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
  for (const [kind, code] of Object.entries(parsed as Record<string, unknown>)) {
    if (!isGlazeKind(kind) || typeof code !== 'string') continue;
    const l = decodeLoadout(code);
    if (l) owned.set(kind, l);
  }
}

/** Write `owned` to the backend. Storage may be blocked: a failed write is ignored (the change still holds this visit). */
function persist(): void {
  if (!backend) return;
  const out: Partial<Record<VehicleKind, string>> = {};
  for (const [kind, l] of owned) out[kind] = encodeLoadout(l);
  try {
    backend.setItem(GLAZE_SAVE_KEY, JSON.stringify(out));
    notifySaveChanged();
  } catch {
    // storage may be full or blocked
  }
}

load();

/** The saved loadout for a vehicle model, or null when the player never bought anything for it. */
export function ownedLoadout(kind: VehicleKind): Loadout | null {
  return owned.get(kind) ?? null;
}

/** Save (and normalise) the loadout the player now owns for a model. */
export function saveOwnedLoadout(kind: VehicleKind, l: Loadout): void {
  owned.set(kind, normalizeLoadout(l));
  persist();
  for (const cb of listeners) cb(kind);
}

export function clearOwnedLoadout(kind: VehicleKind): void {
  owned.delete(kind);
  persist();
  for (const cb of listeners) cb(kind);
}

/** Be told when a model's owned loadout changes. Returns the unsubscribe function. */
export function onOwnedChange(cb: (kind: VehicleKind) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Tests only: swap the storage backend (null = none) and reload from it, so tests need no localStorage. */
export function glazeStorageForTest(s: GlazeStorage | null): void {
  backend = s;
  load();
}
