# Director's notes: `m58-the-reeves-barn-intro`

| | |
| --- | --- |
| Scene | `m58-the-reeves-barn-intro` in `src/cutscene/scenes/story/m58-the-reeves-barn.ts` |
| Played by | quest `m58-the-reeves-barn` (The Reeve's Barn), as the `scene` of its first visit objective, when the player reaches Reeve Yarrow on the market square (Pip's call at the overlook is the briefing; the player drives out to meet him) |
| Kind and length | `intro`, aim 30-60 s; about 61 s at Normal text speed (a hair over the aim: the pails cutaway and the bit of Yarrow's tidy bureaucracy are the point of the row) |
| Where, when | stage `m58-pebblewick-square`: Pebblewick's market square, day (`sky: 'noon'`) |
| Before / after | before: Pip's briefing call ("Previously: we stole the Whirligig, and Diggs is hunting it") and the drive east on Route East; after: the drive to Hangar Two for the impeller |

## 1. Purpose in the story

The first Pebblewick row of the act, and Reeve Yarrow Potsherd's first card. It does three jobs: (1) puts a stake on the
barn (the town's water goes at sunset unless the pump runs), (2) plants the row's comedy (a barn that has always been empty,
a helicopter that has never been), and (3) shows the town's character: a place that has "a bell, a bus and a reeve" and
asks nobody for anything, until a letter arrives. Setup for the outro's bell, and for row 61 (Diggs's neighbour).

## 2. The player's feeling

- **In:** a ride out to the far edge of the Flats with a stolen helicopter on their conscience and nowhere to hide it.
- **Out:** amused and oddly moved by a town that is organised enough to be in trouble; a clear errand and a clock (sunset).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Reeve Yarrow | to save the pump (and the town's water) without asking for help | pride, and the Association's letter | formal clauses, the minutes' diction, a pre-emptive denial | asks, in a way that lets nobody say he asked: "I do not ask which" |
| The player | to find somewhere to put a helicopter | a reeve who will not admit what a barn is for | short questions that walk him into the answer | takes the job |

## 4. Subtext

- Yarrow is proud: he has never asked Turfton for anything. The barn offer is a trade, not charity ("with conditions").
- "There has never been a helicopter" is him agreeing to hide it before it exists. The denial is the consent.
- "I do not ask which" (route) is how a neutral town says yes to a thing it will deny: he wants no knowledge in the minutes.
- He sweeps in neat stripes because nothing else in the town is in his control. He sweeps the player's footprints at the end.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A broom on dry sand, stripe by stripe; a bell rope creaking somewhere; a town holding its breath. |
| 2 | 3-14 | Setup | "Good day. Thank you for your patience." The card. "We have a bell, a bus and a reeve. And now, a letter." |
| 3 | 14-27 | The stake | "A letter?" The clipboard insert, pen on its string. "The Association cuts our water at sunset." Cutaway: a pail tips over at the well, empty. "It has seized every summer. This summer, they noticed." |
| 4 | 27-40 | The gag | "Pip says you have a barn." "I have a barn. It is empty. It has always been empty." "Big enough for a helicopter?" Held cu. "There has never been a helicopter. Noted." |
| 5 | 40-55 | Turn | "Fix the pump before sunset, and the barn is yours. With conditions." "Conditions?" Wally, Hangar Two, the impeller, "the shortest route. I do not ask which." |
| 6 | 55-61 | Button | "Mind the stripes." The player walks out; Yarrow sweeps their footprints away, one stripe behind, broom on the sand. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `wide` | 50, from the south-east corner | locked | the square, Yarrow small and tidy | hook |
| 2 | `TALK.single('yarrow','ms',{height:'low'})` | 40 | locked, low | Yarrow | the greeting; the card |
| 3 | `TALK.single('yarrow','mcu')` | 35 | locked | Yarrow | bell, bus, reeve; the letter |
| 4 | `TALK.single('player','mcu')` | 35 | locked | the player | "A letter?" |
| 5 | `insert('yarrow',{toward:'player'})` | 30, cu, high | locked | the clipboard in his hands | the insert, 1.6 s |
| 6 | stage camera `well` | 46, low | locked | the row of tin pails | the cutaway; the empty pail |
| 7 | alternating `TALK.single('yarrow'/'player','mcu')`, one `cu` for the helicopter line, one low on the player's helicopter question | 35 / 30 | locked | the exchange | one side of the line for the whole scene |
| 8 | `pushIn('yarrow','mcu',4,{toward:'player'})` | 35 -> 30 | slow push | Yarrow | the turn: the condition |
| 9 | `TALK.single('yarrow','ms')` then stage camera `wide` | 40 / 50 | locked | Yarrow, then the square | the button |

Yarrow and the player share `coverage('yarrow','player',1)`; no crossing. The wide at the end is the same camera as the hook.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Yarrow | Good day. Thank you for your patience. | his bible entry: formal, thanks you for your patience |
| Yarrow | We have a bell, a bus and a reeve. | the lore line (`pebblewick`, `yarrow-potsherd`), unchanged |
| Yarrow | And now, a letter. | beat before it; the clipboard comes up |
| Player | A letter? | the only way in |
| Yarrow | The Association cuts our water at sunset. The pump is non-compliant. | the stake |
| Yarrow | It has seized every summer. This summer, they noticed. | character: the pump's history is the Association's grudge |
| Player | Pip says you have a barn. | one-breath context |
| Yarrow | I have a barn. It is empty. It has always been empty. | pre-denial, rung one |
| Player | Big enough for a helicopter? | the player walks into it |
| Yarrow | There has never been a helicopter. Noted. | rung two; his tic ("Noted.") |
| Yarrow | Fix the pump before sunset, and the barn is yours. With conditions. | the offer |
| Player | Conditions? | one word |
| Yarrow | Wally keeps a spare impeller at Hangar Two. Bring it by the shortest route. | the job; the hangar is the crew's (R-234) |
| Yarrow | I do not ask which. | the wink |
| Yarrow | Mind the stripes. | the button; he sweeps them out |

Names checked: `npm run lore -- find Pebblewick`, `Yarrow`, `Hangar Two`, `Wally`. The "bell, bus and reeve" line is the lore's. No new
facts invented beyond the pails and the clipboard (props).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `warm` music, `wind` bed | a tidy town with a small comic problem |
| 0.0 | `rustle` (the broom), `creak` (the bell rope, far, quiet) | the hook; the bell is planted, not rung |
| 5.5 | `intro` card (stinger from the step) | Yarrow's first card |
| 16.2 | `paper` | the clipboard |
| 22.3 | `clatter` (a pail, empty) | the cutaway |
| 57.0 | `rustle` | the broom follows the footprints |

The bell is only a creak here. It rings once in the outro; it must not ring in this scene.

## 9. Blocking and vehicles

Stage marks: Yarrow (672.8, 109.6) with a broom, walking to (675.6, 106.6) as the player arrives at (677.8, 104.0). He holds the
`hoa-clipboard` from the line "And now, a letter." and the broom again for the button. Four `tin-pail` props stand at the well's
south-east side (683.6..686.1, 91.5..95.4). The player leaves toward the Route East road side, (684, 100), and ends on foot, where the
quest's next objective starts. No vehicles.

## 10. The button

Yarrow with his broom, sweeping the player's footprints out of the sand a stripe behind them, and the stripes closing over. The
town does not know the player was here. Nothing was ever here: the scene's joke, and the row's.

## 11. Self-check

- [x] Want (save the pump without asking), obstacle (pride, the letter), turn (the condition).
- [x] Hook in 3 s: broom, bell rope.
- [x] Every line 14 words or fewer; no coordinates or waypoint read-outs ("Hangar Two" is a place in a sentence).
- [x] Yarrow in his bible voice; the player's lines are one to six words.
- [x] Speakers MCU or closer (one MS, low); one side of the line; no more than three Yarrow lines in a row.
- [x] One gag ladder (the barn), one cutaway, no stingers beyond the card.
- [x] `npm run cutscene-report` OK; line of sight passes (`scenes.test.ts`).
- [x] `direction.notes` points here.
