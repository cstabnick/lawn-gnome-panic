// Maps game events (EVENTS in config.ts) to @lawn/achievements.
import { createAchievementTracker, getAchievement } from '@lawn/achievements';

export type EventSink = (name: string, n?: number) => void;

/** Event names are the achievement ids without the `snigms-` prefix (see packages/achievements/src/catalog.ts). */
const PREFIX = 'snigms-';

export function createAchievementSink(ui: HTMLElement): EventSink {
  const tracker = createAchievementTracker({ ui });
  return (name, n) => {
    const id = PREFIX + name;
    const def = getAchievement(id);
    if (!def) return; // unknown event: nothing to unlock
    const done = def.target && def.target > 1
      ? tracker.increment(id, n ?? 1)
      : tracker.unlock(id);
    done.catch(() => {});
  };
}
