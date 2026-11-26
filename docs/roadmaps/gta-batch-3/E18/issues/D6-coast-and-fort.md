Epic: E18-B (world-change dressing)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E18/issues/_env.md` and `D-dressing-common.md` (same folder) first: they hold the API,
the prefab and placement rules and the test you add.

## Goal
Build the props for world changes W11, W15 in `games/gnome-theft-auto/src/worldChanges/rows/coastAndFort.ts` (currently a
stub registering empty groups), following `docs/design/gnome-theft-auto/world-changes.md` rows W11, W15.

## Change (only `src/worldChanges/rows/coastAndFort.ts` and the new `src/worldChanges/rows/coastAndFort.test.ts`)
- W11 (tubes: they float): on Saltbucket Boardwalk (site 'coast', (0,1140); E11 src/coast/ and src/tubing/): check
  whether Driftwood's tube hut already exists (E11 built Last Tube rentals). If it does, add a painted board "TUBES:
  THEY FLOAT" and stacked tubes beside it; else a small stall of stacked tubes (tube prefab grep 'tube') with that board.
  A crew-colours flag at the Bathtub Queen's masthead (site 'pirate-ship', (240,1290); src/coast/ ship position) as a
  flag prefab placed high on the mast. Carburettor pennants at the Lost & Found Speedway entrance and the Rutbottom Dirt
  Bowl (site 'dirt-track'; src/rutbottom/): 'speedway-banner' / pennant / 'bunting-span' prefabs.
- W15 (coalition colours): at Fort Sandpit's gate (Dust Flats; grep 'sandpit' / 'fort' in src/quests/stages and
  src/outskirts) a patchwork flag in many cap colours over the arch (several small flags), and two friendly Spade Guard
  stand-ins waving by the gate (not blocking it); at the Pebblewick water tower (grep 'water tower' / 'pebblewick' in
  src/outskirts) a small coalition pennant on top.

## Done when
- See `D-dressing-common.md`: tsc clean for your file, `npx vitest run src/worldChanges` passes, report coordinates.
