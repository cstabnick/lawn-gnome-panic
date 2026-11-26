# Director's notes: `m40-the-capwood-run-outro`

Watch it at `?no-intro&cutscene=m40-the-capwood-run-outro`.

| | |
| --- | --- |
| Scene | `m40-the-capwood-run-outro` in `src/cutscene/scenes/story/m40-the-capwood-run.ts` |
| Played by | quest `m40-the-capwood-run` as its outro, after the visit to the Great Ring |
| Kind and length | `outro`, aim 15-45 s; 31.9 s at Normal text speed |
| Where, when | stage `great-ring-clearing` (the Great Ring, sixteen glowing toadstool lamps, Capwood); afternoon, low gold sun through the caps (`golden` sky) |
| Before / after | before: the Run, won. After: row 41, Pinwheel Ridge (Lulu drives the player there) |

## 1. Purpose in the story

Warden Chanterelle Stook's first appearance, and Lulu's turn. The Run is won; Chanterelle fines the player for eleven
bruised caps; Lulu, who has been waiting to be asked, reads the HOA charter aloud to a clearing that groans at clause two,
and tears it in half. That is her development in one gesture: from Cam's rival to the crew's ally. The Carburettors are
free of the charter, and the next quest's convoy appears from here.

## 2. The player's feeling

- **In:** mud to the knees, a win, a headache.
- **Out:** the delight of being fined for being too good at something, and the sense that the Carburettors are theirs.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Chanterelle | to issue a correct fine | a player who thinks they won | section numbers, a ticket book | fines Lulu for littering too |
| Lulu | to show the Carburettors are theirs, publicly | the charter in her hand | reads it aloud, laughs, tears it | free of the HOA; the crew's ally |
| The player | to stay in the picture | the fine | "Eleven? I was winning." | pays |
| Bertha, Fennimore | to watch | | a facepalm; a flinch | the club is still here |

## 4. Subtext

- Lulu's reading is a performance for the three who stayed and the thirty-seven who did not.
- Chanterelle is prim, not cruel: the fine is her love of the caps.
- Cam's charter is in the tear: she destroys what he took.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | The shot through two stalks onto the ring and the low sun; a pencil already ticking. |
| 2 | 3-14 | Setup | Chanterelle (intro card): "Section Nine. Eleven bruised caps." The slip; the insert; "Eleven? I was winning." |
| 3 | 14-19 | Beat | "Eleven acorns each. One hundred twenty-one. Section Nine does not round." |
| 4 | 19-26 | Turn | Lulu unfolds the charter: "Clause one: the Carburettors shall be quiet." (Bertha's facepalm) "Clause two: beige." (Fennimore flinches) |
| 5 | 26-30 | Gesture | "You won. The Carburettors are yours. Low and loud!" She tears it; the halves land in the grass; horns. |
| 6 | 30-32 | Button | The wide of the clearing, the halves in the grass; Chanterelle: "Littering. Four acorns. Section Ten." |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | cut, stage `through-caps` | the ring through two stalks | the Capwood signature shot |
| 2 | mcu | Chanterelle (intro card) | her first line is a section number |
| 3 | cut, stage `slip` | pencil and ticket book | the insert (batch-3 notes 6.11) |
| 4-5 | mcu singles on `coverage('chanterelle','player',1)` | the player, then Chanterelle | the fine |
| 6 | low mcu | Lulu | she holds the room |
| 7 | mcu | Bertha | the reaction that is a facepalm |
| 8 | low mcu | Lulu | clause two |
| 9 | mcu | Fennimore | the flinch |
| 10 | low mcu | Lulu | the tear |
| 11 | cut, stage `wide` | the whole clearing | the gag's wide hold: the halves in the grass |
| 12 | mcu | Chanterelle | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Chanterelle | Section Nine. Eleven bruised caps. | first line, then the card |
| Player | Eleven? I was winning. | the player's one line |
| Chanterelle | Eleven acorns each. One hundred twenty-one. Section Nine does not round. | 11 x 11, prim |
| Lulu | Clause one: the Carburettors shall be quiet. | |
| Lulu | Clause two: the Carburettors shall be beige. | the groan |
| Lulu | You won. The Carburettors are yours. Low and loud! | the outline's comms line, and her taunt from the character sheet |
| Chanterelle | Littering. Four acorns. Section Ten. | the button; Section Ten is Chanterelle's refund clause in the Cap Count |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | music `turfton-dusk`, ambience `garden` | the late sun; dripping caps |
| 2 | foley `tap` | the pencil |
| 8 | foley `paper` | the slip |
| 19, 26 | foley `paper` | the charter, the tear |
| 28 | two horns and the `triumph` stinger | the Carburettors cheer |

## 9. Blocking and vehicles

Lulu stands on the grass at (155.6, -1124.2) with the charter (a rolled scroll in her hand); the player at (147, -1125.6)
steps in; Chanterelle at (147.2, -1120.4) at the player's elbow. Bertha, Dunstan and Fennimore lean on their lowriders
across the grass. Two torn halves (cutscene-only) land at (152.2, -1126.9) and (152.9, -1123.6): seen only in this scene.

## 10. The button

A prim fine for littering, written over two halves of a charter in the grass, in low gold light.

## 11. Self-check

- [x] Want, obstacle, turn (the charter), gesture (the tear); one gag, one sincere beat (the tear is sincere, the fine is the gag after it).
- [x] Hook by 3 s; every line under 16 words; the intro card is Chanterelle's first.
- [x] Lulu, low and strong; the player has one line.
- [x] The achievement unlocks on the quest's finish: the scene does not show it.
- [x] `npm run cutscene-report`: OK.
