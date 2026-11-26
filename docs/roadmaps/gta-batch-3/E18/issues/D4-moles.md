Epic: E18-B (world-change dressing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` and `D-dressing-common.md` (same folder) first: they hold the API,
the prefab and placement rules and the test you add.

## Goal
Build the props for world changes W06, W13 in `games/gnome-theft-auto/src/worldChanges/rows/moles.ts` (currently a
stub registering empty groups), following `docs/design/gnome-theft-auto/world-changes.md` rows W06, W13.

## Change (only `src/worldChanges/rows/moles.ts` and the new `src/worldChanges/rows/moles.test.ts`)
- W06 (moles are neighbours): by the Burrow Door (E01 site 'mole-entrance', (-1000,360); E17 `BURROW_DOOR` in
  src/societies/config.ts) a small lantern with a green flame (lantern prefab, emissive green, brighter at night), at the
  west edge of Mossy Wood Sorrel's hand-painted board "MOLES ARE NEIGHBOURS", and a young mole that peeks out of a
  molehill beside the sign now and then (E17 mole prefabs: grep 'mole' in packages/prefabs/src/catalog/gta-moles.ts; in
  `update`, raise/lower it on a ~8 s cycle).
- W13 (a root stall on Bodega's street): a low cart of roots and pale mushrooms with a mole behind it beside Bodega &
  Sons (grep 'bodega' in src/quests/stages and src/city/places.ts for the shop front), off the pavement line and clear of
  the door; a sign "ROOTS. HONEST." on the cart; plus 3-4 molehills with moles in plain sight along the Mossy Wood edge
  near the Burrow Door and on Tallgrass Commons (grep 'tallgrass'). No buy hook (visual only); say so in the report.

## Done when
- See `D-dressing-common.md`: tsc clean for your file, `npx vitest run src/worldChanges` passes, report coordinates.
