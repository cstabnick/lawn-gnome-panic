# Director's notes: `m38-pail-pond-outro`

| | |
| --- | --- |
| Scene | `m38-pail-pond-outro` in `src/cutscene/scenes/story/m38-pail-pond.ts` |
| Played by | quest `m38-pail-pond` (outro, at the lodge stove) |
| Kind and length | `outro`, aim 15-45 s |
| Where, when | stage `lodge-stove-dusk` (the lodge porch); dusk, sky golden |
| Before / after | after: fishing the radio out of Pail Pond. After: act III's part hunts, map in hand |

## 1. Purpose in the story
The act's map: four parts of the Grand Combine and where each is going (deck to Hedgeworth, guidance to Rootwell, power to Pinwheel Ridge, money to Trellisdown). The HOA says something true by mistake; Pip writes it on a sock. The four places are also in the doneText, so a skipped outro loses nothing.

## 2. The player's feeling
- **In:** cold hands, a frosted radio against the stove.
- **Out:** a plan with four crosses; a little awe at how big the thing is.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Gentian | keep the radio calm | Pip pokes it | "wakes slowly, like a bear" | offers forty socks |
| Pip | write it all down | he writes wrong first | scribbling | holds the sock map |
| Player | understand | none | "Four parts of what?" | the Combine in pieces |
| Dispatcher | read a run sheet | none | bored, official | says something true |

## 4. Subtext
The HOA's logistics are better organised than the crew. The sock is a joke and a plan at once.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | static ticking from a frosted box |
| 2 | 3-9 | Setup | "Do not poke it." "I am encouraging." |
| 3 | 9-26 | Dispatch | four lines: deck, guidance, power, money |
| 4 | 26-35 | Turn | Pip's four crosses; "four parts of what?" |
| 5 | 35-40 | Button | the sock map on the line with the others |

## 6. Shot list
Radio close; Gentian low-ish; Pip; the radio close and low for the dispatch (each line), a reaction cut between; the socks along the line for the button.

## 7. Dialogue pass
The dispatcher's four lines are one beat each and name the parts in the doneText's order of reading. Pip's "I need a bigger sock." / "I have forty." is the laugh.

## 8. Music and sound
`mystery` out for the dispatch, back at the turn; static at the radio, clatter, paper; a reveal stinger on "money goes to Trellisdown".

## 9. Blocking and vehicles
Radio on a crate by the stove; Pip kneels beside it; Gentian arms folded; the player warms at the stove. The sock map spawns on the crate when Pip starts writing.

## 10. The button
The sock map hung among the drying socks, four red crosses: the next ten quests on a clothesline.

## 11. Self-check
- [x] The four parts are in the lines and the doneText. [x] Dispatcher is a voice: speaker-unseen waived. [x] `scenes.test.ts` passes.
