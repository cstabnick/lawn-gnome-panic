Epic: E15-A (Hedgeworth Links, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E15/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-golf.ts` holds Hedgeworth's structures: the neighbour's board fence panel, the Kicked
Board (loose, then a pile of planks), the Members' Gate, the clubhouse, the pro's cottage, the groundskeeper's shed and
the cart shelter.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules (units, `at` = centre, `rot` in degrees, lowest point
  at y = 0, front +z, part limits, `footprint`, the `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`) and `packages/prefabs/src/palette.ts` (colour names).
- `packages/prefabs/src/catalog/gta-winter-lodge.ts` (`woolly-sock-lodge`): a finished GTA building prefab to copy the
  style of (size, parts, windows, a door on the front, `about`, `tags`, `emoji: []`).
- `packages/prefabs/src/catalog/gta-world-green.ts` (`wooden-fence`) for a fence piece.
- `packages/prefabs/src/catalog/gta-golf.ts`: the empty file you fill (already registered in `catalog/index.ts`).

## Change
`GTA_GOLF` gets these prefabs (ids exact; sizes in prefab units, 1 = a gnome's height ~ 1 m; the game places the
fence pieces at scale 1 and sizes the buildings by their longest side, given below):
- `board-fence-panel` (prop, place; footprint): a Tall-One garden fence panel 2.0 wide (x), 2.6 tall, 0.1 thick:
  vertical boards (8 thin boxes 0.24 wide with 0.01 gaps, so no shared faces), two horizontal rails on the back (-z
  side, 0.04 behind the boards), weathered brown 0x8a6a48 (`tint` the boards). Front +z is the boards' face.
- `kicked-board-panel` (prop, place; footprint): the same panel but 2.6 wide, with one board near the middle hanging
  crooked from a single nail (rotated ~20° about z, its bottom swung out), a boot-shaped scuff (a small darker box
  decal 0.02 in front of a board, not coplanar) and a bent nail head. It must read as "loose": a gnome would kick it.
- `fence-plank-pile` (prop, place): what is left after the Kicked Board goes: 5 planks lying flat and askew on the
  ground in a 2.6 x 1.2 area (each plank its own box, slightly different heights 0.03-0.12 so none are coplanar), two
  broken stubs standing 0.4 tall at the ends, a few splinters.
- `members-gate` (prop, place; footprint): wrought-iron double gate 7 wide, 2.4 tall: two brick piers (0.6 square,
  2.8 tall, with stone caps and a ball finial), two gate leaves of thin black vertical bars with a scrolled top rail, a
  chain wound round the middle bars with a fat brass padlock, and a blank enamel plaque (white, 0.8 x 0.3) on the left
  leaf at y 1.6, 0.03 in front of the bars (the game writes MEMBERS ONLY on it).
- `hedgeworth-clubhouse` (prop, place; footprint; game size: longest side 26 m, so model it about 13 x 7 x 6 and the
  game scales it 2x): a mock-Tudor two-storey clubhouse: cream render walls with dark timber framing strips (strips
  0.02 proud of the wall, never flush), a steep tiled roof with two front gables, a clock in the main gable (a disc on
  the wall, 0.03 proud), a chimney, a wide glazed front (+z) on the ground floor with a double door centred at x 0
  (door 1.2 wide, 1.4 tall at prefab scale), bay windows upstairs (Peony's rooms), a green awning over the door. The
  door's bottom is at y 0 and its face is the front wall plane + 0.03.
- `pro-cottage` (prop, place; footprint; game size 10 m): a small cottage ~5 x 4 x 4: whitewashed walls, a green door
  front centre, window boxes with red flowers, a crooked chimney, a lucky horseshoe over the door (Basil is
  superstitious), and a blank sign board over the window (game writes PRO SHOP).
- `groundskeeper-shed` (prop, place; footprint; game size 8 m): a timber shed ~4 x 3 x 3 with a pent roof, a door on
  the front, a hose reel on the left wall (a cylinder drum with coiled green hose: a torus), a water butt on the right,
  a small sign board above the door (blank), and a tiny mole-sized arched hole at the base of the back wall (dark,
  0.02 proud): Thrift's secret.
- `cart-shelter` (prop, place; footprint; game size 12 m): an open-sided cart shelter ~6 x 4 x 2.6: six posts, a
  shallow green corrugated roof (ridged: several thin boxes at alternating heights, no shared faces), a charging point
  box on a back post with a coiled cable.
Five `examine` lines each in the house voice (`gta` in the tags; examples: the Kicked Board "has been kicked by
everyone who ever wanted a ball back"; the gate "keeps members in and everyone else slightly to one side of it";
the clubhouse "is older than its timber, which was painted on in the spring").

## Contract
Prefab ids exactly: `board-fence-panel` (2.0 wide, 2.6 tall), `kicked-board-panel` (2.6 wide), `fence-plank-pile`,
`members-gate` (7 wide), `hedgeworth-clubhouse` (door front centre), `pro-cottage`, `groundskeeper-shed`,
`cart-shelter`. Fronts face +z.

## Done when
- `npm test -w packages/prefabs` passes (or for speed `cd packages/prefabs && npx vitest run -t <id>` for each id, then
  the whole package once).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (other workers fill `gta-golf-plants.ts`, `gta-golf-props.ts`, `gta-golf-gear.ts`).
