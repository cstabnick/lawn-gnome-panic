Epic: E12-A (winter sports, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E12/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-winter-rides.ts` holds the winter rides and the ski-hill kit: the tea-tray sled and the
skis (both driven as vehicles in Gnome Theft Auto), a rope-tow pylon, a tow handle, a slalom flag, a start hut, a finish
banner and a piste-map board.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the modelling rules (units, `at` = centre, `rot` in degrees, lowest point at
  y = 0, front +z, part limits, the `examine` voice). Ignore its "Environment" section (use this worktree).
- `packages/prefabs/src/types.ts` (the `PrefabDef` contract, `footprint`, named pivots via `name` on a part if useful) and
  `packages/prefabs/src/palette.ts` (colour names).
- `packages/prefabs/src/catalog/gta-jobs.ts`: the `tow-tube` prefab (a ride body built as a prefab) for style.
- `packages/prefabs/src/catalog/gta-winter-rides.ts`: the empty file you fill (already registered in `catalog/index.ts`).

## Change
`GTA_WINTER_RIDES` gets these prefabs (ids exact). Unit: 1 = one gnome's height; the game scales the two rides by 1.3
(sled) and 1.2 (skis).
- `tea-tray-sled` (category 'vehicle' if the `Category` type has it, else 'prop'; uses ['place']): a round Tall-One tin
  tea tray used as a sled: a flat disc about 0.78 across and 0.03 thick (`cyl`), a low rolled rim (a `ring` laid flat with
  `rot: [90, 0, 0]` or a slightly bigger thin cylinder under it, top at ~0.07; no coplanar top faces), a painted rose in
  the middle (two or three small flat discs a few hundredths above the tray top, red and green), a knotted rope loop at
  the front (+z) as a handle (a small torus/ring standing up). `tint` the tray body (default a tin silver-blue 0x9fb3c8).
  Lowest point y = 0. The gnome sits in the middle.
- `snow-skis` (vehicle/prop, place): a pair of wooden skis, each about 0.11 wide, 0.02 thick and 1.35 long along z, at
  x = ±0.12, tips at +z curling up (a short box tilted ~25° at the front end), black bindings in the middle (small boxes);
  two ski poles lying alongside is NOT wanted (the gnome stands on them; keep the area above the bindings clear).
  `tint` the ski tops (default red 0xc0392b), trim the bindings.
- `tow-pylon` (prop, place; `footprint` about r 0.3): the Bootlace Tow's post: a wooden pole about 2.4 tall, a short
  crossbar at the top, a cotton-reel pulley wheel on each end of the crossbar (a `cyl` with two wider flange discs,
  axis along x: `rot: [0, 0, 90]`), a little sloped cap on top. The rope is drawn by the game; leave it out.
- `tow-handle` (prop, place, about 0.45 tall): a cotton reel (a spool: a short `cyl` with two wider flanges) hanging on a
  short knotted bootlace above it; origin at the reel's bottom (y = 0 lowest point), the lace going up to y ~0.45.
- `slalom-flag` (prop, place): a thin pole 1.5 tall with a triangular-ish cloth flag near the top (a thin box, or a cone
  squashed flat) in `tint` (default blue 0x2a6fdb); a white tip ball.
- `start-hut` (prop, place; `footprint`): a small timber starter's hut about 1.6 wide, 1.2 deep, 1.9 tall with a sloped
  roof, an open front (+z) counter, and a hinged start bar across the front at knee height (a thin box on two posts in
  front of the hut, named part `bar` if names are supported).
- `finish-banner` (prop, place; `footprint`): two posts 2.6 tall at x = ±3, a cloth banner (a thin box 5.6 wide, 0.6
  tall) between them near the top, `tint` the banner (default orange 0xe67e22), little flags on the post tops. The game
  writes "FINISH" on it; leave it blank.
- `piste-map-board` (prop, place): a wooden noticeboard 1.4 wide, 1 tall on two legs (~1.8 total), its face showing a
  painted slope: a white triangle (a flat box or squashed cone), two coloured run lines (thin boxes: one blue zig-zag of
  three segments, one red straight), a tiny brown box for the lodge at the bottom. Face toward +z, at least 0.02 in front
  of the board.

Examine lines (5 each) in the house voice: the gnomes do not know what a tea tray is ("a round tin shield with a rose on
it, which goes very fast downhill"), the skis are "two long planks with ideas", the tow is held together by bootlaces.

## Contract
Prefab ids exactly: `tea-tray-sled`, `snow-skis`, `tow-pylon`, `tow-handle`, `slalom-flag`, `start-hut`,
`finish-banner`, `piste-map-board`. The sled is about 0.78 across and the skis 1.35 long (the game's seat positions assume
it).

## Done when
- `npm test -w packages/prefabs` passes for your ids (`cd packages/prefabs && npx vitest run -t tea-tray` etc. is quicker;
  then once the whole package).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (other catalog files are other workers').
