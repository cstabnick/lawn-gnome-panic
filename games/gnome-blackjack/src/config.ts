// Gnome Blackjack: shared types and tuning. Every module imports its contracts from here.
// The table rules (table.ts, cards.ts) are pure functions of plain JSON data: no DOM, no THREE, no window.

// ---------------------------------------------------------------- tuning
/** Seats at the table (humans + CPU gnomes). Seat 0 is the dealer's left (first to act). */
export const SEAT_COUNT = 5;
/** Decks in the shoe; it is reshuffled when fewer than RESHUFFLE_AT cards remain. */
export const DECKS = 4;
export const RESHUFFLE_AT = 20;
export const START_CHIPS = 100;
export const MIN_BET = 5;
export const MAX_BET = 50;
/** Bet buttons the HUD offers (each click adds that much, up to MAX_BET and the seat's chips). */
export const BET_STEPS: readonly number[] = [5, 10, 25];
/** Seconds to place a bet, and seconds for one decision (hit/stand/double). Online friendly: nobody waits longer. */
export const BET_S = 15;
export const TURN_S = 15;
/** At this many seconds left on a turn, the table gets a 'timeLow' event (gnomes start nagging). */
export const TIME_LOW_S = 5;
/** Seconds the 'dealing' phase lasts (the view animates the new cards). */
export const DEAL_S = 1.6;
/** Seconds between dealer cards in the 'dealer' phase, and how long 'payout' shows results. */
export const DEALER_GAP_S = 0.8;
export const PAYOUT_S = 4;
/** A CPU gnome thinks this long (min..max seconds) before betting or acting. */
export const CPU_THINK_MIN_S = 0.8;
export const CPU_THINK_MAX_S = 2.2;
/** A speech bubble stays up this long (seconds of TableState.t). */
export const BUBBLE_S = 4.5;
/** Idle chatter: one random line every IDLE_MIN_S..IDLE_MAX_S seconds when nobody has spoken. */
export const IDLE_MIN_S = 7;
export const IDLE_MAX_S = 14;
/** Mutter voice base pitch range in Hz (deep). */
export const VOICE_MIN_HZ = 70;
export const VOICE_MAX_HZ = 140;
/** The host sends a snapshot at least this often (it also sends one after every change). */
export const SNAPSHOT_EVERY_S = 0.5;

// ---------------------------------------------------------------- cards
export type Suit = 'S' | 'H' | 'D' | 'C';
/** r: 1 = ace, 2..10, 11 = jack, 12 = queen, 13 = king. */
export interface Card { r: number; s: Suit }

// ---------------------------------------------------------------- table state (plain JSON; snapshots send it whole minus the shoe)
export type Phase = 'betting' | 'dealing' | 'playing' | 'dealer' | 'payout';
export type Action = 'hit' | 'stand' | 'double';
export type HandResult = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

export interface Hand {
  cards: Card[];
  /** Chips at stake (doubles on 'double'). */
  bet: number;
  /** True once the seat stood, busted, doubled, has blackjack or timed out. */
  done: boolean;
  doubled: boolean;
  /** Set in 'payout'. */
  result: HandResult | null;
  /** Chips won (+) or lost (-) this round, set in 'payout'. */
  delta: number;
}

export interface Seat {
  /** Humans: their matchmaking server id (offline: LOCAL_ID). CPUs: a negative id, unique at the table. */
  id: number;
  name: string;
  cpu: boolean;
  /** CPUs: a CHARACTERS key (characters.ts). Humans: their matchmaking `character` (a gnome look code or ''). */
  character: string;
  /** 0xRRGGBB, the seat's colour (hat, name tag). */
  color: number;
  chips: number;
  /** Bet chosen in 'betting' (0 = not placed yet / sitting out). */
  bet: number;
  /** True once this seat confirmed its bet (CPUs: after thinking). */
  ready: boolean;
  /** This round's hand, or null if the seat sat this round out. */
  hand: Hand | null;
  /** Mutter voice base pitch, Hz (VOICE_MIN_HZ..VOICE_MAX_HZ). */
  voice: number;
}

export interface Bubble {
  /** Unique, increasing: a new id means a new line (mutter it once). */
  id: number;
  /** Seat index 0..SEAT_COUNT-1, or DEALER (-1). */
  seat: number;
  text: string;
  /** TableState.t when it was said. */
  at: number;
}

export const DEALER = -1;
/** The human's id at an offline table. */
export const LOCAL_ID = 0;

export interface TableState {
  /** Seconds since the table opened. */
  t: number;
  phase: Phase;
  /** Seconds since the phase began. */
  phaseT: number;
  /** Seat index whose decision it is ('playing'), else -1. */
  turn: number;
  /** Seconds left on the current clock: the betting window in 'betting', the turn in 'playing'; 0 otherwise. */
  timer: number;
  seats: (Seat | null)[];
  dealer: Card[];
  /** True while the dealer's second card is face down. */
  holeHidden: boolean;
  /** Host only: the shoe. Snapshots send [] and a new host refills it. */
  shoe: Card[];
  /** RNG state (mulberry32), advanced by cards.ts rand(). */
  seed: number;
  /** Fixed per-lobby seed for syncing the lounge music across everyone at the table. */
  musicSeed?: number;
  round: number;
  bubbles: Bubble[];
  nextBubbleId: number;
  /** Seconds until the next idle chatter line. */
  idleIn: number;
  /** Seconds until the current CPU (turn seat, or an unready CPU in betting) acts. */
  cpuIn: number;
  /** True once 'timeLow' fired for the current turn. */
  lowSent: boolean;
}

/** What a seat can send (a human's click, relayed to the host online). */
export type TableInput =
  | { k: 'bet'; amount: number }   // set the bet to amount (clamped MIN_BET..min(MAX_BET, chips))
  | { k: 'ready' }                 // confirm the bet
  | { k: 'act'; a: Action };       // only on your turn

/** What happened, for banter and sound. seat is a seat index (DEALER for the dealer). */
export type TableEvent =
  | { e: 'roundStart' }
  | { e: 'deal' }
  | { e: 'turn'; seat: number }
  | { e: 'hit'; seat: number; total: number }
  | { e: 'stand'; seat: number; total: number }
  | { e: 'double'; seat: number }
  | { e: 'bust'; seat: number; total: number }
  | { e: 'blackjack'; seat: number }
  | { e: 'timeLow'; seat: number }
  | { e: 'timeout'; seat: number }
  | { e: 'dealerReveal'; total: number }
  | { e: 'dealerBust'; total: number }
  | { e: 'dealerBlackjack' }
  | { e: 'result'; seat: number; result: HandResult; delta: number }
  | { e: 'broke'; seat: number }     // a seat dropped under MIN_BET and was given START_CHIPS again
  | { e: 'join'; seat: number }
  | { e: 'leave'; seat: number }
  | { e: 'idle' };                   // the idle chatter clock ran out (tickTable resets it)

// ---------------------------------------------------------------- online
export interface NetStatus {
  status: 'off' | 'connecting' | 'online' | 'error';
  /** Shown to the player: 'Connecting…', 'Online table', 'Offline: could not reach the server', ... */
  message: string;
  /** The private room code, or null for the public table. */
  code: string | null;
  /** Humans at the table (including me). */
  humans: number;
}
