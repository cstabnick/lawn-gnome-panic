Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-manor.ts` holds Brassknock Manor (the house, at half size), its gate, a
garden wall run, a stone urn, a sundial and a tasting table.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-campus-halls.ts`: `rootwell-library` (a finished half-size building prefab placed
  with scale 2: copy how it builds walls, roof, portico, windows 0.03 proud).
- `packages/prefabs/src/catalog/gta-country-manor.ts`: the empty file you fill (already registered).

## Scale (important)
The catalogue test allows at most 30 on the largest side, so `brassknock-manor` is authored at HALF size and the game
places it with `scale: 2`. Game size 46 wide (x) x 18 deep (z) → author 23 x 9 exactly (the main body), front on +z.

## Change
`GTA_COUNTRY_MANOR` gets (category 'prop', uses ['place'], tags incl. 'brassknock', 'manor', 'trellisdown', 'gta';
`emoji: []`; 5 examine lines each in the house voice: Brassknock Manor is the Brassknock family house: old money, a
charter older than Turfton's, a brass knocker the size of a mower wheel that nobody has used since the charter was
signed (everyone comes round the back), seven chimneys of which the Countess lights one, most rooms shut).
Look: pale stone (0xe8e0cc), a slate roof (0x4a4f57), white sash windows with dark panes, brass details ('brass').
- `brassknock-manor` "Brassknock Manor" (`footprint`, half size: body exactly 23 x 9, walls 5 tall (game 10), a hipped
  slate roof to ~8): a long, pale, terraced mansion: a slightly projecting centre bay (6 wide, 0.5 proud on +z) with a
  pediment and a tall dark-green front door (1.4 wide x 2.4 tall at half size) carrying a huge round brass knocker
  (a torus-like ring: a thin cylinder ring or 8 small balls in a circle, 0.9 across at half size, 0.04 proud), two
  rows of tall sash windows along the front (8 per row) and 3 per side wall, SEVEN chimney stacks along the ridge
  (exactly seven, only the middle one with a small grey smoke puff ball above it), a raised front terrace along the
  centre (11 wide, 1.5 deep, 0.6 tall, at z 4.5..6 in half-size units, i.e. in front of the wall) with a stone
  balustrade (a top rail on short posts) and three steps down to the front at its middle.
- `manor-gate` "Brassknock gate": two square stone piers 3 tall at x = ±4.4 with a stone ball on top of each, two
  wrought-iron gate leaves standing open (black thin bars, turned ~80 degrees on their hinges), a brass 'B' plate on
  the left pier (0.03 proud). The 8 m gap is clear.
- `manor-wall` "Manor wall": a 6 m run of pale stone wall along local x, 2 tall, 0.5 thick, with a coping slab on top
  (0.65 wide, 0.12 thick, sitting ON the wall) and a few ivy clumps.
- `manor-urn` "Stone urn": a stone urn on a square plinth ~1.6 tall with trailing red flowers.
- `manor-sundial` "Sundial": a stone pedestal ~1.1 tall with a brass dial and gnomon (a thin tilted triangle-ish box).
- `tasting-table` "Tasting table": a long table ~3 x 0.9 with a white cloth (a box slightly wider than the top, not
  coplanar), two brass-capped bottles, eight thimble glasses (tiny cylinders) in a row, a bowl of grapes.

## Contract
Ids exactly: `brassknock-manor` (half size, body 23 x 9, front +z; the game places it with scale 2 so it is 46 x 18 with
the terrace in front), `manor-gate` (8 m clear gap), `manor-wall` (6 m along x, 0.5 thick), `manor-urn`,
`manor-sundial`, `tasting-table`.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your ids (run from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.
