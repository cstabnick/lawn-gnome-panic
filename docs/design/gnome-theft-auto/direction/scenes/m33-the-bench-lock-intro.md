# Director's notes: `m33-the-bench-lock-intro`

| | |
| --- | --- |
| Scene | `m33-the-bench-lock-intro` in `src/cutscene/scenes/story/m33-the-bench-lock.ts` |
| Played by | quest `m33-the-bench-lock` (intro, from Side-Valve's giver) |
| Kind and length | `intro`, about 28 s (aim 30-60) at Normal text speed |
| Where, when | stage `side-valve-bench` (Tansy's bench, Side-Valve Salvage); day, sky noon |
| Before / after | after: the dune line (row 32). Before: the drive to the Underspan |

## 1. Purpose in the story
Tansy wants a proper lock for the bench where the Golden Acorn sleeps, and says so without naming it. She gives the job in three short clauses: Hogweed builds it, you test it, Cam carries it. Cam asks the only question, and his eyes go to the bench.

## 2. The player's feeling
- **In:** back at the bay after the edge of the map.
- **Out:** a job, a passenger, and a bench that matters.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | a lock that holds | the old one opens with a comb | works while she talks, three clauses | looks up only when she means it |
| Cam | to be useful, to see | he is not told | asks what it locks | his eyes stay on the bench |
| Player | the job | none | "Any spoon?" | takes the old lock |

## 4. Subtext
Cam is selling the crew out (act II secret). The player must not notice: he is helpful and a little nearer the bench each time we look.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | the bench under its tarp, a clatter, a push-broom behind it |
| 2 | 3-12 | Setup | spoon and comb; "What are we locking?" |
| 3 | 15 | Turn | "What sleeps under this bench needs a proper lock." Cam, a pace closer |
| 4 | 18-26 | Job | three clauses; Cam's one question; "A bench." |
| 5 | 26-28 | Button | the old lock changes hands; Cam looks at the bench |

## 6. Shot list
Establishing wide; `coverage('tansy','player',1)` singles; a push-in on the turn; cutaways on Cam; a high insert of the lock; a closing ms of Cam.

## 7. Dialogue pass
Eight lines, all under 16 words, in Tansy's dry register.

## 8. Music and sound
`turfton`, street; clatter, rustle, keys.

## 9. Blocking and vehicles
Tansy at the bench, three-quarters to camera; the player a few paces off; Cam sweeping, then called over. No vehicles.

## 10. The button
Cam's eyes on the bench while Tansy does not look at him.

## 11. Self-check
- [x] Tansy is never seen from behind. [x] `cutscene-report` OK; scenes.test.ts passes.
