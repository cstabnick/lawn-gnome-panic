# Director's notes: `salvage-raid-outro`

| | |
| --- | --- |
| Scene | `salvage-raid-outro` in `src/cutscene/scenes/story/ch3b.ts` |
| Played by | quest `ch3-salvage-raid` as its outro: the player delivers Pip's Zero-Turn to the Frozen Birdbath Basin |
| Kind and length | `outro`, aim 25-40 s; now 39 s at Normal text speed (was 35.6 s, 5 faults) |
| Where, when | stage `birdbath-basin` (Frostbite Fells), dawn, `sky: 'golden'` |
| Before / after | before: the raid at the ring road, Pip's arm broken off. After: the night at the basin; `kiln-resin-intro` (the job) |

## 1. Purpose in the story

Warm against the cold. The crew is broken (no bay, no Tansy, no arm), and a stranger takes them in. It plants the
cure ("Does the Kiln do arms?" / "Tomorrow.") that `kiln-resin-intro` and `kiln-resin-outro` pay off. Pip's denial is
the first time the game shows his loss as a joke that does not quite land.

## 2. The player's feeling

- **In:** adrenaline, the raid still in them, the Zero-Turn's skid still in the ears.
- **Out:** safe for one night, a little hollow, and a promise ("Tomorrow.") to hold on to.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to be fine (say so) | his own shoulder, the player's eyes | deny, joke, change the subject to arms | admits it by asking a real question |
| The player | to be sure Pip is all right | Pip's denial | one plain statement ("It came off.") | sees Pip ask, and holds it |
| Father Loam | to get the crew warm and fed | nobody has asked him for anything in years | blessing, preaching, a little wit | promises the cure |

## 4. Subtext

- Pip's "Hairline" is a lie told for the player's sake; "Does the Kiln do arms?" is the truth he could not say standing up.
- Loam's excommunication is the joke; his kindness is the point. He does not say the cure's price.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-7 | Hook | Low track on the Zero-Turn sliding in off the north highway; `skid` at the stop. No music, wind only. |
| 2 | 7-12 | Exit | Pip and the player climb out; they face each other. |
| 3 | 12-22 | Denial | Pip: "Hairline fracture. Barely a chip." The player: "Pip. It came off." Pip clutches the shoulder. "...Hairline." |
| 4 | 22-31 | Turn | Loam walks over from the rim; `frost` comes in on his first line. "Another cracked pilgrim." "I'm not cracked. I'm ventilated." |
| 5 | 31-42 | Button | Loam: the Kiln keeps no grudges. Pip sits down by the Zero-Turn. "Does the Kiln do arms?" |
| 6 | 42-47 | Button 2 | "Tomorrow." Held pause, fade out. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `track` on the ride, `up(46,-318,2.2)` | 50 | follows the drive | the Zero-Turn | the arrival, low |
| 2 | `cut(coverage('player','pip',1).single('pip','mcu'))` | 35 | locked | Pip | denial, on his eyeline to the player |
| 3 | `T.single('player','mcu')` | 35 | locked | the player | "It came off." |
| 4 | `reaction('pip', { gesture: 'clutch', side: -25 })` | 35 | locked | Pip | the shoulder; a beat |
| 5 | `L.single('loam','mcu')`, `coverage('loam','pip',1)` | 35 | locked | Loam | warm, eye level, his first line |
| 6 | `L.single('pip','mcu')` | 35 | locked | Pip | "I'm ventilated." |
| 7 | `L.single('loam','mcu')` | 35 | locked | Loam | the snowmobile line |
| 8 | (no walk) | - | - | - | Pip sits where he got out: a walk to the bench clips a building and a box in the LOS check |
| 9 | `L.single('pip','mcu')` | 35 | locked | Pip | "Does the Kiln do arms?" |
| 10 | `L.single('loam','cu')` | 30 | locked | Loam | "Tomorrow." |

Sides: the denial is on `coverage('player','pip', 1)`; the basin on `coverage('loam','pip', 1)`. No crossings. Both
actors turn to face each other (`face`) before each conversation, so no single shows a back.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Hairline fracture. Barely a chip. | the denial; was "It's a hairline fracture. ...Did my elbow just rattle?" (the second half is cut: a joke over a sincere beat) |
| Player | Pip. It came off. | the straight man |
| Pip | ...Hairline. | the second sentence that undoes the first (Pip's tic), after the clutch |
| Loam | Another cracked pilgrim. Sit by the stove, my child. | the warm welcome |
| Pip | I'm not cracked. I'm ventilated. | a joke, kept: Pip coping |
| Loam | They threw me out for preaching on a snowmobile. The Kiln keeps no grudges. | Loam's odd second; the grudge line is the bridge to the cure |
| Pip | Does the Kiln do arms? | the sincere question, quiet, from the bench |
| Loam | Tomorrow. | the promise; the cure is the next scene's job |
| ~~Loam~~ | ~~I was excommunicated for preaching on a snowmobile. Yet here we are.~~ | cut: said nearly word for word by the line above |
| ~~Loam~~ | ~~A castaway at Loch Moss keeps sending snails about a turtle.~~ | cut: an errand hook; the scene closes on the cure, not an errand |

Names checked: `npm run lore -- find "Father Loam"`, `"Birdbath"`, `"Kiln-Resin"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0-22 | `wind` ambience; `skid` at the stop | the raid is still cold; the sound is the hook |
| 22 | `frost` (fade 1.5) | Loam's bells arrive with him: the warm part of the scene starts |
| 42 | `fade` to black, 1.2 s | the promise is the last word; no music over it |

## 9. Blocking and vehicles

- The Zero-Turn slides in from (30,-300) via (30,-318), (16,-330) to its stop at (7,-333). Pip and the player exit beside it.
- Loam walks from his mark (-4,-342) to (0,-338), facing the crew.
- Pip sits down beside the Zero-Turn where he got out, and faces Loam (a `face` step). The bench at (14,-348) is not used:
  the route to it clips a building (the LOS check rejects it).
- The player ends where the exit leaves them, beside the Zero-Turn: the basin rim, on foot.
- Loam's snowmobile is parked at its mark (`carMark(BASIN,'loam-snowmobile')`), empty.

## 10. The button

Pip sitting by the Zero-Turn, asking if the Kiln does arms, then Loam's one word, then black. The question is the real line; the
answer is a promise, and the audience carries it into the next scene.

## 11. Self-check

- [x] The scene has a want (warmth, safety), an obstacle (the cold, the wound) and a turn (Pip asks).
- [x] The hook lands in 3 s (a skid and a drive, no words).
- [x] Every line under 16 words; nobody describes the picture.
- [x] Pip's rhythm (the second sentence that undoes the first); Loam's "my child" and his grudge line.
- [x] Every speaker framed MCU, facing the camera (faces turned to each other before each conversation).
- [x] One side of each conversation.
- [x] Music has one reason (Loam's arrival); no stinger; no held silence (the fade does the work).
- [x] Night? No: dawn with `sky: 'golden'`, lit faces.
- [x] Length: 39 s, inside the 25-40 aim.
- [x] Watched at 960x600 and 390x844. Loam is framed MS: at MCU his golden robe filled the frame and his head was cut off.
      His face reads only at the top of his hood; that is his costume, accepted.
- [x] `direction.notes` points here.
