// STUB (Epic 1). Player models for the level assessment: they pick a swap from a LevelState.
import type { LevelState, Pos, Rng } from '../engine/types';

export type BotName = 'random' | 'greedy' | 'smart';
/** Returns the swap to play, or null when there is no valid swap. Must not mutate s. */
export type Bot = (s: Readonly<LevelState>, rng: Rng) => [Pos, Pos] | null;

export const BOT_NAMES: readonly BotName[] = ['random', 'greedy', 'smart'];

export const BOTS: Record<BotName, Bot> = {
  random: () => null,
  greedy: () => null,
  smart: () => null,
};
