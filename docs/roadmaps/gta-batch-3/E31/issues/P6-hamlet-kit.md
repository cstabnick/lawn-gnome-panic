Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Then read `docs/roadmaps/prefab-library/_common.md` for the
prefab format and examine voice, IGNORING its "Environment" section and its "Units" line: these are Gnome Theft Auto
world prefabs in LIFE-SIZE METRES (a gnome is about 1 m tall), like the other `gta-*` catalog files.

## Goal
Hamlet and roadside pieces for the outer countryside of Gnome Theft Auto exist as prefabs.

## Read first
- `packages/prefabs/src/types.ts`
- `packages/prefabs/src/catalog/gta-continental-kit.ts` (GTA world props in metres)
- `packages/prefabs/src/catalog/gta-coast-kit.ts` (signs and huts in metres)

## Change
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (exists, empty `GTA_HAMLET_KIT`, registered). Front +z, centred,
  lowest point y 0, `uses: ['place']`, tags include 'gta', 'hamlet', 'village', 'roadside' as fitting.
  1. `hamlet-sign` — a village name sign: a carved wooden board 1.8 x 0.7 m on two posts (top ~1.9 m), an emblem
     (a little painted flower-pot gnome hat) on a scroll above, a flower trough at its feet. Board FRONT face centred at
     (0, 1.45, 0.05) exactly; say so in `about` (the game adds the name as a text plate at z 0.08).
  2. `milestone` — a rounded grey stone 0.9 m tall, 0.5 wide, 0.25 deep, with a flat FRONT face centred (0, 0.55, 0.13)
     about 0.4 x 0.4 m for carved text (the game adds it), a little moss on top.
  3. `wayside-shrine` — a small roofed wooden niche on a post (~1.7 m): inside it a tiny golden mower ornament, two stubby
     candles and a heap of grass clippings left for luck.
  4. `village-pump` — a cast-iron hand pump 1.4 m tall with a long handle, spout and a stone trough in front.
  5. `picnic-table` — a wooden picnic table with attached benches, 1.8 m long (category 'furniture', 'sit' if available).
  6. `phone-box` — a gnome-sized red telephone box 1.0 x 1.0 x 2.4 m with a crown-shaped top, glazed panels (pale), a
     handset inside.
  7. `drystone-wall` — a 3.0 m section (along x) of drystone wall 0.9 m tall, 0.6 m thick, built from 8-12 irregular grey
     stones (boxes with slight rotations) — sections are placed 3.06 m apart.
  8. `tarn-bothy` — a stone mountain bothy 6 m (x) x 4 m (z) x 3.6 m: grey stone walls (tint), slate roof (trim), a door
     at front centre, one small window, a chimney with a stone cap, a woodpile against the -x wall.
  9. `tarn-jetty` — a small timber jetty 2 m wide (x) x 8 m long (z), deck TOP at y 0.5, posts down to y 0 (lowest point),
     a mooring post and a coiled rope at the +z end.
  10. `stone-cairn` — a cairn of stacked stones 1.4 m tall, a little flag on a stick in the top.
  Each: 5-6 examine lines in the Gnomes of Gnomomia voice (see the prefab common doc).

## Contract
Ids exactly as above; `hamlet-sign` face centre (0, 1.45, 0.05) 1.8 x 0.7; `milestone` face (0, 0.55, 0.13);
`tarn-jetty` deck top y 0.5.

## Done when
- `npm test -w packages/prefabs` passes for these ids (failures only in another E31 catalog file mean a worker is
  mid-edit: rerun once, then report).

## Out of scope
Every other catalog file, `catalog/index.ts`, anything under `games/`.
