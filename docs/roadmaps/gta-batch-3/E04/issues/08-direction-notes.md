Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
Write the batch-3 direction notes: `docs/design/gnome-theft-auto/direction/batch-3-notes.md`.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md` (all of it).
- `docs/design/gnome-theft-auto/direction/bible.md` (all: it is the document you extend; match its tone and its section numbering style).
- `docs/design/gnome-theft-auto/direction/lanes.md` (skim).
- `docs/roadmaps/gta-batch-3/E09-sound-voice-animation-direction.md` (the L73 shot-variety request and what E09 will do).

## Change
- Create `docs/design/gnome-theft-auto/direction/batch-3-notes.md` with these sections:
  1. **Purpose**: extends the bible for the 70-quest story; the bible still rules where they overlap.
  2. **The curve for four acts**: a table like bible section 3 (act, dramatic question, stakes, tension start -> end,
     mood and music from the existing music cues `turfton`, `heist`, `villain`, `warm`, `fescue`, `sad`, `chase`,
     `frost`, `turfton-dusk`, `sandpit`, `triumph`, `finale`), then a **tone ladder** per act (what is funny,
     what is sincere, where the jokes stop) and the six extended quests' place on the curve.
  3. **Running jokes and setups for the new rows**: a table `thread | planted (row) | rungs (rows) | paid off (row)`
     extending the bible's ladders through 70 rows. Must include: the existing ladders moved to new row numbers
     (Asphalt's bottlecap, the 48th wrench, "Okay, hear me out", the golden kazoo, Cam's broom, Granny's pie,
     Mabel's taxi, the Mayor's coats), plus new ones: Hyssop Doormat's notes on the door, Hogweed's permits, the
     Dewdrop rolling past, the Flock's one leg, the four parts of the Combine (planted #27 and #38, paid off at
     #41, #46, #50, #52, #65, #70), Vesper's hairline crack (planted #21 lantern flinch, #66 the photograph, #70
     mercy), Cam's charter (#5, #30, #34, #35, #62), the moles being misread (#24, #48, #60, W13).
  4. **The context rule (L04)**, written as a checklist a build worker applies to every quest: comms step 0 or the
     intro says who is asking, what they want, where, why now, what the player gets, in the speaker's voice; the
     journal has a one-line "Previously"; no quest depends on a skipped scene; first appearance of every new character
     says their name and their relation to someone the player knows; a place far from Turfton is introduced with how
     to get there (road, ferry, ramp, the Kicked Board).
  5. **The world-use rule (L83)**: no more than 2 consecutive main quests in one region tag; each act visits at least 3
     regions; every new area gets at least one main quest and one side quest. Then a table `new area | main quests
     (rows) | side quests (placeholder ids from the schedule issue may be written as "see schedule")` from the spine.
  6. **Shot variety (feeds L73)**: 10 to 15 concrete notes on varying the directed shots the user likes without
     losing their intent (e.g. vary the establishing shot type per region, a signature shot per new area, how arrivals
     at far areas are shot, when to use a crane or a drone-high wide, how to shoot moles at their eye height, the
     Spokewheel's rotating view, interiors' tighter framing, ski and rally follow cams).
  7. **Time of day per scene**: a table `row | scene | time of day | why` for every scene the spine implies across the
     70 rows (intro and outro at least for each row; extended parts each get one), with a note that scenes at another
     time use E06's time-lapse transition. Keep the existing scenes' current times.
  8. **Sound notes** (5-10 lines): one sonic identity per new area (feeds E09's sound bible).
  9. **Mobile**: one paragraph: no story beat needs a desktop-only key.

## Done when
- The file exists with every section above; ids and row numbers match the spine exactly; pipe tables have no `|`
  inside a cell.
- Report (10 lines max): the file and anything in the spine you had to bend.

## Out of scope
Every other file. Do not edit game code, lore, or other docs.
