# E11 Coast and boardwalk: roadmap

Brief: [../E11-coast-and-boardwalk.md](../E11-coast-and-boardwalk.md) (source items L35, L51). Adjusted to the merged
contracts: E01/E28 (the `south-shore` band, sites `ocean`, `beach`, `boardwalk`, `ferris-wheel`, `pirate-ship`), E05
(interiors, rooftops: the pier and ship deck are walkable rooftops, the captain's cabin is an interior), E08 (Acorns), E09
(region sounds), E27 (skimming stays as is). Environment for every issue: [_env.md](_env.md).

## Foundation (done by the lead before epic 1)

- **The Saltwater:** a still-water marker `water/saltwater` in `south-shore.level.json` filling the `ocean` slot (centre
  (0, 1490), 3580 x 600; superellipse, so the far east/west ends are headlands), `WATER.bodies` (depth 7, shelf 0.5,
  bank 14, `meshStep` 6: the surface grid is coarser than the lochs' to keep the triangle count sane), `WAVES.bodyGain`
  1.6 (the brief's cap, so the tow rules still allow a clean run). Surface ~y -8.9.
- **The Saltcut:** a 14 m water path from the Puddle Sea's south shore (700, 882) to the Saltwater (745, 1205), in
  `WATER.order` between `water/puddle-sea` and `water/saltwater`: boats sail from Loch Moss all the way to the sea. The
  automatic road bridge stands where it crosses `south-band-east` (727.5, 1000). Tests updated (`levels.test.ts`,
  `water.test.ts`, `sites.test.ts`: water sites and their children hold their own water).
- `src/coast/` skeleton: `config.ts` (every position and id), `types.ts`, `index.ts` (`buildCoast` in `world.ts`,
  `installCoast` in `app.ts`: update, blips, `drives`/`stepRider` in the vehicle-step slot), `sign.ts` (painted signs),
  stubs for `boardwalk.ts`, `pirateShip.ts`, `spokewheel.ts`, `life.ts`.
- Vehicle kinds `tow-ski` (water-skis) and `spoke-gondola` (a Spokewheel teacup the coast moves): `types.ts`,
  `config.ts` VEHICLES, `net.ts` VEHICLE_CODES (appended), engine sounds, park-sync untracked, jobs boat check.
- Prefab catalog files `gta-coast.ts` (with `water-skis`, `spokewheel-gondola`), `gta-coast-kit.ts`, `gta-coast-gear.ts`,
  registered in `catalog/index.ts`. Calm water at the pier end and the tube launch (`waterMesh.ts`).

## Shape

| Epic | Issues | Worker | Done when |
|---|---|---|---|
| 1 Foundation: prefabs, physics, lore, water | [1A](1A-coast-structures.md) structures, [1B](1B-coast-kit.md) kit, [1C](1C-coast-gear.md) gear, [1D](1D-ski-physics.md) ski physics + courses, [1E](1E-coast-lore.md) lore, [1F](1F-ocean-traffic.md) ocean tests + boats | Haiku x6 | prefabs tests, tubing tests, `npm run lore`, water tests |
| 2 Places and rides | [2A](2A-boardwalk-pier.md) boardwalk + pier, [2B](2B-spokewheel.md) Spokewheel ride, [2C](2C-bathtub-queen.md) the Bathtub Queen, [2D](2D-ski-runtime.md) water-ski runtime + Driftwood's tow, [2E](2E-achievements-facts.md) achievements + facts | Sonnet x4, Haiku x1 | game tsc, coast/tubing/jobs tests, achievements tests |
| 3 Life and quests (ran alongside 2) | [3A](3A-coast-quests.md) four `coast-` quests, [3B](3B-coast-life.md) vignettes, residents, sound | Sonnet x2 | quest tests + side-quest sim, life test |
| Lead | build, full tests, golden, smoke, zfight, screenshot pass ([screens.md](screens.md)), AGENT_INDEX | – | all green |

13 issues. Dependencies: epic 2 and 3 need epic 1's prefabs and tubing contracts; epic 3 ran in parallel with epic 2
on fixed event contracts (`gta:spokewheel-ride`, `gta:tow-run`, `gta:queen-chest`) instead of waiting.

## Contracts this epic provides (for E18, E21 and later)

- `src/coast/config.ts`: `OCEAN_ID` (`'water/saltwater'`), `SALTCUT_ID`, `COAST` (boardwalk rect and stalls, pier rects
  and deck height, Spokewheel position/period, ship position/deck/cabin door, Last Tube, slalom, wake ramp, tow loop),
  `COAST_QUESTS`, `COAST_UNLOCK_AFTER` (the `coast` unlock beat; placeholder on today's story, E20/E21 move it to spine
  rows #45/#46), `COAST_ACH`.
- `spokewheelAngle(t)` / `gondolaPos(k, angle, groundY)` (pure; the wheel is the same on every client), the window events
  `gta:spokewheel-ride`, `gta:tow-run` `{ course, gates, finished, mode }`, `gta:queen-chest`.
- Tubing: `TubeState.mode` (`'tube' | 'ski'`), `SKI` tuning, `towTuning`, `rampKick`, `TOW_COURSES` / `courseNear`,
  `TowWire.mode`. Interior `bathtub-queen-cabin`; rooftops `long-spoon-*`, `bathtub-queen-deck`, `bathtub-queen-gangplank`.

## Decisions

- The ship stays moored (the brief's decision); R-185 says she sails only at night, offstage.
- Online: the wheel angle is a pure function of `waveTime()`; a rider's gondola and skis are ordinary relayed vehicles
  (`spoke-gondola`, `tow-ski`); Driftwood's NPC tow boat is local only (a solo convenience; online players tow each other
  with real boats as before). Sea state is the existing `seaSync`.
- Party slice: none. A 20-60 s four-player ski slalom would fit later (backlog row in `packages/party/README.md` if the
  lead adds one); not built here.

## Result (lead)

- Run: epic 1 on Haiku, epics 2-3 on Sonnet (2A, 2D, 3A, 3B were cut off by a rate limit and re-run; 3B finished on Haiku).
- Lead fixes after the workers: Driftwood's tow loop now weaves through every slalom gate (`coast/config.test.ts`
  drives it and checks it finishes and keeps off the ship); the cabin interior is defined at import (quest givers read it
  at start-up); rooftop ids guarded against a second world build; z-fighting on the boardwalk and pier (planks painted by
  a texture on 30 m slabs 3 cm apart instead of touching boxes, the bowl and gangplank lifted off the deck plane, rails
  moved in from the deck edges); `waterworks.test.ts` now counts the Saltcut's arch bridge; golden layout regenerated.
- Checks: build, `npm test -w games/gnome-theft-auto` (3547 passed), prefabs, achievements, `npm run lore`, quest-sim
  suites, smoke at the coast (`gta-gnomlet`), zfight on the boardwalk (no coast pairs left; the remaining ones are
  older: glaze shells, fringe patches, the Puddle Sea shore).

## Deferred / known issues

- Not played by hand: the Spokewheel ride, skiing behind Driftwood, the ship's deck and cabin exit, the four quests
  (they pass the quest simulator, which bumps the coast probes directly rather than riding or skiing).
- The player rides the skis seated (the app seats the driver); only NPC skiers stand. Standing needs an `app.ts` pose hook.
- Driftwood's tow boat is local only; others online see your skier and gondola, not his boat.
- No colliders on the Spokewheel stand legs. The ship never sails (R-185: only at night, offstage).
- The tubing course run counts the boat's path; a skier swinging wide still counts if the boat passes the gate.
- No real phone check; renting, riding and the chest are E prompts (the touch action button), lean/hop were already touch.
- Party slice: a four-player ski slalom would fit later; not built.
