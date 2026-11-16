Epic: 6, The Verge and the Battle of the Verge
Depends on: none

## Goal
Chapter 7, "The Verge", is playable: the flight to Last Tuft, the War Table muster, "No Hats", the Crown and Wildling peace, the Queen's judgement, the Level, and High Edger Sedgewick.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 7 (all) and the ally table at the start of Chapter 8
- `docs/design/gnomomia/places-and-people.md` §7
- `docs/design/gnomomia/bestiary.md`, the Verge table (not the Mower); `items.md` (Verge row, Rust oil, Sedgewick's Edging Blade, the King's Signet; "War Supplies" under Trades)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; verge layout)

## Change
`src/data/packs/ch7-verge.ts`, prefix `c7-`, zone `verge`.

### Canon NPCs at the Verge
They're owned by earlier packs. Show them here with **your own copies**, named the same, ids `c7-<npc>`, each with `hidden: { not: <when they're at the front> }`:
- `c7-ironsod` and `c7-wren` (at the front from `c7-wings-to-the-front` on).
- `c7-marigold` (from `c7-same-table` on).
- `c7-burdock` (only if `flag hedge=peace`).
- `c7-sedge` (at the Level gate; after "No Hats", only if `flag sedge=defected`).
- `c7-potsworth` (if `potsworth=confessed`, or after the judgement chooses exile).
- `c7-fernwick` (after `c7-muster` is done).
- Plus a Last Tuft herbalist and smith (the Verge row, ilvl 25-29).

### Enemies (canonical)
`even-cut-clipper even-cut-acolyte shorn-hound rust-rat oil-slug grass-bag-moth edger-knight high-edger`.
- `even-cut-acolyte` has a lane move (its hand-mower charge).
- `high-edger` (Sedgewick): boss with moves Edging Line (lane, big), Level Ground (buff) and Call the Faithful (summon 2 `even-cut-clipper`). `lastWords`: "You can't stop it. You can only be cut sooner or later." Spawns at `the-level`.

### Main quests
- `c7-wings-to-the-front`: talk `wren` in the Keep (use `topics` on canon `wren`), then reach verge `last-tuft`. Unlocks after `c6-who-holds-the-valve` is done.
- `c7-muster`: interact a `c7-war-table` object, then **three hand-in stages**: `talk c7-ironsod` with `takeItems` of 10 `c7-timber` (Hedgewood), 10 `c7-shard-iron` (Rockery) and 10 `c7-grain` (Cloverfield).
  - Those three items are stackable misc. They drop in their zones from that zone's normal enemies, so add spawn-independent loot: make them rewards of three repeatable "supply run" quests, `c7-supply-timber`, `-iron` and `-grain`, given by `c7-ironsod` (kill 8 of a named enemy in that zone; reward 10 of the item).
  - Each turn-in sets a flag: `supply-timber`, `supply-iron`, `supply-grain` = `filled`.
- `c7-no-hats`: reach `kings-cart` → interact `c7-kings-cart` (gives `kings-signet`) → interact `c7-hat-brims` → talk `c7-sedge` → choice flag `sedge` = `defected` | `arrested`. (This overwrites the earlier `trusted`/`wary` value; that's fine.)
- `c7-same-table`: talk `c7-marigold` with `kings-signet`. If `hedge=peace`, also talk `c7-burdock`.
- `c7-queens-judgement`: offered only if `potsworth=exposed`. Choice flag `potsworth` = `shattered` | `exiled`.
- `c7-the-level` (finale): reach `the-level` → kill 3 `edger-knight` → kill `high-edger` → talk `c7-ironsod`. On turn-in, say "The ground shakes. Far to the north, the Shed door splits open." and set flag `c8-phase` = `ready`.

### Side quests
`c7-rust-oil` (gives the `rust-oil` recipe: shop add), `c7-moths-to-flame` and `c7-fernwick-comes-north`.

### Allies
Export every chapter ally row from quests.md as `allies` in this pack. Use these exact `effect` ids, which mower.ts reads:
- Keep soldiers `barricades` (always).
- Pipewrights `valve` (always).
- Fieldwardens `stone-cart` (always), plus `cart-speed` when `supply-grain=filled` or `straw=tended`.
- Delver sappers `sapper-rebuild` (when `supply-iron=filled`).
- Wildling archers `moth-archers` (when `hedge=peace`).
- Hedgewright axes `barricade-hp` (when `supply-timber=filled`).
- The Ant Thousand `revive` (when `ants=peace`).
- Old Gleaner `rope-pin` (when `gleaner=fed`).
- Potsworth `potions` (when `potsworth=confessed`, or `potsworth=exiled`).
- Brother Sedge `lane-warning` (when `sedge=defected`).

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch8-finale.ts, mower.ts, s13 pack.
