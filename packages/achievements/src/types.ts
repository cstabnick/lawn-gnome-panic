export type EquipSlot = 'head' | 'back' | 'neck' | 'hand';

export interface AchievementReward {
  slot: EquipSlot;
  prefabId: string;
  label: string;
  /**
   * Rare: this item is locked behind THIS achievement alone. No other achievement may grant the same prefab
   * (the catalog test enforces it), and the Gnome Creator and the unlock toast mark it RARE. Use it for the hard
   * achievements, so an easy one can never make a hard one's item common.
   */
  exclusive?: boolean;
}

/** An animated emote (`@lawn/emotes`) the achievement unlocks. The player equips up to 4 in the Gnome Creator. */
export interface AchievementEmoteReward {
  /** An `EmoteDef.id` from `@lawn/emotes` (its test checks every id exists). */
  emoteId: string;
  label: string;
  /** One emoji shown on the toast and on emote buttons. */
  icon: string;
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
  /** Animated emote unlocked when this achievement is earned (alone, or alongside a gear reward). */
  emote?: AchievementEmoteReward;
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
