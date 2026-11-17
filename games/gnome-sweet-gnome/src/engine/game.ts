// Level rules: moves, goals, score, stars, win/lose, the end-of-level Gnome Rush. Pure TypeScript.
import type { Board, BoardEvent, BoosterKind, GoalDef, GoalState, LevelDef, LevelState, PieceKind, Pos, Rng, SpecialKind, TileKind } from './types';
import { TILE_KINDS } from './types';
import { cloneBoard, createBoard, placeSpecial, resolveSwap, triggerAt } from './board';
import { TUNING } from '../config';

const MAX_RUSH_MOWERS = 15;
const MAX_RUSH_TRIGGERS = 60;

function isTileKind(kind: PieceKind): kind is TileKind {
  return (TILE_KINDS as readonly string[]).includes(kind);
}

/** Positions of plain tiles: a colour tile with no special on it. */
function plainCells(b: Board): Pos[] {
  const out: Pos[] = [];
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const piece = b.cells[r * b.cols + c].piece;
      if (piece && isTileKind(piece.kind) && piece.special === null) out.push({ r, c });
    }
  }
  return out;
}

function pick(list: Pos[], rng: Rng): Pos {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

/** First cell (row-major) holding a special or a prism. */
function firstPowerCell(b: Board): Pos | null {
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const piece = b.cells[r * b.cols + c].piece;
      if (piece && (piece.special !== null || piece.kind === 'prism')) return { r, c };
    }
  }
  return null;
}

function totalFor(goal: GoalDef, board: Board): number {
  switch (goal.type) {
    case 'collect':
      return goal.count;
    case 'weeds':
      return board.cells.reduce((n, cell) => n + cell.weeds, 0);
    case 'stones':
      return board.cells.reduce((n, cell) => n + cell.stone, 0);
    case 'gnomes':
      return board.cells.reduce((n, cell) => n + (cell.piece?.kind === 'gnome' ? 1 : 0), 0);
  }
}

function countDown(g: GoalState): void {
  if (g.left > 0) g.left -= 1;
}

export function startLevel(level: LevelDef, rng: Rng, boosters: BoosterKind[] = []): LevelState {
  const board = createBoard(level, rng);
  const goals: GoalState[] = level.goals.map((goal) => {
    const total = totalFor(goal, board);
    return { goal, total, left: total };
  });
  const s: LevelState = {
    level,
    board,
    movesLeft: level.moves,
    movesUsed: 0,
    score: 0,
    goals,
    status: 'playing',
    made: { mowerH: 0, mowerV: 0, bomb: 0, bee: 0, prism: 0 },
  };
  for (const booster of boosters) {
    const spots = plainCells(s.board);
    if (spots.length === 0) continue;
    const at = pick(spots, rng);
    let special: SpecialKind | 'prism';
    if (booster === 'mower') special = rng() < 0.5 ? 'mowerH' : 'mowerV';
    else if (booster === 'bomb') special = 'bomb';
    else special = 'prism';
    placeSpecial(s.board, at, special);
  }
  return s;
}

/** One player move. Invalid swaps return [swap, swapBack] and cost nothing. */
export function playSwap(s: LevelState, a: Pos, b: Pos, rng: Rng): BoardEvent[] {
  if (s.status !== 'playing') return [];
  const events = resolveSwap(s.board, a, b, rng);
  if (events.some((e) => e.type === 'swapBack')) return events;
  s.movesLeft -= 1;
  s.movesUsed += 1;
  applyEvents(s, events);
  if (goalsDone(s)) s.status = 'won';
  else if (s.movesLeft <= 0) s.status = 'lost';
  return events;
}

/** Count goals, score and `made` from events. Called by playSwap and gnomeRush; exported for tests. */
export function applyEvents(s: LevelState, events: readonly BoardEvent[]): void {
  for (const e of events) {
    switch (e.type) {
      case 'clear':
        s.score += TUNING.scorePerTile * (e.cascade + 1);
        for (const g of s.goals) {
          if (g.goal.type === 'collect' && g.goal.kind === e.kind) countDown(g);
        }
        break;
      case 'specialCreated':
        s.score += TUNING.scoreSpecialMade;
        s.made[e.piece.special ?? 'prism'] += 1;
        break;
      case 'weeds':
        for (const g of s.goals) if (g.goal.type === 'weeds') countDown(g);
        break;
      case 'stone':
        for (const g of s.goals) if (g.goal.type === 'stones') countDown(g);
        break;
      case 'gnomeSaved':
        s.score += TUNING.scoreGnomeSaved;
        for (const g of s.goals) if (g.goal.type === 'gnomes') countDown(g);
        break;
      default:
        break;
    }
  }
}

/** 0..3 stars for a score. A won level always gets at least 1. */
export function starsFor(level: LevelDef, score: number, won: boolean): number {
  if (!won) return 0;
  const earned = level.stars.filter((threshold) => score >= threshold).length;
  return Math.max(1, earned);
}

/** After a win: every move left becomes a mower that fires, then every special still on the board fires. */
export function gnomeRush(s: LevelState, rng: Rng): BoardEvent[] {
  if (s.status !== 'won') return [];
  const own: BoardEvent[] = []; // the rush's own mower placements: not scored or counted as made
  const mowers = Math.min(s.movesLeft, MAX_RUSH_MOWERS);
  for (let i = 0; i < mowers; i++) {
    s.score += TUNING.scoreRushPerMove;
    const spots = plainCells(s.board);
    if (spots.length === 0) continue;
    const at = pick(spots, rng);
    const special: SpecialKind = rng() < 0.5 ? 'mowerH' : 'mowerV';
    const piece = placeSpecial(s.board, at, special);
    if (piece) own.push({ type: 'specialCreated', at, piece, cascade: 0 });
  }
  s.movesLeft = 0;

  const fired: BoardEvent[] = [];
  for (let n = 0; n < MAX_RUSH_TRIGGERS; n++) {
    const pos = firstPowerCell(s.board);
    if (!pos) break;
    const events = triggerAt(s.board, pos, rng);
    if (events.length === 0) break; // stub or nothing to fire: stop instead of looping
    fired.push(...events);
  }
  applyEvents(s, fired);
  return [...own, ...fired];
}

/** Bought extra moves after running out: status goes back to 'playing'. */
export function addMoves(s: LevelState, n: number): void {
  s.movesLeft += n;
  if (s.status === 'lost') s.status = 'playing';
}

/** Deep copy (board, goals, made) so a bot can try a move without touching the real state. */
export function cloneState(s: Readonly<LevelState>): LevelState {
  return { ...s, board: cloneBoard(s.board), goals: s.goals.map((g) => ({ ...g })), made: { ...s.made } };
}

/** True when every goal is done. */
export function goalsDone(s: Readonly<LevelState>): boolean {
  return s.goals.every((g) => g.left === 0);
}

/** 0..1 share of the goals done. 1 when the goals have no total. */
export function progress(s: Readonly<LevelState>): number {
  const total = s.goals.reduce((n, g) => n + g.total, 0);
  if (total === 0) return 1;
  const done = s.goals.reduce((n, g) => n + (g.total - g.left), 0);
  return done / total;
}
