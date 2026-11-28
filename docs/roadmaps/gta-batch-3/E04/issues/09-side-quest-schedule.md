Epic: E04-1 Writing (parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gta-batch-3/E04/_common.md` first: worktree path, toolchain, writing-only rule, canon and house
style. Other writers work on other files of this epic at the same time; you own only your output file(s).

## Goal
Write the side-quest unlock schedule (L67): `docs/design/gnome-theft-auto/side-quest-schedule.md`.

## Read first
- `docs/roadmaps/gta-batch-3/E04/spine.md` (section 4 rows and section 6 cast).
- `games/gnome-theft-auto/src/quests/unlocks.ts` (`SIDE_UNLOCKS` today: every existing side quest, its `after` and `why`).
- `docs/roadmaps/gta-batch-3/E18-activities-side-quest-pacing.md` (what E18 builds from this file: L66 hobby intros, L30 chef job, L54 bubble-mobile).
- Skim for the side quests each area epic plans (grep "quest" in each): `docs/roadmaps/gta-batch-3/E10-*.md`, `E11-*.md`, `E12-*.md`, `E13-*.md`, `E14-*.md`, `E15-*.md`, `E16-*.md`, `E17-*.md`, `E19-*.md`.

## Change
- Create `docs/design/gnome-theft-auto/side-quest-schedule.md`:
  1. A short intro: the rule (at most 3 side quests offered at once in act I, about 4 in act II, about 6 by act III and
     IV; a side quest opens when its giver has appeared in the story or makes sense to appear; hobbies are introduced
     by a story beat that sends the player there; old saves keep anything already started or done).
  2. **The schedule table**, one row per side quest, sorted by unlock row:
     `side quest id | title | giver | unlocks after (#N main quest id) | giver appears because (character event) | region | max open at once (the cap in force at that point) | built by (existing / epic)`.
     Cover every quest in today's `SIDE_UNLOCKS` (keep their ids; re-time them onto the 70 rows, e.g. an old
     `after: 'ch2-dew-run'` becomes `#16 ch2-dew-run` or later if the new rows make a better moment) and new ones with
     placeholder ids `sq-<slug>` for: each new area (at least one each: Saltbucket Shore, the Spokewheel, the Bathtub
     Queen, Rootwell, the Anthill, Rutbottom, Snowdrop Slope, Pail Pond (ice fishing), Capwood, Pinwheel Ridge,
     Trellisdown, Wader's Rest, Loamdeep mole jobs (E17), the Underspan (E17), Hedgeworth (owner, pro, groundskeeper:
     4 to 6 quests, E15), Drainpipe Court and the Gutter Bowls (E19), construction sites (E16), the farm Windfall
     Croft (E16), polar bears and sledding (E12), the apartment and homes (E10)); the **Dewdrop** bubble-mobile series
     (`sq-dewdrop-1`..`sq-dewdrop-3`, giver Hogweed Sprocket, first after #10, last not before #33); the **chef job**
     intro (`sq-chef-first-shift`, giver Sage Ladle, after #13); the three hobby intros (birding `nc-sky-spotting` and
     `nc-reedwatch`, hunting `nc-tuft-and-tally`, fishing `nc-bent-pin`) each tied to a main row that sends the
     player near the host.
  3. **The bubble-mobile series design** (for E18): three short quests, each giver, objective kinds, beats in 3-4
     lines, reward (the Dewdrop is unlocked by the last; buyable only through it), achievement candidate.
  4. **The chef job design notes** (for E18): employer Sage Ladle at the Route South Acorn Diner kitchen; 5-8 dish names
     from the lore (acorn-flour cake, dew-poached things, grub-free mole stew...), how orders arrive, a rush hour, Gnoma
     as a guest teacher in a later shift (Gnoma's Food Truck exists in lore), levels and pay in Acorns.
  5. **Cap check**: a table `after row | offers open (count)` at rows 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
     65, 70 showing the cap holds if the player plays no side quests.

## Done when
- The file exists with every section above; ids and row numbers match the spine exactly; pipe tables have no `|`
  inside a cell.
- Report (10 lines max): the file and anything in the spine you had to bend.

## Out of scope
Every other file. Do not edit game code, lore, or other docs.
