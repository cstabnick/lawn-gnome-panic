// Descent run rules. Pure: plain data in and out, no DOM, no Math.random (seeded from RunState.seed + hill).
import type { CrashResult, HillCard, HillParams, HillResult, HillReward, PerkId, RunState } from './types';
import { DESCENT } from './types';
import { PERKS, PERK_IDS } from './perks';

const BOSS_NAMES = ['The Shard Throne', 'The Sky Wall', 'The Aether Maw'];
const HAZARD_WORDS = ['Spiky', 'Jagged', 'Thorny'];
const STEEP_WORDS = ['Sheer', 'Plunging', 'Freefall'];
const TRICKY_WORDS = ['Kicker', 'Funky', 'Ley'];
const BALANCED_WORDS = ['Misty', 'Candy', 'Drifting'];
const NOUNS = ['Slope', 'Chute', 'Run', 'Ridge', 'Glide', 'Cascade'];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mix = (a: number, b: number): number => (Math.imul(a ^ (b + 0x9e3779b9), 0x85ebca6b) ^ (b * 2654435761)) >>> 0;

const clamp05 = (v: number): number => Math.min(5, Math.max(0, v));

export function createRun(seed: number): RunState {
  return {
    seed, hill: 0, lives: DESCENT.startLives, maxLives: DESCENT.maxLives, shields: 0, score: 0, perks: {},
    current: null, crashesThisHill: 0, phase: 'pick',
  };
}

/** Rewards for a card, from its sliders, difficulty and whether it is a boss. */
function rewardsFor(p: HillParams, difficulty: number, boss: boolean): { rewards: HillReward[]; bonusReward: HillReward } {
  const maxed = p.hazard === 5 || p.steep === 5 || p.tricky === 5;
  if (boss) {
    return { rewards: [{ kind: 'perk', amount: 4 }, { kind: 'life', amount: 1 }], bonusReward: { kind: 'life', amount: 1 } };
  }
  if (difficulty >= DESCENT.lifeDifficulty || maxed) {
    return { rewards: [{ kind: 'perk', amount: 3 }, { kind: 'life', amount: 1 }], bonusReward: { kind: 'life', amount: 1 } };
  }
  if (difficulty >= 4) {
    return { rewards: [{ kind: 'perk', amount: 3 }], bonusReward: { kind: 'shield', amount: 1 } };
  }
  return { rewards: [], bonusReward: { kind: 'perk', amount: 2 } };
}

/** An adjective from the highest slider (ties: hazard, steep, tricky; all equal: balanced) and a noun, from rng. */
function nameFor(p: HillParams, rng: () => number): string {
  const { hazard: h, steep: s, tricky: t } = p;
  let words: string[];
  if (h === s && s === t) words = BALANCED_WORDS;
  else if (h >= s && h >= t) words = HAZARD_WORDS;
  else if (s >= t) words = STEEP_WORDS;
  else words = TRICKY_WORDS;
  const adj = words[Math.floor(rng() * words.length)];
  const noun = NOUNS[Math.floor(rng() * NOUNS.length)];
  return `${adj} ${noun}`;
}

function buildCard(params: HillParams, seed: number, name: string, boss: boolean, n: number): HillCard {
  const difficulty = params.hazard + params.steep + params.tricky;
  const mult = Math.round((1 + difficulty * DESCENT.multPerDifficulty) * 100) / 100;
  const bonusTarget = DESCENT.bonusBase + DESCENT.bonusPerDifficulty * difficulty + DESCENT.bonusPerHill * n;
  const { rewards, bonusReward } = rewardsFor(params, difficulty, boss);
  return { seed, params, name, difficulty, mult, rewards, bonusTarget, bonusReward, boss };
}

/** The cards to choose from for the next hill (hill number run.hill + 1). Deterministic for (run.seed, run.hill). */
export function offerHills(run: RunState): HillCard[] {
  const n = run.hill + 1;
  const tier = Math.min(2, Math.floor((n - 1) / DESCENT.bossEvery));
  const hillSeed = mix(run.seed, n);
  const cardSeed = (k: number): number => 1 + (mix(hillSeed, k) % 2147483646);
  const rng = mulberry32(hillSeed);

  if (n % DESCENT.bossEvery === 0) {
    const s = Math.min(5, 3 + tier);
    const params: HillParams = { hazard: s, steep: s, tricky: s, runs: DESCENT.bossRuns };
    return [buildCard(params, cardSeed(0), BOSS_NAMES[tier], true, n)];
  }

  const cards: HillCard[] = [];
  for (let k = 0; k < DESCENT.cardsOffered; k++) {
    const sl = [0, 0, 0];
    for (let i = 0; i < 3; i++) sl[i] = clamp05(tier + k + (Math.floor(rng() * 3) - 1));
    if (k === 2) {
      const i = Math.floor(rng() * 3);
      sl[i] = clamp05(sl[i] + 1);
    }
    const params: HillParams = { hazard: sl[0], steep: sl[1], tricky: sl[2], runs: DESCENT.runsPerHill };
    const name = nameFor(params, rng);
    cards.push(buildCard(params, cardSeed(k), name, false, n));
  }
  return cards;
}

/** Start riding `card`: current = card, phase 'ride', crashesThisHill 0, shields refilled by luckyHat. */
export function startHill(run: RunState, card: HillCard): void {
  run.current = card;
  run.phase = 'ride';
  run.crashesThisHill = 0;
  run.shields = Math.max(run.shields, run.perks.luckyHat ?? 0);
}

/** A crash on the current hill: spend a shield, else a life. At 0 lives phase becomes 'over'. */
export function crash(run: RunState): CrashResult {
  if (run.phase !== 'ride') {
    return { shielded: false, livesLeft: run.lives, over: run.phase === 'over' };
  }
  run.crashesThisHill += 1;
  if (run.shields > 0) {
    run.shields -= 1;
    return { shielded: true, livesLeft: run.lives, over: false };
  }
  run.lives -= 1;
  let over = false;
  if (run.lives <= 0) {
    run.lives = 0;
    run.phase = 'over';
    run.current = null;
    over = true;
  }
  return { shielded: false, livesLeft: run.lives, over };
}

/** The current hill was finished with this many trick points: bank the score, grant rewards, move to 'reward'. */
export function finishHill(run: RunState, hillScore: number): HillResult {
  const card = run.current;
  if (run.phase !== 'ride' || !card) {
    return { hillScore, banked: 0, bonusHit: false, granted: [], perkChoices: [] };
  }
  const n = run.hill + 1;
  const showboat = run.perks.showboat ?? 0;
  const banked = Math.round(hillScore * card.mult * (1 + 0.15 * showboat));
  run.score += banked;

  const bonusHit = hillScore >= card.bonusTarget;
  const granted: HillReward[] = [...card.rewards];
  if (bonusHit) granted.push(card.bonusReward);

  for (const reward of granted) {
    if (reward.kind === 'life') {
      for (let i = 0; i < reward.amount; i++) {
        if (run.lives < run.maxLives) run.lives += 1;
        else run.shields += 1;
      }
    } else if (reward.kind === 'shield') {
      run.shields += reward.amount;
    }
  }

  const perkAmount = granted.reduce((sum, r) => (r.kind === 'perk' ? sum + r.amount : sum), 0);
  const k = Math.min(4, perkAmount);
  const rng = mulberry32(mix(run.seed, 1000 + n));
  const pool = PERK_IDS.filter((id) => (run.perks[id] ?? 0) < PERKS[id].max);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const perkChoices: PerkId[] = pool.slice(0, k);

  run.hill += 1;
  run.current = null;
  run.phase = 'reward';
  return { hillScore, banked, bonusHit, granted, perkChoices };
}

/** Take a perk (or null to skip): its level goes up by 1 (capped). Then phase 'pick', or 'won' after the last hill. */
export function choosePerk(run: RunState, perk: PerkId | null): void {
  if (perk !== null && (run.perks[perk] ?? 0) < PERKS[perk].max) {
    run.perks[perk] = (run.perks[perk] ?? 0) + 1;
    if (perk === 'thickSkull') {
      run.maxLives += 1;
      run.lives += 1;
    }
  }
  run.phase = run.hill >= DESCENT.hills ? 'won' : 'pick';
}
