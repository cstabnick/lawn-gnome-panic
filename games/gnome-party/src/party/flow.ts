// The host's party state machine. STUB: issue 2C fills it in. Keep the exported signatures.
import { TIMING, type PartyState, type Seat } from '../config';
import { newBoard } from '../board/rules';
import { mulberry32, type SeatIndex } from '@lawn/party';

export function newParty(seats: Seat[], rounds: number, seed: number): PartyState {
  return {
    v: 1,
    seed,
    seats,
    board: newBoard(mulberry32(seed), rounds),
    phase: { p: 'roll', seat: 0, left: TIMING.rollAutoS },
    recent: [],
  };
}

export interface Flow {
  readonly state: PartyState;
  update(dt: number): void;
  roll(seat: SeatIndex): void;
  miniFinished(places: number[]): void;
  setCpu(seat: SeatIndex): void;
}

export function createFlow(init: PartyState, onChange: (s: PartyState) => void): Flow {
  const state = structuredClone(init);
  onChange(structuredClone(state));
  return {
    get state() { return state; },
    update() {},
    roll() {},
    miniFinished() {},
    setCpu() {},
  };
}
