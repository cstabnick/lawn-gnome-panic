# Director's notes: `ch3-salvage-raid-p2-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=ch3-salvage-raid-p2-mid`.

| | |
| --- | --- |
| Scene | `ch3-salvage-raid-p2-mid` in `src/cutscene/scenes/story/m35-salvage-raid.ts` |
| Played by | quest `ch3-salvage-raid-p2` (Hold the Bay) as its outro (the row's "mid": the final starts straight after) |
| Kind and length | `outro`, aim 15-45 s; 37.8 s, no faults |
| Where, when | stages `side-valve-bay` and `side-valve-storeroom`; dusk, `sky: 'golden'`, the rain coming in |
| Before / after | before: the 75 s hold of Side-Valve Alley. After: the final's intro `salvage-raid-intro` (rain, the vans, Cam out of the van with the acorn, Vesper, Pip's arm) |

## 1. Purpose in the story

The betrayal, understood before it is seen. The raiders leave unbeaten because the hold was never the point: the bench
lock is open, the acorn cell is gone, and Tansy counts who had the number. Two did. Then her eyes go to the storeroom
wall: the broom is gone too. "Three." The final's intro shows the rest. Tension 8: no gag anywhere.

## 2. The player's feeling

- **In:** a win: the alley held, the crate is in.
- **Out:** the win was a decoy. The floor has gone; the rain is starting.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | know who | she already knows | counts, plainly | says it: "Three." |
| Pip | not be the one | the lock opened on the right number | pleads, honestly | believed ("I know."), then left with the truth |
| Player | | | still | a witness |

## 4. Subtext

"I know." is Tansy forgiving Pip before he has finished asking. "Three." is Cam's name, which she will not say.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | The HOA mowers turn for home at dusk, in no hurry |
| 2 | 3-7 | Setup | Pip: "They're going. Why are they going?" |
| 3 | 7-14 | The walk | Tansy's look, then her walk to the bench, full shot |
| 4 | 14-18 | Reveal | Insert: the shackle hanging open; music out; "It's open. The cell's gone." |
| 5 | 18-29 | The count | "We were all out front." / push-in: "Two of us had the number." / "I never wrote it down. I can't even keep a number." / "I know." |
| 6 | 29-33 | Turn | Her eyes to the corner: the storeroom wall, the cot, no broom; `reveal` on the picture |
| 7 | 33-37.8 | Button | "Three." Thunder; the rain bed comes in; Pip slumps; a high ms of Tansy, nobody moving |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` from the apron | 50 | pan | the mowers leaving | the hook |
| 2 | `coverage(tansy, pip, -1)` Pip ms | 40 | locked | the question | |
| 3-4 | Tansy mcu; Tansy fs walking | 35-45 | locked | knowing, then going | |
| 5 | `cut` insert of the bench lock | 34 | locked | the open shackle | picture first |
| 6-10 | coverage singles, a push-in on "Two of us" | 30-35 | locked / push | the count | tightening |
| 11 | `spot` side-valve-storeroom door-wide | 50 | locked | the cot without the broom | the reveal |
| 12-14 | Tansy cu; Pip reaction; Tansy ms high | 30-40 | locked | "Three." | the cornered one, high |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | They're going. Why are they going? | the question that turns it |
| Tansy | It's open. The cell's gone. | the outline's beat, after the picture |
| Pip | We were all out front. All of us. | |
| Tansy | Two of us had the number. | the comms line, moved into the scene |
| Pip | I never wrote it down. I can't even keep a number. | his bible weakness, played straight |
| Tansy | I know. | |
| Tansy | Three. | the count; Cam is not named |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `street` bed, no music; `engine-rev` as they leave | the deflation |
| 14 | `latch` on the insert | the shackle |
| 30 | `reveal` stinger on the empty wall | on the picture, not the line |
| 34 | `thunder`, `rain` bed fades in | the final's intro opens in rain |

## 9. Blocking and vehicles

Player (-150.5, 66.8), Pip (-147.2, 66.2) and Tansy (-149.2, 68.8) out front after the hold; Tansy walks to the bench
(-156.8, 73.9); Pip follows to (-154, 72.2). Props: `bench-lock` on the workbench, `cargo-crate` (loaded), and the
`camp-bedroll` at the storeroom with no broom beside it. Two HOA `ride-on`s with raiders drive west along the z = 60
road and up the x = -180 road. Pip's and Tansy's Zero-Turns on their marks.

## 10. The button

Tansy, seen from above, after "Three.", with the first thunder and the rain arriving: the last still moment before the
vans.

## 11. Self-check

- [x] Want, obstacle, turn (the empty wall), button.
- [x] Hook at 0 s: the mowers leaving.
- [x] Lines under 16 words; nobody says what the picture shows (the broom is never mentioned).
- [x] One side of the Tansy-Pip line (`coverage('tansy', 'pip', -1)`).
- [x] One stinger; music out for the reveal; no gag; no handheld.
- [x] The arm does not crack here (it cracks in the final's intro).
- [x] Checker: 37.8 s, 0 faults; scenes.test line of sight passes.
