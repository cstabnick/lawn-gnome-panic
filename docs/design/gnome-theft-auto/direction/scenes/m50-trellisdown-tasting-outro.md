# Director's notes: `m50-trellisdown-tasting-outro`

| | |
| --- | --- |
| Scene | `m50-trellisdown-tasting-outro` in `src/cutscene/scenes/story/m50-trellisdown-tasting.ts` |
| Played by | quest `m50-trellisdown-tasting` (Trellisdown Tasting), as its `outro`, when the player slips out of the manor gate |
| Kind and length | `outro`, aim 15-45 s; about 34 s at Normal text speed |
| Where, when | stage `manor-gate-night`: the stone gate piers and the vineyard lane, a carriage lamp on one pier, night (`sky: 'night'`) |
| Before / after | before: the long look on the terrace; after: 650 acorns, part 3 of 4 (money) taken, Brassknock Manor on the map |

## 1. Purpose in the story

Chicory Snips, the Countess's servant and conscience, counts seven waiters at a gate and lets the seventh go
(characters.md: "lets the player slip out past the guards at the tasting"). A dry, sad gentleman does the kindest thing
he is allowed to do and says the only sorry he can: the Dew was never his to burn. The scene ends on the photograph: a
ledger page, the Countess's signature.

## 2. The player's feeling

- **In:** the held breath after Vesper's look; a tray that will not stay level.
- **Out:** let off, a little ashamed to be relieved, and holding the proof. Tension 6.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Chicory Snips | to do his job and not do it | the Countess; his own history with the Dew | exact, dry, a sigh at the end of a sentence | lets the player go, and says sorry sideways |
| The player | to walk out with the camera | a gardener with a lantern | stillness; "Thank you." | tips the hat |

## 4. Subtext

- "I was told to count the waiters. Not to read the trays." is the whole scene: a rule he keeps while breaking its point.
- "The Dew was never mine to burn" is the apology he owes Granny and cannot say to her; he says it to the gnome who can.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | Gravel, a stride, a lantern coming up in the gap; the player stops with the tray level. |
| 2 | 6-18 | Setup | "The list says six waiters. I have never had a seventh." He walks up. "A waiter folds the napkin inward. You folded it over something." |
| 3 | 18-24 | Turn | The corner is lifted, and put back. "I was told to count the waiters. Not to read the trays." "Thank you." |
| 4 | 24-29 | Sincere | "Mind the lane. The Dew was never mine to burn." The player tips his hat. No gag on top. |
| 5 | 29-34 | Button | He straightens a tendril on the pier; the signed page in the lamp, one caption. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `gate` | 50 | locked, from the lane | the gap and the two of them in it | hook |
| 2 | `CH_YOU.single('chicory','mcu',{height:'low'})` | 35 | locked, low | Chicory | his first line |
| 3 | `CH_YOU.single('player','mcu')` | 35 | locked | the player | reaction, held pause |
| 4 | `CH_YOU.single('chicory','ms')` | 40 | locked | Chicory crossing | he walks up |
| 5 | `CH_YOU.single('chicory','mcu')` | 35 | locked | Chicory | the napkin line |
| 6 | `shot('chicory','cu',{height:'high',side:25})` | 30 | looking down | the tray and his hand | the corner lifted |
| 7-10 | `CH_YOU` singles | 35 | locked | Chicory, the player | the sincere exchange |
| 11 | stage camera `wide`, then a cut on the page | 50 / 30 | locked | the gate; the ledger page | the button |

All on `coverage('chicory','player',1)`; no crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Chicory | The list says six waiters. I have never had a seventh. | dry; the call at the objective said "one more than ordered" |
| Chicory | A waiter folds the napkin inward. You folded it over something. | exact |
| Chicory | I was told to count the waiters. Not to read the trays. | the rule and the kindness |
| Player | Thank you. | two words |
| Chicory | Mind the lane. The Dew was never mine to burn. | the sincere line, with a small sigh |

Caption: "W. Brassknock. The Combine, third part: the money. Six harvests, paid and signed." (the one narration in the scene).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `garden` bed, `sad` music | Chicory's sad scene; the tasting's string tune far behind |
| 1 | `crunch` | gravel |
| 12, 15 | `cloth` | the napkin |
| 30 | `rustle`, then `snap` on the page | the tendril; the photograph |

## 9. Blocking and vehicles

Chicory with a lantern at (-1147.4, -14.2) in the lane, walks to the player and faces them; the player in the gap between
the piers at (-1150.6, -9.6), tray level; at the end the player walks out into the lane. A lamp post stands on the pier side;
the page (`ledger-book`) is shown close in the last cut only.

## 10. The button

The photograph, lit by one lamp: a signature and a line of figures. The last sound is the shutter, and then crickets.
It is the right image because the whole quest was a costume for the sake of that page.

## 11. Self-check

- [x] Want (to let go without saying so), obstacle (his orders), turn (the napkin put back).
- [x] Hook in 3 s: a lantern in the gap.
- [x] Every line 12 words or fewer; no coordinates.
- [x] Chicory dry, exact, sad; the player two words.
- [x] Speakers MCU or MS, facing the lens (Chicory turns to the player after his walk).
- [x] One side of the line.
- [x] One track, no stingers, one caption.
- [x] Chicory's apology planted for #65.
- [x] Night scene is lit: lantern, pier lamp, a white-shirted waiter.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
