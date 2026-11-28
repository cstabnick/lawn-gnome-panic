# Director's notes: `dress-rehearsal-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=dress-rehearsal-intro`.

| | |
| --- | --- |
| Scene | `dress-rehearsal-intro` in `src/cutscene/scenes/story/m15-founders-boot.ts` |
| Played by | quest `ch1-founders-boot-p2` (Dress Rehearsal) as its intro, taken at Side-Valve |
| Kind and length | `intro`, aim 30-60 s; 34.0 s, no faults |
| Where, when | stage `estates-plot-1-east` (outside Even-Estates Plot 1's east hoarding); night, `sky: 'night'` |
| Before / after | before: the keys are on Tansy's hook. After: the player takes the float round the hoarding (checkpoints, 2 hats from the first gate), then home to the bay |

## 1. Purpose in the story

The heist-comedy rehearsal before the tribunal. Chard Levelright speaks for the first time as foreman (no card: row 7
gave it): a man who measures walls nobody will look at, and who lets a thirty-foot boot go round his site because he
does not care for his employer either. The night watch's whistle starts the chase the gameplay continues.

## 2. The player's feeling

- **In:** they lifted the keys in daylight; now it is night and a long way out.
- **Out:** amused (the boot, the foreman, Pip), then the whistle: go.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Chard | his wall true; his round finished | a thirty-foot boot | flat statements, site words, a long look | lets them go: "Mind the hoarding. It's level." |
| Night watch (a) | an easy shift | the foreman checking things nobody sees | "Nobody's here to see it, boss." | flinches at the horn |
| Night watch (b) | his pay (more than Chard's) | the float | the whistle, the cart | starts the chase |
| Pip | to be the navigator, loudly | Tansy | volume, three titles in one line | hands the player the wheel |
| Tansy | in and out | a foreman | three short clauses | none |

## 4. Subtext

Chard's "I see it." is his whole character: he builds for nobody and still checks the level (his fear and his secret,
never said; row 69 pays it off). He does not stop the float. The watch is paid more than he is and calls it in anyway.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-9 | Hook | A level tapped on a post; Chard low with his lantern: "That hoarding is out of square. Everything else is fine." The watchman; "I see it." |
| 2 | 9-15 | Turn | Engine; the float's headlights come out of the dark (track), the horn; the watchman flinches |
| 3 | 15-26 | Setup | Pip: parade practice; Chard low under the boot: "not on my plan"; Tansy: round and gone; Chard thinks: "Mind the hoarding. It's level." |
| 4 | 26-30 | Handover | Pip climbs down, keys jingle: "You drive! I navigate! Tansy judges!"; the player nods |
| 5 | 30-34 | Button | The second watchman's whistle, the cart's lamp, `chase` music, the cart lurches after them |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `coverage(chard, watch-a)` ms low on Chard | 40 | locked | Chard and the lantern | the practical light, the foreman |
| 2-3 | coverage singles watch / Chard mcu | 35 | locked | the exchange | one side of their line |
| 4 | `track` from (-249, -101, 2.2) on the float | 54 | track | the float arriving, headlights | the turn: an arrival |
| 5 | `frame` mcu Pip toward Chard | 35 | locked | Pip on the float | the gag |
| 6 | `frame` ms Chard low toward the float | 40 | locked | Chard under the boot | scale, comedy |
| 7-8 | Tansy mcu / Chard mcu | 35 | locked | the deal | |
| 9 | `frame` ms Pip, handheld 0.02 | 40 | handheld | Pip running to the player | energy |
| 10 | `frame` mcu player | 35 | locked | the nod | the player's reaction |
| 11 | `frame` mcu watch-b toward the float | 35 | locked | the whistle | the cue |
| 12 | `track` low on the cart | 48 | track | the cart's lamp | the chase begins |

Night: Chard's lantern and the float's headlights are the practicals; Tansy's orange hat and the float's pale boot read
against the dark hoarding.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Chard | That hoarding is out of square. Everything else is fine. | first line as foreman (his bible line, turned to the hoarding) |
| Watch | Nobody's here to see it, boss. | |
| Chard | I see it. | the sincere half-beat, no gag on it |
| Pip | Evening! Parade practice! Extremely official! | |
| Chard | A thirty-foot boot is not on my plan. | |
| Tansy | It's not staying. Round your hoarding and gone. | the objective, in her voice |
| Chard | Mind the hoarding. It's level. | he lets them; sets up the clean-run achievement |
| Pip | You drive! I navigate! Tansy judges! | hands over; no "hear me out" (the ladder's rung is the final's intro) |

"Nobody asked me who it was for" is kept for row 69.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `heist` low, `night` bed, `tap` at Chard | a caper at night; the level on a post |
| 9 | `engine-rev`, then the horn | the float, heard first |
| 26 | `keys` at Pip | the handover |
| 30 | `whistle` at the watchman, `chase` music | the cue for the gameplay chase |

## 9. Blocking and vehicles

Chard (-265.5, -110) walks to (-262, -111) under the float. Watch (a) (-262, -107.5), watch (b) on a chair at
(-266, -101.5). The float (Pip driving, Tansy beside him) drives `float-to-estates` from (-226, -117) to (-256, -113),
next to the quest's ride mark (-256, -112): the checkpoints objective spawns the real float there when the scene ends.
The player waits at (-251.5, -108.5) and stays there on foot. The watch cart drives `watch-cart-chase`.

## 10. The button

The cart's roof lamp snapping on and lurching at the camera to `chase`: the gameplay continues the same chase.

## 11. Self-check

- [x] Want, obstacle, turn (the float arrives); the whistle is the button.
- [x] Hook by 0 s; no narration.
- [x] Lines under 16 words; voices per the bible; the player's reaction shot.
- [x] One side of each pair's line; night lit by lantern and headlights.
- [x] Checker: 34.0 s, 0 faults; line of sight passes.
