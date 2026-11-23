# Director's notes: `sq-porcelain-support-outro`

Re-directed against [../bible.md](../bible.md) and [../TEMPLATE.md](../TEMPLATE.md). Watch it at
`http://localhost:5310/?no-intro&cutscene=sq-porcelain-support-outro`.

| | |
| --- | --- |
| Scene | `sq-porcelain-support-outro` in `src/cutscene/scenes/side/porcelainSupport.ts` |
| Played by | quest `sq-porcelain-support` as its outro, on delivery at the Mossy Wood bunker |
| Kind and length | `outro`, aim 15-45 s; now 37.3 s at Normal text speed (was 38.9 s, 6 faults) |
| Where, when | stage `unmowed-hollow` (the standing-stone ring; the bunker beside it), dusk, `sky: 'golden'`, `warm` music, `forest` ambience |
| Before / after | before: the Lowrider drive from the Tall House porch. After: the quest's done text; the player is free |

## 1. Purpose in the story

The payoff of the escort. The refugees are safe, and Elder Bracken, who has never liked anything with an engine, takes
them in gruffly. The toaster gets its place of honour on a stone. The scene settles the altar question on screen (see
section 4) and ends on a refugee's sincere thanks.

The old scene had its refugees' backs to camera, a 12 s wide with the argument lost in it, and a last line that was a
joke about theology with nothing held after it.

## 2. The player's feeling

- **In:** relieved that the drive worked, with a little guilt about the glaze.
- **Out:** warmed by the refugees' thanks, a little amused by Bracken, and clear that the job is done.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Bracken | to keep the Unmowed hidden and the old ways pure | porcelain at his fire | low, gruff, accusations as statements | grudgingly gives the toaster a stone |
| Ref 1 (devout, the toaster's owner) | to have the toaster honoured | the doubt around him | conviction | gets his answer, and says thank you |
| Ref 2 (blunt) | to know whether it is an altar or a warm box | Bracken's "Yes" with no reason | a flat question | answered, quiet |
| Ref 3 (pedant) | the theology settled properly | Bracken's word | a precise statement | goes quiet with the rest |
| Ref 4 (from the boot) | to be out of the dark | the dark | a wry line, honest | stands in the firelight |
| The player | to see the job end | nothing | silent in this scene (no line) | (the eye of the camera) |

## 4. Subtext

- Bracken is glad. He is not going to say so. His "Yes" answers the altar question he has been asked three times in his
  life, and the stone is the closest he comes to a welcome.
- Ref 1 wants to be believed. The thank-you is for being believed, not for the seat.
- The porcelain fear (cracking, which does not glue back) is under every line in the bunker: the roof, the stone, the fire
  kept away from them.

## 5. Beat sheet

Timings at Normal text speed (approximate; the report prints the exact scene length).

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | `engine-rev` as the Lowrider pulls in to the bunker; a track shot on it. |
| 2 | 3-10 | Arrival | The Lowrider stops; the refugees and the player get out; the refugees walk to the fire. |
| 3 | 10-16 | Bracken | Bracken low MS: "You brought porcelain to my fire. Sit." |
| 4 | 16-22 | The roof | Ref 1 MCU: "It has a roof, and nothing in it rings." Ref 4 climbs out of the boot. |
| 5 | 22-27 | The boot | Ref 4 MCU: "I was in the boot. It was dark and very honest." |
| 6 | 27-33 | Place of honour | The toaster set on a stone (`thud`). Bracken low: "A toaster on a stone. That is an altar now. Nobody argue with it." |
| 7 | 33-37 | The question | Ref 2 MCU: "Is it an altar, or a warm box?" Bracken low: a beat, then "Yes." Ref 3: "So the theology is unresolved." |
| 8 | 37-39 | Button | Music off; two seconds' silence; Ref 1 MCU, the toaster's owner: "Thank you, Elder." Held. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on the Lowrider, `above(-347,26,1.4)` | 44 | tracking | the car pulling in | the arrival, with the engine as the hook |
| 2 | `drive` the Lowrider to `[-342,33]` | - | - | the car | the stop by the fire |
| 3 | `shot('bracken','ms',{height:'low',toward:'ref1',side:20})` | 40, low | locked | Bracken | the gruff receiving; shot from below |
| 4 | `shot('ref1','mcu',{toward:'bracken',side:25})` | 35 | locked | Ref 1 | the roof line |
| 5 | `shot('ref4','mcu',{toward:'ref1',side:-25})` | 35 | locked | Ref 4 | out of the boot, in the firelight |
| 6 | `shot('bracken','mcu',{height:'low',toward:'ref2',side:20})` | 35, low | locked | Bracken | the toaster verdict, low |
| 7 | `shot('ref2','mcu',{toward:'bracken',side:-25})` | 35 | locked | Ref 2 | the question |
| 8 | `shot('bracken','mcu',{height:'low',toward:'ref2',side:20})` | 35, low | locked | Bracken | a beat, then "Yes." |
| 9 | `shot('ref3','mcu',{toward:'bracken',side:-25})` | 35 | locked | Ref 3 | the theology line |
| 10 | `shot('ref1','mcu',{toward:'bracken',side:25})` | 35 | locked | Ref 1 | the button: the toaster's owner, looking at Bracken, thanking him |

Sides of the line: Bracken and the refugees on the same side throughout (+20/+25 for Bracken and Ref 1, -25 for the
others); the fire sits behind the camera. No deliberate crossing.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Bracken | You brought porcelain to my fire. Sit. | accusation as statement; archaic, heavy |
| Ref 1 | It has a roof, and nothing in it rings. | the bunker, said with relief |
| Ref 4 | I was in the boot. It was dark and very honest. | the wry one, played straight |
| Bracken | A toaster on a stone. That is an altar now. Nobody argue with it. | the place of honour |
| Ref 2 | Is it an altar, or a warm box? | the question everybody has |
| Bracken | Yes. | one word; the answer |
| Ref 3 | So the theology is unresolved. | the pedant; played straight, no stinger |
| Ref 1 | Thank you, Elder. | the button |

Lines all under 16 words. "Tall-One" and "altar" are the lore's words. The altar question is the loose thread in
`docs/lore/entries/apocrypha/clara-porcelain.md`; the lore says Bracken later settled it "with a stone and the word
'Yes'", so the scene shows that settlement (see the ruling note below).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `engine-rev` (hook); `warm` music; `forest` ambience | a sound hit before any line |
| ~27 | `thud` sfx | the toaster on its stone |
| ~37 | music off (1.5 s fade) | the sincere close needs room |
| ~37-39 | 2 s held silence | one held silence, at the end |

No stinger in the scene.

## 9. Blocking and vehicles

- The Lowrider pulls in from the east track and parks short of the ring at `[-326, 31]` (player's car if the player drove
  it; otherwise Clara's spawn). Drives to `[-334,32]` then `[-342,33]`.
- The player and refugees 1-3 exit the car. Refugees walk to the fire (`[-349,36]`, `[-348,38]`, `[-349.5,34]`); the
  player stands by the car. Ref 4 spawns at the boot (hidden until spawned) and walks to `[-347, 33.5]`.
- Bracken stays on his mark by the fire, low shots from his height.
- The toaster is a prop, spawned onto the stone by the fire at `[-350, 30]`.
- The player ends by the car, out of frame at the end; the quest's done text is the next beat.

## 10. The button

Ref 1, the toaster's owner, looks at Bracken and says "Thank you, Elder." Held for a beat, then the silence. Why: it is
the sincere last look the bible asks for, from the one refugee whose faith was the argument, and nobody jokes after it.

## Ruling needed

- `docs/lore/rulings.md` (not edited here): the outro has Bracken answer the altar question ("Yes."). The lore entry
  already says he settled it "with a stone and the word 'Yes'", but the quest's done text reads "toaster theology
  unresolved", and Ref 3 keeps it open on screen. Decide whether "Yes." is canon, and if so, write the ruling.
- `docs/lore/rulings.md` (not edited here): the bunker's place. The lore entry for the Hollow Oak Stump names a sanctuary
  there; the scene and the quest put the bunker in Mossy Wood beside Unmowed Hollow's ring. Decide which is the
  refugees' bunker.
