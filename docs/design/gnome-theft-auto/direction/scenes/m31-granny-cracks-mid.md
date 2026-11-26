# Director's notes: `m31-granny-cracks-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=m31-granny-cracks-mid`.

| | |
| --- | --- |
| Scene | `m31-granny-cracks-mid` in `src/cutscene/scenes/story/m31-granny-cracks.ts` |
| Played by | quest `m31-granny-cracks`, the `visit` at the Glaze Clinic doors after the ride (an arrival) |
| Kind and length | `arrival`, aim 10-35 s; now 30.6 s |
| Where, when | stage `glaze-clinic-bay` (the forecourt cot by the doors), dusk, `sky: 'golden'` |
| Before / after | before: the gentle drive, no bump or a bump; after: the outro on the same cot |

## 1. Purpose in the story

Midge, breathless and bubbly, glues Granny and goes quiet for the first time (her fear is quiet: characters.md) when
Granny, scared for the first time, says the bailiffs knew her name. It is the comedy that turns, and it is where Midge
gets her intro card. Granny asks the player to keep her fear secret.

## 2. The player's feeling

- **In:** relieved to have arrived; braced for the clinic's comedy.
- **Out:** quietly shaken: Granny is afraid, and Midge, who never stops, stopped.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Midge | to mend every crack before it sets | Granny's hands will not hold still; quiet | a hundred forty beats, glue, heat, peppermint | goes soft |
| Granny | to hide how frightened she is | her hands | "dear", "holding still" | tells the player, then asks for silence |
| The player | to be there | nothing to say | a nod | keeps the secret |

## 4. Subtext

Granny's "They said it so politely" is her fear: foreclosure with manners. Midge going quiet is the audience's cue that this is not a gag.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | The tap of a metronome; Midge: "A hundred forty! Two hairlines! Hold still!" Her intro card. |
| 2 | 5-12 | Setup | Granny: "I am holding still, dear. It is my hands that will not." |
| 3 | 12-18 | Comedy | "Glue first! Heat second! Peppermint third!" The insert on the hat. |
| 4 | 18-26 | Turn | "They knew my name. They said it so politely." Midge's reaction; the music out; "I do not do quiet." |
| 5 | 26-31 | Button | "Do not tell Bramble I was frightened." The player's nod; the held shot of her hands. |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | `spot(bay-wide)` | the forecourt | establishing |
| 2 | `TREAT` singles (Midge, Granny) | the cot | the glue exchange |
| 3 | `insert('granny')` | the hat brim | the repair |
| 4 | `COT` singles (Granny, player) | the cot | the sincere half |
| 5 | `insert('granny')` | her hands | the silence |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Midge | A hundred forty! Two hairlines! Hold still, hold still! | her tic, the hook |
| Granny | I am holding still, dear. It is my hands that will not. | the first sign |
| Midge | Glue first! Heat second! Peppermint third! | the gag before the turn |
| Granny | They knew my name. They said it so politely. | the turn |
| Midge | ...I do not do quiet. A hundred forty. Softly. | the bubbly girl goes soft |
| Granny | Do not tell Bramble I was frightened. | the button |

Names checked: `npm run lore -- find "Midge"` (140 BPM, the espresso-acorn helmet).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `warm` music, `street` ambience, a metronome `tap` | the clinic's pace |
| 14 | `pop`, `squeak` | glue and clay |
| 22 | music out | the quiet |

## 9. Blocking and vehicles

Granny on the second cot at (12.4, 31), half a metre up, facing west with her pie tin. Midge at (10.8, 29.6) with the glue pot, the player at (9.4, 32.6), both in front of Granny. No vehicles.

## 10. The button

The insert on Granny's hands round the tin, still at last, in a held silence. The scene does not tell the audience what to feel.

## 11. Self-check

- [x] Want, obstacle, turn, button; the intro card is on an MCU after her first line.
- [x] Hook on a sound and a line.
- [x] Every line under 12 words (longest 11).
- [x] Midge and Granny sound like their entries; "dear", not "sugar", in this scene.
- [x] The silence is held once.
- [x] `npm run cutscene-report` OK; `direction.notes` points here.
