# Director's notes: `ch3-salvage-raid-p1-mid`

Watch it at `http://localhost:5310/?no-intro&cutscene=ch3-salvage-raid-p1-mid`.

| | |
| --- | --- |
| Scene | `ch3-salvage-raid-p1-mid` in `src/cutscene/scenes/story/m35-salvage-raid.ts` |
| Played by | quest `ch3-salvage-raid-p1` (Tuesday): the photograph step's `scene`, after the third photograph |
| Kind and length | `arrival`, aim 10-35 s; 21.5 s, no faults |
| Where, when | stages `patio-gate` and `patio-gate-vanline` (inside the compound wall); day, `sky: 'noon'` |
| Before / after | before: the player photographs the rota, the van line and the fuel cans at the Patio Gate. After: the race back to Side-Valve against the clock |

## 1. Purpose in the story

Shows the threat the crew cannot yet name: six HOA vans for "one yard, dusk", and a lock that "has been seen to".
Gary, bored as ever, drops the only clue about Cam ("Day off. Charter business."), which pays the charter thread from
rows 5, 30 and 34 without saying the word "sold". L95: the van line is a cutscene-only fleet.

## 2. The player's feeling

- **In:** curious, camera in hand, a little pleased with the photographs.
- **Out:** caught: the foreman has seen them, an engine starts, and the clock is running home.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Foreman | brief the drivers | a face at the gate | short, numbers | notices the player |
| Driver | know the one thing that worries him | | asks | reassured |
| Gary | no incidents on his shift | a camera at his gate | sighs, cites a section | lets slip where the valet is |
| Player | find Cam | Gary | two words | knows: dusk, the lock, the charter |

## 4. Subtext

"The lock has been seen to": someone inside opened it, or will. Gary dislikes Cam and is glad to report him absent.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3.4 | Hook | The shutter snap; a dolly through the gate gap down the van line; an engine warming |
| 2 | 3.4-10 | Setup | The rota slapped on a van: "Six vans. One yard. Dusk." / "And the lock on the bench?" / push-in, low: "The lock has been seen to." |
| 3 | 10-17 | Turn | Gary: "No photographs. Section twelve." / "Where's the valet?" / "Day off. Charter business." The player's face |
| 4 | 17-21.5 | Button | The foreman looks up: "...Who is that at the gate?" The first van's lights snap on; `danger`; engine rev on the low wide |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `dolly` through the gate gap | 46 | push | the van line | establishing as a reveal |
| 2-4 | `coverage(foreman, raider-a)` ms, mcu, push-in low | 35-40 | locked / push | the briefing | the threat line pushed |
| 5-8 | `coverage(gary, player)` singles + reaction | 35-40 | locked | the gate exchange | one side of their line |
| 9 | `frame` foreman mcu low toward the player | 35 | locked | the look up | being seen |
| 10 | `spot` vans-low | 44 | locked | headlights | the button |

Gary's mark is moved just over 10 m from the foreman's so the two conversations are separate lines.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Foreman | Six vans. One yard. Dusk. | the rota, read aloud |
| Driver | And the lock on the bench? | the only question that matters |
| Foreman | The lock has been seen to. | the inside job, unspoken |
| Gary | Sigh. No photographs. Section twelve. | his voice: sigh, section number |
| You | Where's the valet? | the straight man |
| Gary | Sigh. Day off. Charter business. | the charter thread |
| Foreman | ...Who is that at the gate? | the button |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `tension`, `garden` bed (Patio Heights); `snap` shutter; `engine-rev` low | the photograph, the engines warming |
| 3.4 | `thud`: the rota on the van flank | |
| 10 | `paper`: Gary's binder | |
| 19 | `danger` stinger on the headlights, `engine-rev` | the race starts on a sound |

## 9. Blocking and vehicles

Player at the gate gap (150.5, -126.5) with a `box-camera`; Gary by his sentry box (142.8, -134.2); the foreman between
the rows (150.5, -142) with an `hoa-clipboard`; two drivers. Six `hoa-van`s from the `patio-gate-vanline` vehicle marks,
two rows of three at x 144.5 and 155.5, noses to the gate; only `van-l1` lights up. The player is left at the gate for
the race's first checkpoint.

## 10. The button

The foreman looking straight at the lens, and the first van's lights coming on: they are coming, and now they know you
know.

## 11. Self-check

- [x] Want, obstacle, turn (Gary's slip, then being seen).
- [x] Hook at 0 s: the shutter and the dolly.
- [x] Lines under 16 words; no coordinates.
- [x] Gary sighs before every sentence; the player's line is three words.
- [x] One stinger; no gag (tension 8).
- [x] L95: a cutscene-only fleet of six vans.
- [x] Checker: 21.5 s, 0 faults; scenes.test line of sight passes.
