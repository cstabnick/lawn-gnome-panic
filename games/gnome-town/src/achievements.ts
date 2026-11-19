// Gnome Town's achievements, unlocked from the town's own events.
import { createAchievementTracker, type AchievementTracker } from '@lawn/achievements';
import { STORAGE, isMapId, type GameKey, type MapId } from './config';

let tracker: AchievementTracker | null = null;

function swallow(p: Promise<unknown>): void {
  void p.catch(() => {});
}

function readVisited(): MapId[] {
  try {
    const raw = localStorage.getItem(STORAGE.visited);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(isMapId) : [];
  } catch {
    return [];
  }
}

function writeVisited(list: MapId[]): void {
  try {
    localStorage.setItem(STORAGE.visited, JSON.stringify(list));
  } catch {
    // Storage may be blocked; the achievement still counts for this visit.
  }
}

/** Creates the tracker (after loadMyGnome). */
export function initAchievements(ui: HTMLElement): void {
  tracker = createAchievementTracker({ ui });
}

/** I arrived on a map (also on first load). */
export function onVisitMap(map: MapId): void {
  const t = tracker;
  if (!t) return;
  swallow(t.unlock('town-welcome'));
  const seen = readVisited();
  if (!seen.includes(map)) {
    seen.push(map);
    writeVisited(seen);
    swallow(t.increment('town-explorer'));
  }
}

/** I opened a game from a spot. */
export function onOpenGame(game: GameKey): void {
  const t = tracker;
  if (!t) return;
  swallow(t.increment('town-regular'));
  if (game === 'blackjackHigh') swallow(t.unlock('town-high-roller'));
}

/** I sent a chat line. */
export function onChatSent(): void {
  const t = tracker;
  if (!t) return;
  swallow(t.increment('town-chatterbox'));
}

/** I sent an emote. */
export function onEmoteSent(): void {}

/** Number of other gnomes on my map right now (called when it changes). */
export function onCrowd(others: number): void {
  const t = tracker;
  if (!t) return;
  if (others >= 5) swallow(t.unlock('town-crowd'));
}
