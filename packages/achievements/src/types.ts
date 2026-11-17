export type EquipSlot = 'head' | 'back' | 'neck' | 'hand';

export interface AchievementReward {
  slot: EquipSlot;
  prefabId: string;
  label: string;
}

export interface AchievementDef {
  id: string;
  /** Workspace folder name of the game (e.g. 'gnome-golf', 'gnome-bowling', 'gnome-front'). */
  game: string;
  /** Human-readable game name for display in Gnome Creator. */
  gameTitle: string;
  title: string;
  description: string;
  /** Target count for progressive achievements. Default 1. */
  target?: number;
  /** Cosmetic prefab unlocked on the player's gnome when this achievement is earned. */
  reward?: AchievementReward;
}

export interface AchievementRecord {
  progress: number;
  /** RFC 3339 timestamp when unlocked; absent while locked. */
  unlockedAt?: string;
}

export interface AchievementState {
  version: 1;
  records: Record<string, AchievementRecord>;
}

export interface UnlockResult {
  unlockedNow: boolean;
  progress: number;
  target: number;
  def: AchievementDef;
}

/**
 * Seam between games/creator and wherever achievement unlocks live.
 * Today: LocalAchievementStore (localStorage). Later: platform service RPCs.
 */
export interface AchievementStore {
  getState(): Promise<AchievementState>;
  unlock(id: string): Promise<UnlockResult>;
  increment(id: string, by?: number): Promise<UnlockResult>;
  reset(): Promise<void>;
}
