# Director's notes: `even-cut-hat`

| | |
| --- | --- |
| Scene | `even-cut-hat` in `src/cutscene/scenes/story/m70-even-cut.ts` |
| Played by | quest `ch5-even-cut` as a beat (`beats: { 2: 'even-cut-hat' }`): Vesper cracked, as the choice starts |
| Kind and length | `arrival`, aim 10-35 s (about 31 s) |
| Where, when | stage `e70-crossing`, the throne on the road at (3.5, -9), the choice beacons at (+-12, 0); day, `sky: 'noon'` |
| Before / after | before: the crack on Vesper. After: the choice (gold beacon west, Ending A; cyan east, Ending B) |

## 1. Purpose in the story

Clara's plea (row 66), staged exactly: a hairline crack, a still face, his top hat in the player's hand. The hat ladder's
payoff is the picture (his hat comes off); its last line is Vesper's own, and for once it means only what it says. Then
the acorn and the choice, one line a side.

## 2. The player's feeling

- **In:** the fight. **Out:** pity, then the decision is theirs.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper | (nothing left to want) | — | stillness | the hat line, sincere |
| Pip | get rid of a hot acorn | it is hot | hand to hand | — |
| Bracken / Tansy | win the acorn for their side | each other | one line each | — |
| Juniper | keep it lawful | — | dry | — |

## 4. Subtext

"...It is a nice hat." is every rung of the ladder turned round: the compliment that was always a threat, said by a gnome
with no hat at all. The player's nod is forgiveness, or at least the end of the fight.

## 5. Beat sheet

Hook: the top hat rolling on its brim at road level, stopping. The player picks it up. Vesper from above for the first
time in the game, bare-headed, still; a tick of glass (the hairline). The player. Vesper: "...It is a nice hat." The
nod. Turn: Pip at a run with the Golden Acorn ("It's warm!": the one gag, Pip coping, after the sincere beat, not on it).
Bracken, Tansy, Juniper: the two endings and the law. Button: the player between the beacons with the hat in one hand.

## 6. Shot list

A road-level cut on the hat; an MS of the player bending; `coverage('vesper', 'player')` singles, Vesper `high` (the
first time he is shot looking down); a track on Pip; MCU singles for each side; a high wide from the south for the button.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper | ...It is a nice hat. | no contraction, complete; not the earlier rungs word for word |
| Pip | It's warm! Why is it warm? Nobody said it'd be warm! | the Seed-Cell is warm (rulings.md: "the size of a gnome's fist, warm") |
| Bracken | Give it to the ground. Let clover take the scar. | Ending A |
| Tansy | Or wire it. Neon down the meridian. Races till dawn. | Ending B |
| Juniper | Both are legal. I checked. | her brisk one-liner |

## 8. Music and sound

No music for the hat (bed `wind`); tap, tap (the hat), cloth, glass (gain 0.12: barely there); `warm` comes in with Pip.

## 9. Blocking and vehicles

Vesper seated on the throne, bare-headed (`VESPER_BARE`: the cone in porcelain white, like Clara). The player at (1.4,
-3.4) facing him; Pip runs from (-1.2, 9) to (-1.2, 0.6); Bracken and Juniper by the gold beacon, Tansy by the cyan one.

## 10. The button

The crossing from above: the player in the middle with a top hat, the two sides waiting.

## 11. Self-check

- [x] No gag on the hat beat. `cutscene-report` OK; line of sight passes.
