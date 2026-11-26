# Director's notes: `m30-cams-big-night-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=m30-cams-big-night-mid`.

| | |
| --- | --- |
| Scene | `m30-cams-big-night-mid` in `src/cutscene/scenes/story/m30-cams-big-night.ts` |
| Played by | quest `m30-cams-big-night`: the Speedway runner plays it when the race ends, under the id `race-cams-big-night-podium` (an arrival) |
| Kind and length | `arrival`, aim 10-35 s; now 32.8 s |
| Where, when | stage `speedway-finish-night` (the main straight, the gantry), night, `sky: 'night'` |
| Before / after | before: the player's support stint against the Carburettors; after: Cam is collected for the drive home |

## 1. Purpose in the story

Cam loses, badly, in front of Lulu, who laughs at him without meaning harm (bible, relationships). It shows what the
night cost him and how he takes it: he thanks her, then sweeps the finish line. The lap is the player's; the loss and the
dignity are Cam's. It also keeps the broom upright in his hand like a pennant (the bulletin's joke).

## 2. The player's feeling

- **In:** just finished a race; expecting a podium or a shrug.
- **Out:** fond of Cam and a bit sorry; sure that Lulu likes him; unsettled by how fast he becomes the sweeper again.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Lulu | to enjoy the evening and tease the sweeper | her laugh arrives before the reason | teasing, loud, easy | goes quiet when he sweeps the line |
| Cam | to get through being last | the laugh, the crowd, his own hope | one word ("Thanks."), then the broom | sweeps the line |
| The player | to be on Cam's side | nothing said | "He finished." | the line that reframes it |

## 4. Subtext

Lulu's contempt is small and worried (characters.md): the laugh stops because she is watching a man tidy the place he
lost in. Cam's "Thanks." is the most he will give anyone.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | Lulu's laugh: "Ha! He is still going!" |
| 2 | 4-14 | Setup | The straight: a ride-on at walking pace, a broom held up like a flag; a horn. |
| 3 | 14-19 | Comedy | Cam gets off. A look. |
| 4 | 19-27 | Turn | "Last, sweeper! You drive the way you sweep. Thoroughly!" "He finished." "He did. Nobody finishes last on purpose." |
| 5 | 27-33 | Button | "Thanks." He walks to the line. "Is he sweeping the line?" "He does that." The low shot of the sweeping. |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | `shot('lulu','mcu')` | Lulu | the hook is her laugh |
| 2 | `track` the mower | the ride-on on the straight | arrival, a moving shot under 12 s |
| 3 | `shot('cam','ms')`, `reaction('cam')` | Cam | the dismount, the look |
| 4 | `LULU_PLAYER` singles | Lulu, player | one side of the line for the exchange |
| 5 | `pushIn('cam','ms',3.2)` | Cam | "Thanks." |
| 6 | `spot(line-low)` | the line and the sweeper | the button: the widest shot that holds the gag |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Lulu | Ha! He is still going! | her laugh arrives early (characters.md) |
| Lulu | Last, sweeper! You drive the way you sweep. Thoroughly! | tease, from affection |
| Player | He finished. | the support |
| Lulu | He did. Nobody finishes last on purpose. | she means it kindly |
| Cam | Thanks. | the whole of his reply |
| Lulu | Is he sweeping the line? | her laugh runs out |
| Player | He does that. | the button's last word |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton` music, `crowd` ambience, radio 0.1 | the night's after-race noise |
| 6 | `engine-rev` on the mower, a horn | the slow arrival |
| 26 | `crunch` under the sweeping | the broom on the paint |

## 9. Blocking and vehicles

Lulu leans on her lowrider at (748, -358.4), headlights on. Cam's ride-on comes down the main straight from (712, -362.4) to (744, -363.4) at 5.5 m/s, with Cam seated; he steps off to (742.4, -361.4), then walks to the line at x = 735.6 and sweeps. The player stands at (738, -359). The mower stays on the track after the scene.

## 10. The button

The low shot across the finish line, Cam sweeping the paint under the gantry lamps, Lulu silent. The right last picture: the one who lost tidies the place he lost in.

## 11. Self-check

- [x] Want, obstacle, turn (the sweep), button.
- [x] Hook on a laugh in 3 s.
- [x] Every line under 12 words.
- [x] Voices: Lulu loud and easy; Cam one word.
- [x] One side of the line for the exchange.
- [x] One music change (none); no stinger.
- [x] Night scene lit (headlights, gantry floodlights).
- [x] `npm run cutscene-report` OK; `direction.notes` points here.
