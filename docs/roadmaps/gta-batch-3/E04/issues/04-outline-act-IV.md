Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Three other writers expand the other acts at the same time; you own only your output file.

## Goal
Expand the spine's act IV skeleton (rows 54-70) into full outline rows, the extended-part rows (m64-all-hats and ch5-even-cut parts) and act
IV's achievement candidates.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md`: sections 1-6 (names, the act IV rows, extended parts, cast with homes).
- `docs/roadmaps/gta-batch-3/E04/issues/outline-format.md`: the exact output format and rules.
- `docs/design/gnome-theft-auto/direction/bible.md`: sections 2 (wants, voices, arcs) and 3 (curve, running jokes, setups).
- `docs/design/gnome-theft-auto/story-edit-pass.md`: how characters are introduced today (do not break an introduction).
- Kept quests in this act: ch4-runway-flares, ch4-sandpit-drop, ch4-spade-truce (chapter4.ts), ch5-even-cut (chapter5.ts). Read their defs (`grep -n "id: '<id>'" games/gnome-theft-auto/src/quests/chapter*.ts`)
  and `docs/design/gnome-theft-auto/story.md` section 6 for their beats.
- Lore entries of the characters and places your rows use (`npm run lore -- find <name>`), skim only.

## Change
- Create `docs/roadmaps/gta-batch-3/E04/parts/outline-4.md` in the shape given in outline-format.md: the act
  summary, the quest table with exactly rows 54-70 in order (ids, titles, status, old ids, givers, regions, prereqs
  and cast as in the spine), the extended-parts table, the achievement candidates.

## Done when
- The file exists with one table row per quest number 54-70, none missing or extra; every cell filled (`-` where
  nothing applies); no `|` inside a cell; kept quest ids unchanged.
- Spot check five random rows: a build worker could implement each from the row plus the character's block.
- Report (10 lines max): the file, anything in the spine you had to bend, any new objective kind you asked for.

## Out of scope
Every other file. Character blocks, lore entries, the side-quest schedule and world-change tables are other issues.
