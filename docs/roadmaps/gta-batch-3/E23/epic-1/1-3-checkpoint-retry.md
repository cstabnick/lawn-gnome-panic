Epic: E23-1 Framework (parallel)
Depends on: none (uses the `quests/questPins.ts` API, whose bodies issue 1-2 fills in parallel; code against the
signatures only)
Model: sonnet

## Environment
Read `docs/roadmaps/gta-batch-3/E23/env.md` first (worktree, toolchain, line endings, contracts in place, rules).

## Goal
The quest engine never makes the player click Restart Step. User's words: "if i fail a step stuff despawns. I think we
need a way to pin certain vehicle to not despawn during quests. or way to recover it or reset progress to last
checkpoint in quest. just so I don't have to manually click restart step". After this issue: each step saves a
checkpoint; the player's quest ride is pinned for the whole quest and recovered when wrecked/sunk; a failure (player
cracked, or a runner's `failed()` reason) restarts the step from its checkpoint after a short "RETRYING…" beat; each
step applies its Hat Watch policy.

## Read first
- `quests/quests.ts` (whole, ~860 lines): `createQuests`, `startStep`, `stepCheck`, `activate`, `abandonActive`,
  `restartActive`, `update`, the `Quests` interface (already has `onPlayerDown?`, `retryActive?`, `pins?`).
- `quests/types.ts`: `QuestSave.checkpoint?: QuestCheckpoint { step, x, z, yaw }`, `Run.failed?()`, `QuestDeps`
  (`player?`, `watch?`, `world`, `hud`, `placePlayer`, `cutscene`).
- `quests/questPins.ts`: `createQuestPins()` → `QuestPins` (`pinVehicle`, `pinNpc`, `setRide`, `ride`, `isPinned`,
  `releaseAll`, ...), `recoverVehicleNear(v, x, z, world)`.
- `quests/hoaPolicy.ts`: `hoaPolicyFor(q, step)`, `hoaCap(policy)`.
- `quests/questSave.ts`: `mergeQuestSaves`.

## Change
- `quests/quests.ts` inside `createQuests`:
  - `const pins = createQuestPins();` returned as `pins` on the Quests object.
  - **Checkpoint** in `startStep(q)`: when `deps.player` exists and `save.checkpoint?.step !== save.step`, set
    `save.checkpoint = { step: save.step, x: p.x, z: p.z, yaw: p.yaw }` and `storeSaves(saves)` (a resumed save keeps
    its saved checkpoint).
  - **HOA policy** in `startStep(q)`: `deps.watch?.setCap?.(hoaCap(hoaPolicyFor(q, save.step)))`. On quest done
    (in `stepCheck`'s finish branch) and in `abandonActive`: `deps.watch?.setCap?.(null)`.
  - **Quest ride** in `update`: while a quest is active and `deps.player?.vehicle` is a vehicle `v` that is not
    exploded, and `v !== pins.ride()`, and `!v.questOwned` (runner vehicles are questOwned already and the runner
    removes them itself: never pin those), call `pins.setRide(v)`.
  - **Ride recovery** in `update`: when `pins.ride()` is exploded or sunk and the player is not in it, count 3 s
    (let the wreck show), then `recoverVehicleNear(ride, player.x, player.z, deps.world)` and toast
    `'Your ride is back beside you.'` (no step restart).
  - **Failure → retry**: in `update`, when `run?.failed?.()` returns a reason and no retry is pending and no cutscene is
    active → `retryActive(reason)`.
  - `retryActive(reason)`: false when no active quest. If a retry is already pending return true. Else
    `deps.hud.banner('RETRYING…', 1500)`, `deps.hud.toast(reason, 3500)`, set `retryIn = 1.5`. In `update`, count it
    down (use dt, never setTimeout: the headless sim has no timers) and then call `doRetry()`.
  - `doRetry()`: `run?.cleanup(); run = null;` if the player is in a vehicle: `deps.player.exit()` and set that
    vehicle's `driver = 'none'`; `cp = save.checkpoint` (fallback: the player's position); `deps.placePlayer(cp.x, cp.z,
    cp.yaw)`; if `pins.ride()` exists: `recoverVehicleNear(ride, cp.x, cp.z, deps.world)`; `deps.watch?.clear()`;
    `startStep(q)` (keeps `save.cracked`: crack progress in the step is part of the checkpoint); toast
    `'Back at the start of: ' + objective.text`.
  - `onPlayerDown()`: false when no quest is active. Else retry **at once** (no 1.5 s wait: the death beat already
    happened): `doRetry()` with the reason toast `'Cracked! Retrying the step.'`; return true.
  - `abandonActive` and quest completion: `pins.releaseAll()`; clear any pending retry.
  - `restartActive` unchanged, except it also brings the ride back: `if (pins.ride()) recoverVehicleNear(...)` at the
    player.
- `quests/questSave.ts` `mergeQuestSaves`: keep `checkpoint` from the side whose `step` is the merged step (either if
  equal; prefer local).
- `quests/quests.retry.test.ts` (new): use the setup in `quests/quests.test.ts` (copy its fake deps: scene, world, npcs,
  hud recorder, cutscene, localStorage) with a small inline quest list. Cover: checkpoint written on step start and kept
  across a reload (create a second engine on the same storage); a fake runner `failed()` → after 1.5 s of `update`
  the step restarts and the player is placed at the checkpoint (`placePlayer` called with the checkpoint); a
  `{ kind: 'convoy-ambush' }`-free quest with `hoa: 'off'` calls `watch.setCap(0)` on start and `setCap(null)` on
  abandon; `onPlayerDown()` false with no quest, true with one. For the failing runner, the easiest path is a quest
  with a `crack` objective and making the target NPC vanish is NOT the runner's failure; instead monkey-patch: after
  starting, wrap the engine's run through a quest whose objective is `visit` and assert retry via `retryActive('x')`
  directly, plus one test of the `failed()` path if you can reach it cleanly (it is fine to export a small
  `__setRunForTest` only if unavoidable; prefer not).

## Contract
`Quests.onPlayerDown?(): boolean`, `Quests.retryActive?(reason: string): boolean`, `Quests.pins?: QuestPins` (already
declared; implement them). Banner text exactly `'RETRYING…'`.

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.
- `cd games/gnome-theft-auto && npx vitest run src/quests/` passes (all quest tests, incl. your new one).

## Out of scope
`app.ts` (the lead wires `onPlayerDown` into the death flow), `questPins.ts` (issue 1-2), objective runners
(`objectives*.ts`), `police.ts`, `hud.ts`, the quest sim.
