// The board's rules as pure functions. No three, no DOM.
import { BOARD, type BoardState, type MoveEvent, type SpaceKind } from '../config';
import type { SeatIndex } from '@lawn/party';

function pick<T>(items: readonly T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

/** Distance between two spaces going either way round the ring. */
function ringDistance(a: number, b: number): number {
  const n = BOARD.spaces;
  const d = Math.abs(a - b) % n;
  return Math.min(d, n - d);
}

export function newBoard(rng: () => number, rounds: number): BoardState {
  const n = BOARD.spaces;
  const spaces: SpaceKind[] = Array.from({ length: n }, () => 'blue' as SpaceKind);

  // Shuffle the candidates 1..n-1 (Fisher-Yates), then take reds: first pass skips neighbours of reds
  // already taken, second pass fills up any shortfall ignoring adjacency.
  const order: number[] = [];
  for (let i = 1; i < n; i++) order.push(i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const want = Math.round(n * BOARD.redShare);
  const reds: number[] = [];
  for (const i of order) {
    if (reds.length >= want) break;
    if (reds.some((r) => ringDistance(r, i) === 1)) continue;
    reds.push(i);
  }
  for (const i of order) {
    if (reds.length >= want) break;
    if (!reds.includes(i)) reds.push(i);
  }
  for (const i of reds) spaces[i] = 'red';

  const mid = Math.round(n / 2);
  const starAt = mid - 3 + Math.floor(rng() * 7);

  return {
    spaces,
    starAt,
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
  const n = b.spaces.length;
  const events: MoveEvent[] = [];
  const p = b.players[seat];
  for (let i = 0; i < steps; i++) {
    p.space = (p.space + 1) % n;
    events.push({ e: 'hop', to: p.space });
    if (p.space !== b.starAt) continue;
    if (p.coins >= BOARD.starCost) {
      p.coins -= BOARD.starCost;
      p.stars += 1;
      events.push({ e: 'star', bought: true });
      const far: number[] = [];
      for (let s = 0; s < n; s++) if (ringDistance(s, p.space) > 3) far.push(s);
      b.starAt = pick(far, rng);
      events.push({ e: 'starMoved', to: b.starAt });
    } else {
      events.push({ e: 'star', bought: false });
    }
  }
  // Landing payout only when the token actually moved.
  if (steps > 0) {
    const want = b.spaces[p.space] === 'blue' ? BOARD.blueCoins : BOARD.redCoins;
    const before = p.coins;
    p.coins = Math.max(0, before + want);
    events.push({ e: 'coins', delta: p.coins - before });
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
  return ([0, 1, 2, 3] as SeatIndex[]).sort(
    (x, y) => b.players[y].stars - b.players[x].stars || b.players[y].coins - b.players[x].coins || x - y,
  );
}
