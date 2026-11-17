// STUB (Epic 1). Board rules: matching, swaps, specials, gravity, blockers. Pure; mutates the Board passed in.
import type { Board, BoardEvent, Cell, LevelDef, Piece, Pos, Rng, SpecialKind } from './types';

/** A fresh board for a level: layout applied, no matches at rest, at least one valid swap. */
export function createBoard(level: LevelDef, rng: Rng): Board {
  void level; void rng;
  const rows = 8, cols = 8;
  const cells: Cell[] = [];
  for (let i = 0; i < rows * cols; i++) cells.push({ live: true, piece: { id: i, kind: 'gem', special: null }, weeds: 0, stone: 0 });
  return { rows, cols, cells, kinds: ['mushroom', 'gem', 'acorn', 'daisy'], nextId: rows * cols };
}

export function cloneBoard(b: Board): Board {
  return { ...b, kinds: [...b.kinds], cells: b.cells.map((c) => ({ ...c, piece: c.piece ? { ...c.piece } : null })) };
}

/** The cell at p, or null when p is outside the board. */
export function cellAt(b: Board, p: Pos): Cell | null {
  if (p.r < 0 || p.c < 0 || p.r >= b.rows || p.c >= b.cols) return null;
  return b.cells[p.r * b.cols + p.c];
}

export function isValidSwap(b: Board, a: Pos, p: Pos): boolean {
  void b; void a; void p;
  return false;
}

/** Every valid swap once, as [a, b] with b the right or lower neighbour of a. */
export function listValidSwaps(b: Board): [Pos, Pos][] {
  void b;
  return [];
}

/** Do a swap and resolve every cascade. Invalid: returns [swap, swapBack] and leaves b unchanged. */
export function resolveSwap(b: Board, a: Pos, p: Pos, rng: Rng): BoardEvent[] {
  void rng;
  return [{ type: 'swap', a, b: p }, { type: 'swapBack', a, b: p }].map((e) => e as BoardEvent).slice(0, isValidSwap(b, a, p) ? 1 : 2);
}

/** Fire the special or prism at p (as if hit), then resolve every cascade. No-op ([]) if p holds no special/prism. */
export function triggerAt(b: Board, p: Pos, rng: Rng): BoardEvent[] {
  void b; void p; void rng;
  return [];
}

/** Put a special on the tile at p (keeps its kind), or turn it into a prism. Returns the piece, or null if p holds no plain tile. */
export function placeSpecial(b: Board, p: Pos, special: SpecialKind | 'prism'): Piece | null {
  void b; void p; void special;
  return null;
}
