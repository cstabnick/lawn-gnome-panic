Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Storyline 10, "Clippings", is playable: the Hedgewrights' side of the Hedgewood war, with both Heartwood outcomes.

## Read first
- `docs/design/gnomomia/storylines/10-hedgewrights.md` (all; the spec, including the `hedge=peace` / `hedge=felled` branches and epilogues)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; hedgewood layout: `clippings` 40,40, `sawdust-mill` 0,60, `barkhollow` 80,-20)

## Change
`src/data/packs/s10-hedgewrights.ts`, prefix `s10-`, zone `hedgewood`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c5-elder-privet` is done. Quest 5 needs `c5-heartwood` done, and branches on flag `hedge`: write it as two separate quests (a `QuestStage` has no `when`), whose start options and turn-in greetings are gated by the flag value.
- **Canon NPCs:** `splitwell`, `fen` and `juniper`. Use `topics`/`greetingsFirst`/`extraNodes`.
- **New NPCs:** Betony Panwell, Rue Spokeshave and Tallyman Oakum. Mallow Trowell is dead: use the name in object text only.
- **Objects:** the height post (`post`) by the sawpit, and the log-run.
- **Flags:** `widow` = `ferals` | `blamed`, and `fen` = `word` | `silent`.
- **Items:** Mallow's Chock (Sprouted trinket, ilvl 16) and Splitwell's Bucksaw (Blooming 1-hand slash, ilvl 17).

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch5 pack.
