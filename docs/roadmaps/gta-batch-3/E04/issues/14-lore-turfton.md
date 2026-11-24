Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
First-pass lore entries (L86) for every new place, person and thing of the Turfton group, one file each.

## Read first
- `docs/lore/README.md`: the entry schema (front matter fields and allowed values) and body sections.
- `docs/roadmaps/gta-batch-3/E04/spine.md`: section 1 (names), 4 (the rows that use these), 6 (people, homes), 8.
- `docs/lore/rulings.md`: R-165, R-166, R-167 (at the end of the file).
- Two neighbouring entries as models: `docs/lore/entries/apocrypha/pebblewick.md` (place) and `hazel-mattock.md` (person).

`thorne-even-estates` names its three sites (one per E01 construction slot: north-west fringe, south-east fringe, south fringe). `the-grand-combine-parts` (kind `concept`) lists the four parts, where each was built or kept, and the quests where the player meets each (rows 27, 38, 41, 46, 50, 52, 65, 70); relate it to the existing `the-grand-combine`. `lugnut-lulu`: read her lines in `games/gnome-theft-auto/src/quests/races.ts` and `fizz-cup.md`. `sage-ladle` keeps the existing `route-south-acorn-diner` and is the chef-job employer. Read `turfton`, `first-kiln-bank`, `kiln-debt`, `turfton-skyway`, `local-404-union-hall`, `big-wrench-grout`, `gnorwin-statue-park`, `founders-trim-day`, `thorne-lawn-and-order`, `thorne-tower`.

## Change
Create one file per id in `docs/lore/entries/apocrypha/<id>.md`: saucer-court, hyssop-doormat, parsley-inkpot, thorne-even-estates, levelright-construction, chard-levelright, founders-green, the-double-pot, drainpipe-court, cardoon-trowelly, the-gutter-bowls, fennel-gripwax, the-underspan, the-underspanners, hogweed-sprocket, the-dewdrop, lugnut-lulu, sage-ladle, windfall-croft, the-grand-combine-parts.

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
