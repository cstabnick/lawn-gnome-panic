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
  lootRespawnInterval?: '1d' | '3d' | '5d' | '7d';
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

export function exportWorldJson(code: string): string | null {
  const meta = readIndex().find((w) => w.code === code) ?? null;
  let snapshotB64: string | null = null;
  try {
    snapshotB64 = localStorage.getItem(`${SNAP_PREFIX}${code}`);
  } catch {
    snapshotB64 = null;
  }
  if (!meta && !snapshotB64) return null;
  return JSON.stringify({ version: 1, meta, snapshotB64 }, null, 2);
}

export function importWorldJson(json: string): OwnedWorldMeta | null {
  try {
    const parsed = JSON.parse(json) as {
      version?: number;
      meta?: Partial<OwnedWorldMeta> | null;
      snapshotB64?: string | null;
    };
    if (!parsed || typeof parsed !== 'object' || !parsed.meta) {
      return null;
    }
    const raw = parsed.meta;
    if (typeof raw.code !== 'string') return null;
    const code = raw.code.trim().toUpperCase().slice(0, 16);
    if (!code) return null;
    const meta: OwnedWorldMeta = {
      code,
      title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 60) : 'Imported World',
      owner: typeof raw.owner === 'string' && raw.owner.trim() ? raw.owner.trim() : 'Survivor',
      seed: typeof raw.seed === 'number' && Number.isFinite(raw.seed) ? raw.seed : 1,
      day: typeof raw.day === 'number' && Number.isFinite(raw.day) ? raw.day : 1,
      lootRespawn: Boolean(raw.lootRespawn),
      ...(raw.lootRespawnInterval ? { lootRespawnInterval: raw.lootRespawnInterval } : {}),
      updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : new Date().toISOString(),
    };
    upsertOwnedWorld(meta);
    if (typeof parsed.snapshotB64 === 'string' && parsed.snapshotB64.length > 0) {
      try {
        localStorage.setItem(`${SNAP_PREFIX}${code}`, parsed.snapshotB64);
      } catch {
        // Ignore storage quota errors.
      }
    }
    return meta;
  } catch {
    return null;
  }
}
