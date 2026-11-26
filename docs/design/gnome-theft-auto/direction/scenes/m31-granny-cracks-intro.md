# Director's notes: `m31-granny-cracks-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=m31-granny-cracks-intro`.

| | |
| --- | --- |
| Scene | `m31-granny-cracks-intro` in `src/cutscene/scenes/story/m31-granny-cracks.ts` |
| Played by | quest `m31-granny-cracks` ("Granny Cracks") as its intro, given by Bramble at the farmhouse (giver `granny-farmhouse`) |
| Kind and length | `intro`, aim 30-60 s; now 26.6 s |
| Where, when | stage `granny-storm-cellar` (the cellar mouth, the yard, the barn gate), noon, `sky: 'noon'` |
| Before / after | before: Cam's night; after: the crack of the two bailiffs in the yard, then Granny |

## 1. Purpose in the story

Granny, the player's one kitchen table, has been chipped at a foreclosure. The scene hands over the job in Bramble's own
whisper ("Don't look up. Just listen.") while two HOA men nail a notice to the barn gate across the yard: the threat is
in the picture, the stake is in the line. The dented pie tin in the pumpkin patch is the small story (Granny's pie,
thrown). The tone steps from Cam's wry night to a sincere one.

## 2. The player's feeling

- **In:** unsuspecting; the farm was safe earlier in the act.
- **Out:** worried and cold-angry; sure of the job: crack the two, then carry Granny gently.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Bramble | to get the player to deal with the bailiffs and Granny, and not be seen | the bailiffs in the yard; his fear of the sky | whisper, flat farm vowels, "Don't look up" | closes the cellar door on himself |
| The player | to know how bad it is | Bramble's economy of speech | two short questions | takes the job |
| Bailiffs | to hang the notice | none | mallet, clipboard, no lines | cracked (the objective) |

## 4. Subtext

Bramble's "Cracked. Not broken." is a man who carried a friend. "Like peaches. Cellar peaches." is how a farmer says gently.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | The mallet on a nail across the yard; Bramble's low whisper. |
| 2 | 4-10 | Setup | "They came at dawn. They cracked Granny." The yard: the notice goes up. |
| 3 | 10-16 | Complication | "Is she all right?" "Cracked. Not broken. She would not leave the farmhouse." |
| 4 | 16-23 | Turn | The push-in: the two at the gate, then the clinic. |
| 5 | 23-27 | Button | "How gently?" "Like peaches. Cellar peaches." The cellar door latches. |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | `spot(cellar-wide)` | the yard | establishing, with the knock |
| 2 | `WHISPER.single('bramble','mcu', low)` | Bramble | the whisper |
| 3 | `spot(yard-far)` | the bailiffs at the gate | what he is whispering about |
| 4 | `WHISPER` singles | player, Bramble | the exchange, one side of the line |
| 5 | `pushIn('bramble','mcu')` | Bramble | the job |
| 6 | `WHISPER.single('bramble','ms', low)` | Bramble | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Bramble | Don't look up. Eyes on the dirt. Listen. | his tic, varied from the existing "Don't look up. Just listen." |
| Bramble | They came at dawn. They cracked Granny. | |
| Player | Is she all right? | |
| Bramble | Cracked. Not broken. She would not leave the farmhouse. | |
| Bramble | Two are still at the gate. Crack them quiet. | the job |
| Bramble | Then carry her to the clinic. Gently. | |
| Player | How gently? | |
| Bramble | Like peaches. Cellar peaches. | the button (characters.md: "Cellar's got peaches.") |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `tension` music, `wind` ambience, mallet `knock` | the sincere tone |
| 10 | two more `knock`s | the notice goes up |
| 25 | `latch` | the cellar door |

## 9. Blocking and vehicles

Bramble at the cellar mouth (-59.4, 352.6), the player at (-54.2, 350.4). The bailiffs at (-47.6, 333.8) and (-43.4, 334.8): one with a mallet, one with a clipboard. Props: the `notice-board` at the barn gate, the `pie-tin` in the patch. Bramble steps back into the cellar at the end.

## 10. The button

Bramble: "Like peaches. Cellar peaches." and the latch of the cellar door. A gentle laugh at the end of the one sincere intro in the run, and the tapping of the mallet carries on.

## 11. Self-check

- [x] Want, obstacle, turn, button.
- [x] Hook (a sound and a whisper) by 3 s.
- [x] Every line under 12 words.
- [x] Bramble sounds like his entry; the player says two short things.
- [x] One side of the line; the yard is a cutaway.
- [x] Bramble's tic varied, not repeated.
- [x] `npm run cutscene-report` OK; `direction.notes` points here.
