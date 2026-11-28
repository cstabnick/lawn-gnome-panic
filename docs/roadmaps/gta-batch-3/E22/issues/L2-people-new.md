Epic: E22-1 foundation (cast, props, gear, W16, lore part 1)
Depends on: none

**First read `docs/roadmaps/gta-batch-3/E22/issues/_lore-common.md` in full: it is the contract (environment, files you
may touch, entry rules, checks, report).**

## Goal
Every person batch 3 added to Gnome Theft Auto (the new story cast and the people the area epics put in the world) has
one lore entry that agrees with the bible and the game.

## Your group (you own these entries; nobody else edits them in this epic)
- The character bible `docs/design/gnome-theft-auto/characters.md` sections "## New cast (batch 3)" (Hyssop Doormat to
  Marram Teaspoon) and "## Pardonlin (the Continentals)".
- People named by the area epics who are not in the bible, e.g. **Dr Clod Furrow** (Rootwell, E13: grep
  `Clod Furrow` in `games/gnome-theft-auto/src/`), the three Carburettors who stayed with Lulu (R-233: Big-End Bertha,
  Dipstick Dunstan, Fanbelt Fennimore), the hobby guides Wenna, Hazel and Dunnock (E18: `src/hobbyIntros.ts`), Cass
  (`src/quests/glazeQuests.ts`), the Unmown rangers' people, Velma Crown and Plumb Bob (R-232), Hector Disdain and the
  Pardonlin residents (`src/pardonlin/`), the hamlet residents (`src/living/`), named job and race people (`src/jobs/`,
  `src/streetRace/`: e.g. Sable Throttlewick). Grep `name: '` in `src/campus/`, `src/coast/`, `src/winter/`,
  `src/capwood/`, `src/rutbottom/`, `src/golf/`, `src/country/`, `src/pardonlin/`, `src/unmown/`, `src/living/`,
  `src/mountainRoutes/`, `src/jobs/`, `src/streetRace/` for named people (a `name` with a first and a last name, or a
  title and a name).
- **Not yours:** members of the Flock of the One Leg and the moles of Loamdeep (the societies worker owns them), the
  existing cast (another worker).

## Do
For each person in your group: find the entry; missing: write it (`kind: person`); present: check it against the
bible and the game (CAST preset look in `src/cutscene/cast.ts`, intro card in `src/cutscene/castIntros.ts`, home in
`src/homes/data.ts`, where the area code places them) and fix what disagrees. Add "In the games" lines for the story
rows they appear in (outline row numbers and quest ids). Settle contradictions (bible wins unless canon or a ruling
says otherwise; propose a ruling line for each).

## Files you may change
`docs/lore/entries/apocrypha/*.md` entries of your group (existing and new). No game files.

## Done when
`npm run lore` prints `Lore OK`; every person in your group resolves with `npm run lore -- find`.

## Out of scope
Existing cast, the Flock and the moles, places, factions, rulings.md, settings.md.
