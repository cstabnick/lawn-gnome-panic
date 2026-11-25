Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (who the Underspanners are). For the prefab format read
`docs/roadmaps/prefab-library/_common.md` (IGNORE its "Environment" section).

## Goal
The Underspan's kit exists as prefabs: scaffolds, a shed, hammocks and the radical-but-brilliant inventors'
contraptions, made of scrap, garden hose, umbrellas and bicycle parts.

## Read first
- `docs/roadmaps/prefab-library/_common.md`
- `packages/prefabs/src/types.ts` (PrefabDef, Part shapes)
- `packages/prefabs/src/catalog/gta-hamlet-kit.ts` (a recent GTA kit file: structure)
- `packages/prefabs/src/catalog/gta-underspan.ts` (yours: empty `GTA_UNDERSPAN`, already registered)

## Change
- `packages/prefabs/src/catalog/gta-underspan.ts`: fill `GTA_UNDERSPAN` with exactly these ids (tags include
  'underspan', 'gta'; galvanised grey tubes, rust, salvaged colours, patched canvas). Front faces +z.
  - `scaffold-tower` "Scaffold Tower": a 3 x 3 m scaffold of tubes and cross-braces, 6 m tall, with a plank deck at
    3 m and a ladder up one side (category 'prop').
  - `scrap-shed` "Scrap Shed": the Underspan workshop's shell: 16 m wide (local x), 12 m deep (local z), 5 m tall,
    walls of mismatched corrugated sheets, a pitched roof patched with road signs, a wide door opening (3 m wide, 3.2 m
    tall) centred on the +z front, a crooked chimney pipe. category 'prop'.
  - `workshop-hammock` "Workshop Hammock": a canvas hammock slung between two poles 3 m apart, 1.6 m tall, a tool belt
    hanging from one pole.
  - `welding-bench` "Welding Bench": a steel bench 2 x 0.8 m, 0.9 m high, with a vice, a gas bottle beside it and a
    welding mask on top.
  - `scrap-heap` "Scrap Heap": a heap of bent sheets, bicycle wheels, springs and pipe, 4 m across, 1.8 m tall.
  - `pedal-generator` "Pedal Generator": a bicycle on a stand driving a dynamo, wires to a jar of bulbs, 1.8 m long.
  - `umbrella-glider` "Umbrella Glider": a half-built hang glider made of three umbrellas and garden canes on a trestle,
    4 m wide.
  - `updraft-lift` "The Updraft": the Underspan's lift contraption: a coiled garden hose feeding a tall patched bellows
    column (3.6 m), an upturned umbrella for a seat at the top, a big lever and a pressure dial at the base; 1.6 m
    footprint.
  - `dewdrop-cradle` "Dewdrop Cradle": an empty cradle of bent pipes for a 2 m clear ball, with a chalk sign stand,
    2.4 m wide, 0.8 m tall.
  - `spool-table` "Cable-Spool Table": a big wooden cable spool on its side used as a table, 1.4 m across, 0.9 m high,
    with rolled blueprints and a mug on it.
  - `manifesto-board` "Manifesto Board": a long plywood hoarding on two legs, 6 m wide, 2.4 m tall, 0.2 m deep, blank
    face on +z (the game pastes posters on it), paint drips at the bottom.
  - `citation-post` "Citation Post": a post with a nail and a thick stack of HOA citations skewered on it, 1.5 m tall.
  Each with `about` ("Gnome Theft Auto: ...") and 4-6 `examine` lines in the voice of the place (e.g. "Stamped on every
  citation: UNAUTHORISED VERTICALITY. The Underspanners frame the best ones.").

## Contract
Prefab ids exactly as above; `scrap-shed` exactly 16 x 12 x 5 m with its door opening centred on +z.

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Other catalog files, `catalog/index.ts`, anything under `games/`.
