Epic: E18-B (world-change dressing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` and `D-dressing-common.md` (same folder) first: they hold the API,
the prefab and placement rules and the test you add.

## Goal
Build the props for world changes W08, W17 in `games/gnome-theft-auto/src/worldChanges/rows/sideValve.ts` (currently a
stub registering empty groups), following `docs/design/gnome-theft-auto/world-changes.md` rows W08, W17.

## Change (only `src/worldChanges/rows/sideValve.ts` and the new `src/worldChanges/rows/sideValve.test.ts`)
- Also edit nothing else.
- W08 (Side-Valve seized): at the Side-Valve Salvage bay front (`SIDE_VALVE` in src/config.ts; stage 'side-valve-bay'),
  boards across the bay door, a large HOA seal, a red "SEIZED" banner, two beige-vested HOA guard stand-ins (no AI).
  The bay interior must stay usable for quest stages: put the boards on the outside face only and leave the player's
  path in (if the door is a quest walk-in, board only half of it and say so).
- W17 (after the Even Cut), two variants by `ctx.ending()` (build both groups, show one in `update`): shared: the crew's
  flag flying at Side-Valve (open bay, W08 is hidden by the runtime), a ribbon of fresh green on the Trellisdown trellis
  (site 'vineyard'), and a "Standing Lady" statue-like figure in the open at Wader's Rest (site 'cult-camp'; grep
  'standing lady' in docs/lore). Ending A: a long strip of wild clover and daisies (flower prefabs, `flatLayer` for any
  ground decal) along the downtown meridian road the Combine took (ch5-even-cut's route: grep `boss-combine` in
  src/quests/chapter5.ts for `startZ`/`endZ` and its road x), with one gnome sitting in it. Ending B: a grid of glowing
  neon tiles (emissive flat squares, flatLayer) along the same line, brightest at night, and a stall selling glowing
  snacks. Keep the road drivable (decals flat, no props on the carriageway).

## Done when
- See `D-dressing-common.md`: tsc clean for your file, `npx vitest run src/worldChanges` passes, report coordinates.
