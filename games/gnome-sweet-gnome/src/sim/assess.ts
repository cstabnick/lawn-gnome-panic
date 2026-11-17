// STUB (Epic 1). Level assessment: play every level many times with each bot and measure difficulty.
import type { LevelDef, SpecialKind } from '../engine/types';
import type { BotName } from './bots';

export interface RunResult {
  won: boolean;
  movesUsed: number;
  movesLeft: number;
  score: number; // after the Gnome Rush when won
  stars: number;
  /** Fraction of all goal units done, 0..1 (1 when won). */
  progress: number;
  made: Record<SpecialKind | 'prism', number>;
}

export interface LevelReport {
  id: number;
  name: string;
  moves: number;
  target: number;
  seeds: number;
  /** Win rate 0..1 per bot that was run. */
  win: Partial<Record<BotName, number>>;
  /** Smart bot: average moves left on its wins (0 if none). */
  movesLeftOnWin: number;
  /** Smart bot: average stars over all runs. */
  avgStars: number;
  /** Smart bot: average progress on losses (how close it got; 1 if it never lost). */
  lossProgress: number;
  /** 1 - smart win rate. */
  difficulty: number;
  /** smart win rate vs target: within +-TOLERANCE is 'ok'. */
  verdict: 'ok' | 'too easy' | 'too hard';
}

export const TOLERANCE = 0.15;

/** One full play of a level by a bot. Deterministic for (level, bot, seed). */
export function playLevel(level: LevelDef, bot: BotName, seed: number): RunResult {
  void level; void bot; void seed;
  return { won: false, movesUsed: 0, movesLeft: 0, score: 0, stars: 0, progress: 0, made: { mowerH: 0, mowerV: 0, bomb: 0, bee: 0, prism: 0 } };
}

/** Seeds 1..seeds for each bot (default: all three). */
export function assessLevel(level: LevelDef, seeds: number, bots?: readonly BotName[]): LevelReport {
  void seeds; void bots;
  return { id: level.id, name: level.name, moves: level.moves, target: level.target, seeds: 0, win: {}, movesLeftOnWin: 0, avgStars: 0, lossProgress: 1, difficulty: 1, verdict: 'too hard' };
}

/** The move limit (5..60) whose smart win rate is closest to level.target. */
export function suggestMoves(level: LevelDef, seeds: number): number {
  void seeds;
  return level.moves;
}

/** Problems with the difficulty curve across a level list, as readable sentences (empty = fine). */
export function curveProblems(reports: readonly LevelReport[]): string[] {
  void reports;
  return [];
}
