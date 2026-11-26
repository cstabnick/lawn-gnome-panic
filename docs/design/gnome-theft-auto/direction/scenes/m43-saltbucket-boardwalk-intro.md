# Director's notes: `m43-saltbucket-boardwalk-intro`

| | |
| --- | --- |
| Scene | `m43-saltbucket-boardwalk-intro` in `src/cutscene/scenes/story/m43-saltbucket-boardwalk.ts` |
| Played by | quest `m43-saltbucket-boardwalk` (intro, at the giver `driftwood-call`, the Rutbottom Dirt Bowl gate) |
| Kind and length | `intro`, about 42 s (aim 30-60) at Normal text speed |
| Where, when | stages `m43-bowl-gate` and `m43-shore-dawn` (cut between them); dawn, sky golden |
| Before / after | after: row 42 ends at the gate. Before: the drive south to the boardwalk |

## 1. Purpose in the story
Pays off row 32: Driftwood saw the glow and could not cross, and now he has. It is the first time the player hears him say it out loud, and the first time he sounds afraid of his own good news. It sends the player south, to a far place, without a waypoint read-out.

## 2. The player's feeling
- **In:** the Impound is behind them, the road is long, a phone rings.
- **Out:** warmth, a little worry for a friend, and a reason to drive to the sea.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Driftwood | tell someone, in his own voice | he is overwhelmed, and a little afraid it is not true | rambling, sea-words, a joke to cover the crack | turns to face the sea at last |
| Player | find out where he is | a bad line and a lot of surf | short flat questions | goes |

## 4. Subtext
Six months of being laughed at. He turned his back on the sea to say it, and asks that nobody tells the sea. He is checking that the player can hear it too.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | the empty gate, a phone ringing twice, the player lifting a tin can |
| 2 | 3-8 | Setup | cut to the beach: Driftwood small on the sand, the Saltwater behind him, gulls |
| 3 | 8-20 | Turn | "I am standing in it", then the voice goes; two lines, split by the player's nod |
| 4 | 20-32 | The job | where he is, "the roof is mostly a roof", "I am on my way" |
| 5 | 32-42 | Button | he turns to face the sea at last; a bell from the water, then the empty road south |

## 6. Shot list
Wide on the gate (spot `wide`); mcu of the player; wide on the beach (spot `wide`); frontal mcu of Driftwood, then a push to a cu on the crack; reaction nods; wide on the beach for the turn and the bell; the road south (spot `road-south`) held while the bell comes through the can. Two places, no 180-degree line between them; Driftwood faces north (the camera, the land) with the sea behind him.

## 7. Dialogue pass
Nine lines, each under 16 words. The directions are said once, in his voice ("south, through the dunes"), and the HUD carries the waypoint.

## 8. Music and sound
`warm`; wind at the gate, the `shore` bed under the beach; two phone rings; gulls; the bell, once on the beach and once, quietly, through the can. No stinger.

## 9. Blocking and vehicles
Player at the gate (mark `player`, facing the road south), tin-can phone in hand. Driftwood on the sand (mark `driftwood`), his back to the water, tin-can phone in hand. No vehicles.

## 10. The button
The bell comes up off the water, and then the road south with the sea still faintly in it.

## 11. Self-check
- [x] Hook by 3 s; a want, an obstacle and a turn. [x] Lines under 16 words; the sincere beat is the crack, not a gag. [x] One tool-free reveal: nothing is said about what is across.
- [x] `cutscene-report` OK; `scenes.test.ts` line of sight passes. [ ] Watched in a browser: not done (no browser here).
