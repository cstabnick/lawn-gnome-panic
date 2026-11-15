// Gnome Party: tuning numbers and every shared type. Tweak numbers here, not in the modules.
import type { SeatIndex, SeatInfo } from '@lawn/party';

export const GAME_ID = 'gnome-party' as const;

/** Offline seat colours (online seats use the server's PlayerInfo.color). */
export const SEAT_COLORS: readonly number[] = [0xff5a5a, 0x4fd8ff, 0x5cff7a, 0xffd54f];
export const CPU_NAMES: readonly string[] = ['Gnorbert', 'Gnelly', 'Gnash', 'Gnina'];

export const BOARD = {
  spaces: 24,
  redShare: 0.25,
  startCoins: 10,
  blueCoins: 3,
  redCoins: -3,
  starCost: 20,
  dieSides: 6,
  /** Coins by place, 1st..4th. Tied seats each get the better place's coins. */
  miniCoins: [10, 5, 2, 0] as readonly number[],
  roundChoices: [3, 6, 10] as readonly number[],
  defaultRounds: 6,
} as const;

export const TIMING = {
  rollAutoS: 10,
  cpuRollDelayS: 1.0,
  hopS: 0.35,
  afterMoveS: 1.2,
  introS: 6,
  resultsS: 5,
  partyResendS: 1,
} as const;

export type SpaceKind = 'blue' | 'red';
export interface PlayerBoard { space: number; coins: number; stars: number }
export interface BoardState {
  spaces: SpaceKind[];
  starAt: number;
  /** Indexed by seat. */
  players: PlayerBoard[];
  /** 1-based. */
  round: number;
  rounds: number;
  /** Whose move it is this round; seats move in order 0..3. */
  turn: SeatIndex;
}

export type MoveEvent =
  | { e: 'hop'; to: number }
  | { e: 'star'; bought: boolean }
  | { e: 'starMoved'; to: number }
  | { e: 'coins'; delta: number };

/** playerId null = CPU (or the local player offline). */
export interface Seat extends SeatInfo { playerId: number | null }

/** `left` = seconds left in the phase; the host counts it down, other screens count down locally between broadcasts. */
export type Phase =
  | { p: 'roll'; seat: SeatIndex; left: number }
  | { p: 'move'; seat: SeatIndex; die: number; events: MoveEvent[]; left: number; total: number }
  | { p: 'intro'; mini: string; left: number }
  | { p: 'mini'; mini: string; seed: number }
  | { p: 'results'; mini: string; places: number[]; coins: number[]; left: number }
  | { p: 'final'; order: SeatIndex[] };

export interface PartyState {
  /** Increments on every change; screens ignore older states. */
  v: number;
  seed: number;
  seats: Seat[];
  board: BoardState;
  phase: Phase;
  /** Minigame ids played, oldest first (last 5). */
  recent: string[];
  /** Minigame ids this party draws from (the host's menu choice); absent = every slice. */
  pool?: string[];
}

/** Relay messages (the `d` of an @lawn/mp relay). */
export type PartyMsg =
  | { k: 'party'; s: PartyState }                     // host -> all, on change and every partyResendS
  | { k: 'snap'; v: number; t: number; s: unknown }   // host -> all, 15/s during a minigame (v = the minigame's seed)
  | { k: 'in'; v: number; i: unknown }                // client -> host, 15/s during a minigame (v = the minigame's seed)
  | { k: 'roll' }                                     // client -> host
  | { k: 'ping' };                                    // client -> host every 2 s outside minigames
