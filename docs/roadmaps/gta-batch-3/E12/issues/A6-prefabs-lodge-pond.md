Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-winter-lodge.ts` holds the Woolly Sock Lodge building and the lodge and Pail Pond kit:
a ski rack, a sock-drying rack, a cocoa mug (also a wearable hand reward), an ice auger, an ice shanty, a sardine tin, the
pail's handle sticking out of the ice, and a lost-mitten pile.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (units, `at` = centre, `rot` in degrees, lowest point at
  y = 0, front +z, part limits, `examine` voice; hand-held things need `uses` 'hold' and a `grip`). Ignore its
  "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `footprint`, the `Use` and `Category` unions) and
  `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-world-green.ts` (`log-cabin`: a building prefab) and
  `packages/prefabs/src/catalog/gta-houses.ts` (`snow-cottage`) for building style and size.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: the empty file you fill (already registered).

## Change
`GTA_WINTER_LODGE` gets (ids exact; 1 unit = a gnome's height; the game places buildings with a `size` in metres, so
proportions matter more than absolute size):
- `woolly-sock-lodge` (category 'building' if `Category` has it, else 'prop'; uses ['place']; `footprint`): a low timber
  ski lodge, about 10 wide (x) x 7 deep (z) x 5 tall: log walls (a box body with 3-4 thin darker horizontal log bands on
  the front, each standing 0.03 proud), a steep roof (two tilted boxes meeting at a ridge, with white snow slabs on top
  standing 0.04 above the roof so no faces coincide), a stone chimney, a front door in the middle of the +z face (a dark
  box 0.04 proud) under a little porch roof on two posts, two lit windows (`glow: true` warm yellow panes 0.03 proud), a
  big knitted sock hanging over the door as the sign (a red and white striped sock: two or three boxes/pills, slightly
  tilted), a bench on the porch is NOT part of it (the game places one). Doors and windows only on the front (+z) face.
- `ski-rack` (prop, place; `footprint`): a wooden A-frame rack about 2 wide, 1.2 tall, with three pairs of skis leaning on
  it (thin tall boxes, different colours) and two poles.
- `sock-rack` (prop, place): a clothes-horse drying rack about 1.6 wide, 1.3 tall, with five woolly socks hanging over its
  rails (small boxes/pills in stripes: red/white, green/cream, blue/grey) and one enormous Tall-One sock (three times the
  others, grey with a hole at the heel: a dark disc) draped over the end.
- `cocoa-mug` (a `Category` that fits a drink, e.g. 'consumable' if the union has it, else 'prop'; uses ['hold',
  'drink', 'place']; `grip` on the handle: hand-slot rewards are simply 'hold' prefabs, like `golden-putter`): a fat enamel mug about 0.16 tall, cream with a
  red rim band, a handle ring on its side, a dome of brown cocoa just below the rim and three tiny white marshmallow cubes
  on top, a wisp of steam (a thin pale cone, `glow: true`). Small: largest side 0.2-0.25.
- `ice-auger` (tool, uses ['hold', 'place'] valid values only; `grip`): a hand ice drill standing upright, about 1.1 tall:
  a T-handle on top (a crank: a cross bar with a wooden knob), a long steel shaft, a spiral blade at the bottom (3-4
  thin tilted discs stacked along the shaft), pointed tip at y = 0.
- `ice-shanty` (prop, place; `footprint`): a small ice-fishing hut about 2.2 wide, 2 deep, 2.3 tall on two short skids:
  plank walls (box) in `tint` (default faded red 0xa8432f), white trim corners (`trim`), a sloped tin roof, a stovepipe with
  a cap, a door on the front (+z) with a hand-painted sign board (blank; the game writes on it), a small window on one side.
- `sardine-tin` (prop, place, small ~0.25 long): an opened oval sardine tin, lid rolled back on its key, empty, a shine on
  the inside.
- `pail-handle` (prop, place; `footprint` small): the handle of a giant Tall-One pail sticking out of the ice: a big
  galvanized wire arc about 6 wide and 2.5 tall (several short `cyl` segments laid along a half-circle, or a half `ring`:
  a `ring` stood upright and sunk so only the top half is above y = 0 is NOT allowed (lowest point must be y = 0), so
  build the arc from 7-9 short tilted cylinders whose ends meet), with a wooden grip tube in the middle top and a rivet
  lug at each foot. Its feet are at y = 0.
- `lost-mittens` (prop, place): a small heap of single mismatched mittens (5-6 squashed balls/boxes with thumbs, different
  colours) about 0.6 across, a paper tag stuck in it (blank).

Examine lines (5 each) in the house voice; the gnomes call the pail "the Rim" and nobody has found what the handle is for.

## Contract
Ids exactly: `woolly-sock-lodge`, `ski-rack`, `sock-rack`, `cocoa-mug`, `ice-auger`, `ice-shanty`, `sardine-tin`,
`pail-handle`, `lost-mittens`. The lodge's door faces +z. `cocoa-mug` must be holdable with a `grip` (it is the Bear Hug
reward for the hand slot).

## Done when
- `npm test -w packages/prefabs` passes for your ids (quicker: `cd packages/prefabs && npx vitest run -t <id>`), then once
  for the whole package.
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.
