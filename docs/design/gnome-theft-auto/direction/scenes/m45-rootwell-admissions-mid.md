# Director's notes: `m45-rootwell-admissions-mid`

| | |
| --- | --- |
| Scene | `m45-rootwell-admissions-mid` in `src/cutscene/scenes/story/m45-rootwell-admissions.ts` |
| Played by | quest `m45-rootwell-admissions` (visit on the quad's north-west lawn; plays on arrival) |
| Kind and length | `arrival`, 41.0 s (aim 10-35; over the aim, under the 45 s fault line: every second is a joke) |
| Where, when | stage `quad-lecture` (Rootwell's quad); noon, sky noon |
| Before / after | after: the enrolment. Next: the library |

## 1. Purpose in the story
Introduces Dean Lovage Inkwell: pompous, smooth, never answering, only mildly menacing. He lectures twelve empty chairs and a pigeon; the player, cap down, creeps along the audience and, when he turns, sits down and is a chair. Environmental story: the empty rows say how many students Rootwell still has.

## 2. The player's feeling
- **In:** tense stealth, a little silly.
- **Out:** relieved and amused; the Dean is less a threat than a weather system.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Lovage | deliver his lecture | the audience is a pigeon | pomp, committee-speak, answers himself | counts a loss |
| Player | cross the quad unseen | a Dean who hears well | whisper, then freeze | is a chair |

## 4. Subtext
He is afraid of being found to have been wrong (lore). The empty chairs are his fear, minuted.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | a gavel; the Dean in full voice; one pigeon in the front row |
| 2 | 4-14 | Setup | "Welcome to a historic term." intro card; "Attendance is up. I count twelve." the empty rows |
| 3 | 14-24 | Creep | the player along the end of the audience; "A question from the front row." the pigeon's silence |
| 4 | 24-33 | Turn | a boot on a twig; the Dean turns; "Be a chair."; "Nobody walks out of my lectures." |
| 5 | 33-41 | Button | the pigeon leaves; "Attendance is down one." |

## 6. Shot list
Wide from the south-east; low MCUs of the Dean on one side of the line; an MS on the creeping player; a close cutaway on the pigeon; the empty rows from behind. `coverage('lovage', 'player')` for the exchange after he turns.

## 7. Dialogue pass
Dean: seven lines. Player: two whispers. "We must be mindful of the optics, and of the quad" is his bible voice. All under 16 words.

## 8. Music and sound
`tension` (cut on the twig), then `warm` as the danger passes; `office` bed; gavel; wing flutter twice; a crunch; one `comic` stinger on the final wide.

## 9. Blocking and vehicles
Dean behind a lectern facing east to twelve chairs in three columns; the player from the south-west along z -231 to a seat at the end of the nearest column. The pigeon sits on a front-row chair and is despawned for its takeoff.

## 10. The button
Twelve chairs, one fewer pigeon, and a Dean who writes the number down.

## 11. Self-check
- [x] Intro card on an MS of Lovage (his first appearance). [x] One stinger. [x] `cutscene-report` OK; scenes.test.ts passes.
