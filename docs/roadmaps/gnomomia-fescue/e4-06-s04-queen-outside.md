Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
Storyline 04, "What Outside Smells Like", is playable: the Queen's secret day trip from the Keep to Sodbury.

## Read first
- `docs/design/gnomomia/storylines/04-queen-outside.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; keep and cloverfield layouts)

## Change
`src/data/packs/s04-queen-outside.ts`, prefix `s04-`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c3-ledger` is done.
- **Canon NPCs:** `marigold`, `wren`, `potsworth` and `haybale` are owned by other packs. Add their lines with `topics`/`greetingsFirst`/`extraNodes`.
- **The Queen's location:** while this storyline's Sodbury quests are active, she stands in Sodbury. Add a `placements`-like effect by defining a **separate NPC** `s04-marigold-outside` (same look as Marigold, name "Queen Marigold (in a borrowed hat)", zone cloverfield), visible only while the trip quests are active (`hidden` when they aren't). Don't edit Marigold.
- **Robin flight:** a `travel` action on Wren to cloverfield (0, 10), gated by this storyline's quest stage. The return flight goes back to keep (22, -40).
- **New NPCs:** Sergeant Bugle Hobnail, Samphire Hobnail and Teacher Sage Rakehandle.
- **Keep pikemen enemies:** `s04-keep-pikeman`, L12-13 normal fired. Note that they're the Queen's own guards: the `examine` says so, and the quest text says to drive them off, not crack them.
- **Flag:** `queen_outside` = `home` | `stayed`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch3/ch4 packs.
