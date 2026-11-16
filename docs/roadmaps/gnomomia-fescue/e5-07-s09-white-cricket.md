Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Storyline 09, "The White Cricket", is playable at Barkhollow and Cricket Hedge.

## Read first
- `docs/design/gnomomia/storylines/09-white-cricket.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; hedgewood layout: `barkhollow` 80,-20, `cricket-hedge` 20,-40, `elder-privet` -50,-55)

## Change
`src/data/packs/s09-white-cricket.ts`, prefix `s09-`, zone `hedgewood`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c5-neutral-ground` is done.
- **Canon NPCs:** `juniper` (ch5) and `twitchett` (ch2, Thatchford) are canon. Use `topics`/`greetingsFirst`/`extraNodes`.
- **Hush, the White Cricket** (`s09-hush`): L17 miniboss, family `shelled`, model `cricket`, white, scale 1.6. Moves: Song (ring, `slowed`). The game has no clock, so instead of "at night" it spawns at `cricket-hedge` only while the taken-quest below is active.
- **The end choice:**
  - The hunt quest's last stage is a `choice` on flag `cricket` (`spared` | `taken`). Juniper asks it, standing at `cricket-hedge` through a `placements` entry while that stage is active. Her placement is added via your own NPC copy: define `s09-juniper-at-hedge` (Juniper's look, name "Juniper Quickstring"), shown only during that stage.
  - Then two short follow-up quests, each offered only for its flag value:
    - `s09-spared`: `talk juniper`.
    - `s09-taken`: `kill s09-hush`, then `talk juniper`.
- **Items:** the Whitesong Jerkin, Hunter's Ear Horn and White Wing, as the doc gives them.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch5 pack. Don't edit `juniper` (owned by ch5): use `topics` and your own NPC copy for the hedge scene.
