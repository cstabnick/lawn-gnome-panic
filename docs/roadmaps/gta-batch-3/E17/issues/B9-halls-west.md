Epic: E17 wave 2 (building the places)
Depends on: wave 1 prefabs (they exist now: check with `getPrefab`)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section; who the Burrowfolk are: tidy, cosy,
lamp-lit, mole-sized furniture, the cleanest place anyone has been in).

## Goal
Loamdeep's west side is furnished: the entry tunnel, the Mother's Hall (Old Mother Tumblesoil's), Rootway Hall (roots
stored and sorted) and Postern Hall (the post), plus the west galleries, with signs and three story vignettes.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`LOAMDEEP.halls.mothers/rootway/postern`, `LOAMDEEP.tunnels.entry/
  westGallery/westRise/northWest`, `LOAMDEEP.spots`, `LOAMDEEP.lamps`, `SOCIETY_CAST`)
- `games/gnome-theft-auto/src/societies/loamdeep/hallsWest.ts` (yours: the stub `buildHallsWest(kit)`)
- `games/gnome-theft-auto/src/interiors/types.ts` lines 40-100 (InteriorKit: put, sign, block)
- `packages/prefabs/src/catalog/gta-loamdeep.ts` and `gta-loamdeep-home.ts` (the ids and sizes)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/hallsWest.ts`: implement `buildHallsWest(kit)` with `kit.put` (local
  coordinates, origin at the room centre; the room is 4 m high; everything inside the named hall/tunnel rects, at least
  0.6 m from their edges, NEVER within 1.5 m of any `LOAMDEEP.spots` point or any `LOAMDEEP.lamps` point, and leave a
  clear 2 m walking line through every hall between its tunnel mouths). Guard every id with `getPrefab`. Use
  `{ solid: false }` for rugs, bread, small things.
  - Tunnel mouths: a `root-arch` at each mouth where a west tunnel meets a hall (entry->mothers at z 26, westGallery at
    both ends, westRise at both ends, northWest at the postern end), turned to span the tunnel, `solid: false`.
  - The Mother's Hall (x -12..12, z 6..26): `mother-chair` at `LOAMDEEP.spots.tumblesoil` facing south (yaw 0); a big
    `moss-rug` in front; a `mole-table-round` with two `mole-stool`s and a `grub-bread`; `mole-bunk-nook` x2 against
    the east and west walls; a portrait-like sign "OUR MOTHER / (she asked for no portrait)"; a hand-stitched sampler
    sign "WE DIG WHERE WE ARE ASKED"; lit lamps (`mole-lamp-lit`) on the north and south walls (not in the lamp tunnels).
  - Rootway Hall (x -50..-30, z 12..28): rows of `root-crate` (6-8) and stacked `root-bundle`s, a chalk sign "ROOTS:
    SORTED BY SMELL / Ask Old Tamp, do not sniff yourself", a sign "LOANED, NOT EATEN (we eat grubs)".
  - Postern Hall (x -50..-30, z -38..-22): `post-pigeonholes` against the south wall behind the sorting desk spot
    (`LOAMDEEP.spots.sortingDesk` is the player's spot: put the pigeonholes 1.6 m south-west of it, not on it), three
    `post-sack`s, a `mole-table-round` as the counter, signs "POSTERN HALL / All post sorted by Mister Sift (eventually)"
    and "LETTERS TO THE SURFACE: 0 answered, 412 sent".
  - Entry tunnel: a small "LOAMDEEP" plate over the arch, a sign "PLEASE MIND THE CEILING (it minds you)", a boot-
    scraper/mat at the door end.
  - Galleries: occasional `mole-lamp-lit` on the walls of westGallery and northWest (not westRise: its lamps are the
    Lamplighter job's, placed by another worker), small root details.
  - Three vignettes: (1) in the Mother's Hall, a gnome-sized chair set at the table with a cup, a plate and a folded note
    plate "FOR WHEN THE GNOMES VISIT" and a thin layer of patient dust (a slightly grey cup; nobody has come yet);
    (2) in Postern Hall a whole pigeonhole stuffed with letters addressed upward (a sign "TO: THE SURFACE") and a
    returned one stamped "NO SUCH BURROW"; (3) in Rootway Hall a gnome's lost spade, carefully cleaned and hung on the
    wall with a tag "FOUND IN OUR CEILING. RETURN TO OWNER, GENTLY."
- `games/gnome-theft-auto/src/societies/loamdeep/hallsWest.test.ts` (new): build with `createKit` (see
  `src/interiors/kit.test.ts` for a `PlacedInterior`) after `kit.room()`; every collider the build adds lies inside the
  union of halls + tunnels and keeps 1.0 m clear of every `LOAMDEEP.spots` point and lamp point.

## Contract
`buildHallsWest(kit)` keeps its signature. It adds no spots and no npcs (other workers own those).

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/hallsWest.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (hallsEast.ts, earth.ts, folk.ts, runtime.ts, interior.ts, config.ts).
