import { createAchievementStore } from './store';
import { showAchievementToast } from './toast';
import type { AchievementDef, AchievementStore, UnlockResult } from './types';

export interface TrackerOptions {
  /** Optional #ui element to show achievement unlock toasts in. */
  ui?: HTMLElement | null;
  /** Override store (for tests or custom backends). */
  store?: AchievementStore;
  /** Optional callback whenever a new achievement unlocks. */
  onUnlock?: (def: AchievementDef) => void;
}

export interface AchievementTracker {
  unlock(id: string): Promise<UnlockResult>;
  increment(id: string, by?: number): Promise<UnlockResult>;
  isUnlocked(id: string): Promise<boolean>;
}

/**
 * Convenience helper for any game: records unlocks/progress and displays the toast in #ui.
 */
export function createAchievementTracker(options: TrackerOptions = {}): AchievementTracker {
  const store = options.store ?? createAchievementStore();

  const notifyIfNew = (res: UnlockResult): UnlockResult => {
    if (res.unlockedNow) {
      if (options.ui && typeof document !== 'undefined') {
        showAchievementToast(options.ui, res.def);
      }
      options.onUnlock?.(res.def);
    }
    return res;
  };

  return {
    async unlock(id: string): Promise<UnlockResult> {
      return notifyIfNew(await store.unlock(id));
    },
    async increment(id: string, by = 1): Promise<UnlockResult> {
      return notifyIfNew(await store.increment(id, by));
    },
    async isUnlocked(id: string): Promise<boolean> {
      const state = await store.getState();
      return Boolean(state.records[id]?.unlockedAt);
    },
  };
}
