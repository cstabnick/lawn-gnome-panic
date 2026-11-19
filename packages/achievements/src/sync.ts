import { createCloudSlot, type CloudDeps, type CloudSlot } from '@lawn/cloudsave';
import { ACHIEVEMENTS_STORAGE_KEY, LocalAchievementStore, parseState, type StorageLike } from './store';
import type { AchievementRecord, AchievementState, AchievementStore, UnlockResult } from './types';

export const ACHIEVEMENTS_CLOUD_SYNC_KEY = 'gnome.achievements.cloud.v1';

function parseRaw(raw: string | null): AchievementState {
  if (raw === null) return { version: 1, records: {} };
  try {
    return parseState(JSON.parse(raw));
  } catch {
    return { version: 1, records: {} };
  }
}

/** The earlier of two RFC 3339 timestamps; an unparseable pair falls back to a string comparison. */
function earlier(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isFinite(ta) && Number.isFinite(tb)) return ta <= tb ? a : b;
  return a <= b ? a : b;
}

/**
 * Union of two achievement saves: every id from either side, the higher progress, and the earlier unlockedAt when
 * both have one. Garbage on either side counts as empty. Output is JSON with ids sorted (deterministic).
 */
export function mergeAchievementStates(local: string | null, remote: string): string {
  const a = parseRaw(local).records;
  const b = parseRaw(remote).records;
  const ids = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const records: Record<string, AchievementRecord> = {};
  for (const id of ids) {
    const x = a[id];
    const y = b[id];
    const rec: AchievementRecord = { progress: Math.max(x?.progress ?? 0, y?.progress ?? 0) };
    const unlockedAt = earlier(x?.unlockedAt, y?.unlockedAt);
    if (unlockedAt !== undefined) rec.unlockedAt = unlockedAt;
    records[id] = rec;
  }
  return JSON.stringify({ version: 1, records });
}

function countUnlocked(text: string): number {
  return Object.values(parseRaw(text).records).filter((r) => r.unlockedAt !== undefined).length;
}

export interface SyncedAchievementStoreOptions {
  /** Local storage for the achievement save. Default: localStorage (null when unavailable). */
  storage?: StorageLike | null;
  /** Replaces some cloud slot deps (tests). */
  slotDeps?: Partial<CloudDeps>;
}

/**
 * Achievement store for a signed-in player: the local save is merged with the account's at startup (union, see
 * mergeAchievementStates) and every unlock is pushed, so an unlock on one device shows up on the others.
 */
export class SyncedAchievementStore implements AchievementStore {
  private readonly storage: StorageLike | null;
  private local: LocalAchievementStore;
  private readonly slot: CloudSlot;
  private readyPromise: Promise<void> | null = null;

  constructor(opts: SyncedAchievementStoreOptions = {}) {
    this.storage =
      opts.storage !== undefined ? opts.storage : typeof localStorage === 'undefined' ? null : localStorage;
    this.local = new LocalAchievementStore(this.storage);
    this.slot = createCloudSlot({
      game: 'ARCADE',
      saveKey: ACHIEVEMENTS_STORAGE_KEY,
      syncKey: ACHIEVEMENTS_CLOUD_SYNC_KEY,
      mode: 'merge',
      merge: mergeAchievementStates,
      summarize: (t) => `${countUnlocked(t)} achievements`,
      onLocalChanged: () => {
        this.local = new LocalAchievementStore(this.storage);
      },
      deps: { storage: this.storage as CloudDeps['storage'], ...opts.slotDeps },
    });
  }

  /** Runs the startup sync once (shared by every call); afterwards the local cache is rebuilt from storage. */
  private ready(): Promise<void> {
    if (this.readyPromise === null) {
      this.readyPromise = (async () => {
        try {
          await this.slot.syncAtStartup(3000);
        } catch {
          // syncAtStartup never rejects; play from local storage if it somehow does
        }
        this.local = new LocalAchievementStore(this.storage);
      })();
    }
    return this.readyPromise;
  }

  async getState(): Promise<AchievementState> {
    await this.ready();
    return this.local.getState();
  }

  async unlock(id: string): Promise<UnlockResult> {
    await this.ready();
    const res = await this.local.unlock(id);
    this.slot.pushSave();
    return res;
  }

  async increment(id: string, by?: number): Promise<UnlockResult> {
    await this.ready();
    const res = await this.local.increment(id, by);
    this.slot.pushSave();
    return res;
  }

  async reset(): Promise<void> {
    await this.ready();
    await this.local.reset();
    this.slot.pushSave();
  }
}
