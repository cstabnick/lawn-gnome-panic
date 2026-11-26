# Director's notes: `m47-hedgeworth-links-intro`

Watch it at `?no-intro&cutscene=m47-hedgeworth-links-intro`.

| | |
| --- | --- |
| Scene | `m47-hedgeworth-links-intro` in `src/cutscene/scenes/story/m47-hedgeworth-links.ts` |
| Played by | quest `m47-hedgeworth-links` ("Hedgeworth Links") as its intro, given by Dame Peony on the clubhouse terrace |
| Kind and length | `intro`, aim 30-60 s |
| Where, when | stage `hedgeworth-veranda` (the clubhouse terrace), day, `sky: 'noon'` |
| Before / after | before: the Anthill (#46), the radio's warning that the Combine's deck will be tried here. After: the walk to the first tee and the hole against Basil |

## 1. Purpose in the story

The act's hunt for the Combine's deck reaches the place it will be tested, and the owner will not hear a word against the
woman who holds her mortgage. It introduces Dame Peony (a card) and Basil Divot (a card), sets the challenge (one hole,
no mulligans, which the outro pays off) and shows Peony's fear in one gesture: she drinks, and does not look at the letter.
Peony's arc: Vesper's tenant now, an ally by the outro.

## 2. The player's feeling

- **In:** the crew is on the run and the radio has said the deck is tested here; they walk into a tea party.
- **Out:** amused by Peony's crisp refusal, sure of the job (beat Basil on one hole), and a little sorry for her.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Peony | to keep Vesper's name out of her ears and her course open | the player, who has come to say it | clipped, aristocratic, a drink in hand | sets a condition instead of a ban |
| The player | to warn her | her refusal | one dry line | accepts the hole |
| Basil | to win in front of the boss | a stranger | smooth, patronising, "champ" | takes the match |

## 4. Subtext

- "She holds my mortgage, you understand" is the whole fear: Peony cannot afford to be right.
- "Do mind the mortgage" is her one joke, and a plea.
- Basil's "no mulligans" plants the outro: he will take one in private.

## 5. Beat sheet

| # | Beat | What happens (picture first, then words) |
| --- | --- | --- |
| 1 | Hook | the terrace wide, a far tock, one tweed figure with a glass; Peony's first line; her card |
| 2 | Setup | the deck, the letter, the mortgage; Basil walks in from the tee |
| 3 | Turn | "Not one word against Vesper." |
| 4 | Terms | Basil's card; Peony: beat him on one hole; "No mulligans"; "Deal." |
| 5 | Button | "Do mind the mortgage."; they go; Peony alone, thinking, the glass at her lip |

## 6. Shot list

`veranda-wide` stage camera; `coverage('peony','player',1)` singles with a `pushIn` on the refusal; `coverage('basil','player',1)`
singles (one low); `coverage('peony','basil',-1)` for her terms; a `reaction` on Basil; the `tee-away` stage camera for the
exit; a low mcu on Peony to end. Crossings: none (each pair has its own side).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Peony | You have the look of a gnome about to say something about Vesper. | her card follows |
| Player | Her Combine is testing its deck on your course. | |
| Peony | So her letter says. A courtesy. She holds my mortgage, you understand. | |
| Player | It will cut everything. Every lawn. | |
| Peony | Not one word against Vesper. One does not bite the hand that holds the deed. | the refusal |
| Basil | Is our guest being difficult, Dame Peony? | his card follows |
| Peony | Beat Basil on the first hole, and I shall hear every word. | |
| Basil | One hole, champ. No mulligans. Plenty of room to lose by a stroke. | his lines in the bible |
| Player | Deal. | |
| Peony | Off you go. And do mind the mortgage. | her line in characters.md |

Names checked: `npm run lore -- find "Peony"`, `"Basil Divot"`, `"Hedgeworth"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `warm` music, `garden` ambience | a polite afternoon |
| 0.1 | `tap` far off | the tock of a ball: the course is in use |
| mid | `drink` | she sips on the mortgage line |
| end | `clink` | the glass set down, her tell |

No stinger: the card stingers are the accents.

## 9. Blocking and vehicles

Peony at (-1060, 462) facing south; the player at (-1059, 466.4) facing her; Basil walks in from the first tee to
(-1066.4, 467.6) and leaves the same way. The player ends at (-1070, 471) walking to the tee. A tea trestle with an unlifted cake
stands on the terrace (stage set, seen only here).

## 10. The button

Peony's low mcu, the glass at her lip, a small clink. She has not looked at the letter all scene, and it is the loudest thing.

## 11. Self-check

- [x] Want, obstacle, turn: Peony's refusal against the player's warning; Basil turns it into a hole.
- [x] Hook within 3 s (the tock and a line); no narration.
- [x] Every line under 16 words; nobody says what the picture shows.
- [x] Voices: Peony clipped ("my dear" kept for when she is displeased), Basil "champ".
- [x] One side of the line per pair.
- [x] Day scene; no stinger beyond the two cards.
- [x] `direction.notes` points here.
