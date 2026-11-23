// Raid and reforging achievements (@lawn/achievements).
import { createAchievementTracker } from '@lawn/achievements';
import { RAIDS } from './content';
import { bus } from './events';
import { state } from './state';

export const RAID_ACHIEVEMENTS = {
  firstHorn: 'gnomomia-first-horn',
  luckyHorn: 'gnomomia-lucky-horn',
  reforged: 'gnomomia-reforged',
  everyHorn: 'gnomomia-every-horn',
} as const;

/** Story flag written by the raid runtime after each win: `raid:<id>:clears` (value is a count). */
export function raidClearFlag(raidId: string): string {
  return `raid:${raidId}:clears`;
}

/** Subscribes the four horn-call and reforging achievements to the game's events. Fire-and-forget: never blocks play. */
export function initRaidAchievements(ui: HTMLElement): void {
  const tracker = createAchievementTracker({ ui });

  bus.on('raid-ended', ({ raidId, won, drops }) => {
    if (!won) return;
    void tracker.unlock(RAID_ACHIEVEMENTS.firstHorn);
    if (drops.length >= 2) void tracker.unlock(RAID_ACHIEVEMENTS.luckyHorn);
    // The clear that just ended counts even if the flag is written after this event.
    const everyRaidCleared = Object.keys(RAIDS).every(
      (id) => id === raidId || Number(state.flags[raidClearFlag(id)] ?? 0) >= 1,
    );
    if (everyRaidCleared) void tracker.unlock(RAID_ACHIEVEMENTS.everyHorn);
  });

  bus.on('item-crafted', () => {
    void tracker.unlock(RAID_ACHIEVEMENTS.reforged);
  });
}
