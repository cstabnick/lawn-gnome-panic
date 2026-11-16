~~~~text
Epic: 2 Systems and the golf and bowling slices
Depends on: none

## Goal
The host's party state machine: rolls (CPU and human), moves, picks and starts minigames, pays coins, ends the party. Pure TypeScript driven by update(dt); every change produces a new PartyState.

## Read first
- games/gnome-party/src/config.ts: PartyState, Phase, Seat, BOARD, TIMING
- games/gnome-party/src/board/rules.ts: the stub of rules (another worker fills it); use only the Contract signatures below
- games/gnome-party/src/minigames.ts: pickMinigame(rng, recent), minigameById(id)
- packages/party/src/rng.ts: mulberry32, seedFrom (import them from '@lawn/party')
- games/gnome-party/src/party/flow.ts: the stub you replace

## Change
- games/gnome-party/src/party/flow.ts: implement the Contract.
- games/gnome-party/src/party/flow.test.ts (new): vitest.

## Contract (keep these exports exactly)
import type { PartyState, Seat } from '../config';
import type { SeatIndex } from '@lawn/party';

export function newParty(seats: Seat[], rounds: number, seed: number): PartyState;
// v = 1, board = newBoard(mulberry32(seed), rounds), phase = { p:'roll', seat:0, left: TIMING.rollAutoS }, recent = [].

export interface Flow {
  readonly state: PartyState;
  /** Host, every frame: counts phase.left down and advances phases. */
  update(dt: number): void;
  /** A human asked to roll. Ignored unless phase is 'roll' for that seat. */
  roll(seat: SeatIndex): void;
  /** The runner reports the minigame's places. Ignored unless phase is 'mini'. */
  miniFinished(places: number[]): void;
  /** A human left: their seat becomes a CPU (seat.cpu = true, playerId = null, name unchanged). */
  setCpu(seat: SeatIndex): void;
}
/** Takes over `init` (a new party or the last state a new host received) and continues from it. */
export function createFlow(init: PartyState, onChange: (s: PartyState) => void): Flow;

Rules from rules.ts (signatures fixed; another worker implements them):
  rollDie(rng: () => number): number
  moveSteps(b: BoardState, seat: SeatIndex, steps: number, rng: () => number): MoveEvent[]   // mutates b
  awardMinigame(b: BoardState, places: readonly number[]): number[]                         // mutates b, returns coins per seat
  advanceTurn(b: BoardState): 'move' | 'minigame' | 'over'
  afterMinigame(b: BoardState): 'move' | 'minigame' | 'over'
  standings(b: BoardState): SeatIndex[]

Behaviour:
- Keep a working copy (structuredClone(init)). Every change: v += 1, call onChange(structuredClone(state)).
  Also call onChange with the current state every TIMING.partyResendS seconds (v unchanged) so late screens catch up.
- rng = mulberry32(seedFrom(state.seed, state.v)) recreated whenever needed, so a resumed flow does not repeat the old host's rolls exactly but stays seeded.
- 'roll': CPU seat rolls once left <= TIMING.rollAutoS - TIMING.cpuRollDelayS; a human rolls on roll(seat) or when left reaches 0.
  Rolling: die = rollDie, events = moveSteps(...), total = events.filter(e => e.e === 'hop').length * TIMING.hopS + TIMING.afterMoveS,
  phase = { p:'move', seat, die, events, left: total, total }.
- 'move' at left <= 0: advanceTurn → 'move' gives { p:'roll', seat: board.turn, left: TIMING.rollAutoS };
  'minigame' → def = pickMinigame(rng, recent), phase = { p:'intro', mini: def.meta.id, left: TIMING.introS }.
- 'intro' at left <= 0 → { p:'mini', mini, seed: seedFrom(state.seed, state.v, 7) } (no countdown here; the runner has one).
- miniFinished(places) → coins = awardMinigame(board, places), recent.push(mini) (keep the last 5),
  phase = { p:'results', mini, places, coins, left: TIMING.resultsS }.
- 'results' at left <= 0: afterMinigame → 'move' gives a 'roll' phase for seat 0; 'over' gives { p:'final', order: standings(board) }.
- 'final' never ends (the menu offers to leave).
- update() only decrements left by dt; it does not call onChange for the countdown alone (other screens count down locally).

## Done when
- `npx tsc --noEmit -p games/gnome-party` passes.
- `npx vitest run src/party/flow.test.ts` (from games/gnome-party) passes. Because rules.ts may still be a stub while you work,
  the test mocks it: `vi.mock('../board/rules', () => ({ newBoard: ..., rollDie: () => 3, moveSteps: () => [{e:'hop',to:1},{e:'hop',to:2},{e:'hop',to:3}],
  awardMinigame: () => [10,5,2,0], advanceTurn: ..., afterMinigame: ..., standings: () => [0,1,2,3] }))` with a small counter for turns.
  Test: 4 CPUs over 1 round reach 'intro' then (after miniFinished) 'results' then 'final' when update(0.1) is called repeatedly;
  a human seat waits in 'roll' until roll(seat) or rollAutoS passes; roll() for the wrong seat is ignored; v strictly increases
  on every onChange that changes state; createFlow from a mid-party state continues from that phase.

## Out of scope
rules.ts (another worker), main.ts, net.ts. Do not change the signatures above.
~~~~
