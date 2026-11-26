Epic: E21-2 act III wave A
Depends on: E21-1 (cast presets, props, achievements, story marks exist; the setup's stubs for every act III quest id)

**First read `docs/roadmaps/gta-batch-3/E21/issues/_quest-common.md` in full: it is the contract (files you own, the
StoryFile shape, the objective kinds and the area probes, the writing and scene rules, the checks, the report).**
Use scratch dir `C:\Users\cpsai\AppData\Local\Temp\claude\e21-A7`.

## Goal
Row 46 of the story outline is playable, directed, polished quest in the one-file-per-row layout, replacing the setup's stubs.

## Your files
- src/quests/story/46-starfall-at-the-anthill.ts, src/cutscene/scenes/story/m46-starfall-at-the-anthill.ts, src/quests/stages/story/s46-starfall-at-the-anthill.ts

- direction notes for your scenes

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 46 | m46-starfall-at-the-anthill | Starfall at the Anthill | 3 | extended | - | Professor Sextant (Rootwell library) | rootwell | m45-rootwell-admissions | betony, lovage, pip, wally | (1) p1 Night Class: cross the quad at night, past Lovage's patrol, to the Anthill's base (2) p2 The Sugar Toll: the ants want rent, so steal sugar from the refectory and pay it at the Anthill's door (3) p3 The Lens: inside the observatory, crack the HOA technicians and take the guidance lens (4) final Dean's Leap: drive off the ramp, land, reach Rootwell Field (5) fly out with Wally on the radio | checkpoints; steal-deliver; crack; probe; checkpoints; air-drop | see Extended quest parts. intro: m46-starfall-at-the-anthill-intro (night) Betony explains the lens and how the Even Line is computed from the stars; outro: m46-starfall-at-the-anthill-outro (dawn) the plane climbs while the Anthill dome stays open and empty behind | 0 betony: the lens is in the Anthill, cross the quad tonight; 1 pip: ants, I do not like ants; 2 betony: they want sugar, the refectory has it; 3 pip: technicians, six of them; 4 wally: ramp is yours, I will be on the apron | 1,600 acorns; part 2 of 4 (guidance) taken; Anthill Observatory open; Wally's charters open | W12 | `coast-bathtub-tours` | Previously: Betony's lens was taken for the Combine's line; Lovage let the HOA in. Mid-act set-piece. L58: none. L83: rootwell (2 of 2; next row is hedgeworth). fallback: Dean's Leap as a checkpoints dash down the ramp with a vehicle, the flight as a `visit` to the field. prefab needed: ant-door, sugar-crate, guidance-lens. mobile: air-drop and plane controls as in existing plane quests |

## Extended quest parts (verbatim)

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
| m46-starfall-at-the-anthill-p1 | 46 | Night Class | checkpoints (cross Rootwell's quad to the Anthill's base, past Dean Lovage's patrol lights) | m46-starfall-at-the-anthill-p1-intro (night) Betony hands the player a faculty gown and points at the Anthill across the dark quad | betony, lovage | prereq m45-rootwell-admissions; reward 250 acorns; the gown hides the hat so the patrol does not spot it |
| m46-starfall-at-the-anthill-p2 | 46 | The Sugar Toll | steal-deliver (take sugar from the refectory to the Anthill's door); visit (pay the ants) | m46-starfall-at-the-anthill-p2-intro (night) an ant on the Anthill step holds out a leg and a bowl; outro: m46-starfall-at-the-anthill-p2-outro (dawn) the ants part | betony, pip | prereq m46-starfall-at-the-anthill-p1; reward 250 acorns; the ants never speak, they point |
| m46-starfall-at-the-anthill-p3 | 46 | The Lens | crack (the HOA technicians in the observatory); probe (take the guidance lens, hold) | m46-starfall-at-the-anthill-p3-intro (dawn) the dome slides open and a lens the size of a teacup gleams; outro: m46-starfall-at-the-anthill-p3-outro (dawn) an HOA alarm starts | betony, pip | prereq m46-starfall-at-the-anthill-p2; reward 300 acorns; Pip fights beside the player |
| m46-starfall-at-the-anthill | 46 | Dean's Leap | checkpoints (drive up the ramp and land); air-drop (fly out from Rootwell Field) | intro: m46-starfall-at-the-anthill-intro (dawn) Betony's farewell on the observatory step; mid: m46-starfall-at-the-anthill-mid (dawn) the ramp ends in air; outro: m46-starfall-at-the-anthill-outro (dawn) Wally lifts the plane with Rootwell dropping away | betony, wally, pip | prereq m46-starfall-at-the-anthill-p3; final part records the save; reward 600 acorns plus the parts' 1,000 above; Wally on the radio; fallback for the leap: a checkpoints dash down the ramp with a damage limit |
| m46-starfall-at-the-anthill | Sugar Landlord | Pay the ants' sugar toll in full and finish Dean's Leap without a crash | back: prefab needed: faculty-gown |

## Act context (verbatim from the outline)

## Act 3: Cold Clay, Far Edges (rows 36-53)

The crew is on the run after the Salvage Raid: Side-Valve is seized, the Golden Acorn is gone, Pip's arm is cracked off
and Tansy has vanished. The question is whether a broken crew can find friends at the edges of the map before Vesper
finishes the Grand Combine. A radio fished out of Pail Pond (#38) shows the Combine is built in four parts: power
(Pinwheel Ridge), guidance (Rootwell), deck (Hedgeworth) and money (Trellisdown). The player wants the parts stopped and
learns that every edge has its own people: skiers, rally racers, a pirate, a professor, golfers, moles, a flock. Tension
runs 4 at the Fells, a warm 4 at the lodge and couch (#37-#39), climbs through the part hunts (5 at #41-#44, 6 at the
Anthill, 7 at Trellisdown) and peaks at 8 when the Combine cuts its test line and Vesper names the date of the Even
Cut (#52); #53 is the cold-air coda that points at act IV. Pip thaws toward the crew, Cam is off stage, Lulu and the
Carburettors get their own scenes, Peony and Basil go from Vesper's tenants to allies, and Vesper and the player share
one frame for the first time (#50). Regions: frostbite-fells, snowcap-rise, downtown, capwood, pinwheel-ridge, rutbottom,
saltbucket-shore, rootwell, hedgeworth, loamdeep, trellisdown, waders-rest. Sincere beats: #43 (Driftwood), #48
(Basil), #52 final. Laughs sit between them: #44, #45, #47, #51. The four parts, in the order the crew takes them: power
(#41), guidance (#46), money (#50), deck (#52, tested and not yet stoppable).

## Places: read these for coordinates, activities and hooks

- `docs/roadmaps/gta-batch-3/E13/contracts.md`, `src/campus/types.ts` (`CAMPUS`, `CAMPUS_BUILDINGS`, `ROOTWELL_ROOMS`, `ROOTWELL_INTERIORS`, `OBSERVATORY` incl. the Dean's Leap ramp, `ROOTWELL_FIELD`), `src/campus/interiors.ts`, `src/campus/observatoryInterior.ts`, `src/quests/rootwellQuests.ts` (givers `betony`, `lovage`), `src/quests/stages/rootwell.ts`

## Intro cards to place (first story appearances)

Wind-Sock Wally (`wally`) at his first on-screen moment (the final part's outro, the plane): grep `do: 'intro'` first. Betony and Lovage were carded in row 45 (another worker): do not card them again.

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

- **Extended row (mid-act set-piece).** QuestDefs in play order: `m46-starfall-at-the-anthill-p1`, `-p2`, `-p3`, then
  `m46-starfall-at-the-anthill` (final; records the save). Prereqs chain p1 <- `m45-rootwell-admissions`, p2 <- p1, p3 <-
  p2, final <- p3 (the stubs already show this). Rewards per the parts table (250, 250, 300, final 600). Each part has
  its own intro/outro as the parts table lists; the final has intro, mid and outro. Copy the structure of
  `src/quests/story/35-salvage-raid.ts` and `m35-salvage-raid.ts` (E20's extended row) exactly.
- p1 Night Class: `checkpoints` on foot across the quad to the Anthill's base, past Lovage's patrol lights (a gown hides
  the hat: say it). p2 The Sugar Toll: `steal-deliver` sugar (prop `sugar-cube-crate`/`sugar-sack`) from the refectory
  (find it in `CAMPUS_BUILDINGS`) to the Anthill's door (prop `ant-door`), then `visit` to pay; the ants never speak,
  they point. p3 The Lens: `crack` six HOA technicians in the observatory (`OBSERVATORY`, the telescope room interior
  if a visit `interior:` fits, else at the dome), then `inspect` verb 'Take' with `holdSeconds` ~3 on the guidance lens
  (prop `guidance-lens`); Pip fights beside the player (an actor in the scenes; comms from Pip). Final Dean's Leap:
  `checkpoints` up the spiral road and off the Dean's Leap ramp (`OBSERVATORY` ramp data; spawn a car), landing near
  Rootwell Field, then `air-drop` or the outline's fallback (a `visit` to the field) flying out with Wally on the radio
  (`ROOTWELL_FIELD`; read how `ch4-*` quests use `air-drop` in `src/quests/chapter4.ts`). If the plane step cannot be
  solved by the sim, use the fallback and say so.
- Time: p1/p2 night, p2 outro dawn, p3 dawn, final dawn (batch-3 notes section 7; the time-lapse transition exists).
- W12 (the dome is open) fires on the final. `achievement: 'gta-sugar-landlord'` on the final. Part 2 of 4 (guidance)
  taken: say it in the final outro and doneText. Betony's farewell on the observatory step is the warm beat.
- The lead assembles nothing for you: you own the whole row. Run the sim on all four ids and walk the def by reading it once end to end.
- Achievements, unlocks and W-ids are already wired to your ids by the setup; your quest only has to be finishable.
