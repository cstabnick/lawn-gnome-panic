# Director's notes: `asphalt-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=asphalt-intro`.

| | |
| --- | --- |
| Scene | `asphalt-intro` in `src/cutscene/scenes/story/m09-where-asphalt-sleeps.ts` |
| Played by | quest `m09-where-asphalt-sleeps` as its intro, given at Bodega & Sons |
| Kind and length | `intro`, aim 30-60 s; now 30.2 s at Normal text speed, no faults |
| Where, when | stage `bodega-front`, day (`sky: 'noon'`) |
| Before / after | before: the Glaze & Tax break-in. After: three sightings behind the shop |

## 1. Purpose in the story

The gentle row after eight quests of cracking hats (act I's light relief). Asphalt is the barometer (bible section 2): off the
counter means something is truly wrong. Ladder: Asphalt's bottlecap (planted in the prologue; this row finds it).

## 2. The player's feeling

- **In:** the end of the break-in; a shop that is usually the comfortable "meanwhile".
- **Out:** a smile and a small worry: a cat that leaves a full bowl.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| John Bodega | to get his cat back | he will not leave the shop | a flat voice and an unasked-for favour | trusts the player with it |
| The player | to understand | | "Asphalt?", "Me?" | takes it |

## 4. Subtext

John, who never looks up, is worried. The full bowl says it; the broom starts again as a way of not showing it.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | the cat's empty spot and a full bowl, the shop bell |
| 2 | 4-10 | Setup | "Turfton FM says a quiet day. Asphalt disagrees." "She is gone. So is the bottlecap." |
| 3 | 10-17 | Turn | "Bowl is full. She has never left a full bowl." Then three sightings |
| 4 | 17-25 | The job | "Me?" "You have cracked a lot of hats. Crack nothing. Look." |
| 5 | 25-30 | Button | "Bring her back quietly. She hates a fuss." The empty spot again |

## 6. Shot list

`coverage('john','player',1)`: John's singles on +25, the player's reactions on -25. The hook and the button are the same still
insert (the prologue's and epilogue's cat insert), so the room's barometer reads the same way in all three scenes. One `pushIn` on
the job; one high angle for the last line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| John | Turfton FM says a quiet day. Asphalt disagrees. | the chorus: radio gossip, dry |
| John | She is gone. So is the bottlecap. | |
| Player | Asphalt? | |
| John | Bowl is full. She has never left a full bowl. | the stakes |
| John | Three sightings. An alley, a dumpster lid, my roofline. | the objective |
| Player | Me? | |
| John | You have cracked a lot of hats. Crack nothing. Look. | the "Previously" |
| John | Bring her back quietly. She hates a fuss. | button |

## 8. Music and sound

No music (a flat, deadpan open); the `street` bed; the shop `bell` at 0 s and a broom `crunch` when he starts sweeping again.

## 9. Blocking and vehicles

John at the stage mark (-80, 88) with his broom; the player at (-74.6, 90.4). A `serving-tray` bowl stands full beside the empty
crate spot at (-78.4, 88.4). John ends sweeping at (-80, 91).

## 10. The button

The empty spot again, and the bowl. Same picture as the hook, now a promise.

## 11. Self-check

- [x] Hook on a picture; no narration; one joke (the radio) and one worry (the bowl).
- [x] Lines under 16 words; John flat and short.
- [x] Checker: zero faults, in neither Variety nor Sound lists.
- [x] `direction.notes` points here.
