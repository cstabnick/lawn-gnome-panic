# Director's notes: `kiln-resin-outro`

| | |
| --- | --- |
| Scene | `kiln-resin-outro` in `src/cutscene/scenes/story/ch3b.ts` |
| Played by | quest `ch3-kiln-resin-ice` as its outro: the player brings the resin back to the basin's Theo's barrel (stage `theo-camp`) after the derby |
| Kind and length | `outro`, aim 30-45 s; now 27 s at Normal text speed (was 23.7 s, 4 faults) |
| Where, when | stage `theo-camp` (Thermos Theo's barrel, north highway), dawn, `sky: 'golden'` |
| Before / after | before: the derby on the ice, the arm cured. After: the chapter's next errand (the crew, the stone, the Dust Flats) |

## 1. Purpose in the story

Chapter 3 asks whether the crew can survive losing everything. This scene is the first answer: Pip's arm holds, and
Tansy is alive. It is a SINCERE beat (bible law 5): no jokes during the cure, one held silence, music out. The comedy
returns only from Pip, once he is coping. It plants Tansy's snail-mail ("Bring Pip. Bring snacks."), which is the reason
the crew goes to the Dust Flats next.

## 2. The player's feeling

- **In:** tired, cold, having driven the ice and held the basin.
- **Out:** relief, a warm flicker in the chest, and a new purpose: Tansy is alive and wants them.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to know his arm holds, and to know the player did not leave him | his own fear of being left behind | plain statements, then pride | cheers, quietly, over the note |
| The player | to say the thing that needs saying | the player's own dryness | a flat answer ("Wasn't going to.") | none needed: it is said |
| Thermos Theo | to hand over the post, and his tea | the snail is late | gossip, tea | passes the scroll; then Brenda's canal (cut) |
| Tansy (off screen) | to be found by her crew | distance; the snail | a short note in her own voice | (not seen; the caption is her) |

## 4. Subtext

- Pip is asking whether the player came back for him. "You didn't leave me on the apron." is the question.
- "Wasn't going to." is the answer the player never gives out loud in other scenes.
- Tansy's note is short because she is afraid. "Bring snacks" is her warmth.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Wide of the barrel; Theo leans over the thermos; close on Theo: "Acorn-broth. Burns the throat, warms the soul." |
| 2 | 3-8 | Pip flexes | Pip beside the player, MCU, flexing the new arm (`wave`, 1.6 s). A beat of nothing. |
| 3 | 8-16 | The sincere beat | Music out. "It holds." (beat) "You didn't leave me on the apron." Player: "Wasn't going to." |
| 4 | 16-20 | The nod | Pip's close nod; a held silence (2 s). |
| 5 | 20-26 | The snail | Music `warm` back in. The `mystery` stinger, a CU of the snail (1.6 s). Theo: "Post's here." He hands the scroll to the player. |
| 6 | 26-31 | The note | The one caption: "Found the Stopping Stone. Dust Flats. Bring Pip. Bring snacks. - T." |
| 7 | 31-35 | The button | Pip over the player's shoulder, cheering quietly: "She said bring Pip. By name." Held 1.2 s. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `spot('theo-camp','wide')` | 52 | locked | the barrel | the establishing: the camp, the snow, the thermos |
| 2 | `shot('theo','mcu',{toward:'player'})` | 35 | locked | Theo | the hook, warm |
| 3 | `shot('pip','mcu',{toward:'player'})` | 35 | locked | Pip | the flex, on his eyeline |
| 4 | `T.single('pip','mcu')` (coverage pip/player, side 1) | 35 | locked | Pip | "It holds." |
| 5 | `T.single('player','mcu')` | 35 | locked | the player | "Wasn't going to." |
| 6 | `reaction('pip', {toward:'player', gesture:'nod', size:'mcu', hold:'silence'})` | 35 | locked | Pip | the nod, then the silence (mcu: a cu cropped his face at phone size) |
| 7 | `up(33,-329,1.2)` on the snail (`cut`) | 44 | locked | the snail | the mystery insert, 1.6 s |
| 8 | `shot('theo','mcu',{toward:'player', side:-25})` | 35 | locked | Theo | "Post's here." (side chosen to match the player's side) |
| 9 | `shot('player','mcu',{toward:'theo'})` | 35 | locked | the player | the note, as a caption over him |
| 10 | `shot('pip','ms',{toward:'player', side:25})` | 40 | locked | Pip | the button; the over-the-shoulder shot left him too small at phone size |

Sides: the sincere beat is `coverage('pip','player', 1)`; Theo and the player are shot from the other side of their
line, the one the checker accepts (see the report). No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Theo | Acorn-broth. Burns the throat, warms the soul. | the hook; the broth line, cut to its essentials |
| Pip | It holds. | the arm, in two words |
| Pip | You didn't leave me on the apron. | the sincere question, put as a statement |
| Player | Wasn't going to. | the straight man, short and true |
| Theo | Post's here. | the snail's arrival; the scroll is the picture |
| Caption | Found the Stopping Stone. Dust Flats. Bring Pip. Bring snacks. - T. | the note is shown, not spoken: one caption (the scene's only narration) |
| Pip | She said bring Pip. By name. | the button: coping, proud |
| ~~Pip~~ | ~~Good as new. Shinier, even.~~ | cut: belongs to `tundra-outro` ("Kiln-Resin. Shinier, even.") |
| ~~Narrator~~ | ~~A racing snail creeps up the camp with a micro-scroll on its shell.~~ | cut: describes the picture (the snail is on screen) |
| ~~Tansy~~ | ~~Found the Stopping Stone...~~ (said by a voice) | moved to the caption: a snail-mail is paper, not a voice |
| ~~Theo~~ | ~~Baroness Brenda's been asking for you down the canal...~~ | cut: an errand hook after the sincere beat; the scene closes on Pip |

Names checked: `npm run lore -- find "Thermos Theo"`, `"Tansy"`, `"Stopping Stone"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `warm` (scene music) and `wind` ambience | the warm stop in the cold |
| 8 | `music: null` (fade 0.6) | the sincere beat: no music |
| 16 | `silence` (2 s, inside the nod's reaction) | the one held silence |
| 18 | `warm` back (fade 1.5) | comedy is allowed only after the silence |
| 20 | `mystery` stinger; the snail's rolling sound | the post arrives |

One stinger (`mystery`), one held silence, no comic stinger. Comedy only from Pip, after the silence.

## 9. Blocking and vehicles

- Theo sits at his mark (44,-344), pouring from the thermos on the barrel (40,-340). He stands to hand over the scroll.
- The player at `markOf('theo-camp','player')` (44,-350), facing Theo. Pip at (48,-349) facing the player (yaw -PI/2).
- The snail (`riding-snail`) is hidden until the insert, then spawned at (36,-333) by the barrel.
- The player ends on foot at the camp, by the barrel, with the scroll in hand (the give hands it over). No vehicles.

## 10. The button

Pip, cheering quietly over the player's shoulder: "She said bring Pip. By name." It is the right last moment because it
is the first time he is proud of being wanted, not of his arm.

## 11. Self-check

- [x] The scene has a want (to know the player came back), an obstacle (fear of being left) and a turn (the note).
- [x] The hook lands in 3 s (Theo's lean and the line).
- [x] Every line under 16 words; the picture is not narrated; one caption (the only narration).
- [x] The sincere beat: no jokes, music out, one held silence, close singles.
- [x] Comedy only from Pip, after the silence.
- [x] Every speaker framed MCU or closer, facing the camera (Theo, Pip, the player).
- [x] One side per conversation; one deliberate side choice (Theo, to match the player's line) without a waiver.
- [x] Dawn, `sky: 'golden'`.
- [x] Watched at 960x600 and 390x844 (two fixes from the watch: the nod and the button shot, both in the table above).
- [x] `direction.notes` points here.
