# Director's notes: `m47-hedgeworth-links-outro`

Watch it at `?no-intro&cutscene=m47-hedgeworth-links-outro`.

| | |
| --- | --- |
| Scene | `m47-hedgeworth-links-outro` in `src/cutscene/scenes/story/m47-hedgeworth-links.ts` |
| Played by | quest `m47-hedgeworth-links` as its outro, after the hole and Thrift's tour, on the clubhouse lawn |
| Kind and length | `outro`, aim 20-40 s |
| Where, when | stage `hedgeworth-putting-lawn`, dusk, `sky: 'golden'` |
| Before / after | before: the hole won and the tour of the grounds. After: The Groundskeeper's Secret (#48) |

## 1. Purpose in the story

Peony changes from tenant to something that listens. It is a nod, not a speech. Basil, who lost, replays the last putt alone
in the gold light and takes the mulligan he swore did not exist. The course is the crew's for a week, and the next quest
(the moles under the ninth green) is already waiting in the grass.

## 2. The player's feeling

- **In:** they won the hole and walked the grounds.
- **Out:** warmed by an ally's small gesture ("say it again, quieter"), amused by Basil's mulligan.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Basil | to sink the putt he missed | a hole that "considered" | blames a mole, calls it practice | pockets the ball, unseen |
| Peony | to keep her word without breaking her fear | the mortgage | dry reminders, a nod, a quiet invitation | openly listening |
| The player | to ask about Vesper | Peony's old rule | "About Vesper..." | is cut off, kindly |

## 4. Subtext

- "Say it again, quieter" means she is on their side and cannot say so loudly.
- "A mole did that" is Basil's grudge, planted for #48.

## 5. Beat sheet

| # | Beat | What happens |
| --- | --- | --- |
| 1 | Hook | ground-level on the flagstick; a tap; the ball runs the line and circles the lip |
| 2 | Setup | Basil: "A mole did that." Peony: "No mulligans, Basil." "Practice." |
| 3 | Turn | Peony turns to the player and nods, a held silence; "The course is yours for a week." |
| 4 | Button | "About Vesper..." / "I have not heard a word. Say it again, quieter." The ball goes into his sock |

## 6. Shot list

`cup-low` (stage) as the hook; `coverage('basil','peony',1)` low and eye singles; `coverage('peony','player',-1)` for the nod
and the invitation, with a `pushIn` on the last line; `putter-high` and `lawn-wide` (stage) to close.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Basil | A mole did that. A mole did that, I tell you. | his catchphrase |
| Peony | No mulligans, Basil. | pays off the intro |
| Basil | Practice, Dame Peony. This is practice. | |
| Peony | The course is yours for a week. | after a nod and the one held silence |
| Player | About Vesper... | |
| Peony | I have not heard a word about Vesper. Say it again, quieter. | the turn in her arc |

## 8. Music and sound

`turfton-dusk` music with the `garden` bed; the putt is a `tap`, a `clink` at the lip, a `cloth` rustle for the sock. One held
silence (Peony's nod). No stinger.

## 9. Blocking and vehicles

Basil at (-1064.6, 475.2) bent over the ball at (-1066.3, 475.7), flag at (-1070.4, 476.6); Peony at (-1057.6, 471.4); the
player at (-1060, 478.4). Basil walks to the ball after the last line and lifts it. No vehicles.

## 10. The button

The wide at dusk with Basil's hand at his sock, the ball gone. It is the right last moment: Peony has changed in the open and
Basil has not changed at all, and both are right.

## 11. Self-check

- [x] Hook within 3 s on the picture (the ball); no narration.
- [x] Every line under 16 words; the sincere beat is a nod, with no explanation.
- [x] One held silence; no stinger.
- [x] Peony's arc given in a gesture and one line; Basil's secret (a spare ball in his sock) shown, not said.
- [x] Dusk scene lit by `golden` sky.
- [x] `direction.notes` points here.
