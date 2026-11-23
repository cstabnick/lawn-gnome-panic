# Director's notes: `sq-biscuit-hotdog-outro`

Re-directed against [../bible.md](../bible.md). Watch it at `http://localhost:5310/?no-intro&cutscene=sq-biscuit-hotdog-outro`.

| | |
| --- | --- |
| Scene | `sq-biscuit-hotdog-outro` in `src/cutscene/scenes/side/biscuitHotdog.ts` |
| Played by | quest `sq-biscuit-hotdog` as its outro, once the hotdog is hauled back to Cloverfield Barn |
| Kind and length | `outro`, aim 15-45 s; now about 26 s at Normal text speed (was 29.9 s, 6 faults) |
| Where, when | stage `granny-barn`, the barn yard; golden hour, `sky: 'golden'` |
| Before / after | before: the steal-deliver drive, the player's combine at the barn with the hotdog on its back. After: the quest is done (the pie, the Watch's embarrassment) |

## 1. Purpose in the story

The payoff of the favour. The hotdog is home, Biscuit is still out there, and the giant's walk away is the reason the
job was worth it. It also plants the Watch's embarrassment (the hat heat that went up) and Granny's pie as the reward.

The old scene had Bramble unseen, the player small at 18% of the frame, a dolly that was replaced at once, and Granny at
14% of the frame.

## 2. The player's feeling

- **In:** relieved and a little proud after the drive, the hotdog on the back of a combine.
- **Out:** the dread of the thumps leaving, a laugh at the Watch and Granny's pie.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Farmer Bramble | the toy by the barn and Biscuit gone | his own nerves | whisper; "Gently. Gently." | still whispering, lets out a breath |
| Granny Gnertrude | the toy where the Watch can see it | nothing: she always knows | deadpan, the pie | ends on the pie |
| The player | to know Biscuit is gone | the thumps | two questions | relieved, shaken |
| Scarecrow Tender | to cheer the haul | none | a gesture | (local colour) |

## 4. Subtext

- The toy is at the barn, which means the Watch is looking at the barn. Granny wants them to see it: she is taunting
  the HOA's Hat Watch. The button is her dare.
- Bramble's "Nobody move" is a man who has been in a cellar since Tuesday. He is not sure Biscuit has gone.
- Biscuit is never seen. The walk-off is heard, not shown, so the last image is the yard and Granny, not the sky.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A wide of the hauler at the barn; the hotdog spawns and slides off the back with one squeak and a shake. The comic sting. |
| 2 | 3-10 | Setup | Bramble low: "Gently. Gently. That is the squeaky one." Granny, MS: "Put it by the barn, where the Watch can see it and be sorry." |
| 3 | 10-14 | The player | The player, MCU, turned to Bramble: "It is bigger than the barn." |
| 4 | 14-24 | Turn | Music out. The thump; the shake; the scarecrow flinches. Everyone looks up (a low look at the sky, nothing in frame). Bramble: "Don't look up." Another thump. |
| 5 | 24-30 | Walk-off | Two fainter thumps (gain 0.5, then 0.25), the shake fading. Music back at the second. The player: "Is he gone?" Bramble: "Listen. He is walking away. Nobody move." |
| 6 | 30-34 | Button | Granny, MS, deadpan: "Well. Every hat in the county just went up. Pie?" |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` wide, from the hauler's side | 42 deg | locked | the hauler and the hotdog | the hook |
| 2 | `frame` mcu, low, toward the player | 35 deg | locked | Bramble | "Gently" |
| 3 | `frame` ms, toward Bramble | 40 deg | locked | Granny | the barn's dare |
| 4 | `frame` mcu, toward Bramble (after a face) | 35 deg | locked | the player | the reaction to the toy |
| 5 | `cut` look-up, low | 50 deg | locked | the sky | everyone looks up; Biscuit is not shown |
| 6 | `frame` mcu, low | 35 deg | locked | Bramble | "Don't look up" with the second thump |
| 7 | `frame` mcu, toward Bramble | 35 deg | locked | the player | "Is he gone?" |
| 8 | `frame` mcu, low | 35 deg | locked | Bramble | the walk-off |
| 9 | `frame` ms | 40 deg | locked | Granny | the button |

Coverage: `coverage('bramble', 'you')` for the yard's two-hander; `coverage('granny', 'you')` for the porch. Each speaker
faces the camera for their line (`face` steps before the player's lines). Nobody crosses the line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Bramble | Gently. Gently. That is the squeaky one. | the relief, whispered |
| Granny | Put it by the barn, where the Watch can see it and be sorry. | the dare: the Watch is looking at the barn |
| Player | It is bigger than the barn. | the physical gag, said as the thump starts |
| Bramble | Don't look up. | the running rule, now with a thump under it |
| Player | Is he gone? | the only question |
| Bramble | Listen. He is walking away. Nobody move. | the walk-off, the thumps fading |
| Granny | Well. Every hat in the county just went up. Pie? | the button: the Watch, the pie |

No line is longer than 14 words. The taxi and the bus stop are not used here (lore: Mabel only knows the Central Bus Stop).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | ambience `wind`; music `tension` | the golden yard |
| 0 | `comic` stinger; sfx `bump` at the hotdog, shake 0.18 | the physical gag: the toy slides off the back |
| ~14 | music out (fade 0.4); sfx `thud`, shake 0.25 | silence before the reveal; the thump |
| ~19 | sfx `thud`, shake 0.3 | the second thump, nearer |
| ~21-24 | sfx `thud` gain 0.5, shake 0.1; wait 1.4 s | Biscuit walks away |
| ~25 | music `tension` back (fade 1.2); sfx `thud` gain 0.25, shake 0.04 | the ground goes quiet, the music returns |

## 9. Blocking and vehicles

- The hauler (the player's combine, `from: 'player'`) stands at the barn facing east. The player steps out (exit).
- The hotdog spawns on the hauler's back and slides off onto the yard (`spawn hotdog`, the hidden prop).
- Bramble stands by his parked combine and turns to the player on each line.
- Granny stays in her porch chair, facing the player. She does not stand.
- The Scarecrow Tender flinches at the thump and stays put.
- The player ends beside the hauler at the barn.

## 10. The button

Granny in MS, deadpan, the last line: "Well. Every hat in the county just went up. Pie?" It is the right last moment
because the HOA's Watch is the one who was meant to lose its nerve, and Granny is the one who says so without looking up.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; the turn is the thump and the look up.
- [x] The hook lands in 3 s; the first thing is a sound and a move (the hotdog slides), not narration.
- [x] Every line is under 16 words; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Each character sounds like their bible entry (Bramble whispers; Granny warm and deadpan, the pie).
- [x] Every speaker is framed MCU or MS for their line; the player faces the speaker (`face` steps).
- [x] One side of the line per conversation.
- [x] Music has a reason at each change; one `comic` stinger on the physical gag.
- [x] Night scenes are lit: not applicable (golden hour).
- [x] `npm run cutscene-report` shows the scene OK (no faults left).
- [x] Line of sight passes (`scenes.test.ts -t sq-biscuit-hotdog`); `side.test.ts` passes (59 tests).
- [x] `direction.notes` in the scene points at this file.
