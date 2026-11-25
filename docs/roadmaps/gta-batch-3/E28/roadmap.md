# E28 World expansion II: roadmap

Brief: [../E28-world-expansion-2.md](../E28-world-expansion-2.md). Contracts for later epics: [contracts.md](contracts.md).

Goal: grow the map from 2800 to 3600 square; add Pardonlin (the European-style next yard) and the Unmown (nature
preserve) with their roads, river, trails and sites for E30/E31; push the bands to the new edge; roundabouts that
traffic, the GPS and the NPC chassis drive correctly; traffic-hat wardens that traffic obeys; the Wasm kernel resized.

## Shape

| Epic | What | Done when | Issues |
|---|---|---|---|
| 1 Foundation | lead: layout 1800/1795, the two region documents (streets, the Thymes, Basin, trails, slots), band borders pushed out, ocean/beach widened, west and east band junctions turned into roundabouts, Vineyard Lane and the Wicket approaches, the Unmown Road; both biomes in every per-biome table; landform modules; per-highway width (7 m lanes); `roundabouts.ts` (+ `RoadNode.ring/noDrive`, graph marking, errands/GPS/re-route/ghost placement respect one-way); `trafficDirectors.ts` (pure); stubs for the visual modules | tsc + levels/sites tests | 0 (lead) |
| 2 Fill | seven parallel issues, disjoint files | each issue's own checks | 7 |
| 3 Close | lead: traffic obeys directors and gives way at roundabouts (traffic.ts, trafficSim.ts), director view and achievements wired in app.ts, roundabout/director tests, water config for the Thymes, golden regenerated and reviewed, smoke, zfight, AGENT_INDEX, contracts.md, commit | all checks | 0 (lead) |

Online: `POS_BOUND` follows `WORLD_HALF` (1850); directors run on the wall clock, so clients agree without sync.
Mobile: no new controls. Party slice: none (no new activity).

## Epic 2 issues (all parallel)

| Issue | Worker | Files it owns |
|---|---|---|
| [2A Wasm kernel resize](epic-2/2A-wasm-kernel-resize.md) | sonnet | `assembly/kernel.ts`, `src/wasm/*`, `scripts/build-wasm.mjs`, `scripts/bench-wasm.mjs` |
| [2B region scatter](epic-2/2B-region-scatter.md) | haiku | `src/biomes.ts` |
| [2C lore](epic-2/2C-lore.md) | haiku | `docs/lore/**` |
| [2D prefabs and achievements](epic-2/2D-prefabs-achievements.md) | haiku | `packages/prefabs/src/catalog/{gta-continental-kit.ts (new), index.ts, cosmetics-head-b.ts, cosmetics-neck.ts}`, `packages/achievements/src/catalog.ts`, `src/bandAchievements.ts` (+ test) |
| [2E Wickets, islands, Unmown gate](epic-2/2E-wickets-islands-gate.md) | haiku | `src/pardonlin/wickets.ts`, `src/roundaboutIslands.ts`, `src/unmownGate.ts` |
| [2F traffic warden view](epic-2/2F-director-view.md) | haiku | `src/trafficDirectorsView.ts` (+ test) |
| [2G birds and map](epic-2/2G-birds-and-map.md) | haiku | `src/birding/species.ts`, `src/mapPois.ts` (+ their tests) |

Shared environment for all of them: [epic-2/_env.md](epic-2/_env.md). The golden layout test fails on purpose until the
lead regenerates it in epic 3.

## How it went

- All seven issues landed. 2A (Sonnet) moved the kernel's big buffers behind `configureLayout`, ported the six band
  and new-region generators and fixed a pre-existing keep-flat mismatch (the kernel ignored flat slots); 804 pages
  (~50 MB) at worldHalf 1800; `heightGrid()` 2.4 s with the kernel vs 10.7 s JS-only (Node).
- The wardens' clock is wall time at load plus game time (stepped by traffic each frame), so a headless sim that runs
  minutes in seconds still sees them cycle. Off-screen ghosts ignore the wardens; live cars stop for them.
- The Unmown's moss paint was cut back after the screenshot pass (it read as dark teal water).
- The golden layout was regenerated on purpose after a diff review: inside the old 1800 square only ~40 settlement
  pieces moved (the settlement RNG walks every highway, and two band roads were split for the roundabouts).

## Deferred

- Town buildings, squares, cafe rows, Radio Adagio, people and quests (E30); preserve wildlife, hides, reeds, the
  Reedmere water and more animals and vehicles everywhere (E31); European prefab kit (E29).
- A hat-and-stamp prop on the customs counter and a working `traffic-cone` placement at the Grand Wicket (no prefabs).
- Pardonlin settlements/fringe lots (none generated in the new regions; E30 builds the town by hand).
- Real-phone check of the bigger map (only the headless smoke and a desktop-size screenshot pass ran).
