# Director's notes: `quarter-inch-gate`

| | |
| --- | --- |
| Scene | `quarter-inch-gate` in `src/cutscene/scenes/story/m12-*.ts` (m12-quarter-inch-at-home.ts) |
| Played by | quest `m12-quarter-inch-at-home` (arrival at the Patio Gate) |
| Kind and length | `arrival`, 25.5 s (aim 10-35) at Normal text speed |
| Where, when | stage `patio-gate`; day, sky noon |
| Before / after | after: Juniper's terrace. Before: townhouse 404 |

## 1. Purpose in the story
Gary reads the signature and not the pass, cites a section of a book he has read four pages of, and waves the player in. Gary's character intro card (first story appearance) lands after his second line.

## 2. The player's feeling
In: nervous about the forgery. Out: relieved, and fond of Gary.

## 3. Beats
Binder thud; "Sigh. Pass."; hand over; "Very neat." (intro card); "Is it good?" / "Section nine. Hats must be level." (tipHat reaction); "Wave through. Do not smoke."; "I do not smoke." / "Sigh. Not yet."

## 4. Shots
GATEKEEP coverage, mcu singles, one ms, a wide button with the player walking in and Gary back to his stool.

## 5. Music and sound
turfton, garden ambience; thud, paper, latch.

## 6. The button
Wide on the gate: the player walks in, Gary returns to his stool.

## 7. Self-check
- [x] Hook within 3 s on a sound or a character; no narration.
- [x] Every line under 16 words; no coordinates; one side of the line per conversation (`coverage`).
- [x] Voices follow bible section 2; the player's lines are short questions.
- [x] `npm run cutscene-report`: no fault; the line-of-sight check passes (scenes.test.ts).
