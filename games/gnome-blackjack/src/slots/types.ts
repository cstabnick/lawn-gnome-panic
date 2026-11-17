// Extensible slot-machine & casino-game contracts.
// New slot types (5-reel, progressive, mushroom-bonus, etc.) implement SlotMachineSpec and register in catalog.ts.
import type { Swatch } from '@lawn/prefabs';

export interface SlotSymbol {
  id: string;
  label: string;
  glyph: string;
  /** Hex colour for the 3D reel face & UI badge. */
  color: string;
  /** Relative frequency weight on each reel strip. */
  weight: number;
  /** True for BAR-family symbols (enables "Any BAR" mixed payouts). */
  isBar?: boolean;
}

export type PayoutMatch =
  | { k: 'three'; symbol: string }
  | { k: 'any-bar' }
  | { k: 'two'; symbol: string };

export interface PayoutRule {
  id: string;
  label: string;
  match: PayoutMatch;
  /** Multiplier applied to the total bet. */
  multiplier: number;
  jackpot?: boolean;
}

export interface SlotMachineSpec {
  id: string;
  name: string;
  prefabId: string;
  tint?: Swatch | number;
  trim?: Swatch | number;
  reelCount: number;
  minBet: number;
  maxBet: number;
  betSteps: readonly number[];
  symbols: readonly SlotSymbol[];
  /** Evaluated in order; the first matching rule pays out. */
  payouts: readonly PayoutRule[];
  /** Base spin duration before reel 0 stops (seconds). */
  spinS: number;
  /** Delay between successive reel stops (seconds). */
  reelStopStaggerS: number;
  /** Extra suspense delay on the final reel when the first two reels match. */
  anticipationS: number;
}

export interface SlotPlacement {
  id: string;
  machineType: string;
  x: number;
  z: number;
  yaw: number;
  tint?: Swatch | number;
  trim?: Swatch | number;
}

export type SlotSpinPhase = 'idle' | 'spinning' | 'payout';

export interface SlotState {
  machineId: string;
  machineType: string;
  phase: SlotSpinPhase;
  phaseT: number;
  bet: number;
  /** Symbol IDs currently targeted/shown on each reel. */
  reels: string[];
  /** True once the reel has locked in for the current/last spin. */
  stopped: boolean[];
  /** True when the first two reels match and the final reel is in suspense. */
  anticipating: boolean;
  lastWin: number;
  lastMultiplier: number;
  lastLabel: string;
  jackpot: boolean;
  seed: number;
  totalSpins: number;
  totalWon: number;
}

export type SlotEvent =
  | { e: 'spin-start'; bet: number }
  | { e: 'reel-stop'; reel: number; symbol: string; matchSoFar: boolean }
  | { e: 'anticipation' }
  | { e: 'win'; amount: number; multiplier: number; label: string; jackpot: boolean }
  | { e: 'lose' }
  | { e: 'ready' };
