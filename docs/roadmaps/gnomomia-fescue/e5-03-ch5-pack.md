Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Chapter 5, "Bough", is playable: the Hedgewood war, the Weaver, Queen Vespa's Paper Spire, the Heartwood choice, and the Cistern wing of the Deeps with Mother Vesh and the Valve Maps.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 5 (all)
- `docs/design/gnomomia/places-and-people.md` §5 and §3a (the Cistern row)
- `docs/design/gnomomia/bestiary.md`: the Hedgewood table and the Drainpipe Deeps Cistern rows. `items.md`: the Hedgewood row; Vespa's Stinger, Weaver's Shawl, Mother Vesh's Teeth.
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; hedgewood and deeps layouts)

## Change
`src/data/packs/ch5-hedgewood.ts`, prefix `c5-`.
- **NPCs** (canonical, zone `hedgewood`): `splitwell juniper burdock fen lichen`.
  - Juniper is a Slinger `trainer` at `barkhollow`.
  - Shops: a Clippings smith with the Hedgewood row (ilvl 16-19), and a Barkhollow tanner.
- **Enemies** (canonical):
  - Hedgewood: `cricket centipede wildling-scout hedgewright-thug web-spider weaver-below paper-wasp wasp-drone queen-vespa`.
    - Wildling scouts only spawn while `flag hedge=felled`.
    - `hedgewright-thug`: one small group of 3 near `clippings`, spawning only while `flag hedge=peace` (sore losers).
    - Queen Vespa is a boss with moves Sting Rain (ring, poisoned), Royal Guard (summon 2 `wasp-drone`) and Paper Wall (buff).
  - Cistern (zone `deeps`, regions `cistern`/`vesh-pool`): `cistern-eel drowned-toad mother-vesh`. Mother Vesh is a boss: summon brood leeches every 20 s (define `c5-brood-leech`, trivial soft).
- **Main quests:** `c5-elder-privet`, `c5-neutral-ground`, `c5-mill-raid`, `c5-weaver-below`, `c5-fens-two-families`, `c5-paper-spire`, `c5-heartwood` (finale; choice flag `hedge` = `peace` | `felled`; gives `heartwood-stake`) and `c5-valve-maps` (zone deeps; gives `valve-maps`). `c5-elder-privet` unlocks after `c4-great-haul` is done.
  - **Mill Raid** (`c5-mill-raid`):
    - Stage 1: a `defend` at `sawdust-mill` (0,60, r 10), 90 s, 3 waves of `c5-feral-raider` (L16 normal fired, model `gnome`, grey colour, bareheaded).
    - Stage 2: `talk` to a survivor NPC, who reveals the raiders were Ferals.
    - **Storyline 01's extra wave:** add a spawn group of 4 `c5-feral-raider` at (0,60) spread 10, with `when: { flag: { name: 'feral', value: 'turned_away' }, questStage: { id: 'c5-mill-raid', stage: 0 } }`. It appears when the defence starts, as a fourth wave.
- **Side quests:** `c5-beetle-of-your-own` (gives `c5-tamed-beetle` trinket; Slingers' companion talent reads it), `c5-old-lichens-guest`, and `c5-twitchett-and-quickstring`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
Zone files, s09/s10/s06 packs.
