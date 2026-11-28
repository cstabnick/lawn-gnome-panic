# Director's notes: `m43-saltbucket-boardwalk-mid`

| | |
| --- | --- |
| Scene | `m43-saltbucket-boardwalk-mid` in `src/cutscene/scenes/story/m43-saltbucket-boardwalk.ts` |
| Played by | quest `m43-saltbucket-boardwalk` as a beat when the Spokewheel step starts (`beats: { 1 }`) |
| Kind and length | `arrival`, about 35 s (aim 10-35) at Normal text speed |
| Where, when | E11 stage `coast-spokewheel` (the boarding platform) and the top of the wheel; noon, sky noon |
| Before / after | after: the drive to the boardwalk. Before: the live ride, then the tow-ski |

## 1. Purpose in the story
Marram Teaspoon's first appearance (intro card). Shows the player the three black HOA barges that rows 44 and 45 will turn on, and is the light moment of a row that is otherwise sincere (the wheel stops at the top; Marram's one secret fear, never named).

## 2. The player's feeling
- **In:** sea air, a first look at the boardwalk after a long drive.
- **Out:** amused, and uneasy about the barges; a clear next step (skis).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Marram | sell the ride, and the view | the barges, and a wheel that sometimes stops | carnival patter, "pet", a bell | covers her fear with a joke in the past tense |
| Player | take the ride | none; mild surprise | nods, a flat "the wheel stopped" | deadpan |

## 4. Subtext
She has been stuck at the top twice and never told a passenger. "Nobody panicked" is the nearest she comes to saying so.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | the platform bell, Marram waving a hand |
| 2 | 5-14 | Setup | patter, "Not you, pet. First ride is free", her intro card |
| 3 | 14-20 | The ride | the camera rises up the wheel, creaking |
| 4 | 20-26 | Turn | from the top: the sea, three black barges in a row; reveal stinger |
| 5 | 26-30 | Stop | the wheel stops at the top, shake, silence |
| 6 | 30-35 | Button | back on the platform: "Nobody panicked." "Hands inside the teacup, pet." |

## 6. Shot list
Platform wide (spot `platform`); frontal mcus, one low on Marram's best line; a dolly up beside the wheel; a slow dolly out over the sea at tele lens (fov 30) on the barges; the platform again for the gag. Singles stay on one side of the line (`coverage('marram', 'player')`).

## 7. Dialogue pass
Six lines. "Lovely view, that. Nobody panicked." is the joke; she was stuck. Barges are described once ("three black barges, HOA flags").

## 8. Music and sound
`turfton`; `shore` bed; platform bell; wheel creak and whoosh; reveal stinger on the barges; music out for the stop, held silence, music back.

## 9. Blocking and vehicles
Marram at the platform rail (mark `marram`), the player at the foot of it (mark `player`). During the ride both actors are despawned and respawned on their marks. Three cutscene-only `watering-can-steamer` barges tinted near-black, in a convoy line, bow west, 370 to 500 m out.

## 10. The button
Marram's bell, and the line that has nothing to do with the sea.

## 11. Self-check
- [x] Intro card for Marram after her first lines, on an mcu. [x] One held silence, one stinger. [x] Lines under 16 words.
- [x] `cutscene-report` OK; line of sight passes. [ ] Watched in a browser: not done. The barges are 370+ m from the camera; check they are drawn.
