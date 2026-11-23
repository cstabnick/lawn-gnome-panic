# Director's notes: `first-contract-outro`

Watch it at `http://localhost:5310/?no-intro&cutscene=first-contract-outro`.

| | |
| --- | --- |
| Scene | `first-contract-outro` in `src/cutscene/scenes/story/ch1.ts` |
| Played by | quest `first-contract` as its outro |
| Kind and length | `outro`, aim 15-45 s; 34 s (was 28.6 s, 7 faults) |
| Where, when | stage `mulch-club-door` (the side door, mushroom lamps); dusk, `sky: 'golden'` so the dark suits read |
| Before / after | before: the player cracked the third gold hat, far away. After: the CONTRACT COMPLETE banner (Made Gnome, Wiseguy Hat) |

## 1. Purpose in the story

The payoff for the first job, told as a "meanwhile" (no player actor: they are three biomes away). Three taps make the
player a Made Gnome. Then the escalation: a fourth tap, which nobody has heard before. It pays off the intro's tap code
one notch up (bible law 2) and replaces the old Narrator line that explained the joke ("He only wanted the door held").

## 2. The player's feeling

- **In:** just cracked the last target; proud.
- **Out:** rewarded (Made Gnome, a thousand off the debt) and laughing at the guards.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Don Compost | to get in out of the evening | nobody knows what four means | one more tap, and wait | the door is held |
| Guard 1 | to report well | the fourth tap | guesses, lunges | right, for once |
| Guard 2 | to look busy | the boss is early | crosses his arms; relays the reward | learns a new number |

## 4. Subtext

The guards' whole job is reading a silent man. Every new tap is a crisis.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Guard 2 MCU hears an engine: "Boss is early. Look busy." |
| 2 | 3-15 | Arrival | The gloss-black Lowrider glides in under the lamps and parks on the strip; the Don walks to the door |
| 3 | 15-26 | Report and reward | OTS: "All three cracked, boss." Three taps on a low CU. "The new kid's a Made Gnome." "Wiseguy Hat's on the house." |
| 4 | 26-31 | Turn | A fourth tap. The music stops. The guards look at each other. |
| 5 | 31-34 | Button | Guard 1 lunges for the door (one comic sting); the Don goes in. "Four's the door." "Write that down." |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('guard-2','mcu',{side:30})` | 35 | locked | guard 2 | open on a face mid-reaction |
| 2 | `track` the Lowrider | 48 | pan | the car | the boss's entrance is his car |
| 3 | `shot('don','ms',{toward:'guard-1'})` | 40 | moves with him | the walk to the door | |
| 4 | `DOOR.ots('guard-1')` over the Don | 35 | locked | the report | the boss in the foreground |
| 5 | `DOOR.single('don','mcu',low)` | 35 | locked | the taps | |
| 6-7 | singles on the guards | 35 | locked | the reward lines | |
| 8 | `DOOR.single('don','mcu',low)` | 35 | locked | the fourth tap | |
| 9 | `cut` across the step | 46 | locked | the two guards and the door | the look between them and the lunge: the gag's whole action |
| 10-11 | singles on the guards | 35 | locked | the button exchange | |

Side: guard 1 and the Don on `coverage('guard-1','don', -1)`.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Guard 2 | Boss is early. Look busy. | kept; now seen |
| Guard 1 | Dibbler. Gravelbottom. Spadewell. All three cracked, boss. | kept |
| ~~Guard 1~~ | ~~Evening, boss. Good news, for once.~~ | cut: padding |
| Guard 1 | Three taps. The new kid's a Made Gnome. | trimmed |
| Guard 2 | Wiseguy Hat's on the house. A thousand off the debt. | merged two lines |
| ~~Narrator~~ | ~~Everyone freezes. He only wanted the door held.~~ | cut: explained the joke; the picture shows it |
| Guard 2 | Four's the door. | new |
| Guard 1 | Write that down. | new: the button |

Ruling R-100 (docs/lore/rulings.md): four taps means "the door".

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `night` ambience, `engine-rev` | the hook is a sound |
| 0.4 | `heist` in on guard 2's line | the mob's world |
| 22-24 | `knock` x3 | Made Gnome |
| 30.7 | music out (0.3); `knock` | the fourth tap lands in silence |
| 33 | `door`, `comic` stinger | the lunge (the one physical gag) |
| 34.9 | `turfton-dusk` in | the quiet win |

## 9. Blocking and vehicles

The Lowrider (`rideOf('don-compost')`, headlights on) drives south down the x = 0 road from z -80 and swings onto the
pavement strip at (-9, -37.5), the stage's `don-lowrider` mark. The Don walks to the step (-15.9, -31.7), close enough to his guard for an over-the-shoulder, then through
the door (-19, -30) and is despawned inside. The guards on their stage marks flank the door; guard 1 runs to
(-17.2, -31.2) to hold it.

## 10. The button

"Four's the door." "Write that down.": the code has grown a number, and the guards will be learning it for the rest of
the game. The last image is guard 1's deadpan face.

## 11. Self-check

- [x] Want, obstacle, turn (the fourth tap).
- [x] Hook at 0 s on a face; no narration.
- [x] Every line under 16 words.
- [x] Every speaker MCU, facing the camera.
- [x] One side of the line; dusk lit with `sky: 'golden'` and the headlights.
- [x] Report OK; removed from `pacing.baseline.ts`.
- [x] `npm test` passes; watched at desktop and phone size.
- [x] `direction.notes` points here.
