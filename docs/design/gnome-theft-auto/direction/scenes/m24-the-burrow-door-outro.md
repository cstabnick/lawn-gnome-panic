# Director's notes: `m24-the-burrow-door-outro`

| | |
| --- | --- |
| Scene | `m24-the-burrow-door-outro` in `src/cutscene/scenes/story/m24-the-burrow-door.ts` |
| Played by | quest `m24-the-burrow-door` (The Burrow Door), as its `outro`, when the buggy reaches the door |
| Kind and length | `outro`, aim 15-45 s; 35.7 s at Normal text speed |
| Where, when | stage `burrow-door-dusk` (the round door in its mound, the lamp post, the west road), dusk (`sky: 'golden'`) |
| Before / after | before: the slow drive with Nubbin aboard; after: the reward, and the Burrow Door on the map (and a lantern lit, W06) |

## 1. Purpose in the story

The payoff of the laugh: the first time anyone has brought a Burrowfolk home, and the first time the player hears
Loamdeep. Old Mother Tumblesoil's intro card lands after her first line. DJ Moleman is a bass note and nothing else: he
is never seen and never explained. The mole lantern is the first thing the town gives the door (W06, "moles are
neighbours").

## 2. The player's feeling

- **In:** careful from the drive; a little proud.
- **Out:** warmly thanked, and faintly unsettled that the ground is playing a record. Tension 3.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Old Mother Tumblesoil | to have her people home, and to thank without making a fuss | the Hall's own volume | slow, formal, "dear one", a pause before the thing she means | tells the player she has never had one of her own brought home |
| Nubbin | to report correctly | his satchel | small, tidy sentences | bows and trots in |
| The player | to hand him over | nothing | short line, tips the hat | notices the bass |

## 4. Subtext

- "Nobody has ever brought one of us home before" is the sincere line; no gag follows it.
- The bass is the Hall's heartbeat; nobody explains the record.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | A low knock, the round door opens wider, Tumblesoil shuffles out with a lantern. |
| 2 | 6-16 | Setup | "Nubbin. Late for supper, and in one piece. Both are good." Intro card. Nubbin trots up: "This kind gnome brought me. In a barrow. Gently." |
| 3 | 16-26 | Warm | "Dear one. Nobody has ever brought one of us home before." The player tips his hat. "Mind the lantern. It is older than your hat." |
| 4 | 26-33 | Turn | Music out. A bass thump through the boards; the camera shudders. "Is something... playing?" "The Hall's heartbeat. We do not ask it questions." |
| 5 | 33-36 | Button | Nubbin bows and goes in; the lantern jumps in its glass on the next thump; the wide, gold road, one more thump. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `door` (a cut) | 50 | locked, a mole's height | the door | the hook: the door opening |
| 2 | `OLD_TALK.single('tumblesoil','mcu')`, then `'ms'` low | 35 / 40 | locked | Tumblesoil | first line, then the intro card |
| 3 | stage camera `wide` | 50 | locked | the door and Nubbin | he trots in; no dialogue |
| 4 | `OLD_TALK.single('nubbin','mcu')` | 35 | locked | Nubbin | his report |
| 5 | `OLD_YOU.single(...)` for Tumblesoil, the player, Tumblesoil | 35 | locked | the warm exchange | one side of the line |
| 6 | `OLD_YOU.single('player','mcu')`, then Tumblesoil | 35 | locked, `shake` on each thump | the bass | the turn |
| 7 | stage camera `lantern` | 50 | locked, `shake` | the lantern | the button insert |
| 8 | stage camera `wide` | 50 | locked, `shake` | the three of them | the last thump |

Tumblesoil and Nubbin on `coverage('tumblesoil','nubbin',1)`; Tumblesoil and the player on
`coverage('tumblesoil','player',-1)`. No crossings. No camera sits above a mole.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Tumblesoil | Nubbin. Late for supper, and in one piece. Both are good. | her pause-before-the-no voice, used for a yes |
| Nubbin | Yes, Ma'am. This kind gnome brought me. In a barrow. Gently. | "Ma'am" per his entry |
| Tumblesoil | Dear one. Nobody has ever brought one of us home before. | the sincere line, no gag on top |
| Player | He was no trouble. | tips the hat |
| Tumblesoil | Mind the lantern, dear one. It is older than your hat. | from her voice sample |
| Player | Is something... playing? | |
| Tumblesoil | The Hall's heartbeat, dear one. We do not ask it questions. | "the Hall's heartbeat" is her name for the beat (characters.md) |

Names checked: `npm run lore -- find "Tumblesoil"`, `"Moleman"`, `"Burrow Door"` (the lantern, R-164).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `forest` bed, `turfton-dusk` music | the quiet win; the sky goes gold |
| 0.0 | `knock` low, then `creak` | the door |
| 26.0 | music out (fade 0.6) | the beat before the bass; once in the scene |
| 26.5, 29, 33, 36 | `thud` through the ground, each with a short `shake` | DJ Moleman, never seen |
| 34.0 | `clink` at the lantern | the glass rattles |

## 9. Blocking and vehicles

- Tumblesoil comes out from the door (-993.2, 300.3) to her mark (-991.2, 300.4), facing east, lantern held up.
- Nubbin starts behind the player (-986.3, 303) and trots to (-987.5, 301.6); at the end he walks toward the door.
- The player at (-984.6, 299.2); the buggy (the player's own, `from: 'player'`) at (-985.4, 301.6) facing west.

## 10. The button

The wide at the gold hour with one more bass thump and a shudder in the frame: the door is a little open, the lantern is
lit, the ground is playing. It is the right last sound because it is the only thing the scene will not explain.

## 11. Self-check

- [x] Want (to thank), obstacle (the Hall's volume), turn (the bass).
- [x] Hook in 3 s: a knock and a door opening; not narration.
- [x] Every line under 16 words (longest 11); nobody says what the picture shows.
- [x] Voices: Tumblesoil slow and formal; Nubbin tidy; the player short.
- [x] Speakers MCU or MS, facing the lens; nobody shot from above.
- [x] One side of the line per conversation.
- [x] One track, no stingers, one held music-out.
- [x] The Moleman thread planted, unexplained.
- [x] Dusk scene is lit: gold sky, a pale lantern, a pale-hatted player.
- [x] `npm run cutscene-report` OK; LOS passes in `scenes.test.ts`.
- [x] `direction.notes` points here.
