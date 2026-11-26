# Director's notes: `m31-granny-cracks-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m31-granny-cracks-outro`.

| | |
| --- | --- |
| Scene | `m31-granny-cracks-outro` in `src/cutscene/scenes/story/m31-granny-cracks.ts` |
| Played by | quest `m31-granny-cracks` as its outro, on the clinic cot after the glue |
| Kind and length | `outro`, aim 15-45 s; now 29.5 s |
| Where, when | stage `glaze-clinic-bay`, dusk, `sky: 'golden'` |
| Before / after | before: the glue scene; after: the next quest (the Canal and Driftwood's chart), which opens with a laugh |

## 1. Purpose in the story

The sincere beat of the act (tension 7): Granny, glued and afraid for the first time, tells the player about her late
husband's acorn silo and refuses, gently, to say where it is. Her secret (characters.md: told at #31) is paid in full
here and no location is given. It ends on the pie tin changing hands, the same tin that is the quest's cosmetic reward.
**No gag, no music cue louder than a held chord.**

## 2. The player's feeling

- **In:** shaken, a little proud of the gentle ride.
- **Out:** trusted with something; the farm is bigger than a farm.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Granny | to tell someone, without telling where | her fear, her habit of keeping the sharpest secrets | plain words, a recipe's rhythm, "sugar" once | gives the player her tin |
| The player | to listen | nothing | two words | holds the tin |

## 4. Subtext

"A bank can take a farm. It cannot take what it cannot count" is Granny's answer to the bailiffs. Her refusal ("Not yet, dear") is trust with a deadline.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | Granny: "Sit with me a minute, sugar." |
| 2 | 4-12 | Setup | "My husband built a silo the winter we married." "A silo?" |
| 3 | 12-19 | Turn | "He filled it with acorns, one at a time. Counted every one." The insert, a creak. |
| 4 | 19-26 | Turn | "He said a bank can take a farm. It cannot take what it cannot count." "Where is it?" "Somewhere nobody counts. Not yet, dear." |
| 5 | 26-30 | Button | The tin changes hands: "Hold my tin a while." |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | `COT.single('granny','mcu')` | Granny | the hook |
| 2 | `pushIn('granny','mcu')` | Granny | the silo, a slow push |
| 3 | `COT.single('player','mcu')` | the player | "A silo?" |
| 4 | `insert('granny')` | her thumb on the dent | the tin, 1-2 s |
| 5 | `COT` singles | Granny (low), player | the refusal |
| 6 | `insert('player')` | the tin in the player's hands | the button |

One side of the line (`coverage('granny','player',1)`).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Granny | Sit with me a minute, sugar. | "sugar" once |
| Granny | My husband built a silo the winter we married. | |
| Player | A silo? | |
| Granny | He filled it with acorns, one at a time. Counted every one. | |
| Granny | He said a bank can take a farm. It cannot take what it cannot count. | 15 words |
| Player | Where is it? | |
| Granny | Somewhere nobody counts. Not yet, dear. | no location |
| Granny | Hold my tin a while. | the button |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `sad` music at low level, `wind` ambience | a held chord |
| 4 | `cloth` | she shifts |
| 17 | `creak` | the cot |
| 28 | `clink` | the tin changes hands |

A held silence once, before the tin.

## 9. Blocking and vehicles

Granny on the second cot at (12.4, 31), facing west, with the tin; the player at (9.4, 32.6) at the foot. No vehicles.

## 10. The button

The player's hands round the dented tin, Granny's voice already gone. It is the last picture because the reward is the thing she can give.

## 11. Self-check

- [x] Want (to tell, not to show), obstacle (fear), turn (the refusal), button (the tin).
- [x] No gag; the silo is told, never placed.
- [x] Every line under 16 words.
- [x] "Sugar" once; the rhythm of a recipe.
- [x] One held silence.
- [x] `npm run cutscene-report` OK; `direction.notes` points here.
