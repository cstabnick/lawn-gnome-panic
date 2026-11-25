Epic: E31 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first. Then read `docs/roadmaps/prefab-library/_common.md` for the
prefab format and examine voice, IGNORING its "Environment" section and its "Units" line: these are Gnome Theft Auto
world prefabs in LIFE-SIZE METRES (a gnome is about 1 m tall), like the other `gta-*` catalog files.

## Goal
Trail furniture and marsh plants for the Unmown nature preserve exist as prefabs.

## Read first
- `packages/prefabs/src/types.ts` (the contract)
- `packages/prefabs/src/catalog/gta-continental-kit.ts` (GTA world props in metres; `unmown-sign` is the preserve's style)
- `packages/prefabs/src/palette.ts` (colour names)

## Change
- `packages/prefabs/src/catalog/gta-preserve-trail.ts` (exists, exports an empty `GTA_PRESERVE_TRAIL`, already
  registered). Fill it. Front +z, centred, lowest point y 0, `uses: ['place']`, tags include 'gta', 'unmown', 'trail'.
  1. `trail-waymarker` — a squat wooden post 1.1 m tall, 0.15 m square, with a coloured band near the top (tint, default a
     meadow green) and a small carved arrow on the front.
  2. `trail-fingerpost` — a 2.4 m post with three arms at different heights and angles (0.9 m long, blank boards, pointed
     ends), a little cap on top. No text.
  3. `rules-board` — a notice board on two posts with a small pitched roof: board 1.4 m wide x 0.9 m tall, its FRONT face
     centred at (0, 1.45, 0.05) exactly (the game mounts a text plate at z 0.08); posts 1.9 m; total ~2.2 m. Board tint
     'wood-light', frame trim 'wood'. Say the face centre and size in `about`.
  4. `interpretive-panel` — a lectern-style panel 1.0 x 0.6 m tilted back 30 degrees at ~1.0 m height on one post, with
     a painted bird silhouette and coloured blocks for "text".
  5. `log-bench` — a split-log bench 1.8 m long, seat at 0.45 m, on two stump legs (category 'furniture', uses include
     'place' and 'sit' if the `Use` type has 'sit').
  6. `reed-clump` — a clump of 9-14 reeds 1.6-2.2 m tall (thin cylinders/cones, greens and straw), some leaning; a plant:
     tags 'reed', 'reeds', 'plant', 'marsh'.
  7. `bulrush-clump` — 5-7 bulrush stems 1.4-1.7 m with brown sausage heads (pills) and a few blades.
  8. `bird-box` — a nest box on a 2.2 m pole: little wooden box with a round hole and a sloped lid.
  9. `insect-hotel` — a 1.2 m tall wooden frame with a pitched roof, its cells stuffed with log ends, cones and straw
     (small cylinders and boxes), a sign plank at the bottom.
  10. `last-dandelion` — a single dandelion 0.7 m tall (stem + yellow flower head) standing in a ring of 8 small grey
     stones (radius 0.6 m), plus a tiny wooden "PLEASE DO NOT" stake. It is a famous plant: give it a dignified examine.
  Each: 5-6 examine lines in the Gnomes of Gnomomia voice (see the prefab common doc). The preserve is the corner no one
  has mown; the rangers' rules are gentle and absurd.

## Contract
Ids exactly as above. `rules-board` face centre (0, 1.45, 0.05), 1.4 x 0.9 m.

## Done when
- `npm test -w packages/prefabs` passes for these ids (failures only in another E31 catalog file mean a worker is
  mid-edit: rerun once, then report).
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` has no errors from your file.

## Out of scope
Every other catalog file and `catalog/index.ts`; anything under `games/`.
