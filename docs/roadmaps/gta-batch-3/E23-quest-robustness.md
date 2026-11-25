# E23 Quest robustness, fuzzing and HOA balance
Wave: 3 · Depends on: E03 · Kind: Engine + Fix
Source items:
- L101 "if i fail a step stuff despawns. I think we need a way to pin certain vehicle to not depsawn during quests. or way
  to recover it or reset progress to last checkpoint in quest. just so I don't ahve to manually clcik restart step"
- L102 "do some fuzzing or add fuzzing tool for quests. so that we test out what happens if vehicle is destroyed, or player
  teleports away, or things like that so we can handle edge cases either through the framework or via one-off fixes in
  code."
- L103 "audit and make sure that hat can sometimes be disabled on quests that require a lot of shooting as fighting the hat
  right now is effectively impossible. either that or rebalacne the hat if you think thati s better game design. they
  currently teleport in really quick and player has no visual aid to see how to lose levels."
- L104 (standing): keep the charm; grow it where growing pains appear.

## Goal

A failed quest step never leaves the player stranded or clicking Restart Step: quest entities are pinned for the life of
the quest, and a failure (player cracked, quest ride wrecked or sunk, a runner reporting it cannot go on) turns into a
short "Retrying…" beat that puts the player back at the step's checkpoint with their ride beside them. A seeded headless
fuzzer throws disruptions at every quest and reports what breaks. The Hat Watch stops being a wall: quests that are
mostly shooting cap it, units drive in from out of view after a dispatch delay, and the HUD shows how to lose them.

## Scope

In:
- **Pins (L101)**: `quests/questPins.ts`, a per-quest registry of vehicles, NPCs and props. A pinned vehicle is
  `questOwned` (traffic cleanup, parking, parkSync already skip those) and is released (questOwned back to its old value)
  when the quest ends or is abandoned. The player's **quest ride** is pinned too: the ride they sit in when a step starts,
  or the one `ensureRideNear` delivers/loans.
- **Checkpoint + auto retry (L101)**: `QuestSave.checkpoint` (player x, z, yaw at step start, saved). Failure sources:
  `quests.onPlayerDown()` (app.ts on crack), the pinned quest ride exploded or sunk while the player is not in it and the
  step needs a ride, and an optional `Run.failed?()` a runner returns a reason from. On failure: a "RETRYING…" banner and
  toast with the reason, ~1.5 s later the step restarts (run.cleanup, startStep) with the player put at the checkpoint and
  the quest ride repaired, unsunk and moved beside them. Crack progress in the step (`cracked`) is kept. Restart Step in
  the journal stays as a manual escape hatch.
- **Fuzzer (L102)**: `src/questSim/fuzz/` on top of the quest sim's headless layer. Disruptions: destroy the quest
  vehicle, sink it, teleport the player 400 m away (on foot), crack the player (death flow), despawn a required NPC
  (crack target / leader rider) the way a cleanup would, exit the vehicle, wait 120 s idle, add 4 hats of heat,
  save/reload mid-quest, and a "traffic sweep" that applies traffic.ts's cleanup rule to every non-questOwned driverless
  vehicle. Seeded (mulberry32), every quest x a seeded pick of disruptions at a random step and time, at most 6 sim
  players (one at a time headless). Report `report.json` + `report.md`: outcome per run (recovered / softlock / bug /
  bot), with the step, disruption and reason. `npm run quest-fuzz -w games/gnome-theft-auto`. Doc
  `docs/design/gnome-theft-auto/quest-fuzz.md`. Fixes: framework first (pins/retry), one-offs where a runner needs it.
- **Sim bot (L102 extra, if cheap)**: `city-glow-band-express` (timed push-bike gates) and `city-skyway-robbery` (deck
  ramps) pass in the sim.
- **HOA policy + rebalance (L103)**, decision: **both**. A cap alone hides the problem everywhere else; a rebalance alone
  still leaves the shoot-outs (convoy ambush, boss combine, derby) where the player is meant to fight someone else
  fighting three hats at once. So:
  - Policy: `QuestDef.hoa` and `ObjectiveDef` `hoa` (step wins): `'off'` (no Hat Watch while the step runs, quest heat
    ignored) or `{ cap: n }` (heat cannot pass n). Default by kind: `convoy-ambush`, `boss-combine`, `survive-derby`
    cap 1 (the Watch notices, no pursuits); everything else uncapped. Story heat that is the point of a step
    (`heatOnEnter: 4` getaways) stays. Applied through `watch.setCap(cap | null)` at step start, cleared at quest end.
  - Rebalance (police.ts + config): a level-up **dispatches** units: they appear after `WATCH.dispatchDelay` s (6 s,
    shorter per level), officers on walk points 60–110 m out and pursuits on road nodes 90–160 m out, preferring points
    behind the player's heading (out of view), never within 50 m. Cooling needs **line of sight**: a unit only "sees"
    the player within `SEEN_DISTANCE` with no world box on the segment between them. A **search area** (last seen
    point, radius 45 + 15 per level) follows the player while seen; outside it and unseen, heat cools after `coolDelay`.
  - Visual aid: `watch.search()` → HUD: a pulsing search circle on the minimap and big map, and an EVADE meter under
    the hats ("SEEN" / "Leave the circle" / "Lying low 63%"), 390x844 safe.
- Out: new quests, new HOA unit types, online relaying of heat (heat is per player already), Unity, other games.

## Code pointers (confirmed)

- Quest engine `games/gnome-theft-auto/src/quests/quests.ts`: `createQuests`, `startStep`, `stepCheck`, `activate`,
  `restartActive`, `abandonActive`, `OBJECTIVE_KINDS`. Types `quests/types.ts`: `QuestDef`, `ObjectiveDef`, `QuestSave`,
  `QuestDeps` (`ensureRideNear`), `Run`. Save parsing `quests/questSave.ts` (`parseSavesJson`, `mergeQuestSaves`).
- Runners: `objectivesDrive.ts` (steal-deliver respawns a wrecked target at pickup; chase-follow re-spawns a wrecked
  leader; convoy hauler), `objectivesCity.ts` (checkpoints: wrecked ride → back to gate 0), `objectivesRace.ts`,
  `objectivesAction.ts`, `objectivesTessie*.ts`. All set `questOwned` on their own vehicles already.
- Cleanup: `traffic.ts` ~l.859 (over-count, farthest driver-less beyond 60 m, skips `questOwned`), `npcs.ts` trim (skips
  `n.quest`), `online/parkSync.ts` (questOwned = "gone", not relayed as parked).
- Death: `app.ts` `crackedUp()` / `wakeAtHospital()` (l.~1366-1408). Quest deps wiring l.~570; `ensureRideNear` l.~587
  (`quests/ensureRide.ts` returns 'delivered' | 'loaner' | ...).
- Hat Watch: `police.ts` `createWatch` (`spawnOfficer` 25–45 m on walk points, `spawnPursuit` 32–75 m on road nodes,
  cooling via `unseenFor` / `HEAT.coolDelay`), `config.ts` `HEAT`, `WATCH`, `MAX_HEAT`; `types.ts` `Watch`, `HudState`.
  HUD hats `hud.ts` `drawMeter(.., 'wanted', ..)` and `s.heat` block (~l.1211), minimap `drawMap`, big map `drawBig`.
  app.ts sets `heat` on `hud.set` (~l.2279).
- Quest sim: `src/questSim/harness.ts` (`openSession`, `headlessHost`), `runner.ts` (`runQuest`), `solvers/`,
  `cli.sim.test.ts`, `tools/quest-sim.mjs` (`--headless`). Baseline: 55 pass, 2 fail (the two bot limits), 1 blocked.

## Contracts this epic provides

- `Run.failed?(): string | null`, `QuestSave.checkpoint`, `Quests.onPlayerDown(): boolean` (true = quest will retry and
  place the player), `QuestDeps.pins` usage via `quests/questPins.ts` (`createQuestPins()`), `QuestDef.hoa` /
  objective `hoa`, `Watch.setCap`, `Watch.search`, `HudState.search`. Later quest epics (E20–E22, E24, E25) get retry
  and pins for free and set `hoa` on shoot-outs.
- `npm run quest-fuzz` for every later quest epic.

## Contracts consumed

- E03: `ensureRideNear`, `followWatchdog`, quest-owned scene vehicles, the quest sim.

## Online / mobile / achievements / prefabs / lore

- Online: quest state stays per player; pinned vehicles are `questOwned` like every other quest vehicle (parkSync keeps
  them out of the parked relay, and the driven ride relays as the player's vehicle). Heat and the search area are local.
- Mobile: no new controls; retry banner reuses `hud.banner`; the evade meter sits in the hats slot and fits 390x844.
- Achievements: none planned (a fix/engine epic); prefabs: none (circle is a HUD canvas drawing); lore: "Retrying"
  and evade lines are UI text, the Hat Watch / HOA names follow canon.

## Risks and decisions

- Retry vs hospital: a crack mid-quest still plays the death beat and charges the hospital; the quest then places the
  player at the checkpoint instead of the hospital door. Decided: yes (the user wants no manual restart).
- A step with its own recovery (steal-deliver, checkpoints, race) keeps it; framework retry is for what it cannot see.
- Rebalance must not make the Watch toothless: dispatch delay shrinks with level (6, 5, 4, 3 s), units are still 6/8
  at level 3/4, and line of sight only affects cooling, not spotting.
- The fuzzer can only find what the sim models (no traffic.ts in the sim): the "traffic sweep" disruption applies the
  same rule by hand; documented.

## Done when

- Build, `npm test -w games/gnome-theft-auto`, quest sim (no new fails), fuzzer run summarised, smoke check passes.
- A crack mid-quest or a wrecked quest ride retries the step from its checkpoint without the journal.
- Convoy/boss/derby steps never go past 1 hat; a level-up shows units arriving from out of view after a delay; the HUD
  shows the search circle and the evade meter.
