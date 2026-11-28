# Director's notes: `m58-the-reeves-barn-outro`

| | |
| --- | --- |
| Scene | `m58-the-reeves-barn-outro` in `src/cutscene/scenes/story/m58-the-reeves-barn.ts` |
| Played by | quest `m58-the-reeves-barn` (The Reeve's Barn) as its outro, after the player sets the Whirligig down at the barn |
| Kind and length | `outro`, aim 15-45 s; about 31 s at Normal text speed |
| Where, when | stage `m58-barn-yard`: the yard in front of the Reeve's hay barn, Pebblewick, dusk (`sky: 'golden'`) |
| Before / after | before: the flight from Hangar Two to the tin water tower and the landing; after: Pip's next call and the road back (the Whirligig stays in the barn and can be fetched from it) |

## 1. Purpose in the story

The Whirligig is hidden. A tarp over a rotor, a reeve who insists nothing was ever in the barn, and the town's bell rung once for
the water: the row's comedy and its heart in one scene, in that order. The bell is not a joke. It is what Pebblewick does when it
gets something back, and the crew did that: it is the first time in the act that the coalition gives a town something (the pump)
rather than taking something (the fort, the part).

## 2. The player's feeling

- **In:** pleased and a bit out of breath: the part is in, the sun is going down, the helicopter is in a barn.
- **Out:** quiet. Warm. A small sound travels across a town and the player did that.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Reeve Yarrow | to hide the aircraft and keep the minutes clean | the aircraft is two metres from his barn door and in plain sight | ceremony: thanks in writing, a tarp, a denial | after the bell he stops performing: he tips his hat to the sound |
| The player | to get the helicopter out of sight | none left | an arm on a tarp corner; a one-line question | the one who made the bell ring |
| Pip (radio) | to be told it's safe | none | a quick, anxious question | "...Sure." |

## 4. Subtext

- "In writing": Yarrow thanks people in the form he can enforce.
- "Nobody noticed. There was never anything in the barn." is a reeve inventing a past, and Pip hears how it is done: "...Sure."
- The bell is rung by someone in the square: the town heard the pump, and they ring it for the water, not for the crew. Yarrow's hat is
  for the town.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Low on the yard at dusk: the rotor ticking down over the hay, the barn doors in gold, a hen. |
| 2 | 3-11 | Setup | "The pump is humming. Pebblewick thanks you. In writing." "Where does she go?" "In the hay, under this. On three." |
| 3 | 11-14 | The tarp | Wide: both pull; the cloth goes up, falls, settles over the rotor (three frames, 0.4 s each). |
| 4 | 14-23 | The gag | Pip, on the radio: "Is she hidden? Did anybody notice?" "Nobody noticed. There was never anything in the barn." "...Sure." "Noted." |
| 5 | 23-28 | The quiet | Music out, a water sound comes up; the long lens over the roofs to the tin tower, gold. The bell, once. |
| 6 | 28-31 | Button | Yarrow, in profile, tips his hat to the sound. Fade. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `door` | 46, low, from the south | locked | the rotor, the barn doors | hook |
| 2 | `YARD_TALK.single('yarrow','mcu',{height:'low'})` | 35 | locked | Yarrow | the thanks |
| 3 | `YARD_TALK.single('player','mcu')` and back to Yarrow | 35 | locked | the exchange | the question; the instruction |
| 4 | stage camera `wide` | 50 | locked | the Whirligig, both of them, the barn | the tarp throw (the widest shot that shows the whole action) |
| 5 | `YARD_TALK.single('player','mcu',{height:'low'})`, then `pushIn('yarrow','mcu',3.4)` | 35 | slow push on Yarrow | the radio exchange | the gag, held |
| 6 | `YARD_TALK.single('yarrow','cu')` | 30 | locked | Yarrow | "Noted." |
| 7 | stage camera `tower` | 28 (long lens) | locked | the tin water tower, gold | the quiet; the bell |
| 8 | `frame yarrow ms side -55` | 40 | locked | Yarrow in profile | the button |

Yarrow and the player share `coverage('yarrow','player',-1)`.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Yarrow | The pump is humming. Pebblewick thanks you. In writing. | "In writing" is his version of a hug |
| Player | Where does she go? | |
| Yarrow | In the hay, under this. On three. | the tarp; counts, no number said |
| Pip (radio) | Is she hidden? Did anybody notice? | off-screen, radio static |
| Yarrow | Nobody noticed. There was never anything in the barn. | rung three of the barn ladder |
| Pip (radio) | ...Sure. | a whole life of covering for Tansy in one word |
| Yarrow | Noted. | the tic |

No line after the bell. The scene's last sound is the bell, then a gesture.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `turfton-dusk`, `wind`; `flutter` (hay), `creak` | the end of a long day |
| 12.0-12.8 | `cloth`, `flutter`, `thud` | the tarp up, falling, down |
| 14.6 | `static` | the radio in the player's pocket |
| 23.9 | music out (1.4 s fade), `water` bed in (2.0 s) | the pump's water, a hush; the one held quiet of the scene |
| 25.5 | `bell` (at the town hall rope, gain 1.0), once | the bell |

No stinger. The quiet is the cue.

## 9. Blocking and vehicles

The Whirligig (`from: 'player'`, so it is the one they flew) at (706, 47) facing south, in front of the barn doors (the stage's set:
`croft-barn` at (706, 34), haystacks and bales round the yard). Yarrow walks in from the south-west to (699.4, 52.6); the player
stands at (712.2, 53.6). The tarp is a moss rug in three frames at 3.7, 3.0 and 2.5 m over the rotor. A lantern post stands at (711, 56.4).
The player ends on foot beside the Whirligig.

## 10. The button

A reeve in profile in the last gold light, touching his hat to a bell he can hear from a hundred metres away. The right last
moment because nothing is explained and nothing is joked: the town got its water.

## 11. Self-check

- [x] Want (hide it, keep the minutes clean), obstacle (it is in plain sight), turn (the gag, then the bell).
- [x] Hook in 3 s: the rotor ticking, the hen.
- [x] Every line 11 words or fewer; no waypoints.
- [x] Yarrow's tic "Noted."; Pip is a radio voice only.
- [x] Speakers MCU or closer; one side of the line; one held quiet; no gag on top of the bell.
- [x] One gag (the barn), one sincere beat (the bell), in that order.
- [x] Dusk scene is lit: `golden` sky and a lantern post in the yard.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
