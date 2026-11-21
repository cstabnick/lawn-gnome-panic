/**
 * Tunable simulation balance parameters for GBA GJAM.
 * Defaults preserve the original v1 arcade tuning; balance rounds iterate on
 * these knobs and promote validated configs into DEFAULT_BALANCE_CONFIG.
 */
export interface SimBalanceConfig {
  // --- Shove & Steal ---
  /** Cooldown (s) after a steal/shove attempt that hits an opponent. */
  shoveCooldownSec: number;
  /** Cooldown (s) after a steal/shove attempt that misses (whiffs). */
  shoveWhiffCooldownSec: number;
  /** Turbo consumed by a turbo-shove. */
  shoveTurboCost: number;
  /** Stun duration (s) inflicted by a turbo-shove. */
  shoveStunSec: number;
  /** Probability [0..1] that a turbo-shove on the ball-carrier forces a turnover. */
  shoveTurnoverChance: number;
  /** If true, a successful shove knocks the ball loose instead of teleporting it to the shover. */
  shoveKnocksLoose: boolean;
  /** Base probability of a non-turbo pickpocket steal. */
  stealBaseChance: number;

  // --- Shooting & Contesting ---
  /** Base 3PT make probability before stat/timing/contest modifiers. */
  threeBaseChance: number;
  /** 3PT probability added per 10 points of threePt stat. */
  threeStatScale: number;
  /** Base 2PT make probability before stat/timing/contest modifiers. */
  twoBaseChance: number;
  /** 2PT probability added per 10 points of threePt stat. */
  twoStatScale: number;
  /** Max probability bonus for perfect apex timing (timingQuality = 1). */
  timingBonusMax: number;
  /** Extra probability penalty applied when shootHold < 0.14s (punishes quick-release spam). */
  earlyReleasePenalty: number;
  /** Multiplier on defender contest penalty (1.0 = original). */
  contestScale: number;

  // --- Dunking & Blocking ---
  /** Base dunk reach (m) without turbo. */
  dunkBaseReach: number;
  /** Extra dunk reach (m) when using turbo. */
  dunkTurboReachBonus: number;
  /** Extra dunk reach (m) when On Fire. */
  dunkFireReachBonus: number;
  /** Base chance per tick in rim window for an airborne defender to reject a dunk. */
  dunkBlockBaseChance: number;
  /** Reach (m) for blocking airborne jump shots. */
  shotBlockReach: number;

  // --- On-Fire & Snowballing ---
  /** Consecutive baskets required to ignite On Fire. */
  fireStreakThreshold: number;
  /** Jump-shot probability bonus while On Fire. */
  fireShotBonus: number;
  /** Multiplier on turbo drain while On Fire (0 = infinite turbo, 1 = normal drain). */
  fireTurboDrainScale: number;

  // --- Feel (pace & dunk contest) ---
  /** Multiplier on player move speed (1.0 = original pace). */
  moveSpeedScale: number;
  /** Seconds at the start of a dunk (the gather) during which a grounded defender within 1.4 m can shove/steal it. 0 = off. */
  dunkWindupSec: number;
  /** Radius (m) around the dunker's flight path in the second half of the flight; a defender inside it rolls to contest the dunk. 0 = off. */
  dunkContestRadius: number;
  /** Chance per contesting defender that a contested dunk fails (before defense scaling, see sim.ts). 0 = off. */
  dunkContestFailChance: number;
  /** If true, on-fire dunks can also be swatted/contested (at half the chance). false = on-fire dunks are unstoppable. */
  dunkFireContestable: boolean;
  /** Seconds the dunker cannot act after a scored dunk (stops instant chain possession). 0 = off. */
  dunkLandingRecoverySec: number;
}

/** Original pre-balance baseline constants from src/sim.ts. */
export const ORIGINAL_BALANCE_CONFIG: SimBalanceConfig = {
  shoveCooldownSec: 0.55,
  shoveWhiffCooldownSec: 0.55,
  shoveTurboCost: 22,
  shoveStunSec: 0.85,
  shoveTurnoverChance: 1.0,
  shoveKnocksLoose: false,
  stealBaseChance: 0.34,

  threeBaseChance: 0.28,
  threeStatScale: 0.055,
  twoBaseChance: 0.44,
  twoStatScale: 0.042,
  timingBonusMax: 0.22,
  earlyReleasePenalty: 0.0,
  contestScale: 1.0,

  dunkBaseReach: 3.2,
  dunkTurboReachBonus: 1.25,
  dunkFireReachBonus: 1.1,
  dunkBlockBaseChance: 0.04,
  shotBlockReach: 2.2,

  fireStreakThreshold: 3,
  fireShotBonus: 0.28,
  fireTurboDrainScale: 0.0,

  moveSpeedScale: 1.0,
  dunkWindupSec: 0,
  dunkContestRadius: 0,
  dunkContestFailChance: 0,
  dunkFireContestable: false,
  dunkLandingRecoverySec: 0,
};

/** Active game balance config (promoted from 3-round balance tuning). */
export const DEFAULT_BALANCE_CONFIG: SimBalanceConfig = {
  shoveCooldownSec: 1.2,
  shoveWhiffCooldownSec: 1.5,
  shoveTurboCost: 34,
  shoveStunSec: 0.6,
  shoveTurnoverChance: 0.25,
  shoveKnocksLoose: true,
  stealBaseChance: 0.26,

  threeBaseChance: 0.11,
  threeStatScale: 0.038,
  twoBaseChance: 0.44,
  twoStatScale: 0.042,
  timingBonusMax: 0.22,
  earlyReleasePenalty: 0.28,
  contestScale: 1.4,

  dunkBaseReach: 1.9,
  dunkTurboReachBonus: 1.0,
  dunkFireReachBonus: 1.1,
  dunkBlockBaseChance: 0.12,
  shotBlockReach: 2.55,

  fireStreakThreshold: 3,
  fireShotBonus: 0.16,
  fireTurboDrainScale: 0.4,

  moveSpeedScale: 0.78,
  dunkWindupSec: 0.18,
  dunkContestRadius: 2.2,
  dunkContestFailChance: 0.45,
  dunkFireContestable: true,
  dunkLandingRecoverySec: 0.35,
};
