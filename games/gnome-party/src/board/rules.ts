// The board's rules as pure functions. STUB: issue 2A fills it in. Keep the exported signatures.
import { BOARD, type BoardState, type MoveEvent } from '../config';
import type { SeatIndex } from '@lawn/party';

export function newBoard(rng: () => number, rounds: number): BoardState {
  void rng;
  return {
    spaces: Array.from({ length: BOARD.spaces }, () => 'blue' as const),
    starAt: BOARD.spaces / 2,
    players: [0, 1, 2, 3].map(() => ({ space: 0, coins: BOARD.startCoins, stars: 0 })),
    round: 1,
    rounds,
    turn: 0,
  };
}

export function rollDie(rng: () => number): number {
  return 1 + Math.floor(rng() * BOARD.dieSides);
}

export function moveSteps(b: BoardState, seat: SeatIndex, steps: number, rng: () => number): MoveEvent[] {
  void rng;
  const events: MoveEvent[] = [];
  const p = b.players[seat];
  for (let i = 0; i < steps; i++) {
    p.space = (p.space + 1) % b.spaces.length;
    events.push({ e: 'hop', to: p.space });
  }
  return events;
}

export function awardMinigame(b: BoardState, places: readonly number[]): number[] {
  return places.map((place, seat) => {
    const coins = BOARD.miniCoins[Math.min(place, BOARD.miniCoins.length - 1)];
    b.players[seat].coins += coins;
    return coins;
  });
}

export type NextStep = 'move' | 'minigame' | 'over';

export function advanceTurn(b: BoardState): NextStep {
  if (b.turn < 3) {
    b.turn = (b.turn + 1) as SeatIndex;
    return 'move';
  }
  return 'minigame';
}

export function afterMinigame(b: BoardState): NextStep {
  if (b.round >= b.rounds) return 'over';
  b.round += 1;
  b.turn = 0;
  return 'move';
}

export function standings(b: BoardState): SeatIndex[] {
  return ([0, 1, 2, 3] as SeatIndex[]).sort((x, y) => b.players[y].stars - b.players[x].stars || b.players[y].coins - b.players[x].coins || x - y);
}
