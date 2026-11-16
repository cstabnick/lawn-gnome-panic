Epic: 4, Birdbath Keep, the Drainpipe Gutters and Cloverfield
Depends on: none

## Goal
Storyline 07, "The Straw King", is playable at Scarecrow Rise in Cloverfield.

## Read first
- `docs/design/gnomomia/storylines/07-straw-king.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; cloverfield layout: `scarecrow-rise` -60,95,18)

## Change
`src/data/packs/s07-straw-king.ts`, prefix `s07-`, zone `cloverfield`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after canon side quest `c4-straw-king` is done.
- **The Straw King:** a large `generic` object `s07-straw-king` (`scale: 6`, colour straw yellow) at `scarecrow-rise`, which also serves as the interact target. Add the rite-post objects too.
- **New NPCs:** Comfrey Hayfork, Marjoram Hayfork (at the Keep's Pedestal Ward, zone keep) and Clary Rakehook.
- **Enemy:** Damp-wight (`s07-damp-wight`, L15 normal plant, model `straw`). Canon `straw-wight` and `old-gleaner` are owned by ch4. Reference them, don't redefine them.
- **Flag:** `straw` = `tended` | `roosted`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch4-cloverfield.ts.
