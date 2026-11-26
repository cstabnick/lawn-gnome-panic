# Director's notes: `m24-the-burrow-door-intro`

| | |
| --- | --- |
| Scene | `m24-the-burrow-door-intro` in `src/cutscene/scenes/story/m24-the-burrow-door.ts` |
| Played by | quest `m24-the-burrow-door` (The Burrow Door), as the `scene` of its first `visit` objective: the player arrives at the log |
| Kind and length | `intro`, aim 30-60 s; 41.3 s at Normal text speed |
| Where, when | stage `mole-log` (a fallen log in the last pines of Mossy Wood), day (`sky: 'noon'`) |
| Before / after | before: Sorrel's briefing call (gnomes with spades after a mole); after: crack the two spade gnomes, then the barrow-buggy drive |

## 1. Purpose in the story

The laugh after the tablet (tension 4). It plants the quest's want (a frightened mole under a log, two gnomes who are
wrong about moles) and the running thread "the moles being misread" (batch-3 notes, section 3), whose next rung is #48.
Nubbin's intro card lands after his first line. Nothing about the Burrowfolk beyond what they would say about themselves.

## 2. The player's feeling

- **In:** the Hollow is quiet, Pip is still stung (Sorrel said so); they want something small to do.
- **Out:** amused, protective of a very small mole, sure of the job: crack the two diggers, then carry him home.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Nubbin | not to be found; to be polite about it | his voice, which will not stay quiet | whispered formality, correcting their zoology | asks the player for help ("I am small. They are not.") |
| Gus | to find the root-eater | a log | confident wrong theories | hears the log talk, decides he is hearing things |
| Dab | to go home | Gus | flat patience | "Check the other log." |
| The player | to help | nothing; they arrive in time | one short line | "Stay under the log." |

## 4. Subtext

- Nubbin's fear is spades; his secret (the ninth-green ball) is not touched here.
- The gnomes are not villains: they believe moles eat roots. The joke is their certainty, and that the log argues back.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Ground level: a nose and spectacles under a log, a spade biting soil close by. "Oh dear, oh dear, oh dear." Intro card. |
| 2 | 5-15 | Setup | Gus prods the bracken: "Root-eater is under here." Dab: "Gus. That is a log." "Logs have moles, Dab." |
| 3 | 15-27 | Turn | The log answers: "We eat grubs. The grubs eat the roots. It is on the sign." Two-shot, a beat, "Did the log say something?" "Logs do not talk, Gus." (comic stinger) |
| 4 | 27-34 | Exit | "Then I am hearing things." "Check the other log." They shoulder their spades and walk off east. |
| 5 | 34-41 | Button | The nose comes back out: "If you please, they have been at it since breakfast." "Stay under the log." "Most kind. I am small. They are not." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `log-low` (a cut) | 50 | locked, at the mole's eye line | the nose and spectacles | the hook is the thing hiding |
| 2 | `MOLE_TALK.single('nubbin','mcu')` | 35 | locked, eye height | Nubbin | first line and the intro card |
| 3 | `DIG.single('gus','ms', low)` | 40 | locked | Gus, looking down at the log | the confident one, from below |
| 4 | `DIG.single('dab','mcu')`, `DIG.single('gus','mcu')` | 35 | locked | the exchange | one cut per line |
| 5 | `MOLE_TALK.single('nubbin','mcu')` | 35 | locked | Nubbin | the log answers |
| 6 | `DIG.two('fs')` | 45 | locked | both diggers | the held look; "Did the log say something?" |
| 7 | `DIG.single('dab','mcu')`, `('gus','mcu')`, `('dab','ms', low)` | 35 / 40 | locked | the denial and the exit | gag, then the walk-off |
| 8 | `MOLE_TALK.single(...)` x3 | 35 | locked | Nubbin, the player, Nubbin | the button exchange, one side of the line |

Sides of the line: Gus and Dab on `coverage('gus','dab',1)` (a `face` pair first so neither talks with their back to the
lens); Nubbin and the player on `coverage('nubbin','player',1)`. Nubbin is never shot from above (batch-3 notes 6.5).
No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Nubbin | Oh dear. Oh dear, oh dear, oh dear. | the hook; his voice, tidy even when afraid |
| Gus | Root-eater is under here somewhere. I can smell the roots he ate. | the wrong theory, stated with total faith |
| Dab | Gus. That is a log. | the straight man |
| Gus | Logs have moles, Dab. | the gag in a sentence |
| Nubbin | We eat grubs. The grubs eat the roots. It is on the sign. | the correction; "the sign" is the one at the Burrow Door (E17) |
| Gus | Did the log say something? | |
| Dab | Logs do not talk, Gus. | the comic stinger lands here |
| Gus | Then I am hearing things. | |
| Dab | Check the other log. | the exit |
| Nubbin | If you please, they have been at it since breakfast. | formal, small |
| Player | Stay under the log. | two-beat line, the straight man |
| Nubbin | Most kind. I am small. They are not. | the button |

Names checked: `npm run lore -- find "Burrowfolk"`, `"Nubbin"`, `"Burrow Door"` (R-164: the moles are gentle and formal, and eat grubs).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `forest` bed, `warm` music | comedy in Mossy Wood: not `fescue`, which is never for comedy (bible section 6) |
| 0.0, 0.9 | spade `shovel`, Nubbin `squeak` | the picture is a nose; the sound says why it is hiding |
| 5.0 | `rustle` at Gus | he prods the bracken |
| 21.0 | `comic` stinger on "Logs do not talk, Gus." | the one physical-world gag of the scene, once |
| 29.0 | `crunch` at Dab | they walk off |
| 41.0 | `rustle` at Nubbin | he tucks back under the log |

## 9. Blocking and vehicles

- Nubbin kneels under the log's east end at (-830.2, 271.6), facing south-east toward the player.
- Gus at (-825.5, 265.5) with a spade, Dab at (-822.5, 268.5) leaning on his; both face the log, then each other.
- The player at (-825, 275). No vehicles in the scene (the barrow buggy is the next objective's start).
- Gus and Dab walk about 6 m east and the scene ends with Nubbin's line; the player actor ends at its mark.

## 10. The button

Nubbin's mcu, very small: "Most kind. I am small. They are not." and the rustle of him going back under the log. It
states the whole quest in his voice, with no gag on top.

## 11. Self-check

- [x] Want (stay hidden), obstacle (the spades and his own voice), turn (the log answers).
- [x] Hook in 3 s: a nose under a log and a spade; no narration.
- [x] Every line under 16 words (longest 13); nobody says what the picture shows; no coordinates.
- [x] Voices: Nubbin formal and small; the diggers flat and certain; the player two words.
- [x] Every speaker MCU or MS, facing the lens (a `face` pair for the diggers).
- [x] One side of the line per conversation.
- [x] One music track, one stinger, no silence needed.
- [x] Running thread planted: "moles misread" (the diggers), no hat-ladder or other ladder touched.
- [x] Day scene; no dark hats on dark ground.
- [x] `npm run cutscene-report` shows the scene OK; `stages.test.ts` and `scenes.test.ts` pass (LOS).
- [x] `direction.notes` points here.
