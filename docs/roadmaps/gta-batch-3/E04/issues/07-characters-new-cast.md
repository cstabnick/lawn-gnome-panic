Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
Write the character bible blocks for the new cast: one block each, in the given order, with home and workplace.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md`: sections 2, 4 (every row that names your characters) and 6 (homes, work).
- `docs/roadmaps/gta-batch-3/E04/issues/characters-format.md`: the exact block shape and rules.
- `docs/design/gnome-theft-auto/direction/bible.md` section 2 (existing characters).
- Lore entries for the existing characters (`npm run lore -- find <name>`), skim.

These are new: the spine (section 6 table and the rows that name them) is all there is. Make each one memorable in one line, give the golf trio, the mole pair, the Countess and Hogweed the deepest blocks (they carry act III), and give the moles soft, formal, cute voices (moles do not wear hats; Nubbin and Tumblesoil are moles, not gnomes, so their names need not follow the plant rule). Lugnut Lulu already races in the Fizz Cup (`games/gnome-theft-auto/src/quests/races.ts`); read her lines there and keep her.

## Change
- Create `docs/roadmaps/gta-batch-3/E04/parts/characters-3.md` starting with `## New cast (batch 3)`, then one block for each
  of these ids in this order: hyssop, parsley, chard, cardoon, fennel, hogweed, lulu, sage, chicory, wisteria, saxifrage, nubbin, tumblesoil, peony, basil, thrift, gentian, chanterelle, ragwort, clary, betony, lovage, samphire, marram.

## Done when
- One block per id listed, every field filled, homes and work identical to spine section 6.
- No two characters share a voice description.
- Report (10 lines max): the file and anything in the spine you had to bend.

## Out of scope
Every other file (outline rows, lore entries, schedule, world changes are other issues).
