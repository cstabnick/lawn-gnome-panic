# E23 Quest robustness, fuzzing and HOA balance: roadmap

Brief: [../E23-quest-robustness.md](../E23-quest-robustness.md). Game: `games/gnome-theft-auto`.
Shared rules for every issue: [env.md](env.md).

## Baseline

Quest sim `--all --force`: 55 pass, 2 fail (`city-glow-band-express` timed gates, `city-skyway-robbery` deck ramp: bot
limits), 1 blocked (`nc-party`, relay). Found while reading: `steal-deliver` and `chase-follow` "respawn" a wrecked
vehicle with `repairVehicle`, which does not clear `exploded`, so the wreck check fires again every frame.

## Foundation (lead, before epic 1)

Type contracts (`quests/types.ts`: `HoaPolicy`, `QuestDef.hoa/hoaSteps`, `QuestCheckpoint`, `QuestSave.checkpoint`,
`Run.failed`; `types.ts`: `Watch.setCap/search`, `WatchSearch`, `HudState.search`; `quests.ts` `Quests.onPlayerDown /
retryActive / pins`), `config.ts` WATCH dispatch/spawn/search numbers, `quests/hoaPolicy.ts` (whole), `quests/questPins.ts`
(stub).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1 Framework | `tsc --noEmit`, each issue's tests | 6 (1-1 .. 1-6), parallel |
| 2 Wiring + fuzz fixes | build, `npm test`, quest sim, fuzzer, smoke | lead wiring (app.ts) + fix issues from the fuzz report |

| Issue | Items | Changes | Model |
|---|---|---|---|
| 1-1 Hat Watch rebalance | L103 | `police.ts`, `police.rebalance.test.ts` (new) | sonnet |
| 1-2 Quest pins | L101 | `quests/questPins.ts`, `quests/questPins.test.ts` (new) | haiku |
| 1-3 Checkpoint + auto retry | L101, L103 policy | `quests/quests.ts`, `quests/questSave.ts`, `quests/quests.retry.test.ts` (new) | sonnet |
| 1-4 Evade HUD | L103 | `hud.ts`, `hud.evade.test.ts` (new) | sonnet |
| 1-5 Quest fuzzer | L102 | `questSim/runner.ts`, `questSim/fuzz/*` (new), `tools/quest-fuzz.mjs` (new), game `package.json`, `docs/design/gnome-theft-auto/quest-fuzz.md` (new) | sonnet |
| 1-6 Sim bot timed gates | L102 extra | `questSim/solvers/checkpoints.ts`, `questSim/solvers/driver.ts` | sonnet |

No file is under two issues. 1-3 codes against the `questPins.ts` signatures that 1-2 fills in. Epic 2: the lead wires
app.ts (death → `quests.onPlayerDown`, `hud.set({ search: watch.search?.() })`), runs the fuzzer, and fixes findings
(framework first, then one-offs in runners). Online: nothing new relayed (pins are `questOwned`, heat is local).
Mobile: evade meter and retry banner checked at 390x844; no new controls.

Issue texts: `epic-1/*.md`. Results: end of this file.

## Results

| Item | What landed |
|---|---|
| L101 | `questPins.ts` (pins; the player's quest ride gets `Vehicle.questPinned`, which traffic cleanup skips but the Lock-Up still accepts); checkpoint per step in the save; ride wrecked/sunk → back beside the player after 3 s; failure (`Run.failed()`, player cracked via `quests.onPlayerDown()` in `app.ts` `wakeAtHospital`) → "RETRYING…" and the step restarts at its checkpoint with crack progress kept; crack steps report a vanished target as `failed()`; the checkpoints job ride is quest-owned while the job runs. |
| L102 | `npm run quest-fuzz` (`src/questSim/fuzz/`, `tools/quest-fuzz.mjs`, doc `docs/design/gnome-theft-auto/quest-fuzz.md`): 10 disruptions, seeded, softlock and pin checks, solver second chances. Sim bot: `city-glow-band-express` and `city-skyway-robbery` now pass (quest sim 57 pass, 1 blocked of 58). |
| L103 | Both a policy and a rebalance. Policy: `QuestDef.hoa` / `hoaSteps`, convoy/boss/derby capped at 1 hat by kind, 8 squad shoot-out crack steps tagged `hoaSteps: { n: { cap: 1 } }`; story getaways (`heatOnEnter: 4`) unchanged. Rebalance: dispatch delay 6/5/4/3 s, officers 60-110 m and pursuits 90-160 m out preferring behind the player, line-of-sight cooling, a search circle (faster cooling outside it). HUD: search circle on minimap and big map, EVADE meter with "Units en route / SEEN / Leave the circle / Lying low n%". |

Fuzz findings and fixes:
- Wrecked quest vehicles (steal-deliver target, chase leader, convoy hauler, checkpoints ride) were "respawned" with `repairVehicle`, which leaves `exploded` set: the wreck branch fired every frame. Now `restoreVehicle` (clears exploded/sunk, rebuilds the body). Sunk targets were never handled: now treated like wrecks, put back on the ground at the pickup.
- A crack-player retry left a removed runner vehicle pinned as the ride (`pinned vehicle removed`): pins now prune vehicles that left the world.
- Sim bot: steal-deliver solver re-finds the target where it was left (orange blip), not only at the pickup.
- Final runs: seed 1 (2 per quest) 114 runs, 59 recovered, 0 bug, 0 bot, 55 not-applied; seed 2 (all disruptions, 7 vehicle-heavy quests) 68 runs, 42 recovered, 0 bug, 26 not-applied.

Open: many disruptions are "not-applied" (no quest vehicle/NPC at that step); the evade meter was not checked in a real phone browser (layout golden passes, smoke OK); online: nothing new relayed.
