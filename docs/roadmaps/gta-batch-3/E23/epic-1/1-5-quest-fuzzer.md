Epic: E23-1 Framework (parallel)
Depends on: none
Model: sonnet

## Environment
Read `docs/roadmaps/gta-batch-3/E23/env.md` first (worktree, toolchain, line endings, contracts in place, rules).

## Goal
A seeded, headless quest fuzzer built on the quest sim. User's words: "do some fuzzing or add fuzzing tool for quests.
so that we test out what happens if vehicle is destroyed, or player teleports away, or things like that so we can
handle edge cases either through the framework or via one-off fixes in code." It plays quests with the sim bot and
injects one disruption per run at a random step and time, then reports whether the quest still finished.
`npm run quest-fuzz -w games/gnome-theft-auto [-- --seed 7 --quest a,b --per-quest 3 --all-disruptions --out dir]`.

## Read first
- `src/questSim/runner.ts` (`runQuest(host, questId, opts)`, `RunOpts`, `roundTrip`), `src/questSim/harness.ts`
  (`openSession`: what a session exposes — `player`, `vehicles`, `npcs`, `watch`, `quests`, `world`, `scene`, `step`,
  `teleport`, `exit`, `shoot`; `headlessHost`), `src/questSim/cli.sim.test.ts` (env-driven CLI pattern, `loadNode()`,
  report writing), `src/questSim/types.ts` (`RunSession`, `QuestResult`, `SimFail`, `ALL_CHEATS`), `src/questSim/plans.ts`
  (`QUEST_PLANS`: ids, variants, budget), `tools/quest-sim.mjs` l.~132-165 (how `--headless` spawns vitest with env).
- `vehicles.ts` `explodeVehicle(v)`, `removeVehicle(scene, v)`; `types.ts` `Vehicle.sunk`, `World.hospital`.

## Change
- `src/questSim/runner.ts`: two optional `RunOpts` fields, nothing else changes:
  - `onSession?: (s: RunSession) => void` — called right after `host.open` and after every `roundTrip` reopen.
  - `reloadBeforeStep?: number` — before solving objective i === this, do `s = await roundTrip(host, cur, q, i,
    records)` (a save/reload mid-quest; the existing round trip at step 0 still happens).
- `src/questSim/fuzz/rng.ts` (new): `mulberry32(seed: number): () => number`, `pick<T>(rng, list: readonly T[]): T`.
- `src/questSim/fuzz/disruptions.ts` (new): `export type DisruptionId = 'destroy-vehicle' | 'sink-vehicle' |
  'teleport-away' | 'crack-player' | 'despawn-npc' | 'exit-vehicle' | 'idle-wait' | 'heat-4' | 'save-reload' |
  'traffic-sweep'` and `export const DISRUPTIONS: Record<DisruptionId, Disruption>` with
  `interface Disruption { id; describe: string; applies(s: RunSession): boolean; apply(s: RunSession, rng): Promise<string> }`
  (returns a one-line note of what it did). Rules:
  - destroy-vehicle: the player's vehicle, else the nearest `questOwned` vehicle within 200 m → `explodeVehicle`.
  - sink-vehicle: same pick, ground vehicles only → `v.sunk = true; v.sunkT = 0; v.speed = 0`.
  - teleport-away: exit the vehicle if in one (`s.exit()`), `s.teleport(x, z)` 400 m away along a random direction,
    clamped inside `world.half - 20`.
  - crack-player: as app.ts does on death: if in a vehicle `s.exit()`; then `if (!s.quests.onPlayerDown?.())
    s.teleport(world.hospital.x, world.hospital.z)`.
  - despawn-npc: one NPC in `s.npcs.list` with `n.quest` set → remove it from the list and `n.model.object.removeFromParent()` (`RunSession` has no `scene`)
    (what a buggy cleanup would do). Applies only when one exists.
  - exit-vehicle: `s.exit()` while driving.
  - idle-wait: step 120 sim s with no input (`s.drive({throttle:0,steer:0,lift:0})`, `s.walk({moveX:0,moveY:0,camYaw:0})`)
    — note: implement waiting inside the wrapped step (see below), not by recursion.
  - heat-4: `s.watch.addHeat(4)` (the sim's noHeat cheat clears it next step: run fuzz with cheats `all` minus
    `noHeat`/`noWanted` for this one: see the CLI).
  - save-reload: handled through `reloadBeforeStep` (applies to quests with > 1 objective).
  - traffic-sweep: what traffic.ts's cleanup does, to every vehicle at once: remove (`v.object.removeFromParent()` + splice
    from `s.vehicles`) every vehicle with `driver === 'none'`, not `questOwned`, not `kind === 'whirligig'`, farther
    than 60 m from the player.
- `src/questSim/fuzz/fuzz.ts` (new): `export async function fuzzRun(host, plan: FuzzPlan, opts): Promise<FuzzResult>`.
  `FuzzPlan { questId; variant?; disruption: DisruptionId; step: number; at: number /* sim s into the step */ }`.
  Uses `runQuest` with `onSession` to wrap `s.step`: the wrapper calls the original, then when the journal's
  `activeStep === plan.step` for `at` sim seconds (and no disruption yet) applies the disruption once and records the
  note. It also watches for a **softlock** after the disruption: the active quest's `getJournal().activeLines` empty
  and `quests.blips()` without any `kind === 'objective'` for 45 sim s while the quest is still active → throw
  `new SimFail('bug', 'softlock after <disruption>')`. And a **pin check** each second: every vehicle in
  `s.quests.pins?.vehicles() ?? []` must still be in `s.vehicles` → else `SimFail('bug', 'pinned vehicle removed')`.
  `FuzzResult = QuestResult & { plan: FuzzPlan; note: string; outcome: 'recovered' | 'bug' | 'bot' | 'content' |
  'blocked' | 'not-applied' }` (`not-applied` when the step was never reached for `at` s or `applies` was false).
  `export function planFuzz(rng, questIds, perQuest, all: boolean): FuzzPlan[]` — for each quest (and variant from
  `QUEST_PLANS`): `all` = every disruption once, else `perQuest` seeded picks; step = seeded index in
  `[0, objectives.length)`, at = seeded `1 + rng()*20`.
- `src/questSim/fuzz/report.ts` (new): `fuzzMarkdown(results, seed)`: a summary line (counts per outcome), a table
  Quest | Variant | Disruption | Step | At | Outcome | Reason, and a per-disruption summary table.
- `src/questSim/fuzz/fuzz.sim.test.ts` (new): like `cli.sim.test.ts`, `it.skipIf(!env.QUESTFUZZ_CLI)`; env
  `QUESTFUZZ_SEED` (default 1), `QUESTFUZZ_QUEST`, `QUESTFUZZ_PER_QUEST` (default 2), `QUESTFUZZ_ALL`,
  `QUESTFUZZ_OUT`. Cheats: `ALL_CHEATS` but with `noHeat: false, noWanted: false` for `heat-4` runs. Skip `nc-party`
  (needs a relay). Writes `fuzz.json` and `fuzz.md`, logs one line per run. Plus one ordinary (non-skipped) `it` that
  checks `planFuzz` is deterministic for a seed (same plans twice) — keep that one fast (no world build).
- `tools/quest-fuzz.mjs` (new, repo root `tools/`): plain Node, like the `--headless` branch of `tools/quest-sim.mjs`:
  parse `--seed`, `--quest`, `--per-quest`, `--all-disruptions`, `--out` (default `<os tmpdir>/gta-quest-fuzz/<stamp>`),
  spawn `npx vitest run --config vitest.sim.config.ts src/questSim/fuzz/fuzz.sim.test.ts` in the game dir with the env,
  then print `fuzz.md`. Header comment with usage.
- `games/gnome-theft-auto/package.json` scripts: add `"quest-fuzz": "node ../../tools/quest-fuzz.mjs"`.
- `docs/design/gnome-theft-auto/quest-fuzz.md` (new, short): what it does, the disruption list, outcomes, how to read
  the report, how to add a disruption, and that the sim has no traffic.ts/app.ts (so traffic-sweep and crack-player
  mirror them by hand).

## Contract
`RunOpts.onSession?`, `RunOpts.reloadBeforeStep?` (optional, default behaviour unchanged). The fuzzer only uses
`Quests.onPlayerDown?` and `Quests.pins?` through optional chaining (they may still be stubs while you work).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- `cd games/gnome-theft-auto && npx vitest run --config vitest.sim.config.ts src/questSim/fuzz/fuzz.sim.test.ts`
  passes (CLI case skipped, determinism case runs).
- `node tools/quest-fuzz.mjs --quest first-contract,sq-grid-truthers --per-quest 2 --seed 3` (from the worktree root)
  finishes and prints a report (outcomes may include bugs: that is the point; do not fix game code here).
- `npx vitest run --config vitest.sim.config.ts src/questSim/cli.sim.test.ts` still passes (skipped CLI).

## Out of scope
Game code outside `src/questSim/` (findings are fixed in a later issue), `harness.ts` (not needed: everything goes
through `RunSession`), `tools/quest-sim.mjs`, the solvers.
