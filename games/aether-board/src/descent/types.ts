// Descent: the roguelite mode (?mode=descent). A run is a chain of hills; before each one you pick one of a few hill
// cards. Every hill is generated from three sliders (Descenders style): hazard (spikes in the line, narrower runs,
// more gaps), steep (grade, so speed) and tricky (more and bigger kickers, rails, ley-lines, chutes). Harder hills
// pay more: a bigger score multiplier, perk picks and 1-up lives. Crash (bail or fall off) and you lose a life; at
// zero the run is over. Clear the last hill and you win the run.
// Contracts only: every Descent module takes its types and tuning from here.

/** One hill's sliders, each an integer 0..5, and how many runs (islands) long it is. */
export interface HillParams {
  hazard: number;
  steep: number;
  tricky: number;
  runs: number;
}

export type RewardKind = 'perk' | 'life' | 'shield';

/** What a hill card promises for finishing that hill. */
export interface HillReward {
  kind: RewardKind;
  /** perk: how many perk choices are offered (pick one); life: lives gained; shield: crash shields gained. */
  amount: number;
}

export interface HillCard {
  /** Seed for generateWorld. */
  seed: number;
  params: HillParams;
  /** Display name, e.g. 'Crystal Chute'. */
  name: string;
  /** hazard + steep + tricky (0..15). */
  difficulty: number;
  /** Hill score is multiplied by this when banked: 1 + difficulty * DESCENT.multPerDifficulty. */
  mult: number;
  /** Granted when the hill is finished (in order). */
  rewards: HillReward[];
  /** Bonus: score at least this on the hill and get bonusReward too. */
  bonusTarget: number;
  bonusReward: HillReward;
  /** A boss hill (every DESCENT.bossEvery-th): offered alone, high sliders, big rewards. */
  boss: boolean;
}

export type PerkId =
  | 'quickFeet' | 'bigPop' | 'whirlwind' | 'stickyBoots' | 'aetherLungs'
  | 'bounceBack' | 'grindWax' | 'showboat' | 'luckyHat' | 'thickSkull'
  | 'guardianGnome' | 'softKnees' | 'daredevil';

export interface PerkDef {
  name: string;
  /** One line for the perk card, e.g. '+12% pop height'. */
  desc: string;
  /** Highest level it can stack to. */
  max: number;
}

export interface RunState {
  seed: number;
  /** Hills finished so far (0 at the start). The next hill is number hill + 1. */
  hill: number;
  lives: number;
  maxLives: number;
  /** Crash shields: a crash with a shield up spends the shield, not a life. Refilled per hill by luckyHat. */
  shields: number;
  score: number;
  /** Perk levels owned (missing = 0). */
  perks: Partial<Record<PerkId, number>>;
  /** The card being ridden now, or null between hills. */
  current: HillCard | null;
  crashesThisHill: number;
  /** 'pick' choosing a hill, 'ride' on a hill, 'reward' choosing a perk after a hill, 'over' lost, 'won' cleared. */
  phase: 'pick' | 'ride' | 'reward' | 'over' | 'won';
}

/** finishHill's result: what the reward screen shows. */
export interface HillResult {
  hillScore: number;
  /** hillScore * card.mult * (1 + 0.15 * showboat level), rounded. */
  banked: number;
  bonusHit: boolean;
  /** Every reward granted (card rewards, plus the bonus reward if hit). Lives and shields are already applied. */
  granted: HillReward[];
  /** Perks to choose one from (empty: no perk this time). Sum of all granted perk amounts, distinct, max 4. */
  perkChoices: PerkId[];
}

/** crash()'s result. */
export interface CrashResult {
  /** A shield took it: no life lost. */
  shielded: boolean;
  livesLeft: number;
  /** Lives hit 0: run over (phase is now 'over'). */
  over: boolean;
}

// ---------------------------------------------------------------- tuning (the human tweaks these)
export const DESCENT = {
  startLives: 3,
  maxLives: 6,
  /** Hills in a run; clearing the last wins. */
  hills: 12,
  /** Every Nth hill is a boss hill. */
  bossEvery: 4,
  /** Cards offered between hills (bosses: 1). */
  cardsOffered: 3,
  runsPerHill: 5,
  bossRuns: 6,
  multPerDifficulty: 0.15,
  /** A card with difficulty at least this (or any slider at 5) offers a 1-up life. */
  lifeDifficulty: 9,
  /** Bonus target: bonusBase + bonusPerDifficulty * difficulty + bonusPerHill * hill number. */
  bonusBase: 1500,
  bonusPerDifficulty: 350,
  bonusPerHill: 250,
  /** Seconds after a crash in which another crash does not cost a life (a bail that then falls off is one crash). */
  crashGrace: 2.5,
} as const;
