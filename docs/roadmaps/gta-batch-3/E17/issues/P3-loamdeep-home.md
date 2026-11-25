Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first. For the prefab format read `docs/roadmaps/prefab-library/_common.md`
(IGNORE its "Environment" section).

## Goal
Mole-sized furniture and fittings for Loamdeep's six halls exist as prefabs. Moles are about 0.75 m tall: furniture is
small (a table top at ~0.45 m), cosy and immaculately tidy ("the cleanest place anyone has been in").

## Read first
- `docs/roadmaps/prefab-library/_common.md`
- `packages/prefabs/src/types.ts` (PrefabDef, Part shapes)
- `packages/prefabs/src/catalog/furniture.ts` (first ~80 lines: furniture style)
- `packages/prefabs/src/catalog/gta-loamdeep-home.ts` (yours: empty `GTA_LOAMDEEP_HOME`, already registered)

## Change
- `packages/prefabs/src/catalog/gta-loamdeep-home.ts`: fill `GTA_LOAMDEEP_HOME` with exactly these ids (category
  'furniture' or 'prop' as fits; tags include 'loamdeep', 'mole', 'gta'). Front faces +z.
  - `mole-table-round` "Root-Slice Table": a round table cut from one slice of a great root, 1.2 m across, 0.45 m high.
  - `mole-stool` "Toadstool Stool": a stool shaped like a squat mushroom, 0.35 m tall.
  - `mother-chair` "The Mother's Chair": a high-backed chair of woven roots with a moss cushion, 0.9 m wide, 1.4 m tall.
  - `grub-oven` "Hearth Oven": a domed clay oven, 1.4 m wide, 1.3 m tall, with a warm glowing mouth (emissive if the
    format allows) and a stack of small logs beside it.
  - `grub-bread` "Grub Bread": a round crusty loaf on a wooden board, 0.4 m.
  - `mole-bunk-nook` "Bed Nook": a carved alcove frame with a moss mattress and a knitted blanket, 1.6 m wide, 1.2 m
    tall, 0.9 m deep (stands against a wall).
  - `post-pigeonholes` "Post Pigeonholes": a wooden rack of 6 pigeonholes (3 x 2) 1.8 m wide, 1.3 m tall, 0.4 m deep,
    each hole with a small painted symbol plate (a crown, a root, a lamp, an envelope, a loaf, a music note), a few
    letters poking out.
  - `post-sack` "Post Sack": a canvas sack of letters, tied, with a brass tag, 0.7 m tall.
  - `grub-jar` "Grub Jar": a big stoppered jar of pale grubs (supper), 0.45 m.
  - `lamp-oil-barrel` "Lamp-Oil Barrel": a small barrel on a cradle with a brass tap and a drip cup, 0.9 m tall.
  - `moss-rug` "Moss Rug": a flat oval rug of woven moss, 2.4 x 1.6 m, 0.03 m thick (the game lays it with a draw layer).
  Each with `about` ("Gnome Theft Auto: ...") and 4-6 gently funny `examine` lines (the Burrowfolk are polite, tidy and
  misunderstood: "There is a sign over the oven: GRUBS, NOT ROOTS. It has been there for generations. Nobody reads it.").

## Contract
Prefab ids exactly as above.

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Other catalog files, `catalog/index.ts`, anything under `games/`.
