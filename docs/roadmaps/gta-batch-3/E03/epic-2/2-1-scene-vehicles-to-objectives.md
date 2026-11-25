Epic: 2 Quest vehicles (after epic 1, which edits objectivesDrive.ts chaseFollowRun) · Items: L49 "big lous car loses its mods after the cutscene", L79 "the parade float quest boot float is not on orange marker. the whole quest seems bugged." · Model: sonnet
Depends on: epic 1 issue 1-1 (same file `quests/objectivesDrive.ts`; it is finished when you start)

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
The vehicle a cutscene shows is the vehicle the next objective uses: same place, same look (mods). Big Lou's dressed VIP
car keeps its paint/finish/tyres/lamps; the Founder's Boot float is exactly one float, standing on its orange marker,
and the whole quest `ch1-founders-boot` plays start to finish.

## What is known (verify; find the precise root cause first)
- L49: `cutscene/scenes/side/bigLou.ts` dresses a scene vehicle with `loadout: { paint, finish: 'pearl', tyre:
  'whitewall', lamp, beam }` (~94, ~137); `cutscene/sceneVehicles.ts` `spawnSceneVehicle` applies it
  (`setVehicleLook(v, normalizeLoadout({ ...v.look, ...def.loadout }, v.tint))`); a scene vehicle is destroyed when the
  scene ends unless `keep`; `from: 'player'` vehicles (`cutscene/director.ts` ~386) ignore `loadout`, and
  `poseSceneVehicle` drops `v.sim` (check the sim chassis and look come back after the scene). The objective
  (`quests/sideQuests.ts` `sq-big-lou-embargo`, `steal-deliver`, `vehicleKind: 'zero-turn'`, `spawnAt`) spawns a fresh
  stock vehicle via `quests/objectivesDrive.ts` `stealDeliverRun` -> `createVehicle`. Also check `city/cityCast.ts` `castRide`.
- L79: `quests/chapter1.ts` `ch1-founders-boot` objective 0: `steal-deliver`, `vehicleKind: 'boot-float'`,
  `spawnAt: [0, -120, PI/2]` (in the middle of the x=0 / z=-120 crossing), but the staged set
  (`quests/stages/turftonB.ts` ~179) parks the float at `[2.5, -120]` yaw `-PI/2`, and the intro scene
  (`cutscene/scenes/story/ch1d.ts` `FOUNDERS_BOOT_INTRO`, ~33-92) spawns its own float and drives it away on
  `parade-route` (async drive, speed 11) - then it is removed. There is also a permanently parked boot-float in the
  world at (-72, -72) (`world.ts` ~1073) and a wedding-float street event (`events/catalog/scenes.ts` ~90). The quest's
  pickup ring + cone follow `target` (the objective's own float) in `stealDeliverRun`, so find what "not on the orange
  marker" really is: e.g. `clearVehicleSpawn` pushing the spawn away, the float prefab (`scale: 3.2`, radius 3.8) origin
  offset from `v.x/v.z`, another float near the marker, the blip vs the stage `pull-up` mark, or traffic/parking moving
  the unowned float (stealDeliver never sets `target.questOwned`; chase-follow does). Read `parking.ts` / `traffic.ts`
  for what they do to `driver: 'none'` vehicles in the road. Then walk the rest of the quest: objective 1 `crack`
  targets near the Amphitheater, objective 2 `steal-deliver` combine with `heatOnEnter: 4`, and the outro.
- Quest sim: `npm run quest-sim -w games/gnome-theft-auto -- --quest ch1-founders-boot,sq-big-lou-embargo --force`
  (headless, instant travel; passes today because it teleports). E2E (real page) is `npm run quest-sim:e2e` with a dev
  server: optional; do not start a dev server on port 5303 (the lead uses it); use 5311 if you need one, and stop it.

## Change
- `quests/types.ts`: `steal-deliver` objective gets `loadout?: Partial<...>` (the same loadout type sceneVehicles uses)
  and `fromScene?: string` (the scene vehicle id to hand over). Only these fields.
- `quests/objectivesDrive.ts` `stealDeliverRun` ONLY: set `target.questOwned = true` while not driven by the player
  (check what that flag means in traffic/parking first), apply `obj.loadout` after `createVehicle` with the same call
  sceneVehicles uses, and when `fromScene` names a `keep` vehicle that the director handed over, adopt that vehicle
  instead of creating one (position, yaw, look) - or, simpler and acceptable: align the objective's `spawnAt` + loadout
  with the scene's end pose and look, and make sure the scene's own vehicle is gone. Choose the simplest that removes
  the duplicate and keeps the look; write the choice in your report.
- `quests/sideQuests.ts` (`sq-big-lou-embargo`) and `quests/chapter1.ts` (`ch1-founders-boot`): loadout / spawnAt so
  the objective vehicle matches the scene (float spawned at a clear kerb spot that matches the staged `boot-float-start`
  mark `[2.5, -120]` yaw `-PI/2`, not the crossing centre).
- `cutscene/scenes/side/bigLou.ts`, `cutscene/scenes/story/ch1d.ts`, `cutscene/sceneVehicles.ts`/`director.ts` only as
  needed (e.g. `keep` handover, `from: 'player'` restoring `sim` and `look`).
- A test: `quests/stages.test.ts`-style or a new `quests/sceneHandover.test.ts`: the steal-deliver spawn of
  `ch1-founders-boot` obj 0 equals the staged float mark (within 1 m) and is clear of boxes; Big Lou's objective has
  the same loadout as the scene vehicle.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/quests src/cutscene` pass (`src/cutscene/pacing.test.ts` may be slow).
- `npm run quest-sim -w games/gnome-theft-auto -- --quest ch1-founders-boot,sq-big-lou-embargo --force` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean. Report the root cause of each item.

## Out of scope
`chaseFollowRun`, app.ts, `quests/quests.ts` and `quests/ensureRide.ts` (other issues), lockup.
