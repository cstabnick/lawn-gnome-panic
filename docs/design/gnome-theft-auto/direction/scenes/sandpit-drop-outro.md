# Director's notes: `sandpit-drop-outro`

Copy of [TEMPLATE.md](../TEMPLATE.md). Rules and numbers: [bible.md](../bible.md). Worked example: [scenes/mowers-keepers-intro.md](mowers-keepers-intro.md).

| | |
| --- | --- |
| Scene | `sandpit-drop-outro` in `src/cutscene/scenes/story/ch4c.ts` |
| Played by | quest `The Sandpit Drop` as its arrival at the Dust Flats safehouse (280, 40) |
| Kind and length | outro, aim 30-45 s (bible section 4). Re-cut: 43.1 s, was 39.5 s |
| Where, when | stage `dust-safehouse` (wide spot), `fort-sandpit-gate` road for Diggs's entrance; afternoon, dust in the air, `sky` default |
| Before / after | the flight in the Whirligig / `spade-truce-intro`, the standoff at the same spot |

## 1. Purpose in the story

The crew gets the Whirligig home and Diggs arrives to take it back. It plants the Commander's whole grievance in one line ("Fifteen years...") and sets up the truce: he stops the player and does not yet turn. It also plants Diggs's last word, "Nobody borrows it either.", the first half of the chapter's standoff. Chapter question: will the Spade Guard stand with the crew or with its orders (bible section 3).

## 2. The player's feeling

- **In:** they just flew the stolen machine home, dust in the lens, the crew cheering. Good and a little giddy.
- **Out:** the high is gone. A rival is standing in the dust with a hand on his sidearm, and they have to talk their way out of it.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | Get the Whirligig down safely, then keep it. | The dust; Diggs. | Bossy at the landing, flat and firm at the standoff. | None: she holds the line. |
| Pip | Celebrate the landing. | Diggs's engine. | Joy, then freezes. | Shaken, not beaten. |
| Diggs | Get the Whirligig back. | The crew, and the fact that he has no orders for this. | Still, LOW, clipped: "Nobody turns it on." | He stops, unsure. The truce (next scene) is where he changes. |

## 4. Subtext

- Diggs has guarded the machine for fifteen years and has never once been allowed to turn it on: his pride is in the wait, not in the job.
- Tansy does not need the Guard. She needs the Whirligig, and she is willing to talk Diggs past the fact that she stole it.
- Pip's cheer is the last joy of the scene; the engine note ends it.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | The Whirligig drops through the dust in one wide, the wind already moving. |
| 2 | 3-8 | Setup | Tansy, MCU, shades her eyes: "Lower. Lower. The dust is not your friend." |
| 3 | 8-16 | Touchdown | Thud, shake, a track on the landing; Pip, MCU, cheers: "Landed! Nobody check the parachute. Nobody." |
| 4 | 16-19 | Turn | Pip's cheer freezes; the chase starts; an engine note from the gate. |
| 5 | 19-27 | Entrance | The Zero-Turn tears in on a track shot and skids to a stop by the Whirligig. Danger stinger. Diggs steps out. |
| 6 | 27-33 | Standoff | Silence. Diggs, LOW, "Fifteen years I've guarded that chopper." Then, closer, "Nobody turns it on." |
| 7 | 33-37 | Answer | Tansy: "We're only borrowing it." Diggs: "Nobody borrows it either." |
| 8 | 37-43 | Button | The player climbs out and walks to Diggs; a slow push across the wide, wind only. |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` wide, safehouse spot | 50 mm | none | the Whirligig | establish the landing |
| 2 | `frame` MCU, `shot('tansy')` | 46 mm | none | Tansy | the line is hers |
| 3 | `track` on `ride` | 50 mm | follows the ride | the Whirligig | the thud |
| 4 | `frame` MCU, `shot('pip')` | 46 mm | none | Pip | the cheer |
| 5 | `frame` MCU reaction, Pip | 46 mm | none | Pip | the freeze (held 1.2 s, so it reads) |
| 6 | `track` on `diggs-ride` | 50 mm | follows | the Zero-Turn | the entrance and skid |
| 7 | `frame` LOW MS, `coverage(tansy, diggs)` | 46 mm | none | Diggs | the standoff, one side of the line |
| 8 | `frame` LOW CU, Diggs | 46 mm | none | Diggs | "Nobody turns it on." |
| 9 | `frame` MCU, Tansy | 46 mm | none | Tansy | "We're only borrowing it." |
| 10 | `frame` LOW CU, Diggs | 46 mm | none | Diggs | "Nobody borrows it either." |
| 11 | `dolly` on the safehouse wide, 4 m push | 50 mm | slow push, 9 s | the standoff | the western button |

Coverage: one object, `coverage('tansy', 'diggs', 1)`, for the whole Tansy/Diggs exchange. No crossing.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | Lower. Lower. The dust is not your friend. | Beat 2 of the planned notes, reworded from the old "Lower, Pip." to address the picture (she is the one below). |
| Pip | Landed! Nobody check the parachute. Nobody. | Keeps the old joke; the second "Nobody" lands the cheer. |
| Diggs | Fifteen years I've guarded that chopper. | Stated flat. |
| Diggs | Nobody turns it on. | Four words, unique in ch3-4 (checked). |
| Tansy | Diggs, nobody is turning anything on. We're only borrowing it. | Tansy's answer. Kept from the old script. |
| Diggs | Nobody borrows it either. | Button of the exchange; not repeated elsewhere. |

No narrator, no captions. 

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `triumph`, `wind` ambience | the win |
| 8 | thud, shake | the touchdown |
| 16 | `chase` (fade 0.5), `engine-rev` | the turn |
| 19 | `skid`, `danger` stinger | Diggs stops |
| 27 | music null (silence, fade 0.4) | the standoff needs quiet |
| 37 | `wind` only | the western button |

## 9. Blocking and vehicles

- The Whirligig (`ride`) comes down from (340, 70, h 60) to (291, 4, h 39) with the player seated; the player exits at (290, 38) and walks to (284, 40), facing Diggs, ending on foot at the safehouse.
- Tansy and Pip stand at their safehouse marks; Tansy's MCU is `shot('tansy', 'mcu', {toward: 'ride'})`.
- Diggs's Zero-Turn (`diggs-ride`) drives from the fort gate road (374, 70) to (302, 44) and stops; Diggs exits there.
- The player ends on foot near (284, 40); the scene's last shot faces Diggs.

## 10. The button

The player, on foot, walks the last few metres toward Diggs while the camera slowly pushes across the safehouse wide and the wind carries the dust through the frame. It is the last image of the standoff, and it sends the player into the truce.
