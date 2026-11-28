Epic: E31 wave 2 (building the places)
Depends on: wave 1 (prefabs exist)

## Environment
Read `docs/roadmaps/gta-batch-3/E31/_common.md` first.

## Goal
The High Tarn, a cold mountain lake high on Snowcap Rise, is a destination worth the walk: a stone bothy, a little jetty,
a cairn, a birding spot for the High Tarn Diver, three vignettes, a sign, and a resident (AC (a)-(c)).

## Read first
- `games/gnome-theft-auto/src/living/highTarn.ts` (your stub: keep `buildHighTarn(scene, boxes): void` and
  `highTarnPeople(): AmbientGnomeDef[]`)
- `games/gnome-theft-auto/src/living/place.ts` (`Piece`, `placePieces`, `roadDist`, `seeded`, `pieceBox`)
- `games/gnome-theft-auto/src/living/config.ts` (`HIGH_TARN` centre (1000, -1600))
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (`tarn-bothy` 6 x 4 m; `tarn-jetty` 2 x 8 m deck top y 0.5;
  `hamlet-stone-cairn`; `milestone`) and `gta-preserve-trail.ts` (`rules-board`, `log-bench`, `trail-waymarker`)
- `games/gnome-theft-auto/src/ambientGnomes.ts` lines 1-80

## Place facts
- The tarn water `water/high-tarn`: x 910..1040, z -1650..-1570, 2.5 m deep (shelving edges). Site rect
  x 880..1120, z -1680..-1520 (natural, sloped ground).
- A footpath `trail/high-tarn-path` comes up from the road corner (1060, -1300) via (1075, -1430) to (1072, -1560), i.e.
  it arrives at the tarn's east side.
- Region 'north-highlands'.

## Change
- `games/gnome-theft-auto/src/living/highTarn.ts` (+ exported pure `planHighTarn(): Piece[]`):
  - `tarn-bothy` at about (1075, -1605) facing the water (west: yaw -PI/2), y at the lowest footprint corner; collider.
  - `tarn-jetty` from the east shore out over the water: its +z end is the far end, so rotate so it points west into
    the tarn from about (1040, -1610); y so the deck top sits 0.4 m above the water surface (`waterAt(x,z)?.surface`).
    Register the jetty deck as a walkable rooftop like the coast pier does (`addRooftop({ id: 'high-tarn-jetty', minX,
    maxX, minZ, maxZ, y, solid: false, parapet: false })` from '../interiors/rooftops', guarded with `rooftopById`).
  - `hamlet-stone-cairn` on a knoll north of the water, a `rules-board` at the path's end with a `textPlate`
    (e.g. "THE HIGH TARN / Altitude: high. / Temperature: no. / Swimming at your own regret.") and a `milestone` at the
    path start (1062, -1310) with a textPlate "HIGH TARN 1/4" (the joke: the "1/4" is a quarter of a mile, which is a lie).
  - Three vignettes: (1) the Cold Swim: a towel, a pair of boots and a folded hat left neatly on the jetty end, no
    swimmer in sight, a single bubble ring (a flat ring decal on `LAYER.marking` lifted 0.02 m above the water surface);
    (2) the Bothy Guestbook: a lectern/stand by the bothy door with an open book (tiny textPlate "Visitors: 3. Sheep: 41.")
    and a pile of stones each with a name painted (small props); (3) the Optimist's Picnic: a picnic set with an
    umbrella tied down against the wind, half its contents blown into a heap against the bothy wall.
  - Scatter 30-50 rocks / alpine tufts / heather (existing prefabs) round the shore, deterministic, never in the water
    deeper than 0.3 m, none on the path.
  - One resident from `highTarnPeople()`: id 'tarn-warden', a hermit fell-runner who keeps the bothy (idle
    'look-around'), bubble e.g. "I came up here for the quiet. Then the diver started singing."
  - One `placePieces` batch 'high-tarn'; text plates and decals as separate meshes.
- NEW `games/gnome-theft-auto/src/living/highTarn.test.ts`: the plan places the bothy and jetty; no solid piece's box
  centre is in water deeper than 0.3 m except the jetty; every piece is within the site rect grown by 40 m or along the
  path; the rooftop 'high-tarn-jetty' exists after building; residents in region 'north-highlands'.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/living/highTarn.test.ts` passes.
- `npx tsc --noEmit -p .` clean for your files.

## Out of scope
Other `living/*` files, level documents, prefabs.
