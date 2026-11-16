Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
Chapter 4, "Root and Seed", is playable: Sodbury's people, the ranch troubles, the snail mount, the Ant Thousand (peace or war), Old Gleaner (fight or feed), the Great Haul escort, and the Chapter 4 side quests.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 4 (all)
- `docs/design/gnomomia/places-and-people.md` §4
- `docs/design/gnomomia/bestiary.md`, the Cloverfield table and the Old Gleaner row; `items.md` (Cloverfield row; Gleaner's Pinion, Formica's Mandible, Haybale Family Hoe; the Honeydew flask, Snail-cart ticket)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; cloverfield layout)

## Change
`src/data/packs/ch4-cloverfield.ts`, prefix `c4-`, zone `cloverfield`.
- **NPCs** (canonical): `haybale fallow muckle mabel kree`. Kree is an ant (`model: 'ant'`) at the edge of `red-anthills`.
  - Add a non-canonical `c4-ant-queen-npc` (ant, scale 2) at the anthill centre, hidden when `flag ants=war`. She is the peace-route turn-in.
- **Shops:**
  - A Sodbury smith with the Cloverfield row from items.md (ilvl 12-15).
  - A general store on `muckle` with `honeydew-flask` (heal 30% over time; as a simple potion, heal 40) and `snailcart-ticket`.
  - Mabel offers snail-cart travel options to every visited town's shrine (`travel` actions, each gated by `quest done` for the chapter that opens that town), costing a `snailcart-ticket` (`takeItem`).
- **Enemies** (canonical): `aphid ladybird runaway-snail field-mouse red-ant-worker red-ant-soldier grasshopper straw-wight ant-queen old-gleaner`.
  - Aphids are passive and trivial. Killing one says "Ma Haybale won't like that."
  - `ant-queen` is a miniboss that only spawns while `flag ants=war`.
  - `old-gleaner` is a world boss, winged, with moves Swoop (lane), Gust (cone, damage plus `slowed` 3 s) and Snatch (vanish). She only spawns while `c4-old-gleaner` is active and `flag gleaner` is unset.
- **Main quests:** `c4-royal-warrant`, `c4-rustlers`, `c4-runaway-snails`, `c4-granary`, `c4-antenna-sister` (choice: flag `ants` = `peace` | `war`), `c4-old-gleaner` (choice: flag `gleaner` = `fed` | `killed`), and `c4-great-haul` (finale; `escort` Mabel from Sodbury toward the keep exit at 120,0 r 8; gives `snailcart-writ`). `c4-royal-warrant` unlocks after `c3-ledger` is done.
  - Runaway snails: 5 `interact` objects (verb Lasso).
  - The Gleaner feed route: `collect` 10 `c4-grain-sack` from a hidden-store object, then `interact` the perch object.
- **Side quests:** `c4-straw-king` (the short canon version; storyline 07 extends it), `c4-last-pupil`, `c4-haybale-letters`, `c4-muckles-skimming`, and `c4-potsworths-tax`.
- **Riding snail mount:** reward an item `c4-riding-snail` (trinket, `stats: { moveSpeed: 30 }`).

## Done when
- The content-pack done-when in the common section.

## Out of scope
Zone files, storyline packs s04, s07, s08.
