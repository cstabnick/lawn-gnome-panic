Epic: 3, Thatchford Downs and the Calling
Depends on: none

## Goal
Storyline 01, "The Dandelion Idol", is playable in Mossbottom Vale.

## Read first
- `docs/design/gnomomia/storylines/01-dandelion-idol.md` (all of it; it is the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids, mossbottom layout); `src/data/packs/mossbottom.ts` (the canon NPCs `pip`, `fernwick` and the `mb-feral-totem` quest you extend)

## Change
`src/data/packs/s01-dandelion-idol.ts`, prefix `s01-`, zone `mossbottom`. Follow the content pack recipe:
- New NPC: Chicory Dibble at the Feral Camp, plus every NPC, item, object and quest in the storyline's tables.
- Lines added to canon NPCs go through `topics`/`greetingsFirst`/`extraNodes`.
- The first quest unlocks after `mb-feral-totem` is done.
- Flag `feral` = `let_in` | `turned_away`. With `let_in`, Chicory gets a `placements` entry in Mossbottom.

## Done when
- The content-pack done-when in the common section.

## Out of scope
mossbottom.ts (canon pack), ch5 (the Mill Raid extra wave is read from the `feral` flag by the ch5 pack).
