# Director's notes: `sprinkler-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=sprinkler-outro`.

| | |
| --- | --- |
| Scene | `sprinkler-outro` in `src/cutscene/scenes/story/ch2c.ts` |
| Played by | quest `ch2-sprinkler-gauntlet` as its outro (the payoff at the south barn drop, before the banner) |
| Kind and length | `outro`, aim 15-45 s, fault above 60; now 28.6 s (was 28.8 s, 5 faults). Same length, five faults fixed |
| Where, when | stage `south-barn` (the silo drop) with Driftwood at `driftwood-trailer` on the field edge; day, no `sky` override |
| Before / after | before: the silo-rig run through the gauntlet. After: free roam; the Tessie side quest (Driftwood's turtle) is opened by his question |

## 1. Purpose in the story

Deliver the first rung of "Granny's pie": she arrives with pie and forged HOA permits, which makes the forgery the
joke and the pie the signature. Pip gets the acorn cake; the player gets the ledger (the forged permits). Driftwood's
turtle question opens the Tessie side quest, and Granny's dismissal makes him a character the player will want to
understand. The pie line "I brought pie" is kept for its payoff in a later chapter, so it is not said here.

## 2. The player's feeling

- **In:** just got the silo down the gauntlet, relieved, a little tired.
- **Out:** amused (the forged permits, Pip's cake), and curious about Driftwood, who stares at them from the trailer.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Granny Gnertrude | to deliver the goods and get the silo signed off | the HOA bailiffs, the heat | a homely line, a practical handover | the forgeries are the player's to use |
| Pip Potsworth | to be fed | the forgeries he will be asked about | cheer, a line of praise | holding the cake |
| Driftwood | to get a tow for his dinghy; to be asked about the turtle | nobody will tow him | a bark, a question | a new question for the player |
| The player | (not heard) | | | holds the ledger |

## 4. Subtext

- Granny is pleased with herself and does not say so; "official as a pie crust" is her pride.
- Driftwood's turtle is real to him and not to anyone else; "since spring" is Granny's way of saying he is not reliable.
- Pip's "evidence" joke is a deflection: he is delighted to be paid in cake.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length). Hook by 3 s, turn at about 60%, button in the
last 3 s.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0.0-9.1 | Hook | Granny's Ride-On comes in off the highway; `track` shot on it to the drop; it stops; she gets out |
| 2 | 9.1-13.4 | Setup | Granny, MCU: "Pie, sugar. And forged HOA permits. Official as a pie crust." Ledger and cake handed over |
| 3 | 15.4-18.1 | Setup | Pip, MS, with the cake: "Pie. Evidence of a very good morning." |
| 4 | 18.1-22.8 | Turn | `mystery` stinger; Driftwood at the trailer, MCU: "Seen a turtle? Big as a barn. Keeps a loch tidy." |
| 5 | 22.8-26.6 | Button | Granny, MCU: "Ignore him. He's been out in the sun since spring." |
| 6 | 26.6-28.6 | Button | Driftwood's stare, MCU, held two seconds |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on `granny-ride` | 50 | follows | the Ride-On in | the hook: a vehicle in motion |
| 2 | `shot('granny','mcu')` | 35 | locked | Granny | the pie and the permits |
| 3 | `shot('pip','ms')` | 40 | locked | Pip with the cake | in frame with the cake (a gag with movement: the cheer) |
| 4 | `shot('driftwood','mcu')` | 35 | locked | Driftwood | the turtle question, covered MCU facing the camera |
| 5 | `shot('granny','mcu')` | 35 | locked | Granny | her dismissal |
| 6 | `shot('driftwood','mcu')` | 35 | locked | Driftwood's stare | the picture to end on |

No two-hander, so no coverage needed.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Granny | Pie, sugar. And forged HOA permits. Official as a pie crust. | new: rung 1 of the pie joke (11 words); the scene's one "sugar" |
| ~~Granny~~ | ~~I brought pie, sugar! And forged HOA permits. Official as a pie crust.~~ | cut: "I brought pie" is the exact line for its later payoff; repeating it here would be a repeat-line fault |
| Pip | Pie. Evidence of a very good morning. | kept (5 words); he is in frame |
| Driftwood | You lot! Seen a turtle? Big as a barn. Keeps a loch tidy. | kept: opens the Tessie side quest; covered MCU, not the last line |
| Granny | Ignore him. He's been out in the sun since spring. | the dismissal, no second "sugar" |

Names checked: `npm run lore -- find Tessie` (the Driftwood entry: he gives the Tessie quest).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `warm` music, `wind` ambience | the drop after a run: relief |
| 18.1 | `mystery` music (fade 2) and the `mystery` stinger | Driftwood's turtle is the odd note; the one stinger in this scene |

## 9. Blocking and vehicles

- Granny's Ride-On (`granny-ride`, from `granny`) drives in from (60, 480) along (60, 450), (52, 444), (48, 450) and
  stops; Granny exits.
- The player stands at (40, 448) facing away (yaw PI); the `silo-rig` (`ride-on`, kept) is at the drop (40, 440).
- Pip stands at (44, 454) and is handed the `acorn-cake`; the player is handed the `ledger`.
- Driftwood stands at (19, 462) facing the camera side (yaw PI/2), by the trailer.

## 10. The button

Driftwood, held for two seconds, staring out of the frame at the lot of them, after Granny's dismissal. The question
is still open; the player is the one who has to decide whether to go and find out.

## 11. Self-check

- [x] The scene has a want (the silo delivered, the permits passed), an obstacle (the bailiffs' heat, Driftwood's
      tow), and a turn (Driftwood's question); it is not a briefing.
- [x] The hook lands in 0 s (a vehicle moving); the first line is at 9 s, from a character.
- [x] Every line is under 16 words; no coordinates or waypoint read-outs; nobody says what the picture shows.
- [x] Voices: Granny warm with one "sugar"; Pip joyful and short; Driftwood blunt.
- [x] Every speaker is framed MS or closer, facing the camera (`frame`, no `toward`).
- [x] Music: `warm` to `mystery` with a reason; one stinger.
- [x] The pie joke climbs its first rung; "I brought pie" is held for its payoff.
- [x] Day scene.
- [x] scene checker (`scenecheck.dev.test.ts`): OK, all shots pass, zero faults.
- [x] `direction.notes` in the scene points at this file.
