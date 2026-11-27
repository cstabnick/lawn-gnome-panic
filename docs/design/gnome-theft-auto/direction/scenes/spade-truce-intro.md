# Director's notes: `spade-truce-intro`

Copy of [TEMPLATE.md](../TEMPLATE.md). Rules and numbers: [bible.md](../bible.md). Worked example: [scenes/mowers-keepers-intro.md](mowers-keepers-intro.md).

| | |
| --- | --- |
| Scene | `spade-truce-intro` in `src/cutscene/scenes/story/ch4c.ts` |
| Played by | quest `Nobody Fires the Guard` (giver Dust Flats Overlook), as its intro |
| Kind and length | intro, aim 30-45 s (bible section 4). Re-cut: 38.8 s, was 31.8 s |
| Where, when | stage `dust-safehouse` overlook, the standoff after the Sandpit Drop; `sky` default, afternoon, wind |
| Before / after | `sandpit-drop-outro` (the standoff, Diggs stopped) / the chase to the fort gate |

## 1. Purpose in the story

Vesper locks the armory and makes the Spade Guard redundant over the phone. Diggs stops being an enemy: he turns, because his city and his orders are no longer the same thing. This is the spine of chapter 4. It plants the Spade Guard's alliance and sets the quest: retake the armory at the fort gate.

## 2. The player's feeling

- **In:** the standoff is still on, nobody has moved, the player has just stopped Diggs at the Whirligig.
- **Out:** Diggs is on their side, grim, and they have a job. The crew has a grudging ally, and Vesper has just made an enemy.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Vesper (off-screen, phone) | Make the Guard go away quietly. | Diggs's pride; the phone is all he has. | Soft, slow, complete sentences; no contractions. | None: he never raises his voice. |
| Diggs | Keep his orders; then, because of what he hears, choose his city. | Vesper's orders, and his fifteen years. | Still and LOW; a single word ("...Redundant.") and then a line. | He turns. |
| Tansy | Take the armory back, with the Guard's help. | Diggs is a rival, not a friend. | Flat and dry. | Accepts him, grudgingly. |
| Pip | Win the bet that Diggs is faster. | None. | Joy, cheeky, MCU. | None. |

## 4. Subtext

- Vesper's "Thank you for your service" is the cut: the Guard is a line item now.
- Diggs's "Redundant" is the whole grief: fifteen years of waiting, and it has no use.
- "Especially not a guy in a porcelain hat" is Diggs's joke at Vesper's expense, the first time anyone in the Guard has laughed at him.
- Pip and Tansy: she has already decided; he is still joking to keep the room light.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Still standoff, a wide over the overlook. The phone chirps at Diggs; he clutches it. |
| 2 | 3-14 | Vesper | A slow push-in on Diggs, LOW, while Vesper's voice says the armory is locked, the Guard redundant, and thanks him for his service. |
| 3 | 14-17 | Silence | Music drops out. Diggs, LOW CU, "...Redundant." |
| 4 | 17-22 | Look | Pip and Tansy exchange a look, MCU each. |
| 5 | 22-30 | Turn | Diggs lowers the phone, LOW MCU: "Nobody fires the Guard." Then the sandpit march comes in: "Especially not a guy in a porcelain hat." |
| 6 | 30-34 | Crew | Pip, side-mouth: "Is he on our side now?" Tansy: "He's on his side. It's next to ours." |
| 7 | 34-38 | Job | Diggs salutes; "The armory is mine. Help me take it back." He climbs on and tears off, a track on the Zero-Turn. |
| 8 | 38-39 | Button | Pip: "Ten acorns says he beats us to the gate." Tansy: "He already has." |

## 6. Shot list

| # | Shot (size, `frame`/`cut`/`track`/...) | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `cut` wide, `up(283, 1.7, 50)` | 48 mm | none | Diggs | the standoff stays in view |
| 2 | `dolly` 4.5 s, LOW | 46 mm | slow push | Diggs | the news lands on his face |
| 3 | `frame` LOW CU, Diggs (toward Pip) | 46 mm | none | Diggs | "...Redundant." |
| 4 | `coverage(pip, tansy, 1)` MCU, Pip | 46 mm | none | Pip | the look |
| 5 | `coverage(pip, tansy, 1)` MCU, Tansy | 46 mm | none | Tansy | the look |
| 6 | `frame` LOW MCU, Diggs (toward Tansy) | 46 mm | none | Diggs | the turn |
| 7 | `coverage(pip, tansy, 1)` MCU, Pip | 46 mm | none | Pip | "Is he on our side now?" |
| 8 | `coverage(pip, tansy, 1)` MCU, Tansy | 46 mm | none | Tansy | "It's next to ours." |
| 9 | `frame` LOW MS, Diggs (toward player) | 46 mm | none | Diggs | the job, a salute |
| 10 | `track` on `diggs-ride` | 48 mm | follows | the Zero-Turn | the tear-off |
| 11 | `coverage(pip, tansy, 1)` MCU, Pip | 46 mm | none | Pip | the bet |
| 12 | `coverage(pip, tansy, 1)` LOW MCU, Tansy | 46 mm | none | Tansy | "He already has." |

Coverage: one object per conversation. The Pip/Tansy exchange is on one side (side 1) throughout; Diggs is shot on his own, never crossed with them.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Vesper | Commander. The armory is locked, effective immediately. The Spade Guard is redundant. | 12 words. Off-screen. Carries the villain music and stinger. |
| Vesper | Thank you for your service. | Split from the line above so each stays under 16 words. |
| Diggs | ...Redundant. | One word. |
| Diggs | Nobody fires the Guard. | Diggs's line (it was Tansy's in the old script). Checked: no other scene uses it. |
| Diggs | Especially not a guy in a porcelain hat. | Diggs's joke at Vesper's expense. |
| Pip | Is he on our side now? | Side-mouth to Tansy. |
| Tansy | He's on his side. It's next to ours. | Flat, dry. |
| Diggs | The armory is mine. Help me take it back. | The quest's ask, in his voice. |
| Pip | Ten acorns says he beats us to the gate. | The bet. The running joke of the crew. |
| Tansy | He already has. | Button. |

No narrator, no captions.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `tension`, `wind` ambience | the standoff |
| 1 | `phone` sfx at Diggs | the call arrives |
| 3-14 | `villain` stinger on Vesper's first line | Vesper walks in |
| 14-17 | music null (fade 0.6) | the silence after "Redundant" |
| 22 | `sandpit` march (fade 1.2) on "Especially not a guy in a porcelain hat" | Diggs has decided |
| 38 | the Zero-Turn's drive (no music change) | he tears off |

## 9. Blocking and vehicles

- Diggs stands at his mark (302, 44) facing the crew; the Whirligig (`chopper`) is parked at (290, 38) with the player at (288, 46).
- Pip (272, 46) and Tansy (276, 50) stand at the safehouse marks, facing the player.
- Diggs's Zero-Turn (`diggs-ride`) is hidden until his entrance, then he enters it at its mark and drives to the fort gate along (302, 44), (340, 56), (374, 70).
- The player walks from (288, 46) to (280, 44) and (276, 42) and ends near Tansy, on foot, at the overlook.

## 10. The button

Pip's bet and Tansy's flat answer, MCU each, with the Zero-Turn gone over the rise behind the player. The last sound is the engine. It is the right last moment because the joke answers the question the scene asked: they are a crew now, and Diggs is already ahead of them.

## 12. Act IV revision (E22, row 59): the bible fix

Day (`sky: 'noon'`), `kind: 'intro'`. The Whirligig is hidden in a Pebblewick barn after row 58, so the scene no longer has
it at the overlook, and Diggs is no longer standing there: he is on the radio from his own gate.

- Opening: the table radio crackles; Tansy: "The Whirligig is under hay in Pebblewick. So who is on the radio?" (the
  Previously-beat).
- Diggs at the gate (cut from the gate's `wide` to his own close shots, so he is never a speck): "Vesper fired the Guard. By
  phone. Then he locked my fort from Thorne Tower." / "He said, 'Thank you for your service.'" / "...Redundant." (low CU).
  The villain's voice and stinger are gone from this scene: the news comes in Diggs's mouth.
- A Tansy line ("Diggs. Are you still there?") breaks his run of lines, then **Diggs** says "Nobody fires the Guard." and,
  as the sandpit march comes in, "Especially not a guy in a porcelain hat." (Tansy says no part of it.)
- Pip: "Is he on our side now?" Tansy: "He's on his side. It's next to ours." Diggs: "Follow me to the gate. Three of
  Vesper's enforcers are on it." and mounts his Zero-Turn, rolling out down the gate road. Button kept: Pip's bet,
  Tansy's "He already has." (now literally true). Length 48.1 s.
