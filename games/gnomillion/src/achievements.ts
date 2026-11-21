import { createAchievementTracker, type AchievementTracker } from '@lawn/achievements';
import type { TierId } from './engine';

// Achievement hooks for Once in a Gnomillion. The UI calls these; defs live in packages/achievements/src/catalog.ts.
let tracker: AchievementTracker | null = null;

/** Call once at startup with the shared #ui element. Later calls replace the tracker. */
export function createTracking(ui: HTMLElement): void {
  tracker = createAchievementTracker({ ui });
}

/** The local player sent an answer for the open round. */
export async function onAnswered(): Promise<void> {
  await tracker?.unlock('gnomillion-first-answer');
}

/** A round closed. `myTier` is the tier of the local player's bucket, or null if they did not answer. */
export async function onRoundClosed(myTier: TierId | null): Promise<void> {
  const t = tracker;
  if (!t) return;
  await t.increment('gnomillion-five-rounds');
  if (myTier === 'krillion') {
    await t.unlock('gnomillion-one-in-a-gnomillion');
    await t.increment('gnomillion-lone-voice');
  }
}

/** The game reached its last round and is over. */
export async function onGameWon(): Promise<void> {
  await tracker?.unlock('gnomillion-champion');
}
