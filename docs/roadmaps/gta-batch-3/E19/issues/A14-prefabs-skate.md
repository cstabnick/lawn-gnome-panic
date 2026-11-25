Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You only touch
`packages/prefabs/src/catalog/gta-gutter-bowls.ts` (an empty, already registered file). Others fill the two other
new catalog files (`gta-drainpipe-court.ts`, `gta-sports-gear.ts`) at the same time.

## Goal
The props of the Gutter Bowls, Downtown Turfton's public skate park "made from old Tall-One roof gutters: long
half-pipes, curved bowls and a few downspouts to jump", and the skateboard itself (a wooden board with wheels). Gnome
Theft Auto places them (scale 1 = metres; a gnome is about 1 m tall). The ridable concrete curves are built by the game
from a height function; these prefabs are the solid props whose sizes must match the numbers below exactly.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its "Environment" section).
- `packages/prefabs/src/types.ts` (`PrefabDef`, shapes, `rot` degrees, `pivots` if you need none skip) and
  `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-park-kit.ts`: `skate-quarter-pipe` and `grind-rail` (style and scale).
- `packages/prefabs/src/catalog/gta-winter-rides.ts`: `snow-skis` / `tea-tray-sled` (small ridden things used as GTA
  vehicles: nose +z, origin on the ground, `category`, `uses`).

## Change
`GTA_GUTTER_BOWLS` in `gta-gutter-bowls.ts`, each with `tags` including `'gta'` and `'skate'`, `emoji: []`, five
examine lines in the house voice (dry, warm, specific):
- `gta-skateboard` (copy the category/uses the winter rides use): a wooden skateboard for a gnome: deck 0.72 long
  (along z, nose +z) x 0.2 wide x 0.025 thick at top height 0.11, nose and tail kicked up (two short tilted boxes,
  ~15 degrees), grip tape on top (a near-black box 0.003 proud), two steel trucks, four chunky cream wheels (cyl r 0.03)
  under the trucks with the wheel bottoms at y 0. A painted acorn on the underside. `footprint: { r: 0.4, h: 0.16 }`.
- `skate-ledge`: a concrete ledge exactly 5.0 long (x) x 0.6 deep (z) x 0.45 tall, origin at the bottom centre, a
  steel angle edge along both top long edges (thin boxes), a few wax smears (thin darker boxes on top) and a chipped corner.
- `gutter-deck-platform`: a wooden deck exactly 3.5 wide (x) x 11.0 long (z) with its top surface at y 2.0, origin at
  the bottom centre: plank top (boxes 0.08 thick, alternate shades), six posts, cross braces, a short ladder on one long
  side (-x), and open space underneath (the posts only; Fennel's hammock hangs under it, it is a separate prefab).
- `fennel-hammock`: a striped canvas hammock slung between two short ropes (about 1.8 long, hanging 0.6 above the
  ground; tie points at x = +-0.95, y 1.1), a pillow, a tin bowl and a little bag of cat biscuits beside it.
- `downspout-rail`: a giant Tall-One downspout lying along x: a galvanised square pipe exactly 6.0 long, 0.16 x 0.16,
  with its top at y 0.5, on two bent brackets, with an elbow bend at one end and a rust streak. Origin at the middle on
  the ground. (It is a grind rail: the top edge at y 0.5 is where the board rides.)
- `gutter-bracket`: a giant gutter bracket (a curved steel hook: a few rotated boxes, about 0.6 tall) bolted to the
  outside of the half-pipe walls as decoration, painted green with rust.
- `board-library-rack`: a timber rack 1.6 wide x 1.1 tall holding three skateboards on end (reuse the look of the
  skateboard: a deck box and wheels each), a hand-painted header board "BOARD LIBRARY" as thin text boxes, and a
  little sign "take one, leave one" with an arrow. Front +z.
- `squeegee-bucket`: a long-handled floor squeegee leaning in a yellow bucket with a puddle mat (thin dark disc).
- `gutter-leaf-pile`: a heap of dead leaves (flattened balls in browns and oranges) and a lost hubcap (a thin grey
  cyl), the kind that collects in a gutter.
Keep part counts modest (<= 45 per prefab). Colours from the palette only.

## Contract
Prefab ids and sizes exactly as above: `gta-skateboard` (nose +z, wheels on y 0), `skate-ledge` (5.0 x 0.6 x 0.45),
`gutter-deck-platform` (3.5 x 11.0, top at 2.0), `fennel-hammock`, `downspout-rail` (6.0 along x, top at 0.5),
`gutter-bracket`, `board-library-rack`, `squeegee-bucket`, `gutter-leaf-pile`.

## Done when
- `npm test -w packages/prefabs` passes.
- `npx tsc --noEmit -p packages/prefabs` shows no errors.

## Out of scope
Every other catalog file, `catalog/index.ts`, the game.
