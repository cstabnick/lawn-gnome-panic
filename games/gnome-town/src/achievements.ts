// Gnome Town's achievements, unlocked from the town's own events. STUB: replaced by the achievements issue.
import type { GameKey, MapId } from './config';

/** Creates the tracker (after loadMyGnome). */
export function initAchievements(ui: HTMLElement): void {
  void ui;
}
/** I arrived on a map (also on first load). */
export function onVisitMap(map: MapId): void {
  void map;
}
/** I opened a game from a spot. */
export function onOpenGame(game: GameKey): void {
  void game;
}
/** I sent a chat line. */
export function onChatSent(): void {}
/** I sent an emote. */
export function onEmoteSent(): void {}
/** Number of other gnomes on my map right now (called when it changes). */
export function onCrowd(others: number): void {
  void others;
}
