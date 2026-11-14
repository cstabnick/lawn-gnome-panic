// The host's party state machine: rolls, moves, minigames, coins, the end. Pure TypeScript driven by update(dt).
// Every change makes a new PartyState (v += 1); the countdown alone does not.
import { TIMING, type Phase, type PartyState, type Seat } from '../config';
import { newBoard, rollDie, moveSteps, awardMinigame, advanceTurn, afterMinigame, standings } from '../board/rules';
import { mulberry32, seedFrom, type SeatIndex } from '@lawn/party';
import { pickMinigame } from '../minigames';

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
export function createFlow(init: PartyState, onChange: (s: PartyState) => void): Flow {
  const state = structuredClone(init);
  let resendLeft = TIMING.partyResendS;

  /** A fresh seeded rng for the current version, so a resumed flow stays seeded. */
  const rng = (): (() => number) => mulberry32(seedFrom(state.seed, state.v));

  const emit = (): void => {
    state.v += 1;
    onChange(structuredClone(state));
    resendLeft = TIMING.partyResendS;
  };

  const startRoll = (seat: SeatIndex): void => {
    const r = rng();
    const die = rollDie(r);
    const events = moveSteps(state.board, seat, die, r);
    const hops = events.filter((e) => e.e === 'hop').length;
    const total = hops * TIMING.hopS + TIMING.afterMoveS;
    state.phase = { p: 'move', seat, die, events, left: total, total };
    emit();
  };

  const toRoll = (seat: SeatIndex): void => {
    state.phase = { p: 'roll', seat, left: TIMING.rollAutoS };
    emit();
  };

  const afterMove = (): void => {
    const next = advanceTurn(state.board);
    if (next === 'move') return toRoll(state.board.turn);
    if (next === 'minigame') return startIntro();
    toFinal();
  };

  const startIntro = (): void => {
    const def = pickMinigame(rng(), state.recent);
    state.phase = { p: 'intro', mini: def.meta.id, left: TIMING.introS };
    emit();
  };

  const toFinal = (): void => {
    state.phase = { p: 'final', order: standings(state.board) };
    emit();
  };

  const afterResults = (): void => {
    const next = afterMinigame(state.board);
    if (next === 'move') return toRoll(0);
    toFinal();
  };

  /** Handles one expired timed phase. Returns false when nothing expired. */
  const step = (phase: Phase): boolean => {
    switch (phase.p) {
      case 'roll': {
        const cpu = state.seats[phase.seat]?.cpu === true;
        const cpuDue = cpu && phase.left <= TIMING.rollAutoS - TIMING.cpuRollDelayS;
        if (cpuDue || phase.left <= 0) { startRoll(phase.seat); return true; }
        return false;
      }
      case 'move':
        if (phase.left <= 0) { afterMove(); return true; }
        return false;
      case 'intro':
        if (phase.left <= 0) {
          state.phase = { p: 'mini', mini: phase.mini, seed: seedFrom(state.seed, state.v, 7) };
          emit();
          return true;
        }
        return false;
      case 'results':
        if (phase.left <= 0) { afterResults(); return true; }
        return false;
      default:
        return false;
    }
  };

  return {
    get state() { return state; },

    update(dt: number) {
      const ph = state.phase as Phase & { left?: number };
      if ('left' in ph && typeof ph.left === 'number') ph.left -= dt;

      // Resend the current state so late screens catch up; v is unchanged.
      resendLeft -= dt;
      if (resendLeft <= 0) {
        resendLeft = TIMING.partyResendS;
        onChange(structuredClone(state));
      }

      // Advance through every expired phase (a long dt may expire several).
      for (let guard = 0; guard < 100 && step(state.phase); guard++) { /* keep going */ }
    },

    roll(seat: SeatIndex) {
      const ph = state.phase;
      if (ph.p !== 'roll' || ph.seat !== seat) return;
      startRoll(seat);
    },

    miniFinished(places: number[]) {
      const ph = state.phase;
      if (ph.p !== 'mini') return;
      const coins = awardMinigame(state.board, places);
      state.recent.push(ph.mini);
      if (state.recent.length > 5) state.recent = state.recent.slice(-5);
      state.phase = { p: 'results', mini: ph.mini, places: [...places], coins, left: TIMING.resultsS };
      emit();
    },

    setCpu(seat: SeatIndex) {
      const s = state.seats[seat];
      if (!s || (s.cpu && s.playerId === null)) return;
      s.cpu = true;
      s.playerId = null;
      emit();
    },
  };
}
