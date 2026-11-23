# Director's notes: `sq-tessie-shore`

| | |
| --- | --- |
| Scene | `sq-tessie-shore` in `src/cutscene/scenes/side/tessie.ts` |
| Played by | quest `sq-tessie` as the beat before objective 5 (the choice), after the ride back to the dock |
| Kind and length | `arrival`, aim 10-35 s; now about 27 s (was 21.7 s, 10 faults) |
| Where, when | `loch-dock`, golden; the player still on Tessie's back off the dock |
| Before / after | before: riding Tessie from the island. After: walk to the gold ring (sell the photo) or the cyan ring (keep her secret) |

## 1. Purpose in the story

Sets the quest's choice as a moral one, with the cost on screen: money and a front page, or her and the loch.

## 2. The player's feeling

- **In:** triumphant (they rode a monster). **Out:** torn, looking at her.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Driftwood | for the player to keep her secret | the money | states both rings plainly; never asks | leaves it to the player |
| The Tattler | the photo | Driftwood | a price, three words at a time | waits on his ring |
| The player | to decide | both of them | silence | the choice is theirs |

## 4. Subtext

Driftwood will not beg. "And nobody reads the Tattler" is his only argument, and it is a joke because he is scared.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Low on the water: she glides in to the dock with the player aboard. Held. |
| 2 | 5-11 | Setup | Driftwood lowers his binoculars: "You rode her. All the way in." "Nobody is ever going to believe you." |
| 3 | 11-15 | Turn | A shutter clicks: the Tattler, with an offer. |
| 4 | 15-23 | The choice | Driftwood: gold ring pays; cyan ring keeps her. |
| 5 | 23-27 | Button | The player's face; then Tessie, low and still on the water, waiting. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` at the surface | 44 | follows | Tessie | awe: low, slow, held |
| 2-3 | `shot('driftwood','mcu'/'cu',{toward:'you'})` | 35/30 | locked | Driftwood | |
| 4 | `shot('tattler','mcu',{toward:'you',side:-25})` | 35 | locked | the Tattler | the interruption |
| 5-6 | Driftwood MCU, CU | | locked | | the two rings, the second closer |
| 7 | `cut` from the water | 34 | locked | the player on her back | the decision |
| 8 | `cut` low on the water | 40 | locked | Tessie | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Driftwood | You rode her. All the way in. | split |
| Driftwood | Nobody is ever going to believe you. | |
| Tattler | Fifteen hundred acorns. One photo. Front page. | trimmed |
| Driftwood | Gold ring pays. And nobody reads the Tattler. | |
| Driftwood | Cyan ring keeps her. Just her, and the loch. | |
| ~~caption~~ | ~~Back at the dock, where it started...~~ | cut |
| ~~You~~ | ~~Which one?~~ | cut: the player's face and the choice prompt ask it |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `mystery` (her theme), `water`, a soft splash | |
| 11 | `cash` as a shutter click | the interruption is a sound first |
| 25 | a small splash | she is still there |

## 9. Blocking and vehicles

Tessie (the player's ride, `from: 'player'`) glides from (-710, -608) to the ride's end at (-713, -590). Driftwood on his
mark, turns to the player. The Tattler on the gold ring's mark (-702, -544), turns to the player. The player stays
seated.

## 10. The button

Tessie low on the water, waiting: the choice made visible.

## 11. Self-check

- [x] Want, obstacle, turn (the Tattler). [x] Hook (her, moving). [x] Lines under 16. [x] Speakers MCU/CU, facing.
- [x] No crossing (Driftwood and the Tattler are 23 m apart). [x] One music cue. [x] Golden. [x] Report OK, LOS, watched.
