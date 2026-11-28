# Director's notes: `diggs-medal-shed`

| | |
| --- | --- |
| Scene | `diggs-medal-shed` in `src/cutscene/scenes/story/m61-diggs-medal.ts` |
| Played by | quest `m61-diggs-medal`, as the beat scene (`beats: { 2 }`) when the clerks are cracked and the steal-deliver step begins |
| Kind and length | `arrival`, aim 10-35 s; about 10 s |
| Where, when | stage `hoa-lost-property` (the HOA lost-property cabin outside Fort Sandpit's gate), dusk (`sky: 'golden'`) |
| Before / after | before: the clerks run; after: the drive home in the clerks' van |

## 1. Purpose in the story

The medal is taken, and the player sees what fifteen years of "lost" looks like. Wordless on purpose: the quiet row has no gag and no speech here.

## 2. The player's feeling

- **In:** a fight with two clerks who ran.
- **Out:** a small tin star in the palm, still tagged, and a reason to go home gently.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| The player | to lift the medal off its hook | nothing now; the clerks are gone | slowness | holds it |

## 4. Subtext

A rail of tagged hats: every lost thing has a number and nobody's name. The medal is one of them.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Wide on the cabin: a stamp on its pad, flutter of tags, a clatter inside; the player walks up. |
| 2 | 5-8 | Setup | The rail: six hats and a star. |
| 3 | 8-10 | Turn | The lift: a hand, a hook, a clink. |
| 4 | 10 | Button | Close, high: the star in the palm with its beige tag. |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage `shed-wide` | 46 | locked | cabin and rail | hook |
| 2 | stage `rail` | 36 | locked | the hats and the star | the discovery |
| 3 | `shot('player','mcu')` | 35 | locked | the lift | the act |
| 4 | `insert('player')` | 30 | locked, high | the medal | the button |

## 7. Dialogue pass

None. Scene is silent on purpose.

## 8. Music and sound

`wind` bed, no music. `flutter` x2 (tags), `clatter` (the cabin), `keys` (rail hooks), `clink` (the lift), `paper` (the tag).

## 9. Blocking and vehicles

Rail at (399.7, 58.4) facing west; the scene medal prop hangs on it at 0.86 m; the player walks in from the road to (395.5, 58.4). The clerks' van stays parked at (392, 66).

## 10. The button

The star in an open hand, a beige tag turning on its string.

## 11. Self-check

- [x] No dialogue; the turn is the lift.
- [x] Hook within 3 s (flutter, clatter, a walk).
- [x] Props are prefabs; the lit dusk is `sky: 'golden'`.
- [x] `cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
