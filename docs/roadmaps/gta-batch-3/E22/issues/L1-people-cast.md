Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` in full: it is the contract (environment, files you
may touch, entry rules, checks, report).**

## Goal
Every person of the story's existing cast (the character bible's "Main cast (existing)" and "Side cast (existing)"
sections) has one lore entry that agrees with the bible and the game, and the known contradictions are settled.

## Your group (you own these entries; nobody else edits them in this epic)
The people in `docs/design/gnome-theft-auto/characters.md` from "### The player's gnome" down to the end of "### Reeve
Yarrow Potsherd" (the "## Main cast (existing)" and "## Side cast (existing)" sections, about 40 people), and the
entries about them in `docs/lore/entries/apocrypha/` (find each with `npm run lore -- find <name>`).

## Do
1. For each person: find the entry. Missing: write it (person entry, `kind: person`). Present: check name, role,
   home, workplace, look, voice and arc against the bible (its "Arc by act" lines and the act IV outline rows) and the
   game (`src/cutscene/cast.ts` preset, `src/cutscene/castIntros.ts` card line, `src/homes/data.ts` home): fix what
   disagrees, add a short "In the games" line for the story rows they appear in (row numbers and quest ids from the
   outline).
2. **Vesper Thorne's pronouns** differ between lore and the bible (E20 found it). Read every lore entry that names
   Vesper (`grep -rln Vesper docs/lore/entries`), the bible's "### Vesper" section and `docs/lore/canon.md`. The bible
   wins unless canon or a ruling says otherwise: make every entry you own use the bible's pronouns, list the entries
   **outside your group** that need the same fix (file + line) in your report, and propose the ruling text.
3. Look for other contradictions in your group (a different surname, home, job, look or relationship in two places)
   and settle each the same way.

## Files you may change
`docs/lore/entries/apocrypha/*.md` entries of your group (existing and new). No game files.

## Done when
`npm run lore` prints `Lore OK`; every person in your group resolves with `npm run lore -- find`.

## Out of scope
New cast (batch 3) and Pardonlin people (another worker), places, factions, rulings.md, settings.md.
