# Director's notes: `m34-forty-seven-wrenches-intro`

| | |
| --- | --- |
| Scene | `m34-forty-seven-wrenches-intro` in `src/cutscene/scenes/story/m34-forty-seven-wrenches.ts` |
| Played by | quest `m34-forty-seven-wrenches` ("Forty-Seven Wrenches") as its intro, given by Pip at Side-Valve Salvage |
| Kind and length | `intro`, aim 30-60 s |
| Where, when | stage `side-valve-bay` (the apron and the bay front); day, `sky: 'noon'` |
| Before / after | before: the bench lock (row 33), Cam seen watching the code. After: the first passenger run, Granny at her farmhouse |

## 1. Purpose in the story

Act II's warm high point starts here. Pip, who has been quiet since the tablet, is loud again, and the crew has a reason to
be in one place: the Green is rezoned and the bay is still open. It sets the errand (three guests, three doors) and plants
"inventory", Tansy's word for her own party, which pays off in the mid scene.

## 2. The player's feeling

- **In:** the act has been grim; the player is tired of being sent to places.
- **Out:** amused, and glad to be sent for pie. They know the job: fetch Granny, Juniper and John.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | a party, today, with everyone | one ladder, one hand free, no Tansy yet | volume, answers a bigger question than the one asked | sends the player off, ladder wobbling |
| The player | to know what the bunting is for | Pip's enthusiasm | dry short questions | takes the errand |
| Cam | to look busy | nothing, he is in the corner | sweeps | still sweeping |

## 4. Subtext

Pip is happy because the crew is still together; he does not say it. Cam's broom is the thread: it is in the corner of every
Side-Valve scene.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Pip at the ladder's foot, banner in hand: "Hold the ladder! Not that one. The one I'm holding." |
| 2 | 5-12 | Setup | "What's the bunting for?" The Green is open; a party. |
| 3 | 12-19 | Turn | "Who's coming?" Granny, Juniper, John from the shop; pie is mandatory. |
| 4 | 19-26 | Plant | "Does Tansy know?" "She says it's not a party. It's an inventory." |
| 5 | 26-30 | Button | The ladder clatters; Pip flinches: "I'm fine! Granny first!" Cam sweeps on. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('pip','mcu', { toward: 'player' })` | 35 | locked | Pip | the hook is his line |
| 2-7 | `PP.single` of the player and of Pip, alternating | 35 | locked | each speaker | the exchange, one side of the line |
| 8 | `shot('pip','ms')` | 40 | locked | Pip and the ladder | the button |

Sides: Pip and the player on `coverage('pip','player', 1)`, no crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Hold the ladder! Not that one. The one I'm holding. | the joke is the logic |
| Player | What's the bunting for? | |
| Pip | The Green is open! Rezoned, ours, legal. We are having a party! | the reason, one breath |
| Player | Who's coming? | |
| Pip | Granny, Juniper, John from the shop. Go and fetch them. Pie is mandatory. | the job |
| Player | Does Tansy know? | |
| Pip | She says it's not a party. It's an inventory. She's coming! | plants "inventory" |
| Pip | I'm fine! Granny first! | the button |

Names checked: `npm run lore -- find "Founders' Green"` (R-xxx on the rezoned Green), `"Gnorwin"`.

## 8. Music and sound

`turfton` music, `street` bed. A creak on the ladder at the hook, a clatter on the button.

## 9. Blocking and vehicles

Pip at (-148.2, 72.4) beside the ladder prop at (-146.6, 73.6); the player at (-152.4, 69.2); Cam walks his broom between
(-156, 67.2) and (-153, 67.2). Bunting span half-hung along the bay front; a table with one pie tin set out far too early.

## 10. The button

The ladder answers for him. It is a gag, which is right: this is the connective, light scene, and the weight is in the mid.

## 11. Self-check

- [x] Hook on a character by 3 s; no narration; every line under 16 words.
- [x] One side of the line per pair; day scene.
- [x] Checker: zero faults (see the report).
- [x] `direction.notes` points here.
