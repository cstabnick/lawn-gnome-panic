# Director's notes: `heist-board-intro`

| | |
| --- | --- |
| Scene | `heist-board-intro` in `src/cutscene/scenes/story/m54-the-heist-board.ts` |
| Played by | quest `m54-the-heist-board` (The Heist Board), as its intro |
| Kind and length | `chapter-open`, aim 45-80 s (about 60 s at Normal text speed) |
| Where, when | stage `m54-heist-board` (the camp at the Dust Flats overlook), noon (`sky: 'noon'`) |
| Before / after | before: the Stopping Stone delivered; after: the three photographs from the rail |

## 1. Purpose in the story

Act IV opens (the chapter title card moved here from `runway-intro`). Tansy pins the last string; Pip says "Okay, hear me out. Just once." and flinches; she does not sigh ("Go."). First rung of her arc: she lets Pip run a plan and stops saying "not my problem". The idea is one the board already says, so she asks "Where is it?" to let him finish. Tension 6.

## 2. Characters

| Character | Objective | Obstacle | Tactic | Change |
| --- | --- | --- | --- | --- |
| Pip | to be heard | years of sighs | rushes, flinches, run-on | is let finish; stunned |
| Tansy | to run the plan | her own habit | dry, three short clauses | listens, praises once |
| The player | to take the job | none | still, a camera in hand | is handed the camera |

## 3. Beat sheet

1. Crane over the flats to the fort, title card (0-8 s). 2. Camp wide, a tack tapped (to 12 s). 3. "Okay, hear me out. Just once." music out, held silence, "Go." (to 22 s). 4. The pitch, "Where is it?", "In a fort." (to 36 s). 5. The board insert; "I know."; "You let me finish."; "It was a good idea." (to 48 s). 6. The camera handed over, the rail, Wally (to 56 s). 7. Button: "She said good idea." / "I heard that."

## 4. Shots, sound, blocking

Pip/Tansy shot on one `coverage`, Tansy/player on another; wide and board inserts from the stage cameras. Music `heist`, out for the silence (once), `chapter` stinger on the title, bed `wind`, foley `tap`, `paper`, `flutter`. Props: `heist-board`, `stopping-stone`, `rolled-chart` (scene props). Tansy ends at the board, Pip two steps behind, the player by the table.

## 5. The button

Tansy taps a tack home without turning round: "I heard that."

## 6. Self-check

- [x] Hook in 3 s, a turn, a button; every line 16 words or fewer; no coordinates.
- [x] Pip's "Okay, hear me out" varied ("Just once.") so `repeat-line` stays clear; one rung of the ladder.
- [x] One held silence, one stinger.
- [x] `npm run cutscene-report` OK; line of sight passes; `direction.notes` points here.
