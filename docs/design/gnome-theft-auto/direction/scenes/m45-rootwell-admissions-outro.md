# Director's notes: `m45-rootwell-admissions-outro`

| | |
| --- | --- |
| Scene | `m45-rootwell-admissions-outro` in `src/cutscene/scenes/story/m45-rootwell-admissions.ts` |
| Played by | quest `m45-rootwell-admissions` (outro, on the Long Shelf's steps, after the interior visit inside the library) |
| Kind and length | `outro`, 37.6 s (aim 15-45) |
| Where, when | stage `long-shelf-steps` (Rootwell's library door, facing the quad); dusk, sky golden |
| Before / after | after: finding Betony among the Astronomy shelves. Next: row 46, the Anthill |

## 1. Purpose in the story
Betony in person (her intro card): precise, distracted, an ally in a quiet hurry. She shows the player the Anthill dome across the campus in the last sun: the lens is there. Ends on a doorframe, so the act's laugh before its turn lands softly.
(The outline has her pointing through a library window. A world scene played while the player stands inside an interior would drop them on the pavement, so the quest sends them out onto the steps first.)

## 2. The player's feeling
- **In:** found her; relieved.
- **Out:** has a target, a place on the map and a liking for this strange professor.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Betony | send the player to the lens | the Dean, the HOA and the ants | statistics, pointing, understatement | trusts the player |
| Player | find out where the lens is | none | short questions | knows |

## 4. Subtext
She drew the level line because it was true and did not ask who would want it. Not said here; planted in how she looks at the dome.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | the door, the beam, the dust; Betony squints at the sky |
| 2 | 4-12 | Setup | "A mature student, and punctual." intro card; "Your pigeon stared at me." |
| 3 | 12-24 | Turn | she turns to the sky and points; the dome in the last sun; "bearing one-two-six, and a great many ants" |
| 4 | 24-31 | Question | "Is it guarded?" "By the HOA and, worse, the ants. They invoice." |
| 5 | 31-38 | Button | she backs into the doorframe: "Sorry. Not you. The doorframe." |

## 6. Shot list
A wide from the quad; `coverage('betony','player')` MCUs; a push-in; the view across the campus to the dome (no line); a last MCU of Betony.

## 7. Dialogue pass
Betony five, player two; all under 16 words. "As I was saying" is saved for the letter.

## 8. Music and sound
`turfton-dusk`, `mystery` under the pointing; `office` bed; a door creak; the university's evening bell; a thud; one `comic` stinger.

## 9. Blocking and vehicles
Betony on the top step with the door open; the player walks up to the step below. She turns to the south-east to point, then backs west into the frame.

## 10. The button
A thud, and a professor apologising to a doorframe.

## 11. Self-check
- [x] Intro card on an MCU of Betony. [x] One stinger. [x] `cutscene-report` OK; scenes.test.ts passes.
