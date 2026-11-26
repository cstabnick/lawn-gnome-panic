Epic: E20-3 act II quests (wave B)
Depends on: E20-1 (the passenger/inspect kinds, cast presets, props and achievements exist)

**First read `docs/roadmaps/gta-batch-3/E20/issues/_quest-common.md` in full: it is the contract (files you own, the StoryFile shape, the objective kinds, the writing and scene rules, the checks, the report).**

## Goal
Rows 35 of the story outline are playable, directed quests in the one-file-per-row layout.

## Your files
- src/quests/story/35-salvage-raid.ts, src/cutscene/scenes/story/m35-salvage-raid.ts, src/quests/stages/story/s35-salvage-raid.ts
- src/quests/chapter3.ts (remove the `ch3-salvage-raid` def only; it moves to your story file)
- direction notes for your new scenes

## The outline rows (verbatim; column header first)

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
| 35 | ch3-salvage-raid | p1 Tuesday, p2 Hold the Bay, final The Salvage Raid | II -> III |

Extended parts:

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
|---|---|---|---|---|---|---|
| ch3-salvage-raid-p1 | 35 | Tuesday | probe (inspect Cam's empty cot and the leaning broom); visit (the Patio Gate); probe (photograph the massing HOA vans); checkpoints (race back to Side-Valve against a timer) | intro: ch3-salvage-raid-p1-intro (dawn) Tansy glances at the clock, the cot is empty; mid: ch3-salvage-raid-p1-mid (day) the vans at the Patio Gate | tansy, pip, turncoat-cam (absent), vesper (not seen) | giver Tansy at Side-Valve Salvage; prereq m34-forty-seven-wrenches; 300 acorns; comms: 0 tansy: Cam is not in, find his route; 1 tansy: vans massing, tell me what you see; 2 pip: hurry back; Cam is not seen, only his broom left against the wall; the hat ladder's rung four is held for the final intro; mobile: photograph is a tap; vehicle: Ride-On; L83: downtown |
| ch3-salvage-raid-p2 | 35 | Hold the Bay | survive-derby (hold Side-Valve Alley against HOA mowers for 75 seconds while Pip and Tansy load the crate) | intro: ch3-salvage-raid-p2-intro (day) the crate on the loading ramp, raiders on the street; mid: ch3-salvage-raid-p2-mid (dusk) the bench lock clicks open with the right code, the acorn cell is gone, Tansy counts who knew the code | tansy, pip, turncoat-cam (code only, not seen), vesper (not seen) | prereq ch3-salvage-raid-p1; 450 acorns; comms: 0 tansy: hold the alley, we load; 1 pip: crate is half in; 2 tansy: the lock is open and only two of us had the code; the arm does not crack here (it cracks in the existing final intro); the final starts straight from the mid scene; tension 8; mobile: existing derby controls |
| ch3-salvage-raid | 35 | The Salvage Raid | crack (Cam and three HOA raiders); visit (northwest Ring Road); steal-deliver (Pip's Zero-Turn to the Frozen Birdbath Basin) | intro: salvage-raid-intro (dusk) existing; outro: salvage-raid-outro (night) existing | tansy, pip, turncoat-cam, vesper, loam (call) | prereq ch3-salvage-raid-p2; keeps its id so old saves stay finished; existing objectives and comms unchanged; reward 800 (was 600); sets W08 Side-Valve seized |

Achievement candidates (already built under the ids below):

| ch3-salvage-raid-p2 | 35 | Hold the Bay | survive-derby (hold Side-Valve Alley against HOA mowers for 75 seconds while Pip and Tansy load the crate) | intro: ch3-salvage-raid-p2-intro (day) the crate on the loading ramp, raiders on the street; mid: ch3-salvage-raid-p2-mid (dusk) the bench lock clicks open with the right code, the acorn cell is gone, Tansy counts who knew the code | tansy, pip, turncoat-cam (code only, not seen), vesper (not seen) | prereq ch3-salvage-raid-p1; 450 acorns; comms: 0 tansy: hold the alley, we load; 1 pip: crate is half in; 2 tansy: the lock is open and only two of us had the code; the arm does not crack here (it cracks in the existing final intro); the final starts straight from the mid scene; tension 8; mobile: existing derby controls |
| ch3-salvage-raid-p2 | Hold the Bay | survive the Side-Valve hold with the bay door unscathed | neck: prefab needed: shop-rag scarf |

## Act context

## Act 2: Turf & Dew (rows 16-35)

Premise: the Kiln-Debt is cleared at the start of the act and the loan on flat 3B is the only debt left, so the player is no longer working for money but for the crew. Vesper offers a penthouse, is refused, and does not shout; he keeps the offer open while the HOA tightens every lane. The question is whether the player takes his deal, and the act answers it row by row: no, and here is what that costs and who else is paying for his war.
Stakes: Granny's farm, the Unmowed in Mossy Wood, Tansy's bay, and (planted this act) the edges of the map, where Vesper's money and parts are going. The player wants to keep the crew safe and learns that the war is wider than Turfton: old money at Trellisdown, Compost Heap plates leaving for the edges, a mole town that gnomes misread, a cult that has dated the Even Cut.
Curve (tension 0-10): 4 at the dew run, 5 and 3 on the farm, 7 at the diner (the refusal), 5 in the penthouse, 8 at the tablet (sincere, no gag), then a long run of mixed beats at 4 to 6: Loamdeep and the Flock (laughs), the Knot-Hole (sincere), the sibling escort (laughs), Cam's big night (a hint), Granny cracked (sincere, 7), then the party at 6 rising to 8 on Cam's call, and the Salvage Raid at 9. No two sincere scenes run back to back without a laugh between them.
Who changes: Pip goes quiet at the tablet and opens the vial at the Knot-Hole without pouring it; Granny is scared for the first time; Juniper laughs for the first time; Reginald corrects a spelling instead of confirming it (doubt planted); Tansy's crew holds a party, then loses everything; Cam moves from envy (the Speedway) to the sale (the code at the bench lock); Vesper moves from the offer to taking the acorn in person.
Regions: cloverfield, trellisdown, south-highway, patio-heights, mossy-wood, loamdeep, waders-rest, turfton-fringe, downtown, hedgeworth, speedway, canal, underspan. First reaches of Trellisdown (17), Loamdeep (24), Wader's Rest (25), Hedgeworth (29), the dune line toward Saltbucket Shore (32) and a plant for Snowcap Rise (27).
Running threads kept: Vesper's hat ladder (rung two at the diner is no hat line at all; none in the penthouse either; rung four is "Nice hat. Shame." in the raid), Cam's broom (background in every Side-Valve scene, still in his hand in the raid), Asphalt's bottlecap (sirens ignored in the raid), Granny's pie (sprinkler outro, the party), the forty-seven wrenches (counted aloud, the cigar box in shot, never opened).

## Decisions and notes for these rows (the lead's; they override the outline where they differ)

This is the extended pivotal quest that ends act II: the betrayal. Take the time to make it excellent.
- Three QuestDefs in play order: `ch3-salvage-raid-p1` (Tuesday), `ch3-salvage-raid-p2` (Hold the Bay), `ch3-salvage-raid` (the final: keeps its id). p1.prereq `m34-forty-seven-wrenches`, p2.prereq p1, final.prereq p2. Chapter: the final keeps its current `chapter` value; give the parts the same. Rewards 300 / 450 / final raised from 600 to 800.
- Final: move the def from `src/quests/chapter3.ts` (remove it there) with its objectives, comms, intro `salvage-raid-intro` and outro `salvage-raid-outro` unchanged (those scenes live in `ch3.ts`/`ch3b.ts`: do not edit them; they hold Cam's betrayal, Vesper's "Nice hat. Shame.", the broom, Pip's arm, Loam on the phone). W08 (Side-Valve seized) turns on by itself.
- p1: giver `side-valve`. `ch3-salvage-raid-p1-intro` (dawn: Tansy glances at the clock, Cam's cot is empty), `inspect` verb 'Look' at Cam's empty cot and the leaning `broom` (Side-Valve storeroom), `visit` the Patio Gate, `inspect` verb 'Photograph' the massing HOA vans (scene-only vans parked at the gate: a cutscene-only fleet, L95) with `scene: 'ch3-salvage-raid-p1-mid'` (day), `checkpoints` race back to Side-Valve against a timer (`seconds`). Cam is never seen, only his broom; Vesper not seen.
- p2: `ch3-salvage-raid-p2-intro` (day: the crate on the loading ramp, raiders on the street), `survive-derby` in Side-Valve Alley for 75 s while Pip and Tansy load the crate, then the mid scene `ch3-salvage-raid-p2-mid` (dusk) as the p2 outro: the `bench-lock` clicks open with the right code, the acorn cell is gone, Tansy counts who knew the code (only two). The arm does not crack here. `achievement: 'gta-hold-the-bay'` on p2. The final starts straight after (its intro is the betrayal).
- Comms per the part rows. Plans for all three. Tension 8-9: no gags in p2's mid.
