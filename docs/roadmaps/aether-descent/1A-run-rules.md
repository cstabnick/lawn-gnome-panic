Epic: 1 Descent
Depends on: none

## Environment
Working directory: `C:\Users\cstab\Documents\gaming` (Windows, Git Bash). If `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed. Do not run `git commit`.
Other workers are editing other files in `games/aether-board` at the same time (world.ts, physics.ts, view/*,
descent/ui.ts, app.ts). Touch only the files listed under Change.

## Goal
The Descent roguelite's rules exist as pure, tested code: creating a run, offering hill cards, crashes and lives,
finishing a hill (score, rewards, bonus), and perks that change the board's tuning.

## Read first
- `games/aether-board/src/descent/types.ts`: every type and the `DESCENT` tuning table. Do not change it.
- `games/aether-board/src/descent/run.ts`: stub; keep every exported signature exactly.
- `games/aether-board/src/descent/perks.ts`: stub; keep every exported name and signature exactly.
- `games/aether-board/src/config.ts`: `TUNE` (the board's tuning, declared `as const`).

## Change
- `games/aether-board/src/descent/run.ts`: implement the functions (rules below).
- `games/aether-board/src/descent/perks.ts`: fill `desc` for every perk and implement `applyPerks`.
- `games/aether-board/src/descent/run.test.ts` (new): vitest tests.

### Randomness
No `Math.random`. Use a local mulberry32:
```ts
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
```
offerHills for hill number `n = run.hill + 1` uses `mulberry32(mix(run.seed, n))`; perk choices in finishHill use
`mulberry32(mix(run.seed, 1000 + n))` where n is the hill just finished. A card's `seed` is
`1 + (mix(mix(run.seed, n), k) % 2147483646)` for card index k (so always >= 1).

### offerHills(run)
- n = run.hill + 1, tier = Math.min(2, Math.floor((n - 1) / DESCENT.bossEvery)) (0, 1, 2).
- Boss when `n % DESCENT.bossEvery === 0`: exactly one card, every slider = Math.min(5, 3 + tier),
  runs = DESCENT.bossRuns, boss true, name `['The Shard Throne', 'The Sky Wall', 'The Aether Maw'][tier]`.
- Otherwise DESCENT.cardsOffered (3) cards, k = 0 (easy), 1 (medium), 2 (hard). Each slider =
  clamp(0, 5, tier + k + randInt(-1, 1)) where randInt(-1, 1) is -1, 0 or 1 from the rng. On the hard card
  (k = 2) one random slider gets +1 more (still clamped). runs = DESCENT.runsPerHill. boss false.
- difficulty = hazard + steep + tricky. mult = Math.round((1 + difficulty * DESCENT.multPerDifficulty) * 100) / 100.
- bonusTarget = DESCENT.bonusBase + DESCENT.bonusPerDifficulty * difficulty + DESCENT.bonusPerHill * n.
- Rewards (`maxed` = any slider is 5):
  - boss: rewards `[{ kind: 'perk', amount: 4 }, { kind: 'life', amount: 1 }]`, bonusReward `{ kind: 'life', amount: 1 }`.
  - difficulty >= DESCENT.lifeDifficulty or maxed: rewards `[{ kind: 'perk', amount: 3 }, { kind: 'life', amount: 1 }]`,
    bonusReward `{ kind: 'life', amount: 1 }`.
  - difficulty >= 4: rewards `[{ kind: 'perk', amount: 3 }]`, bonusReward `{ kind: 'shield', amount: 1 }`.
  - else: rewards `[]`, bonusReward `{ kind: 'perk', amount: 2 }`.
- name: an adjective picked by the highest slider (ties: the first of hazard, steep, tricky; all equal: balanced) plus
  a noun, both from the rng:
  hazard `['Spiky', 'Jagged', 'Thorny']`, steep `['Sheer', 'Plunging', 'Freefall']`, tricky `['Kicker', 'Funky', 'Ley']`,
  balanced `['Misty', 'Candy', 'Drifting']`; nouns `['Slope', 'Chute', 'Run', 'Ridge', 'Glide', 'Cascade']`.
- Same run.seed and run.hill must always give the same cards (deep-equal).

### startHill(run, card)
current = card, phase 'ride', crashesThisHill = 0, shields = Math.max(run.shields, run.perks.luckyHat ?? 0).

### crash(run)
- If phase is not 'ride': change nothing, return `{ shielded: false, livesLeft: run.lives, over: run.phase === 'over' }`.
- crashesThisHill += 1. If shields > 0: shields -= 1, return shielded true.
- Else lives -= 1; if lives <= 0: lives = 0, phase = 'over', current = null. Return `{ shielded: false, livesLeft, over }`.
- (The crash grace window is the app's job, not this function's.)

### finishHill(run, hillScore)
Requires phase 'ride' and current set (otherwise return a zero result and change nothing).
- banked = Math.round(hillScore * card.mult * (1 + 0.15 * (run.perks.showboat ?? 0))); run.score += banked.
- bonusHit = hillScore >= card.bonusTarget. granted = [...card.rewards] plus card.bonusReward if bonusHit.
- Apply each granted reward: 'life': for each life, if lives < maxLives then lives += 1 else shields += 1 (an extra
  life past the cap becomes a shield). 'shield': shields += amount. 'perk': nothing here.
- perkChoices: k = Math.min(4, sum of amounts of granted 'perk' rewards). Pick k distinct perk ids from PERK_IDS
  (perks.ts) whose owned level is below PERKS[id].max, with the seeded rng (shuffle then take). Fewer if not enough.
- run.hill += 1, current = null, phase = 'reward'. Return the HillResult.

### choosePerk(run, perk)
- If perk is not null and its level < PERKS[perk].max: level += 1. thickSkull also does maxLives += 1 and lives += 1.
- phase = run.hill >= DESCENT.hills ? 'won' : 'pick'.

### perks.ts
Keep `PERKS`, `PERK_IDS` and the `max` values. Fill `desc` (short, e.g. '+15% push speed per level'). Effects per
level L (only the TUNE keys listed; base = the value TUNE had when perks.ts was first imported):
- quickFeet: pushAccel × (1 + 0.15L), pushMax × (1 + 0.10L)
- bigPop: ollieMin × (1 + 0.08L), ollieMax × (1 + 0.08L)
- whirlwind: spinRate × (1 + 0.10L), flipRate × (1 + 0.10L)
- stickyBoots: landYawTol × (1 + 0.12L), landFlipTol × (1 + 0.12L), landTrickDone × (1 − 0.06L)
- aetherLungs: boostDrain × (1 − 0.20L), boostAccel × (1 + 0.10L)
- bounceBack: bailTime × (1 − 0.20L), bailKeep + 0.15L
- grindWax: grindSnap × (1 + 0.20L), leyAccel × (1 + 0.20L), leyMax × (1 + 0.08L)
- showboat (+15% banked hill score per level), luckyHat (a crash shield at the start of every hill per level),
  thickSkull (+1 max life and +1 life): run-only, no TUNE change.

Implementation: at module top `const BASE = { ...TUNE };` then
`const T = TUNE as unknown as Record<string, number>;`. applyPerks first copies every BASE value back into T, then
applies the multipliers. So applyPerks({}) restores free-ride tuning exactly.

## Contract
Exported signatures in run.ts and perks.ts must stay exactly as in the stubs (other workers compile against them):
`createRun(seed): RunState`, `offerHills(run): HillCard[]`, `startHill(run, card): void`, `crash(run): CrashResult`,
`finishHill(run, hillScore): HillResult`, `choosePerk(run, perk: PerkId | null): void`, `PERKS`, `PERK_IDS`,
`applyPerks(perks): void`.

## Done when
- `cd games/aether-board && npx tsc --noEmit -p .` passes (errors in files you did not touch are another worker's
  mid-edit; rerun once, then report them rather than fixing them).
- `cd games/aether-board && npx vitest run src/descent/run.test.ts` passes, with tests for: offerHills is
  deterministic and gives 3 cards (1 on hill 4, boss true); sliders are integers 0..5; a harder card has mult >= the
  easy one; crash spends a shield first, then lives, and phase 'over' at 0; finishHill banks with mult and showboat,
  life past maxLives becomes a shield, bonus reward only when hillScore >= bonusTarget; choosePerk caps at max and
  sets 'won' after hill 12; applyPerks({ bigPop: 2 }) raises TUNE.ollieMax and applyPerks({}) restores it exactly.

## Out of scope
`descent/types.ts`, `descent/ui.ts`, `app.ts`, `world.ts`, `physics.ts`, `view/*`, `config.ts`.
