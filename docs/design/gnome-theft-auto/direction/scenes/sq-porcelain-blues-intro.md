# Director's notes: `sq-porcelain-blues-intro`

| | |
| --- | --- |
| Scene | `sq-porcelain-blues-intro` in `src/cutscene/scenes/side/porcelainBlues.ts` |
| Played by | quest `sq-porcelain-blues` ("Porcelain Blues") as its intro, given at the Tall House Porch |
| Kind and length | `intro`, aim 30-60 s; now 48.6 s at Normal text speed (was 77.2 s, 22 faults) |
| Where, when | stage `tall-house-porch` (Mossy Wood, the western edge), dusk held at `sky: 'golden'` |
| Before / after | before: the drive west, the birdsong dropping off. After: three scavengers to crack (two by the porch, one up the Mossy Wood trail), then `sq-porcelain-blues-ledger` |

## 1. Purpose in the story

A side quest in the sincere register. It makes the player care about one fragile person and plants the main story's
quiet secret: Vesper Thorne is porcelain and is rumoured to have come out of the Tall House (bible: never say it). Clara
names him once, looking at the boarded door rather than at the player, and says "He keeps a shelf." That is all.

The old scene was a briefing on wides: Clara at 5% of the frame for five lines, a 28 s hold, four lines over 16 words,
a caption doing the scene-setting, and the knock from the house buried in the middle of the instructions.

## 2. The player's feeling

- **In:** curious, a little amused (a porch, some lanterns), loud from the drive.
- **Out:** hushed. They are standing next to someone who cannot survive a fall, beside a house that knocks. The job is
  clear (crack three scavengers, bring three lanterns), and so is the one rule (none of them goes to Vesper).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Clara | to get her real lanterns back before dark | she cannot fight; one knock ends her | quiet precision; says the hard thing plainly ("Then crack them.") | from flinching at a footstep to giving a stranger an order |
| The player | to know what is wrong here | the lanterns look fine | one observation, one practical question | takes the job |
| Refugee (ref1) | to be heard | nobody wants to talk about the knocking | says it anyway | is answered by the house |

## 4. Subtext

- Clara's fear is not the scavengers; it is the house. The lanterns keep whatever is inside from finding the door.
- "He keeps a shelf": she knows Vesper from somewhere she does not discuss. She turns to the house when she says it.
- The player's "Your lanterns are lit" is the straight man's question: the wrongness is in the picture, not the words.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-2.4 | Hook | Low MS of Clara at her vigil; a board creaks under the player's boot (`door-creak`); she flinches, a porcelain chink. |
| 2 | 2.4-8.0 | Setup | "Quietly, please. One hard knock, and I do not get up." The player: "Your lanterns are lit." |
| 3 | 8.0-19.5 | The wrongness | "They are wax. Look at the shadows..."; the insert of a lantern; the swap; the refugee: "It knocks when the real ones go out." |
| 4 | 19.5-25.5 | Turn | Music out. One knock from inside. Everyone turns to the door; the low shot from behind Clara, the door huge over her; held silence; "Do not answer it. It knocks once. Then it waits." |
| 5 | 25.5-44.5 | The job | Three scavengers; "And if they won't hand them over?"; "Then crack them. Gently is for porcelain."; she turns to the house: Vesper and the shelf; the player's nod. |
| 6 | 44.5-48.6 | Button | The player steps out of the lens; Clara alone at the foot of the boarded house, one soft chink. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('clara','ms',{toward:'you',side:50,height:'low'})` | 40 | locked | Clara | the hook: she is the thing we watch, and the sound comes from off frame |
| 2 | `PORCH_TALK.single('clara','ms')` | 40 | locked | Clara | room for the Tall House behind her |
| 3 | `PORCH_TALK.single('you','ms')` | 40 | locked | the player | the straight man's observation |
| 4 | `PORCH_TALK.single('clara','mcu')` | 35 | locked | Clara | closer: the explanation |
| 5 | cut, insert of the wax lantern at (-538, 36) | 34 | locked | lantern | show the thing she just named |
| 6 | `PORCH_TALK.single('clara','mcu')` | 35 | locked | Clara | the theft |
| 7 | `reaction('ref1',...)` | 35 | locked | refugee | the reaction becomes a line: someone finally says it |
| 8 | cut, low behind Clara's shoulder onto the boarded door | 46 | locked | the house | the turn: scale. She is teacup-sized against it |
| 9 | `shot('clara','mcu',{side:150})` | 35 | locked | Clara | her face as she turns back from it |
| 10-12 | `PORCH_TALK` singles, CU on "Then crack them" | 30-40 | locked | Clara / player | the job tightens as it hardens |
| 13 | `shot('clara','mcu',{side:165})` | 35 | locked | Clara facing the house | she names Vesper to the door, not to us |
| 14 | `reaction('you', nod)` | 35 | locked | the player | the job is taken |
| 15 | dolly, from the steps onto Clara and the door | 42 | slow push | Clara, house | the button: her vigil, held |

Side of the line: Clara and the player on `coverage('clara','you',1)` throughout. Shots 8, 9 and 13 are on her eyeline to
the door (no other speaker in them).

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Clara | Quietly, please. One hard knock, and I do not get up. | was "...One hard knock and I am a dustpan." A gag on her line: cut (sincere register) |
| The player | Your lanterns are lit. | was "Lanterns?": now an observation that the next line overturns |
| Clara | They are wax. Look at the shadows. They fall toward the light. | was 20 words; uses the porch lore (light that never casts a shadow the right way) and the set lanterns that are always there |
| Clara | Somebody swapped them while I was counting heads. | |
| Refugee | It knocks when the real ones go out. | sharpened: now it explains what the lanterns are for |
| Clara | Do not answer it. It knocks once. Then it waits. | after the knock, not before it |
| Clara | Three HOA scavengers took them. Two in the mud out front. One up the trail. | the job, one place name, no waypoint read-out |
| The player | And if they won't hand them over? | |
| Clara | Then crack them. Gently is for porcelain. | the one hard sentence |
| Clara | And not one lantern goes to Vesper Thorne. He keeps a shelf. | the main-story plant; said to the house |
| ~~Caption~~ | ~~Tall House Porch, Mossy Wood. The birds stopped fifty paces back.~~ | cut: described the place; the creak and the house do it |
| ~~Clara~~ | ~~Three lanterns, three hooks. Hung there since before the planks went up. Look closer.~~ | cut: the insert shows it |
| ~~Clara~~ | ~~Bring all three home and I will give you my Porcelain-Glaze Charm...~~ | moved to the payoff, where the charm is given |

Names checked: `npm run lore -- find porcelain`, `find "tall house"` (clara-porcelain, tall-house-porch).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind` ambience, no music | the porch is quiet; the hook is a sound |
| 1.0 | `door-creak` sfx, then a porcelain `glass` chink at 0.25 | a board, and what it does to her |
| 3.0 | `mystery` in (fade 1.2) | the place's theme, once she has spoken |
| 19.5 | music out (0.4), `knock` sfx, a small shake | the turn: silence before and after the knock |
| 23.0 | held `silence` (2 s) | the one held silence |
| 26.0 | `mystery` back (fade 2) | the job |
| 46.0 | `glass` chink at 0.2 | the button: she is still here, still porcelain |

No stingers: the knock is the sting.

## 9. Blocking and vehicles

- Clara starts on her mark (-544, 38) facing the boarded door (-553, 40), the candle in hand; turns to the player on the
  creak, to the door on the knock and on "Vesper", and stays facing it at the end.
- The player walks up from the steps (-533.5, 45.5) to (-540.6, 41.2), then steps aside to (-538.5, 37.2) for the button
  so the last shot is clear.
- Refugees at (-541.5, 46.5) (blue-grey hat so he reads against the white skin) and (-546, 50.5), by the toaster altar.
- No vehicles. The stage's three set lanterns are the "wax copies".

## 10. The button

Clara, small, candle-lit, at the foot of the boarded door of a house that just knocked, with one soft chink of porcelain.
It is right because the scene is about her vigil; the job is already given, and the last thing the player sees is what
they are protecting.

## 11. Self-check

- [x] Want, obstacle, turn (the knock).
- [x] Hook in 1 s (the creak and the flinch); no opening narration.
- [x] Every line under 16 words (longest 15); no coordinates.
- [x] Clara sincere and short; the player's lines short.
- [x] Every speaker MS or closer and facing the camera; reactions after the big lines.
- [x] One side of the line.
- [x] Music changes with reasons; no stinger; one held silence.
- [x] Plants Vesper's porcelain past without saying it.
- [x] Dusk held at golden; nothing shot into the dark porch roof.
- [x] Report OK; removed from `pacing.baseline.ts`.
- [x] `npm test` passes; watched at 960x600 and 390x844.
- [x] `direction.notes` points here.
