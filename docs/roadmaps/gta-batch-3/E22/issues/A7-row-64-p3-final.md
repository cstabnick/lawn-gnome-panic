Epic: E22-2 act IV wave A
Depends on: E22-1 (cast presets, props, gear, achievements, the W16 builder; the setup's stubs for every act IV quest id)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_quest-common.md` in full: it is the contract (files you own, the
StoryFile shape, the objective kinds, the writing and scene rules, the checks, the report).**
Use scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e22-A7`.

## Goal
Part 3 (By Road) and the final (By Root, "All hats.") of the extended row 64 are playable, directed, polished quests: the act's triumph, every outcast in Turfton at one table.

## Your files
- src/quests/story/64-all-hats.ts (p3 and the final `m64-all-hats` only), src/cutscene/scenes/story/m64-all-hats.ts, src/quests/stages/story/s64-all-hats.ts
- Another worker writes p1 and p2 in `64a-all-hats.ts` / `m64a-all-hats.ts` / `s64a-all-hats.ts` at the same time: do not touch them
- direction notes for your scenes (`docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md`)

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 64 | m64-all-hats | All Hats | 4 | extended | - | Tansy (Dust Flats overlook) | wilds | m63-four-taps | samphire, brenda, wally, hogweed, lulu, bracken, tumblesoil, granny, diggs | (1) By Water: bring the Bathtub Queen up the canal; Brenda opens New Puddle. (2) By Air: Wally and the Underspanners ready the airfield. (3) By Road: convoy the Carburettors from the Rutbottom Dirt Bowl to the overlook. (4) By Root: the Unmowed, the Burrowfolk, the Spade Guard and Granny with pie arrive at the overlook camp. (5) Each cap goes on one table; Tansy says "All hats." | see parts p1-p3 and final | see parts table | see parts table | 2,200 acorns total (p1 300, p2 300, p3 400, final 1,200); achievement All Hats at One Table; the overlook becomes the coalition camp | W16 | - | Previously: Don Compost's crews are in; this is the whole coalition at one table; prereq: m63-four-taps; each part has its own giver Tansy and its own time of day; L83: wilds (tour of canal, airfield, Rutbottom road, overlook); comedy-first with a sincere last minute in the final (Tansy counts the hats out loud); Granny's pie rung pays here ("I brought pie."); mobile: convoy and driving as in rows 2-3 |

## Extended quest parts (verbatim)

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
| m64-all-hats-p3 | 64 | By Road | checkpoints (convoy, ride-on); visit | intro: all-hats-p3-intro (dusk) Lulu in the Rutbottom Dirt Bowl on a dirt bike, the Carburettors idling; outro: all-hats-p3-outro (dusk) the convoy of engines parked in a ring at the overlook foot | lulu | prereq m64-all-hats-p2; (1) checkpoints from the Rutbottom Dirt Bowl to the overlook, keeping the whole convoy in view (use `chase-follow` for the leader); (2) visit the overlook foot. Reward 400 acorns; L83: wilds (rutbottom road); the Carburettors get their entrance; mobile: a convoy drive, no new control; fallback: none |
| m64-all-hats | 64 | By Root | visit; visit; visit | intro: all-hats-p4-intro (night) the overlook camp, firelight, a long table made of fruit crates; outro: all-hats-outro (night) the table with every hat on it, Granny's pie in the middle, Tansy saying "All hats." | bracken, tumblesoil, diggs, granny, tansy | final part keeps the id m64-all-hats; prereq m64-all-hats-p3; (1) visit the overlook camp as each faction arrives (Unmowed, Burrowfolk, Spade Guard, Granny with pie); (2) place each hat on the table; (3) visit Tansy at the board. Reward 1,200 acorns; W16 plays after; sincere minute, one gag (Granny: "I brought pie."); the pie rung pays here and again in the finale |

## Act context (verbatim from the outline)

## Act 4: Sandpit Protocol / The Even Cut (rows 54-70)

The crew comes down from the cold with a map of the Combine's four parts and a plan that needs air power. Vesper has the
date of the Even Cut (the longest day) and the whole HOA behind it; the crew has a ruined bay, a stolen crate and a
list of friends made at the edges. The player wants to take Fort Sandpit's Whirligig and stop the Combine; what they
learn is that the plan works only if every outcast in Turfton sits at one table, and that the man in the throne is a
cracked gnome, not a monster. Curve: tension 6 at the Heist Board, climbing through the flares, the drop and the truce
to 8, a dip to 4 at the Diggs and Cam scenes, a triumph at the all-hats camp (7), a sincere low (3) at Clara's porch, a
spike to 9 when City Hall falls, a hush (3) on the night before, then 9, 10 at the Combine and release to 2 in the
epilogue. Comedy follows the bible: a gag every few seconds in the early rows, one gag a scene from row 67 on, none
on top of the sincere beats (61, 66, the roof in 68, the jam in 70). Characters change: Tansy lets Pip run a plan and
stops saying "not my problem"; Diggs goes from hardliner to ally (salutes a mole); Cam is judged (free or leave); the
Countess reverses; Reginald stays behind to measure; Juniper laughs and leads; Vesper loses his hat line and his
composure. Regions: dust-flats, underspan, pebblewick, downtown, wilds (canal, airfield, Rutbottom road, the overlook
camp), trellisdown, mossy-wood, turfton-fringe. Time of day runs dusk to dawn to the longest day. All rows single-player;
every beat plays by touch. Old-save note: `ch4-runway-flares`, `ch4-sandpit-drop`, `ch4-spade-truce` and
`ch5-even-cut` keep their ids and their done state; only their prereqs change.

## Places: read these for coordinates, activities and hooks

- By Road: Rutbottom Dirt Bowl (E14: `src/rutbottom/`, `src/quests/stages/dirt.ts`, `src/quests/dirtRaces.ts`), Lugnut Lulu and the three Carburettors who stayed (R-233: Big-End Bertha, Dipstick Dunstan, Fanbelt Fennimore), rows 40, 42 (`m40-the-capwood-run.ts`, `m42-rutbottom-impound.ts`) and 30 (Cam's big night); the road from Rutbottom to the Dust Flats
- By Root: `src/quests/stages/east.ts` `dust-safehouse` (the overlook: marks, cameras); W16 (the coalition camp, `src/worldChanges/rows/coalitionCamp.ts`, built by the foundation: it shows **after** your final; your scenes stage their own camp props); the factions: the Unmowed (Bracken), the Burrowfolk (Tumblesoil, Nubbin), the Spade Guard (Diggs), Granny with pie (row 31, `m31-granny-cracks.ts`), the Flock of the One Leg (Mother Saxifrage, rows 25 and 51), the Underspanners (Hogweed), the Carburettors (Lulu), the Mulch Club (the Don, row 63), the Bathtub Queen (Samphire) and Brenda (p1), Wally (p2)

## Intro cards to place (first story appearances)

none new expected (grep `do: 'intro'` for every speaking character first; the three Carburettors may appear as looks only).

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

- QuestDefs `m64-all-hats-p3` (By Road, reward 400, prereq `m64-all-hats-p2`) and `m64-all-hats` (By Root, the final, reward 1,200, prereq p3, `achievement: 'gta-all-hats'`; W16 fires after it), giver `dust-overlook`, `chapter: 4`. Copy the parts structure of `src/quests/story/52-the-test-cut.ts`.
- p3 By Road: intro `all-hats-p3-intro` (dusk) Lulu on a dirt bike in the Dirt Bowl, the Carburettors idling (their entrance); a `chase-follow` behind Lulu leading the convoy from the Dirt Bowl to the overlook (it waits when the player falls behind: check it), then a visit at the overlook foot; outro `all-hats-p3-outro` (dusk) the convoy's engines parked in a ring at the overlook foot. Lulu remembers the Capwood Run and the impound.
- Final By Root: intro `all-hats-p4-intro` (night) the overlook camp, firelight, a long table of fruit crates (prop `crate-table`); visits as each faction arrives (the Unmowed, the Burrowfolk, the Spade Guard, Granny with pie: "I brought pie.", the Flock on one leg); an `inspect` (verb 'Hang') placing each cap on the hat rail (prop `hat-rail`): one point per faction, each note a one-line memory of what the crew did with them; visit Tansy at the heist board; outro `all-hats-outro` (night) every hat on the rail, Granny's pie in the middle, Tansy counts the hats out loud and says "All hats." **A sincere last minute: one gag only (Granny's pie), none on top of Tansy's count.** Tansy's arc lands here: she stops saying "not my problem". Mention the Countess's absence (she comes in row 65).
- Journal item "All hats" (who sits at the table). The overlook becomes the coalition camp (W16): say it in the doneText.
- Achievements, unlocks and W-ids are already wired to your ids by the setup (or named above for you to set); your
  quest only has to be finishable. Report map markers, journal items and grants for `storyMarks.ts`.
