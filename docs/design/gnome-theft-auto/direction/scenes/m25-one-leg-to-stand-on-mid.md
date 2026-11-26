# Director's notes: `m25-one-leg-to-stand-on-mid`

| | |
| --- | --- |
| Scene | `m25-one-leg-to-stand-on-mid` in `src/cutscene/scenes/story/m25-one-leg-to-stand-on.ts` |
| Played by | quest `m25-one-leg-to-stand-on`, a beat as objective 2 starts (right after the sermon is stood) |
| Kind and length | `arrival` (a mid-quest beat), aim 10-35 s; 22.3 s |
| Where, when | stage `waders-circle` (the circle), dusk (`sky: 'golden'`) |
| Before / after | before: the hold game ("So it is stood."); after: tow the raft from the east gate to Driftwood's trailer |

## 1. Purpose in the story

The sermon names the Even Cut, on the longest day, and Saxifrage looks at the player when she says it. It is never
explained and never answered. The day sermon text in `societies/flock/sermon.ts` does not carry the line (only the night
sermon does), so this scene carries it for every player. Two lines of host warmth first, then the turn.

## 2. The player's feeling

- **In:** having stood on one leg for twenty seconds; pleased with themselves.
- **Out:** uneasy. Tension 5. Nothing has been explained.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Saxifrage | to hand over the raft, and to say what she cannot stop knowing | her own ignorance of how she knows | host cheer, then a drop in voice | looks at the player and says it |
| The player | to leave with the raft | nothing | one question about a feather | silent |

## 4. Subtext

Her fear is a Tuesday with nothing foretold (characters.md); her secret is that the prophecies are real. "I do not
know why I know it" is the only time she admits it.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-8 | Hook and gag | "Well stood, friend. The raft waits at the east gate, with a feather on." "Why a feather?" "Do not ask about the feather." |
| 2 | 8-14 | Turn | A beat. The music goes. She faces the player: "On the longest day comes the Even Cut." |
| 3 | 14-22 | Button | The player's face, silent, a pause. "I do not know why I know it. So it is stood." The player's face again, held. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `SAX.single('saxifrage','ms')` | 40 | locked | Saxifrage | the host, cheering |
| 2 | `SAX.single('player','mcu')` | 35 | locked | the player | the question |
| 3 | `SAX.single('saxifrage','mcu', low)` | 35 | locked, low | Saxifrage | "Do not ask about the feather." |
| 4 | `SAX.single('saxifrage','mcu')` | 35 | locked | Saxifrage | the line that is looked at the player |
| 5 | `SAX.single('player','mcu')` | 35 | locked | the player | the reaction, silent |
| 6 | `SAX.single('saxifrage','mcu')`, then the player | 35 | locked | the last line, then the face | the button |

One side of the line (`coverage('saxifrage','player',1)`). No deliberate crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Saxifrage | Well stood, friend. The raft waits at the east gate, with a feather on. | the objective, plus a plant for the outro |
| Player | Why a feather? | |
| Saxifrage | Do not ask about the feather. | the last gag |
| Saxifrage | On the longest day comes the Even Cut. | the planted date (lore: "turns out to be a real date") |
| Saxifrage | I do not know why I know it. So it is stood. | her admission |

Names checked: `npm run lore -- find "Even Cut"`, `"Standing Lady"`, `"Flock of the One Leg"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `water` bed, `mystery` music, `cloth` | cheer, robes |
| 3.0 | `flutter` | the feather |
| 9.0 | `creak` high up (the Lady) and music out (fade 0.8) | the silence before the line: the one held silence of the scene |
| 16.0 | `rustle` | the player, still |

## 9. Blocking and vehicles

Saxifrage at (-1130, -643.6) and the player at (-1126.2, -639), as in the intro; she faces the player from the turn. No
vehicles; the player actor ends at its mark.

## 10. The button

The player's face after her last line, held, with the reeds and the hum and no music. Nothing answers it. That is the
right ending: the line is the plant, and the player's silence is the player's.

## 11. Self-check

- [x] Want, obstacle, turn: a host's cheer, then the thing she cannot stop saying.
- [x] Hook in 3 s on a character; not narration.
- [x] Every line under 16 words (longest 15); the Even Cut is not explained.
- [x] Voices: Saxifrage ritual; the player one short question.
- [x] Speakers MCU or MS, facing the lens; no speaker-run (the player's face breaks it).
- [x] One side of the line.
- [x] Music out before the line; one held silence only.
- [x] Funny first, ominous on the last line; no gag on top of it.
- [x] Dusk scene is lit.
- [x] `npm run cutscene-report` OK, sound list clear.
- [x] `direction.notes` points here.
