# Director's notes: `m66-porcelain-hearts-intro`

| | |
| --- | --- |
| Scene | `m66-porcelain-hearts-intro` in `src/cutscene/scenes/story/m66-porcelain-hearts.ts` |
| Played by | quest `m66-porcelain-hearts` (Porcelain Hearts), as its intro, when the player talks to Clara at the porch |
| Kind and length | `intro`, aim 30-60 s; about 34 s at Normal text speed |
| Where, when | stage `m66-porch-log` (Mossy Wood, below the porch steps), dusk (`sky: 'golden'`) |
| Before / after | before: the Countess's first vine on the lorry (row 65); after: the walk to the sealed door |

## 1. Purpose in the story

The act's sincere low begins quietly. Clara's first story appearance (her intro card lands here). She has not crossed
the porch since she sealed it; she knows the face the Combine wears. She asks for help and does not light her lantern.

## 2. The player's feeling

- **In:** the loud triumph of the all-hats camp and the Countess's turn.
- **Out:** hushed. Something is being asked of them that is not a heist. Tension 3.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Clara | to get the player across the porch with her | she cannot say his name, or go alone | counting, understatement, lines that stop early | asks, and does not light the lantern |
| The player | to listen | nothing: it is Clara's scene | a nod, one short line | agrees to come |

## 4. Subtext

- "I know the face" is the whole confession. She never says whose.
- Counting ("Four. All of them whole.") is how she keeps what she has, and the line sets what she is afraid of losing.
- The unlit lantern is the scene's one prop with a meaning: she will not bring light to that door.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | The porch with nobody on it, a lantern chain ticking, a pale figure at a log. |
| 2 | 3-9 | Setup | "Four to the oak stump tonight. Four. All of them whole." Card. |
| 3 | 9-17 | Arrival | The player walks up. "Thank you for coming. I was not sure I would ask." "The Combine has a face now." |
| 4 | 17-26 | Turn | Push-in: "I know the face." Pause. "I have not crossed the porch since I sealed it." |
| 5 | 26-34 | The ask | The player nods. "Come with me. There is something I cannot tell you from here." Low on the seal tape. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `wide` | 50 | locked, high | the porch, the log, Clara small | hook |
| 2 | `WAIT.single('clara','mcu',{height:'low'})` | 35 | locked | Clara | counting; the card |
| 3 | `shot('player','ms')` | 40 | locked | the player walking in | arrival |
| 4 | `WAIT.single('clara','mcu')` | 35 | locked | Clara | the thanks |
| 5 | `WAIT.single('player','mcu')` | 35 | locked | the player | their one line |
| 6 | `pushIn('clara','mcu' to 'cu')` | 35 | slow push | Clara | the confession |
| 7 | the player, then Clara low | 35 | locked | the nod; the ask | the turn |
| 8 | stage camera `tape` | 40 | locked, low | the seal tape in the draught | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Clara | Four to the oak stump tonight. Four. All of them whole. | her counting tic (bible: "Four tonight. Four.") |
| Clara | Thank you for coming. I was not sure I would ask. | formal, soft |
| Player | The Combine has a face now. | the only thing said about him |
| Clara | I know the face. | then a held beat |
| Clara | I have not crossed the porch since I sealed it. | "the porch", never the Tall House |
| Clara | Come with me. There is something I cannot tell you from here. | |

Names checked: `npm run lore -- find Clara`, `find porch`, `find "oak stump"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `fescue` music, `forest` bed (radio 0.1) | Mossy Wood folk, at its softest |
| 1 | `creak` (a lantern chain) | the porch is not empty of sound |
| 10 | `footsteps` | the player on the path |
| 26 | music to `sad` over 2.5 s | the scene turns |
| 30 | `flutter` (the tape) | the sealed door |

## 9. Blocking and vehicles

No vehicles. Clara at the log's mouth facing south with the porch behind her; the player enters from the south, 7 m
back, and stops about 5 m from her. The lantern in her hand is unlit throughout.

## 10. The button

The tape, low and stirring, with the sealed door behind it, and a three-second hold. No music swell: `sad` is already there.

## 11. Self-check

- [x] Want (get across the porch), obstacle (cannot say it), turn ("I know the face").
- [x] Hook in 3 s: a creak and a pale figure.
- [x] Every line 12 words or fewer.
- [x] Voice: Clara soft, formal, counting, lines end early.
- [x] No gag. Never "the Tall House".
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
