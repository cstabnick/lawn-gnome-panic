// Pure simulation constants and tuning for Gnomelock (no DOM / Three.js imports).

export type Team = 0 | 1; // 0 = Amber Hearth (-Z), 1 = Sapphire Well (+Z)
export type HeroId =
  | 'bramble'
  | 'tansy'
  | 'fernwick'
  | 'potsworth'
  | 'hookwort'
  | 'buckshot'
  | 'thistle'
  | 'loam';
export type AbilitySlot = 'Q' | 'E' | 'F' | 'X';

export const TEAM_NAMES: Record<Team, string> = {
  0: 'Amber Hearth',
  1: 'Sapphire Well',
};

export const TEAM_COLORS: Record<Team, number> = {
  0: 0xd93636, // Red Cap
  1: 0x2f64c9, // Blue Cap
};

export const MATCH_CONFIG = {
  targetDurationS: 600, // 10 minutes
  hardCapS: 900, // 15 min safety cap in headless sim
  relicSpawnS: 300, // 5:00 Gilded Relic comeback objective
  creepWaveIntervalS: 20,
  creepsPerWave: 4, // 3 melee + 1 ranged
  respawnBaseS: 7,
  respawnScalePerMin: 2.0,
  respawnMaxS: 22,
  /** Escalating structure damage multiplier to ensure ~10 min match finish */
  overtimeMult(t: number): number {
    if (t >= 570) return 2.8; // 9:30+
    if (t >= 480) return 2.1; // 8:00+
    if (t >= 360) return 1.4; // 6:00+
    return 1.0;
  },
} as const;

export const ECONOMY = {
  startingAcorns: 350,
  passiveAcornsPerS: 2.8,
  creepBaseBounty: 125,
  creepProximityShare: 0.18, // if missed last-hit
  creepLastHitShare: 0.55, // instant on last-hit
  creepOrbShare: 0.45, // floats as Soul Acorn Orb (confirm or deny!)
  orbLifetimeS: 2.2,
  orbRiseSpeed: 2.4,
  orbHitRadius: 0.68,
  heroKillBase: 240,
  heroKillStreakStep: 40,
  comebackBonusMax: 45,
  towerBounty: {
    1: 250,
    2: 350,
    3: 450,
  } as Record<1 | 2 | 3, number>,
  relicBountyPerPlayer: 300,
  relicBlessingDurationS: 24,
  relicBlessingDmgMult: 1.15,
  relicBlessingRespawnMult: 0.5,
} as const;

export const MOVEMENT = {
  heroRadius: 0.42,
  heroHeight: 1.15,
  slideHeight: 0.65,
  runSpeed: 11.0,
  sprintSpeed: 13.8,
  sprintOutOfCombatS: 2.8,
  groundAccel: 54,
  groundFriction: 11.5,
  airAccel: 16,
  airDrag: 0.45,
  gravity: 26,
  jumpVel: 9.8,
  doubleJumpVel: 9.6,
  wallJumpUpVel: 10.5,
  wallJumpOutVel: 11.5,
  wallDetectDist: 0.72,
  dashSpeed: 21.0,
  dashDurationS: 0.24,
  dashJumpWindowMin: 0.06,
  dashJumpWindowMax: 0.24,
  dashJumpStaminaRefund: 0.35,
  slideMinSpeed: 7.2,
  slideFriction: 2.3,
  slideSlopeAccel: 34,
  slideMaxSpeed: 22.5,
  slideFireRateBonus: 0.15,
  baseStamina: 3,
  staminaRegenS: 3.6,
  coyoteS: 0.11,
  jumpBufferS: 0.12,
  flowDecayS: 3.2,
  flowTierThresholds: [0, 35, 70, 92] as const,
} as const;

export const FLOW_BONUSES = [
  { dmgMult: 1.0, fireRateMult: 1.0, staminaRegenMult: 1.0 },
  { dmgMult: 1.1, fireRateMult: 1.0, staminaRegenMult: 1.0 },
  { dmgMult: 1.18, fireRateMult: 1.15, staminaRegenMult: 1.0 },
  { dmgMult: 1.25, fireRateMult: 1.2, staminaRegenMult: 1.2 },
] as const;

export const LEVEL_ACORN_THRESHOLDS = [
  0, 600, 1400, 2400, 3600, 5000, 6600, 8400, 10400, 12600,
] as const;

export function levelForAcorns(totalEarned: number): number {
  let lvl = 1;
  for (let i = 1; i < LEVEL_ACORN_THRESHOLDS.length; i++) {
    if (totalEarned >= LEVEL_ACORN_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
}
