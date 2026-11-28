Epic: 1 Fixes (parallel) · Items: L16 "i cannot jump over the wall into the sandpit. there is invisible wall above the ramp", L24 "give way around the raft in the canal it's annoying as hell" · Model: sonnet
Depends on: none

## Environment
See `docs/roadmaps/gta-batch-3/E03/env.md` (read it first; its rules are part of this issue).

## Goal
(a) A vehicle launched from the ramp next to Fort Sandpit sails over the visible wall into the sandpit (no invisible
wall above the ramp or the wall). (b) Boats pass Driftwood's raft in the east canal channel, and the E02 expected-fail
canal test passes.

## L16 - what is known (verify, the cause is not confirmed)
- Fort Sandpit: `config.ts` `BASE` (from level marker `site/fort-sandpit`: `wallHeight`, gate on the north wall).
  Wall colliders are built in `biomes.ts` (search `BASE.wallHeight`), ramps in `ramps.ts` (ramp table, look for the one
  by the fort, and how ramps add colliders / side walls) and `stunts.ts`.
- Collision: `collide.ts` (E02 owns it - do NOT edit) `pushOutOfBoxes(x, z, r, boxes, y)` ignores a box when its top
  `h <= y`; vehicles collide through `sweepCircleBoxes` in `vehicles.ts`/`simdrive.ts`.
- Candidate causes: a wall box taller than the visible wall; another box (gate, tower, a `addSafeBox` of a prop, a
  ramp side wall, a clearance/site reservation box) standing over the ramp landing or the wall line; the ramp's own
  side-wall box extended too far; the vehicle `y` passed to the collider being the ground height, not the airborne y.
- First write a failing test (new `sandpitJump.test.ts`): build the world the way other world tests do (see
  `terrainWalk.test.ts`, `propsOffRoad.test.ts`, `canalCruise.test.ts` for how they build `world.boxes`), list every box
  whose footprint intersects the ramp's launch line into the fort and whose `h` is above the visible wall top, and/or
  simulate a vehicle at the ramp's exit speed (use the drive stepping used by `ramps.test.ts` / `airtime.test.ts`) and
  assert it lands inside the fort. Record which box blocks and why in your report. Then fix the placement (the box,
  its height or footprint) - not the collision model.

## L24 - what is known (confirmed by reading)
- `biomes.ts` ~line 864 builder `'driftwood-raft'`: placed from marker `driftwood-raft` at (55, -170) in
  `data/levels/cloverfield-farms.level.json` (~line 449). Collider: `addSafeBox({ minX: drx - 2.8, maxX: drx + 2.8,
  minZ: drz - 1.8, maxZ: drz + 1.8, h: 3.8 + dy })` - a 5.6 x 3.6 m box mid-channel in a ~10 m canal.
- `canalCruise.test.ts` line ~86: `it.fails('sails the real world with every collider', ...)` - "Expected to fail until
  E03 (L24) narrows or moves the raft collider: then remove .fails." (the header ~line 59 describes the raft).
- Fix: move the raft to a pocket against one bank (marker edit, keep it on water: `waterAt`) so at least 6 m of open
  channel is left, and shrink its collider to the deck footprint (raft ~5.2 x 3.2, use a round collider if it helps:
  `placeRoundBox`/`roundOf` exist in `collide.ts`). Then turn `it.fails` into `it` and make it pass.
- The Castaway side quest stages near the raft: `quests/stages/cloverfield.ts` stage `canal-raft` (marks `RAFT_PLAYER`
  / `RAFT_DRIFT` etc. in `cutscene/scenes/side/castaway.ts`). If the raft moves, move those marks with it and run
  `npx vitest run src/quests/stages.test.ts src/quests/stages.doc.test.ts`.
- The level move may change `src/data/layout.golden.json`: regenerate it deliberately the way `layout.golden.test.ts`
  explains and say so in the report.

## Change
`biomes.ts` (raft builder + any fort wall collider fix), `data/levels/cloverfield-farms.level.json`, `ramps.ts` or
`config.ts` `BASE` only if the L16 cause is there, `canalCruise.test.ts`, new `sandpitJump.test.ts`,
`quests/stages/cloverfield.ts` + `cutscene/scenes/side/castaway.ts` only if marks move, `data/layout.golden.json` if regenerated.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/canalCruise.test.ts src/sandpitJump.test.ts src/ramps.test.ts src/collide.test.ts src/layout.golden.test.ts src/quests/stages.test.ts src/boatCrossing.test.ts` pass.
- `npx tsc --noEmit -p games/gnome-theft-auto` clean for your files.

## Out of scope
`collide.ts`, `waterworks.ts` (another worker), `encounters.ts`, `vehicles.ts`/`simdrive.ts` physics.
