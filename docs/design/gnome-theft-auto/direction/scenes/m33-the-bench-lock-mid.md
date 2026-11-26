# Director's notes: `m33-the-bench-lock-mid`

| | |
| --- | --- |
| Scene | `m33-the-bench-lock-mid` in `src/cutscene/scenes/story/m33-the-bench-lock.ts` |
| Played by | quest `m33-the-bench-lock` (plays when the lock test is done) |
| Kind and length | `arrival`, 21.4 s (aim 10-35) at Normal text speed |
| Where, when | stage `hogweed` (Hogweed's yard under the Unfinished Span); day, sky noon |
| Before / after | after: the drive to the Underspan with Cam. Before: the drive home |

## 1. Purpose in the story
Hogweed's delight ("two clicks and it is yours"), a callback to the Dewdrop prototype of row 10 (slower now; the tester can stop it but cannot choose when), and Cam, who looks at the lock while everyone else watches the ball.

## 2. The player's feeling
- **In:** just tested the lock with a tap.
- **Out:** amused, with no reason to look twice at Cam.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Hogweed | be told it clicked | none | breathless, three ideas at once | unbothered by the ball |
| Cam | learn the lock | no reason to be near it | stands by the crates, listens | never moves |
| Tester | stop the ball | the ball | shouts | rolls on |

## 4. Subtext
"Nobody else even hears them" is aimed at no one, and Cam hears.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | the click, and Hogweed's delight |
| 2 | 3-10 | Setup | "Twice." "Two clicks and it is yours." Cam looks at the lock |
| 3 | 12 | Turn | the Dewdrop rolls through, slower |
| 4 | 17-21 | Button | "He cannot choose when." Cam has not moved |

## 6. Shot list
`coverage('hogweed','player',1)`; an mcu of Cam; a tracking shot on the Dewdrop; an ms of the tester; an ms of Cam for the button.

## 7. Dialogue pass
Five lines, all under 16 words.

## 8. Music and sound
`turfton`, wind; latch, tap, whoosh.

## 9. Blocking and vehicles
Hogweed at his mark holding the new lock; the player on the road side; Cam by his crates; the Dewdrop's lane is z -30, as in row 10.

## 10. The button
Cam, still, looking at the lock.

## 11. Self-check
- [x] `cutscene-report` OK; scenes.test.ts passes.
