# Epic 7 foundation (done by the planner)

What exists before the issues run, so the workers and Epic 8 know where things are.

## Unlock (`games/gnome-theft-auto/src/quests/tessieUnlock.ts`, pure, tested in `tessieUnlock.test.ts`)

- The trigger beat lives in the quest save (`gta-quests-v1`, cloud-synced) as a pseudo-quest entry under
  `TESSIE.unlockKey` (`'tessie-unlock'`): `{ state: 'active' | 'done', step: 0, cracked: [], beat: '<questId>#<i>' }`.
  `QuestSave.beat?` is new; `mergeQuestSaves` keeps the local beat (else the remote one) and `summarizeQuestSaves`
  skips the entry.
- `ensureBeat` rolls one beat from every objective of chapters 1-4 once the save has started the story (any chapter 1-4
  quest has a save). `checkUnlock` turns the entry `'done'` once that objective is finished (quest done, or its step
  has passed the index). `quests.ts` runs `tessieCheck()` after every activation, objective step and completion, and
  `ensureBeat` only (no unlock) at startup, so an old save already past its beat unlocks at its next objective.
- `QuestDeps.onTessieUnlock()` fires once when it unlocks; `QuestDeps.tessieNow` (`?tessie=now`) forces it at startup.
- The quest (`quests/tessieQuest.ts`, id `sq-tessie`) has `prereq: TESSIE.unlockKey`, so the existing
  `isQuestAvailable` offers it only after the unlock. Its giver `loch-driftwood` is a `giver` marker in
  `loch-moss.level.json` at world (-726, -548) on the shore west of the dock.

## Quest engine additions

- `ObjectiveDef` kinds `tessie-sightings`, `tessie-buoys` (runners in `quests/objectivesTessie.ts`) and `tessie-escort`,
  `tessie-ride` (`quests/objectivesTessieEscort.ts`), registered in `OBJECTIVE_KINDS`.
- `choice` options are now `ChoiceOption` with an optional `achievement`, unlocked by `choiceRun`.
- `QuestDeps.atmosphere?` (`getMode`/`setMode`): the sightings hold the sky at `'golden'`.

## Tessie the vehicle

- `VehicleKind` `'tessie'`, `VEHICLES.tessie` (a boat: prefab `tessie` at scale 3 = 9 m, radius 4.2, draft 1.2,
  clamber, seat on the shell at y 3), `net.ts VEHICLE_CODES` code 16 (append-only; she is never relayed in practice:
  the quest and event are local, but a player riding her online shows as a Tessie to others, like any boat).
- She is ridden with the boat controls and the drive stick: no new buttons.

## Water fix

- `water.ts` `ISLANDS` (every document `island` terrain feature, world coordinates) and `WATER.islandSink` (3 m): the
  loch carve kept going over `tessie-island` (Epic 5 left this to Epic 4, and it was never done), so the island did not
  exist. Inside an island's radius x 1.3 the carved bed is raised to the natural ground minus 3 m, only when the
  island's top clears the water; cells that end up dry get no water level. The island is now dry within about 22 m of
  (-760, -720), top about 5.8 m, with a shallow shelf to about 28 m. Flat world (amplitude 0) unchanged.

## Stubs the issues fill

`quests/objectivesTessie.ts` (7C), `quests/objectivesTessieEscort.ts` (7D), `quests/tessieQuest.ts` words (7E),
`tessie.ts` (7F, plus `app.ts` wiring), `packages/prefabs/src/catalog/gta-tessie.ts` (7A: `tessie`, `sonar-buoy`,
`turtle-egg-clutch`, `hoa-dredger`), `gta-tessie-gear.ts` (7B: `turtle-shell-pack`, `loch-tam`, `loch-binoculars`,
`friendship-knot`), both registered in `catalog/index.ts`.

## Config

`config.ts` `TESSIE`: ids, achievement ids, bulletin ids, every quest position (all probed against the shipped
terrain: sightings, buoys and the escort route are in 4-5 m of water; the choice rings and giver are dry shore) and
the world-event timing.

## Issues and results

All six ran in parallel and passed their own checks: 7A prefabs (`tessie` 20 parts with pivots `head`,
`flipper-0..3`, and a `seat` the `sit` rule needs), 7B gear and achievements, 7C sightings and buoys, 7D escort and
ride, 7E words, Turfton FM bulletins and lore (entries `tessie`, `turfton-tattler`, ruling R-051), 7F open world
(`tessie.ts`: Driftwood on the shore, flipper animation, stray Tessies dive, the surfacing event) and `app.ts` wiring.

## Added after the workers ran

- Achievements test: besides the Wool Scarf, Snigms shared three more rewards (`pointy-hat` with `club-crowd`,
  `rain-hat` with `gta-rainmaker` (RARE), `leaf-cloak` with `para-bells`, `watering-can` with `inc-dry-survivor`).
  Snigms now gets `friendship-knot`, `straw-boater`, `garden-bonnet`, `chore-basket` (new, in `gta-tessie-gear.ts`)
  and the unused `clover-tea`.
- `packages/achievements` `LocalAchievementStore.save` merges with its memory: two unlocks in the same tick (the
  choice ending and the quest finish) lost the first one. Test added. The signed-in `SyncedAchievementStore` was not
  checked for the same race.
- `boatTraffic.ts` `loopRoute` moves points off islands (the steamer's loop and the quest patrol ran over Tessie's
  island once it existed).
- `TESSIE.dredgerSpeed` 2.4 (slower than the clutch; at 3.5 it ran the raft down before three rams were possible);
  the dredger does not pull while stunned.
- `quests.ts` re-reads the active runner's lines every 0.5 s and refreshes the tracker when they change (lines like
  "Take a boat out" went stale until the next progress).
- Golden fixture regenerated (the island adds about 8.7 k terrain vertices; the new giver).

## Checks

Build; `npm test -w games/gnome-theft-auto` 432/432; achievements 19/19; prefabs all; `npm run lore`; smoke at the
loch with `?tessie=now`; zfight at the island and the dock (one run of four reported a single transient pair, the
other three clean). A headless playthrough through `?debug` (boat teleports) went unlock -> sightings -> buoys ->
escort with 3 rams -> ride -> secret ending, with `gta-tessie-rumour`, `-finish` and `-secret` unlocked and no
console errors; quest tracker checked at 844x390 and 390x844. Not tried on a real phone or by hand with the sticks.

## For Epic 8

- Bulletins `gta-tessie-rumour`, `sq-tessie`, `gta-tessie-tabloid`, `tessie-surfaced` exist; no `gta-tessie-secret`
  on purpose.
- Demo: `?offline&no-intro&tessie=now&at=-726,-551,3.14` stands at Driftwood; after the quest `__gta.tessie.surfaceNow()`
  (with `?debug`) brings Tessie up for the "Tessie surfacing" demo.
- `?tessie=now` only unlocks; to jump to a step, seed `gta-quests-v1` with `{"tessie-unlock":{"state":"done",...},
  "sq-tessie":{"state":"active","step":N,"cracked":[]}}`.
- Tessie is a `VehicleKind`, so `gta-collector` ("drive every model", target 6) counts her like any new kind.
