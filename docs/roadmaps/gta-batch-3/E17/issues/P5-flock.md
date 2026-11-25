Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (who the Flock of the One Leg are). For the prefab format read
`docs/roadmaps/prefab-library/_common.md` (IGNORE its "Environment" section).

## Goal
Wader's Rest's kit exists as prefabs: the Standing Lady (a giant pink plastic lawn flamingo), the Flock's grey tents,
ritual stones, banners and the camp's everyday things. Pink is for the Lady ONLY: everything else is grey, reed-green,
mud-brown or off-white.

## Read first
- `docs/roadmaps/prefab-library/_common.md`
- `packages/prefabs/src/types.ts` (PrefabDef, Part shapes)
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (a recent GTA kit file: structure)
- `packages/prefabs/src/catalog/gta-flock.ts` (yours: empty `GTA_FLOCK`, already registered)

## Change
- `packages/prefabs/src/catalog/gta-flock.ts`: fill `GTA_FLOCK` with exactly these ids (tags include 'flock',
  'waders-rest', 'gta'). Front faces +z.
  - `standing-lady` "The Standing Lady": a giant pink plastic lawn flamingo 7 m tall on ONE thin metal leg (the other
    leg tucked up), S-curved neck, black-tipped beak sun-faded paler at the tip, a visible crack line at the knee. Head
    and beak point toward +z. category 'prop'.
  - `sand-mound` "Sand Mound": a low round mound of pale sand 14 m across, 1 m tall, gently domed.
  - `flock-big-tent` "The Big Tent": a round grey canvas tent 18 m across, 6 m tall, centre pole with a grey pennant,
    guy ropes, a door flap 2.4 m wide pinned open on the +z side.
  - `flock-tent` "Flock Tent": a small grey bell tent 3.5 m across, 2.6 m tall, door flap on +z.
  - `one-leg-stone` "One-Leg Stone": a knee-high standing stone (0.5 m) with a single footprint worn into its top.
  - `flock-banner` "Flock Banner": a 4 m pole with a hanging grey banner showing a single bird leg in ochre (not pink).
  - `rota-board` "Rota Board": a notice board on two legs, 1.6 m wide, 1.8 m tall, blank face on +z (the game writes on it).
  - `grey-washing-line` "Grey Washing": two posts 6 m apart with a line of hanging grey robes and socks.
  - `reed-tea-urn` "Reed Tea Urn": a big dented urn with a tap on a trestle table with a row of tin cups, 1.8 m wide.
  - `tuesday-bench` "Tuesday Bench": a plain bench with a plank nailed across the seat reading (in the shape only; the
    game writes text) "NOT TODAY", 1.8 m wide.
  - `lady-shrine` "Shrine to the Lady": a small table shrine under a reed canopy with a tiny WHITE flamingo figurine
    (pink is for the Lady only, so her likeness is white), pebble offerings and a candle, 1.2 m wide, 1.6 m tall.
  Each with `about` ("Gnome Theft Auto: ...") and 4-6 `examine` lines, funny and gentle (e.g. "She is a lawn ornament.
  The Flock know it and say it does not matter.").

## Contract
Prefab ids exactly as above. Only `standing-lady` is pink.

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Other catalog files, `catalog/index.ts`, anything under `games/`.
