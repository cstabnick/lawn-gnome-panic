# Director's notes: `first-contract-intro`

New in the direction pass: First Contract used to play the old wanted-poster card (`{ kind: 'contract' }`). Watch it at
`http://localhost:5310/?no-intro&cutscene=first-contract-intro`.

| | |
| --- | --- |
| Scene | `first-contract-intro` in `src/cutscene/scenes/story/ch1.ts` |
| Played by | quest `first-contract` as its intro, given at the Mulch Club (`quests/chapter1.ts`, `cutscene: { kind: 'script', script: 'first-contract-intro' }`) |
| Kind and length | `intro`, aim 30-60 s; 35 s |
| Where, when | room stage `mulch-club` (the velvet back room: rug, bookshelves, lamp, the side table); evening |
| Before / after | before: the prologue (the player is broke, five thousand Acorns in debt). After: crack three gold-hatted gnomes in three biomes, then `first-contract-outro` |

## 1. Purpose in the story

Chapter 1 asks whether the player can pay their way out. This is the first way: work for the mob. It introduces Don
Compost under R-025 (silent, the armchair, two bodyguards, wanted posters, a point) and the tap code the bible gives
him: one tap a mower, two acorns, three crack a hat. The comedy is the room: a guard who translates with more
confidence than knowledge, a second guard who is plainly afraid. Plants the code for `first-contract-outro` (where a
fourth tap turns up) and for any later Don scene.

## 2. The player's feeling

- **In:** curious, walking into a mob boss's back room.
- **Out:** amused and slightly intimidated; the job is clear (three gold hats, a thousand off the debt), and the Don has
  not said a word.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Don Compost | to hire the player without speaking | (none: the room fears him) | taps, a point | the job is given |
| Bodyguard 1 (the translator) | to look like he understands the Don | he is guessing | confident paraphrase, deadpan menace | lands the threat |
| Bodyguard 2 | to get one right | nerves | blurts the easy one ("Acorns!") | flinches at three |
| The player | to know what the job is | nobody will say it | two-word questions | takes it |

## 4. Subtext

- Bodyguard 1's "Then you'll leave on one" is a recovery: he read the tap wrong and turned it into a threat.
- "Three is the one we don't say in here" means crack a hat; the room's fear says it for him (bible: frame the room).

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2 | Hook | Low MS of the Don in his armchair; one tap (a knock) in silence but for the `heist` bed |
| 2 | 2-10 | Setup | Guard 1 translates the tap as a mower; the player: "I walked." A beat: "Then you'll leave on one." |
| 3 | 10-18 | The offer | Two taps. Guard 2: "Two taps. Acorns!" Guard 1: a thousand off the debt. The player: "For what?" |
| 4 | 18-24 | Turn | Three wanted posters land on the felt one at a time (insert, three thuds); Guard 2 names them: gold hats |
| 5 | 24-32 | The threat | Music out. Three taps on a CU. Guard 2 flinches. "Meaning?" "Three is the one we don't say in here." `tension` in |
| 6 | 32-35 | Button | Wide: the Don raises one finger at the door; both guards turn their heads to the player in unison; the player goes; the door |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `BOSS.single('don','ms',{height:'low'})` | 40 | locked | the Don | the boss shot from below, alone |
| 2-4 | `DEAL` singles (guard 1 / the player), MCU | 35 | locked | the translation | one side of the line |
| 5 | `BOSS.single('don','mcu',low)` | 35 | locked | two taps | the hand speaks |
| 6 | `shot('guard-2','mcu',{toward:'player',side:25})` | 35 | locked | guard 2 | his little triumph |
| 7 | insert `cut` from above the side table | 40 | locked | the posters | the job, picture first |
| 8 | `BOSS.single('don','cu',low)` | 30 | locked | three taps | the threat tightens to a close-up |
| 9 | `reaction('guard-2', flinch)` | 35 | locked | guard 2 | the room's fear is the menace |
| 10-11 | `DEAL` player MCU, guard 1 CU | 30-35 | locked | the last exchange | tightening as it escalates |
| 12 | `cut` wide from the player's side | 46 | locked | the room | the point and the two heads turning: the gag needs the whole room |

Sides: guard 1 and the player on `coverage('guard-1','player', -1)`; the Don and the player on
`coverage('don','player', -1)` (both keep the camera off the side table).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Guard 1 | One tap. The Don says you came on a mower. | the code, wrong-footed |
| Player | I walked. | |
| Guard 1 | Then you'll leave on one. | the recovery that becomes a threat |
| Guard 2 | Two taps. Acorns! | the one he knows |
| Guard 1 | A thousand off your Kiln-Debt. He's in a giving mood. | the reward, in character |
| Player | For what? | |
| Guard 2 | Dibbler. Gravelbottom. Spadewell. Gold hats. You can't miss them. | the targets; no places (the HUD has them) |
| Player | Meaning? | |
| Guard 1 | Three is the one we don't say in here. | the threat by omission |

The Don says nothing (R-025). The tap code (one a mower, two acorns, three crack a hat) is the bible's; the fourth tap
in the outro is ruling R-100. Names checked: `npm run lore -- find dibbler`, `gravelbottom`, `spadewell`, `mulch club`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `heist` low, `room` ambience; `knock` (one tap) | the club's cool; the tap is the hook |
| 10.6 | `knock` x2 | two taps |
| 18.6 | `thud` x3 (the posters) | the job lands |
| 24.2 | music out (0.5); `knock` x3 | silence makes the threat |
| 28.7 | `tension` in on guard 1's line | the menace stays |
| 34 | `door` | the player is out |

No stingers: the taps are the stingers.

## 9. Blocking and vehicles

Room-local. The Don in an `armchair` prop at (0, -4.4), standing mark (0, -4.2), scale 1.75, `sit` pose. Guard 1 at
(-1.4, -4.3), guard 2 at (1.25, -4.3), both with `gta-pistol`, facing the player. The player at (0, 0.4) facing the Don,
leaves for (0, 3.8) in the button. Three `wanted-poster` props on the room's side table (top at y 1.02, x 1.0-2.1, z
-2.7), hidden until they land. Everyone stands off the rug (it is a low collider) and clear of the lamp.

## 10. The button

The Don's single finger at the door and two heads turning to the player at the same moment: the room answers for him,
which is the whole idea of Don Compost.

## 11. Self-check

- [x] Want, obstacle, turn: the posters; the third tap; the point.
- [x] Hook by 1 s (the tap); no narration.
- [x] Every line under 16 words; no coordinates; the Don silent.
- [x] Voices: the guards nervous and formal; the player two words.
- [x] Every speaker MCU or closer, facing the camera; a reaction on the threat.
- [x] One side of the line per conversation.
- [x] Music out once with a reason; no stingers.
- [x] Plants the tap code; the fourth tap pays off in the outro.
- [x] Room lit by the set's lamp.
- [x] Report OK (never in the baseline).
- [x] `npm test` passes; watched at desktop and phone size.
- [x] `direction.notes` points here.
Intro card: Don Compost after his first tap. Big Lou is not in this scene (he is the Gnomecino door), so no card here.
