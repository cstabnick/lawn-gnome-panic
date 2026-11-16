Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
Storyline 08, "A Brand for Every Herd", is playable in Cloverfield for both outcomes of the ant choice.

## Read first
- `docs/design/gnomomia/storylines/08-range-war.md` (all; the spec, including its `ants=peace` / `ants=war` branches)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; cloverfield layout: `honeydew-ranch`, `pettigrew-ranch`, `red-anthills`, `sodbury`)

## Change
`src/data/packs/s08-range-war.ts`, prefix `s08-`, zone `cloverfield`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c4-antenna-sister` is done.
- **Branching:** where the storyline branches on `ants`, write two variants of the affected quests (a `QuestStage` has no `when` field, so branch by whole quests: e.g. `s08-x-peace` and `s08-x-war`, whose start options and turn-in greetings are gated `when: { flag: { name: 'ants', value: 'peace' } }` and `{ ..., value: 'war' }`).
- **New NPC:** Darnel Pegg (brand-carver, Sodbury).
- **Miniboss:** Gnawjaw, Hob of the Hayloft (`s08-gnawjaw`, L15 miniboss furred, model `rat` scale 1.3). He survives: use a `kill` stage on `s08-gnawjaw` whose `lastWords` say he yields and bolts. Then an NPC `s08-gnawjaw-yielded` (model `rat`) stands at the Pettigrew hayloft, with `hidden: { not: { questAtLeast: { id: '<that quest>', stage: <the stage after the kill> } } }`, so he only shows once the kill stage is passed. The talk and the `mice` choice happen with this NPC.
- **Canon NPCs** `haybale`, `fallow` and `kree` get lines through `topics`/`greetingsFirst`/`extraNodes`.
- **Flags:** `range` = `roundup` | `standoff`, and `mice` = `jailed` | `debt`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch4-cloverfield.ts.
