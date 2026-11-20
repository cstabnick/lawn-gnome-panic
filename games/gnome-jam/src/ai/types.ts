import type { PlayerControlInput } from '../input';
import type { Difficulty, PlayerStats } from '../types';

export type BotRole = 'teammate' | 'opponent' | 'solo';

export type MatchPhase = 'tipoff' | 'live' | 'scored' | 'quarterBreak' | 'finished';
export type BallMode = 'held' | 'shot' | 'pass' | 'loose' | 'inbound';

export interface CourtDimensionsSnapshot {
  halfX: number;
  halfZ: number;
  hoopX: number;
  hoopY: number;
  threePtRadius: number;
}

export interface PlayerStateSnapshot {
  index: number;
  team: 0 | 1;
  name: string;
  pos: [number, number, number];
  vel: [number, number, number];
  facing: number;
  grounded: boolean;
  turbo: number;
  streak: number;
  onFire: boolean;
  stunTimer: number;
  shoveTimer: number;
  stealCooldown: number;
  isShooting: boolean;
  shootHold: number;
  isDunking: boolean;
  stats: PlayerStats;
}

export interface BallStateSnapshot {
  pos: [number, number, number];
  vel: [number, number, number];
  carrier: number | null;
  mode: BallMode;
  shooter: number | null;
  passTarget: number | null;
  isThreeAttempt: boolean;
  onFire: boolean;
  lastTouchTeam: 0 | 1;
}

/**
 * Pure JSON-serializable snapshot of the GBA GJAM match state.
 * Safe to pass to sandboxed Web Workers, external Python/ML processes, or custom scripts.
 */
export interface GameStateSnapshot {
  tick: number;
  phase: MatchPhase;
  quarter: number;
  clockSec: number;
  shotClock: number;
  score: [number, number];
  inboundTeam: 0 | 1;
  court: CourtDimensionsSnapshot;
  ball: BallStateSnapshot;
  players: [PlayerStateSnapshot, PlayerStateSnapshot, PlayerStateSnapshot, PlayerStateSnapshot];
}

export interface BotDecisionContext {
  playerIndex: number;
  role: BotRole;
  difficulty: Difficulty;
  dt: number;
  /** Present when role === 'teammate' so the bot can honor human Pass/Shoot calls. */
  humanInput: PlayerControlInput | null;
}

/** Scripts may return a partial input; missing fields default to false / 0. */
export type BotInput = Partial<PlayerControlInput>;

export interface BotController {
  readonly id: string;
  readonly name: string;
  decide(state: GameStateSnapshot, ctx: BotDecisionContext): BotInput;
  reset?(): void;
  dispose?(): void;
}

export type BotPresetId =
  | 'classic'
  | 'script-classic'
  | 'script-sniper'
  | 'script-rusher'
  | 'remote-http'
  | 'custom-script';

export interface BotSlotAssignment {
  preset: BotPresetId;
  customCode?: string;
  remoteUrl?: string;
}
