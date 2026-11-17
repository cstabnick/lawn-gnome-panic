// Player models for the level assessment: they pick a swap from a LevelState. Pure TypeScript, no Phaser, no DOM.
import type { BoardEvent, LevelState, Piece, Pos, Rng } from '../engine/types';
import { listValidSwaps } from '../engine/board';
import { cloneState, playSwap } from '../engine/game';
import { makeRng, randInt } from '../engine/rng';

export type BotName = 'random' | 'greedy' | 'smart';
/** Returns the swap to play, or null when there is no valid swap. Must not mutate s. */
export type Bot = (s: Readonly<LevelState>, rng: Rng) => [Pos, Pos] | null;

export const BOT_NAMES: readonly BotName[] = ['random', 'greedy', 'smart'];

/** Score for a swap, given the state before it, the clone after it and the events it produced. */
type Scorer = (before: Readonly<LevelState>, after: LevelState, events: BoardEvent[]) => number;

/**
 * Try every valid swap on a clone and return the one with the highest score (ties: random).
 * With probability `slip`, play a random one of the best 3 instead (people miss the best move sometimes).
 */
function bestSwap(s: Readonly<LevelState>, rng: Rng, scoreOf: Scorer, slip = 0): [Pos, Pos] | null {
  const scored: { m: [Pos, Pos]; v: number }[] = [];
  for (const [a, b] of listValidSwaps(s.board)) {
    const clone = cloneState(s);
    const seed = Math.floor(rng() * 2 ** 32);
    const events = playSwap(clone, a, b, makeRng(seed));
    scored.push({ m: [a, b], v: scoreOf(s, clone, events) + rng() * 0.5 }); // the jitter breaks ties at random
  }
  if (scored.length === 0) return null;
  scored.sort((x, y) => y.v - x.v);
  if (slip > 0 && rng() < slip) return scored[randInt(rng, Math.min(3, scored.length))].m;
  return scored[0].m;
}

/** How often the smart bot plays one of its top 3 instead of its best move. */
export const SMART_SLIP = 0.25;

/** Goal units gained by the swap: sum over goals of (left before - left after). */
function goalUnitsGained(before: Readonly<LevelState>, after: LevelState): number {
  let units = 0;
  for (let i = 0; i < before.goals.length; i++) units += before.goals[i].left - after.goals[i].left;
  return units;
}

/** Row of every gnome on the board, by piece id. */
function gnomeRows(s: Readonly<LevelState>): Map<number, number> {
  const rows = new Map<number, number>();
  const { cols } = s.board;
  s.board.cells.forEach((cell, i) => {
    if (cell.piece?.kind === 'gnome') rows.set(cell.piece.id, Math.floor(i / cols));
  });
  return rows;
}

/** Total rows moved down by the gnomes that are still on the board after the swap. */
function gnomeRowsDown(before: Readonly<LevelState>, after: LevelState): number {
  const start = gnomeRows(before);
  const end = gnomeRows(after);
  let down = 0;
  for (const [id, row] of end) {
    const was = start.get(id);
    if (was !== undefined && row > was) down += row - was;
  }
  return down;
}

function specialBonus(piece: Piece): number {
  if (piece.kind === 'prism') return 120;
  switch (piece.special) {
    case 'bee':
      return 35;
    case 'mowerH':
    case 'mowerV':
      return 45;
    case 'bomb':
      return 70;
    default:
      return 0;
  }
}

/**
 * What a person can see before swapping: the swap's own match (cascade 0) and the specials it makes or fires,
 * not the cascades that random refills cause. So only events before the first cascadeEnd count.
 */
function visible(events: BoardEvent[]): BoardEvent[] {
  const end = events.findIndex((e) => e.type === 'cascadeEnd');
  return end < 0 ? events : events.slice(0, end);
}

function smartScore(before: Readonly<LevelState>, _after: LevelState, events: BoardEvent[]): number {
  const collect = new Set(before.goals.filter((g) => g.goal.type === 'collect' && g.left > 0).map((g) => (g.goal as { kind: string }).kind));
  const wantWeeds = before.goals.some((g) => g.goal.type === 'weeds' && g.left > 0);
  const wantStones = before.goals.some((g) => g.goal.type === 'stones' && g.left > 0);
  const gnomeIds = new Set<number>();
  if (before.goals.some((g) => g.goal.type === 'gnomes' && g.left > 0))
    for (const c of before.board.cells) if (c.piece?.kind === 'gnome') gnomeIds.add(c.piece.id);
  let score = 0;
  for (const e of visible(events)) {
    if (e.type === 'clear') score += collect.has(e.kind) ? 1000 : 2;
    else if (e.type === 'weeds' && wantWeeds) score += 1000;
    else if (e.type === 'stone' && wantStones) score += 1000;
    else if (e.type === 'gnomeSaved') score += 3000;
    else if (e.type === 'specialCreated') score += specialBonus(e.piece);
    else if (e.type === 'combo') score += 30;
    else if (e.type === 'fall') for (const m of e.moves) if (gnomeIds.has(m.id)) score += 15 * (m.to.r - m.from.r);
  }
  return score;
}

function greedyScore(_before: Readonly<LevelState>, _after: LevelState, events: BoardEvent[]): number {
  return events.filter((e) => e.type === 'clear').length;
}

export const BOTS: Record<BotName, Bot> = {
  // A uniformly random valid swap.
  random: (s, rng) => {
    const swaps = listValidSwaps(s.board);
    if (swaps.length === 0) return null;
    return swaps[randInt(rng, swaps.length)];
  },
  // Goes for big matches: the swap that clears the most tiles.
  greedy: (s, rng) => bestSwap(s, rng, greedyScore),
  // Plays for the goals, specials and gnome drops from what is visible (no refill foresight), and sometimes slips: a decent human.
  smart: (s, rng) => bestSwap(s, rng, smartScore, SMART_SLIP),
};
