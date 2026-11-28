# Director's notes: `m45-rootwell-admissions-enrol`

| | |
| --- | --- |
| Scene | `m45-rootwell-admissions-enrol` in `src/cutscene/scenes/story/m45-rootwell-admissions.ts` |
| Played by | quest `m45-rootwell-admissions` (visit at Wicket Lodge, the gate lodge; plays on arrival) |
| Kind and length | `arrival`, 28.7 s (aim 10-35) |
| Where, when | stage `rootwell-registrar` (Rootwell's main gate, the lodge forecourt); noon, sky noon |
| Before / after | after: the drive east. Next: the Dean's lecture on the quad |

## 1. Purpose in the story
The funny beat of the row and the first look at Rootwell's tone: institutional, small-time and a little sad. Lays down the ants as the university's landlords (the sugar fee) and "the grass is research", both picked up by the Dean and the Anthill rows.

## 2. The player's feeling
- **In:** arrived at a university gate.
- **Out:** welcomed in the least welcoming way; a mortarboard in hand and a bursary on file.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Registrar | clear the queue | there is no queue | stamps, deadpan, rules | hands over a mortarboard |
| Player | enrol | no sugar cube | short, flat | enrolled |

## 4. Subtext
He has a desk, a stamp and no one to use them on. "Next." is addressed to the empty drive.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | a stamp comes down on a form; the bell |
| 2 | 3-8 | Setup | "Name, age, reason." "Mature student." |
| 3 | 8-18 | Turn | he looks up: the hat; the fee in sugar; no cube |
| 4 | 18-24 | Pay-off | a bursary ("everyone is"); the mortarboard across the desk |
| 5 | 24-29 | Button | "Next." to nobody |

## 6. Shot list
Low on the desk (hook); low MCUs of the registrar and eye MCUs of the player on one side of the line throughout (`coverage('registrar', 'player')`); an MS on the player taking the mortarboard.

## 7. Dialogue pass
Eight lines, all under 16 words. "The grass is research" is the line the quad repeats.

## 8. Music and sound
`turfton`; `office` bed; stamp thuds; the desk bell; paper.

## 9. Blocking and vehicles
Registrar behind the desk in front of the lodge; the player steps up from the drive. A mortarboard appears on the desk (cutscene-only) and moves to the player's hand.

## 10. The button
The bell, and "Next." said to an empty drive.

## 11. Self-check
- [x] One side of the line throughout. [x] No stinger needed. [x] `cutscene-report` OK; scenes.test.ts passes.
