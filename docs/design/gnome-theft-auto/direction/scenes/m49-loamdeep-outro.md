# Director's notes: `m49-loamdeep-outro`

| | |
| --- | --- |
| Scene | `m49-loamdeep-outro` in `src/cutscene/scenes/story/m49-loamdeep.ts` |
| Played by | quest `m49-loamdeep` (Loamdeep), as its `outro`, when the last visit (Moleman's decks) is done |
| Kind and length | `outro`, aim 15-45 s; about 28 s at Normal text speed |
| Where, when | stage `burrow-door-supper`: the round door, lamps lit, a supper table on the grass; night (`sky: 'night'`) |
| Before / after | before: Moleman's track; after: 400 acorns, W13 (a root stall), the Burrowfolk join, and Juniper's call at this very door (#50) |

## 1. Purpose in the story

The payoff of the Burrowfolk's first ask, and the line the outline gave the row: "we dig where we are asked, and nobody
ever asks". The player answers it ("I am asking") and the Burrowfolk promise to dig when the day comes (they do in
#60). The ground says yes through the table.

## 2. The player's feeling

- **In:** swept up by the track; hungry for an ally.
- **Out:** trusted. The Burrowfolk are in. Tension 4, warm.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Old Mother Tumblesoil | to seal it properly: a root on the table | she is not used to asking, or being asked | slow, formal; a gesture instead of a speech | promises to dig on the day |
| Nubbin | to start supper | it is not time | a napkin, too early | translates the ground |
| The player | to answer a statement with a question | nothing | three words | has become the one who asks |

## 4. Subtext

- "We dig where we are asked. And nobody ever asks" is a complaint turned into an invitation; the player takes it.
- The root on the table is the family's handshake: the promise is physical, and it is the same root as in the Rootway job.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Ground level along the lit lamps to the open door; a napkin tucked in too early: "Is it supper?" |
| 2 | 5-12 | Setup | "Presently, dear. First, the table." She bows and sets a root on it. |
| 3 | 12-23 | Sincere | "We dig where we are asked, dear one. And nobody ever asks." "I am asking." "Then we shall dig. Ask on the day, and the ground will be ready." |
| 4 | 23-25 | Turn | Music out; one bass note through the table. |
| 5 | 25-28 | Button | "That is a yes, Ma'am. He is very loud about it." One more thud; the wide, the lamps, the door. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `lamps` | 50 | locked, ground | the lit lamps and the door | hook |
| 2 | `SUP_NUB.single('nubbin','mcu')` | 35 | locked | Nubbin | his line |
| 3 | `SUP_OLD.single('tumblesoil','mcu')` | 35 | locked | Tumblesoil | "Presently" |
| 4 | `shot('tumblesoil','ms',{toward:'player',side:70})` | 40 | locked | Tumblesoil | the root set down |
| 5-8 | `SUP_OLD` singles | 35 | locked | Tumblesoil, the player | the sincere exchange |
| 9 | `shot('player','mcu',{toward:'tumblesoil'})` | 35 | locked | the player | the thump |
| 10 | `SUP_NUB.single('nubbin','mcu')` | 35 | locked | Nubbin | the button line |
| 11 | stage camera `wide` | 50 | locked | the lamps, table and mound | final |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Nubbin | Is it supper? It feels very much like supper. | he is early, and right |
| Tumblesoil | Presently, dear. First, the table. | |
| Tumblesoil | We dig where we are asked, dear one. And nobody ever asks. | the row's line, said once, plainly |
| Player | I am asking. | three words; the beat after is a held pause |
| Tumblesoil | Then we shall dig. Ask on the day, and the ground will be ready. | says it: they dig in #60 |
| Nubbin | That is a yes, Ma'am. He is very loud about it. | Moleman, unexplained |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `night` bed, `turfton-dusk` music | the quiet win |
| 1 | `clink` | cutlery |
| 8 | `thud` (the root on the wood) | the promise is physical |
| 23 | music out (0.6) + `thud` and `shake` | the ground says yes |
| 26 | `thud` and `shake` | one more |

## 9. Blocking and vehicles

`mole-table-round` at (-989.1, 300.95), two stools, grub bread and a jar on it, a lit lamp on a stool, two lit mole lamps
on the mound (scene props). Tumblesoil behind the table at (-990.6, 301.2) with a root bundle in hand; Nubbin at
(-988.6, 303.4); the player at (-987.2, 299.9). The root is spawned on the table at the set-down.

## 10. The button

The lamps jump in their glass once more and the camera widens to the door. The last sound is a bass note nobody is
allowed to ask about.

## 11. Self-check

- [x] Want (to seal it), obstacle (not used to asking), turn (the ground answers).
- [x] Hook in 3 s: lamps, a clink, a napkin; not narration.
- [x] Every line 15 words or fewer; nobody says what the picture shows.
- [x] Voices: Tumblesoil slow and formal; Nubbin tidy; the player three words.
- [x] Speakers MCU or MS, facing the lens.
- [x] One side of the line per conversation.
- [x] One music track, no stingers, one held pause.
- [x] The Burrowfolk join: said aloud, and the root is the proof.
- [x] Night scene is lit by lamps, pale table and root.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
