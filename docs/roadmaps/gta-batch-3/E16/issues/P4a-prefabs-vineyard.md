Epic: E16-A (countryside, first parallel wave)
Depends on: none
Agent: haiku-worker

Read `docs/roadmaps/gta-batch-3/E16/issues/_env.md` first (environment, rules).

## Goal
`packages/prefabs/src/catalog/gta-country-vineyard.ts` holds the Trellisdown Vineyard kit: a vine row segment and a
crooked one, the ancient first vine, a frost-pot, the press-house, the gardener's lodge, the vineyard gate, a crate of
grapes, a brass-capped bottle of grape-dew and the clay pressing trough.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: modelling rules (`at` = part centre, `rot` in degrees, lowest point at
  y = 0, front +z, at most 40 parts, `examine` voice). Ignore its "Environment" section.
- `packages/prefabs/src/types.ts` (`PrefabDef`, `footprint`) and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-euro-garden.ts`: `euro-vine-pergola` and `euro-espalier-pear` (vine and trained-plant
  style to match).
- `packages/prefabs/src/catalog/gta-winter-lodge.ts`: `woolly-sock-lodge` (a small building prefab to copy the style of).
- `packages/prefabs/src/catalog/gta-country-vineyard.ts`: the empty file you fill (already registered).

## Change
`GTA_COUNTRY_VINEYARD` gets (tags incl. 'vineyard', 'trellisdown', 'grape', 'gta'; `emoji: []`; 5 examine lines each in
the house voice: old vines trained so long they grow straight on their own; pressed each autumn into grape-dew, sweet,
poured in thimble glasses at weddings, which runs no engine; head gardener Chicory Snips hates anyone walking on a row).
Grapes: purple (0x5b2a5e) clusters (6-10 small balls); leaves green (0x4e7a32); old wood dark brown (0x5a4330).
Lowest point y = 0, centred on the origin, front +z.
- `vine-row` "Vine row" (category 'prop', uses ['place']): a 5 m segment along local x (from x -2.5 to 2.5): two
  weathered posts at the ends ~1.6 tall, three taut wires (thin boxes 0.02) between them at 0.6 / 1.0 / 1.4, two
  gnarled vine trunks (thin bent cylinders) climbing to the wires, a band of leafy clumps (flattened green balls)
  along the top two wires and 4 hanging grape clusters. The game lays segments end to end, so nothing may stick out
  past x = ±2.55.
- `vine-row-crooked` "The crooked row": the same 5 m segment, but the posts lean opposite ways, the wires sag and the
  vine zig-zags; same x limits.
- `vine-first` "The first vine": the Countess's oldest vine, trained flat against a wall (the game stands it 0.1 in front
  of the press-house's west wall): a thick twisted trunk (3-4 short tilted cylinders, 0.15 radius) rising to ~2.5 and
  spreading into four long arms along wires on +x/-x, heavy with grape clusters, a small brass plate on a stake at its
  foot (no text). Depth (z) at most 0.6.
- `frost-pot` "Frost-pot": a black iron smudge pot ~0.7 tall (a squat round pot on three stubby feet with a tall thin
  chimney on its lid), a soot ring on the ground (a flat dark disc 0.01 tall).
- `press-house` "Press-house" (category 'prop', uses ['place'], `footprint`): exactly 12 wide x 9 deep, old stone walls
  4 tall, a red-tiled roof to ~7, a wide open arch on +z (3.5 wide) showing the dark inside (a dark back panel inside),
  a hanging lantern by the arch, two barrels against the +x wall outside, a small round window high in the -x gable.
- `gardener-lodge` "The gardener's lodge" (category 'prop', uses ['place'], `footprint`): exactly 8 x 6, a little
  stone-and-timber cottage, walls 2.8, a steep roof to ~5, a green door on +z with a pair of shears hanging beside it
  (a small sign shape, no text), a bench by the door, a rack of pruning tools on the -x wall, a vine growing over the
  door.
- `vineyard-gate` "Vineyard gate" (category 'prop', uses ['place']): two stone piers 2.6 tall at x = ±4.2, a wooden arch
  across the top at ~3.2 wound with vine leaves and a hanging bunch of grapes in the middle; the 8 m gap is clear.
- `grape-crate` "Crate of grapes": a wooden crate ~0.6 x 0.4 x 0.35 heaped with grape clusters.
- `grape-dew-bottle` "Grape-dew" (category 'food', uses ['eat', 'collect']): a slim green glass bottle ~0.3 tall with a
  brass cap and a cream label band (0.005 proud).
- `grape-trough` "Pressing trough": a long clay trough ~2.4 x 1.2 x 0.6 brimming with purple juice (a thin dark-purple
  slab 0.02 below the rim, not coplanar with it), a pair of small bare footprints of juice on a plank beside it.

## Contract
Ids exactly: `vine-row`, `vine-row-crooked` (both 5 m along x, within x ±2.55, ~1.6 tall), `vine-first` (depth <= 0.6),
`frost-pot`, `press-house` (12 x 9 plan, arch on +z), `gardener-lodge` (8 x 6 plan, door on +z), `vineyard-gate`
(8 m clear gap, piers at x ±4.2), `grape-crate`, `grape-dew-bottle`, `grape-trough`.

## Done when
- `npm test -w packages/prefabs` passes for every test naming your ids (run from the repo root; failures in other
  workers' new ids are not yours).
- `npx tsc --noEmit -p packages/prefabs` shows no errors in your file.

## Out of scope
Every other file.
