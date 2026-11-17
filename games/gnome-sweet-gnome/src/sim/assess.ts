// Level assessment: play every level many times with each bot and measure difficulty. Pure TypeScript.
import type { LevelDef, SpecialKind } from '../engine/types';
import { gnomeRush, playSwap, progress as goalProgress, startLevel, starsFor } from '../engine/game';
import { makeRng } from '../engine/rng';
import type { BotName } from './bots';
import { BOTS, BOT_NAMES } from './bots';

export interface RunResult {
  won: boolean;
  movesUsed: number;
  movesLeft: number; // moves left when the level ended, before the Gnome Rush
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
  /** Stars (1, 2, 3 thresholds) from the smart bot's winning scores; [level.stars] if it never won. */
  suggestedStars: [number, number, number];
  /** Set by the CLI's tune mode: the move count whose smart win rate is closest to the target. */
  suggestedMoves?: number;
}

export const TOLERANCE = 0.15;

const MAX_MOVES = 60;
const MIN_MOVES = 5;
const MAX_ITERATIONS = 200;

/** One full play of a level by a bot. Deterministic for (level, bot, seed). */
export function playLevel(level: LevelDef, bot: BotName, seed: number): RunResult {
  const rng = makeRng(seed);
  const state = startLevel(level, rng);
  const botRng = makeRng(seed * 7919 + BOT_NAMES.indexOf(bot) + 1);
  for (let i = 0; i < MAX_ITERATIONS && state.status === 'playing'; i++) {
    const move = BOTS[bot](state, botRng);
    if (!move) break; // no valid swap: the game is stuck and counts as a loss
    playSwap(state, move[0], move[1], rng);
  }
  const won = state.status === 'won';
  const movesLeft = state.movesLeft;
  if (won) gnomeRush(state, rng);
  return {
    won,
    movesUsed: state.movesUsed,
    movesLeft,
    score: state.score,
    stars: starsFor(level, state.score, won),
    progress: goalProgress(state),
    made: { ...state.made },
  };
}

function playMany(level: LevelDef, bot: BotName, seeds: number): RunResult[] {
  const runs: RunResult[] = [];
  for (let seed = 1; seed <= seeds; seed++) runs.push(playLevel(level, bot, seed));
  return runs;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
}

function winRate(runs: RunResult[]): number {
  return runs.length === 0 ? 0 : runs.filter((r) => r.won).length / runs.length;
}

/** Percentile (nearest rank) of sorted ascending values, rounded down to 50. */
function percentileStar(sorted: number[], p: number): number {
  const at = sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
  return Math.floor(at / 50) * 50;
}

function suggestStars(level: LevelDef, smartWins: RunResult[]): [number, number, number] {
  if (smartWins.length === 0) return [...level.stars];
  const sorted = smartWins.map((r) => r.score).sort((x, y) => x - y);
  const s1 = percentileStar(sorted, 0.1);
  let s2 = percentileStar(sorted, 0.5);
  let s3 = percentileStar(sorted, 0.85);
  if (s2 <= s1) s2 = s1 + 50;
  if (s3 <= s2) s3 = s2 + 50;
  return [s1, s2, s3];
}

function verdictFor(win: number, target: number): LevelReport['verdict'] {
  if (win > target + TOLERANCE) return 'too easy';
  if (win < target - TOLERANCE) return 'too hard';
  return 'ok';
}

/** Seeds 1..seeds for each bot (default: all three). The smart bot always runs: the verdict depends on it. */
export function assessLevel(level: LevelDef, seeds: number, bots: readonly BotName[] = BOT_NAMES): LevelReport {
  const runBots = new Set<BotName>([...bots, 'smart']);
  const win: Partial<Record<BotName, number>> = {};
  let smartRuns: RunResult[] = [];
  for (const bot of BOT_NAMES) {
    if (!runBots.has(bot)) continue;
    const runs = playMany(level, bot, seeds);
    win[bot] = winRate(runs);
    if (bot === 'smart') smartRuns = runs;
  }
  const smartWin = win.smart ?? 0;
  const smartWins = smartRuns.filter((r) => r.won);
  const smartLosses = smartRuns.filter((r) => !r.won);
  return {
    id: level.id,
    name: level.name,
    moves: level.moves,
    target: level.target,
    seeds,
    win,
    movesLeftOnWin: average(smartWins.map((r) => r.movesLeft)),
    avgStars: average(smartRuns.map((r) => r.stars)),
    lossProgress: smartLosses.length === 0 ? 1 : average(smartLosses.map((r) => r.progress)),
    difficulty: 1 - smartWin,
    verdict: verdictFor(smartWin, level.target),
    suggestedStars: suggestStars(level, smartWins),
  };
}

/** The move limit (5..60) whose smart win rate is closest to level.target (prefer the larger count on ties). */
export function suggestMoves(level: LevelDef, seeds: number): number {
  const smartWinAt = (moves: number) => winRate(playMany({ ...level, moves }, 'smart', seeds));
  // Win rate rises with the move count: find the first count that reaches the target.
  let lo = MIN_MOVES;
  let hi = MAX_MOVES;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (smartWinAt(mid) >= level.target) hi = mid;
    else lo = mid + 1;
  }
  // The answer is lo or the count just below it (which falls short of the target).
  if (lo > MIN_MOVES) {
    const above = Math.abs(smartWinAt(lo) - level.target);
    const below = Math.abs(smartWinAt(lo - 1) - level.target);
    if (below < above) return lo - 1;
  }
  return lo;
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** Problems with the difficulty curve across a level list, as readable sentences (empty = fine). */
export function curveProblems(reports: readonly LevelReport[]): string[] {
  const problems: string[] = [];
  const byId = new Map(reports.map((r) => [r.id, r]));
  const smartWin = (r: LevelReport) => r.win.smart ?? 0;
  const label = (r: LevelReport) => `Level ${r.id} '${r.name}'`;

  for (const r of reports) {
    if (r.id <= 3 && smartWin(r) < 0.9) {
      problems.push(`${label(r)}: smart wins ${pct(smartWin(r))}, levels 1-3 should be at least 90%`);
    }
    if (smartWin(r) < 0.2) {
      problems.push(`${label(r)}: smart wins only ${pct(smartWin(r))}, below 20%`);
    }
    const before = byId.get(r.id - 1);
    if (r.id % 5 === 0 && before && smartWin(r) >= smartWin(before)) {
      problems.push(
        `${label(r)} is a hard level but is not harder than level ${before.id}: smart wins ${pct(smartWin(r))} vs ${pct(smartWin(before))}`,
      );
    }
    if (r.id % 5 === 1 && r.id > 1 && before && smartWin(r) < smartWin(before)) {
      problems.push(
        `${label(r)} is a breather but is harder than hard level ${before.id}: smart wins ${pct(smartWin(r))} vs ${pct(smartWin(before))}`,
      );
    }
  }
  for (const r of reports) {
    if (r.verdict === 'ok') continue;
    const tries = r.suggestedMoves !== undefined ? ` (try ${r.suggestedMoves} moves)` : '';
    problems.push(
      `${label(r)}: ${r.verdict}, smart wins ${pct(smartWin(r))} vs target ${pct(r.target)}${tries}`,
    );
  }
  return problems;
}

/** Player-facing difficulty word for a smart-bot win rate. */
export function difficultyLabel(winRate: number): string {
  if (winRate >= 0.85) return 'easy';
  if (winRate >= 0.6) return 'medium';
  if (winRate >= 0.4) return 'hard';
  return 'super hard';
}
