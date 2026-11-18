import { describe, expect, it } from 'vitest';
import {
  cellAt,
  createBoard,
  findGroups,
  hasValidSwap,
  listValidSwaps,
  placeSpecial,
  resolveSwap,
  triggerAt,
} from './board';
import { makeRng, pick } from './rng';
import { TILE_KINDS } from './types';
import type { Board, BoardEvent, Cell, LevelDef, Pos, TileKind } from './types';

const KIND: Record<string, TileKind> = { m: 'mushroom', g: 'gem', a: 'acorn', d: 'daisy', c: 'clover', b: 'berry' };

/** Build a board from strings: m g a d c b are plain kinds, '#' a hole, 'G' a gnome. */
function boardFrom(rows: string[]): Board {
  const cells: Cell[] = [];
  let nextId = 1;
  for (const row of rows) {
    for (const ch of row) {
      if (ch === '#') cells.push({ live: false, piece: null, weeds: 0, stone: 0 });
      else if (ch === 'G') cells.push({ live: true, piece: { id: nextId++, kind: 'gnome', special: null }, weeds: 0, stone: 0 });
      else cells.push({ live: true, piece: { id: nextId++, kind: KIND[ch], special: null }, weeds: 0, stone: 0 });
    }
  }
  return { rows: rows.length, cols: rows[0].length, cells, kinds: [...TILE_KINDS], nextId };
}

function level(layout?: string[], kinds = 4): LevelDef {
  return { id: 1, name: 'test', moves: 20, kinds, goals: [], layout, stars: [1, 2, 3], target: 0.5 };
}

const P = (r: number, c: number): Pos => ({ r, c });
const at = (b: Board, r: number, c: number): Cell => cellAt(b, P(r, c))!;

function of<T extends BoardEvent['type']>(events: BoardEvent[], type: T): Extract<BoardEvent, { type: T }>[] {
  return events.filter((e): e is Extract<BoardEvent, { type: T }> => e.type === type);
}

describe('createBoard', () => {
  it('has no groups at rest and a valid swap, for 50 seeds', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const b = createBoard(level(), makeRng(seed));
      expect(findGroups(b)).toEqual([]);
      expect(hasValidSwap(b)).toBe(true);
    }
  });

  it('keeps the same guarantees with only 3 kinds, for 50 seeds', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const b = createBoard(level(undefined, 3), makeRng(seed));
      expect(findGroups(b)).toEqual([]);
      expect(hasValidSwap(b)).toBe(true);
    }
  });

  it('applies layout chars: hole, weeds 2, stone 2, gnome', () => {
    const b = createBoard(level(['..#W', 'sS.g', '....', '....']), makeRng(3));
    expect(at(b, 0, 2).live).toBe(false);
    expect(at(b, 0, 2).piece).toBeNull();
    expect(at(b, 0, 3).weeds).toBe(2);
    expect(at(b, 0, 3).piece).not.toBeNull();
    expect(at(b, 0, 3).piece!.kind).not.toBe('gnome');
    expect(at(b, 1, 0).stone).toBe(1);
    expect(at(b, 1, 0).piece).toBeNull();
    expect(at(b, 1, 1).stone).toBe(2);
    expect(at(b, 1, 1).piece).toBeNull();
    expect(at(b, 1, 3).piece!.kind).toBe('gnome');
    expect(findGroups(b)).toEqual([]);
    expect(hasValidSwap(b)).toBe(true);
  });

  it('gives unique piece ids starting at 1', () => {
    const b = createBoard(level(), makeRng(9));
    const ids = b.cells.map((c) => c.piece!.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.min(...ids)).toBe(1);
    expect(b.nextId).toBe(ids.length + 1);
  });
});

describe('swaps', () => {
  // Swapping (0,2) and (0,3) makes mmm in row 0.
  const threeRow = () => boardFrom(['mmgm', 'gadd', 'cbaa']);

  it('a swap making 3 in a row clears 3 and emits match, clear x3, fall, cascadeEnd', () => {
    const b = threeRow();
    const events = resolveSwap(b, P(0, 2), P(0, 3), makeRng(7));
    const types = events.map((e) => e.type);
    expect(types).toContain('match');
    expect(types).toContain('fall');
    expect(types).toContain('cascadeEnd');
    expect(of(events, 'match')[0].cells.length).toBe(3);
    expect(of(events, 'clear').filter((e) => e.cascade === 0 && e.by === 'match')).toHaveLength(3);
    expect(types.indexOf('match')).toBeLessThan(types.indexOf('fall'));
    expect(types.indexOf('fall')).toBeLessThan(types.indexOf('cascadeEnd'));
  });

  it('an invalid swap returns exactly [swap, swapBack] and leaves the board deep-equal', () => {
    const b = threeRow();
    const before = structuredClone(b);
    const events = resolveSwap(b, P(1, 0), P(1, 1), makeRng(7));
    expect(events).toEqual([
      { type: 'swap', a: P(1, 0), b: P(1, 1) },
      { type: 'swapBack', a: P(1, 0), b: P(1, 1) },
    ]);
    expect(b).toEqual(before);
  });

  it('a stone next to a match loses 1', () => {
    const b = threeRow();
    at(b, 1, 1).piece = null;
    at(b, 1, 1).stone = 2;
    const events = resolveSwap(b, P(0, 2), P(0, 3), makeRng(7));
    const stone = of(events, 'stone')[0];
    expect(stone.at).toEqual(P(1, 1));
    expect(stone.left).toBe(1);
  });

  it('weeds under a cleared tile lose 1', () => {
    const b = threeRow();
    at(b, 0, 0).weeds = 2;
    const events = resolveSwap(b, P(0, 2), P(0, 3), makeRng(7));
    const weeds = of(events, 'weeds').find((e) => e.at.r === 0 && e.at.c === 0);
    expect(weeds?.left).toBe(1);
  });

  it('a gnome on the bottom row after a fall is saved', () => {
    // Gnome at (1,0) falls onto (2,0) once the mushrooms there clear; nothing live is below it.
    const b = boardFrom(['abcd', 'Gbac', 'mmgm']);
    const events = resolveSwap(b, P(2, 2), P(2, 3), makeRng(5));
    const saved = of(events, 'gnomeSaved');
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[0].at).toEqual(P(2, 0));
  });
});

describe('specials from swaps', () => {
  it('4 in a row -> mowerH', () => {
    const b = boardFrom(['mmgmd', 'bcmcb']);
    const events = resolveSwap(b, P(0, 2), P(1, 2), makeRng(2));
    const made = of(events, 'specialCreated')[0];
    expect(made.piece.special).toBe('mowerH');
    expect(made.piece.kind).toBe('mushroom');
    expect(made.at).toEqual(P(0, 2));
  });

  it('4 in a column -> mowerV', () => {
    const b = boardFrom(['mg', 'mb', 'gm', 'ma', 'cd']);
    const events = resolveSwap(b, P(2, 0), P(2, 1), makeRng(2));
    const made = of(events, 'specialCreated')[0];
    expect(made.piece.special).toBe('mowerV');
    expect(made.at).toEqual(P(2, 0));
  });

  it('L shape -> bomb', () => {
    const b = boardFrom(['gamdb', 'abmgc', 'dmgmm', 'bcadg', 'gdcba']);
    const events = resolveSwap(b, P(2, 1), P(2, 2), makeRng(2));
    const made = of(events, 'specialCreated')[0];
    expect(made.piece.special).toBe('bomb');
    expect(made.at).toEqual(P(2, 2));
  });

  it('2x2 -> bee', () => {
    const b = boardFrom(['mmad', 'mgmb', 'cdag', 'badc']);
    const events = resolveSwap(b, P(1, 1), P(1, 2), makeRng(2));
    const made = of(events, 'specialCreated')[0];
    expect(made.piece.special).toBe('bee');
    expect(made.at).toEqual(P(1, 1));
  });

  it('5 in a row -> prism', () => {
    const b = boardFrom(['mmgmm', 'abmcd', 'bcadc', 'dabca', 'cdabd']);
    const events = resolveSwap(b, P(0, 2), P(1, 2), makeRng(2));
    const made = of(events, 'specialCreated')[0];
    expect(made.piece.kind).toBe('prism');
    expect(made.piece.special).toBeNull();
    expect(made.at).toEqual(P(0, 2));
  });
});

describe('special effects', () => {
  it('mowerH fired clears its whole row', () => {
    const b = boardFrom(['mabc', 'dgab', 'cdmb']);
    placeSpecial(b, P(1, 1), 'mowerH');
    const events = triggerAt(b, P(1, 1), makeRng(4));
    const activate = of(events, 'activate')[0];
    expect(activate.special).toBe('mowerH');
    expect(activate.cells).toHaveLength(4);
    expect(activate.cells.every((p) => p.r === 1)).toBe(true);
    const cleared = of(events, 'clear').filter((e) => e.cascade === 0 && e.by === 'special');
    expect(cleared).toHaveLength(4);
    expect(cleared.every((e) => e.at.r === 1)).toBe(true);
  });

  it('bomb clears 3x3', () => {
    const b = boardFrom(['mabcd', 'bcdam', 'cdmab', 'dabcm', 'mbcda']);
    placeSpecial(b, P(2, 2), 'bomb');
    const events = triggerAt(b, P(2, 2), makeRng(4));
    const activate = of(events, 'activate')[0];
    expect(activate.special).toBe('bomb');
    expect(activate.cells).toHaveLength(9);
    const cleared = of(events, 'clear').filter((e) => e.cascade === 0 && e.by === 'special');
    expect(cleared).toHaveLength(9);
  });

  it('fuzz: 300 random valid swaps across 10 seeds keep the board sound', () => {
    let swaps = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const rng = makeRng(seed);
      const pickRng = makeRng(seed * 977);
      const b = createBoard(level(), rng);
      for (let s = 0; s < 30; s++) {
        const valid = listValidSwaps(b);
        expect(valid.length).toBeGreaterThan(0);
        const [a, p] = pick(pickRng, valid);
        resolveSwap(b, a, p, rng);
        swaps++;
        expect(findGroups(b)).toEqual([]);
        const ids = new Set<number>();
        let pieces = 0;
        for (const cell of b.cells) {
          if (cell.live && cell.stone === 0) expect(cell.piece).not.toBeNull();
          if (cell.piece) {
            ids.add(cell.piece.id);
            pieces++;
          }
        }
        expect(ids.size).toBe(pieces);
        expect(hasValidSwap(b)).toBe(true);
      }
    }
    expect(swaps).toBe(300);
  });
});
