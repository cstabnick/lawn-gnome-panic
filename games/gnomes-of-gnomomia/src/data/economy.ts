// Economy tuning: every number behind XP, levels, coin rewards and skill growth. Read only through src/economy.ts.
// Tune these against the economy sim (`npm run sim:economy -w games/gnomes-of-gnomomia`), not by feel:
// docs/design/gnomomia/economy.md explains the model and the targets.
import type { OutdoorZoneId, Rank } from '../config';

export const ECONOMY = {
  /** Highest character level. Everything else that needs "the last level" reads this (sim, loadouts, visualizer). */
  levelCap: 30,
  /** The knee of the long curves: the level where shipped content ends. Past it the XP table and coin rewards change
   * growth law (see `late` below) so a future level 31-70 runs on the same rules; levels 1..knee are unaffected.
   * The economy sim's `--cap=70` projection (src/data/economyProjection.ts) is what these late values are tuned on. */
  curveKnee: 30,
  /** XP to the next level at level L: round((base + perLevel L + perLevelSq L^2) * growth^(min(L,knee)-1)
   * * lateGrowth^(max(0, L-knee))). lateGrowth = kill XP growth, so kills per level keep rising past the knee
   * (with 1.04 they peaked near L30 and fell to 101 by L70). */
  levelXp: { base: 150, perLevel: 90, perLevelSq: 20, growth: 1.04, lateGrowth: 1.06 },
  /** Kill XP of an enemy of level L: round((base + perLevel L) * growth^(L-1) * rank * level difference). */
  killXp: { base: 6, perLevel: 2, growth: 1.07 },
  /** Rank multiplier on kill XP. */
  rankXp: { trivial: 0.5, normal: 1, elite: 3, miniboss: 6, boss: 10, worldboss: 20, final: 40 } satisfies Record<Rank, number>,
  /** Quest XP = kill XP of a normal enemy of the quest's level, times this per tier. */
  questTierXp: { side: 10, main: 20, finale: 40 },
  /** Extra quest XP by outdoor zone (default 1). The Verge's errands run longer, and without this the last level
   * was 1.6 h of grind (a third of the zone). */
  questZoneXp: { verge: 1.1 } as Partial<Record<OutdoorZoneId, number>>,
  /** Level difference (enemy level - player level): +abovePer per level above (max aboveMax),
   * -belowPer per level below, nothing at zeroAt or more levels below. */
  levelDiff: { abovePer: 0.1, aboveMax: 0.3, belowPer: 0.2, zeroAt: 5 },
  /** Quest coin reward: round(reward.gold * coinMult(level) * tier). */
  questGold: { tier: { side: 1, main: 1, finale: 1 } },
  /** Coin multiplier shared by quest and enemy gold: scale * growth^(min(L,knee)-1) * (max(L,knee)/knee)^latePower.
   * Up to the knee coins grow 11% a level (cut early, raised late). Past it they follow item prices, which are
   * quadratic in ilvl (sprouted 2 ilvl^2, blooming 4 ilvl^2), so latePower 2: with 1.11 all the way, coins rose 64x
   * from L30 to L70 while prices rose 5.4x. */
  coins: { scale: 0.1, growth: 1.11, latePower: 2 },
  /** Use-based skills. Cap at character level L: capBase + capPerLevel min(L,knee) + lateCapPerLevel max(0, L-knee).
   * Uses to go from skill level s to s+1: floor(usesBase + usesPerLevel s + usesPerLevelSq min(s, cap at knee)^2).
   * lateCapPerLevel 3 (not 4) and the capped s^2 term only act past the knee: without them a level-70 skill fell to
   * 3 skill-ups an hour (one skill level cost ~190 uses at about 4 hits a kill).
   * A use below catchUpBelow x cap counts catchUpMult times (a warden who swaps a fork for a hoe catches the old
   * skill up in about an hour instead of six). */
  skill: {
    capBase: 5, capPerLevel: 4, lateCapPerLevel: 3,
    usesBase: 2, usesPerLevel: 0.25, usesPerLevelSq: 0.006,
    catchUpBelow: 0.8, catchUpMult: 2,
  },
} as const;
