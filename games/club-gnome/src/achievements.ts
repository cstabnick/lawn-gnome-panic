// Club Gnome's achievements, unlocked from the town's own events.
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
  swallow(t.unlock('club-welcome'));
  const seen = readVisited();
  if (!seen.includes(map)) {
    seen.push(map);
    writeVisited(seen);
    swallow(t.increment('club-explorer'));
  }
}

/** I opened a game from a spot. */
export function onOpenGame(game: GameKey): void {
  const t = tracker;
  if (!t) return;
  swallow(t.increment('club-regular'));
  if (game === 'blackjackHigh') swallow(t.unlock('club-high-roller'));
}

/** I sat down on a bench, a stool or a picnic table. */
export function onSit(): void {
  const t = tracker;
  if (!t) return;
  swallow(t.unlock('club-sitter'));
}

/** I sent a chat line. */
export function onChatSent(): void {
  const t = tracker;
  if (!t) return;
  swallow(t.increment('club-chatterbox'));
}

/** I sent an emote. */
export function onEmoteSent(): void {}

/** I played an animated emote. */
export function onAnimSent(): void {
  const t = tracker;
  if (!t) return;
  swallow(t.increment('club-dance-floor'));
}

/** Number of other gnomes on my map right now (called when it changes). */
export function onCrowd(others: number): void {
  const t = tracker;
  if (!t) return;
  if (others >= 5) swallow(t.unlock('club-crowd'));
}

/** I picked up an acorn from the ground. */
export function onAcornPicked(): void {
  const t = tracker;
  if (!t) return;
  swallow(t.increment('club-acorn-picker'));
}

/**
 * I bought a cosmetic in a shop: unlocks the item's own achievement (its reward is the item, so the creator and the
 * dressing room can equip it) and the first-purchase one. Resolves once both are stored.
 */
export async function onShopBuy(achievementId: string): Promise<void> {
  const t = tracker;
  if (!t) return;
  try {
    await t.unlock(achievementId);
    await t.unlock('club-first-buy');
  } catch {
    // storage blocked: the purchase itself is in the Oakcount
  }
}

/** I bought a hair style at the salon (counts as a first purchase). */
export function onHairBought(): void {
  const t = tracker;
  if (!t) return;
  swallow(t.unlock('club-first-buy'));
}
