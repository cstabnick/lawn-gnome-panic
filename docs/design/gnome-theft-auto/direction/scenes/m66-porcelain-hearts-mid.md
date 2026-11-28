# Director's notes: `m66-porcelain-hearts-mid`

| | |
| --- | --- |
| Scene | `m66-porcelain-hearts-mid` in `src/cutscene/scenes/story/m66-porcelain-hearts.ts` |
| Played by | quest `m66-porcelain-hearts`, as the `scene` of the first visit (the sealed door), on arrival |
| Kind and length | `arrival`, aim 10-35 s; about 15 s |
| Where, when | stage `m66-porch-log`, the seal tape across the porch door, dusk (`sky: 'golden'`) |
| Before / after | before: the walk up to the tape; after: the photograph inspect past it |

## 1. Purpose in the story

They cross the HOA's seal tape together. The tape is the Association's new seal on a door Clara sealed herself: twice
shut. It is how the player learns she has not been here for years, without a line saying so.

## 2. The player's feeling

- **In:** wary; a door that is not allowed to be opened.
- **Out:** trusted with something: about to see what she has not looked at.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Clara | to cross | her own seal and theirs | plain statements; one warning | goes under the tape |
| The player | to help her over | none | lifts the tape | holds it for her |

## 4. Subtext

- "Twice shut" is the grief and the satire in one: the Association seals what is already sealed and calls it procedure.
- "Mind the tape. It is new." is care, said to the person who is lifting it for her.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2 | Hook | The tape, low, stirring; a board that creaks under no one. |
| 2 | 2-8 | Stop | "I sealed it myself. Years ago." Her hand does not quite touch the tape. "Now they have sealed it too. Twice shut." |
| 3 | 8-12 | Lift | The player lifts the tape. "Mind the tape. It is new." |
| 4 | 12-15 | Cross | They go under; the camera stays on the frame against the wall. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `tape` | 40 | locked, low | the tape | hook |
| 2 | `TAPE.single('clara','mcu',{height:'low'})` | 35 | locked | Clara | her first line |
| 3 | `insert('clara')` | 30 | locked, high | her hand by the tape | the almost-touch |
| 4 | `TAPE.single('clara','mcu')` | 35 | locked | Clara | "twice shut" |
| 5 | `shot('player','mcu')` | 35 | locked | the lift | action |
| 6 | `TAPE.single('clara','mcu',{height:'low'})` | 35 | locked | Clara | the warning |
| 7 | dolly past the posts onto the frame | 40 | slow | the photograph on the boards | the arrival |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Clara | I sealed it myself. Years ago. | |
| Clara | Now they have sealed it too. Twice shut. | |
| Clara | Mind the tape. It is new. | the outline's comms line |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `sad` music, `forest` bed (radio 0.1) | carried from the intro |
| 1 | `creak` | the porch boards |
| 6 | `cloth` | her sleeve by the tape |
| 9 | `rustle` | the tape lifted |
| 12 | `footsteps` | two sets, one light |

## 9. Blocking and vehicles

No vehicles. Clara stops beside the tape at about 2 m from the wall; the player is a pace behind her; they cross to the
boards by the wall where the framed photograph stands (a scene prop; the inspect objective places its own after).

## 10. The button

The frame against the wall at the end of a slow dolly, small and square on the boards. The scene stops before they reach it.

## 11. Self-check

- [x] Want (to cross), obstacle (two seals), turn (the lift).
- [x] Hook in 3 s.
- [x] No gag.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
