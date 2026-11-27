Epic: E22-2 act IV wave A
Depends on: E22-1 (cast presets, props, gear, achievements, the W16 builder; the setup's stubs for every act IV quest id)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_quest-common.md` in full: it is the contract (files you own, the
StoryFile shape, the objective kinds, the writing and scene rules, the checks, the report).**
Use scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e22-A6`.

## Goal
Parts 1 (By Water) and 2 (By Air) of the extended row 64, All Hats, are playable, directed, polished quests: the first half of the act's triumph, where the coalition gathers.

## Your files
- src/quests/story/64a-all-hats.ts (parts p1 and p2 only), src/cutscene/scenes/story/m64a-all-hats.ts, src/quests/stages/story/s64a-all-hats.ts
- Another worker writes p3 and the final in `64-all-hats.ts` / `m64-all-hats.ts` / `s64-all-hats.ts` at the same time: do not touch them; keep p2's id and title so p3's prereq holds
- direction notes for your scenes (`docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md`)

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 64 | m64-all-hats | All Hats | 4 | extended | - | Tansy (Dust Flats overlook) | wilds | m63-four-taps | samphire, brenda, wally, hogweed, lulu, bracken, tumblesoil, granny, diggs | (1) By Water: bring the Bathtub Queen up the canal; Brenda opens New Puddle. (2) By Air: Wally and the Underspanners ready the airfield. (3) By Road: convoy the Carburettors from the Rutbottom Dirt Bowl to the overlook. (4) By Root: the Unmowed, the Burrowfolk, the Spade Guard and Granny with pie arrive at the overlook camp. (5) Each cap goes on one table; Tansy says "All hats." | see parts p1-p3 and final | see parts table | see parts table | 2,200 acorns total (p1 300, p2 300, p3 400, final 1,200); achievement All Hats at One Table; the overlook becomes the coalition camp | W16 | - | Previously: Don Compost's crews are in; this is the whole coalition at one table; prereq: m63-four-taps; each part has its own giver Tansy and its own time of day; L83: wilds (tour of canal, airfield, Rutbottom road, overlook); comedy-first with a sincere last minute in the final (Tansy counts the hats out loud); Granny's pie rung pays here ("I brought pie."); mobile: convoy and driving as in rows 2-3 |

## Extended quest parts (verbatim)

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
| m64-all-hats-p1 | 64 | By Water | visit; checkpoints (boat); visit | intro: all-hats-p1-intro (dawn) Tansy at the overlook rail with a hand-drawn map; outro: all-hats-p1-outro (day) the Bathtub Queen moored at Brenda's Vinyl Lounge, Samphire saluting | samphire, brenda | giver Tansy by call; prereq m63-four-taps; (1) visit Brenda at the Vinyl Lounge, who will open New Puddle for one day; (2) drive a boat to lead the Bathtub Queen up the canal from the dune cut to New Puddle Marina; (3) visit the marina. Reward 300 acorns; L83: canal; Samphire joined in row 44; Brenda's "we" appears twice; no sincere beat, gag at the toll; fallback: if boat checkpoints are not ready, drive the canal path with a rowboat shortcut |
| m64-all-hats-p2 | 64 | By Air | visit; probe; visit | intro: all-hats-p2-intro (day) Wally and Hogweed arguing over a propeller on the apron; outro: all-hats-p2-outro (day) a line of planes and one Dewdrop parked on the apron | wally, hogweed | prereq m64-all-hats-p1; (1) visit Desert Airfield apron; (2) hold to help the Underspanners fit a rig to the Crop Duster (probe); (3) visit the overlook to bring Wally. Reward 300 acorns; L83: dust-flats; Dewdrop appears in the background (R-165); comedy beat: Hogweed's ratios versus Wally's "just fly it"; prefab needed: none |

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

- By Water: the Bathtub Queen and Captain Samphire (row 44: `src/quests/story/44-the-bathtub-queen.ts`, `m44-the-bathtub-queen.ts`, `src/coast/pirateShip.ts`, `src/coast/config.ts`), Baroness Brenda's Vinyl Lounge and New Puddle (grep `Vinyl Lounge`, `New Puddle`, `brenda` in `src/quests/stages/` and `src/`), the canal and the dune cut (Driftwood's chart, row 32: `m32-driftwoods-chart.ts`, `STORY_MARKS` 'The dune line' (693, 926)), the boats (`src/boats.ts`, `VEHICLES` boat kinds in `src/config.ts`)
- By Air: `src/quests/stages/east.ts` `airfield-apron`; Hangar Two (`ESTATES.hangar`, (480, -64)); the Hatbrim (E33): lore `hatbrim.md` (the Bobble (700, -1700) ~105 m, Old Pate, Brim Gap (705, -1585) ~40 m), `docs/roadmaps/gta-batch-3/E33/contracts.md`, `src/mountainRoutes/` (`hatbrim.ts`, `brimGapPlan.ts`: the Top Hat café of Velma Crown, R-232); the Dewdrop (R-165, `src/dewdrop/`)

## Intro cards to place (first story appearances)

Velma Crown (`velma`) in your By Air scene at Brim Gap if she is on screen. Samphire, Brenda, Wally and Hogweed are carded already.

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

- QuestDefs `m64-all-hats-p1` (By Water, reward 300) and `m64-all-hats-p2` (By Air, reward 300), giver `dust-overlook` (Tansy, by call), `chapter: 4`, prereqs as in the stub (p1 <- m63-four-taps, p2 <- p1). Each part has its own intro and outro (the parts table) and its own time of day. Copy the structure of `src/quests/story/52-the-test-cut.ts` for parts.
- p1 By Water: visit Brenda at the Vinyl Lounge (she opens New Puddle for one day; Brenda's royal "we" twice), drive a boat (`checkpoints` with a boat `vehicle`, spawned at the start) to lead the Bathtub Queen up the canal from the dune cut to New Puddle Marina (a cutscene-only Queen sailing behind you: L95), visit the marina; intro `all-hats-p1-intro` (dawn) Tansy at the overlook rail with a hand-drawn map (she is running the plan with Pip: show it); outro `all-hats-p1-outro` (day) the Queen moored at the Vinyl Lounge, Samphire saluting. Gag at the toll. Fallback from the outline if boat checkpoints are not ready.
- p2 By Air (**R-234**: the coalition's signal is a beacon on the Bobble, the Hatbrim's summit, the highest ground in the yard and the only range the HOA never named; it will be lit at dawn on the day of the Even Cut): visit the Desert Airfield apron (intro `all-hats-p2-intro`, day: Wally and Hogweed arguing over a propeller: Hogweed's ratios versus Wally's "just fly it"); `inspect` verb 'Fit' to help the Underspanners fit a rig to the Crop Duster; fly the Crop Duster up to the Hatbrim and drop the beacon kit over the Bobble (a `steal-deliver` with `vehicleKind: 'plane'` and a `dropAt` on the summit, as `ch4-runway-flares` does its fly-over; or `checkpoints` with `vehicle: 'plane'`); Velma Crown's Top Hat café at Brim Gap is where Hogweed has gone ahead by road to build the fire (prop `hatbrim-beacon`): a scene there (she counts the plane as a car: "Cars today: 4."); back to the overlook (visit) with Wally; outro `all-hats-p2-outro` (day) a line of planes and one Dewdrop parked on the apron. Journal item "The beacon on the Bobble". Map marker: "The Bobble beacon" at the summit.
- Comedy-first in both parts; the sincere minute is the final's (another worker). Tension rises to the triumph (7). Payoffs: Samphire remembers the player boarding the barge in row 44; Brenda remembers the hose revolt; Wally and Hogweed remember rows 54-57.
- Achievements, unlocks and W-ids are already wired to your ids by the setup (or named above for you to set); your
  quest only has to be finishable. Report map markers, journal items and grants for `storyMarks.ts`.
