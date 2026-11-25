Epic: E17 wave 1 (prefabs and systems)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (its "The game" section tells you who the Burrowfolk are). For the
prefab format read `docs/roadmaps/prefab-library/_common.md` (IGNORE its "Environment" section).

## Goal
Six mole prefabs exist: the Burrowfolk's figures (cute, round, gentle), Nubbin, Old Mother Tumblesoil, DJ Moleman and
his decks, and a mole pup.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (format, parts, colours, examine lines)
- `packages/prefabs/src/types.ts` (PrefabDef, parts, `pivots`: named pivot groups; a part's `group` field puts it in one)
- `packages/prefabs/src/catalog/gta-living-critters.ts` (small animals with `pivots` for body/head/legs: copy the style)
- `packages/prefabs/src/catalog/gta-moles.ts` (yours: empty `GTA_MOLES`, already registered in `catalog/index.ts`)

## Change
- `packages/prefabs/src/catalog/gta-moles.ts`: fill `GTA_MOLES` with exactly these ids. Moles stand upright on two
  short legs like little people, round pear-shaped body, velvet-grey fur (the `tint`), a pointed pink nose and big pink
  digging paws (the `trim`), tiny dark eyes, NO hats, NO ears sticking out. Every figure has `pivots` named `body`,
  `head`, `arm-l`, `arm-r` (the game bobs the body, nods the head and waves the paws), category 'prop' (or 'critter' if the
  catalog uses that for animals), `uses: ['place']`, tags include 'mole', 'burrowfolk', 'gta', 'loamdeep'. Front faces +z.
  - `burrowfolk-mole` "Burrowfolk Mole": 0.75 m tall, 0.5 m wide; a plain mole, small apron optional (no hat).
  - `mole-nubbin` "Nubbin": 0.6 m tall, a young mole with a satchel too big for him across one shoulder (brass buckle)
    and tiny round spectacles.
  - `mole-tumblesoil` "Old Mother Tumblesoil": 0.8 m tall, stout, silver-grey fur, a lace shawl pinned with a tiny brass
    lamp brooch, thick round spectacles, a cane of twisted root in one paw.
  - `dj-moleman` "DJ Moleman": 0.8 m tall, a mole in no costume, with a thin wire antenna strapped up his back to 1.6 m
    and a small brown trilby hat sitting on top of the antenna (the only hat in Loamdeep), big padded headphones round
    his neck.
  - `moleman-decks` "DJ Moleman's Decks": 1.4 m wide, 0.9 m tall, 0.6 m deep: two turntables (black platters, one with
    a record) and a small mixer on a crate of root wood; a thick cable running from the back down into the floor.
  - `mole-pup` "Mole Pup": 0.42 m tall, a very small mole (the Tunnel twins), oversized paws.
  Each has an `about` ("Gnome Theft Auto: ...") and 4-6 `examine` lines in the gently funny voice of the catalog (e.g.
  "Gnomes call them root-eaters. They have never eaten a root. They are too polite to correct anyone.").

## Contract
Prefab ids exactly as above, with pivots `body`, `head`, `arm-l`, `arm-r` on the five figures (not on the decks).

## Done when
- `npm test -w packages/prefabs` passes.

## Out of scope
Other catalog files (other workers own gta-loamdeep.ts, gta-loamdeep-home.ts, gta-underspan.ts, gta-flock.ts,
gta-societies-gear.ts), `catalog/index.ts`, anything under `games/`.
