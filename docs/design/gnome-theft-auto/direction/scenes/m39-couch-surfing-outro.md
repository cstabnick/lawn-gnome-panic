# Director's notes: `m39-couch-surfing-outro`

Watch it at `?no-intro&cutscene=m39-couch-surfing-outro`.

| | |
| --- | --- |
| Scene | `m39-couch-surfing-outro` in `src/cutscene/scenes/story/m39-couch-surfing.ts` |
| Played by | quest `m39-couch-surfing` as its outro, after the visit to the Under-Deck culvert |
| Kind and length | `outro`, aim 15-45 s; 49.2 s at Normal text speed (under the 60 s limit: the hug is held) |
| Where, when | stage `culvert-reunion` (the storm-drain portal under the kerb, the crate before it); night (batch-3 notes: "pre-dawn, the culvert, lanterns") |
| Before / after | before: the stairwell with Hyssop. After: the crew splits the four parts; row 40 |

## 1. Purpose in the story

The row's one sincere beat. Tansy has been gone since the Salvage Raid; Pip lost his arm and his bay in front of her. She
climbs out of the dark, sees the arm, and holds somebody for the first time in the game (her act III hug, characters.md).
Then the work resumes: Silt-Diver Sal, her map and Pip's sock-map agree, the four parts are split and Pip names his
address, the player's couch.

## 2. The player's feeling

- **In:** a long ride, a laugh, then a dark drain.
- **Out:** moved, then glad: the crew is whole again, and there is a plan with four edges.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Tansy | to see them whole, and to start the work | eleven days of being gone; not touching anyone | dry short lines, then a hug | the crew's boss again |
| Pip | to be forgiven for nothing, and told so | his habit of talking over every feeling | shorter and shorter lines | quiet, and then at home |
| Sal | clean socks | sentiment | prices everything, "for clean socks" | a sock, in lieu |
| The player | to be there | (none) | silence | the one who brought them together |

## 4. Subtext

- "Eleven days. I counted." / "It felt like twelve." is love in two people who do not say it.
- Tansy never says sorry; she says "Do not lose that arm again", which is the same sentence.
- Sal's line breaks the moment on purpose: a grown gnome who has been feeding a girl noodles for eleven days.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Ground level at the drain mouth; iron scrapes on stone. |
| 2 | 3-10 | Setup | Pip, waiting: "She is going to be so angry. Or nice. I do not know which is worse." |
| 3 | 10-26 | The reunion | Tansy climbs out; four short lines; the walk to Pip; the hug; music out; one held silence. |
| 4 | 26-33 | Turn | "Do not lose that arm again." Sal, from the dark: "Touching. Two hankies, one drain, no charge." (intro card) |
| 5 | 33-43 | Work | Two maps side by side on the crate; "Four parts, four edges. Power first." Pip: "I sleep on the couch. Hyssop has written it down." |
| 6 | 43-49 | Button | Sal and the sock: "Fine sock." "That is the map!" "Fine map." |

## 6. Shot list

| # | Shot | On | Motivation |
| --- | --- | --- | --- |
| 1 | cut, stage `portal-low` | the drain mouth | hook |
| 2 | mcu | Pip | the fear |
| 3 | cut, stage `wide` | all four small in the lamplight | Tansy's entrance |
| 4-7 | mcu singles, `coverage('tansy','pip',-1)` | Tansy / Pip alternating | tenderness: eye level, nobody above anybody, long holds |
| 8 | fs, profile two-shot | the hug | the widest shot that holds both: locked |
| 9 | mcu | Tansy | the line over the hug |
| 10 | mcu | Sal | breaking the moment, and the intro card |
| 11 | cut, stage `crate` | the two maps on the crate | the insert of the act (the maps agree) |
| 12-15 | mcu singles | Tansy, Pip, Sal | the work, and the button |

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | She is going to be so angry. Or nice. I do not know which is worse. | the thaw's setup |
| Tansy | You got your arm back. | first, the practical thing |
| Pip | Tansy. I thought you were gone. | no run-on: the thaw |
| Tansy | Eleven days. I counted. | |
| Pip | It felt like twelve. | bad at numbers, and meant |
| Tansy | Do not lose that arm again. | her apology |
| Sal | Touching. Two hankies, one drain, no charge. For clean socks, the whole map. | trader's patter |
| Tansy | Four parts, four edges. Power first. We split them from here. | the plan, in three clauses |
| Pip | I sleep on the couch. Hyssop has written it down. | the quest's promise; callback |
| Sal / Pip / Sal | Fine sock. / That is the map! / Fine map. | the button |

No gag sits on the hug: the first joke after it is Sal's, and he is the one who breaks the silence.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | music `mystery`, ambience `cave` | the drain; drips |
| 1 | foley `clatter`, `creak` | the grate |
| 18 | music out | the hug |
| 19-21 | foley `cloth`; the one silence (2 s), waived | the sincere beat |
| 21 | music `turfton-dusk` | the warmth comes back |
| 27 | `clink`; the intro card's freeze and stinger | Sal |
| 31-34 | foley `paper` twice | the two maps |

## 9. Blocking and vehicles

Pip and the player stand at (-5.2, -8.8) and (-6.6, -7.4). Tansy spawns in the portal (-10, -10.4), walks through the gap
between the two pillars and east along z -8.4 to (-6.7, -8.6); Pip steps to meet her at (-5.7, -8.5). Sal spawns at
(-11.8, -8.6). A crate with Sal's lit lamp stands at (-9.2, -7.0); the maps lie on it. The player does not move.

## 10. The button

Sal holding a sock-map up to his lamp and ruling it a very good sock. The last sound is a drip.

## 11. Self-check

- [x] A want (to see them whole), an obstacle (eleven days), a turn (the hug, then Sal).
- [x] Hook by 3 s; no line says what the picture shows.
- [x] One side of the line for the pair; the held two-shot is waived for `shot-long` (the hug and the silence, written down).
- [x] Music has a reason at each change; one held silence; the intro card is Sal's.
- [x] Night scene lit by the lamp.
- [x] `npm run cutscene-report`: OK (1 waived).
