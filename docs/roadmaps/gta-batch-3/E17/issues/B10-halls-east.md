Epic: E17 wave 2 (building the places)
Depends on: wave 1 prefabs (they exist now: check with `getPrefab`)

## Environment
Read `docs/roadmaps/gta-batch-3/E17/_common.md` first (Interiors section; who the Burrowfolk and DJ Moleman are).

## Goal
Loamdeep's east and north side is furnished: Lamplight Hall (lamp-oil and the keepers), Hearth Hall (grubs, bread and
supper), Under-Chorus Hall (the humming floor where DJ Moleman's cable comes up), the east galleries and the middle
tunnel, with signs and three story vignettes.

## Read first
- `games/gnome-theft-auto/src/societies/config.ts` (`LOAMDEEP.halls.lamplight/hearth/underChorus`,
  `LOAMDEEP.tunnels.eastGallery/eastRise/northEast/mothersNorth`, `LOAMDEEP.spots`, `LOAMDEEP.lamps`, `SOCIETY_CAST`)
- `games/gnome-theft-auto/src/societies/loamdeep/hallsEast.ts` (yours: the stub `buildHallsEast(kit)`)
- `games/gnome-theft-auto/src/interiors/types.ts` lines 40-100 (InteriorKit: put, sign, block)
- `packages/prefabs/src/catalog/gta-loamdeep.ts` and `gta-loamdeep-home.ts` (the ids and sizes)

## Change
- `games/gnome-theft-auto/src/societies/loamdeep/hallsEast.ts`: implement `buildHallsEast(kit)` with `kit.put` (local
  coordinates; room 4 m high; everything inside the named hall/tunnel rects, at least 0.6 m from their edges, NEVER
  within 1.5 m of any `LOAMDEEP.spots` point or any `LOAMDEEP.lamps` point; a clear 2 m walking line through every hall
  between its tunnel mouths). Guard every id with `getPrefab`. `{ solid: false }` for rugs and small things.
  - Tunnel mouths: `root-arch` at each mouth where an east tunnel or mothersNorth meets a hall (eastGallery both ends,
    eastRise both ends, northEast both ends, mothersNorth at the underChorus end), turned to span the tunnel,
    `solid: false`.
  - Lamplight Hall (x 30..50, z 12..28): `lamp-oil-barrel` x3, a rack of unlit `mole-lamp`s on a long table (spares),
    `lamp-taper`s in a pot, signs "LAMPLIGHT HALL / Keepers of the Lamps / Mistress Delve presiding" and "A LAMP LIT IS A
    PROMISE KEPT. A LAMP UNLIT IS A NOTE TO SELF."; the taper spot `LOAMDEEP.spots.taper` stays clear.
  - Hearth Hall (x 30..50, z -38..-22): `grub-oven` against the east wall, two `mole-table-round` with `mole-stool`s,
    `grub-bread` and `grub-jar`s on them, a sign over the oven "GRUBS, NOT ROOTS" and "SUPPER AT THE THIRD BELL. ALL
    WELCOME. EVEN GNOMES."; the north wall stays clear for the three dig faces (`LOAMDEEP.spots.digFaces`, another
    worker's): place a `dig-face` prefab against the north wall behind each dig face point (z -37.8, `solid: false`)
    with a small sign "DIG HERE, IF IT PLEASES YOU" above each.
  - Under-Chorus Hall (x -14..14, z -42..-18): two `dug-speaker`s at `LOAMDEEP.spots.speakers` (these two ARE yours:
    put them exactly there, facing south), a ring of `moss-rug`s round `danceFloor` leaving the centre 6 m clear, a cable
    (a thin dark cylinder lying on the floor, lifted 0.03 m) running from the decks spot north into the wall, a sign
    "UNDER-CHORUS HALL / feel the floor" and a hand-painted banner sign "WELCOME HOME, COUSIN" rolled up and leaning in a
    corner (for the day he visits). The `decks` and `longTunnel` spots stay clear.
  - Galleries: `mole-lamp-lit` on the walls of eastGallery and northEast (NOT eastRise or mothersNorth: those lamps
    belong to the Lamplighter job, placed by another worker).
  - Three vignettes: (1) in Hearth Hall, one place set at the table with a name card "COUSIN (DJ)" and a plate kept warm
    under a cloche (the family keeps his supper every night); (2) in Lamplight Hall, a lamp-keeper's chart on the wall
    (a sign "LAMPS LIT THIS WEEK" with tally marks) and one lamp knocked crooked with a tiny ladder beside it; (3) in
    Under-Chorus Hall, a pair of very small dancing footprints worn into the floor (flat decal planes lifted 0.03 m,
    `flatLayer`) circling the spot where the music comes up.
- `games/gnome-theft-auto/src/societies/loamdeep/hallsEast.test.ts` (new): build with `createKit` (see
  `src/interiors/kit.test.ts`) after `kit.room()`; every collider lies inside the union of halls + tunnels and keeps
  1.0 m clear of every `LOAMDEEP.spots` point and lamp point.

## Contract
`buildHallsEast(kit)` keeps its signature. It adds no spots and no npcs.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/societies/loamdeep/hallsEast.test.ts` passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no errors in your files.

## Out of scope
Every other file (hallsWest.ts, earth.ts, folk.ts, runtime.ts, interior.ts, config.ts).
