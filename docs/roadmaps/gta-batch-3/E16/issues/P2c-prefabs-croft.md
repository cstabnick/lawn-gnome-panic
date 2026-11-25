Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-croft.ts` holds Windfall Croft's buildings and farm props: a run-down
farmhouse and barn, a soil bed, a produce stall, a seed rack, a For Sale board, a water butt, an apple tree, a tired
fence run and a scarecrow.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: `woolly-sock-lodge`, a finished building prefab to copy the style
  of (category 'prop', uses ['place'], `footprint`, doors/windows 0.03-0.04 proud of the wall, nothing coplanar).
- `packages/prefabs/src/catalog/gta-country-croft.ts`: the empty file you fill (already registered).

## Change
`GTA_COUNTRY_CROFT` gets (category 'prop', uses ['place'], tags incl. 'croft', 'farm', 'cloverfield', 'gta'; `emoji: []`;
5 examine lines each in the house voice: Windfall Croft is a small, run-down croft: "The last owner left and the apples
stayed." "It's a bargain. The bargain is the weeds."). Look: weathered timber (0x8a6f4e / 0x6b5a45), faded red barn paint
(0x9a3b2e), mossy slate or tin roofs, some boards missing or hanging, a few weeds (small green tufts) at the foot of walls.
Every building is authored life-size with its front door on +z, lowest point y = 0, centred on the origin.
- `croft-farmhouse` "Windfall Croft farmhouse": 14 wide (x) x 10 deep (z), walls 3.5, steep roof to ~7. Two windows
  either side of the door on +z, one boarded over with crossed planks, a sagging porch roof on two posts over the door,
  a crooked chimney, a gutter hanging loose at one end, an empty flower box.
- `croft-barn` "Windfall Croft barn": 14 x 12, walls 4, a gambrel (two-slope) roof to ~8 in faded red with white trim,
  big double doors on +z (one ajar: turned ~20 degrees on its hinge), a hayloft door above with a hoist beam, two
  missing roof planks (gaps), a hay bale showing in the loft.
- `croft-bed` "Croft bed": a raised soil bed 3 wide x 8 long (x by z), 0.25 tall: a dark soil top (0x4a3424) inside a
  plank edging (four thin boxes 0.08 thick standing round it, not overlapping the soil's faces: the soil box is 2.84 x
  7.84 x 0.22). The game plants crops on it at y 0.22.
- `croft-stall` "Croft stall": a produce stall ~3 wide: a trestle counter with three crates (one of radishes, one of
  carrots, one empty), a striped green-and-cream awning on two posts, a small chalkboard leaning on a leg, an honesty
  tin on the counter.
- `croft-seed-rack` "Seed rack": a little wooden rack ~1.4 tall with three shelves of seed packets in four colours (red,
  orange, pale green, pumpkin orange) and a hanging trowel.
- `croft-for-sale` "For Sale board": a board 1.6 wide x 1.0 tall on two posts (top ~2.2), plain cream face (0xefe6cf),
  red border strips 0.01 proud. NO text: the game adds a text plate 0.04 in front of the face. Face on +z at z = 0.05.
- `croft-water-butt` "Water butt": a wooden barrel ~1.2 tall with iron hoops, a lid, a tap, and a dented watering can
  leaning against it.
- `croft-apple-tree` "Windfall apple tree": an old orchard tree ~4.5 tall: a leaning trunk, a round canopy ~4 across of
  4-5 green balls with 10-12 red apples (small red balls) in it, and 4 windfall apples lying on the ground.
- `croft-fence` "Croft fence": a 4 m run of old picket fence along local x (two rails, posts at each end, pickets every
  0.3 m, two pickets missing and one leaning), ~1.1 tall.
- `croft-scarecrow` "Scarecrow": a scarecrow ~1.8 tall on a post: a sack head with a stitched face, a beige hard hat
  (Levelright's, lost from a site and found by a crow), a patched coat on a crossbar, straw tufts at the cuffs.

## Contract
Ids exactly: `croft-farmhouse`, `croft-barn`, `croft-bed`, `croft-stall`, `croft-seed-rack`, `croft-for-sale`,
`croft-water-butt`, `croft-apple-tree`, `croft-fence`, `croft-scarecrow`. The farmhouse is 14 x 10 and the barn 14 x 12
in plan (the game's colliders use these); `croft-bed` is exactly 3 x 8 x 0.25 with its soil top at y = 0.22.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your ids (run from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.
