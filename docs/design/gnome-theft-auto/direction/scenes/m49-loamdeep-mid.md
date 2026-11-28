# Director's notes: `m49-loamdeep-mid`

| | |
| --- | --- |
| Scene | `m49-loamdeep-mid` in `src/cutscene/scenes/story/m49-loamdeep.ts` |
| Played by | quest `m49-loamdeep` (Loamdeep), as the `scene` of its last visit (the player stands at DJ Moleman's decks, interior `moleman-burrow`) |
| Kind and length | `arrival`, aim 10-35 s; about 27 s at Normal text speed |
| Where, when | stage `moleman-set-night`: a cutscene-only burrow on the grass south-east of the mound, night (`sky: 'night'`), lit by mole lamps |
| Before / after | before: the three mole jobs and the Long Tunnel; after: the outro supper at the door |

## 1. Purpose in the story

DJ Moleman plays one track in person, no words, and the Burrowfolk agree. Moleman's transmitter and his bass stay
unexplained (this is the first time he is on camera: his intro card lands after his first action, a look up). It is
the scene where the family stops being a polite hole and becomes a crowd that is on the player's side.

## 2. The player's feeling

- **In:** tired of tunnels and tapers; a little nervous of the quiet one at the bottom of the Long Tunnel.
- **Out:** swept up. Moleman said yes without a word, and it was a whole track. Tension 4, warm.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| DJ Moleman | to play one track for the one who asked | nobody has ever heard him speak, and he will not start | a look, a point at the floor, a record | plays the whole track, then the next |
| Old Mother Tumblesoil | to hear the Hall's heartbeat in the open air | none | eyes closed, cane on the beat | translates him: "a whole supper" |
| Nubbin, Pim, Pod | to nod in time | the twins are two | small, upright, bouncing | nod as one |
| The player | to be asked to stay | nothing | "Evening." tips the hat | stands on the speaker |

## 4. Subtext

- "He stops at the chorus for anyone else": the track played to the end is a vote.
- The cane on the beat is the Burrowfolk's "yes", and it lands before any word does.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Ground level on the record: needle crackle; one bass note you feel in the lens. |
| 2 | 5-12 | Setup | He looks up over his spectacles; intro card; "Evening." He points at the floor: the ground is the speaker. |
| 3 | 12-20 | Track | The needle drops; the family nods on the one; lamps jump in their glass. |
| 4 | 20-23 | Turn | Tumblesoil lifts her root cane and sets it down on the beat: the Burrowfolk agree. The track ends. |
| 5 | 23-27 | Button | "He played it to the end. For anyone else, he stops at the chorus." "Is that a yes?" "From him it is a whole supper." The next record goes on. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `decks` | 50 | locked, ground | the record | hook |
| 2 | `MOLE_YOU.single('moleman','mcu')` | 35 | locked | Moleman | the look up; the card |
| 3 | `MOLE_YOU.single('player','mcu')` | 35 | locked | the player | "Evening." |
| 4 | `MOLE_YOU.single('moleman','ms')` | 40 | locked | Moleman | the point at the floor |
| 5 | stage camera `wide` | 50 | locked | the whole set | the track |
| 6 | stage camera `crowd` | 50 | locked, behind the decks | the family and the player | everyone nods |
| 7 | `shot('tumblesoil','ms',{toward:'moleman',height:'low'})` | 40 | locked, low | Tumblesoil | the cane: the turn |
| 8-10 | `SUP_OLD` singles | 35 | locked | Tumblesoil, the player | the translation |
| 11 | stage camera `decks` | 50 | locked | the next record | the button |

No camera sits above a mole.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Player | Evening. | the only thing said to him |
| Tumblesoil | He played it to the end, dear one. For anyone else, he stops at the chorus. | Moleman never speaks; she speaks for him |
| Player | Is that a yes? | |
| Tumblesoil | From him it is a whole supper. | the family's word for "very much" |

Moleman has no lines, on purpose (`npm run lore -- find "Moleman"`).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `cave` bed, `mystery` music | the burrow's own room tone |
| 0-6 | `static` (needle), `thud` + `shake` | the first bass note |
| 12 | `music: heist` (fade 0.4) + `thud` on the beat | the one track: a walking bass |
| 14-19 | three `thud`s, each with a short `shake` | the family nods on the one |
| 20 | `thud` at Tumblesoil, bigger `shake` | the cane |
| 21 | music out (fade 0.9) then `beat('pause')` | the track has ended; once in the scene |
| 25 | `static`, `thud` | the next record |

## 9. Blocking and vehicles

A cutscene-only set (scene props): `moleman-decks` at (-987.5, 308.15) facing north, `moss-rug`, two `dug-speaker`s, two
`root-crate`s, four lit mole lamps on toadstool stools (L95). Moleman behind the decks at (-987.5, 309), the player on the
rug at (-987.5, 305) facing south, Tumblesoil (-984.6, 306), Nubbin (-990.6, 306.2), Pim and Pod (the twins, scale 0.8)
at (-985.4, 303.8) and (-989.6, 303.8). The player ends where the scene starts them.

## 10. The button

Moleman sets the next record without looking up, and one more bass note makes every lamp jump in its glass. The scene
refuses to explain him; the ground is his voice.

## 11. Self-check

- [x] Want (to play one track), obstacle (he does not speak), turn (the cane on the beat).
- [x] Hook in 3 s: a crackle and a thud; not narration.
- [x] Every line 15 words or fewer; no coordinates.
- [x] Moleman silent; Tumblesoil "dear one"; the player one short line twice.
- [x] Speakers MCU or MS, facing the lens; a mole's eye line.
- [x] One side of the line per conversation.
- [x] One track, one stinger-free scene, one held pause.
- [x] The Moleman thread planted and unexplained.
- [x] Night is lit: four lamps, a pale rug, light-grey moles on a dark bank.
- [x] The set is an interior shown as a set; noted for the lead if a room stage is wanted.
- [x] `direction.notes` points here.
