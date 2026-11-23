# Director's notes: `sq-grid-truthers-intro`

| | |
| --- | --- |
| Scene | `sq-grid-truthers-intro` in `src/cutscene/scenes/side/gridTruthers.ts` |
| Played by | quest `sq-grid-truthers` ("The Grid Truthers") as its intro, given at Bodega & Sons, Old Brick Quarter |
| Kind and length | `intro`, aim 30-60 s; now 45.1 s at Normal text speed (was 90.0 s, 17 faults) |
| Where, when | stage `bodega-front` (Turfton, Old Brick Quarter), dusk held at `sky: 'golden'` (the streetlights are not on yet) |
| Before / after | before: the player's errand across Turfton. After: the player walks off from the PLAYER mark; the scene that follows is the Gamma beat (`sq-grid-truthers-gamma`) |

## 1. Purpose in the story

The Grid Truthers' intro. It makes the player take a mad old man seriously for one minute and plants the quest's
question: the roads are sixty units apart, and something sits at zero, zero. It hands over the objective in Mossley's
own voice (four survey markers, then the dead centre) and ends on the question nobody can answer yet.

The old scene was a surveillance montage with a 13 s long-lens dolly, a caption setting the scene, a shake running for
90 s, and a three-line Ammu-Gnation exchange that did nothing for the quest. Nine of its seventeen faults were speakers
seen from behind or out of frame.

## 2. The player's feeling

- **In:** amused, a little suspicious (a man with a plumb-line on the pavement, a bodega at night-that-is-not-night).
- **Out:** quietly unsettled. The roads are measured, the van's headlights made him freeze, and the player froze too.
  The job is clear (the four markers, then zero, zero) and the question is open (what is at zero, zero?).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Mossley | to get the player to check the markers | the player thinks the roads are just roads | whispers, numbers, instructions about where not to look | from pacing the kerb to hiding from a van |
| The player | to know what the man wants | the picture makes him sound mad | one flat question ("Somebody planned the roads. That's what roads are.") | freezes with him when the van passes |
| Burt | to be heard as the man who drove a van | nobody asked him | a dry second opinion from the wall | (plants the HOA Audit quest) |

## 4. Subtext

- Mossley is right about the grid and wrong about who is watching: the van is not for him, it is a routine patrol, and
  he still ducks.
- "Whatever they drew it with" is the scene's real secret: the answer is in the picture of the plan, not the words.
- Burt's "I used to drive one" is the first hint that the HOA vans have drivers who used to be people like the player.

## 5. Beat sheet

Timings at Normal text speed (the report prints the scene's length).

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | A long lens (fov 28) on Mossley at the kerb, the player already walking straight at him. "Don't walk straight at me. Walk on the crack in the paving." |
| 2 | 4-13 | Setup | Mossley walks to his table, faces the player: "Sixty units. Every road in Turfton, sixty units apart." / "Does soil grow in squares?" |
| 3 | 13-18 | The flat answer | Frame on the player, a shrug: "Somebody planned the roads. That's what roads are." |
| 4 | 18-30 | Turn | The HOA van glides past with its headlights on (track shot from beside Mossley, the stinger). Mossley freezes (`handsUp`). "Code-Enforcement. Don't look at it. They measure everything after midnight." Burt from the wall: "He's right about the vans. I used to drive one." |
| 5 | 30-40 | The plan | Close on Mossley over the table: "Four survey markers, one at each corner of the grid." / "Then the dead centre. Zero, zero." The player: "What's at zero, zero?" |
| 6 | 40-45 | Button | Mossley: "Whatever they drew it with." (mystery sting), a pause, the camera tilts up with his eyeline to the sky; hold 1.5 s. Then the player walks off from the PLAYER mark and the camera lifts away. |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('mossley','mcu',{toward:'you',side:30})`, handheld 0.02 | 28 | drift | Mossley | the hook: a long lens on a man at the kerb |
| 2 | same shot, one more Mossley line | 28 | drift | Mossley | the grid, two lines |
| 3 | `TALK.single('you','mcu')` | 35 | drift | player | the straight man's question |
| 4 | `track` on the HOA van, handheld 0.02 | 40 | fixed, turns with the van | van | the van glides past with its headlights |
| 5 | `shot('mossley','mcu',...)`, `handsUp` | 28 | drift | Mossley | he freezes; the line |
| 6 | `shot('burt','mcu',{toward:'you',side:30})` | 34 | locked | Burt | Burt's reaction line from the wall |
| 7 | `shot('mossley','mcu',...)` over the table | 28 | drift | Mossley | the plan, in a whisper |
| 8 | `TALK.single('you','mcu')` | 35 | locked | player | "What's at zero, zero?" |
| 9 | `shot('mossley','mcu',...)` | 28 | drift | Mossley | the last line |
| 10 | dolly, looks at Mossley then tilts to the sky (`lookTo`), 2.5 s | 34 | slow | Mossley, sky | the button: he looks up |
| 11 | dolly out from above the bodega, 5 s | 52 | slow | the scene | the camera lifts away |

Side of the line: Mossley and the player on `coverage('mossley','you',1)`. Burt's single is on the eyeline to the player
(he faces the player; the shot is on the same side of the room as the player).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Mossley | Don't walk straight at me. Walk on the crack in the paving. | 12 words; the hook. Was 17 words plus "Diagonals confuse them." |
| Mossley | Sixty units. Every road in Turfton, sixty units apart. | was 17 words in one line; the first half is the fact |
| Mossley | Does soil grow in squares? | the question he cannot answer |
| The player | Somebody planned the roads. That's what roads are. | the straight man: a flat fact, not a joke |
| Mossley | Code-Enforcement. Don't look at it. They measure everything after midnight. | the van; the freeze |
| Burt | He's right about the vans. I used to drive one. | the reaction beat (moved up from after the plan so the button can follow the last Mossley line); plants the HOA Audit |
| Mossley | Four survey markers, one at each corner of the grid. | was 18 words; split |
| Mossley | Then the dead centre. Zero, zero. | the second half |
| The player | What's at zero, zero? | the question |
| Mossley | Whatever they drew it with. | the button line |
| ~~Mossley~~ | ~~And don't take a free gun from Ammu-Gnation. Free means counted.~~ | cut: a side errand with no bearing on the quest |
| ~~The player~~ | ~~Their list got lost. They can't count anything.~~ | cut with the gun exchange |
| ~~Mossley~~ | ~~That's exactly what a list would want you to think.~~ | cut with the gun exchange |
| ~~Caption~~ | ~~Old Brick Quarter. Nobody is watching. Allegedly.~~ | cut: the picture and the hook do it |

Names checked: `npm run lore -- find mossley`, `find burt` (no new fact is stated).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `night` ambience, `mystery` music | the quarter's night bed, the place's theme from the start |
| 1.0 | door-free: none | the hook is Mossley's line |
| 18.0 | `danger` stinger | the van's headlights |
| 30.0 | `mystery` stinger on "Whatever they drew it with." (the existing one kept) | the button sting |

No held silence in the intro; the van and the sting carry the turn.

## 9. Blocking and vehicles

- Mossley starts on his pacing mark (the kerb), faces the player, and walks to his survey table (`MOSSLEY.at`) for the
  plan.
- The player walks in from (-64, 96) to the PLAYER mark (-70, 90), then faces Mossley on the lines; after the button
  walks to (-66, 92) and off.
- John Bodega sweeps the step in the background (his pace loop, not in any shot that talks).
- Burt stands at his mark (-77, 95) facing the player (his yaw is set to the player so the single shows his face).
- The HOA van (`hoa-van`, headlights on) drives south-to-north on the x = -62.5 road, from (-62.5, 70) to (-62.5, 140).

## 10. The button

Mossley, looking up past the camera at the sky, the mystery sting still ringing, and the camera tilting with his eyeline.
It is right because the scene's question (what is at zero, zero?) is answered only by his look away from the player.

## 11. Self-check

- [x] Want, obstacle, turn (the van); not a briefing (the objective is in Mossley's voice).
- [x] Hook in 1 s: a long lens on Mossley, the first line by 0.5 s; no opening narration.
- [x] Every line under 16 words (longest 12).
- [x] Mossley's whispers and numbers; the player's lines short; the straight man's single line.
- [x] Every speaker framed MS or closer, facing the camera (Burt yawed to the player).
- [x] One side of the line (`coverage('mossley','you',1)`).
- [x] Music changes with a reason; two stingers (`danger`, `mystery`); no held silence.
- [x] Plants the HOA Audit (Burt's van line) and the main-story zero.
- [x] Dusk held at golden; Mossley framed against the sky and the bodega front.
- [x] Report OK; removed from `pacing.baseline.ts` by the planner (not edited here).
- [x] Line of sight passes (`scenes.test.ts`, `sq-grid-truthers-intro`).
- [x] `direction.notes` points here.
