Epic: 5, Hedgewood and the Rockery
Depends on: none

## Goal
Storyline 12, "The Damp", is playable: the moles' side of history and a water deal between the moles and the Pipewrights.

## Read first
- `docs/design/gnomomia/storylines/12-the-damp.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; rockery layout: `mudtooth-deeps` 60,50,18; keep layout for Ida; thatchford for Nettle)

## Change
`src/data/packs/s12-the-damp.ts`, prefix `s12-`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c6-honest-words` is done **and** `flag mudtooth=trust`.
- **Canon NPCs:** `mudtooth`, `ida` and `nettle`. Use `topics`/`greetingsFirst`/`extraNodes`.
- **New NPC:** Tunk, a mole (`model: 'mole'`).
- **Enemy:** Dry-root weevil (`s12-dry-root-weevil`, shelled, model `beetle`, brown).
- **Objects:** the Soakway and the Dry Hall seal (a `valve` at (70,60)).
- **Flag:** `damp` = `shared` | `kept`.
- **Ally:** `allies: [{ id: 's12-mole-tunnellers', name: 'Mole tunnellers', when: { flag: { name: 'damp', value: 'shared' } }, effect: 'wheel-dig' }]`.
- **The optional Verge quest** *Under the Wheels* (L25): include it, in zone verge at `battlefield`, unlocked by `c7-muster` active or done.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch6 pack.
