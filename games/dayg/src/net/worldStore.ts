// Persistent player-owned world index and local snapshot storage (localStorage).
import type { Snapshot } from './protocol';
import { fromBase64, packSnapshot, toBase64, unpackSnapshot } from './snapshot';

export interface OwnedWorldMeta {
  code: string;
  title: string;
  owner: string;
  seed: number;
  day: number;
  lootRespawn: boolean;
  updatedAt: string;
}

const INDEX_KEY = 'dayg_owned_worlds_v1';
const SNAP_PREFIX = 'dayg_world_snap_';

function readIndex(): OwnedWorldMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(list: OwnedWorldMeta[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota / private-mode errors.
  }
}

export function listOwnedWorlds(): OwnedWorldMeta[] {
  return readIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertOwnedWorld(meta: OwnedWorldMeta): void {
  const list = readIndex().filter((w) => w.code !== meta.code);
  list.unshift(meta);
  writeIndex(list.slice(0, 20));
}

export function removeOwnedWorld(code: string): void {
  writeIndex(readIndex().filter((w) => w.code !== code));
  try { localStorage.removeItem(`${SNAP_PREFIX}${code}`); } catch { /* ignore */ }
}

export async function saveLocalWorldSnapshot(code: string, snap: Snapshot): Promise<boolean> {
  try {
    const bytes = await packSnapshot(snap);
    const b64 = toBase64(bytes);
    localStorage.setItem(`${SNAP_PREFIX}${code}`, b64);
    return true;
  } catch {
    return false;
  }
}

export async function loadLocalWorldSnapshot(code: string): Promise<Snapshot | null> {
  try {
    const b64 = localStorage.getItem(`${SNAP_PREFIX}${code}`);
    if (!b64) return null;
    const bytes = fromBase64(b64);
    return await unpackSnapshot(bytes);
  } catch {
    return null;
  }
}
