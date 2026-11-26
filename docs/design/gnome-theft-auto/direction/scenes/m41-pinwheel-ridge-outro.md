# Director's notes: `m41-pinwheel-ridge-outro`

Watch it at `?no-intro&cutscene=m41-pinwheel-ridge-outro`.

| | |
| --- | --- |
| Scene | `m41-pinwheel-ridge-outro` in `src/cutscene/scenes/story/m41-pinwheel-ridge.ts` |
| Played by | quest `m41-pinwheel-ridge` as its outro, after the last crank at Whirly Bob |
| Kind and length | `outro`, aim 20-40 s |
| Where, when | stage `pinwheel-last-mast` (the crest at Whirly Bob); dusk, `sky: 'golden'` |
| Before / after | before: the last pinwheel spun by hand. After: the Rutbottom Impound (`m42`); W10 fires: the ridge turns and Turfton's neon is brighter |

## 1. Purpose in the story

Part one of four, power, is cut. The picture is the payoff of the act's first hunt: ten pinwheels turning at dusk, the
valley dark below, and the lights steady far away. It is the first time the crew's effort changes what the whole map looks like.

## 2. The player's feeling

- **In:** hands sore from the crank, three fights behind them.
- **Out:** warm and a little proud; they know power is done, three parts to go; they like Ragwort.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Ragwort | to hear all ten turning | none left | quiet numbers, then a small joke | her ridge is hers again |
| The player | to know it is done | none | one question | has the answer |

## 4. Subtext

She says "I forgot how loud that is" and means that she had forgotten what winning feels like.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | a low dolly, dusk light on the crest, the whirr of ten pinwheels building |
| 2 | 4-14 | Setup | Ragwort: "All ten. I forgot how loud that is." The player: "Is it done?" Ragwort: part one of four, power, cut |
| 3 | 14-20 | Turn | the view: a dolly toward Turfton, far down the valley; the steady glow, W10 |
| 4 | 20-30 | Button | "There. Steady. The wind was always willing." Then the thermos: "Tea is cold. Naturally." |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | dolly low, up through the blades | 56 | slow | the rotors | the sound and the dusk |
| 2 | `shot('ragwort','mcu')` | 35 | locked | Ragwort | the first line |
| 3 | `OR.single` | 35 | locked | the player / Ragwort | the exchange |
| 4 | dolly south | 46 | slow | Turfton, far away | the view and the payoff |
| 5 | `OR.single('ragwort','mcu')`, `ms` | 35/40 | locked | Ragwort | the last two lines |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Ragwort | All ten. I forgot how loud that is. | the sincere beat |
| Player | Is it done? | |
| Ragwort | Power is cut. Part one of four. The Combine charges at nought percent. | the part-one-of-four line; her numbers |
| Ragwort | There. Steady. The wind was always willing. | the radio line from W10, said by the person who earned it |
| Ragwort | Tea is cold. Naturally. | the small joke lands last, after the view |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `warm`, `wind` | the win |
| 0-4 | `whoosh` on the rotors | ten pinwheels building |
| 14 | `turfton-dusk` | the town, from far |
| 16 | `bell` | a far chime for the neon |
| 22 | `pour` | the thermos |

## 9. Blocking and vehicles

The player at (925.5, -1197) with a hand on the crank; Ragwort at (921.5, -1197.6) with a mug, looking south. No vehicles.

## 10. The button

Ragwort, tea in hand: "Tea is cold. Naturally." The ridge turns behind her.

## 11. Self-check

- [x] A turn: the view.
- [x] Hook in 3 s on sound and light.
- [x] Lines under 16 words; "part one of four" said once.
- [x] Dusk, lit (`sky: 'golden'`).
- [x] `direction.notes` points here.
