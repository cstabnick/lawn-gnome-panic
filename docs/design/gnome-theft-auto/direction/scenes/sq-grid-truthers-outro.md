# Director's notes: `sq-grid-truthers-outro`

| | |
| --- | --- |
| Scene | `sq-grid-truthers-outro` in `src/cutscene/scenes/side/gridTruthers.ts` |
| Played by | quest `sq-grid-truthers` ("The Grid Truthers") as its outro, when the player has found the datum at (0, 0) under the crossing |
| Kind and length | `outro`, aim 40-55 s, max 60; now 47.3 s at Normal text speed (was 70.0 s, 13 faults; over the 60 s limit) |
| Where, when | stage `culvert-under-deck` (quests/stages/turfton.ts, the crossing by the portal lot), dusk held at `sky: 'golden'`; a meanwhile-free scene, the player is on the spot |
| Before / after | before: the player digs at the datum (the storm grate). After: the Pencil is in the player's hands and Silt-Diver Sal walks past; the quest's next step (the maps are corrected by Friday) |

## 1. Purpose in the story

The payoff of the Grid Truthers quest. The datum at zero, zero is a storm grate over a giant pencil, a Tall-One
artisan eyebrow pencil, and someone has been rubbing the old names out of Turfton with it. It answers the intro's
question ("Whatever they drew it with") and plants the main story: Vesper's HOA will correct the maps by Friday.

The old scene opened on a locked-off wide with a caption and a two-line gag about the Tall Ones; the Pencil was
revealed after the talking had started, and the lines were said to Mossley's back.

## 2. The player's feeling

- **In:** tense (the grate is moving under their boots, a shake, a thud).
- **Out:** amazed and slightly sick (the Tall Ones exist, someone is rubbing out the streets) and then deflated by
  Mossley's retirement and the artisan eyebrow pencil. The job is over; the maps will be corrected.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Mossley | to prove the grid was watched and get out before the HOA | the Pencil is heavy and his retirement is today | awe, then a sincere line, then a retired man's shrug | from prophet to a man with a ruler, chipping at graphite |
| The player | to understand what they found | the Pencil is not a weapon or a map | a flat observation ("The eraser end is worn right down."), a flat question | nods and takes the knowledge |
| Silt-Diver Sal | to walk past | nothing; she is a silent extra | walks the stage path and does not look | (background) |

## 4. Subtext

- The Pencil is someone's, and the eraser is worn down: the streets were rubbed out a long time ago and it is still
  going on. Mossley is the first to say it out loud.
- "I retire today" is a man who has been doing this too long; the deflation is his fear, not a joke.
- The HOA is not named as a villain; it is the department that will "correct" the maps, which the player will hear again.

## 5. Beat sheet

Timings at Normal text speed.

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-1 | Hook | An insert low at the grate (no talking): shake and a `thud` as the grate gives. |
| 2 | 1-5 | The Pencil | `reveal` stinger; the Pencil spawns in the drain; a 4 s low dolly up its length, held with no line (`wait: true`). |
| 3 | 5-12 | Awe | Mossley, a single: "Oh. Redwood-sized cedar. Somebody sharpened it and left it under the kerb." |
| 4 | 12-16 | Turn | The player, on a single: "The eraser end is worn right down." |
| 5 | 16-24 | The sincere line | Music out (0.4 s). Mossley: "Somebody has been rubbing things out of Turfton." A Pencil insert, then a held `silence` (2 s). |
| 6 | 24-34 | Deflation | Music back (`mystery`). Mossley: "Three pounds of graphite, give or take. Artisan eyebrow pencil. I retire today." The player: "That's stealing from the Tall Ones." Mossley: "Nobody has ever seen a Tall One. Nobody will notice a few grams." |
| 7 | 34-42 | Tie | A nod reaction from the player (the held beat). Mossley: "Vesper's HOA will correct the maps by Friday." |
| 8 | 42-47 | Button | Sal walks past the crossing and does not look. A slow dolly over the player's shoulder onto the Pencil; Mossley points at the graphite with his ruler; hold 2.8 s. |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | hand-placed `cut` from 4 m up on the east lawn side (clear of the player and of the set boxes), handheld 0.02 | 40 | locked | the grate | the hook: picture and sound, no one talks; kept high so the lens looks at lit ground, not into a building's shadow |
| 2 | dolly up the Pencil, `wait: true` | 46 | slow low push | the Pencil | the reveal, held with no line |
| 3 | `OUT_TALK.single('mossley','cu')` | 35 | locked | Mossley | the awe |
| 4 | `OUT_TALK.single('you','mcu')` (player faces Mossley first) | 35 | locked | player | the turn: the flat observation |
| 5 | `OUT_TALK.single('mossley','mcu')` | 35 | locked | Mossley | the sincere line |
| 6 | hand-placed `cut` on the Pencil, during the silence | 34 | locked | the Pencil | the held beat has a picture |
| 7 | `OUT_TALK.single('mossley','mcu')`, then `OUT_TALK.single('you','mcu')` | 35 | locked | Mossley / player | the deflation and the Tall Ones line |
| 8 | `reaction('you', {toward:'mossley', gesture:'nod', hold:'pause'})` then `OUT_TALK.single('mossley','mcu')` | 35 | locked | player, then Mossley | the tie line, with a reaction |
| 9 | dolly over the player's shoulder onto the Pencil, handheld 0.02 | 40 | slow | the Pencil | the button |

Side of the line: Mossley and the player on `coverage('mossley','you',1)`; the player turns to Mossley before each of his
lines (no back of the head on a single).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Mossley | Oh. Redwood-sized cedar. Somebody sharpened it and left it under the kerb. | was three lines (awe, sharpened, dark); merged to one line and one shot |
| The player | The eraser end is worn right down. | the turn; a flat observation, kept |
| Mossley | Somebody has been rubbing things out of Turfton. | was "...The streets. The old names." (cut: the streets are on the map already) |
| Mossley | Three pounds of graphite, give or take. Artisan eyebrow pencil. I retire today. | 13 words; kept, the deflation |
| The player | That's stealing from the Tall Ones. | kept (the outro's one joke, from the player's straight face) |
| Mossley | Nobody has ever seen a Tall One. Nobody will notice a few grams. | kept; the Tall One line is the deadpan |
| Mossley | Vesper's HOA will correct the maps by Friday. | was 17 words with the Turfton FM line; the FM sinkhole line cut (the HOA line is the tie) |
| ~~Mossley~~ | ~~Sixty units from the bodega. Dead centre. Zero, zero.~~ | cut: the picture says it; the awe needed the room |
| ~~Caption~~ | ~~(the opening caption)~~ | cut: the grate and the thud do it |
| ~~Player~~ | ~~Mossley, the grate is moving.~~ | cut: the picture is the hook (a line on the hook would wait for the sound) |
| ~~Mossley~~ | ~~Turfton FM will call this a sinkhole by breakfast.~~ | cut: the outro is long enough without the radio tie |

Names checked: `npm run lore -- find "tall one"`, `find vesper`, `find "eyebrow"` (no new fact is stated).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | shake 0.22 for 1.8 s, `thud` sfx | the grate gives |
| 1.0 | `reveal` stinger | the Pencil rolls up out of the drain |
| 5.0 | `mystery` music (kept from the start) | the place's theme under the awe |
| 16.0 | music out (0.4 s) | the sincere line |
| 19.0 | held `silence` (2 s) | the one held silence |
| 24.0 | `mystery` back (fade 1.2) | the deflation |

No further stingers. The `reveal` and the held silence are the two big beats; the scene has no `mystery` stinger.

## 9. Blocking and vehicles

- Mossley starts at (-6, -6) and faces the player; the player starts at (-7.5, -8). Both face the Pencil for the awe, then
  face each other on the singles.
- The Pencil (`tall-one-pencil`, size 10) spawns at (-15, -16) in the drain, yaw pi/2.
- Silt-Diver Sal walks her loop on `culvert-under-deck` (`walkOf`) past the crossing, not looking at the pencil.
- The area is clear of traffic and pedestrians (`clearArea` at (-10, -11), radius 18) so the crossing is still.
- No vehicles.

## 10. The button

The player and Mossley's ruler on the graphite, the Pencil in the foreground, and Sal walking past without looking. It
is right because the quest's turn is a man retiring from a job that is not finished, and the last picture is the
evidence that the job goes on.

## 11. Self-check

- [x] Want, obstacle, turn (the Pencil and the Tall Ones); not a briefing.
- [x] Hook in 1 s: the grate and the thud, picture first, no narration.
- [x] Every line under 16 words (longest 13); no coordinates or waypoint read-outs.
- [x] Mossley's sincere line on a single; the player's lines short; the Tall Ones line kept deadpan.
- [x] Every speaker framed MS or closer, facing the camera (the player turns to Mossley before his lines).
- [x] One side of the line (`coverage('mossley','you',1)`).
- [x] Music has a reason at each change; one `reveal` and one `mystery` stinger; one held silence.
- [x] Running jokes: the Tall Ones line is the one joke; no winks.
- [x] Dusk held at golden.
- [x] Report OK; line of sight passes (`scenes.test.ts`, `sq-grid-truthers-outro`).
- [x] `direction.notes` points here.
