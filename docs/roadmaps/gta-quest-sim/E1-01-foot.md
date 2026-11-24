Epic: 1 (solvers and tools, all parallel)
Depends on: none

(Read `docs/roadmaps/gta-quest-sim/_env.md` first: environment, style and solver rules.)

## Goal
The quest bot can solve the on-foot objective kinds: `crack`, `visit` and `choice`.

## Read first
- `src/quests/quests.ts`: `crackRun` (targets are spawned with `deps.npcs.spawnNamed(name, x, z, look, def.id)`, so the
  spawned `Npc` has `npc.quest === def.id`; a target counts when `quests.onCracked(npc)` reaches it; targets flee when
  the player is within 16 m) and `visitRun` (done when the player is within `obj.radius` of `obj.at`; with `obj.scene`
  an arrival scene plays first and the step completes when it ends).
- `src/quests/objectivesAction.ts`: `choiceRun` (done when the player stands within 4.5 m of `optionA.at` or `optionB.at`).
- `src/questSim/util.ts`, `src/questSim/types.ts`, `src/questSim/testkit.ts`.

## Change
- `src/questSim/solvers/foot.ts` (replace the stubs, keep the exported names `crackSolver`, `visitSolver`,
  `choiceSolver` and their `Solver<'crack'>` / `Solver<'visit'>` / `Solver<'choice'>` types):
  - `crackSolver.solve(obj, ctx, o)`: `runUntil` with a tick that picks the nearest live target
    (`ctx.npcs.list.find(n => n.quest === t.id)` for each `t` of `obj.targets`; skip npcs in state `'ragdoll'`),
    `travelTo(ctx, npc.x, npc.z, 'crack <name>', { standOff: 6 })` when farther than 12 m, then `ctx.shoot(npc)`. If
    no target npc can be found at all for 5 sim seconds while the step is not done, throw
    `new SimFail('bug', 'crack: no live target npc (ids ...)')`.
  - `visitSolver.solve`: `travelTo(ctx, obj.at[0], obj.at[1], 'visit <hint>')`, then `runUntil` with an empty tick (an
    arrival scene ends by itself in the harness). If the player is inside the radius but the step is not done after 30
    sim seconds, throw `new SimFail('bug', ...)` naming the spot.
  - `choiceSolver.solve`: take `o.choice ?? 'A'`, `travelTo` that option's `at`, `runUntil`. Log the label with
    `ctx.log('choice: ' + label)`.
  - Each solver has a `check(obj, world, questId, step)` returning `Finding[]` (class 'content', check
    'spot-off-world') for a spot with `Math.abs(x) > world.half || Math.abs(z) > world.half`.
- `src/questSim/solvers/foot.test.ts` (new): with `objectiveSession(sim, obj)` and real objectives from `questById`
  (`import { questById } from '../../quests/defs'`):
  - crack: `questById('first-contract')!.objectives[0]` (3 targets far apart): solved.
  - visit: the first `visit` objective of `questById('sq-grid-truthers')`.
  - choice: the 'choice' objective of `questById('sq-fescue-fugitive')`, once with `choice: 'A'`, once with 'B'.
  - Call `solver.solve(obj as never, s, { questId: TEST_QUEST, step: 0, budget: 300 })`, then assert
    `stepDone(s, TEST_QUEST, 0)` and `s.record.cheats.has('instantTravel')`. `s.dispose()` after each.

## Contract
`import type { Solver } from '../types'`; `export const crackSolver: Solver<'crack'>` etc. (unchanged names; index.ts
imports them). `solve(obj, ctx, o: SolveOpts): Promise<void>`.

## Done when
- `npx vitest run src/questSim/solvers/foot.test.ts` passes.
- `npx tsc --noEmit -p .` shows no error in `src/questSim/solvers/foot*.ts`.

## Out of scope
Every other file. Do not touch `src/quests/` or any other `src/questSim/` file.
