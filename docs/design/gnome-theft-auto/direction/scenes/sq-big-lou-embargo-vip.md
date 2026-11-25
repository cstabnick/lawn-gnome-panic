# Director's notes: `sq-big-lou-embargo-vip`

Re-directed against [../bible.md](../bible.md) and the template in [../TEMPLATE.md](../TEMPLATE.md). Watch it at
`http://localhost:5310/?no-intro&cutscene=sq-big-lou-embargo-vip`.

| | |
| --- | --- |
| Scene | `sq-big-lou-embargo-vip` in `src/cutscene/scenes/side/bigLou.ts` |
| Played by | quest `sq-big-lou-embargo` as its arrival (the beat after the intro: the recovered crate and the VIP car) |
| Kind and length | `arrival`, aim 10-35 s; now about 14 s at Normal text speed (was 8.3 s, 3 faults) |
| Where, when | downtown west end, at the VIP's Zero-Turn and the recovered crate (no stage: the scene's own marks); dusk, `sky: 'golden'`, the car's headlights on |
| Before / after | before: the Red Caps are cracked and the crate is back (the first objective). After: the drive to the Gnomecino VIP entrance (the second objective) |

## 1. Purpose in the story

The player has the crate back. The VIP car is the test Lou set in the intro: it must reach the Gnomecino without a speck.
This scene is the hand-off: the crate is at the player's feet, the Zero-Turn is spotless at the kerb, and Lou's voice
on the phone sets the second objective.

## 2. The player's feeling

- **In:** tired, having just won a street fight for forty towels.
- **Out:** the car is precious and the job is serious. The player takes the wheel.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| The player | to keep the car clean | the car's own dust, the kerb | a short warning, then agreement | takes the job |
| Big Lou (phone, off screen) | the car at the Gnomecino, unmarked | the distance, the player's mood | a clipped instruction | hangs up; the job is set |

## 4. Subtext

- The player's "Nobody touch the bonnet" is pride in a car they did not own an hour ago. Lou's call answers the fear
  under it: he trusts the player with the car only because the crate came back.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-1 | Hook | A handbrake release sfx on the car, the headlights come on (the light in the dark). |
| 2 | 1-4 | Establish | One wide of the car lit at the kerb, the crate at the edge; the caption "Recovered: one crate, forty towels, one tired gnome." (the one caption). |
| 3 | 4-7 | Setup | The player close: "Nobody touch the bonnet." |
| 4 | 7-11 | Turn | The car in shot, Lou's voice off screen on the phone: "Bring it round. Not a speck of mud on that car." (phone sfx) |
| 5 | 11-13 | Reply | The player close: "On it." |
| 6 | 13-14 | Button | The car wide, lit, waiting. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` pos above(-98, -46, 3.5), look `vip` | 48 | locked | the car, the crate | establish: the car lit, the crate on the kerb between the two |
| 2 | `cut` pos above(-84, -49, 1.6), look `you` | 32 | locked | the player | close on the player's warning; clear of the block to the north (the probe showed it) |
| 3 | `cut` pos above(-96, -54, 1.4), look `vip` | 36 | locked | the car | Lou's phone line sits on the car, not on an empty player |
| 4 | `cut` pos above(-84, -49, 1.6), look `you` | 32 | locked | the player | the reply |
| 5 | `cut` pos above(-98, -46, 3.5), look `vip` | 48 | locked | the car | the button: the car waiting |

No crossing: the car is the subject of the phone line, not a second speaker. The player's camera stays on the south side
of the block; the car's camera is west of the crate.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Player | Nobody touch the bonnet. | kept: the player's pride |
| Big Lou (phone) | Bring it round. Not a speck of mud on that car. | kept: Lou's instruction; off screen (a phone voice, the speaker is named in the subtitle) |
| Player | On it. | kept: the player takes the job |
| ~~Caption~~ | ~~Recovered: one crate, forty towels, one tired gnome.~~ | kept as the scene's one caption: the recovered crate is the picture's own information, not a description of it. Tired gnome is the lore's tone |

Names checked: `npm run lore -- find "Zero-Turn"`, `npm run lore -- find "big lou"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `handbrake-release` sfx at the car | the car is the hook: a sound with a car in it |
| 0 | `tension` music under the scene, `night` ambience | the test is on; the scene is short and tense |
| 7-11 | `phone` sfx on Lou's line | the phone is the reason Lou is heard and not seen |
| 11-13 | held pause (1.2 s) | the car's instruction lands |

No stinger: the arrival is a hand-off, not a reveal.

## 9. Blocking and vehicles

- The player stands at (-86, -44) facing the car; the crate is at (-93, -48) on the kerb.
- The VIP's Zero-Turn is parked at (-90, -56) facing +x, with its headlights switched on at the start (`lights` step).
- Nobody else moves. Lou is a voice on the phone.
- The player ends where they stand: the quest's drive starts from the car.

## 10. The button

The lit Zero-Turn, held still at the kerb after the player's "On it.", the headlights on the one clean thing in the
dark. It is the right last moment because the car is the job now, and the picture says so without a word.

## 11. Self-check

- [x] The scene has a want (the car clean), an obstacle (the kerb and the dust) and a turn (Lou's call).
- [x] The hook lands in 1 s (the handbrake release on the car), not on a caption.
- [x] Every line under 16 words (longest 10); nobody says what the picture shows; no coordinates.
- [x] The player's lines are two words to four.
- [x] Every speaker is framed close (cu or mcu) and turned to the camera; the off-screen phone voice is on the car.
- [x] Music has a reason at each change; no stinger.
- [x] Night scene lit: `sky: 'golden'` and the car's headlights.
- [x] Report: OK at 13.9 s (was 8.3 s, 3 faults); the dead shot and the player out of frame are gone.
- [x] `direction.notes` in the scene points at this file.
- E09 variety: the phone shot and the closing car shot are slow dollies on the same car (was five identical cuts); framing and eyelines unchanged.
