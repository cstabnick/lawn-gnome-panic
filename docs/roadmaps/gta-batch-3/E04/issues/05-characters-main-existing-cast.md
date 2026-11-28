Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
Write the character bible blocks for the main existing cast: one block each, in the given order, with home and workplace.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md`: sections 2, 4 (every row that names your characters) and 6 (homes, work).
- `docs/roadmaps/gta-batch-3/E04/issues/characters-format.md`: the exact block shape and rules.
- `docs/design/gnome-theft-auto/direction/bible.md` section 2 (existing characters).
- Lore entries for the existing characters (`npm run lore -- find <name>`), skim.

The bible section 2 already has want/need/fear/secret/voice/body/arc for most of these: carry it over in the new block shape, re-cut the arc into the four new acts (I 1-15, II 16-35, III 36-53, IV 54-70) using the spine rows, and add homes, work and L58 visibility.

## Change
- Create `docs/roadmaps/gta-batch-3/E04/parts/characters-1.md` starting with `## Main cast (existing)`, then one block for each
  of these ids in this order: player, pip, tansy, vesper, turncoat-cam, don-compost, granny, juniper, reginald, mayor-mulch, diggs, bracken, sorrel, loam.

## Done when
- One block per id listed, every field filled, homes and work identical to spine section 6.
- No two characters share a voice description.
- Report (10 lines max): the file and anything in the spine you had to bend.

## Out of scope
Every other file (outline rows, lore entries, schedule, world changes are other issues).
