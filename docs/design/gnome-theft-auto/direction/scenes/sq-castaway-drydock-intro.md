# Director's notes: `sq-castaway-drydock-intro`

| | |
| --- | --- |
| Scene | `sq-castaway-drydock-intro` in `src/cutscene/scenes/side/castaway.ts` |
| Played by | quest `sq-castaway-drydock` ("Castaway's Dry-Dock") as its intro, given at the driftwood-trailer (Cloverfield) |
| Kind and length | `intro`, aim 30-60 s; now 37.2 s at Normal text speed (was 47.3 s, 10 faults) |
| Where, when | stage `driftwood-trailer` (Cloverfield Farms, the southern stubble), dusk held at `sky: 'golden'` |
| Before / after | before: the highway south, the stubble, the combine idling at the field edge. After: the player hitches the raft to the combine and drives it to `canal-raft` (`sq-castaway-drydock-outro`) |

## 1. Purpose in the story

A side quest in the melancholy register. It makes the player care about one lonely castaway who has waited six months
for a tide that is only clover, and it gives the job: haul his walnut dinghy to the Southern Drainage Canal. It also
plants the apocrypha thread: the HOA drained the old ponds, and Baroness Brenda has the canal as her republic.

The old scene was a long wide with the caption doing the scene-setting, a 19 s hold on a wide with a 23-word line over
it, and Driftwood's back to the camera for his best line.

## 2. The player's feeling

- **In:** curious, a little amused (a man ringing a bell at a field of clover), bored by the drive.
- **Out:** quietly tender. They know Driftwood is wrong about the tide and right about the wait; the job is clear (hitch
  it, haul it south, mind the sharks).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Driftwood | to have his raft taken to the water | nobody answers the bell; the sun is going | short lines, one great line ("I can feel it in my hat"), the warning about sharks | from ringing at nothing to a man with a job |
| The player | to know what this is | a field of clover called a sea | the straight man: questions, "That's clover, Driftwood.", "Is that far?" | takes the job |

## 4. Subtext

- Driftwood's want is not the canal; it is to be answered. The bell he rings at the start and at the end is the same
  shot: nobody answers either time.
- "Sun's going": the afternoon is running out on a man who has waited six months. Said quietly, not as a threat.
- The HOA line is the world's tie (the drained ponds, Brenda's republic); it is one sentence, not an argument.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length: 37.2 s).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Driftwood rings the bell at the clover; a glass chime; a 1.2 s pause with nobody answering. The player walks in. |
| 2 | 3-14 | Setup | "Tide's coming in. I can feel it in my hat." / "That's clover, Driftwood." / "That's the sea before it learns to swim." / "Six months? For clover?" |
| 3 | 14-22 | The tie | "HOA drained the ponds. Brenda got the canal. Lawn-chair republic." |
| 4 | 22-31 | The job | "And your raft?" / "Under me. Hitch it to that combine." / the player: "Is that far?" / "Haul it to the Southern Drainage Canal." |
| 5 | 31-36 | Turn | "Sun's going." (he is looking at the sky, a `think`); the combine is shown, the stubble, the light going. |
| 6 | 36-37 | Button | "Mind the lawn sharks. Nobody believes me about the lawn sharks." on his frame; the bell once more from the far side; nobody answers. |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('driftwood','ms',{toward:'you',side:40})` | 40 | locked | Driftwood | the hook: the bell in the picture, nobody at the trailer |
| 2 | `TALK.single('driftwood','mcu')` | 35 | locked | Driftwood | his one great line |
| 3 | `TALK.single('you','mcu')` | 35 | locked | the player | the straight man |
| 4 | `TALK.single('driftwood','mcu')` | 35 | locked | Driftwood | the sea line |
| 5 | `TALK.single('you','mcu')` | 35 | locked | the player | "Six months? For clover?" |
| 6 | `TALK.single('driftwood','mcu')` | 35 | locked | Driftwood | the tie, one line |
| 7 | `TALK.single('you','mcu')` | 35 | locked | the player | "And your raft?" |
| 8 | `TALK.single('driftwood','mcu')` | 35 | locked | Driftwood | "Under me. Hitch it to that combine." |
| 9 | `reaction('you')` (hold 1.2 s) | 35 | locked | the player | a nod, so Driftwood's lines are not a run of three |
| 10 | `TALK.single('driftwood','mcu')` | 35 | locked | Driftwood | "Haul it to the Southern Drainage Canal." |
| 11 | `TALK.single('you','mcu')` | 35 | locked | the player | "Is that far?" |
| 12 | `TALK.single('driftwood','mcu')` | 35 | locked | Driftwood | the `think` gesture, then "Sun's going." |
| 13 | cut, insert of the combine from the stubble (`above(38,448,2.6)` to the combine) | 40 | locked | the combine | the turn: the light, the machine that will haul it |
| 14 | `TALK.single('driftwood','mcu')` | 35 | locked | Driftwood | the button's warning |
| 15 | `shot('driftwood','ms',{toward:'you',side:-50})` | 40 | locked | Driftwood, far side | the last picture: the bell rung, nobody answers |

Side of the line: Driftwood and the player on `coverage('driftwood','you',1)` throughout. The insert (11) has no speaker.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Driftwood | Tide's coming in. I can feel it in my hat. | the one great line; kept as written |
| The player | That's clover, Driftwood. | the straight man |
| Driftwood | That's the sea before it learns to swim. | was joined to "Six months I've been waiting on a tide" (too long); the wait is now the player's joke |
| The player | Six months? For clover? | new: the straight man's question; the joke lands on the wait |
| Driftwood | HOA drained the ponds. Brenda got the canal. Lawn-chair republic. | was two lines (23 and 22 words) about the canal going; one line, 11 words, the tie |
| The player | And your raft? | kept |
| Driftwood | Under me. Hitch it to that combine. | was "Right here under me, on the trailer..." (22 words) |
| The player | Is that far? | new: a reaction line, so Driftwood's two lines are not a run |
| Driftwood | Haul it to the Southern Drainage Canal. | the job, split from the hitch |
| Driftwood | Sun's going. | the turn; said after a `think` |
| Driftwood | Mind the lawn sharks. Nobody believes me about the lawn sharks. | was 22 words with "Bring her back to the water before the tide goes out" cut; the sharks are the button |
| ~~Caption~~ | ~~Cloverfield. Six months of clover, and not one wave.~~ | cut: the picture and the bell do it; the narration allowance is unused |

Names checked: `npm run lore -- find driftwood`, `find brenda`, `find "puddle sea"` (Brenda's republic, the canal).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind` ambience, `sad` music | the field and the loneliness |
| 0.0-1.4 | `wave` gesture and a `glass` chime (0.4) | the bell is the hook |
| 1.4-2.6 | silence in the field | nobody answers |
| 36.0 | `glass` chime (0.4) again | the button: the bell, nobody answers |

No stingers. The combine's idle is the sound under the turn.

## 9. Blocking and vehicles

- Driftwood starts at (18, 452), standing by the trailer, facing the player's approach; he rings the bell with `wave`.
- The player starts at the stage mark (24, 466) and walks up to (21.5, 465) during the hook.
- The combine is parked at (30, 460) facing north (castaway combine), not moved.
- The player's own vehicle is not used here: the intro ends as they walk away to the combine.

## 10. The button

Driftwood alone on his frame, the bell rung one more time from the far side and nobody answering: the sea of clover
and the lonely wait, in one sentence. It is right because the scene is about a man who wants to be answered, and the
last thing we hear is that he is not.

## 11. Self-check

- [x] Want (the raft to the water), obstacle (the sun, nobody answering), turn (the sun is going).
- [x] Hook in 3 s (the bell, a chime); no opening narration; the caption is cut.
- [x] Every line under 16 words (longest 13); no coordinates or waypoint read-out.
- [x] Driftwood's lines in his voice (short, one great line); the player's lines short questions.
- [x] Every speaker framed MS or closer, facing the camera for their line; reactions and a player line between his runs.
- [x] One side of the line (`coverage('driftwood','you',1)`); the insert has no speaker.
- [x] Music: `sad` under `wind`; no stinger; one held pause (1.2 s) before the first line.
- [x] Plants the HOA and Brenda's republic in one line; does not name Tessie.
- [x] Dusk held at golden; no shot into a roof.
- [x] Report OK (intro); `pacing.baseline.ts` left for the planner to edit.
- [x] `scenes.test.ts` line-of-sight passes; watched at 960x600 and 390x844 (phone framing is tight on the mcu singles, but both faces are in shot).
- [x] `direction.notes` points here.
