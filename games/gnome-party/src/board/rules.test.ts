import { describe, it, expect } from 'vitest';
import { mulberry32 } from '@lawn/party';
import { BOARD, type BoardState, type SpaceKind } from '../config';
import { newBoard, rollDie, moveSteps, awardMinigame, advanceTurn, afterMinigame, standings } from './rules';

function plainBoard(over: Partial<BoardState> = {}): BoardState {
  return {
    spaces: Array.from({ length: BOARD.spaces }, () => 'blue' as SpaceKind),
    starAt: 12,
    players: [0, 1, 2, 3].map(() => ({ space: 0, coins: BOARD.startCoins, stars: 0 })),
    round: 1,
    rounds: 6,
    turn: 0,
    ...over,
  };
}

function ringDistance(a: number, b: number): number {
  const n = BOARD.spaces;
  const d = Math.abs(a - b) % n;
  return Math.min(d, n - d);
}

describe('newBoard', () => {
  it('has the right red count, space 0 blue, and is the same for the same seed', () => {
    const b = newBoard(mulberry32(7), 6);
    const reds = b.spaces.filter((s) => s === 'red').length;
    expect(b.spaces.length).toBe(BOARD.spaces);
    expect(reds).toBe(Math.round(BOARD.spaces * BOARD.redShare));
    expect(b.spaces[0]).toBe('blue');
    expect(b.starAt).toBeGreaterThanOrEqual(BOARD.spaces / 2 - 3);
    expect(b.starAt).toBeLessThanOrEqual(BOARD.spaces / 2 + 3);
    expect(b.players.every((p) => p.space === 0 && p.coins === BOARD.startCoins && p.stars === 0)).toBe(true);
    expect(b.round).toBe(1);
    expect(b.turn).toBe(0);
    expect(newBoard(mulberry32(7), 6)).toEqual(b);
  });
});

describe('rollDie', () => {
  it('stays in 1..6 over 1000 rolls', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1000; i++) {
      const r = rollDie(rng);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(6);
    }
  });
});

describe('moveSteps', () => {
  it('buys the star when passing it with 20 coins and moves it away', () => {
    const b = plainBoard({ starAt: 5 });
    b.players[0] = { space: 3, coins: 20, stars: 0 };
    const events = moveSteps(b, 0, 2, mulberry32(1));
    expect(events).toContainEqual({ e: 'star', bought: true });
    expect(b.players[0].stars).toBe(1);
    expect(b.starAt).not.toBe(5);
    expect(ringDistance(b.starAt, 5)).toBeGreaterThan(3);
    expect(events).toContainEqual({ e: 'starMoved', to: b.starAt });
    // 20 - 20 for the star, then +3 for the blue landing on space 5.
    expect(b.players[0].coins).toBe(BOARD.blueCoins);
  });

  it('does not buy the star with 19 coins', () => {
    const b = plainBoard({ starAt: 5 });
    b.players[0] = { space: 3, coins: 19, stars: 0 };
    const events = moveSteps(b, 0, 2, mulberry32(1));
    expect(events).toContainEqual({ e: 'star', bought: false });
    expect(events.some((ev) => ev.e === 'starMoved')).toBe(false);
    expect(b.starAt).toBe(5);
    expect(b.players[0].stars).toBe(0);
    expect(b.players[0].coins).toBe(19 + BOARD.blueCoins);
  });

  it('pays a red landing with the coins it can afford, never below 0', () => {
    const b = plainBoard({ starAt: 12 });
    b.spaces[1] = 'red';
    b.players[0] = { space: 0, coins: 2, stars: 0 };
    const events = moveSteps(b, 0, 1, mulberry32(1));
    expect(events).toContainEqual({ e: 'coins', delta: -2 });
    expect(b.players[0].space).toBe(1);
    expect(b.players[0].coins).toBe(0);
  });

  it('wraps past space 23 to space 0', () => {
    const b = plainBoard({ starAt: 12 });
    b.players[0] = { space: 23, coins: BOARD.startCoins, stars: 0 };
    const events = moveSteps(b, 0, 1, mulberry32(1));
    expect(events[0]).toEqual({ e: 'hop', to: 0 });
    expect(b.players[0].space).toBe(0);
  });
});

describe('awardMinigame', () => {
  it('pays ties by the better place: [0,0,2,3] gives [10,10,2,0]', () => {
    const b = plainBoard();
    expect(awardMinigame(b, [0, 0, 2, 3])).toEqual([10, 10, 2, 0]);
    expect(b.players.map((p) => p.coins)).toEqual([20, 20, 12, 10]);
  });
});

describe('turn and round sequence', () => {
  it('ends with over after two rounds', () => {
    const b = newBoard(mulberry32(3), 2);
    const steps: string[] = [];
    for (let round = 0; round < 2; round++) {
      // Each round: four moves, advanceTurn after each; the fourth returns 'minigame'.
      for (let t = 0; t < 4; t++) steps.push(advanceTurn(b));
      if (round === 0) steps.push(afterMinigame(b));
    }
    steps.push(afterMinigame(b));
    expect(steps).toEqual([
      'move', 'move', 'move', 'minigame', // round 1 turns
      'move', // afterMinigame into round 2
      'move', 'move', 'move', 'minigame', // round 2 turns
      'over', // afterMinigame ends the game
    ]);
    expect(b.round).toBe(2);
  });

  it('returns move from afterMinigame on the first round and resets the turn', () => {
    const b = plainBoard({ rounds: 2, turn: 3 });
    expect(afterMinigame(b)).toBe('move');
    expect(b.round).toBe(2);
    expect(b.turn).toBe(0);
  });
});

describe('standings', () => {
  it('orders by stars, then coins, then seat index', () => {
    const b = plainBoard();
    b.players = [
      { space: 0, coins: 5, stars: 1 },
      { space: 0, coins: 0, stars: 2 },
      { space: 0, coins: 9, stars: 1 },
      { space: 0, coins: 9, stars: 1 },
    ];
    expect(standings(b)).toEqual([1, 2, 3, 0]);
  });
});
