# Director's notes: `sq-tessie-eggs`

| | |
| --- | --- |
| Scene | `sq-tessie-eggs` in `src/cutscene/scenes/side/tessie.ts` |
| Played by | quest `sq-tessie` as the beat before objective 3 (escort the egg raft), after the fourth buoy |
| Kind and length | `arrival`, aim 10-35 s; now about 24 s (was 30.9 s, 5 faults) |
| Where, when | the player's boat off `tessie-nest` (east.ts), golden |
| Before / after | before: four buoys dropped past the HOA patrol. After: escort the egg raft, ram the dredger three times |

## 1. Purpose in the story

Turns the quest from proof to protection: she is here because of the eggs, and the HOA's dredger is coming for them.

## 2. The player's feeling

- **In:** tense from dodging the patrol boat. **Out:** awe at her up close, then urgency.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| The player | to understand what they are seeing | it is enormous and silent | look, then three words | commits to the eggs |
| Tessie | to protect the clutch | the dredger | surface, then go to the island | leads the way |

## 4. Subtext

Nobody says she is a mother. The insert of the eggs says it.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2 | Hook | The dredger's engine coughs in the reeds (long lens, low). |
| 2 | 2-3 | Reaction | The player turns. |
| 3 | 3-6 | Reveal | She surfaces beside the boat, low and slow; `mystery`, reveal stinger. |
| 4 | 6-12 | Line, insert | "That is not a rock." The egg clutch on the island. "Eggs." |
| 5 | 12-18 | Turn | The dredger again, closer, louder; `tension`, danger stinger. "Eggs first. Then the dredger." |
| 6 | 18-24 | Button | She dives towards the island. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` from the water | 30 | follows | the dredger | a threat at a distance |
| 2 | `shot('you','mcu',{side:30})` | 35 | locked | the player in the boat | reaction |
| 3 | `track` at the surface | 44 | follows | Tessie | awe: low, then hold |
| 4 | the player's single | 35 | locked | | the line |
| 5 | `cut` insert on the clutch | 40 | locked | the eggs | the reason |
| 6-8 | the dredger, the player, then a `track` on Tessie diving | | | | |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| You | That is not a rock. | was spoken before she appeared; now after the picture |
| You | Eggs. | one word over the insert |
| You | Eggs first. Then the dredger. | the objective, in the player's voice |
| ~~caption~~ | ~~Four buoys down. Out in the reeds, a dredger engine coughs into life.~~ | cut: the sound does it |
| ~~You~~ | ~~Something's coming up by the island.~~ | cut: described the picture before it |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `water`, no music; the dredger's `engine-rev` | menace as a sound |
| 3 | `mystery` in, `reveal` stinger | her |
| 12 | `tension`, `danger` stinger | the dredger |

## 9. Blocking and vehicles

The player seated in their boat (`from: 'player'`) at (-716, -690). The dredger (an HOA patrol boat) starts at
`TESSIE.dredgerStart` and creeps west. Tessie surfaces at (-730, -700) and dives towards the island's east shore. The egg
clutch is the stage's set dressing at (-746, -713).

## 10. The button

Tessie going under towards the island: the player has to follow.

## 11. Self-check

- [x] Want, obstacle (the dredger), turn. [x] Hook by sound. [x] Lines 1-5 words. [x] The player framed MCU.
- [x] Two stingers. [x] Golden. [x] Report OK, LOS passes, watched. [x] Notes linked.
