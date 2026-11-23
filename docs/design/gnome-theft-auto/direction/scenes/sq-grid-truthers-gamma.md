# Director's notes: `sq-grid-truthers-gamma`

| | |
| --- | --- |
| Scene | `sq-grid-truthers-gamma` in `src/cutscene/scenes/side/gridTruthers.ts` |
| Played by | quest `sq-grid-truthers` ("The Grid Truthers") as its arrival, when the player reaches the Gamma marker at (120, -120) |
| Kind and length | `arrival`, aim 10-35 s; now 30.2 s at Normal text speed (was 48.2 s, 7 faults; over the 45 s limit) |
| Where, when | the x = 120 road north of Gamma (the open road, no stage of its own), dusk held at `sky: 'golden'` |
| Before / after | before: the player's drive to the Gamma marker. After: the player and Mossley look at the downtown line, and the next beat of the quest (the next marker) |

## 1. Purpose in the story

Mossley's bike brings him to the second survey marker. The scene confirms the grid: three markers (Alpha, Beta,
Gamma) all point at downtown, at the spot where something has been rubbed out of the old maps. It is the quest's
middle: the proof that the markers are real, and the cue that the player is now on the trail.

The old scene had a caption-free but long bike track (a 3.5 s ride stretched by a 30 s shake), five wide cuts that held
for 15 s each, and two lines said to Mossley's back while he was out of frame.

## 2. The player's feeling

- **In:** curious and a little cold (the road is empty, a bike comes up it fast).
- **Out:** the trail has a shape: three markers, one place, something rubbed out. The player is now the one being
  watched, and must look bored.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Mossley | to show the player the three markers point at one place | the player is not sure what to look at | a pointing gesture, a whisper, an order (look bored) | from showing the map to coaching the player to hide |
| The player | to know what they are looking at | the markers mean nothing yet | one question, then one dry line | takes the instruction and looks bored |

## 4. Subtext

- Mossley has seen the thing in the old maps before; he does not say so. The lines "rubbed out" and "they'll think you're
  a tourist" say he is afraid of being watched by the people who made the maps.
- "Maps get redrawn. That's all that is." is the player's comfortable answer, and it is the wrong one, which the next
  quest will show.

## 5. Beat sheet

Timings at Normal text speed.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The bike comes up the x = 120 road at speed, the camera riding with it (track, drift 0.02). Mossley skids to a stop by the player. |
| 2 | 4-8 | Setup | He dismounts and looks at the player. The player's question: "Gamma. What am I looking at?" |
| 3 | 8-14 | The markers | Mossley points down the road (`point`): "Alpha, Beta, Gamma. Run a line through each one." A closer single: "They all point downtown. Something has been rubbed out of the old maps." (mystery sting) |
| 4 | 14-19 | Turn | The player's flat reply: "Maps get redrawn. That's all that is." |
| 5 | 19-30 | Button | Mossley, on a frame of him, does his best bored face (`shrug`): "Look at me like you're bored. They'll think you're a tourist." Hold 1 s. |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on the bike from 1 m up, 3 m off the road (handheld 0.02) | 34 | the camera turns with the bike | Mossley's bike | the arrival; close enough that the bike is a picture, not a speck (a far track was ~7% of the phone frame) |
| 2 | `GAMMA_TALK.single('you','mcu')` | 35 | locked | player | the question |
| 3 | `GAMMA_TALK.single('mossley','mcu')` | 35 | locked | Mossley | the markers, point gesture |
| 4 | `GAMMA_TALK.single('mossley','cu')` | 35 | locked | Mossley | the closer for "rubbed out" (the second line in a new shot) |
| 5 | `GAMMA_TALK.single('you','mcu')` | 35 | locked | player | "Maps get redrawn." |
| 6 | `GAMMA_TALK.single('mossley','mcu')` with `shrug` | 35 | locked | Mossley | the button: bored face |

Side of the line: Mossley and the player on `coverage('mossley','you',1)`. Mossley faces +z (the player) after the
dismount (a `face` step before the first single).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| The player | Gamma. What am I looking at? | the straight man: a question, 6 words |
| Mossley | Alpha, Beta, Gamma. Run a line through each one. | was 19 words; the pointing gesture does the rest |
| Mossley | They all point downtown. Something has been rubbed out of the old maps. | was "Downtown. Dead centre. Something there has been rubbed out..."; the markers' finding in one line |
| The player | Maps get redrawn. That's all that is. | was "Maps get redrawn. That's all that is." (kept) |
| Mossley | Look at me like you're bored. They'll think you're a tourist. | the button; kept, split from the look-over-the-shoulder line |
| ~~Mossley~~ | ~~Keep your voice down. The markers can hear a loud voice from sixty units.~~ | cut: the scene is quiet already; the grid joke is in the first scene |
| ~~Mossley~~ | ~~Don't look over your shoulder.~~ | merged into the button line |
| ~~Mossley~~ | ~~Zero, zero. Let's go before the grass remembers where the road was.~~ | cut: a sixth line (the arrival keeps five); the grass joke is not this scene's |

Names checked: `npm run lore -- find "zero, zero"` (no new fact is stated).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `night` ambience, `mystery` music | the quarter's night bed, the theme carries over from the intro |
| 9.0 | `mystery` stinger on "Something has been rubbed out..." (kept) | the map line is the reveal |

No held silence; the scene is short and the button is a look.

## 9. Blocking and vehicles

- Mossley rides `castRide('mossley', 'bike', ...)` up the x = 120 road from (120, -150), stops at (120, -127).
- He dismounts (`exit`) and walks to (120.5, -125), then faces the player.
- The player starts at (120, -117) facing north (yaw pi), on the bike's line; the player does not move.

## 10. The button

Mossley's bored face, close, `shrug`, and his line "They'll think you're a tourist." It is right because the scene's
turn is a warning: the player is being watched, and the last thing they see is a man pretending not to watch.

## 11. Self-check

- [x] Want, obstacle, turn (the markers point at something rubbed out); not a briefing.
- [x] Hook in 1 s: the bike; the first line by 8 s.
- [x] Every line under 16 words (longest 12).
- [x] Mossley's bored button; the player's line short and flat.
- [x] Every speaker framed MS or closer, facing the camera (player and Mossley face each other on a locked single).
- [x] One side of the line (`coverage('mossley','you',1)`).
- [x] Music has a reason; one stinger; no held silence.
- [x] Dusk held at golden; the road lit by the sky.
- [x] Report OK; line of sight passes (`scenes.test.ts`, `sq-grid-truthers-gamma`).
- [x] `direction.notes` points here.
