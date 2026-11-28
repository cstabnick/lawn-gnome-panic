# Director's notes: `ch3-salvage-raid-p2-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=ch3-salvage-raid-p2-intro`.

| | |
| --- | --- |
| Scene | `ch3-salvage-raid-p2-intro` in `src/cutscene/scenes/story/m35-salvage-raid.ts` |
| Played by | quest `ch3-salvage-raid-p2` (Hold the Bay) as its intro, taken at Side-Valve |
| Kind and length | `intro`, aim 30-60 s; 30.6 s, no faults |
| Where, when | stage `side-valve-bay`; noon, `sky: 'noon'` |
| Before / after | before: the race back from the Patio Gate (p1). After: hold Side-Valve Alley for 75 s in two waves |

## 1. Purpose in the story

The crew packs what it cannot lose. The forty-seven wrenches come off the wall (the count from the party, run
backwards), the cigar box stays in Tansy's hands (the forty-eighth wrench ladder), and the Golden Acorn stays in the
bench lock because it is "the safest thing in Turfton": the setup the p2 outro pays off. Then the mowers come early.

## 2. The player's feeling

- **In:** out of breath from the race, photographs delivered.
- **Out:** a job with a clock (hold the alley) and an itch they cannot scratch: the acorn is staying behind.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | save the bay's heart before dusk | there is no time; the raid is early | counts, short orders | turns to the player and means it |
| Pip | help, now | he does not know what matters most | asks the practical question, reaches for the box | sees the mowers first |
| Player | | | a nod | holds the alley |

## 4. Subtext

Tansy trusts a lock because she cannot afford to trust anything else today. "I carry the box": the wrench she has
never told anyone about is the one thing she will run with.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A wrench off its hook (clink), on the hands: "Forty-five. Forty-six." |
| 2 | 3-12 | Setup | Pip at the crate: the acorn? / "Bench lock. Hogweed's best. Safest thing in Turfton." |
| 3 | 12-18 | The box | Pip lifts the cigar box; "Not the box. I carry the box."; she takes it; "Forty-seven." |
| 4 | 18-24 | Turn | Two HOA mowers roll up the z = 60 road off the Bodega corner; Pip: "The rota said dusk. It isn't dusk." |
| 5 | 24-30.6 | Button | Tansy to the player: "Then they're early. Hold the alley. We load." The nod; `chase`, `danger`, a raider revs |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `insert` Tansy's hands | 30 | locked | the wrenches | the count |
| 2-3 | `coverage(tansy, pip)` Pip ms, Tansy mcu | 35-40 | locked | the acorn question | the setup |
| 4 | `insert` Pip's hands, the box | 30 | locked | the cigar box | the ladder prop |
| 5-6 | coverage Tansy ms; Tansy ms high | 40 | locked | "Forty-seven." | |
| 7 | `track` from the apron | 50 | pan | the mowers arriving | the arrival |
| 8-9 | Pip mcu straight on, then coverage single | 35 | locked | Pip sees them | |
| 10 | `pushIn` Tansy mcu | 35 | push | the order | a decision |
| 11 | reaction player | 35 | locked | the nod | |
| 12 | `frame` raider ms low | 40 | locked | the rev | the threat |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tansy | Forty-five. Forty-six. | the party count, backwards |
| Pip | Shouldn't the acorn go in first? Before the wrenches? | the right question |
| Tansy | Bench lock. Hogweed's best. Safest thing in Turfton. | the setup for the outro |
| Tansy | Not the box. I carry the box. | the brass wrench ladder, unopened |
| Tansy | Forty-seven. | |
| Pip | The rota said dusk. It isn't dusk. | ties p1's photograph to now |
| Tansy | Then they're early. Hold the alley. We load. | the job (three clauses) |

No gag (the batch-3 rule for p2).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `tension`, `street` bed; `clink` on the wrench | |
| 4, 13, 16 | `clatter` crate, `creak` box lid, `clink` | packing foley |
| 18 | `engine-rev` as the mowers arrive | |
| 28 | `chase` + `danger` on the raider's rev | the derby starts |

## 9. Blocking and vehicles

Tansy at the wall rack (-147, 77.9), Pip at the crate (-140.6, 74.6), the player on the apron (-148.5, 70.2), left there
for the derby (arena centre -162, 62). Scene props: `wrench-rack` on the bay's front wall, `cargo-crate`, `bench-lock`
on the workbench; Pip's and Tansy's Zero-Turns on their marks; two HOA `ride-on`s with raiders drive in along both
lanes of the z = 60 road and stop off the apron.

## 10. The button

A raider low in frame, engine revving at the bay: the hold starts on the sound.

## 11. Self-check

- [x] Want (pack), obstacle (early raid), turn (the mowers), button (the order and the rev).
- [x] Hook at 0 s.
- [x] Lines under 16 words; Tansy's three clauses.
- [x] One side of the Tansy-Pip line.
- [x] One stinger; no gag.
- [x] Ladders: the count, the cigar box unopened; the acorn setup for the outro.
- [x] Checker: 30.6 s, 0 faults; scenes.test line of sight passes.
