Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Storyline 05, "The Seven Kiln-born", is playable: Archivist Inkcap's hunt for claims about the Kiln-born across five zones.

## Read first
- `docs/design/gnomomia/storylines/05-seven-kiln-born.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; every zone layout)

## Change
`src/data/packs/s05-seven-kiln-born.ts`, prefix `s05-`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c3-ledger` is done. Each zone step also needs that zone's chapter to be open (e.g. the Rockery step needs `c5-heartwood` done).
- **Giver:** Inkcap is canon (`inkcap`, ch3). Use `topics`/`greetingsFirst`/`extraNodes`.
- **One claim object per zone:**
  - mossbottom: reuse the canon `mb-moss-statue` as the interact target; don't redefine it.
  - thatchford: ford stones at `thatchford-town`.
  - cloverfield: clover rows at `honeydew-ranch`.
  - hedgewood: Ivy's Hollow, a `generic` stump object at (95,-30).
  - rockery: Stonecrop's Mould at `shard-mine`.
- **New NPC table rows** marked dead or legendary are lore only: they are **not** NPCs. Use their names in object text.
- **Reward:** the Blank Name Bead, a Blooming trinket at ilvl 18.
- **Rule:** never state who the player is (lore rule 11).

## Done when
- The content-pack done-when in the common section.

## Out of scope
Every other pack.
