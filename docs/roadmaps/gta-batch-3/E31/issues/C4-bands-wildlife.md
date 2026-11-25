Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
Small animals live in the outer bands and a few old regions that have none: hares and hedgehogs in Trellisdown, hares
on Snowcap Rise's lower slopes, crabs scuttling on the Saltbucket beach, frogs and ducks at Loch Moss, ducks on Turfton's
park pond, butterflies in the Tallgrass and the Saltbucket dunes. No deer (another epic owns them).

## Read first
- `games/gnome-theft-auto/src/critters.ts` (`CritterKind`, `CRITTER_SPECS` with the E31 kinds 'hare', 'hedgehog',
  'fox', 'frog', 'duck', 'crab', 'butterfly', 'dragonfly'; `SpawnGroup`; `RegionLife`; `openSpot` / `isOpen`: a group
  centre is moved to the nearest open land in its region at spawn, so centres only need to be roughly right)
- `games/gnome-theft-auto/src/critters/cloverfield.ts` (a small finished RegionLife) and its test
- `games/gnome-theft-auto/src/levels.ts` (`regionAt`, `RegionId`)
- `games/gnome-theft-auto/src/sites.ts` (`reservedRects()` — keep group centres out of reserved site rectangles grown by
  20 m, except the beach for crabs)

## Places (world metres; check each with regionAt in your test, and adjust)
- Trellisdown ('west-estates', x -1400..-900, z -900..900): roads at x -950 (north-south) and z -500 / z -30 (east-west).
  Reserved: vineyard x -1290..-990 z -280..-60; mansion x -1210..-1090 z -10..90; cult camp x -1220..-1040 z -730..-550;
  golf yard x -1360..-1000 z 410..830; the hamlet Espalier End within 80 m of (-1080, -420) — stay 90 m away from it.
- Snowcap Rise ('north-highlands'): x -1400..1800 z -1400..-900 and x -200..1800 z -1800..-1400; road along z ~-1320 from
  x 60 to 1060 and z ~-955 from x -950 to 10. Reserved: ski hill x -460..-240 z -1300..-1000, ice lake x -730..-550
  z -1130..-990, toadstool forest x 100..400 z -1280..-1080, wind farm x 700..1000 z -1245..-1155, high tarn
  x 880..1120 z -1680..-1520; the hamlet Mittenholt within 80 m of (550, -1375).
- Saltbucket Shore ('south-shore', x -1400..1400 z 900..1100 and the strip z 1100..1800): the beach is z 1140..1190
  (crabs go here, x -900..900 but not within 220 m of x 0 where the boardwalk is); dunes just north of the beach
  (butterflies); the hamlet Dunelow within 80 m of (-560, 965).
- Old regions: Loch Moss ('loch-moss', north-west of the old map) — find its shore with a few probes of
  `regionAt` / `waterAt` in your test; Tallgrass Commons ('tallgrass-commons'); Turfton's park pond Mallard Mere
  (search `mallard-mere` or `Mallard Mere` under `games/gnome-theft-auto/src/parks/` for its centre).

## Change
- `games/gnome-theft-auto/src/critters/bands.ts` (stub exists: `export const bandsLife: RegionLife = { id: 'bands', groups: [] }`;
  already registered). Fill `groups` (each with its own correct `region`), about 50 critters in total, groups of 2-5:
  Trellisdown 3 hare + 2 hedgehog groups; Snowcap 3 hare groups (lower slopes, z -900..-1300); Saltbucket 4 crab groups
  on the beach + 2 butterfly groups in the dunes; Loch Moss 2 frog + 1 duck group at the shore; Tallgrass 2 butterfly
  groups; Turfton 1 duck group at Mallard Mere (only if its spot is in region 'turfton' and has water within 10 m).
  Add an `update` only if cheap and useful (e.g. crabs scuttle sideways: when a crab moves, set its yaw 90 degrees off
  its heading; skip critters farther than 120 m from the player).
- NEW `games/gnome-theft-auto/src/critters/bands.test.ts`: each group's `regionAt(g.x, g.z) === g.region`; every kind is
  in `CRITTER_SPECS`; there is no 'deer' (it does not exist; just assert kinds ⊂ the E31 kinds plus 'squirrel');
  total between 35 and 70; no group centre inside a reserved rect grown by 20 m except crab groups in the 'beach' rect.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/critters/bands.test.ts src/critters.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
`critters.ts`, `critters/index.ts`, `critters/unmown.ts` (another worker), sound files.
