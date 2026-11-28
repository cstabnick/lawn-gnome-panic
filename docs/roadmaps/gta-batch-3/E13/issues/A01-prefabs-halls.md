Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-campus-halls.ts` holds six Rootwell University buildings as prefabs: the library, the
gnome-physics hall, the lecture hall, the lab block, the gate lodge and the Dean's lodge.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `Part`, shapes, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: `woolly-sock-lodge`, a finished building prefab to copy the style of
  (category 'prop', uses ['place'], `footprint`, doors/windows 0.03-0.04 proud of the wall, nothing coplanar).
- `packages/prefabs/src/catalog/gta-campus-halls.ts`: the empty file you fill (already registered in `catalog/index.ts`).

## Scale (important)
The catalogue test allows at most 30 on the largest side, so **every building here is authored at HALF size** and the
game places it with `scale: 2`. Below, "game size" is the size in the world; author each at exactly half of it. The
footprint body must be exactly the half-size width (x) by depth (z), centred on the origin, front (doors) on +z, lowest
point y = 0. Look: Rootwell is an old learned university: stone and clay walls ('stone', 'clay'/'terracotta' or
0xc9a27a-ish), dark slate roofs (0x3d4650), white window frames, red flowers in window boxes, iron railings. Low and
wide, not towers. Windows are dark glass panes (0x2b3a4a) 0.03 proud (no `glow`: the game lights some at night).

## Change
`GTA_CAMPUS_HALLS` gets (ids exact; category 'prop', uses ['place'], `footprint: { r, h }` in half-size units, tags incl.
'rootwell', 'campus', 'university', 'building', 'gta'; 5 examine lines each, house voice: dry, gnome-scale, the ants are
landlords paid in sugar, never termites):
- `rootwell-library` "The Long Shelf": game 36 x 22, eaves 12 → author 18 x 11, walls 6 tall. A long stone hall with a
  tall pitched slate roof, a row of tall arched windows (5-6 per side on the front), a central portico on +z with 4
  columns and steps, a carved book-spine frieze (a band of thin coloured boxes) over the door.
- `rootwell-plumbob-hall` "Plumbob Hall": game 28 x 24, eaves 10 → author 14 x 12, walls 5. A square clay-brick hall with
  a **flat roof whose top surface is exactly y = 5.0** (a 0.3 thick slab from 4.7 to 5.0), a 0.5 tall parapet round the
  roof edge (four thin boxes standing ON the slab, not overlapping its faces), a white helipad circle (a thin cylinder
  0.02 tall lying on the slab top, radius 2.5, centred, plus an 'H' of two thin boxes on it 0.01 higher), and a slim
  clock tower at the back-left corner (to y 10) with a clock face (a disc 0.03 proud) and a plumb bob hanging under a
  little arch at its top. Front door on +z.
- `rootwell-lecture-hall` "Tilth Hall": game 36 x 24, eaves 11 → author 18 x 12, walls 5.5. Stone, a **flat roof whose
  top surface is exactly y = 5.5** with a 0.5 parapet (as above), a pediment over a wide double door on +z, two rows of
  windows, a rooftop stair hut (a small box 1.2 x 1.2 x 1.2 standing on the roof at the back-left corner, x -7, z -4).
- `rootwell-lab-block` "the Crucible Block": game 28 x 22, eaves 10 → author 14 x 11, walls 5. A plainer brick block
  with a shallow slate roof, a row of tall chimneys/fume stacks (3 thin cylinders) on the roof, big square windows,
  one window scorched (a dark 'decal' box 0.03 proud around it), a door on +z with a yellow hazard stripe lintel.
- `rootwell-gate-lodge` "Wicket Lodge": game 10 x 8, eaves 6 → author 5 x 4, walls 2.5. A little stone lodge with a
  steep slate roof, a tall chimney, a porter's hatch window beside the door on +z, a cricket-wicket weather vane on the
  ridge (three thin sticks + two bails).
- `rootwell-deans-lodge` "the Dean's lodge": game 12 x 14, eaves 7 → author 6 x 7, walls 3.5. A tidy two-storey villa,
  clay walls, slate hipped roof (four tilted boxes or a pyramid-ish stack), white-framed windows with red window boxes,
  a front door on +z with a brass knocker, an iron railing gate in front (thin boxes).

## Contract
Ids exactly: `rootwell-library`, `rootwell-plumbob-hall`, `rootwell-lecture-hall`, `rootwell-lab-block`,
`rootwell-gate-lodge`, `rootwell-deans-lodge`. Half-size footprints exactly as above (the game's colliders and rooftops
rely on them): body width x depth as given, front +z, flat roof tops of Plumbob Hall at y 5.0 and Tilth Hall at y 5.5.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your six ids (run it from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (including `catalog/index.ts`, other catalog files, anything under `games/`).
