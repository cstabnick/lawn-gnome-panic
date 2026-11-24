Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
Write the character bible blocks for the side existing cast: one block each, in the given order, with home and workplace.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md`: sections 2, 4 (every row that names your characters) and 6 (homes, work).
- `docs/roadmaps/gta-batch-3/E04/issues/characters-format.md`: the exact block shape and rules.
- `docs/design/gnome-theft-auto/direction/bible.md` section 2 (existing characters).
- Lore entries for the existing characters (`npm run lore -- find <name>`), skim.

Most of these appear in one to three main rows of the spine (search the spine for their id) plus side quests; keep blocks shorter (the arc line may say "side quests only" for an act). Read `games/gnome-theft-auto/src/quests/stages.ts` (the `CAST` array: name, home stage, haunts, routine, vehicle) for their current routine and vehicle.

## Change
- Create `docs/roadmaps/gta-batch-3/E04/parts/characters-2.md` starting with `## Side cast (existing)`, then one block for each
  of these ids in this order: big-lou, bodega, mabel, bramble, theo, wally, driftwood, brenda, clara, mossley, burt, cedric, shelldon, midge, gary, rooster, frank, ernie, nora, sal, nina, dot, hedda, grout, yarrow.

## Done when
- One block per id listed, every field filled, homes and work identical to spine section 6.
- No two characters share a voice description.
- Report (10 lines max): the file and anything in the spine you had to bend.

## Out of scope
Every other file (outline rows, lore entries, schedule, world changes are other issues).
