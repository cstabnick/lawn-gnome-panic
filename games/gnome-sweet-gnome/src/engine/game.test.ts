import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Board, BoardEvent, Cell, LevelDef, LevelState, PieceKind, Piece, Pos, Rng } from './types';
import { addMoves, applyEvents, cloneState, goalsDone, gnomeRush, playSwap, progress, startLevel, starsFor } from './game';
import { createBoard, placeSpecial, resolveSwap, triggerAt } from './board';
import { TUNING } from '../config';

// The board module is being written separately. These tests replace its functions with controlled fakes,
// so they check only game.ts rules.
vi.mock('./board', async (importOriginal) => {
  const real = await importOriginal<typeof import('./board')>();
  return {
    ...real,
    createBoard: vi.fn(real.createBoard),
    resolveSwap: vi.fn(),
    triggerAt: vi.fn(() => []),
    placeSpecial: vi.fn(),
  };
});

const rng: Rng = () => 0.5;
const p = (r: number, c: number): Pos => ({ r, c });

function level(over: Partial<LevelDef> = {}): LevelDef {
  return { id: 1, name: 'test', moves: 10, kinds: 4, goals: [], stars: [100, 200, 300], target: 0.5, ...over };
}

function emptyMade(): LevelState['made'] {
  return { mowerH: 0, mowerV: 0, bomb: 0, bee: 0, prism: 0 };
}

function stateFor(lvl: LevelDef, over: Partial<LevelState> = {}): LevelState {
  const board: Board = { rows: 1, cols: 1, cells: [{ live: true, piece: null, weeds: 0, stone: 0 }], kinds: ['gem'], nextId: 1 };
  return { level: lvl, board, movesLeft: lvl.moves, movesUsed: 0, score: 0, goals: [], status: 'playing', made: emptyMade(), ...over };
}

/** A board of plain gems, no specials, all cells live. */
function plainBoard(rows = 2, cols = 2): Board {
  const cells: Cell[] = [];
  for (let i = 0; i < rows * cols; i++) cells.push({ live: true, piece: { id: i + 1, kind: 'gem', special: null }, weeds: 0, stone: 0 });
  return { rows, cols, cells, kinds: ['gem', 'acorn'], nextId: rows * cols + 1 };
}

function clear(kind: PieceKind, cascade = 0): BoardEvent {
  return { type: 'clear', at: p(0, 0), pieceId: 1, kind, special: null, by: 'match', cascade };
}

function special(kind: 'mowerH' | 'mowerV' | 'bomb' | 'bee', id = 7): Piece {
  return { id, kind: 'gem', special: kind };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(triggerAt).mockImplementation(() => []);
  vi.mocked(placeSpecial).mockImplementation((b, at) => {
    // Put a fake mower on the cell so the rush can find it as a power piece.
    const cell = b.cells[at.r * b.cols + at.c];
    const piece: Piece = { id: 1000 + at.r * 10 + at.c, kind: 'gem', special: 'mowerH' };
    cell.piece = piece;
    return piece;
  });
});

describe('startLevel', () => {
  it('sets moves, score, status and made, and one goal state per goal', () => {
    vi.mocked(createBoard).mockReturnValueOnce(plainBoard());
    const s = startLevel(level({ moves: 12, goals: [{ type: 'collect', kind: 'gem', count: 7 }] }), rng);
    expect(s.movesLeft).toBe(12);
    expect(s.movesUsed).toBe(0);
    expect(s.score).toBe(0);
    expect(s.status).toBe('playing');
    expect(s.made).toEqual(emptyMade());
    expect(s.goals).toHaveLength(1);
    expect(s.goals[0]).toMatchObject({ total: 7, left: 7 });
  });


  it('places one special per booster on a plain tile', () => {
    vi.mocked(createBoard).mockReturnValueOnce(plainBoard());
    vi.mocked(placeSpecial).mockReturnValue(null);
    startLevel(level(), rng, ['mower', 'bomb', 'prism']);
    const calls = vi.mocked(placeSpecial).mock.calls;
    expect(calls).toHaveLength(3);
    expect(['mowerH', 'mowerV']).toContain(calls[0][2]);
    expect(calls[1][2]).toBe('bomb');
    expect(calls[2][2]).toBe('prism');
  });
});

describe('applyEvents', () => {
  it('collect counts only its own kind', () => {
    const s = stateFor(level(), { goals: [{ goal: { type: 'collect', kind: 'gem', count: 5 }, total: 5, left: 5 }] });
    applyEvents(s, [clear('gem'), clear('gem'), clear('acorn'), clear('mushroom')]);
    expect(s.goals[0].left).toBe(3);
  });

  it('collect never goes below 0', () => {
    const s = stateFor(level(), { goals: [{ goal: { type: 'collect', kind: 'gem', count: 1 }, total: 1, left: 1 }] });
    applyEvents(s, [clear('gem'), clear('gem'), clear('gem')]);
    expect(s.goals[0].left).toBe(0);
  });

  it('gives a cascade score multiplier', () => {
    const s = stateFor(level());
    applyEvents(s, [clear('gem', 0), clear('gem', 2)]);
    expect(s.score).toBe(TUNING.scorePerTile * 1 + TUNING.scorePerTile * 3);
  });

  it('counts a saved gnome as score and a gnomes goal', () => {
    const s = stateFor(level(), { goals: [{ goal: { type: 'gnomes' }, total: 2, left: 2 }] });
    applyEvents(s, [{ type: 'gnomeSaved', at: p(0, 0), pieceId: 3 }]);
    expect(s.score).toBe(TUNING.scoreGnomeSaved);
    expect(s.goals[0].left).toBe(1);
  });

  it('counts weeds and stones events on their goals', () => {
    const s = stateFor(level(), {
      goals: [
        { goal: { type: 'weeds' }, total: 2, left: 2 },
        { goal: { type: 'stones' }, total: 1, left: 1 },
      ],
    });
    applyEvents(s, [
      { type: 'weeds', at: p(0, 0), left: 1 },
      { type: 'weeds', at: p(0, 0), left: 0 },
      { type: 'stone', at: p(0, 0), left: 0 },
    ]);
    expect(s.goals[0].left).toBe(0);
    expect(s.goals[1].left).toBe(0);
  });

  it('counts specialCreated in made, including prisms', () => {
    const s = stateFor(level());
    applyEvents(s, [
      { type: 'specialCreated', at: p(0, 0), piece: special('bomb'), cascade: 0 },
      { type: 'specialCreated', at: p(0, 0), piece: { id: 9, kind: 'prism', special: null }, cascade: 0 },
    ]);
    expect(s.made.bomb).toBe(1);
    expect(s.made.prism).toBe(1);
    expect(s.score).toBe(TUNING.scoreSpecialMade * 2);
  });
});

describe('starsFor', () => {
  it('gives 0 when lost, whatever the score', () => {
    expect(starsFor(level(), 999, false)).toBe(0);
  });

  it('gives at least 1 on a win', () => {
    expect(starsFor(level(), 0, true)).toBe(1);
  });

  it('gives 3 at the top threshold', () => {
    expect(starsFor(level(), 300, true)).toBe(3);
    expect(starsFor(level(), 200, true)).toBe(2);
  });
});

describe('playSwap', () => {
  it('ignores a swapBack result: no move used', () => {
    const s = stateFor(level({ moves: 5 }));
    const events: BoardEvent[] = [
      { type: 'swap', a: p(0, 0), b: p(0, 1) },
      { type: 'swapBack', a: p(0, 0), b: p(0, 1) },
    ];
    vi.mocked(resolveSwap).mockReturnValueOnce(events);
    expect(playSwap(s, p(0, 0), p(0, 1), rng)).toEqual(events);
    expect(s.movesLeft).toBe(5);
    expect(s.movesUsed).toBe(0);
  });

  it('uses a move and wins when the goals are done', () => {
    const s = stateFor(level({ moves: 5 }), { goals: [{ goal: { type: 'collect', kind: 'gem', count: 1 }, total: 1, left: 1 }] });
    vi.mocked(resolveSwap).mockReturnValueOnce([{ type: 'swap', a: p(0, 0), b: p(0, 1) }, clear('gem')]);
    playSwap(s, p(0, 0), p(0, 1), rng);
    expect(s.movesLeft).toBe(4);
    expect(s.movesUsed).toBe(1);
    expect(s.status).toBe('won');
  });

  it('loses when the last move is used and goals are not done', () => {
    const s = stateFor(level({ moves: 1 }), { goals: [{ goal: { type: 'collect', kind: 'gem', count: 3 }, total: 3, left: 3 }] });
    vi.mocked(resolveSwap).mockReturnValueOnce([{ type: 'swap', a: p(0, 0), b: p(0, 1) }]);
    playSwap(s, p(0, 0), p(0, 1), rng);
    expect(s.status).toBe('lost');
  });

  it('does nothing when the status is won', () => {
    const s = stateFor(level(), { status: 'won' });
    expect(playSwap(s, p(0, 0), p(0, 1), rng)).toEqual([]);
    expect(resolveSwap).not.toHaveBeenCalled();
    expect(s.movesLeft).toBe(10);
  });
});

describe('addMoves', () => {
  it('turns lost into playing and adds moves', () => {
    const s = stateFor(level({ moves: 0 }), { status: 'lost', movesLeft: 0 });
    addMoves(s, 5);
    expect(s.status).toBe('playing');
    expect(s.movesLeft).toBe(5);
  });
});

describe('gnomeRush', () => {
  it('does nothing unless the level is won', () => {
    const s = stateFor(level(), { movesLeft: 4, status: 'lost' });
    expect(gnomeRush(s, rng)).toEqual([]);
    expect(s.movesLeft).toBe(4);
  });

  it('turns each move left into a mower and scores it, without counting those mowers as made', () => {
    const s = stateFor(level(), { status: 'won', movesLeft: 3, board: plainBoard() });
    const events = gnomeRush(s, rng);
    expect(s.movesLeft).toBe(0);
    expect(s.score).toBe(3 * TUNING.scoreRushPerMove);
    expect(events.filter((e) => e.type === 'specialCreated')).toHaveLength(3);
    expect(s.made).toEqual(emptyMade());
  });

  it('places at most 15 mowers', () => {
    const s = stateFor(level(), { status: 'won', movesLeft: 20, board: plainBoard(8, 8) });
    const events = gnomeRush(s, rng);
    expect(events.filter((e) => e.type === 'specialCreated')).toHaveLength(15);
    expect(s.score).toBe(15 * TUNING.scoreRushPerMove);
  });

  it('fires power pieces, stops when triggerAt returns nothing, and scores the rush clears', () => {
    const s = stateFor(level(), { status: 'won', movesLeft: 1, board: plainBoard(), goals: [] });
    vi.mocked(triggerAt).mockReturnValueOnce([clear('gem', 0)]);
    const events = gnomeRush(s, rng);
    expect(triggerAt).toHaveBeenCalledTimes(2); // first fires a clear, second finds nothing and stops
    expect(events.some((e) => e.type === 'clear')).toBe(true);
    expect(s.score).toBe(TUNING.scoreRushPerMove + TUNING.scorePerTile);
  });
});

describe('cloneState', () => {
  it('returns a copy whose goals and made can change without touching the original', () => {
    const s = stateFor(level(), { goals: [{ goal: { type: 'weeds' }, total: 2, left: 2 }] });
    const c = cloneState(s);
    c.goals[0].left = 0;
    c.made.bomb = 4;
    expect(s.goals[0].left).toBe(2);
    expect(s.made.bomb).toBe(0);
    expect(c.level).toBe(s.level);
  });
});

describe('progress and goalsDone', () => {
  it('sums goal progress', () => {
    const s = stateFor(level(), {
      goals: [
        { goal: { type: 'collect', kind: 'gem', count: 4 }, total: 4, left: 1 },
        { goal: { type: 'collect', kind: 'acorn', count: 6 }, total: 6, left: 6 },
      ],
    });
    expect(progress(s)).toBeCloseTo(0.3);
    expect(goalsDone(s)).toBe(false);
  });

  it('is 1 when the goals have no total', () => {
    expect(progress(stateFor(level()))).toBe(1);
  });
});
