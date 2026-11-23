// What the player owns and has fitted at Ammu-Gnation, per weapon, kept in this browser.
// Saved as one JSON object under GUNMOD_SAVE_KEY: { owned: { [gun]: modId[] }, fitted: { [gun]: encodeGunLoadout code } }.
// Blocked storage or a corrupt save gives an empty store (every gun stock, nothing owned).
import { GUN_ORDER } from './config';
import { decodeGunLoadout, encodeGunLoadout, getMod, modFits, normalizeGunLoadout, type GunLoadout } from './gunMods';
import type { GunKind } from './types';

/** The localStorage key (also exported by the save bundle, see saveIO.ts). */
export const GUNMOD_SAVE_KEY = 'gta-gunmods-v1';

interface ModStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const owned = new Map<GunKind, Set<string>>();
const fitted = new Map<GunKind, GunLoadout>();
const listeners = new Set<(gun: GunKind) => void>();

function defaultStorage(): ModStorage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

let backend: ModStorage | null = defaultStorage();

const isGun = (k: string): k is GunKind => (GUN_ORDER as readonly string[]).includes(k);

function load(): void {
  owned.clear();
  fitted.clear();
  if (!backend) return;
  let parsed: unknown;
  try {
    const raw = backend.getItem(GUNMOD_SAVE_KEY);
    if (raw === null) return;
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;
  const o = parsed as { owned?: unknown; fitted?: unknown };
  if (o.owned && typeof o.owned === 'object') {
    for (const [gun, ids] of Object.entries(o.owned as Record<string, unknown>)) {
      if (!isGun(gun) || !Array.isArray(ids)) continue;
      const set = new Set<string>();
      for (const id of ids) {
        const m = typeof id === 'string' ? getMod(id) : undefined;
        if (m && modFits(m, gun)) set.add(m.id);
      }
      if (set.size) owned.set(gun, set);
    }
  }
  if (o.fitted && typeof o.fitted === 'object') {
    for (const [gun, code] of Object.entries(o.fitted as Record<string, unknown>)) {
      if (!isGun(gun) || typeof code !== 'string') continue;
      const l = keepOwned(gun, normalizeGunLoadout(gun, decodeGunLoadout(code)));
      if (Object.keys(l).length) fitted.set(gun, l);
    }
  }
}

function persist(): void {
  if (!backend) return;
  const out: { owned: Partial<Record<GunKind, string[]>>; fitted: Partial<Record<GunKind, string>> } = { owned: {}, fitted: {} };
  for (const [gun, set] of owned) out.owned[gun] = [...set];
  for (const [gun, l] of fitted) out.fitted[gun] = encodeGunLoadout(l);
  try {
    backend.setItem(GUNMOD_SAVE_KEY, JSON.stringify(out));
  } catch {
    // storage may be full or blocked: the change still holds for this visit
  }
}

/** Only the mods the player owns for this gun. */
function keepOwned(gun: GunKind, l: GunLoadout): GunLoadout {
  const have = owned.get(gun);
  const out: GunLoadout = {};
  for (const [slot, id] of Object.entries(l) as [keyof GunLoadout, string][]) if (have?.has(id)) out[slot] = id;
  return out;
}

function notify(gun: GunKind): void {
  for (const cb of listeners) cb(gun);
}

load();

/** The mod ids the player has bought for this gun. */
export function ownedMods(gun: GunKind): ReadonlySet<string> {
  return owned.get(gun) ?? new Set<string>();
}

/** The mods fitted on this gun now (a fresh object; empty = stock). */
export function fittedLoadout(gun: GunKind): GunLoadout {
  return { ...(fitted.get(gun) ?? {}) };
}

/** Record mods as bought for this gun (ids that do not fit the gun are ignored). Does not fit them. */
export function buyMods(gun: GunKind, ids: readonly string[]): void {
  const set = owned.get(gun) ?? new Set<string>();
  for (const id of ids) {
    const m = getMod(id);
    if (m && modFits(m, gun)) set.add(m.id);
  }
  owned.set(gun, set);
  persist();
  notify(gun);
}

/** Fit a loadout on this gun. Mods the player does not own are dropped. */
export function fitLoadout(gun: GunKind, l: GunLoadout): void {
  const clean = keepOwned(gun, normalizeGunLoadout(gun, l));
  if (Object.keys(clean).length) fitted.set(gun, clean);
  else fitted.delete(gun);
  persist();
  notify(gun);
}

/** Be told when a gun's owned or fitted mods change. Returns the unsubscribe function. */
export function onGunModsChange(cb: (gun: GunKind) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** Tests only: swap the storage backend (null = none) and reload from it. */
export function gunModStorageForTest(s: ModStorage | null): void {
  backend = s;
  load();
}
