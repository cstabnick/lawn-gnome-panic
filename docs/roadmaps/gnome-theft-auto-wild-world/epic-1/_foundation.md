# Epic 1 foundation (done by the planner)

What exists before the issues run, so later epics know where things are.

- `games/gnome-theft-auto/src/data/levels/<region>.level.json`: five region documents (`turfton`, `dust-flats`,
  `mossy-wood`, `frostbite-fells`, `cloverfield-farms`), generated from the pre-migration code by an instrumented run,
  region-local around each origin. Every coordinate round-trips exactly (origins are integers, chosen so
  `x - origin + origin === x` for every point).
- `games/gnome-theft-auto/src/data/world.layout.json`: world size, perimeter fence edge, region origins in build
  order, highway order (road-graph node order).
- `games/gnome-theft-auto/src/levels.ts`: the loader (`LAYOUT`, `REGION_DOCS`, `REGIONS` in world coordinates,
  `regionOf`, `markersOf`, `marker`, `markerNum`, `highways`, `regionDocProblems`, `GtaRegionData`, `GtaProp`). Pure
  data, imports nothing from the game, so the level editor imports it too.
- `games/gnome-theft-auto/src/data/layout.golden.json` + `src/layout.golden.test.ts`: the golden fixture, a snapshot of
  everything `buildWorld` produces (colliders, walk points, parked mowers, barrels, road graph, every static prefab
  placement, a fingerprint of every top-level scene object) plus the layout constants and quest givers. Captured from
  the code before the migration. Runs under vitest with a stand-in `document` (`src/testing/fakeDom.ts`).
- `games/gnome-theft-auto/src/levels.test.ts`: the document validator test.

How parity survives moving hand-placed things out of the code: the old code drew all its random numbers from one
`mulberry32(7)` stream, including a few draws in the hand-placed part (tent yaws, four `park()` calls that never
succeed). Each scatter generator's `base.seed` is the exact stream state at the point that section started in the old
run, and `turfton.data.kerbSeed` is the state where the kerb-side parking started. So the hand-placed part draws
nothing now and every generator still reproduces its old output.

Findings worth knowing later:

- The four `park()` calls inside the landmark sections never place a mower (their `reach` is smaller than the
  reserved zone around them), and most biome `park()` calls fail too: only the farmland yards get parked machines.
- Many `placeSetpiece` calls in the old code were silently rejected (2 of 4 Unmowed toadstools, the Basin torches...).
  The documents hold only what was actually placed.
- Scatter (trees, cacti, villages, farms, fields) is still procedural: a generator per region, not props.
