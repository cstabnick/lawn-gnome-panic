Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Storyline 11, "Finishing", is playable: firing some of the Unfired into finished gnomes in the Kiln's side mouths.

## Read first
- `docs/design/gnomomia/storylines/11-finishing-the-unfired.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; rockery layout: `kiln` 0,-80,18, `kiln-back` 0,-102,8, `flintdelve` 0,20)

## Change
`src/data/packs/s11-finishing-the-unfired.ts`, prefix `s11-`, zone `rockery`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c6-kiln-warden` is done.
- **Giver:** `sedum` is canon. Use `topics`/`greetingsFirst`/`extraNodes`.
- **Objects:** the three Kiln side mouths (`s11-side-mouth-1..3`, verb Fire) at (-10,-90), (0,-94) and (10,-90).
- **Sun magic:** a stage that says "fire them with Sun" can't detect spell school. Use an `interact` with each mouth instead, and gate the mouth objects with `hasItem` for the glaze item.
- **New NPCs:** Hyssop Mudpat appears in `flintdelve` (`hidden` until the right quest is done). Lupin Crock stands in `kiln-back`. In the Verge chapter, Lupin also has a `placements` entry at verge `last-tuft` when `flag unfired=fired`.
- **Flag:** `unfired` = `fired` | `kept`.
- **Items:** Dry rockrose and Kiln glaze (materials, questItem), and Kiln tongs (Sprouted trinket).
- **Rule:** never say who lit the Kiln.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch6 pack.
