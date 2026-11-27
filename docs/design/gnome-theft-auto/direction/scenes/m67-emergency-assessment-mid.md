# Director's notes: `m67-emergency-assessment-mid`

| | |
| --- | --- |
| Scene | `m67-emergency-assessment-mid` in `src/cutscene/scenes/story/m67-emergency-assessment.ts` |
| Played by | quest `m67-emergency-assessment`, as the `scene` of the first visit (the side-door yard), on arrival |
| Kind and length | `arrival`, aim 10-35 s; about 20 s |
| Where, when | stage `m67-side-door-yard` (the lane on City Hall's west wall), day (`sky: 'noon'`) |
| Before / after | before: the drive from Founders' Green; after: the crack in the yard |

## 1. Purpose in the story

**Reginald opens the door.** The HOA's most precise employee unbolts a service door for the people who are about to
break his employer's seizure, and does not report it. His doubt from row 12 (his photograph of himself and Juniper as
kids) pays here, in his own language: a quarter-inch, a measurement, a non-report. No gag; he is not funny here.

## 2. The player's feeling

- **In:** a mission and a locked door.
- **Out:** surprised, then moved: of everyone, Reginald chose a side.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Reginald | to let them in without having done anything | his oath and his own pride | code, numbers, denial | steps back in, door open |
| The player | to get in | the door | thanks | thanks refused |

## 4. Subtext

- "I did not report it" is the biggest thing he has ever not done.
- "I did nothing. I measured." is a man hiding a decision inside a procedure.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A shut steel door in a plain wall; a bolt drawn on the far side. |
| 2 | 3-7 | The door | It opens inward: Reginald in the doorway, caliper in his hand. |
| 3 | 7-13 | The line | "This service door is a quarter-inch under code." "I did not report it." |
| 4 | 13-17 | The thanks | "Thank you." "Do not. I did nothing. I measured." |
| 5 | 17-20 | Button | "Three enforcers in the yard. I will not be here." He steps back; a latch. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `yard-wide` | 50 | locked | the yard and the door in the wall | hook |
| 2 | stage camera `door-low` | 40 | locked, low | the door opening | reveal |
| 3 | `DOOR.single('reginald','mcu',{height:'low'})` | 35 | locked | Reginald | the line |
| 4 | `insert('reginald')` | 30 | locked, high | the caliper | the object |
| 5 | `DOOR.single('reginald','mcu')` | 35 | locked | Reginald | "I did not report it" |
| 6 | the player, then Reginald | 35 | locked | thanks; refusal | the exchange |
| 7 | the player nods; Reginald low | 35 | locked | the job; the exit | button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Reginald | This service door is a quarter-inch under code. | municipal, exact |
| Reginald | I did not report it. | |
| Player | Thank you. | |
| Reginald | Do not. I did nothing. I measured. | |
| Reginald | Three enforcers in the yard. I will not be here. | the outline's comms line |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `tension` music, `street` bed (radio 0.1) | the emergency, far off |
| 1 | `latch` | the bolt |
| 3 | `door-creak` | the door |
| 9 | `clink` | the caliper |
| 18 | `latch` | he is inside again |

## 9. Blocking and vehicles

A closed `panelled-door` prop in the wall is swapped for an open leaf and Reginald appears in the doorway; the player
stands about 9 m back in the yard.

## 10. The button

A latch, and a yard with an open door and nobody in it.

## 11. Self-check

- [x] Want (to open the door unseen), obstacle (his office), turn ("I did not report it").
- [x] Hook in 3 s.
- [x] Every line 12 words or fewer.
- [x] No gag.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
