// Gnomomia's party achievements (packages/achievements/src/catalog.ts). party.ts calls partyAchievement() from its events.
import { createAchievementTracker, type AchievementTracker } from '@lawn/achievements';

export type PartyAchievementEvent = 'formed' | 'online' | 'shared-kill';

export const PARTY_ACHIEVEMENTS = {
  formed: 'gnomomia-fellowship',
  online: 'gnomomia-road-friends',
  sharedKill: 'gnomomia-many-hands',
} as const;

let tracker: AchievementTracker | null = null;
let trackerFailed = false;

function getTracker(): AchievementTracker | null {
  if (tracker) return tracker;
  if (trackerFailed) return null;
  try {
    tracker = createAchievementTracker({
      ui: typeof document !== 'undefined' ? document.getElementById('ui') : null,
    });
    return tracker;
  } catch {
    trackerFailed = true;
    return null;
  }
}

/** Records the event: 'formed' and 'online' unlock, 'shared-kill' increments by one. Never throws, never awaits. */
export function partyAchievement(event: PartyAchievementEvent): void {
  try {
    const t = getTracker();
    if (!t) return;
    let p: Promise<unknown>;
    if (event === 'shared-kill') p = t.increment(PARTY_ACHIEVEMENTS.sharedKill, 1);
    else if (event === 'formed') p = t.unlock(PARTY_ACHIEVEMENTS.formed);
    else p = t.unlock(PARTY_ACHIEVEMENTS.online);
    void p.catch(() => {});
  } catch {
    // Achievements are optional; a failure here must never break play.
  }
}
