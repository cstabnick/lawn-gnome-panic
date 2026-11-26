# Director's notes: `m50-trellisdown-tasting-mid`

| | |
| --- | --- |
| Scene | `m50-trellisdown-tasting-mid` in `src/cutscene/scenes/story/m50-trellisdown-tasting.ts` |
| Played by | quest `m50-trellisdown-tasting` (Trellisdown Tasting), as the `scene` of the inspect objective, when the player has photographed the ledger |
| Kind and length | `arrival`, aim 10-35 s; about 29 s at Normal text speed |
| Where, when | stage `manor-terrace-night`: Brassknock Manor's forecourt and raised terrace, night (`sky: 'night'`), candles and lamp posts |
| Before / after | before: the tray carried through the tasting hall; after: the slip out past Chicory at the gate |

## 1. Purpose in the story

**The first time Vesper and the player share one frame.** He turns his head across the gravel and sees the player's
face, one long look, no line, then turns back to his hostess. Countess Wisteria Brassknock's intro card lands here
(first scene she speaks). The ledger is hers and she signs it in front of the backers: the Combine's money is a vineyard's.

## 2. The player's feeling

- **In:** a waiter with a tray and a hidden camera, very pleased with himself.
- **Out:** the longest second of the quest: he has been seen by the one gnome who must not see him. Tension 6.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Countess Wisteria | to be admired for her patience | she does not know what it pays for | slow, grand; one signs what one has decided | stops Vesper's stare with a rebuke |
| Vesper | to be polite to the person who pays | a face he does not place | very soft; no contractions; a measuring look | turns back, still measuring |
| The player | to stay a waiter | the shutter, the tray | stillness; thumb on the tray | steadies the glasses |

## 4. Subtext

- Vesper cannot place the face: he flinches from nothing and is not a gnome who forgets a face. "No line" is the dread.
- "Generous is a word for other people" is Wisteria not asking what the money is for (characters.md: she funded it six years).
- The Countess never looks at the waiter; Vesper is the one who does. The staring is the scene's whole danger.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | The lit terrace; glasses lifted; the lectern at its centre. |
| 2 | 5-13 | Setup | "Friends. A vineyard is only patience, kept in bottles." Card. Vesper: "Generous, Countess. And so very even." |
| 3 | 13-18 | Turn | "Generous is a word for other people. One merely signs." The ledger; a shutter under the toast. |
| 4 | 18-24 | The look | Vesper turns his head; the villain stinger; then the profile two-shot, music out, a held silence: both in one frame. |
| 5 | 24-29 | Button | "Vesper. You are staring at the help." He turns back. The tray chimes under a thumb. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `wide` | 50 | locked, low from the west corner | the terrace and the guests | hook |
| 2 | `W_V.single('wisteria','mcu',{height:'low'})` | 35 | locked, low | Wisteria | the toast; the card |
| 3 | `W_V.single('vesper','mcu')` | 35 | locked | Vesper | his line |
| 4 | `W_V.single('wisteria','mcu',{height:'low'})` | 35 | locked, low | Wisteria | the signing |
| 5 | stage camera `lectern` | 50 | locked | the ledger | the insert |
| 6 | `shot('player','mcu',{toward:'wisteria'})` | 35 | locked | the player | the shutter |
| 7 | `shot('vesper','mcu',{toward:'player',side:60})` | 35 | locked | Vesper | his head turns |
| 8 | stage camera `profile` | 36 | locked, level, from the north | the player and Vesper in profile, the Countess lit behind | **the one frame** |
| 9 | `shot('vesper','cu',{toward:'player'})` | 30 | locked | Vesper | the look |
| 10 | the Countess, then Vesper, mcu | 35 | locked | the rebuke, the turn back | the release |
| 11 | `shot('player','cu',{height:'high'})` | 30 | locked, looking down | the tray | the button |

Wisteria and Vesper share `coverage('wisteria','vesper',1)` so the camera does not cross the line.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Wisteria | Friends. A vineyard is only patience, kept in bottles. | slow, grand; card after the line |
| Vesper | Generous, Countess. And so very even. | no contractions; "even" is his religion |
| Wisteria | Generous is a word for other people. One merely signs. | "one", per her bible entry |
| Wisteria | Vesper. You are staring at the help. | the only voice in the long look |

Vesper says nothing during the look. Names checked: `npm run lore -- find "Wisteria"`, `"Brassknock"`, `"Vesper"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `garden` bed, `mystery` music | a tasting at night with a draught in it |
| 2 | `clink` (glasses) | the toast |
| 9 | `paper` (the pen) | the signature |
| 15 | `snap` under a `clink`, tiny `shake` | the shutter hidden in the toast |
| 17 | `villain` stinger | Vesper turns |
| 19 | music out, held `silence` (2.0 s), `tap` of the calipers | the look; once in the scene |
| 28 | music back in (1.0 s fade), `clink` | the tray |

## 9. Blocking and vehicles

All scene props: the open `ledger-book` on the terrace at (-1139, 19.0), 1.2 m above the gravel; candelabra on the terrace;
two lamp posts. Wisteria on the terrace at (-1139, 20.4) facing north; Vesper in the front row at (-1135.2, 15.4); the player
in waiter black and white at (-1143.4, 13.2) with a `tasting-tray`; three backers on the gravel. In the profile two-shot the
player faces east and Vesper west, so they look at each other across about 8 m of gravel.

## 10. The button

A thumb on a tray and a chime of thimble glasses: the player is alive and has the picture. The music creeps back in the
second Vesper turns away, because he has not stopped measuring.

## 11. Self-check

- [x] Want (to stay unseen), obstacle (Vesper), turn (he turns his head).
- [x] Hook in 3 s: lifted glasses and a clink.
- [x] Every line 12 words or fewer; no coordinates.
- [x] Voices: the Countess slow and "one"; Vesper soft, no contractions; nobody explains the look.
- [x] Speakers MCU, facing the lens; one profile two-shot on purpose, no speakers in it.
- [x] One side of the line (the shared coverage).
- [x] One stinger, one held silence.
- [x] Night scene is lit: candles, lamp posts, a white-shirted waiter and a white Vesper.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
