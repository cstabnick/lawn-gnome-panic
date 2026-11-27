# Director's notes: `cams-cell-outro`

| | |
| --- | --- |
| Scene | `cams-cell-outro` in `src/cutscene/scenes/story/m62-cams-cell.ts` |
| Played by | quest `m62-cams-cell`, the outro of the choice "Free him" (optionA, save.ending 'A') |
| Kind and length | `outro`, aim 15-45 s; about 27 s |
| Where, when | stage `cams-lockup`, night |
| Before / after | before: the key taken from the peg; after: the epilogue W19, Cam sweeping Founders' Green |

## 1. Purpose in the story

Cam is judged and freed. The broom comes off the wall, nobody has come to get him before, he sweeps the cell on the way out (he cannot leave a floor), and gets into the passenger seat.

## 2. The player's feeling

- **In:** a choice made. **Out:** warmth, a little rueful.

## 3. Characters

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Cam | his broom, and out | nothing | asks flatly | leaves with it |

## 4. Subtext

"Nobody has ever come to get me" echoes "Nobody has ever come to watch me" (row 30).

## 5. Beat sheet

Keys and a latch; "The broom. Please."; he fetches it; "Nobody has ever come to get me." (the scene's silence); a slow sweep of the pen floor from above; he walks out and climbs in; "Take me anywhere with leaves."; the last shot is the empty swept pen.

## 6. Shot list

Stage `gap-low`; Cam mcu; player nod; `pen-wide`; Cam mcu; `pen-high` (the sweep); track on Cam to the ride; Cam mcu from the seat; `pen-high` for the button.

## 7. Dialogue pass

| Who | Line |
| --- | --- |
| Cam | The broom. Please. |
| Cam | Nobody has ever come to get me. |
| Cam | Take me anywhere with leaves. |

## 8. Music and sound

No music; `office` bed; `keys`, `latch`, `cloth`, `crunch` x2 (the sweep), `engine-rev` (the ride idling).

## 9. Blocking and vehicles

Cam starts at (116.5, -97.8); the broom at (114.95, -97.2) is despawned when he takes it; his sweep path runs inside the pen; the player's ride (`from: 'player'`, a ride-on if on foot) waits at (121.8, -91.8) and Cam boards seat 1.

## 10. The button

A swept cell under two lanterns, and a ride idling away.

## 11. Self-check

- [x] No gag on the sincere line; the sweep is the character beat.
- [x] Lines short; one silence; no stinger.
- [x] `cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
