# Director's notes: `m33-the-bench-lock-outro`

| | |
| --- | --- |
| Scene | `m33-the-bench-lock-outro` in `src/cutscene/scenes/story/m33-the-bench-lock.ts` |
| Played by | quest `m33-the-bench-lock` (outro, at Tansy's bench) |
| Kind and length | `outro`, 25.9 s (aim 15-45) at Normal text speed |
| Where, when | stage `side-valve-bench`; dusk, sky golden |
| Before / after | after: the drive home with Cam. Before: Tansy's party (row 34) |

## 1. Purpose in the story
Tansy sets the code at the bench with Cam at her elbow, broom in hand. Cam moves from envy to the sale. The player sees nothing wrong, and nothing in the scene says otherwise: only a face in lamplight that has seen four numbers.

## 2. The player's feeling
- **In:** a job done.
- **Out:** quiet, a little warmth, and an itch they cannot place (tension 6).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | a code only she knows | none she can see | "Turn round." "Not the broom's." | trusts the wrong gnome by default |
| Cam | the four numbers | the player, Tansy | stands still, helpful | has them |
| Player | stay out of it | none | "Which numbers?" | turns round |

## 4. Subtext
"Not the broom's" is a joke about the broom in the hand of the one who is counting.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | the lock on the bench, from the apron side |
| 2 | 3-8 | Setup | four wheels; "Turn round." |
| 3 | 9-16 | Turn | "The code is mine. Not yours, not Pip's. Not the broom's." Three taps and a latch; Cam's face |
| 4 | 17-26 | Button | "Done. Now it sleeps." "Good lock." "Sweep." Cam goes, and looks back once |

## 6. Shot list
The bench-lock spot; `coverage('tansy','player',1)`; an ms of Tansy toward Cam; a cu of Cam; an ms of Cam walking.

## 7. Dialogue pass
Seven lines, all under 16 words.

## 8. Music and sound
`turfton-dusk`, street; clatter, three taps, a latch, a mystery stinger. The bench lock is a cutscene-only prop here; the lead decides whether it persists in the world.

## 9. Blocking and vehicles
Tansy at the bench three-quarters to camera; Cam a pace behind her elbow; the player turns to face the yard on "Turn round."

## 10. The button
Cam at the edge of the lamplight looking at the bench once.

## 11. Self-check
- [x] One stinger. [x] `cutscene-report` OK; scenes.test.ts passes.
