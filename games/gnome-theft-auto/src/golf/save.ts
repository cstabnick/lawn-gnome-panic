// Hedgeworth's save, gta-golf-v1 (STUB: issue A3 fills it in).
import { GOLF_SAVE_KEY, HOLES, type GolfSave, type GolfStore } from './types';

export function emptyGolfSave(): GolfSave {
  return { v: 1, boardBroken: false, holesPlayed: 0, parHoles: 0, rounds: 0, best: HOLES.map(() => null), bestRound: null, aces: 0, ballsFound: [], molehills: [] };
}
export function parseGolfSave(_raw: string | null): GolfSave { return emptyGolfSave(); }
export function mergeGolfSave(a: string, _b: string): string { return a; }
export function createGolfStore(_storage?: Pick<Storage, 'getItem' | 'setItem'>): GolfStore {
  void GOLF_SAVE_KEY;
  const d = emptyGolfSave();
  return {
    data: () => d,
    breakBoard() {},
    recordHole() {},
    recordRound() {},
    findBall: () => false,
    flattenMolehill: () => false,
  };
}
