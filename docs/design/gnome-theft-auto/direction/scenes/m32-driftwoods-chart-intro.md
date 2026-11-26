# Director's notes: `m32-driftwoods-chart-intro`

| | |
| --- | --- |
| Scene | `m32-driftwoods-chart-intro` in `src/cutscene/scenes/story/m32-driftwoods-chart.ts` |
| Played by | quest `m32-driftwoods-chart` (intro, from the giver `driftwood-chart`) |
| Kind and length | `intro`, 38.8 s (aim 30-60) at Normal text speed |
| Where, when | stage `driftwood-chart-trailer` (Driftwood's trailer in the southern stubble); day, sky noon |
| Before / after | after: Granny's cracked scene (row 31, sincere). Before: the tow on the canal |

## 1. Purpose in the story
A laugh and a wonder at once. Driftwood has been right about the sea all along and wrong about where it ends: the canal does not stop at the Puddle Sea. The scene gives the job (tow the raft, steady) and plants the Saltwater without saying what lies beyond it.

## 2. The player's feeling
- **In:** still carrying Granny's scene; tension steps down to 5.
- **Out:** amused, curious, and clear on the job: a tow, steady, with a damage limit.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Driftwood | get the raft towed to the real water | nobody has believed him; he drew the chart wrong | one great line at a time | from vindicated and damp to a client with a plan |
| Player | find out what is on the ground | a boot on the sea | short flat questions | takes the job |

## 4. Subtext
He was laughed at for six months and is quietly proud the frogs agree with him. "Say that near the water" is a request to be believed.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | paper snapping at its pins; the player walks straight across a chart |
| 2 | 3-9 | Setup | "You are standing on the Saltwater." |
| 3 | 9-12 | Insert | the chart from above |
| 4 | 23 | Turn | "It does not end. Past the dunes, there is salt." |
| 5 | 28-35 | Job | the tow, in his voice |
| 6 | 35-39 | Button | "Say that near the water." The paper lifts at one corner |

## 6. Shot list
Wide of the trailer; `coverage('driftwood','player',1)` singles; an overhead insert of the chart; a push-in on the turn; a low single on the frogs line; an ms for the button. One side of the line throughout.

## 7. Dialogue pass
All lines under 16 words. "And you know that how?" avoids the diner outro's "How do you know?".

## 8. Music and sound
`warm`, wind; paper and flutter at the chart's pins. No stinger: this is the first beat of the wonder.

## 9. Blocking and vehicles
Driftwood stands at the chart's lower edge facing it; the player walks in from the combine, stops on the far corner, then steps back. The chart (`rolled-chart` fitted to 2.4 m), a tin pail and a brass bell are a cutscene-only arrangement.

## 10. The button
"Say that near the water." and the chart lifting in the wind: he gets the last word and the player glances at the water.

## 11. Self-check
- [x] Want, obstacle, turn; hook in 3 s; no narration.
- [x] Lines under 16 words; one side of the line per conversation.
- [x] `npm run cutscene-report`: OK; scenes.test.ts (line of sight) passes.
