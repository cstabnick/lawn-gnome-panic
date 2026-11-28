Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Three other writers expand the other acts at the same time; you own only your output file.

## Goal
Expand the spine's act II skeleton (rows 16-35) into full outline rows, the extended-part rows (ch3-salvage-raid parts) and act
II's achievement candidates.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md`: sections 1-6 (names, the act II rows, extended parts, cast with homes).
- `docs/roadmaps/gta-batch-3/E04/issues/outline-format.md`: the exact output format and rules.
- `docs/design/gnome-theft-auto/direction/bible.md`: sections 2 (wants, voices, arcs) and 3 (curve, running jokes, setups).
- `docs/design/gnome-theft-auto/story-edit-pass.md`: how characters are introduced today (do not break an introduction).
- Kept quests in this act: ch2-dew-run, ch2-sprinkler-gauntlet, ch2-vespers-offer, ch2-unmowed-tablet (chapter2.ts), ch3-salvage-raid (chapter3.ts). Read their defs (`grep -n "id: '<id>'" games/gnome-theft-auto/src/quests/chapter*.ts`)
  and `docs/design/gnome-theft-auto/story.md` section 6 for their beats.
- Lore entries of the characters and places your rows use (`npm run lore -- find <name>`), skim only.

## Change
- Create `docs/roadmaps/gta-batch-3/E04/parts/outline-2.md` in the shape given in outline-format.md: the act
  summary, the quest table with exactly rows 16-35 in order (ids, titles, status, old ids, givers, regions, prereqs
  and cast as in the spine), the extended-parts table, the achievement candidates.

## Done when
- The file exists with one table row per quest number 16-35, none missing or extra; every cell filled (`-` where
  nothing applies); no `|` inside a cell; kept quest ids unchanged.
- Spot check five random rows: a build worker could implement each from the row plus the character's block.
- Report (10 lines max): the file, anything in the spine you had to bend, any new objective kind you asked for.

## Out of scope
Every other file. Character blocks, lore entries, the side-quest schedule and world-change tables are other issues.
