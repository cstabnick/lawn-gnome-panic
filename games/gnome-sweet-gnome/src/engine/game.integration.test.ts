// game.ts on the real board (game.test.ts mocks the board).
import { describe, expect, it } from 'vitest';
import { gnomeRush, playSwap, startLevel } from './game';
import { listValidSwaps } from './board';
import { makeRng } from './rng';
import type { LevelDef } from './types';

const level: LevelDef = {
  id: 1, name: 't', moves: 40, kinds: 4, target: 0.5, stars: [100, 200, 300],
  goals: [{ type: 'weeds' }, { type: 'stones' }, { type: 'gnomes' }],
  layout: ['g.......', '........', '..wW....', '........', '....sS..', '........', '........', '........'],
};

describe('game on the real board', () => {
  it('counts weeds, stones and gnomes from a layout', () => {
    const s = startLevel(level, makeRng(1));
    expect(s.goals.map((g) => g.total)).toEqual([3, 3, 1]);
  });
  it('a random game ends and the rush terminates', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const rng = makeRng(seed);
      const s = startLevel({ ...level, goals: [{ type: 'collect', kind: 'gem', count: 10 }] }, rng, ['bomb', 'mower', 'prism']);
      while (s.status === 'playing') {
        const sw = listValidSwaps(s.board);
        const [a, b] = sw[Math.floor(rng() * sw.length)];
        playSwap(s, a, b, rng);
      }
      if (s.status === 'won') {
        gnomeRush(s, rng);
        expect(s.movesLeft).toBe(0);
        expect(s.board.cells.some((c) => c.piece && (c.piece.special || c.piece.kind === 'prism'))).toBe(false);
      }
    }
  });
});
