Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
First-pass lore entries (L86) for every new place, person and thing of the west group, one file each.

## Read first
- `docs/lore/README.md`: the entry schema (front matter fields and allowed values) and body sections.
- `docs/roadmaps/gta-batch-3/E04/spine.md`: section 1 (names), 4 (the rows that use these), 6 (people, homes), 8.
- `docs/lore/rulings.md`: R-161, R-162, R-163, R-164 (at the end of the file).
- Two neighbouring entries as models: `docs/lore/entries/apocrypha/pebblewick.md` (place) and `hazel-mattock.md` (person).

`hedgeworth-links` names its nine holes with par (E15 uses them). `loamdeep` names 4-6 halls and the three kinds of mole job (roots, lamps, post) for E17. `the-burrowfolk` must link `dj-moleman` and say how they are misread (R-164); the Fescue entry `mole-clans` may be in `related` (it exists). `flock-of-the-one-leg` lists their absurd rules. Read `dj-moleman`, `subsoil-radio`, `mossy-wood`, `loch-moss`, `tallgrass-commons`, `patio-country-club`, `the-unmowed`, `evil-shadow-gnome-cultist` (keep the Flock distinct).

## Change
Create one file per id in `docs/lore/entries/apocrypha/<id>.md`: trellisdown, trellisdown-vineyard, brassknock-manor, grape-dew, wisteria-brassknock, chicory-snips, waders-rest, flock-of-the-one-leg, the-standing-lady, saxifrage-wader, the-burrow-door, loamdeep, the-burrowfolk, old-mother-tumblesoil, nubbin, hedgeworth, hedgeworth-links, hedgeworth-clubhouse, the-kicked-board, peony-gravelrake, basil-divot, thrift-hosepipe.

Front matter for each: `id` (= file name), `name` (as the spine writes it), `kind` (place, person, faction, object,
concept, event), `tier: apocrypha`, `setting: apocrypha`, `era: now`, `status: draft`, `games: [gnome-theft-auto]`,
`aliases` (only names no other apocrypha entry uses), `sources: [docs/roadmaps/gta-batch-3/E04/spine.md, docs/lore/rulings.md#r-1NN]`
(the ruling that covers it), `related` (only ids that already exist in `docs/lore/entries/` or appear in the spine's
section 8 lists). Body: a one-paragraph summary first (it becomes the index line), then `## What gnomes say` (two or
three quotes in voice), `## The truth` (optional, for writers), `## In the games` (planned: the quest rows by number and
id that use it, and the E01 site or the area epic that builds it; say "planned (batch 3)"), `## Loose threads` (at least
one). People: also their home and work exactly as spine section 6. 10 to 30 lines each.

## Done when
- `npm run lore -- check` reports no error in your files. Errors that only say a `related` id from the spine's section
  8 lists does not exist yet are expected while the other lore writers work; everything else must be clean. Do not
  run `npm run lore` without `check` (it rewrites INDEX.md, which the lead owns).
- Every id listed has a file; names match the spine; no alias clashes (`npm run lore -- find <alias>` before using one).
- Report (10 lines max): files written, any `related` you dropped, anything you had to decide (the lead turns it into a ruling).

## Out of scope
`docs/lore/rulings.md`, `settings.md`, `INDEX.md` and any existing entry (if an existing entry should change, say so in
the report instead).
