Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-campus-buildings.ts` holds seven Rootwell University buildings as prefabs: the dorm,
the refectory, the faculty club, the glasshouse, the mulch-science barn, the engineering shed and a grandstand.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `Part`, shapes, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: `woolly-sock-lodge`, a finished building prefab to copy the style of
  (category 'prop', uses ['place'], `footprint`, doors/windows 0.03-0.04 proud of the wall, nothing coplanar).
- `packages/prefabs/src/catalog/gta-campus-buildings.ts`: the empty file you fill (already registered).

## Scale (important)
The catalogue test allows at most 30 on the largest side, so **every building here is authored at HALF size** and the
game places it with `scale: 2`. "Game size" below is the size in the world; author each at exactly half of it. The body
must be exactly the half-size width (x) by depth (z), centred on the origin, front (door) on +z, lowest point y = 0.
Look: an old learned university: stone and clay walls, dark slate roofs (0x3d4650), white window frames, red flowers,
iron railings; low and wide. Windows are dark glass panes (0x2b3a4a) 0.03 proud (no `glow`).

## Change
`GTA_CAMPUS_BUILDINGS` gets (ids exact; category 'prop', uses ['place'], `footprint: { r, h }` in half-size units, tags
incl. 'rootwell', 'campus', 'university', 'gta'; 5 examine lines each, house voice: dry, gnome-scale; the university pays
its landlords, the ants, in sugar; never call them termites):
- `rootwell-dorm` "Bedstraw House": game 36 x 16, eaves 12 → author 18 x 8, walls 6. A long three-storey brick dorm,
  pitched slate roof with three dormers, rows of small windows (3 rows), one window with a sock hanging out (a small
  coloured box), a front door on +z with a fanlight.
- `rootwell-refectory` "the Trencher": game 30 x 24, eaves 9 → author 15 x 12, walls 4.5. A great hall with a steep
  slate roof and a lantern (a small glazed box) on the ridge, tall windows, a big double door on +z, and at the back
  (-z) a low lean-to store with a cellar hatch (two tilted wooden boxes) where the sugar is kept.
- `rootwell-faculty-club` "the Cold Frame Club": game 14 x 18, eaves 7 → author 7 x 9, walls 3.5. A cosy clay-walled
  club with a bay window (a box 0.6 proud with three panes) beside the door on +z, a green awning, a brass plate.
- `rootwell-glasshouse` "the Cloche": game 26 x 18, eaves 8 → author 13 x 9, walls 1.2 of low brick then glass. A
  Victorian glasshouse: low brick plinth, glass walls (pale blue-green 0xbfe3d8 boxes, `opacity` only if the Part type has
  it, otherwise solid pale glass colour), white frame mullions (thin boxes 0.03 proud), a pitched glass roof on white
  ribs, a little cupola, doors on +z.
- `rootwell-heap-barn` "the Heap Barn": game 22 x 16, eaves 9 → author 11 x 8, walls 3.5. A timber barn (tint 'wood')
  with a gambrel roof (four tilted boxes), a big sliding door on +z, and a steaming compost bay against one side (a dark
  brown mound of 2-3 squashed spheres with a pale steam cone).
- `rootwell-bodgers-shed` "Bodger's Shed": game 22 x 16, eaves 7 → author 11 x 8, walls 3.5. A corrugated workshop with a
  saw-tooth roof (three tilted boxes), a roller door on +z (a box with thin horizontal ribs 0.03 proud), a crane jib
  sticking out of one gable, a propeller nailed over the door as a sign.
- `rootwell-grandstand`: one side of the Clod's stadium. Game 50 long (x) x 8 deep (z) x 8 tall → author 25 x 4 x 4:
  four tiers of seating stepping up toward -z (each tier a box; the front, lowest tier faces +z), a back wall, a
  cantilevered roof over the top two tiers on thin posts, coloured seat strips (red and cream boxes 0.03 above each tier
  top, not coplanar), a little press box in the middle at the top.

## Contract
Ids exactly: `rootwell-dorm`, `rootwell-refectory`, `rootwell-faculty-club`, `rootwell-glasshouse`, `rootwell-heap-barn`,
`rootwell-bodgers-shed`, `rootwell-grandstand`. Half-size footprints exactly as above, front +z.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your seven ids (failures in other workers' ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (including `catalog/index.ts`, other catalog files, anything under `games/`).
