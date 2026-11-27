Epic: E22-3 act IV wave B
Depends on: E22-1 (cast presets, props, gear, achievements, the W16 builder; the setup's stubs for every act IV quest id)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_quest-common.md` in full: it is the contract (files you own, the
StoryFile shape, the objective kinds, the writing and scene rules, the checks, the report).**
Use scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e22-B2`.

## Goal
Parts 1 (Air Support) and 2 (Deck Drop) of the finale, The Even Cut, are directed, polished quests with their own scenes: the coalition's attack begins at dawn on the longest day.

## Your files
- src/quests/story/70a-even-cut.ts (p1 and p2: real objectives are already there), src/cutscene/scenes/story/m70a-even-cut.ts, src/quests/stages/story/s70a-even-cut.ts
- Another worker writes p3 and the final in `70-even-cut.ts` / `m70-even-cut.ts` / `s70-even-cut.ts` and the kept scenes in `ch5.ts` at the same time: do not touch them
- direction notes for your scenes (`docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md`)

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 70 | ch5-even-cut | The Even Cut | 4 | extended (rewrite) | ch5-even-cut | Tansy (Dust Flats overlook) | downtown | m69-the-combine-wakes | everyone | (1) Air Support: clear the Vanguard on the meridian while Diggs and Wally strafe. (2) Deck Drop: open the Combine's shield grates with the Countess's key and parachute onto the deck. (3) The Gilded Lawn-Throne: fight the Porcelain Guard across the deck to Vesper's throne. (4) The Jam: set the Stopping Stone in the intake and take Vesper's top hat. (5) The Choice: the Golden Acorn, Endings A or B. | see parts p1-p3 and final | see parts table | see parts table | 2,500 acorns for the final (as today) plus 2,000 across the parts; achievement gta-even-cut (existing) and The Hat Comes Off | W17 | - | Previously: the Combine woke and turned onto the meridian; prereq change: was ch4-spade-truce, now m69-the-combine-wakes; id and final done state kept for old saves; existing objectives kept in order and split across the parts (see the parts table); Clara's plea applies: Vesper is stopped (hat off, hairline crack), not shattered; achievement and epilogue as today; epilogue line for Cam depends on row 62's choice; L83: downtown; mobile: air-drop and boss-combine as today; fallback: none |

## Extended quest parts (verbatim)

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
| ch5-even-cut-p1 | 70 | Air Support | crack | intro: even-cut-p1-intro (dawn) Diggs and Wally in formation over the meridian; outro: even-cut-p1-outro (day) the Vanguard cracked, the Combine's shadow on the road | diggs, wally | giver Tansy; prereq m69-the-combine-wakes; existing objective 1 (crack the four vanguard targets on the meridian) as today; Diggs's line "Nobody levels my sandbox without a permit" opens the scene (comms); Reward 500 acorns; mobile: as today |
| ch5-even-cut-p2 | 70 | Deck Drop | air-drop | intro: even-cut-p2-intro (day) the shield grates opening on the Countess's key; outro: even-cut-p2-outro (day) a parachute landing on a moving beige deck | wisteria, pip, betony | prereq ch5-even-cut-p1; existing objective 2 (air-drop onto the Combine) as today; the Countess calls to confirm the key works; Betony calls with the Even Line's last coordinate; Reward 500 acorns; no new control |

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

- The meridian (x = 0, downtown; the Combine runs z -240 .. 60) and the Vanguard targets in `70a-even-cut.ts`; the kept finale scenes in `src/cutscene/scenes/story/ch5.ts` (`even-cut-intro`, `even-cut-outro`: read for tone, do not edit); stages that already list `ch5-even-cut` (`grep -n ch5-even-cut src/quests/stages/*.ts`: `dust-safehouse`, `turfton.ts`, `turftonB.ts`, `cloverfield.ts`)
- The overlook after W16 (the coalition camp: `src/worldChanges/rows/coalitionCamp.ts`), the Bobble beacon (R-234; row 64 p2 in `64a-all-hats.ts` once written), the Countess's shield grate key (row 65), Betony and the Even Line (rows 45-46: `m46-starfall-at-the-anthill.ts`)

## Intro cards to place (first story appearances)

none new (grep first).

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

- **Do not change the objectives' kinds, count or order** (save migration). p1 = one `crack` (the four Vanguard targets), p2 = one `air-drop`. You may change text, hints, rewards (keep 500 each), comms, `cutscene`/`outro` scenes, doneText, bulletins.
- p1 Air Support: intro `even-cut-p1-intro` (dawn): the beacon on the Bobble is lit and every faction sees it (a short montage: the camp, the canal, the Dirt Bowl, the Burrow Door, Pardonlin's terrace: one shot each, L95), then Diggs and Wally in formation over the meridian; Diggs's line "Nobody levels my sandbox without a permit" opens the comms; outro `even-cut-p1-outro` (day): the Vanguard cracked, the Combine's shadow on the road.
- p2 Deck Drop: intro `even-cut-p2-intro` (day): the shield grates opening on the Countess's key (prop `shield-grate-key`); the Countess calls to confirm the key works; Betony calls with the Even Line's last coordinate; outro `even-cut-p2-outro` (day): a parachute landing on a moving beige deck (cutscene-only Combine, prefab `grand-combine-boss` scaled 5 as the runner does).
- Tension 9 to 10. One gag a scene at most. The finale's intro (`even-cut-intro`, Vesper's PA) now plays before the final part, not p1: your p1 intro is the first scene of the finale, so it must say where the story is (Previously: the Combine woke and turned onto the meridian).
- Achievements, unlocks and W-ids are already wired to your ids by the setup (or named above for you to set); your
  quest only has to be finishable. Report map markers, journal items and grants for `storyMarks.ts`.
