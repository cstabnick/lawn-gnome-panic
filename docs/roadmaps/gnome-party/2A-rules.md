~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
The board's rules as pure functions with unit tests: make a board, roll, move with stars and coins, pay minigame coins, advance turns, rank the final standings.

## Read first
- games/gnome-party/src/config.ts: BOARD (all numbers), BoardState, PlayerBoard, SpaceKind, MoveEvent
- packages/party/src/rng.ts: mulberry32 (import from '@lawn/party')
- games/gnome-party/src/board/rules.ts: the stub you replace

## Change
- games/gnome-party/src/board/rules.ts: implement the Contract. No three, no DOM: pure TypeScript.
- games/gnome-party/src/board/rules.test.ts (new): vitest tests, listed under Done when.

## Contract (keep these exports exactly)
import type { BoardState, MoveEvent } from '../config';
import type { SeatIndex } from '@lawn/party';

export function newBoard(rng: () => number, rounds: number): BoardState;
// BOARD.spaces spaces; space 0 'blue'; exactly Math.round(BOARD.spaces * BOARD.redShare) red spaces at
// random indexes 1..spaces-1 (no two reds adjacent if possible); starAt = random index in [spaces/2-3, spaces/2+3];
// 4 players at space 0 with BOARD.startCoins coins, 0 stars; round 1; turn 0.

export function rollDie(rng: () => number): number;          // 1..BOARD.dieSides, uniform

export function moveSteps(b: BoardState, seat: SeatIndex, steps: number, rng: () => number): MoveEvent[];
// Mutates b. For each of `steps` hops: space = (space + 1) % spaces, push {e:'hop', to}. Whenever the token enters
// the star's space (passing or landing): if coins >= BOARD.starCost, coins -= starCost, stars += 1,
// push {e:'star', bought:true}, then move starAt to a random space that is not the current one and not within
// 3 spaces of it and push {e:'starMoved', to}; otherwise push {e:'star', bought:false}.
// After the last hop: blue => +BOARD.blueCoins, red => BOARD.redCoins (coins never below 0); push
// {e:'coins', delta} with the ACTUAL change (0 is still pushed).

export function awardMinigame(b: BoardState, places: readonly number[]): number[];
// places[seat]: 0 = 1st, ties share a place. Each seat gets BOARD.miniCoins[places[seat]] (index clamped to the array).
// Mutates coins; returns the coins given per seat.

export type NextStep = 'move' | 'minigame' | 'over';
export function advanceTurn(b: BoardState): NextStep;
// Called after a move finished. If turn < 3: turn += 1, return 'move'. Else (all four moved): return 'minigame'
// and leave turn as is.
export function afterMinigame(b: BoardState): NextStep;
// Called after the minigame's coins are paid. If round === rounds: return 'over'. Else round += 1, turn = 0, return 'move'.

export function standings(b: BoardState): SeatIndex[];
// Seats best first: more stars, then more coins, then lower seat index.

## Done when
- `npx tsc --noEmit -p games/gnome-party` passes (from the repo root).
- `npx vitest run src/board/rules.test.ts` (from games/gnome-party) passes, with tests for: newBoard has the right red count
  and space 0 blue and is the same for the same seed; rollDie stays in 1..6 over 1000 rolls; passing the star with 20 coins
  buys it and moves it, with 19 does not; landing on red with 2 coins gives delta -2 and 0 coins; wrapping past space 23 to 0;
  awardMinigame with ties [0,0,2,3] pays [10,10,2,0]; advanceTurn/afterMinigame sequence over a 2-round board ends with 'over';
  standings orders by stars then coins.

## Out of scope
Everything outside the two files above. flow.ts (another worker) calls these functions; do not change their signatures.
~~~~
