Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
Write the world-change list (L68): `docs/design/gnome-theft-auto/world-changes.md`.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md` (section 7: the ids W01-W17 and their triggers; section 4: the rows).
- `docs/roadmaps/gta-batch-3/E18-activities-side-quest-pacing.md` (the engine E18 builds: `worldChanges.ts` with `id`, `after` quest ids, what appears; static batches are baked, so a change is a separate toggled group of props/NPCs/signs).
- `games/gnome-theft-auto/src/quests/stages.ts` (skim: stage ids that name places), and `docs/roadmaps/gta-batch-3/E01-world-expansion.md` "Slots" table (site ids).

## Change
- Create `docs/design/gnome-theft-auto/world-changes.md`:
  1. A short intro: what a world change is (a visible change that appears once a series of main quests is done, so
     the world feels like it is developing), how it is applied (from quest save state, also on old saves), and that
     a change never removes something a quest still needs.
  2. **The table**, ids W01-W17 exactly as the spine, in order:
     `id | after quest series (from..to: #N id .. #M id) | what changes | where (place name + E01 site id or stage id) | visible as (prop, npc, sign, shop, skyline, radio line) | engine support needed | reverts? (W08 ends at W17; others stay)`.
     "what changes" is 2-3 concrete sentences a builder can dress from (which props, how many NPCs doing what, what the
     sign says). Every change also gets a **radio line** idea (Turfton FM news bulletin, one line, the station named).
  3. **Coverage check**: a table `act turn or region | world change ids` showing at least one change per act turn
     (#15, #35, #52, #70) and one per region the story uses.
  4. **Ending variants**: what W17 looks like under Ending A and Ending B.

## Done when
- The file exists with every section above; ids and row numbers match the spine exactly; pipe tables have no `|`
  inside a cell.
- Report (10 lines max): the file and anything in the spine you had to bend.

## Out of scope
Every other file. Do not edit game code, lore, or other docs.
