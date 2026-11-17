// STUB (Epic 1). The level list. Tuned with `npm run assess -w games/gnome-sweet-gnome`.
import type { LevelDef } from './engine/types';

export const LEVELS: LevelDef[] = [
  { id: 1, name: 'Front Path', moves: 20, kinds: 4, goals: [{ type: 'collect', kind: 'mushroom', count: 15 }], stars: [1000, 2500, 4000], target: 0.98 },
];

/** Intended smart-bot win rate for level id: a sawtooth that gets harder, hard every 5th, a breather after. */
export function targetFor(id: number): number {
  void id;
  return 0.9;
}
