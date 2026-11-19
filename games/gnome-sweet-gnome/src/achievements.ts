// Achievements: one per home made over, and one for beating the last level. Rewards are gnome gear
// (packages/achievements/src/catalog.ts, ids gsg-*). The toast goes in its own container under #ui.
import { createAchievementTracker, type AchievementTracker } from '@lawn/achievements';
import { HOMES, homeDone } from './house/houseData';
import { LEVELS } from './levels';

/** Achievement id for each home, by home id. */
export const HOME_ACHIEVEMENT: Record<string, string> = {
  mossy: 'gsg-mossy-lane',
  oakwood: 'gsg-oakwood',
  cove: 'gsg-shell-cove',
};

let tracker: AchievementTracker | null = null;

function get(): AchievementTracker | null {
  if (!tracker && typeof document !== 'undefined') {
    tracker = createAchievementTracker({ ui: document.getElementById('ui') });
  }
  return tracker;
}

/** Unlocks the achievement of every finished home (also catches saves made before the achievements existed). */
export function checkHomes(built: Record<string, number>): void {
  for (const home of HOMES) {
    const id = HOME_ACHIEVEMENT[home.id];
    if (id && homeDone(home, built)) void get()?.unlock(id).catch(() => {});
  }
}

/** After a won level. */
export function levelWon(levelId: number): void {
  if (levelId >= LEVELS.length) void get()?.unlock('gsg-great-wave').catch(() => {});
}
