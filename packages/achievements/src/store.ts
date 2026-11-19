import { accountsEnabled, hasStoredSession } from '@lawn/platform/session';
import { getAchievement } from './catalog';
import { SyncedAchievementStore } from './sync';
import type { AchievementRecord, AchievementState, AchievementStore, UnlockResult } from './types';

export const ACHIEVEMENTS_STORAGE_KEY = 'gnome.achievements.v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function emptyState(): AchievementState {
  return { version: 1, records: {} };
}

function copyState(s: AchievementState): AchievementState {
  return JSON.parse(JSON.stringify(s)) as AchievementState;
}

export function parseState(raw: unknown): AchievementState {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return emptyState();
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1 || typeof obj.records !== 'object' || obj.records === null || Array.isArray(obj.records)) {
    return emptyState();
  }
  const records: Record<string, AchievementRecord> = {};
  for (const [id, rec] of Object.entries(obj.records as Record<string, unknown>)) {
    if (typeof rec !== 'object' || rec === null || Array.isArray(rec)) continue;
    const r = rec as Record<string, unknown>;
    const progress = typeof r.progress === 'number' && Number.isFinite(r.progress) && r.progress >= 0 ? r.progress : 0;
    const next: AchievementRecord = { progress };
    if (typeof r.unlockedAt === 'string' && r.unlockedAt.length > 0) next.unlockedAt = r.unlockedAt;
    records[id] = next;
  }
  return { version: 1, records };
}

export class LocalAchievementStore implements AchievementStore {
  private readonly storage: StorageLike | null;
  private readonly now: () => Date;
  private cache: AchievementState | null = null;

  constructor(
    storage: StorageLike | null = typeof localStorage === 'undefined' ? null : localStorage,
    now: () => Date = () => new Date(),
  ) {
    this.storage = storage;
    this.now = now;
  }

  async getState(): Promise<AchievementState> {
    if (!this.cache) this.cache = this.readStored();
    return copyState(this.cache);
  }

  async unlock(id: string): Promise<UnlockResult> {
    const def = getAchievement(id);
    if (!def) throw new Error(`Unknown achievement: ${id}`);
    const target = def.target ?? 1;
    const state = await this.getState();
    const existing = state.records[id] ?? { progress: 0 };
    if (existing.unlockedAt) {
      return { unlockedNow: false, progress: Math.max(existing.progress, target), target, def };
    }
    state.records[id] = { progress: target, unlockedAt: this.now().toISOString() };
    this.save(state);
    return { unlockedNow: true, progress: target, target, def };
  }

  async increment(id: string, by: number = 1): Promise<UnlockResult> {
    const def = getAchievement(id);
    if (!def) throw new Error(`Unknown achievement: ${id}`);
    const target = def.target ?? 1;
    const state = await this.getState();
    const existing = state.records[id] ?? { progress: 0 };
    if (existing.unlockedAt) {
      return { unlockedNow: false, progress: Math.max(existing.progress, target), target, def };
    }
    const nextProgress = Math.min(target, existing.progress + Math.max(0, by));
    const unlockedNow = nextProgress >= target;
    state.records[id] = unlockedNow
      ? { progress: target, unlockedAt: this.now().toISOString() }
      : { progress: nextProgress };
    this.save(state);
    return { unlockedNow, progress: nextProgress, target, def };
  }

  async reset(): Promise<void> {
    const next = emptyState();
    this.save(next);
  }

  private readStored(): AchievementState {
    if (!this.storage) return emptyState();
    try {
      const raw = this.storage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (!raw) return emptyState();
      return parseState(JSON.parse(raw));
    } catch {
      return emptyState();
    }
  }

  private save(state: AchievementState): void {
    this.cache = copyState(state);
    if (!this.storage) return;
    try {
      this.storage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage blocked; keep in-memory cache for this session.
    }
  }
}

/** True when a player is signed in on an accounts-enabled build (so unlocks should follow the account). */
function signedInWithAccount(): boolean {
  try {
    return accountsEnabled() && hasStoredSession();
  } catch {
    return false;
  }
}

export function createAchievementStore(): AchievementStore {
  return signedInWithAccount() ? new SyncedAchievementStore() : new LocalAchievementStore();
}
