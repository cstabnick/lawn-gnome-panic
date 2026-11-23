# Director's notes: `sq-tessie-intro`

| | |
| --- | --- |
| Scene | `sq-tessie-intro` in `src/cutscene/scenes/side/tessie.ts` |
| Played by | quest `sq-tessie` ("The Loch Moss Monster") as its intro, given by Driftwood at the Loch Moss dock |
| Kind and length | `intro`, aim 30-60 s; now about 55 s (was 71.7 s, 28 faults: the most in the game) |
| Where, when | stage `loch-dock` (east.ts), golden hour, `sky: 'golden'` |
| Before / after | before: the rumour on Turfton FM (unlocked after the Salvage Raid), the drive down the loch-spur. After: three sightings by boat |

## 1. Purpose in the story

The side quest's question is "is she real?". The old scene answered it with a caption and a long monologue; the new one
answers it with a picture in the first twenty seconds, so the quest becomes "prove it to everyone else" and "keep her
from the HOA". Ties: Driftwood was floated off the canal by the player (Castaway's Dry-Dock), and Vesper's HOA wants the
loch for a golf course (the main story's levelling of everything uneven, at loch scale).

## 2. The player's feeling

- **In:** curious; a long drive to the end of a dirt track for a castaway's rumour.
- **Out:** a little awed (they saw her, briefly), protective, and amused by Driftwood; clear on the job (follow the
  ripples by boat, drop four buoys unseen).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Driftwood | to be believed, and to keep Tessie safe | nobody believes a castaway; the HOA | hush, then let the loch prove it; one poetic line | has someone who saw her too |
| The player | to know what he is looking at | Driftwood will not look away from the water | short questions | takes the job |

## 4. Subtext

- Driftwood is lonely; Tessie is the first thing that has listened to him since the canal. "She sings through my hull"
  is a man describing a friend.
- He turns round only once he knows the player saw her: being believed is what he wants.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2.2 | Hook | Low on the water, a splash and a ripple going against the wind. No music. |
| 2 | 2.2-9 | Setup | Driftwood on the shore, binoculars up, back to the player. "What are you looking at?" "Hush. The loch is thinking." |
| 3 | 9-16 | The glimpse | A shell breaks the surface close to the dock and rolls under (reveal stinger). "There. Did you see her?" "See who?" |
| 4 | 16-19 | The name | He turns round for the first time, close: "Tessie." The `mystery` theme finds her. |
| 5 | 19-31 | Turn | The HOA patrol boat crosses where she went down. "They want her loch drained for eighteen holes of golf." "Golf." |
| 6 | 31-41 | Why | The canal, and his one great line: "Like a foghorn that's read a book." The player nods. |
| 7 | 41-50 | The job | Boat, ripples, proof; four buoys while the HOA looks away. |
| 8 | 50-55 | Button | He turns back to the water, binoculars up; far out, something rolls over once. `mystery` sting. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` at the water surface by the dock | 38 | locked | the ripple | nature documentary: watch the water first |
| 2 | `shot('driftwood','ms',{side:28})` | 40 | locked | Driftwood, from the water side | he is facing the loch; we see his face, not the player's view of his back |
| 3 | `DOCK.single('you')` | 35 | locked | the player | the question |
| 4 | `shot('driftwood','mcu',{side:28})` | 35 | locked | Driftwood | still not turning |
| 5 | `track` from the water surface | 34 | follows | Tessie | the picture before the word |
| 6-7 | Driftwood / the player singles | 35 | locked | | |
| 8 | `DOCK.single('driftwood','cu')` | 30 | locked | Driftwood | the name, close |
| 9 | `track` from the water | 36 | follows | the patrol boat | the threat crosses the frame |
| 10-16 | `DOCK` singles, a CU on the great line, a nod | 30-35 | locked | | |
| 17 | `cut` low on the water, looking back at him | 40 | locked | Driftwood | the button: the watcher, watching |

Sides: Driftwood and the player on `coverage('driftwood','you', 1, 65)` (a wide angle off the eyeline: the bank rises
behind the player, so a camera on the eyeline would be in the ground). Shots 2 and 4 are taken from his own facing
before he turns; they sit on the same side.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| You | What are you looking at? | |
| Driftwood | Hush. The loch is thinking. It's rude to interrupt. | trimmed |
| Driftwood | There. Did you see her? | new: the reaction to the picture |
| You | See who? | |
| Driftwood | Tessie. | the name, alone |
| Driftwood | HOA patrol. They want her loch drained for eighteen holes of golf. | was 15 words over a caption saying the same |
| You | Golf. | the straight man |
| Driftwood | Since you floated me off the canal, she sings through my hull. | the Castaway tie |
| Driftwood | Low. Like a foghorn that's read a book. | his one great line, kept |
| Driftwood | Take a boat. Follow her ripples. Bring me proof, not a blurry one. | was 21 words |
| You | And the HOA? | |
| Driftwood | Drop four sonar buoys while they look the other way. | the second objective, in his voice |
| ~~caption~~ | ~~Loch Moss. Golden hour. The reeds have opinions.~~ | cut: the picture says it |
| ~~caption~~ | ~~On the far shore, the HOA patrol boat is also looking.~~ | cut: shown instead |
| ~~Driftwood~~ | ~~Six months on a trailer, and now I've got a walnut shell. Progress.~~ | cut: Castaway's joke, not this quest's |
| ~~Driftwood~~ | ~~Vesper Thorne's HOA doesn't believe in anything it can't put on a list...~~ | cut: 22 words |
| ~~Driftwood~~ | ~~Find her, and I'll get you a piece of her shell. She sheds.~~ | moved to the payoff (`sq-tessie-secret`) |

Lore: `npm run lore -- find tessie` (the HOA's 18-hole golf course, the singing through the hull, the canal).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `water` ambience, no music; `splash` at the ripple | the loch first |
| 10 | `reveal` stinger on the shell | the picture is the reveal |
| 17 | `mystery` in (1.6 s fade) after "Tessie." | the music starts when she has a name |
| 19 | the patrol boat's engine | the threat is a sound before a line |
| 54 | far splash, `mystery` stinger | the button |

## 9. Blocking and vehicles

Driftwood on his mark (-722, -556) facing the water, binoculars; turns to the player for "Tessie." and back to the water
in the button. The player at (-720, -545), stays. Tessie spawns at (-703, -612), rolls south-east and despawns (dives).
The HOA patrol boat crosses from (-694, -626) to (-656, -652). Driftwood's dinghy tied at the dock.

## 10. The button

Driftwood alone in a low shot from the water, binoculars up again, and a far splash: he is back to watching, but now
someone else has seen her too.

## 11. Self-check

- [x] Want (be believed), obstacle (nobody does, the HOA), turn (the patrol boat).
- [x] Hook in 3 s (the splash); no narration or captions.
- [x] Lines under 16 words (longest 13).
- [x] Driftwood cut short, one great line; the player's lines 1-5 words.
- [x] Every speaker MS or closer, facing the camera.
- [x] One side of the line.
- [x] Two stingers (reveal, mystery), music in after the name.
- [x] Golden sky.
- [x] Report OK; removed from the baseline. LOS passes; watched at both sizes.
- [x] `direction.notes` points here.
