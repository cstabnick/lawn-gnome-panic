Epic: 1 Foundation (prefabs, physics, lore, water)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E11/_env.md` first. This issue edits only Markdown under `docs/lore/` and
`docs/design/gnome-theft-auto/side-quest-schedule.md`. Check: `npm run lore` from the repo root (it validates entries and
regenerates `docs/lore/INDEX.md`; let it regenerate, never hand-edit INDEX.md).

## Goal
The lore records what E11 builds at Saltbucket Shore: one new ruling, two new entries, updated "In the games" sections,
and the side-quest schedule rows renamed to the built quest ids.

## Read first
- `docs/lore/README.md` (entry schema; first 80 lines are enough) and the last ruling in `docs/lore/rulings.md` (format).
- `docs/lore/rulings.md` section `## R-158` (the sea ruling this one extends) and `## R-038` is unrelated: ignore it.
- `docs/lore/entries/apocrypha/the-saltwater.md`, `saltbucket-boardwalk.md`, `long-spoon-pier.md`, `the-spokewheel.md`,
  `the-bathtub-queen.md`, `marram-teaspoon.md`, `samphire-bilge.md`, `driftwood-castaway.md`.

## Change
1. `docs/lore/rulings.md`: append `## R-185` (same layout as the others: **Question**, **Ruling**, **Applies to:**
   `apocrypha, gnome-theft-auto`, **Date:** 2026-11-25, **Why**). Content:
   - Question: Gnome Theft Auto builds the Saltwater (E11). How does it join the Puddle Sea, what is water-skiing to a
     gnome, and can you go aboard the Bathtub Queen?
   - Ruling: The Puddle Sea drains south through **the Saltcut**, a channel the tide dug through the dunes (Driftwood
     claims he dug it with a teaspoon; nobody has checked); boats pass from the loch all the way to the sea. The Puddle
     Sea stays fresh; the salt starts at the Saltcut's mouth (R-158 holds: the Saltwater is the real thing, and
     Driftwood was right about the "Big Puddle"). **Water-skiing** is a Saltbucket invention: two planks and a rope behind
     a boat, rented with tubes at **the Last Tube**, Driftwood's hut on the beach; on the open sea Driftwood tows anyone who
     pays. A floating **wake ramp** off the slalom is the boardwalk's favourite way to crack a gnome. **The Spokewheel**
     turns once every ninety-six seconds whatever anyone does; riders pay Marram three acorns and come down where they
     went up. **The Bathtub Queen** lies moored at the end of Long Spoon Pier, gangplank down: anyone may walk her deck
     and the captain's cabin is open to guests of the captain. She does sail, but only at night and never while anyone
     is watching (sailing is not shown in the game yet).
   - Why: E11 builds the sea, the channel, the ski runtime, the wheel ride and a boardable ship, and needs names and rules
     that fit R-158.
2. New entry `docs/lore/entries/apocrypha/the-saltcut.md` (kind `place`, tier/setting `apocrypha`, era `now`, status
   `draft`, games `[gnome-theft-auto]`, sources `[docs/lore/rulings.md#r-180, games/gnome-theft-auto/src/coast/config.ts]`,
   related `[the-puddle-sea, the-saltwater, saltbucket-shore, driftwood-castaway]`): the channel from the Puddle Sea's
   south shore (about (700, 880)) through the dunes to the Saltwater (about (745, 1205)), 14 m wide, under the
   south-band-east road bridge at (728, 1000). Sections: summary line, What gnomes say (2 quotes), The truth, In the
   games, Loose threads.
3. New entry `docs/lore/entries/apocrypha/the-last-tube.md` (kind `place`, same header style, related
   `[driftwood-castaway, saltbucket-boardwalk, the-saltwater, long-spoon-pier]`): Driftwood's tube and ski hut on the beach
   at (150, 1150), rack at (150, 1172); tubes 8 acorns, skis 11; the Saltwater slalom (six buoy gates around (-200, 1312))
   and the wake ramp at (40, 1312); Driftwood's tow boat for gnomes with no boat of their own.
4. Update the "## In the games" section of: `the-saltwater.md` (built by E11: still water `water/saltwater` along the whole
   south edge, surface ~y -8.9, waves 1.6x the loch's, the Saltcut joins it to the Puddle Sea, a slalom and wake ramp,
   boat traffic), `saltbucket-boardwalk.md` (built at (0, 1115), 420 x 46 m, the six stalls in a row on its north edge,
   the boardwalk office is Marram's), `long-spoon-pier.md` (a walkable deck from the boardwalk's east end at x 300 out to a
   bowl at z 1236..1254; the Bathtub Queen moors south of the bowl), `the-spokewheel.md` (rideable as a passenger, one turn
   every 96 s, 12 teacup gondolas, fare 3 acorns; side quest `coast-spokewheel-gondola`), `the-bathtub-queen.md` (moored at
   (300, 1268), walkable deck, captain's cabin interior; side quests `coast-bathtub-tours` and `coast-queens-treasure`).
   Keep the existing text about main-story rows 43/44/64; add, do not delete. Set `status: draft` unchanged.
5. `docs/design/gnome-theft-auto/side-quest-schedule.md`: rename the ids in every row and list that mentions them:
   `sq-spokewheel-gondola` → `coast-spokewheel-gondola`, `sq-boardwalk-tubing` → `coast-boardwalk-tubing`,
   `sq-bathtub-queen-tours` → `coast-bathtub-tours`. Add one row after `coast-bathtub-tours` in the schedule table:
   `| \`coast-queens-treasure\` | The Queen's Treasure | Captain Samphire Bilge (samphire) | \`coast-bathtub-tours\` done | Bilge lets slip about the treasure at the end of the tour. | \`saltbucket-shore\` | 6 | E11 |`
   (it is a follow-on: it opens only after the tours quest, so it never adds to the offer count at row 46).

## Done when
- `npm run lore` (repo root) passes.
- `grep -rn "sq-spokewheel-gondola\|sq-boardwalk-tubing\|sq-bathtub-queen-tours" docs/design` prints nothing.

## Out of scope
Anything under `games/` or `packages/`; other lore entries; `docs/lore/INDEX.md` by hand.
