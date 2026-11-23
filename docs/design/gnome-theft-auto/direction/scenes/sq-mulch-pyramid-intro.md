# Director's notes: `sq-mulch-pyramid-intro`

| | |
| --- | --- |
| Scene | `sq-mulch-pyramid-intro` in `src/cutscene/scenes/side/mulchPyramid.ts` |
| Played by | quest `sq-mulch-pyramid` ("The Mulch Pyramid Scheme") as its intro, given at the Bodega & Sons front |
| Kind and length | `intro`, aim 30-60 s; now 56.9 s at Normal text speed (was 58.8 s, 20 faults) |
| Where, when | stage `bodega-front` (Old Brick Quarter), bright noon held with `sky: 'noon'` |
| Before / after | before: the walk up the pavement to the survey table, Cedric's pitch under way. After: the player takes the spreader job (Patio Heights), then `sq-mulch-pyramid-wasps` at the patio gate |

## 1. Purpose in the story

A side quest in the sleazy register. It introduces Cedric "Double-Bag" Peat as a recruiter for the Chapel of Mulch and
gives the job: haul the glitter-purple spreader to Patio Heights and drop the first load at the top of the drive. It
plants the main story's Vesper tie (Patio Heights is Vesper Thorne's street) and the wasps that the next scene pays off.

The old scene was a monologue on wides: Cedric in a stage wide for a 30-word job line, a caption doing the scene-setting,
Burt and John out of frame for their own lines, and a 24 s hold on the bodega wide.

## 2. The player's feeling

- **In:** amused and a little suspicious (a salesman in a sunny street, bright ad copy, a neon window).
- **Out:** certain the job is a scam and taking it anyway: the spreader, Patio Heights, and the one name that matters
  (Vesper Thorne).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Cedric | to sell the player a place in the upline | nobody buys it: Burt has a citation book, John says no | a pitch that answers a different question first; never answers a direct one | from the pitch to the job: he gets the player to take the spreader |
| Burt | to be left alone with his coffee | Cedric's energy | dry, nervous, hands up on a warning | none: he stays a mark |
| John Bodega | to keep his step swept | Cedric on his pavement | one line of commentary; a broom | none |
| The player | to know what is in the bags | Cedric's patter | flat questions: "What is actually in the bags?", "Patio Heights?" | takes the job |

## 4. Subtext

- Cedric knows the bags are sawdust; he treats every answer as a sale, so the honest one comes out by accident.
- Burt has been sold to before ("Old habits."): the citation book is a trade, not a joke.
- The Patio Heights line is the main-story tie: the player hears Vesper's street named by the man selling the scheme.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Cedric on a medium, turning to Burt mid-pitch, "RESULTS NOT TYPICAL" pill; "Friend! You, with the coffee!" |
| 2 | 3-14 | Setup | Burt on his coffee ("I have a lawn."), John sweeping ("Don't sell him anything."), Burt's citation book |
| 3 | 14-22 | Pitch | "ACT NOW" pill; Cedric's "inverted compost funnel" and "Everybody is rooted." |
| 4 | 22-28 | Product | a locked medium of Cedric holding the sack, two seconds with no line |
| 5 | 28-40 | Turn | the player: "What is actually in the bags?"; Cedric's deflection, then "Dyed sawdust. Craft glitter."; "Sawdust?" from the player |
| 6 | 40-50 | The job | "NOW WITH 40% MORE WASPS" on the wasps line; "Here is the job."; the player: "Patio Heights? That is Vesper Thorne's street." |
| 7 | 50-57 | Button | Cedric's job details, then "LIMITED TIME. LIMITED SOIL." over his frozen point at camera |

The turn is at about 60% (the bags, then the job): the player finds out what the scheme is and takes the job anyway.

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('cedric','ms',{toward:'burt',side:35})` | 40 | locked | Cedric | the hook: he turns on the marks mid-pitch |
| 2 | `MARKS.single('burt','mcu')` | 40 | locked | Burt | the first mark, reacting |
| 3 | `shot('john','ms',{toward:'burt',side:20})` | 40 | locked | John | John's one line from the pavement |
| 4 | `MARKS.single('burt','mcu')` | 40 | locked | Burt | the citation book |
| 5 | `MARKS.single('cedric','ms')` | 40 | locked | Cedric | the pitch, two lines |
| 6 | `mcu` of Cedric, `toward: burt` | 40 | locked, 2 s | Cedric and the sack | the product, no line (the sack is the picture) |
| 7 | `SALE.single('you','mcu')` | 40 | locked | the player | the straight question |
| 8 | `SALE.single('cedric','ms')` | 40 | locked | Cedric | the non-answer |
| 9 | `shot('cedric','mcu',{toward:'you',side:25})` | 35 | locked | Cedric | the admission (MCU, not CU: a CU crops the hat off the top on a phone) |
| 10 | `SALE.single('cedric','ms')` | 40 | locked | Cedric | "Wasps love it." under the wasps pill |
| 11 | `SALE.single('you','mcu')` | 40 | locked | the player | a reaction, one word |
| 12 | `mcu`, `toward: you` | 35 | locked | Cedric | the job |
| 13 | `SALE.single('you','mcu')` | 40 | locked | the player | the lore question |
| 14 | `SALE.single('cedric','ms')` then `mcu` | 40 | locked | Cedric | the drive instructions, split over two shots |
| 15 | `mcu`, `toward: you`, `point` gesture | 40 | locked | Cedric, pointing at camera | the button: the salesman's frozen point |

Side of the line: `coverage('cedric','you',1)` for the player conversation (`SALE`); `coverage('cedric','burt',1)` for the
marks (`MARKS`). No crossing.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Cedric | Friend! You, with the coffee! Do you have a lawn? | the hook: a question to a mark |
| Burt | I have a lawn. | the first mark |
| John | Don't sell him anything. | John's one line of commentary (bible: he reports, does not stage-direct) |
| Burt | I also have a citation book. Old habits. Pitch carefully. | the citation joke, kept |
| Cedric | It is not a pyramid, friend. It is an inverted compost funnel. | the pitch |
| Cedric | Everybody is rooted. Nobody is underground. | the pitch, sharpened |
| You | What is actually in the bags? | the straight question |
| Cedric | Every bag is hand-filled, friend. With love. | answers a different question first (his rule) |
| Cedric | Dyed sawdust. Craft glitter. The glitter is the expensive part. | the admission |
| You | Sawdust? | the player's one-word reaction, which also breaks Cedric's run of lines |
| Cedric | Wasps love it. Wasps are our most loyal customers. | under the NOW WITH 40% MORE WASPS pill |
| Cedric | Here is the job. Take the spreader to Patio Heights. | the job, split |
| You | Patio Heights? That is Vesper Thorne's street. | the main-story tie (lore: `vesper`, `patio heights`) |
| Cedric | Drop the first load at the top of the drive. Then bring it home. | the job, split |
| Cedric | Every lawn up there needs fluffing. Nobody checks the bag. | the button's setup |
| ~~Caption~~ | ~~Bodega & Sons, Old Brick Quarter.~~ | cut: the picture and the neon do it |
| ~~Cedric~~ | ~~Here is the job... Then bring it home before the HOA seizes it.~~ | cut: the HOA line is the old 30-word line; split and shortened |

Names checked: `npm run lore -- find cedric`, `find "chapel of mulch"`, `find father-loam` (cedric-peat, chapel of mulch,
father-loam entries; the Patio Heights tie is the existing Vesper plant).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `warm` music, `street` ambience | the sunny pitch |
| 0.0 | title pill "RESULTS NOT TYPICAL" | the ad copy opens the scene (titles do not count as narration) |
| 22-28 | none beyond the music | the product hold: the infomercial's only silence |
| 49-57 | ad-copy pill over the button | the button |

No stingers, no music changes: the scene is one joke, sold straight.

## 9. Blocking and vehicles

- Cedric starts at his pitch mark (-70, 84) facing Burt, walks the pitch loop (96 to 84) for the hook, then holds at the
  kerb beside the spreader.
- Burt at his mark (-77, 95), coffee in hand, facing Cedric. John at the bodega door (-80, 84), broom, facing Burt.
- The player at the PLAYER mark (-70, 90), facing Cedric; the scene ends with the player where they stand, which is where
  the quest's exit leaves them.
- Vehicle: Cedric's glitter-purple spreader, parked at the kerb (`castRide('cedric', 'spreader')`).

## 10. The button

Cedric, medium, the sales smile frozen, pointing at us over LIMITED TIME. LIMITED SOIL. It is right because the scene's
joke is a sale that never closes: the last picture is the salesman still selling.

## 11. Self-check

- [x] Want, obstacle, turn (the bags, then the job); not a briefing.
- [x] Hook in 1 s (Cedric turns on Burt, the ad copy is up); no opening narration.
- [x] Every line under 16 words (longest 14); no coordinates or waypoint read-outs.
- [x] Cedric answers a different question first; the player's lines are short questions.
- [x] Every speaker medium or closer, facing the camera (exchangeLooks before the player talk; `face` after the walk).
- [x] One side of the line per conversation (`MARKS` and `SALE` coverage objects).
- [x] Music has a reason (warm throughout, no stingers); no held silence needed.
- [x] Running-joke ladder kept: the citation book, the sawdust, the wasps, Vesper's street.
- [x] Scene lit: noon, no night.
- [x] `npm run cutscene-report -w games/gnome-theft-auto` shows the scene OK (0 faults; was 20); off `pacing.baseline.ts`
      is the planner's job, so the id stays in the baseline file for now.
- [x] `npx vitest run src/cutscene/scenes/scenes.test.ts -t "sq-mulch-pyramid"` passes (line of sight).
- [x] Watched at 960x600 and 390x844; fixes made (CU to MCU on the phone; the push-in dropped for a locked medium: the
      dolly kept landing behind the speaker or on a mushroom prop).
- [x] `direction.notes` points here.
