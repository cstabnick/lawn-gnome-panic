# Director's notes: `even-estates-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=even-estates-mid`.

| | |
| --- | --- |
| Scene | `even-estates-mid` in `src/cutscene/scenes/story/m07-even-estates.ts` |
| Played by | quest `m07-even-estates`, as the `scene` of the inspect objective (after the third permit is photographed) |
| Kind and length | `arrival`, aim 10-35 s; now 32.5 s at Normal text speed, no faults |
| Where, when | stage `estates-plot-1-showhome` (Even-Estates Plot 1, the first show-home); night (`sky: 'night'`) |
| Before / after | before: the player has photographed the gate hoarding and the sign board and walked in. After: the objective to crack the night-watch |

## 1. Purpose in the story

The first look at Thorne Even-Estates' machine: identical show-homes, one signature three times. Chard Levelright, who builds
what the plans say and has stopped reading who signs them (lore), meets the player and runs. Plants the night-watch and his
flight (he returns in #15 and #28).

## 2. The player's feeling

- **In:** creeping around a site at night with a camera.
- **Out:** caught, a little guilty, and clear: two watchmen are coming and Juniper wants them cracked. And a quiet worry about
  that third signature.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Chard | to keep the site level and closed | two trespassers and a councillor | a flat verdict, then the whistle | gone, on his Ride-On, hazard lamp flashing |
| Juniper | to get the permits and a name | Chard reads the bubble, not the name | official calm | hands the player the job |
| The player | to photograph all three | the torch | silence | takes the job |

## 4. Subtext

Chard is not cruel: "I read the bubble, not the name" is his whole defence. Juniper's "That is the whole problem with this town"
is aimed at him and at herself, because the name is her brother's.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | the three clipboards on one panel, the shutter, the same hand three times |
| 2 | 4-9 | Setup | "Three permits. Same ink, same hour, same hand." |
| 3 | 9-14 | Entrance | the torch swings in; "That wall is true. You are not." The intro card |
| 4 | 14-22 | Turn | "Whose plans are these?" "I read the bubble, not the name." "That is the whole problem with this town." |
| 5 | 22-28 | Flight | "Night-watch! Visitors! They have a camera!" He runs to his Ride-On; the watch runs in |
| 6 | 28-32 | Button | Juniper: "Two watchmen. Crack them. Politely." |

## 6. Shot list

The hook is a still insert of the panel (L95: three clipboards, hung level to the quarter-inch). Juniper, the player and Chard are
shot with `coverage('juniper','chard',-1)` and `coverage('juniper','player',1)`; the player's reactions take the -25 side. Chard's
threat line is a low `ms`. The flight is a `track` on Chard's Ride-On. Juniper and the player `face` Chard before his entrance.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Juniper | Three permits. Same ink, same hour, same hand. | what the insert shows, said once, in her words |
| Chard | That wall is true. You are not. | his first line; the intro card follows |
| Juniper | Councilwoman Vance. Whose plans are these? | she gives her name; the context rule |
| Chard | Signed plans. I read the bubble, not the name. | the lore, in his voice |
| Juniper | That is the whole problem with this town. | |
| Chard | Night-watch! Visitors! They have a camera! | the turn |
| Juniper | Two watchmen. Crack them. Politely. | the objective in her voice |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `mystery` music, `night` bed, shutter | a quiet site |
| 9.5 | `tension` on the torch; `rustle` foley | the watch is near |
| 22 | `whistle` on Chard's call, then his horn | the alarm |

## 9. Blocking and vehicles

The player at (-309.3, -131.8) at the show-home door with the field camera; Juniper at (-306.2, -132.2). Chard enters at
(-299, -126.5) with a torch, runs to his Ride-On at (-303, -124), and drives west out of the gate gap round the shed outside it.
The watchmen spawn at the yard edge and run in. Props: a hoarding panel and three clipboards between the first two show-homes.

## 10. The button

Juniper, level and polite, with the watchmen running in behind her. It gives the next job and keeps her in character.

## 11. Self-check

- [x] Want, obstacle, turn (Chard's whistle).
- [x] Hook on a picture and a sound; no narration.
- [x] Lines under 16 words; each speaker in their own voice.
- [x] Night lit by a torch and the show-homes' lit windows.
- [x] Checker: zero faults; LOS and collision checks pass.
- [x] `direction.notes` points here.
