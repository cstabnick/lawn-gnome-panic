import { showSyncNotice, watchKey } from '@lawn/sync';
import { getAchievement } from './catalog';
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

/** Merges two saves of the same player: nothing earned in either tab is lost. Progress takes the larger value and an
 *  unlock keeps its earliest time. (Only `reset` can lower progress, and it replaces the save outright.) */
export function mergeStates(a: AchievementState, b: AchievementState): AchievementState {
  const records: Record<string, AchievementRecord> = {};
  for (const id of new Set([...Object.keys(a.records), ...Object.keys(b.records)])) {
    const x = a.records[id];
    const y = b.records[id];
    if (!x || !y) {
      records[id] = { ...(x ?? y!) };
      continue;
    }
    const next: AchievementRecord = { progress: Math.max(x.progress, y.progress) };
    const at = [x.unlockedAt, y.unlockedAt].filter((t): t is string => !!t).sort()[0];
    if (at) next.unlockedAt = at;
    records[id] = next;
  }
  return { version: 1, records };
}

function parseState(raw: unknown): AchievementState {
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
    watch = false,
  ) {
    this.storage = storage;
    this.now = now;
    if (watch) watchKey(ACHIEVEMENTS_STORAGE_KEY, () => this.onOtherTab());
  }

  /** Another tab changed the save: merge it in, and tell the player when it brought something new. */
  private onOtherTab(): void {
    const before = this.cache;
    const merged = this.merged();
    const gained = Object.entries(merged.records).some(([id, r]) => r.unlockedAt && !before?.records[id]?.unlockedAt);
    this.cache = merged;
    if (gained) showSyncNotice('Achievements from another tab were merged into this one.');
  }

  /** What is stored now merged with this tab's memory (which also holds a save that storage refused). */
  private merged(): AchievementState {
    const stored = this.readStored();
    return this.cache ? mergeStates(this.cache, stored) : stored;
  }

  async getState(): Promise<AchievementState> {
    this.cache = this.merged();
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

export function createAchievementStore(): AchievementStore {
  return new LocalAchievementStore(undefined, undefined, true);
}
