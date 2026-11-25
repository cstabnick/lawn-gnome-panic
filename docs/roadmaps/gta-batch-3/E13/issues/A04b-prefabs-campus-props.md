Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-campus-props.ts` holds Rootwell University's street and story
props: the founder's statue, a sundial, a college banner, a chalk equation board, a lab bench, a lecture bench row, a
pile of books, an essay page, a paper aeroplane and a half-built ornithopter.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice; hand-held things need `uses` 'hold' and a `grip`). Ignore its
  "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `Part`, shapes, `footprint`, `Category`, `Use`) and
  `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: finished GTA props to copy the style of.
- `packages/prefabs/src/catalog/gta-campus-props.ts`: the empty file you fill (`GTA_CAMPUS_PROPS`, already registered in
  `catalog/index.ts`).

## Change
In `GTA_CAMPUS_PROPS` (ids exact; life-size metres; category 'prop' and uses ['place'] unless said; `footprint` on anything
over 1 m; tags incl. 'gta', 'rootwell', 'campus'; 5 examine lines each in the house voice: Rootwell teaches soil, stars
and the physics of gnomes, pays its landlords (the ants) in sugar, and its Dean signed the survey over to the HOA):
- `founder-statue`: a bronze (0x8a6a3a) gnome statue ~3.2 tall on a stone plinth (1.4 x 1.4 x 1.2): the founder in a gown
  and mortarboard, holding a plumb bob out at arm's length (a string = a thin box, a bob = a small cone), a bronze
  plaque on the plinth front (+z) 0.03 proud (blank: the game writes on it).
- `quad-sundial`: a sundial ~1.1 tall: a stone baluster column and a round bronze dial plate with a triangular gnomon
  (the joke is the gnomon; say so in an examine line).
- `college-banner`: a tall vertical banner on a pole ~4 tall: a thin pole with a cross-bar at the top and a hanging cloth
  (a thin box, `tint` default 'red', with a `trim` (default 'gold' or a yellow number) stripe and a crest shape: a small
  shield of two boxes 0.02 proud).
- `chalk-equation-board`: a blackboard on an easel ~1.8 tall: a dark green board (0x23392b) in a wooden frame, a chalk
  ledge, a few white chalk scribbles (thin white boxes 0.02 proud at angles), a duster on the ledge.
- `lab-bench`: a lab bench ~2.4 x 0.9 x 0.95: a black top, cupboards, a tap, three glass flasks (small balls + necks in
  green/blue/pink `glow: true`), a burner. Uses ['place'].
- `lecture-bench-row`: one row of tiered lecture seating ~4 wide: a long bench and a writing ledge in front of it on
  shared end panels, all wood.
- `book-pile`: a messy pile of 6-7 books (boxes of different colours, slightly turned), ~0.5 tall.
- `essay-page`: a single handwritten page lying flat (category 'document' if it exists, uses ['place', 'hold'] with a
  `grip`; a thin cream box ~0.3 x 0.01 x 0.21 with 5-6 thin grey line boxes 0.002 above it, a red 'C-' mark).
- `paper-plane`: a folded paper aeroplane ~0.35 long (2-3 thin white boxes at angles), uses ['place', 'hold', 'throw'
  if `Use` has 'throw', else just 'place' and 'hold'] with a `grip`.
- `ornithopter-frame`: a half-built flapping-wing flying machine ~4 long: a wooden seat frame on two little wheels,
  one canvas wing fixed (a thin tilted box on 2-3 ribs), the other wing just bare ribs, a bicycle-pedal crank, footprint.

## Contract
Ids exactly: `founder-statue`, `quad-sundial`, `college-banner`, `chalk-equation-board`, `lab-bench`, `lecture-bench-row`,
`book-pile`, `essay-page`, `paper-plane`, `ornithopter-frame`.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your ten ids.
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file (including `catalog/index.ts` and `gta-pinwheel-campus-props.ts`, another worker's).
