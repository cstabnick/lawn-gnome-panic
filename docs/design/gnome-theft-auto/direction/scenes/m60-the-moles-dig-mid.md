# Director's notes: `m60-the-moles-dig-mid`

| | |
| --- | --- |
| Scene | `m60-the-moles-dig-mid` in `src/cutscene/scenes/story/m60-the-moles-dig.ts` |
| Played by | quest `m60-the-moles-dig` (The Moles Dig) as the beat that plays as the armory step starts (`beats: { 4: ... }`), right after the derby at the tunnel mouth |
| Kind and length | `arrival`, aim 10-35 s; about 16 s at Normal text speed |
| Where, when | stage `m60-armory-night`: the armory yard inside Fort Sandpit, night (`sky: 'night'`); a cutscene-only set of props |
| Before / after | before: holding the tunnel mouth against the enforcers; after: the walk in through the gate to the armory, then the outro |

## 1. Purpose in the story

The cutaway to what the dig is for. While the player holds the mouth, the moles reach the armory, and we see the other end of the
tunnel: Diggs alone with his own locked door, then the floor opening. It says the plan works, gives Diggs his one moment of being
the guard locked out of his post, and echoes "Nobody fires the Guard" with "Nobody fires on a flag".

## 2. The player's feeling

- **In:** breathless from the derby.
- **Out:** relief and a grin: the floor is open and a tiny flag is waving.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Commander Diggs | to get into his own armory | a keypad and a Vesper notice | listening, patience | lowers the rifle for a white flag |

The moles are never seen: a tap, a heave, a pickaxe with a white scrap.

## 4. Subtext

Diggs, who has spent fifteen years behind a locked door he guarded for someone else, has the door locked against him by that same
someone: "Locked out. Of my own armory." The fall of his certainty is quiet; he does not rage.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-2 | Hook | The yard in lantern light: a sealed steel container, an HOA notice, a pegboard in the dark; a wick ticks. |
| 2 | 2-6 | Setup | Diggs at the door, one hand flat on the steel: "Locked out. Of my own armory." |
| 3 | 6-9 | Turn | A tap under the sand. A beat. Another. He turns his head, then the rest of him, rifle up. |
| 4 | 9-12 | The floor | Ground level: the sand shakes, a mound heaves up; a tiny pickaxe pokes out of its crown with a scrap of white on it, waving. |
| 5 | 12-16 | Button | Diggs, rifle half raised: "Nobody fires on a flag." The flag waves again. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `yard` | 50, from the south-west corner | locked | the container, pegboard, lanterns | hook |
| 2 | stage camera `door` | 38, from beside the container | locked | Diggs in near profile, hand on the steel | his line |
| 3 | `shot('diggs','mcu',{height:'low',side:30})` | 35, low | locked | Diggs | he hears the taps |
| 4 | stage camera `floor` | 40, ground level | locked, with a tiny shake | the patch of sand, the mound, the pickaxe | the floor opens |
| 5 | `shot('diggs','mcu',{height:'low',side:-30})` | 35, low | locked | Diggs | the line |
| 6 | stage camera `floor` | 40 | locked | the flag waving | the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Diggs | Locked out. Of my own armory. | no contractions; "own" is the whole grievance |
| Diggs | Nobody fires on a flag. | echo of "Nobody fires the Guard." (#59 intro) |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `mystery` music, `night` bed; `creak` (a lantern on its hook) | a dark yard |
| 2.2, 5.6, 6.3 | `tap` (three taps, the first quiet, the next two close) | something under the floor |
| 7.1 | `shovel`, a small `shake` | the ground moves |
| 8.1 | `thud` | the mound heaves |
| 9.7 | music out (0.6 s fade), `rustle` | a hush for the pickaxe |

## 9. Blocking and vehicles

Diggs at (373.6, 3.1) facing the container's door face (374, 2); he turns to the hole at (375, 9) when the taps start and holds his
rifle in both hands, then lowers it with the line. Props: `shipping-container` at (374, -1) turned to face the yard, `notice-board`,
`ammu-stage-pegboard` and three spades, two `camp-lantern-post`s, two sandbag walls, `mole-hill` (the mound), `mole-pickaxe` and two
`banner-scrap-flag` frames for the wave. No player actor: the player is outside at the tunnel mouth.

## 10. The button

A flag the size of a biscuit, waving out of the floor of a fort. It is the last image because it is the whole row in miniature: very
big machinery of guarding, met by a very small thing that wants to come in politely.

## 11. Self-check

- [x] Want (get in), obstacle (the lock), turn (the taps).
- [x] Hook in 3 s: the lit yard and the first sound.
- [x] Lines under 8 words; nobody explains the picture.
- [x] Diggs's voice: clipped, no contractions.
- [x] Night scene is lit: lantern posts; Diggs's pale rifle.
- [x] Music has a reason at each change; no stinger.
- [x] `npm run cutscene-report` OK; line of sight passes.
- [x] `direction.notes` points here.
