# Director's notes: `under-the-span-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=under-the-span-outro`.

| | |
| --- | --- |
| Scene | `under-the-span-outro` in `src/cutscene/scenes/story/m10-under-the-span.ts` |
| Played by | quest `m10-under-the-span` as its outro (the jammer delivered to Pip at Side-Valve Salvage) |
| Kind and length | `outro`, aim 15-45 s; 17.2 s at Normal text speed, no faults |
| Where, when | stage `side-valve-bay`; dusk (`sky: 'golden'`) |
| Before / after | before: the Underspan, the Dewdrop and the citation. After: the Mulch Club's two taps (row 11) |

## 1. Purpose in the story

Pays off the errand and plants the row's last thread: Pip dodges Hogweed's Fescue question and hides the jammer in the
toolbox where he keeps a small glass vial wrapped in a rag (row 14's bench, row 26's pour). The vial is shown, never named.

## 2. The player's feeling

- **In:** carrying a tin box that hums.
- **Out:** sure Pip is lying, and sure it is not about the jammer.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to get the jammer into the toolbox unseen | the player's question | delight, then a flat denial | sits on the toolbox |
| The player | to deliver and relay Hogweed's question | Pip's deflection | the plain question | no answer |
| Cam | none | n/a | watches the bay | stops sweeping |

## 4. Subtext

- "Never heard of it. Sounds like a mower." Pip is the reason the question is asked.
- The vial in the toolbox is the only answer the scene gives, and it is on screen for a beat and a half.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | "Is that it? Is that the jammer?" The jammer changes hands |
| 2 | 5-9 | Setup | "Hogweed says to ask you about Fescue." |
| 3 | 9-13 | Turn | "Fescue? Never heard of it. Sounds like a mower." |
| 4 | 13-15 | Insert | The jammer goes into the toolbox, a vial in a rag beside it, the latch |
| 5 | 15-17 | Button | "Totally normal toolbox."; Cam has stopped sweeping |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `OUTRO_TALK.single('pip','mcu')` | 35 | locked | Pip | the hook |
| 2 | `OUTRO_TALK.single('player','mcu')` | 35 | locked | the player | the plain question |
| 3 | `OUTRO_TALK.single('pip','mcu')` | 35 | locked | Pip | the dodge |
| 4 | `cut` high, on the toolbox | 34 | locked | the toolbox | the insert (1.6 s) |
| 5 | `OUTRO_TALK.single('pip','ms')` | 40 | locked | Pip | the button |

Side of the line: `coverage('pip','player',-1)` all scene (the intro used +1; this is a new day).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Is that it? Is that the jammer? Oh, it is beautiful. | delight |
| Player | Hogweed says to ask you about Fescue. | relays the question |
| Pip | Fescue? Never heard of it. Sounds like a mower. | the lie; second sentence undoes the first |
| Pip | Totally normal toolbox. | the button |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton-dusk` music, `street` bed | the end of the day |
| 5 | `clatter` | the jammer changes hands |
| 13 | `latch` | the toolbox |

## 9. Blocking and vehicles

- Pip by the bench at (-157.4, 73.6), the player at the bay mark (-156, 70) holding the jammer. The toolbox on the
  ground at (-156.2, 73.4); the vial prop appears on it for the insert. Cam at his mark (-156, 68), turns on the last line.

## 10. The button

"Totally normal toolbox." with Cam's head turning: the most suspicious toolbox in Turfton.

## 11. Self-check

- [x] Want, obstacle, turn, button.
- [x] Hook in 3 s: a line on a character.
- [x] Lines under 16 words; the vial is shown, not told.
- [x] Voices: Pip's run-on and flat denial.
- [x] Speakers at MS or closer.
- [x] One side of the line.
- [x] Music `turfton-dusk`, no stinger.
- [x] Running jokes: Pip and the vial planted.
- [x] Dusk scene, `sky: 'golden'`.
- [x] Cutscene report OK.
- [x] `direction.notes` points here.
