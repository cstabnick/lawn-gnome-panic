Epic: E05-2 Interiors and rooftops: engine pieces
Depends on: none

## Environment
Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a89501009f27d94ba` (a git worktree; stay in it).
Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit.
Other workers edit code at the same time; you only edit `docs/lore/`. Lore rules: `docs/lore/canon.md` (read its
tone/format section), rulings are numbered and appended to `docs/lore/rulings.md`; `npm run lore -- find <word>` searches.

## Goal
The lore records the four walk-in interiors and the walkable roofs that Gnome Theft Auto now has (epic E05), so later
writers use the same facts.

## Read first
- `docs/lore/rulings.md`: the last rulings (R-166 to R-169) for the exact format (Question / Ruling / Applies to / Date / Why). The next number is **R-170**.
- `docs/lore/entries/apocrypha/bodega-and-sons.md`, `the-mulch-club.md`, `saucer-court.md`, `pigeon-drop-depot.md`.
- `npm run lore -- find "Double Pot"` and `npm run lore -- find Even-Estates` to find whether a Double Pot / Thorne Even-Estates entry exists.

## Change
- `docs/lore/rulings.md`: append
  - **R-170** (Question: what can a gnome walk into in Turfton, and what is inside?) Ruling: four walk-in interiors.
    Bodega & Sons (block x -90, z 90; the game's block placement wins over the older "x -60, z 60" in the entry):
    a narrow shop inside the overturned watering can, the counter on the north wall, Asphalt asleep on the counter, the
    Acorn-Cola tower that fell over and was never restacked, Mossley's abandoned grid-survey table. The Mulch Club lobby,
    entered by the members' side door on the south face (the front door on the east face still leads to Don Compost's
    back room for quests): velvet booths, the cloakroom with the brass plaque "NO SIRENS. NO WET HATS. NO TALKING.", a
    hat-check gnome, a silent bodyguard at the back-room door, a card game abandoned the moment somebody spoke. Flat 3B,
    Saucer Court: the player's loaned flat, empty on move-in (a bedroll, moving crates, the bank's notice on the wall);
    furnishing is E10's. The Thorne Even-Estates sales floor inside the Double Pot, door in the Double Pot Tunnel: a beige
    scale model of an Even-Estate, HOA posters, a bin of rejected colours, and a lift to the roof. Applies to
    apocrypha, gnome-theft-auto. Date 2026-11-25. Why: L36 asked for building interiors.
  - **R-171** (Question: which roofs can a gnome stand on, and where do helicopters land?) Ruling: every flat downtown
    tower roof is walkable behind a waist-high parapet; the tunnel-roof slab between the Double Pot's two halves is the
    **Thorne Helipad**, Thorne Lawn & Order's pad, reached by copter or by the sales floor's lift; towers with a helipad
    crown (the Pigeon-Drop Depot among them) take a copter too. Roofs are reached only by air or by a lift: gnomes do
    not climb. Applies to apocrypha, gnome-theft-auto. Date 2026-11-25. Why: L75 asked to land on buildings and run around.
- `docs/lore/entries/apocrypha/bodega-and-sons.md`, `the-mulch-club.md`, `saucer-court.md`: add (or extend) an
  "In the games" section with two or three sentences on the walk-in interior per R-170 (cite `R-170` in `sources` as
  `docs/lore/rulings.md#r-170`). In `pigeon-drop-depot.md` add one sentence: a copter can land on its helipad (R-171).
- If no entry exists for the Double Pot, create `docs/lore/entries/apocrypha/the-double-pot.md` (copy the front-matter
  shape of `saucer-court.md`: id `the-double-pot`, name `The Double Pot`, kind `place`, related `[thorne-lawn-and-order, downtown-turfton, saucer-court]` (only ids that exist: check each with `npm run lore -- find`)):
  Thorne Lawn & Order's 2x1 tower over street x = 120 (R-166), the tunnel under it, the sales floor and the Thorne
  Helipad on the tunnel roof (R-170, R-171); a "What gnomes say" with two short satirical lines in the house style.
  If an entry exists, extend it instead.

## Done when
- `npm run lore` passes (run from the repo root).

## Out of scope
Code; other lore entries.
