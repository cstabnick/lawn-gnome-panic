# GBA GJAM: fun metrics and realistic-feel retune

Goal: adopt the "Quantifying Fun" playbook (possession/trajectory stats, bot bench, CRN A/B, knob sweeps) on top of the existing `games/gba-gjam/ai/` harness, then use it to retune feel. Complaints driving it: the game is a touch too fast, and the big slam dunk is effectively unstoppable free points. Target: realistic basketball as the best 12-year-olds make it look (passing, spacing, contested finishes, dunks that need a lane and can be contested).

Decisions (no need to ask):
- All analytics are TypeScript, zero new dependencies (SOUL: cheap). No Python/Parquet; telemetry is JSON/CSV in `ai/results/`.
- Seeded RNG already exists (`withSeededRandom`, `mulberry32` in `src/ai/eval.ts`); CRN = same seed list across builds.
- Mobile/online: no control or net changes; sim knobs only. Online hosts run the same sim, so defaults in `src/balance.ts` apply to both.
- Party slice: this game has no `src/minigames/`; none added.
- Playbook caveat kept: bots measure structural health, not feel. Human playtest decides; the retune lands as conservative defaults plus a report.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Foundations | analytics + event recorder + new feel knobs exist; tests and tsc pass | 3 (parallel) |
| 2 Bench and sweep | `npm run eval:scorecard` and `eval:sweep` run and write reports | 2 (parallel) |
| 3 Research rounds | planner runs rounds, tunes `DEFAULT_BALANCE_CONFIG`, writes report, PR | planner |

Shared contract (all issues): `MatchEvents` in `games/gba-gjam/ai/events.ts` (owned by 1A):

```ts
export interface ScoreEvent {
  tick: number;          // sim tick at score
  elapsedSec: number;    // live seconds since tipoff (quarter*45 based; use sim clock)
  team: 0 | 1;
  kind: 'dunk' | 'three' | 'two';
  onFire: boolean;       // scorer was on fire
  homeScore: number;     // after the score
  awayScore: number;
}
export interface PossessionEvent {
  team: 0 | 1;           // team that had the ball
  startTick: number;
  endTick: number;
  passes: number;
  outcome: 'dunk' | 'three' | 'two' | 'miss' | 'turnover' | 'shotClock';
  teamOnFire: boolean;   // someone on the team was on fire at possession start
}
export interface MatchEvents {
  seed: number;
  totalSec: number;      // total live match seconds
  scores: ScoreEvent[];
  possessions: PossessionEvent[];
  shotsOnFire: { att: number; made: number }[];   // index 0 = not on fire, 1 = on fire; POOLED counts, never per-match ratios
}
export function recordMatch(opts: MatchOptions): { telemetry: MatchTelemetry; events: MatchEvents };
```

## Epic 1

~~~~text
Epic: 1A event recorder
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mojarra, game in games/gba-gjam. Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing. Other workers are editing other files in the same game right now; edit ONLY the file listed.

## Goal
`games/gba-gjam/ai/events.ts` exports `recordMatch`, which runs `simulateMatch` and also returns per-match event logs.

## Read first
- games/gba-gjam/src/ai/eval.ts: `MatchOptions` (has `onTick?: (sim, lastEvent) => void`), `simulateMatch`, how telemetry counts possessions (`possessions`, `possessionSec`) and passes/steals via callbacks. Reuse that approach.
- games/gba-gjam/src/ai/snapshot.ts: `captureGameState(sim)`.
- games/gba-gjam/src/sim.ts: `JamSimulation` public fields (score, players[].box, ball.carrier, ball.mode, phase, inboundTeam) and `SimCallbacks`.

## Change
- Create games/gba-gjam/ai/events.ts with the types below and `recordMatch(opts: MatchOptions)`. Wrap `opts.onTick` (call the original too) and derive events from per-tick state: detect score changes (kind from box-score deltas: dunks, tpm, else two; onFire from scorer), possession start/end (carrier team changes or score/turnover), pass count (ball.mode 'pass' entries), outcome. Count `shotsOnFire` POOLED (jump-shot attempts and makes split by shooter.onFire).
- Do not modify src/ files. If something you need is not observable from the sim's public state, approximate it and note the approximation in a comment.

## Contract
Export exactly these (verbatim):
```ts
import type { MatchOptions, MatchTelemetry } from '../src/ai/eval';
export interface ScoreEvent { tick: number; elapsedSec: number; team: 0 | 1; kind: 'dunk' | 'three' | 'two'; onFire: boolean; homeScore: number; awayScore: number; }
export interface PossessionEvent { team: 0 | 1; startTick: number; endTick: number; passes: number; outcome: 'dunk' | 'three' | 'two' | 'miss' | 'turnover' | 'shotClock'; teamOnFire: boolean; }
export interface MatchEvents { seed: number; totalSec: number; scores: ScoreEvent[]; possessions: PossessionEvent[]; shotsOnFire: { att: number; made: number }[]; }
export function recordMatch(opts: MatchOptions): { telemetry: MatchTelemetry; events: MatchEvents };
```

## Done when
- `npx tsc --noEmit -p games/gba-gjam` passes
- Add games/gba-gjam/ai/events.test.ts (vitest): a short match (`quarterSeconds: 10`, two `classic` bots from `getBaselineRoster()` in ai/baseline.ts or equivalent factories, seed 1) gives events whose last ScoreEvent scores equal telemetry.homeScore/awayScore, and two runs with the same seed give deep-equal events. `npx vitest run ai/events.test.ts` in games/gba-gjam passes.

## Out of scope
src/**, ai/analytics.ts, ai/scorecard.ts, package.json.
~~~~

~~~~text
Epic: 1B analytics library
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mojarra, game in games/gba-gjam. Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing. Other workers edit other files at the same time; edit ONLY the files listed. No new npm dependencies.

## Goal
`games/gba-gjam/ai/analytics.ts`: pure, dependency-free statistics functions used to score how fun a ruleset is, with tests.

## Read first
- games/gba-gjam/src/ai/eval.ts: `quantile`, `wilsonCI95` (reuse by import, do not duplicate).
- games/gba-gjam/ai/events.ts may not exist yet. Do NOT import it; the functions below take plain arrays.

## Change
Create games/gba-gjam/ai/analytics.ts exporting, with these exact signatures:
```ts
/** One sample of a match trajectory. diff = home - away. frac in [0,1] of match elapsed. */
export interface TracePoint { frac: number; diff: number }
export interface WinProbModel { predict(diff: number, frac: number): number } // P(home wins)
/** Empirical WP: bin diff (clamped to +-30, bins of 2) x frac (10 bins); Laplace smoothing alpha=1; fallback 0.5. traces[i] pairs with homeWon[i]. */
export function fitWinProb(traces: TracePoint[][], homeWon: boolean[]): WinProbModel;
/** Game Excitement Index: (regulationSec / durationSec) * sum |p_i - p_{i-1}| over the WP path of one match. */
export function gei(wpPath: number[], durationSec: number, regulationSec: number): number;
export function geiBand(g: number): 'dud' | 'average' | 'thriller' | 'heartPounder'; // <1, <=4, <=8, >8
/** Shannon entropy base 2 of a two-outcome probability. */
export function entropy2(p: number): number;
/** Number of lead flips in a diff series (ties do not flip). */
export function leadChanges(diffs: number[]): number;
/** Winner's worst deficit: max(0, -min diff from winner's view). homeWon tells the winner. */
export function winnerMaxDeficit(diffs: number[], homeWon: boolean): number;
/** Leverage index per step: |p_{i+1}-p_i| scaled so the mean over ALL steps passed in is 1 (flatten many matches' steps before calling). */
export function leverageIndex(absSwings: number[]): number[];
/** Share of values below cutoff (garbage-time share, cutoff default 0.3). */
export function shareBelow(values: number[], cutoff?: number): number;
/** ROC-AUC of a score predicting a binary label (ties count 0.5). */
export function rocAuc(scores: number[], labels: boolean[]): number;
/** Vargha-Delaney A12: P(b > a) + 0.5 P(b == a). 0.5 = no effect. */
export function varghaDelaneyA12(a: number[], b: number[]): number;
/** Cliff's delta in [-1,1] = 2*A12 - 1. */
export function cliffsDelta(a: number[], b: number[]): number;
/** Two-sided Wilcoxon signed-rank p-value for paired samples (normal approximation with tie/zero handling; return 1 if all diffs are 0). */
export function wilcoxonSignedRankP(a: number[], b: number[]): number;
/** Pooled rate: sum(num)/sum(den), 0 if den is 0. Use this, never a mean of per-match ratios. */
export function pooledRate(nums: number[], dens: number[]): number;
/** Latin hypercube sample: n points in [0,1]^dims using the given rng (() => number). */
export function latinHypercube(n: number, dims: number, rng: () => number): number[][];
/** Shannon entropy base 2 of a probability vector (ignores zeros). */
export function entropy(ps: number[]): number;
/** Solve a symmetric zero-sum matrix game by fictitious play (20000 iterations); returns row-player mixed strategy. M[i][j] = row i's win rate vs column j in [0,1]. */
export function mixedNashRow(M: number[][]): number[];
```
Create games/gba-gjam/ai/analytics.test.ts covering each function with a tiny hand-computed case (e.g. rocAuc perfect=1, random-ish=0.5; A12 of [1,2,3] vs [4,5,6] = 1; leadChanges [1,-1,1,0,2]=2; entropy2(0.5)=1; Wilcoxon identical arrays = 1; latinHypercube each dimension has exactly one point per 1/n stratum; mixedNashRow of rock-paper-scissors win matrix ~ [1/3,1/3,1/3] within 0.05).

## Done when
- `npx tsc --noEmit -p games/gba-gjam` passes
- `npx vitest run ai/analytics.test.ts` (from games/gba-gjam) passes

## Out of scope
src/**, ai/events.ts, ai/scorecard.ts, package.json.
~~~~

~~~~text
Epic: 1C feel knobs in the sim
Depends on: none

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mojarra, game in games/gba-gjam. Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing. Other workers edit ai/ files at the same time; edit ONLY src/sim.ts, src/balance.ts, src/sim.test.ts. Repo rule: `npm test -w games/gba-gjam` and `npm run build -w games/gba-gjam` must pass at the end (the planner runs the build; you run tests and tsc).

## Goal
The game plays a little slower and the dunk becomes contestable instead of free points, controlled by new tunable knobs in `SimBalanceConfig`.

## Read first
- src/balance.ts: `SimBalanceConfig`, `ORIGINAL_BALANCE_CONFIG`, `DEFAULT_BALANCE_CONFIG`.
- src/sim.ts: movement (~line 503: `baseSpeed`, `speedMul`, `carryMul`), the dunk trigger in the with-ball block (~line 553-596, `dunkReach`, `startDunk`), `startDunk` (~line 668), `stepDunk` (~line 745: the rim-swat window `u > 0.65 && u < 0.88 && !d.scored && !p.onFire` and its `dunkBlockBaseChance`), `releaseJumpShot` contest code (~line 817).
- src/sim.test.ts: existing style.

## Change
1. balance.ts: add these fields to `SimBalanceConfig` with doc comments, to `ORIGINAL_BALANCE_CONFIG` with values that reproduce current behaviour, and to `DEFAULT_BALANCE_CONFIG` with the new values:
   - `moveSpeedScale` (multiplier on `moveSpeed`; original 1.0, default 0.88)
   - `dunkWindupSec` (the dunk starts with a visible gather: p.dunk.t starts at 0 and the player's horizontal travel is the same, but during the first `dunkWindupSec` of the dunk the dunk can be disrupted by a grounded defender within 1.4 m via a shove/steal; original 0, default 0.18)
   - `dunkContestRadius` (m; a defender within this radius of the dunker's flight path during the second half of the flight, grounded or airborne, reduces the dunk's success: roll `Math.random() < dunkContestFailChance` per defender, once per dunk; original 0, default 2.2)
   - `dunkContestFailChance` (original 0, default 0.45; scaled by defender defense stat/100 added: `chance = dunkContestFailChance + defense/100 * 0.3`, capped 0.85; a failed contested dunk becomes a missed/rejected dunk using the existing REJECTED branch so the ball goes loose)
   - `dunkFireContestable` (boolean; original false = on-fire dunks cannot be swatted; default true so a Meteor dunk can also be stopped, at half the fail chance)
   - `dunkLandingRecoverySec` (seconds the dunker is `stunTimer`-style unable to act after a scored dunk, original 0, default 0.35, to stop instant chain-possession)
   - `dunkBaseReach`: change default from 2.8 to 2.3 (keep others).
2. sim.ts: use the knobs. Multiply `moveSpeed` by `this.bal.moveSpeedScale`. Implement contest, windup and recovery exactly as described; with `ORIGINAL_BALANCE_CONFIG` behaviour must be unchanged (all new knobs at 0/false). Keep all randomness through `Math.random()` (the harness seeds it) and do not change the order of existing `Math.random()` calls when the new knobs are zero.
3. sim.test.ts: add tests: (a) with `ORIGINAL_BALANCE_CONFIG`, a fixed-seed match gives the same final score twice; (b) `moveSpeedScale` 0.5 makes a player cover less distance than at 1.0 over 60 ticks; (c) with `dunkContestFailChance: 1, dunkContestRadius: 5` an attempted dunk with a defender nearby does not score. Use the existing test helpers/patterns in the file and the `balance` option of `MatchConfig`/`JamSimulation` constructor as the code does today (confirm how `bal` is passed in).

## Contract
New `SimBalanceConfig` fields, exact names/types: `moveSpeedScale: number; dunkWindupSec: number; dunkContestRadius: number; dunkContestFailChance: number; dunkFireContestable: boolean; dunkLandingRecoverySec: number;`. Other workers' scripts will set them through `Partial<SimBalanceConfig>`.

## Done when
- `npx tsc --noEmit -p games/gba-gjam` passes
- `npx vitest run` from games/gba-gjam passes (all existing tests too)

## Out of scope
ai/**, src/ai/**, src/ui.ts, src/renderer.ts, package.json.
~~~~

## Epic 2

~~~~text
Epic: 2A scorecard runner and bot bench
Depends on: Epic 1 done (ai/events.ts, ai/analytics.ts exist)

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mojarra, game games/gba-gjam. Other worker edits ai/sweep.ts at the same time. You own ai/scorecard.ts, ai/bench.ts and package.json (add scripts only).

## Goal
`npm run eval:scorecard -w games/gba-gjam [-- --n 60 --label x]` runs a bench and writes `ai/results/scorecard/<label>/REPORT.md` + `scorecard.json`.

## Read first
- ai/baseline.ts and ai/run.mjs (runner pattern: `export async function main(args: string[])`), src/ai/eval.ts (`runRoundRobin`, `wrapWithReactionCadence`, `simulateMatch`, `BotFactory`), ai/events.ts (`recordMatch`, types), ai/analytics.ts (exports), src/ai/bots/index.ts.

## Change
- ai/bench.ts: export `skillLadder(): { weak: BotFactory; medium: BotFactory; strong: BotFactory }` (same strategy, e.g. `champion-v2`, wrapped with cadence 300/150/60 ms via `wrapWithReactionCadence`), `noPassBot(base)`, `noTurboBot(base)` (wrappers that zero `passPressed` / `turbo` in the returned BotInput), and `personas(): BotFactory[]` (shove-hound, arc-architect, alley-oop-express, lockdown-counter, hybrid-ace, fire-feeder).
- ai/scorecard.ts `main(args)`: for a given `balance` (default `DEFAULT_BALANCE_CONFIG`, `--orig` uses ORIGINAL) and seed list `seed0..seed0+n-1`: (1) mirror matches (strong vs strong) via `recordMatch` to fit `fitWinProb` and compute per match GEI (WP path from the trace; regulation = 4*45 s), median GEI, band split, garbage-time share (LI<0.3), lead changes, winner max deficit, early-lead AUC at 25%/50%, flame lift (pooled `shotsOnFire`), dunk share of scores, mean passes per possession, mean possession seconds, points per game; (2) skill spread: strong vs weak win rate with and without fire (use `balance: { fireShotBonus: 0, fireTurboDrainScale: 1 }` as the "fire off" variant); (3) restricted play: strong vs noPass(strong), strong vs noTurbo(strong) win rates; (4) persona round-robin win-rate matrix, `mixedNashRow` entropy normalised by log2(N). Print a table to stdout and write REPORT.md with a "target band" column: median GEI 3-7, PPG 30-60 per team... (take the exact target bands from the Targets table at the bottom of docs/roadmaps/gba-gjam-fun-metrics.md) and a pass/fail mark.
- package.json: add `"eval:scorecard": "node ai/run.mjs scorecard"`.

## Done when
- `npx tsc --noEmit -p games/gba-gjam` passes
- `npm run eval:scorecard -w games/gba-gjam -- --n 8 --label smoke` finishes in under 5 minutes and writes the two files.

## Out of scope
src/**, ai/sweep.ts, other ai/*.ts.
~~~~

~~~~text
Epic: 2B CRN knob sweep
Depends on: Epic 1 done

## Environment
Repo root C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\mojarra, game games/gba-gjam. Other worker edits ai/scorecard.ts, ai/bench.ts and package.json at the same time; you own ONLY ai/sweep.ts. Tell the planner in your final message the script line to add: `"eval:sweep": "node ai/run.mjs sweep"`.

## Goal
`node ai/run.mjs sweep` (run from games/gba-gjam) draws a Latin-hypercube over the feel knobs, simulates the same seeds for every config (common random numbers), and writes `ai/results/sweep/<label>/REPORT.md` + `sweep.json` ranking knobs by effect on each metric.

## Read first
- src/balance.ts (knobs incl. new `moveSpeedScale`, `dunkBaseReach`, `dunkContestRadius`, `dunkContestFailChance`, `dunkLandingRecoverySec`, `shoveCooldownSec`, `threeBaseChance`, `contestScale`, `fireShotBonus`), ai/events.ts (`recordMatch`), ai/analytics.ts (`latinHypercube`, `varghaDelaneyA12`, `cliffsDelta`, `wilcoxonSignedRankP`, `pooledRate`), src/ai/eval.ts (`mulberry32`, `BotFactory`), ai/baseline.ts (`main` pattern).

## Change
- ai/sweep.ts: `export async function main(args: string[])`. Args: `--configs 40 --seeds 12 --label x`. Knob ranges: moveSpeedScale 0.7-1.0, dunkBaseReach 1.6-2.8, dunkContestRadius 1.2-3.0, dunkContestFailChance 0.2-0.7, dunkLandingRecoverySec 0-0.8, shoveCooldownSec 0.8-1.8, threeBaseChance 0.08-0.2, contestScale 1.0-1.8. For each config run `seeds` mirror matches (champion-v2 vs champion-v2, 150 ms cadence) through `recordMatch`; per config compute: points per team per game, dunk share, median GEI-like swing (simple: sum |diff change| per score / total), mean possession seconds, mean passes/possession, comeback rate (winner trailed by >=8 at some point), lead changes. Also compute each knob's Spearman rank correlation with each metric across configs (implement locally) and a ranked "which knob moves which metric" table. Also run `--vs-default`: the DEFAULT config vs each sampled config on identical seeds and report A12/Cliff's delta/Wilcoxon p for points-per-game.
- No dependency on a surrogate model library; Spearman is enough.

## Done when
- `npx tsc --noEmit -p games/gba-gjam` passes
- `node ai/run.mjs sweep --configs 4 --seeds 2 --label smoke` (from games/gba-gjam) finishes and writes both files.

## Out of scope
src/**, ai/scorecard.ts, ai/bench.ts, package.json.
~~~~

## Epic 3 (planner)

1. Run `eval:scorecard` for ORIGINAL and DEFAULT, then `eval:sweep`; read both.
2. Two to three research rounds: pick knobs that land metrics inside the Targets band, then human-feel check in the browser (`npm run dev -w games/gba-gjam`, phone viewport 390x844) and a recorded GIF demo uploaded via the media-upload MCP.
3. Promote to `DEFAULT_BALANCE_CONFIG`, write `ai/RESEARCH_ROUND_4.md` (findings, lessons, what bots cannot tell us), update `ai/README.md` and `AGENT_INDEX.md`, build + tests + smoke, PR to `cstabnick/lawn-gnome-panic`.

## Targets ("12-year-old best-of-the-best" realism)

| Metric | Target |
|---|---|
| Points per team per game (4x45 s) | 30-60 |
| Median GEI | 3-7 (mostly average and thriller bands) |
| Dunk share of scores | 10-25% |
| Mean possession seconds | 4-9 |
| Mean passes per possession | 1.5 or more |
| Mean lead changes | 4 or more |
| Early-lead AUC at 50% | below 0.85 |
| Strong vs weak win rate | above 70% (skill matters) |
| Strong vs noPass(strong) | strong wins above 60% (passing matters) |
| Garbage-time share | below 35% |
| Persona Nash entropy (normalised) | above 0.6 |
