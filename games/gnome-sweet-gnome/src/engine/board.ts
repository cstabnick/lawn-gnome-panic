// Board rules: matching, swaps, specials and their combos, stones, weeds, lost gnomes, gravity, refill, shuffle.
// Pure: no Phaser, no DOM, no Math.random. Mutates the Board passed in and returns the BoardEvents it produced.
import { TILE_KINDS } from './types';
import type { Board, BoardEvent, Cell, LevelDef, Piece, PieceKind, Pos, Rng, SpecialKind, TileKind } from './types';
import { pick, randInt } from './rng';

export interface Group {
  cells: Pos[];
  kind: TileKind;
  maxLine: number;
  hasH: boolean;
  hasV: boolean;
  square: boolean;
  lineDir: 'h' | 'v' | null;
}

type PowerType = SpecialKind | 'prism';

interface Ctx {
  b: Board;
  rng: Rng;
  ev: BoardEvent[];
  /** Cascade being resolved; every event carries it. */
  cascade: number;
  /** Pieces removed in the current cascade step. 0 after steps 1-2 means the cascade stops. */
  cleared: number;
  /** Stones already damaged in the current cascade step (each loses at most 1 per step). */
  hitStones: Set<number>;
  /** Power pieces removed but not fired yet, with the cell they were on. */
  queue: { idx: number; type: PowerType }[];
  /** Swap cells, used only when a new special lands during cascade 0 of a swap. -1 when none. */
  swapA: number;
  swapP: number;
}

const MOWERS: SpecialKind[] = ['mowerH', 'mowerV'];

// ---------- small helpers ----------

function posOf(b: Board, i: number): Pos {
  return { r: Math.floor(i / b.cols), c: i % b.cols };
}

function idxOf(b: Board, p: Pos): number {
  return p.r * b.cols + p.c;
}

/** A cell holds a piece only if it is live, has no stone and carries a piece. */
function holds(cell: Cell): boolean {
  return cell.live && cell.stone === 0 && cell.piece !== null;
}

/** The colour of a plain tile (kind is a TileKind, with or without a special); null for prism and gnome. */
function plainKind(p: Piece): TileKind | null {
  return (TILE_KINDS as readonly PieceKind[]).includes(p.kind) ? (p.kind as TileKind) : null;
}

function matchKind(cell: Cell): TileKind | null {
  if (!holds(cell)) return null;
  return plainKind(cell.piece!);
}

function isPower(p: Piece): boolean {
  return p.special !== null || p.kind === 'prism';
}

function typeOf(p: Piece): PowerType {
  return p.special ?? 'prism';
}

function neighbours(b: Board, i: number): number[] {
  const r = Math.floor(i / b.cols), c = i % b.cols;
  const out: number[] = [];
  if (r > 0) out.push(i - b.cols);
  if (r < b.rows - 1) out.push(i + b.cols);
  if (c > 0) out.push(i - 1);
  if (c < b.cols - 1) out.push(i + 1);
  return out;
}

function allLive(b: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < b.cells.length; i++) if (b.cells[i].live) out.push(i);
  return out;
}

function swapPieces(b: Board, i: number, j: number): void {
  const t = b.cells[i].piece;
  b.cells[i].piece = b.cells[j].piece;
  b.cells[j].piece = t;
}

/** Most common plain colour on the board; ties go to the first in b.kinds. */
function mostCommon(b: Board): TileKind {
  let best = b.kinds[0];
  let bestN = -1;
  for (const k of b.kinds) {
    let n = 0;
    for (const cell of b.cells) if (holds(cell) && cell.piece!.kind === k) n++;
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function newCtx(b: Board, rng: Rng): Ctx {
  return { b, rng, ev: [], cascade: 0, cleared: 0, hitStones: new Set(), queue: [], swapA: -1, swapP: -1 };
}

// ---------- groups ----------

/** Every group of matchable pieces (runs of >= 3 and 2x2 squares, merged when they share a cell). */
export function findGroups(b: Board): Group[] {
  const { rows, cols, cells } = b;
  const n = rows * cols;
  const kindAt: (TileKind | null)[] = new Array(n);
  for (let i = 0; i < n; i++) kindAt[i] = matchKind(cells[i]);

  const runs: { idx: number[]; dir: 'h' | 'v' }[] = [];
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const k = kindAt[r * cols + c];
      if (k === null) {
        c++;
        continue;
      }
      const start = c;
      while (c < cols && kindAt[r * cols + c] === k) c++;
      if (c - start >= 3) {
        const idx: number[] = [];
        for (let x = start; x < c; x++) idx.push(r * cols + x);
        runs.push({ idx, dir: 'h' });
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const k = kindAt[r * cols + c];
      if (k === null) {
        r++;
        continue;
      }
      const start = r;
      while (r < rows && kindAt[r * cols + c] === k) r++;
      if (r - start >= 3) {
        const idx: number[] = [];
        for (let y = start; y < r; y++) idx.push(y * cols + c);
        runs.push({ idx, dir: 'v' });
      }
    }
  }

  const squares: number[][] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const i = r * cols + c;
      const k = kindAt[i];
      if (k && kindAt[i + 1] === k && kindAt[i + cols] === k && kindAt[i + cols + 1] === k) {
        squares.push([i, i + 1, i + cols, i + cols + 1]);
      }
    }
  }

  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const join = (x: number, y: number): void => {
    parent[find(x)] = find(y);
  };
  const marked = new Uint8Array(n);
  for (const run of runs) {
    for (const i of run.idx) {
      marked[i] = 1;
      join(run.idx[0], i);
    }
  }
  for (const sq of squares) {
    for (const i of sq) {
      marked[i] = 1;
      join(sq[0], i);
    }
  }

  const groups: Group[] = [];
  const gIndex = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    if (!marked[i]) continue;
    const root = find(i);
    let g = gIndex.get(root);
    if (g === undefined) {
      g = groups.length;
      gIndex.set(root, g);
      groups.push({ cells: [], kind: kindAt[i]!, maxLine: 0, hasH: false, hasV: false, square: false, lineDir: null });
    }
    groups[g].cells.push(posOf(b, i));
  }
  for (const run of runs) {
    const g = groups[gIndex.get(find(run.idx[0]))!];
    if (run.dir === 'h') g.hasH = true;
    else g.hasV = true;
    if (run.idx.length > g.maxLine) {
      g.maxLine = run.idx.length;
      g.lineDir = run.dir;
    }
  }
  for (const sq of squares) groups[gIndex.get(find(sq[0]))!].square = true;
  return groups;
}

/** Is the matchable piece at i part of a run of >= 3 or a 2x2 square of its colour? (Same answer as findGroups, locally.) */
function inLineOrSquare(b: Board, i: number): boolean {
  const k = matchKind(b.cells[i]);
  if (k === null) return false;
  const { rows, cols, cells } = b;
  const r = Math.floor(i / cols), c = i % cols;
  const same = (j: number): boolean => matchKind(cells[j]) === k;

  let run = 1;
  for (let x = c - 1; x >= 0 && same(r * cols + x); x--) run++;
  for (let x = c + 1; x < cols && same(r * cols + x); x++) run++;
  if (run >= 3) return true;

  run = 1;
  for (let y = r - 1; y >= 0 && same(y * cols + c); y--) run++;
  for (let y = r + 1; y < rows && same(y * cols + c); y++) run++;
  if (run >= 3) return true;

  for (let y = r - 1; y <= r; y++) {
    for (let x = c - 1; x <= c; x++) {
      if (y < 0 || x < 0 || y + 1 >= rows || x + 1 >= cols) continue;
      const t = y * cols + x;
      if (same(t) && same(t + 1) && same(t + cols) && same(t + cols + 1)) return true;
    }
  }
  return false;
}

// ---------- board construction ----------

/** True when putting kind k at (r, c) would complete a 3-run or a 2x2 square with cells already placed (left, above). */
function badKind(b: Board, r: number, c: number, k: TileKind): boolean {
  const at = (rr: number, cc: number): boolean => {
    const p = b.cells[rr * b.cols + cc].piece;
    return p !== null && p.kind === k;
  };
  if (c >= 2 && at(r, c - 1) && at(r, c - 2)) return true;
  if (r >= 2 && at(r - 1, c) && at(r - 2, c)) return true;
  if (r >= 1 && c >= 1 && at(r - 1, c - 1) && at(r - 1, c) && at(r, c - 1)) return true;
  return false;
}

function rollKind(b: Board, r: number, c: number, rng: Rng): TileKind {
  let k = pick(rng, b.kinds);
  for (let t = 0; t < 30 && badKind(b, r, c, k); t++) k = pick(rng, b.kinds);
  return k;
}

/** A fresh board for a level: layout applied, no matches at rest, at least one valid swap. */
export function createBoard(level: LevelDef, rng: Rng): Board {
  const layout = level.layout ?? Array.from({ length: 8 }, () => '........');
  const rows = layout.length;
  const cols = layout[0].length;
  const b: Board = { rows, cols, cells: [], kinds: TILE_KINDS.slice(0, level.kinds), nextId: 1 };
  const plain: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = layout[r][c];
      const cell: Cell = {
        live: ch !== '#',
        piece: null,
        weeds: ch === 'w' ? 1 : ch === 'W' ? 2 : 0,
        stone: ch === 's' ? 1 : ch === 'S' ? 2 : 0,
      };
      const i = b.cells.length;
      b.cells.push(cell);
      if (ch === 'g') {
        cell.piece = { id: b.nextId++, kind: 'gnome', special: null };
      } else if (cell.live && cell.stone === 0) {
        cell.piece = { id: b.nextId++, kind: rollKind(b, r, c, rng), special: null };
        plain.push(i);
      }
    }
  }
  const ok = (): boolean => findGroups(b).length === 0 && hasValidSwap(b);
  for (let t = 0; t < 100 && !ok(); t++) {
    for (const i of plain) {
      const piece = b.cells[i].piece!;
      piece.kind = rollKind(b, Math.floor(i / cols), i % cols, rng);
    }
  }
  return b;
}

export function cloneBoard(b: Board): Board {
  return { ...b, kinds: [...b.kinds], cells: b.cells.map((c) => ({ ...c, piece: c.piece ? { ...c.piece } : null })) };
}

/** The cell at p, or null when p is outside the board. */
export function cellAt(b: Board, p: Pos): Cell | null {
  if (p.r < 0 || p.c < 0 || p.r >= b.rows || p.c >= b.cols) return null;
  return b.cells[p.r * b.cols + p.c];
}

// ---------- swaps ----------

export function isValidSwap(b: Board, a: Pos, p: Pos): boolean {
  const ca = cellAt(b, a), cp = cellAt(b, p);
  if (!ca || !cp) return false;
  if (Math.abs(a.r - p.r) + Math.abs(a.c - p.c) !== 1) return false;
  if (!holds(ca) || !holds(cp)) return false;
  const pa = ca.piece!, pp = cp.piece!;
  if (isPower(pa) || isPower(pp)) return true;
  const ia = idxOf(b, a), ip = idxOf(b, p);
  swapPieces(b, ia, ip);
  const ok = inLineOrSquare(b, ia) || inLineOrSquare(b, ip);
  swapPieces(b, ia, ip);
  return ok;
}

/** Every valid swap once, as [a, b] with b the right or lower neighbour of a. */
export function listValidSwaps(b: Board): [Pos, Pos][] {
  const out: [Pos, Pos][] = [];
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const a = { r, c };
      if (c + 1 < b.cols && isValidSwap(b, a, { r, c: c + 1 })) out.push([a, { r, c: c + 1 }]);
      if (r + 1 < b.rows && isValidSwap(b, a, { r: r + 1, c })) out.push([a, { r: r + 1, c }]);
    }
  }
  return out;
}

export function hasValidSwap(b: Board): boolean {
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const a = { r, c };
      if (c + 1 < b.cols && isValidSwap(b, a, { r, c: c + 1 })) return true;
      if (r + 1 < b.rows && isValidSwap(b, a, { r: r + 1, c })) return true;
    }
  }
  return false;
}

/** Do a swap and resolve every cascade. Invalid: returns [swap, swapBack] and leaves b unchanged. */
export function resolveSwap(b: Board, a: Pos, p: Pos, rng: Rng): BoardEvent[] {
  if (!isValidSwap(b, a, p)) return [{ type: 'swap', a, b: p }, { type: 'swapBack', a, b: p }];
  const ctx = newCtx(b, rng);
  const ia = idxOf(b, a), ip = idxOf(b, p);
  swapPieces(b, ia, ip);
  ctx.ev.push({ type: 'swap', a, b: p });
  ctx.swapA = ia;
  ctx.swapP = ip;
  const X = b.cells[ip].piece!; // came from a, now at p
  const Y = b.cells[ia].piece!; // came from p, now at a
  const pX = isPower(X), pY = isPower(Y);
  if (pX && pY) combo(ctx, ip, ia, X, Y);
  else if (pX) fireSwapped(ctx, ip, X, Y);
  else if (pY) fireSwapped(ctx, ia, Y, X);
  runCascades(ctx);
  return ctx.ev;
}

/** Fire the special or prism at p (as if hit), then resolve every cascade. No-op ([]) if p holds no special/prism. */
export function triggerAt(b: Board, p: Pos, rng: Rng): BoardEvent[] {
  const cell = cellAt(b, p);
  if (!cell || !holds(cell) || !isPower(cell.piece!)) return [];
  const ctx = newCtx(b, rng);
  const i = idxOf(b, p);
  const piece = clearCell(ctx, i, 'special');
  fire(ctx, i, typeOf(piece));
  runCascades(ctx);
  return ctx.ev;
}

/** Put a special on the tile at p (keeps its kind), or turn it into a prism. Returns the piece, or null if p holds no plain tile. */
export function placeSpecial(b: Board, p: Pos, special: SpecialKind | 'prism'): Piece | null {
  const cell = cellAt(b, p);
  if (!cell || !holds(cell)) return null;
  const piece = cell.piece!;
  if (plainKind(piece) === null || piece.special !== null) return null;
  if (special === 'prism') piece.kind = 'prism';
  else piece.special = special;
  return piece;
}

// ---------- firing ----------

/** Remove the piece on cell i. Weeds under it lose one layer. Does not queue or fire anything. */
function clearCell(ctx: Ctx, i: number, by: 'match' | 'special'): Piece {
  const { b } = ctx;
  const cell = b.cells[i];
  const piece = cell.piece!;
  const at = posOf(b, i);
  cell.piece = null;
  ctx.ev.push({ type: 'clear', at, pieceId: piece.id, kind: piece.kind, special: piece.special, by, cascade: ctx.cascade });
  ctx.cleared++;
  if (cell.weeds > 0) {
    cell.weeds--;
    ctx.ev.push({ type: 'weeds', at, left: cell.weeds });
  }
  return piece;
}

/** Damage the stone on cell i once per cascade step. Returns true if it lost a layer. */
function damageStone(ctx: Ctx, i: number): boolean {
  const cell = ctx.b.cells[i];
  if (!cell.live || cell.stone <= 0 || ctx.hitStones.has(i)) return false;
  ctx.hitStones.add(i);
  cell.stone--;
  ctx.ev.push({ type: 'stone', at: posOf(ctx.b, i), left: cell.stone });
  return true;
}

/** An area hit on cell i: a stone takes the hit, otherwise a non-gnome piece is cleared. */
function hit(ctx: Ctx, i: number, firingId: number): void {
  const cell = ctx.b.cells[i];
  if (!cell.live) return;
  if (cell.stone > 0) {
    damageStone(ctx, i);
    return;
  }
  const piece = cell.piece;
  if (!piece || piece.kind === 'gnome') return;
  clearCell(ctx, i, 'special');
  if (isPower(piece) && piece.id !== firingId) ctx.queue.push({ idx: i, type: typeOf(piece) });
}

function addLive(b: Board, out: number[], r: number, c: number): void {
  if (r < 0 || c < 0 || r >= b.rows || c >= b.cols) return;
  const i = r * b.cols + c;
  if (b.cells[i].live) out.push(i);
}

/** Bee target: a stone, else a weeded piece, else a plain tile; never a cell in `area`. */
function pickBeeTarget(ctx: Ctx, area: number[]): number | undefined {
  const { b } = ctx;
  const stones: number[] = [], weeds: number[] = [], plain: number[] = [];
  for (let j = 0; j < b.cells.length; j++) {
    const cell = b.cells[j];
    if (!cell.live || area.includes(j)) continue;
    if (cell.stone > 0) stones.push(j);
    else if (cell.piece && cell.weeds > 0) weeds.push(j);
    if (holds(cell) && plainKind(cell.piece!) !== null) plain.push(j);
  }
  if (stones.length) return pick(ctx.rng, stones);
  if (weeds.length) return pick(ctx.rng, weeds);
  if (plain.length) return pick(ctx.rng, plain);
  return undefined;
}

/**
 * Fire a special or prism centred on cell i: emit activate, then hit its area. The firing piece (if still on
 * the board) is cleared by its own area and is not queued again.
 */
function fire(ctx: Ctx, i: number, type: PowerType, firingId = -1, prismKind?: TileKind): void {
  const { b } = ctx;
  const cells: number[] = [];
  let target: number | undefined;
  const R = Math.floor(i / b.cols), C = i % b.cols;
  if (type === 'prism') {
    const kind = prismKind ?? mostCommon(b);
    cells.push(i);
    for (let j = 0; j < b.cells.length; j++) {
      if (j !== i && holds(b.cells[j]) && b.cells[j].piece!.kind === kind) cells.push(j);
    }
  } else if (type === 'mowerH') {
    for (let c = 0; c < b.cols; c++) addLive(b, cells, R, c);
  } else if (type === 'mowerV') {
    for (let r = 0; r < b.rows; r++) addLive(b, cells, r, C);
  } else if (type === 'bomb') {
    for (let r = R - 1; r <= R + 1; r++) for (let c = C - 1; c <= C + 1; c++) addLive(b, cells, r, c);
  } else {
    const plus = [i, ...neighbours(b, i)].filter((j) => b.cells[j].live);
    cells.push(...plus);
    target = pickBeeTarget(ctx, plus);
    if (target !== undefined) cells.push(target);
  }
  const ev: Extract<BoardEvent, { type: 'activate' }> = {
    type: 'activate',
    at: posOf(b, i),
    special: type,
    cells: cells.map((j) => posOf(b, j)),
    cascade: ctx.cascade,
  };
  if (target !== undefined) ev.target = posOf(b, target);
  ctx.ev.push(ev);
  for (const j of cells) hit(ctx, j, firingId);
}

function drainQueue(ctx: Ctx): void {
  for (let k = 0; k < ctx.queue.length; k++) {
    const q = ctx.queue[k];
    fire(ctx, q.idx, q.type);
  }
  ctx.queue.length = 0;
}

/** A power piece that was swapped with a non-power piece fires where it landed. */
function fireSwapped(ctx: Ctx, i: number, power: Piece, other: Piece): void {
  const type = typeOf(power);
  if (type === 'prism') fire(ctx, i, 'prism', power.id, plainKind(other) ?? undefined);
  else fire(ctx, i, type, power.id);
}

function emitCombo(ctx: Ctx, p: number, tX: PowerType, tY: PowerType, cells: number[]): void {
  ctx.ev.push({
    type: 'combo',
    at: posOf(ctx.b, p),
    a: tX,
    b: tY,
    cells: cells.map((j) => posOf(ctx.b, j)),
    cascade: ctx.cascade,
  });
}

/** Two power pieces swapped together. X came from a and sits at p; Y came from p and sits at a. */
function combo(ctx: Ctx, p: number, a: number, X: Piece, Y: Piece): void {
  const { b } = ctx;
  const tX = typeOf(X), tY = typeOf(Y);

  if (tX === 'prism' && tY === 'prism') {
    const cells = allLive(b);
    emitCombo(ctx, p, tX, tY, cells);
    clearCell(ctx, p, 'special');
    clearCell(ctx, a, 'special');
    for (const j of cells) hit(ctx, j, -1);
    return;
  }

  if (tX === 'prism' || tY === 'prism') {
    // Prism + special S: every plain tile of S's colour (without a special) gets S, then each fires, then S fires at p.
    const prismIdx = tX === 'prism' ? p : a;
    const sIdx = tX === 'prism' ? a : p;
    const sType = (tX === 'prism' ? tY : tX) as SpecialKind;
    const colour = b.cells[sIdx].piece!.kind as TileKind;
    const converted: number[] = [];
    for (let j = 0; j < b.cells.length; j++) {
      const cell = b.cells[j];
      if (holds(cell) && cell.piece!.special === null && cell.piece!.kind === colour) converted.push(j);
    }
    emitCombo(ctx, p, tX, tY, converted);
    clearCell(ctx, prismIdx, 'special');
    clearCell(ctx, sIdx, 'special');
    const fires: { idx: number; id: number; type: SpecialKind }[] = [];
    for (const j of converted) {
      const piece = b.cells[j].piece!;
      const s: SpecialKind = sType === 'mowerH' || sType === 'mowerV' ? pick(ctx.rng, MOWERS) : sType;
      piece.special = s;
      ctx.ev.push({ type: 'specialCreated', at: posOf(b, j), piece: { ...piece }, cascade: ctx.cascade });
      fires.push({ idx: j, id: piece.id, type: s });
    }
    for (const f of fires) {
      const cur = b.cells[f.idx].piece;
      if (cur && cur.id === f.id) fire(ctx, f.idx, f.type, f.id);
    }
    fire(ctx, p, sType);
    return;
  }

  if (tX === 'bee' && tY === 'bee') {
    emitCombo(ctx, p, tX, tY, []);
    clearCell(ctx, p, 'special');
    clearCell(ctx, a, 'special');
    for (let k = 0; k < 3; k++) fire(ctx, p, 'bee');
    return;
  }

  if (tX === 'bee' || tY === 'bee') {
    // Bee + mower or bomb: the bee's plus around p, then the other special fires at the bee's target.
    const other = (tX === 'bee' ? tY : tX) as SpecialKind;
    const plus = [p, ...neighbours(b, p)].filter((j) => b.cells[j].live);
    emitCombo(ctx, p, tX, tY, plus);
    clearCell(ctx, p, 'special');
    clearCell(ctx, a, 'special');
    for (const j of plus) hit(ctx, j, -1);
    fire(ctx, pickBeeTarget(ctx, plus) ?? p, other);
    return;
  }

  // Mower + mower, mower + bomb, bomb + bomb.
  const R = Math.floor(p / b.cols), C = p % b.cols;
  const set = new Set<number>();
  const add = (r: number, c: number): void => {
    if (r < 0 || c < 0 || r >= b.rows || c >= b.cols) return;
    const j = r * b.cols + c;
    if (b.cells[j].live) set.add(j);
  };
  const isMower = (t: PowerType): boolean => t === 'mowerH' || t === 'mowerV';
  if (isMower(tX) && isMower(tY)) {
    for (let c = 0; c < b.cols; c++) add(R, c);
    for (let r = 0; r < b.rows; r++) add(r, C);
  } else if (!isMower(tX) && !isMower(tY)) {
    for (let r = R - 2; r <= R + 2; r++) for (let c = C - 2; c <= C + 2; c++) add(r, c);
  } else {
    for (let r = R - 1; r <= R + 1; r++) for (let c = 0; c < b.cols; c++) add(r, c);
    for (let c = C - 1; c <= C + 1; c++) for (let r = 0; r < b.rows; r++) add(r, c);
  }
  const cells = [...set].sort((x, y) => x - y);
  emitCombo(ctx, p, tX, tY, cells);
  clearCell(ctx, p, 'special');
  clearCell(ctx, a, 'special');
  for (const j of cells) hit(ctx, j, -1);
}

// ---------- cascades ----------

/** Where a group's special lands: the swap's p, else the swap's a, else the group cell with the largest r then smallest c. */
function spotFor(ctx: Ctx, idxs: number[]): number {
  if (ctx.cascade === 0) {
    if (ctx.swapP >= 0 && idxs.includes(ctx.swapP)) return ctx.swapP;
    if (ctx.swapA >= 0 && idxs.includes(ctx.swapA)) return ctx.swapA;
  }
  const cols = ctx.b.cols;
  let best = idxs[0];
  for (const i of idxs) {
    const r = Math.floor(i / cols), br = Math.floor(best / cols);
    if (r > br || (r === br && i % cols < best % cols)) best = i;
  }
  return best;
}

function specialFor(g: Group): { kind: PieceKind; special: SpecialKind | null } | null {
  if (g.maxLine >= 5) return { kind: 'prism', special: null };
  if (g.hasH && g.hasV) return { kind: g.kind, special: 'bomb' };
  if (g.maxLine === 4) return { kind: g.kind, special: g.lineDir === 'h' ? 'mowerH' : 'mowerV' };
  if (g.square) return { kind: g.kind, special: 'bee' };
  return null;
}

function damageNeighbourStones(ctx: Ctx, i: number): void {
  for (const n of neighbours(ctx.b, i)) damageStone(ctx, n);
}

function applyGroup(ctx: Ctx, g: Group): void {
  const { b } = ctx;
  ctx.ev.push({ type: 'match', cells: g.cells, kind: g.kind, cascade: ctx.cascade });
  const idxs = g.cells.map((p) => idxOf(b, p));
  const spec = specialFor(g);
  const spot = spec ? spotFor(ctx, idxs) : -1;
  for (const i of idxs) {
    const piece = clearCell(ctx, i, 'match');
    if (isPower(piece)) ctx.queue.push({ idx: i, type: typeOf(piece) });
    damageNeighbourStones(ctx, i);
  }
  if (spec) {
    const piece: Piece = { id: b.nextId++, kind: spec.kind, special: spec.special };
    b.cells[spot].piece = piece;
    ctx.ev.push({ type: 'specialCreated', at: posOf(b, spot), piece: { ...piece }, cascade: ctx.cascade });
  }
}

function open(b: Board, r: number, c: number): boolean {
  const cell = b.cells[r * b.cols + c];
  return cell.live && cell.stone === 0;
}

/** Per column, pieces fall to the bottom of each segment of open cells; the empty top cells get new tiles. */
function gravity(ctx: Ctx): void {
  const { b } = ctx;
  const moves: { id: number; from: Pos; to: Pos }[] = [];
  const spawns: { piece: Piece; to: Pos; dropRows: number }[] = [];
  for (let c = 0; c < b.cols; c++) {
    let r = 0;
    while (r < b.rows) {
      if (!open(b, r, c)) {
        r++;
        continue;
      }
      const top = r;
      while (r < b.rows && open(b, r, c)) r++;
      const bottom = r;
      const held: { piece: Piece; from: number }[] = [];
      for (let rr = top; rr < bottom; rr++) {
        const cell = b.cells[rr * b.cols + c];
        if (cell.piece) held.push({ piece: cell.piece, from: rr });
        cell.piece = null;
      }
      const empty = bottom - top - held.length;
      for (let k = 0; k < held.length; k++) {
        const to = bottom - held.length + k;
        const { piece, from } = held[k];
        b.cells[to * b.cols + c].piece = piece;
        if (from !== to) moves.push({ id: piece.id, from: { r: from, c }, to: { r: to, c } });
      }
      for (let rr = top; rr < top + empty; rr++) {
        const piece: Piece = { id: b.nextId++, kind: pick(ctx.rng, b.kinds), special: null };
        b.cells[rr * b.cols + c].piece = piece;
        spawns.push({ piece: { ...piece }, to: { r: rr, c }, dropRows: empty });
      }
    }
  }
  ctx.ev.push({ type: 'fall', cascade: ctx.cascade, moves, spawns });
}

function hasLiveBelow(b: Board, i: number): boolean {
  const c = i % b.cols;
  for (let r = Math.floor(i / b.cols) + 1; r < b.rows; r++) if (b.cells[r * b.cols + c].live) return true;
  return false;
}

/** A gnome with no live cell below it is saved; each save is followed by another fall. */
function saveGnomes(ctx: Ctx): void {
  const { b } = ctx;
  for (;;) {
    let found = -1;
    for (let i = 0; i < b.cells.length && found < 0; i++) {
      const p = b.cells[i].piece;
      if (p && p.kind === 'gnome' && !hasLiveBelow(b, i)) found = i;
    }
    if (found < 0) return;
    const piece = b.cells[found].piece!;
    b.cells[found].piece = null;
    ctx.ev.push({ type: 'gnomeSaved', at: posOf(b, found), pieceId: piece.id });
    gravity(ctx);
  }
}

function runCascades(ctx: Ctx): void {
  const { b } = ctx;
  for (let guard = 0; guard < 500; guard++) {
    drainQueue(ctx);
    for (const g of findGroups(b)) applyGroup(ctx, g);
    drainQueue(ctx);
    if (ctx.cleared === 0) break;
    gravity(ctx);
    saveGnomes(ctx);
    ctx.ev.push({ type: 'cascadeEnd', cascade: ctx.cascade });
    ctx.cascade++;
    ctx.cleared = 0;
    ctx.hitStones.clear();
    ctx.swapA = -1;
    ctx.swapP = -1;
  }
  shuffleCheck(ctx);
}

/** No valid swap left: shuffle the non-gnome pieces among their cells until there are no groups and a swap exists. */
function shuffleCheck(ctx: Ctx): void {
  const { b, rng } = ctx;
  if (hasValidSwap(b)) return;
  const idxs: number[] = [];
  for (let i = 0; i < b.cells.length; i++) {
    const cell = b.cells[i];
    if (holds(cell) && cell.piece!.kind !== 'gnome') idxs.push(i);
  }
  const pieces = idxs.map((i) => b.cells[i].piece!);
  const ok = (): boolean => findGroups(b).length === 0 && hasValidSwap(b);
  let done = false;
  for (let outer = 0; outer < 100 && !done; outer++) {
    for (let t = 0; t < 100 && !done; t++) {
      for (let k = pieces.length - 1; k > 0; k--) {
        const j = randInt(rng, k + 1);
        const tmp = pieces[k];
        pieces[k] = pieces[j];
        pieces[j] = tmp;
      }
      for (let k = 0; k < idxs.length; k++) b.cells[idxs[k]].piece = pieces[k];
      if (ok()) done = true;
    }
    if (!done) {
      for (const p of pieces) if (plainKind(p) !== null) p.kind = pick(rng, b.kinds);
    }
  }
  ctx.ev.push({
    type: 'shuffle',
    pieces: idxs.map((i, k) => ({ id: pieces[k].id, to: posOf(b, i) })),
  });
}
