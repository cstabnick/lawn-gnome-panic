Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Storyline 14, "The Smith's Road", is playable: Bramble's way back to Flintdelve. His Mossbottom shop upgrades by stage.

## Read first
- `docs/design/gnomomia/storylines/14-the-smiths-road.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; thatchford, keep, deeps and rockery layouts)

## Change
`src/data/packs/s14-the-smiths-road.ts`, prefix `s14-`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c2-word-to-the-reeve` is done.
- **Gating:** the Keep step needs `c3-into-the-gutters` done. The Rockery steps need `c5-heartwood` done.
- **Canon NPCs:** `bramble`, `clementine`, `cobalt`, `hammerclod` and `puddleby`. Use `topics`/`greetingsFirst`/`extraNodes`.
- **Canon side quest:** `c6-brambles-old-master` is canon (ch6). This chain leads into it: gate your quest after it on `c6-brambles-old-master` done. Don't redefine it.
- **New NPC:** Cress Hayrake (Roll-Weeder, keep `guild-halls`).
- **Shop upgrades:** Bramble's stock grows by stage. Use `shopAdds` **only once** (`shopAdds` isn't conditional), so add the stage 1 items there. Make the later stages into a **second shop NPC**: `s14-bramble-forge` ("Bramble's new forge", zone mossbottom, next to Bramble), hidden until the final quest is done, selling the Shard-iron items.
- **Flag:** `sax` = `reported` | `silent`.
- **Items:** Cobalt's Gauntlets (Sprouted, ilvl 22, hands, plate), plus the doc's other items.
- **Rule:** don't touch Gnorwin's Trowel (ch6's quest).

## Done when
- The content-pack done-when in the common section.

## Out of scope
mossbottom, ch2, ch3 and ch6 packs.
