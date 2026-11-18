// The pure match-3 engine contract. No Phaser, no DOM: the game, the bots and the tests all use it.

export type Rng = () => number; // [0, 1)

export type TileKind = 'mushroom' | 'gem' | 'acorn' | 'daisy' | 'clover' | 'berry';
/** A level with `kinds: n` uses the first n of these. */
export const TILE_KINDS: readonly TileKind[] = ['mushroom', 'gem', 'acorn', 'daisy', 'clover', 'berry'];

/** What a piece is. 'prism' (rainbow gem) and 'gnome' (lost gnome drop item) never match by colour. */
export type PieceKind = TileKind | 'prism' | 'gnome';

/**
 * Specials ride on a coloured tile (kind is a TileKind) and still match by that colour.
 * mowerH clears its row, mowerV its column, bomb a 3x3 square, bee clears its plus-shape and then flies to
 * one target cell and hits it. The prism is a PieceKind, not a special.
 */
export type SpecialKind = 'mowerH' | 'mowerV' | 'bomb' | 'bee';

export interface Piece {
  /** Unique per board, never reused; the view keys sprites by it. */
  id: number;
  kind: PieceKind;
  /** Only on TileKind pieces. Always null for 'prism' and 'gnome'. */
  special: SpecialKind | null;
}

export interface Cell {
  /** False for a hole: not part of the board, never holds anything. Pieces do not fall through holes. */
  live: boolean;
  piece: Piece | null;
  /** Weeds under the piece, 0..2. Clearing the piece on this cell removes one layer. */
  weeds: number;
  /** Garden stone, 0..2. A cell with stone > 0 holds no piece and blocks gravity. Hit by a clear next to it
   *  (4-neighbour) or by a special's area; each stone loses at most 1 per cascade step. */
  stone: number;
}

export interface Pos {
  r: number; // row, 0 = top
  c: number; // column, 0 = left
}

export interface Board {
  rows: number;
  cols: number;
  /** Row-major: cells[r * cols + c]. */
  cells: Cell[];
  /** Tile kinds this board spawns. */
  kinds: TileKind[];
  /** Next Piece.id to hand out. */
  nextId: number;
}

export type GoalDef =
  | { type: 'collect'; kind: TileKind; count: number } // clear this many tiles of a kind (match or special)
  | { type: 'weeds' } // clear every weed layer on the board
  | { type: 'stones' } // break every stone layer on the board
  | { type: 'gnomes' }; // bring every lost gnome down to the bottom

export interface LevelDef {
  id: number; // 1-based
  name: string;
  moves: number;
  /** 3..6: uses TILE_KINDS.slice(0, kinds). Fewer kinds = more matches = easier. */
  kinds: number;
  goals: GoalDef[];
  /**
   * Optional board layout, one string per row, all the same length (rows x cols come from it; default 8x8 all '.').
   * '.' normal cell   '#' hole   'w' weeds 1   'W' weeds 2   's' stone 1   'S' stone 2
   * 'g' lost gnome on a normal cell. A gnome is saved when it sits on the last live cell of its column
   *     (no live cell anywhere below it) after a fall.
   */
  layout?: string[];
  /** Score needed for 1, 2 and 3 stars. Winning always gives at least 1 star. */
  stars: [number, number, number];
  /** Intended win rate of the 'smart' bot (a decent human), 0..1. The assessment tool checks levels against it. */
  target: number;
}

export type BoosterKind = 'mower' | 'bomb' | 'prism';

/**
 * What happened during a swap, in order. The view animates these one after another; the game counts goals
 * and score from them. Positions are where things are at the moment of the event.
 */
export type BoardEvent =
  | { type: 'swap'; a: Pos; b: Pos } // pieces at a and b exchanged
  | { type: 'swapBack'; a: Pos; b: Pos } // invalid swap: they went back (board unchanged, no move used)
  | { type: 'match'; cells: Pos[]; kind: TileKind; cascade: number } // one match group, before its clears
  | { type: 'activate'; at: Pos; special: SpecialKind | 'prism'; cells: Pos[]; target?: Pos; cascade: number } // a special/prism fired; cells = area it hits; target = bee's destination
  | { type: 'combo'; at: Pos; a: SpecialKind | 'prism'; b: SpecialKind | 'prism'; cells: Pos[]; cascade: number } // two specials swapped together
  | { type: 'clear'; at: Pos; pieceId: number; kind: PieceKind; special: SpecialKind | null; by: 'match' | 'special'; cascade: number }
  | { type: 'specialCreated'; at: Pos; piece: Piece; cascade: number } // a new special/prism appeared at `at`
  | { type: 'weeds'; at: Pos; left: number }
  | { type: 'stone'; at: Pos; left: number }
  | { type: 'gnomeSaved'; at: Pos; pieceId: number }
  | {
      type: 'fall';
      cascade: number;
      moves: { id: number; from: Pos; to: Pos }[]; // existing pieces dropping
      spawns: { piece: Piece; to: Pos; dropRows: number }[]; // new pieces; start dropRows cells above `to`
    }
  | { type: 'shuffle'; pieces: { id: number; to: Pos }[] } // no valid swap was left: pieces rearranged
  | { type: 'cascadeEnd'; cascade: number };

export interface GoalState {
  goal: GoalDef;
  /** Still to do. 0 = done. */
  left: number;
  total: number;
}

export interface LevelState {
  level: LevelDef;
  board: Board;
  movesLeft: number;
  movesUsed: number;
  score: number;
  goals: GoalState[];
  status: 'playing' | 'won' | 'lost';
  /** Specials created so far, by kind ('prism' included). For stats and tests. */
  made: Record<SpecialKind | 'prism', number>;
}
