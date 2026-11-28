Epic: E22-3 act IV wave B
Depends on: E22-1 (cast presets, props, gear, achievements, the W16 builder; the setup's stubs for every act IV quest id)

**First read `docs/roadmaps/gta-batch-3/E22/issues/_quest-common.md` in full: it is the contract (files you own, the
StoryFile shape, the objective kinds, the writing and scene rules, the checks, the report).**
Use scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e22-B3`.

## Goal
Part 3 (The Gilded Lawn-Throne) and the final (The Jam & The Choice, id `ch5-even-cut`) of the finale are directed, polished quests: Vesper is stopped, not shattered, and the story ends in its epilogue.

## Your files
- src/quests/story/70-even-cut.ts (p3 and the final: real objectives are already there), src/cutscene/scenes/story/m70-even-cut.ts, src/quests/stages/story/s70-even-cut.ts
- `src/cutscene/scenes/story/ch5.ts`: the kept scenes `even-cut-intro` and `even-cut-outro` (rewrite in place, keep ids) and the choice's ending scenes if the choice options name any (grep `outro:` in the choice options)
- the direction notes `docs/design/gnome-theft-auto/direction/scenes/even-cut-intro.md`, `even-cut-outro.md` (update)
- Another worker writes p1 and p2 in `70a-even-cut.ts` / `m70a-even-cut.ts` at the same time: do not touch them
- direction notes for your scenes (`docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md`)

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 70 | ch5-even-cut | The Even Cut | 4 | extended (rewrite) | ch5-even-cut | Tansy (Dust Flats overlook) | downtown | m69-the-combine-wakes | everyone | (1) Air Support: clear the Vanguard on the meridian while Diggs and Wally strafe. (2) Deck Drop: open the Combine's shield grates with the Countess's key and parachute onto the deck. (3) The Gilded Lawn-Throne: fight the Porcelain Guard across the deck to Vesper's throne. (4) The Jam: set the Stopping Stone in the intake and take Vesper's top hat. (5) The Choice: the Golden Acorn, Endings A or B. | see parts p1-p3 and final | see parts table | see parts table | 2,500 acorns for the final (as today) plus 2,000 across the parts; achievement gta-even-cut (existing) and The Hat Comes Off | W17 | - | Previously: the Combine woke and turned onto the meridian; prereq change: was ch4-spade-truce, now m69-the-combine-wakes; id and final done state kept for old saves; existing objectives kept in order and split across the parts (see the parts table); Clara's plea applies: Vesper is stopped (hat off, hairline crack), not shattered; achievement and epilogue as today; epilogue line for Cam depends on row 62's choice; L83: downtown; mobile: air-drop and boss-combine as today; fallback: none |

## Extended quest parts (verbatim)

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
| ch5-even-cut-p3 | 70 | The Gilded Lawn-Throne | boss-combine (deck fight, split from the existing objective) | intro: even-cut-p3-intro (day) the throne rising at the deck's end; outro: even-cut-p3-outro (day) the Porcelain Guard down, the throne's lamp lit | vesper, pip, tansy, juniper | prereq ch5-even-cut-p2; existing objective 3 is split: the Porcelain Guard fight across the deck up to the throne goes here, the jam goes in the final part; Vesper's PA ("And to the gnome in that hat: tonight, it cracks.") becomes his unravelling here; Reward 500 acorns |
| ch5-even-cut | 70 | The Jam & The Choice | probe; crack; choice | intro: even-cut-intro (day) Vesper's PA, as today; outro: even-cut-outro (dusk) as today plus Clara's line and the epilogue; Diggs drinks at the Gnomecino | vesper, clara, tansy, pip, juniper, bracken | final part keeps the id ch5-even-cut; prereq ch5-even-cut-p3; (1) hold the Stopping Stone in the intake (the jam: the existing boss-combine's second half); (2) crack the target Vesper in the throne until his top hat comes off (not shattered; Clara's plea: a hairline crack, a still face, his hat in the player's hand); (3) the choice (Endings A or B as today); Reward 2,500 acorns; achievement gta-even-cut; The Hat Comes Off; W17 plays after; Pip speechless when Tansy says "Okay, hear me out"; the golden kazoo toots at the worst moment; the forty-eighth wrench from the box |

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

- The meridian (x = 0, downtown; the Combine runs z -240 .. 60; Vesper's throne target at (0, 0), the choice beacons at (-12, 0) and (12, 0)); `src/quests/objectivesAction.ts` `bossCombineRun` (the `phase` field: 'guards' ends when the Porcelain Guard is down; 'jam' has no guards and ends at the intake ring), stages listing `ch5-even-cut` (`grep -n ch5-even-cut src/quests/stages/*.ts`)
- W17 (after the finale: `docs/design/gnome-theft-auto/world-changes.md`, `src/worldChanges/rows/sideValve.ts`: Side-Valve reopens, the hoardings come down, clover (A) or a neon grid (B) on the meridian, the Countess's vines, the Standing Lady); the radio bulletins for both endings

## Intro cards to place (first story appearances)

none new (grep first).

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

- **Do not change the objectives' kinds, count or order** (save migration): p3 = one `boss-combine` (`phase: 'guards'`); final = `boss-combine` (`phase: 'jam'`), `crack` (Vesper), `choice` (A/B, plans `variants: ['A', 'B']`). Keep the id `ch5-even-cut`, `achievement: 'gta-even-cut'`, reward 2,500 (p3 500). Set `achievement: 'gta-hat-comes-off'` on **both** choice options (`optionA.achievement`, `optionB.achievement`: the hat comes off before the choice either way).
- p3 The Gilded Lawn-Throne: intro `even-cut-p3-intro` (day) the throne rising at the deck's end; Vesper's PA ("And to the gnome in that hat: tonight, it cracks.") begins his unravelling here; outro `even-cut-p3-outro` (day) the Porcelain Guard down, the throne's lamp lit.
- Final: `even-cut-intro` (day: Vesper's PA, as today, now playing after p3: adjust its first beat so it follows the deck fight) and `even-cut-outro` (dusk: as today plus Clara's line, Diggs drinking at the Gnomecino, the epilogue). The crack on Vesper is **not** a shattering: Clara's plea (row 66): a hairline crack, a still face, his top hat in the player's hand; Vesper loses his hat line and his composure. Payoffs: Pip is speechless when Tansy says "Okay, hear me out"; the golden kazoo toots at the worst moment; the forty-eighth wrench from the box; the Mayor's third coat in the epilogue. The jam (Bracken's Stone set in the intake) is sincere: **no gag on top**; release to tension 2 in the epilogue. The doneText summarises the epilogue (keep its Club Gnome phone-buzz hook).
- Row 62's choice is recorded on `m62-cams-cell` (`ending` 'A' freed / 'B' left): the epilogue line for Cam (he sweeps the new Green, or is gone) is wired by the lead into W17 (a world prop), so the outro scene does not branch on it: write the scene so it works either way and put the two lines you would like in your report.
- Both endings stay reachable; the sim runs both (`npm run quest-sim -- --quest ch5-even-cut --force ...` runs the variants). After the finale the world is in its epilogue state (W17) and Free Roam goes on: no scene may leave the player stranded on the Combine.
- Achievements, unlocks and W-ids are already wired to your ids by the setup (or named above for you to set); your
  quest only has to be finishable. Report map markers, journal items and grants for `storyMarks.ts`.
