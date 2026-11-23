# Director's notes: `sq-porcelain-support-intro`

Re-directed against [../bible.md](../bible.md) and [../TEMPLATE.md](../TEMPLATE.md). Watch it at
`http://localhost:5310/?no-intro&cutscene=sq-porcelain-support-intro`.

| | |
| --- | --- |
| Scene | `sq-porcelain-support-intro` in `src/cutscene/scenes/side/porcelainSupport.ts` |
| Played by | quest `sq-porcelain-support` ("The Porcelain Support Group") as its intro, given by the strangers on the Tall House porch |
| Kind and length | `intro`, aim 30-60 s; now 57.7 s at Normal text speed (was 47.3 s, 16 faults) |
| Where, when | stage `tall-house-porch` (Mossy Wood), dusk, `sky: 'golden'`, `warm` music, `wind` ambience |
| Before / after | before: the player was sent to the porch by the strangers' radio bulletin. After: the Lowrider drive to the bunker (the quest's steal-deliver objective, drop-off at Mossy Wood) |

## 1. Purpose in the story

The porch is the first place the player meets Clara's work: a support group of porcelain refugees who cannot survive a
kerb. The scene makes the refugees funny (they argue about a toaster) and makes Clara the one who holds them together.
Plants: the boot passenger (paid off in the outro, where he climbs out), the toaster (paid off in the outro, where it gets
a stone), and the loose thread of whether the toaster is a Tall-One altar or a warm box (see section 4).

The old scene was a 9-second wide with four refugees at 5% of the frame, and Clara never on camera while she spoke.

## 2. The player's feeling

- **In:** curious and a little amused by the argument, not yet sure what the job is.
- **Out:** warm towards Clara, clear on the job (four refugees, one Lowrider, the Mossy Wood bunker before dark), and
  careful with the car (fifteen percent damage is the limit).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Ref 1 (devout) | to have the toaster declared an altar | Ref 2's scepticism | conviction, "Look at how it sits" | quiet, sure, and then gets the last word on the subject |
| Ref 2 (blunt) | to have the toaster declared a warm box | Ref 1's faith | flat statements, facepalm | silenced by Clara |
| Ref 3 (frightened) | to be somewhere nothing rings | the toaster ticking | a complaint, then a want | gets into the car |
| Clara | to get the four of them to the bunker, safe | their argument | soft and short; one held silence | the job is said, the refugees move |
| Ref 4 (in the boot, hidden) | to be padded | the boot's dark | none in this scene | (seen in the outro) |
| The player | to know the job | the bickering | one short question | takes the job, drives |

## 4. Subtext

- Clara is frightened for them and does not show it. Her fear is cracking (porcelain does not glue back): "Fifteen
  percent" is the player's line, but it is her fear.
- Ref 3's "it ticked at me" is the refugees' fear wearing a joke. It is played straight.
- The altar question is the loose thread (`docs/lore/entries/apocrypha/clara-porcelain.md`): it is argued, not answered,
  in this scene. The answer is the outro's, from Bracken.

## 5. Beat sheet

Timings at Normal text speed (approximate; the report prints the exact scene length).

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A cup clinks on the altar table (`glass`), over the golden establishing wide. No dialogue on the wide. |
| 2 | 3-12 | Setup (the argument) | Ref 1 MCU: "It is a Tall-One altar." Ref 2 MCU: "It is a toaster. Warm is not holy." Ref 2 facepalms. Ref 3 MCU: "It ticked at me." Ref 1: "Ticking is how it prays." |
| 3 | 12-20 | Want | Ref 3: "I want the bunker. Nothing rings there." Ref 2: "It is not praying. It is a warm box." |
| 4 | 20-30 | Escalation | Ref 1: "You said that about the kettle." Music out. |
| 5 | 30-40 | Turn | Clara MCU: "Please stop. All of you." One held silence (2 s). Ref 2 reacts. Clara: "You are frightened. That is allowed here." Ref 3 reacts. Music back on `warm`. |
| 6 | 40-48 | The job | Clara: "Four of you, one Lowrider. The bunker, before dark." Refugees 1-3 enter the Lowrider. Ref 3: "Where does the fourth one go?" Clara: "The boot. It is padded. He is only a little sad." |
| 7 | 48-54 | Drive | Track shot on the Lowrider, engine (`engine-rev`). Player MCU: "Is the toaster coming?" Clara: "Yes. Nobody is left on the porch." |
| 8 | 54-58 | Button | Clara MCU, sincere: "Thank you for coming for us." Held. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `stageCut('tall-house-porch', 'wide')` | 52, high | locked | the porch, the lanterns, the parked Lowrider | place, with a clink and no dialogue |
| 2 | `shot('ref1','mcu',{toward:'ref2',side:25})` | 35 | locked | Ref 1 | the devout one, on his own line |
| 3 | `shot('ref2','mcu',{toward:'ref1',side:-25})` + facepalm | 35 | locked | Ref 2 | the blunt one, the facepalm is his |
| 4 | `shot('ref3','mcu',{toward:'ref1',side:-25})` | 35 | locked | Ref 3 | the frightened one |
| 5 | `shot('ref1','mcu',{toward:'ref3',side:25})` | 35 | locked | Ref 1 | reply on the same side of the line |
| 6 | `shot('ref3','mcu',{toward:'ref1'})` | 35 | locked | Ref 3 | the want |
| 7 | `shot('ref2','mcu',{toward:'ref3',side:-25})` | 35 | locked | Ref 2 | the warm-box line |
| 8 | `shot('ref1','mcu',{toward:'ref2',side:25})` | 35 | locked | Ref 1 | the kettle line, music out |
| 9 | `shot('clara','mcu',{toward:'ref1',side:-20})` | 35 | locked | Clara | the turn: she is in frame, centre, for the silence |
| 10 | `shot('ref2','mcu',{toward:'clara',side:-25})` | 35 | locked | Ref 2 | the reaction, held 1.2 s |
| 11 | `shot('clara','mcu',{toward:'ref2',side:-20})` | 35 | locked | Clara | "You are frightened." |
| 12 | `shot('ref3','mcu',{toward:'clara',side:-25})` | 35 | locked | Ref 3 | the reaction, held 0.7 s |
| 13 | `shot('clara','mcu',{toward:'ref3',side:-20})` | 35 | locked | Clara | the job |
| 14 | `shot('ref3','mcu',{toward:'clara'})` | 35 | locked | Ref 3 | "Where does the fourth one go?" |
| 15 | `shot('clara','mcu',{toward:'ref3',side:-20})` | 35 | locked | Clara | the boot |
| 16 | `track` on the Lowrider, `above(-546,30,1.4)` | 42 | tracking | the car | the suspension and the engine |
| 17 | `shot('you','mcu',{toward:'clara'})` | 35 | locked | the player | the question |
| 18 | `shot('clara','mcu',{toward:'you',side:-20})` | 35 | locked | Clara | answer, then the button |

Sides of the line: the refugees on `side` +25 for Ref 1, -25 for Ref 2 and Ref 3, so the argument keeps one side of the
line; Clara and the refugees on -20/-25 (the same side as the porch's camera). No deliberate crossing.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Ref 1 | It is a Tall-One altar. Look at how it sits on the table. | 13 words; the devout one |
| Ref 2 | It is a toaster. It is warm. Warm is not holy. | 9 words; blunt, facepalms |
| Ref 3 | It ticked at me. | the frightened one |
| Ref 1 | Ticking is how it prays. | the devout one, sure of it |
| Ref 3 | I want the bunker. Nothing rings there. | setup: what they want, by about 12 s |
| Ref 2 | It is not praying. It is a warm box. | the blunt one |
| Ref 1 | You said that about the kettle. | escalation, music out |
| Clara | Please stop. All of you. | the turn; held silence after it |
| Clara | You are frightened. That is allowed here. | sincere; no stinger |
| Clara | Four of you, one Lowrider. The bunker, before dark. | the job, said gently |
| Ref 3 | Where does the fourth one go? | |
| Clara | The boot. It is padded. He is only a little sad. | sincere; a line about care, not a gag |
| You | Is the toaster coming? | four words, dry question |
| Clara | Yes. Nobody is left on the porch. | sincere |
| Clara | Thank you for coming for us. | the button |

No line over 16 words. Names: "Tall-One" and "Tall House" from the story; the bunker "Mossy Wood" named once (the job).
Checked against `npm run lore -- find porcelain` and `clara-porcelain.md`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `glass` sfx (hook); `warm` music; `wind` ambience | a sound hit before any line |
| ~30 | music off (1.0 s fade) | the turn: the argument stops, so does the music |
| ~33 | 2 s held silence, Clara on screen | sincere moment, one held silence |
| ~40 | `warm` back on (1.0 s fade) | the job is a plan again |
| ~48 | `engine-rev` sfx | the Lowrider is about to go |

No stinger anywhere in the scene. No `comic` near Clara.

## 9. Blocking and vehicles

- Refugees 1-4 start on their marks round the altar (ref 4 hidden in the boot). Clara at her lantern mark, then walks
  to the car's side for her line; the refugees do their routine (they bicker in place).
- Refugees 1 and 2 enter the Lowrider's seats 1 and 2 (async); ref 3 enters seat 3. Ref 4 stays in the boot (hidden).
- The Lowrider is Clara's own (`castRide('clara', 'clara')`), parked at its mark at the foot of the steps. A track shot
  on it for the engine.
- The player starts on the porch mark and stays on the porch: the quest's start for the drive. The player ends near the
  giver, as the quest expects.

## 10. The button

Clara's face, centred, held for the last two seconds with "Thank you for coming for us." The last sound is the
soft tail of the music and the wind. Why: she is the sincere register; the scene ends on her thanks, not on a gag.
