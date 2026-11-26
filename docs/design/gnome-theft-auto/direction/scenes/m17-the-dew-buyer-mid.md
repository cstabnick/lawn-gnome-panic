# Director's notes: `m17-the-dew-buyer-mid`

| | |
| --- | --- |
| Scene | `m17-the-dew-buyer-mid` in `src/cutscene/scenes/story/m17-the-dew-buyer.ts` |
| Played by | quest `m17-the-dew-buyer`, a beat as objective 1 starts (right after the tail ends at the gate) |
| Kind and length | `arrival`, aim 10-35 s; 21.8 s |
| Where, when | stage `trellisdown-gate` (the arch, the lane and the first frost-pots); dusk (`sky: 'golden'`) |
| Before / after | before: the tail down the west highway. After: slipping into the vine rows to photograph the pots |

## 1. Purpose in the story

First reach of Trellisdown (E16). Chicory Snips lets the tanker in, and looks at the lane where the player is hiding. He
does not call out. The beat tells the player this place has a keeper, and that he is not the one to fear. Chicory's intro card (his first story
appearance) lands on his first line.

## 2. The player's feeling

- **In:** the long tail done, keyed up.
- **Out:** exposed, then spared; tension 5.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Chicory | to get the Dew in before the frost | the tanker is late; someone is watching | dry reproach | looks, says "Hm.", walks on |
| The player | to stay unseen | an open lane | stillness | seen, and let go |

## 4. Subtext

Chicory sees the player and does not mind: later (row 50) he will let them slip past the guards. Here it is a flicker of
doubt in a man who burns what he is handed.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | the stage camera: the arch, the tanker idling, a horn |
| 2 | 3-11 | Setup | Chicory: "Late. The frost does not wait for invoices."; his intro card; he beckons, the gate creaks |
| 3 | 8-13 | Action | tracking shot, the tanker rolls in between the two lines of pots |
| 4 | 13-18 | Turn | Chicory turns to the lane; "Hm."; the player's mcu |
| 5 | 18-22 | Button | Chicory, low ms, walks after the tanker |

## 6. Shot list

`spot('trellisdown-gate','gate')`; `coverage('chicory','player',-1)` for Chicory and the player; a `track` at 1.5 m from the
verge, fov 48.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Chicory | Late. The frost does not wait for invoices. | his dry precision |
| Chicory | Hm. | the sigh |

## 8. Music and sound

`tension` music, `garden` bed; the horn, `creak` of the gate, `crunch` of gravel.

## 9. Blocking and vehicles

The player kneels at the verge (-1122, -46); Chicory stands inside the arch at (-1140, -66); the unmarked tanker (plain
grey, a driver seated) idles at (-1140, -47), headlights on, and drives the `tanker-in` path to the press-house apron.

## 10. The button

Chicory's back, walking up between the pots. The player alone on the verge.

## 11. Self-check

- [x] Two lines; the picture does the work.
- [x] No coordinates or road names in the dialogue.
- [x] `direction.notes` points here.
