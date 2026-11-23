# Director's notes: `sq-castaway-drydock-outro`

| | |
| --- | --- |
| Scene | `sq-castaway-drydock-outro` in `src/cutscene/scenes/side/castaway.ts` |
| Played by | quest `sq-castaway-drydock` ("Castaway's Dry-Dock") as its outro, at the canal-raft (Southern Drainage Canal) |
| Kind and length | `outro`, aim 30-45 s; now 28.0 s at Normal text speed (was 42.4 s, 9 faults) |
| Where, when | stage `canal-raft` (the north bank of the Southern Drainage Canal, Cloverfield), dusk held at `sky: 'golden'` |
| Before / after | before: the player hauled Driftwood's raft to the canal with the combine. After: the player's way north (the Loch Moss and Tessie thread is a later quest; the scene only plants the sound) |

## 1. Purpose in the story

The payoff of the quest. The raft goes in the water and Driftwood, six months on a trailer, is afloat. Then the story
turns: something deep sings through the hull, far to the north. It points the player at the loch (the apocrypha chain
that later gives `sq-tessie`), without naming it. The hat is his thanks, given as a gruff aside.

The old scene was a long wide with a caption, a 12 s wide hold, an 8-word hook line sitting on a 6% speaker, and four
Driftwood lines in a row ending on a walk-off with a 2 s held wide.

## 2. The player's feeling

- **In:** done with the haul, tired, a bit fond of the old man.
- **Out:** uneasy. The raft floats and something answers from under the water; the player wants to know what.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Driftwood | to be afloat and not talk about it | his own delight keeps breaking through | "I'm not talking. I'm floating."; the captain's hat as a gruff thank-you | from a man who waited to a man who hears something |
| The player | to finish the errand | the raft looks like nothing | the straight man: "Was it supposed to float?" | is pulled north by the sound |

## 4. Subtext

- Driftwood's delight is embarrassing to him; "I'm not talking" is a man trying not to cry about a boat.
- The sound under the hull is the first thing he has heard in six months that was not a bell with nobody at it. He hears
  it and stops talking. That is why the scene's last word is his silence.
- The captain's hat is what he has left to give. He does not say so.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length: 28.0 s).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | The canal wide: the combine on the bank, the frogs; the player steps out and walks to the bank. The raft is spawned and slides off into the water with a splash (`splash`, 0.6) by about 3 s. |
| 2 | 6-11 | Afloat | Driftwood, high frame from the bank: "Oh. It floats. Six months on a trailer and it still floats." |
| 3 | 11-16 | The straight man | The player turns to the raft: "Was it supposed to float?" |
| 4 | 16-22 | The joke again | Driftwood: "Don't say anything. I'm not talking. I'm floating." A player nod; then "Captain's hat's in the trailer. Yours, if you row." |
| 5 | 22-26 | Turn | Music out, a `thud` (0.3) and a tiny shake (0.02) through the hull, the `mystery` stinger, a held pause (1.2 s). |
| 6 | 26-28 | Button | Driftwood's face, close: "Hear that? Under the hull. Far north." Then the camera pulls out over the water north, past him, on `mystery` music, and holds 2 s. He says nothing more. |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `stageCut('canal-raft','arrival')` | 42 | locked | the bank and the combine | the hook: the raft is about to go in |
| 2 | (caption, then the exit and walk, no cut) | | | | the wide holds for the caption and the player's walk |
| 3 | cut on Driftwood from the bank, above the gunwale (`RAFT_SPEAKER`) | 30 | locked | Driftwood on the raft | a high frame so his head is in the shot over the raft's side |
| 4 | `shot('you','mcu',{toward:'driftwood',side:60})` | 35 | locked | the player | the straight man, framed on the eyeline, facing the camera |
| 5 | `RAFT_SPEAKER` | 30 | locked | Driftwood | "Don't say anything." on the same side as shot 3 |
| 6 | `reaction('you', nod)` | 35 | locked | the player | the nod after the joke |
| 7 | `RAFT_SPEAKER` | 30 | locked | Driftwood | the captain's hat aside (a run of two lines is broken by the reaction) |
| 8 | cut, close on Driftwood from the bank (`fov 26`) | 26 | locked | Driftwood's face | the sound under the hull: he hears it before we do |
| 9 | dolly over the water north (`above(46,232,1.5)` to `above(44,204,3.5)`, look at `above(44,186,4)`) | 40 | slow dolly, 6 s | the water and the canal | the button: nothing said, the camera goes where he is listening |

Side of the line: Driftwood's raft shots (3, 5, 7, 8) sit on one side of the line from him to the player; the player's
single (4) is framed on the same side (`side: 60` on the eyeline), so no shot jumps the line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Driftwood | Oh. It floats. Six months on a trailer and it still floats. | was "...and it still floats." with a 6% speaker; now on a high frame from the bank |
| The player | Was it supposed to float? | new: the straight man, a question (the player's lines are mostly questions) |
| Driftwood | Don't say anything. I'm not talking. I'm floating. | was on a wide with a 24% speaker; now on the same side as his other shots |
| The player | (nod, no line) | the reaction breaks Driftwood's run |
| Driftwood | Captain's hat's in the trailer. Yours, if you row. | was the end line (a walk-off with four Driftwood lines in a row); moved before the turn as a gruff aside |
| Driftwood | Hear that? Under the hull. Far north. | was "...Far north." on a wide, unseen; now a close frame, the last words he says |
| ~~Caption~~ | ~~Southern Drainage Canal. Brown water, gold light, and frogs making a case.~~ | kept on the wide: the one narration of the scene; it names the place without waypoint coordinates |
| ~~Driftwood~~ | ~~Fair winds, landlubber.~~ | cut: the walk-off; the scene ends on the sound, not a farewell |

Names checked: `npm run lore -- find driftwood`, `find "lawn shark"`, `find "southern drainage"`. No new facts; the
lore is unchanged, so no entry edits.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `water` ambience, `sad` music | the canal, the frogs |
| 3.0 | `splash` sfx (0.6) on the raft | the picture: the raft goes in |
| 22.0 | music out (0.6), `thud` (0.3) on the raft, shake 0.02 | the turn: the hull rings |
| 22.0 | `mystery` stinger | the sound from the north, one hit |
| 23.2 | held pause (1.2 s) | nothing said |
| 27.0 | `mystery` music (fade 1.5) back for the button | the last image |

Stingers: one (`mystery`), at the turn, on a physical sound from the water.

## 9. Blocking and vehicles

- The player exits the hauler at (60, 217) and walks to the bank mark (52, 220), facing the raft.
- The raft is spawned hidden at (46, 228) and drives 4 m east to (50, 228) at the splash; Driftwood spawns seated in it
  and stands for his first line.
- The hauler (the player's combine) stays on the bank at (60, 217).
- The button dolly moves north over the water from above (46, 232) to above (44, 204) and looks ahead to (44, 186).

## 10. The button

The camera going north over the water, away from the raft, with Driftwood's last line still in the ear: "Hear that?
Under the hull. Far north." It is right because the scene's question is what is out there, and the last image is the
direction he is listening in.

## 11. Self-check

- [x] The scene has a turn (the hull sings) and a button (the dolly north); it is not a briefing.
- [x] The hook lands by 3 s (the raft goes in with a splash on a wide, the player walking).
- [x] Every line under 16 words (longest 13); no coordinates or waypoint read-out.
- [x] Driftwood's lines are his voice (short, delighted and embarrassed); the player's are questions.
- [x] Every speaker framed MS or closer, facing the camera for their line; a reaction breaks his run of lines.
- [x] One side of the line for each pair of shots; the player is framed on the eyeline to the raft.
- [x] Music changes with reasons; one stinger; one held pause.
- [x] Never names Tessie; plants the north.
- [x] Dusk held at golden; the frames are not shot into a shadow (the raft is framed from the bank, not under a roof).
- [x] Report OK (outro; `pacing.baseline.ts` left for the planner to edit) and line-of-sight passes; watched at 960x600 and 390x844.
- [x] `direction.notes` points here.
