# Director's notes: `m49-loamdeep-intro`

| | |
| --- | --- |
| Scene | `m49-loamdeep-intro` in `src/cutscene/scenes/story/m49-loamdeep.ts` |
| Played by | quest `m49-loamdeep` (Loamdeep), as its `cutscene`, when Old Mother Tumblesoil gives the quest |
| Kind and length | `intro`, aim 30-60 s; about 34 s at Normal text speed |
| Where, when | stage `burrow-door-welcome` (the round door in its mound, lit hall behind it), day (`sky: 'noon'`) |
| Before / after | before: the last act-III hunt (#48, the Groundskeeper's secret); after: the three mole jobs in Loamdeep |

## 1. Purpose in the story

The Burrowfolk have never asked anybody for anything. Tumblesoil thanked the player at this door in row 24 (#24, the
barrow, the lantern); now she asks for help, and tells us what it costs her to ask. The scene is the act's first warm
room after the part hunts: the door open on a lit hall, and the promise of an ally. The interior giver is the Mother's
Hall; the scene cuts out to the door the way a film cuts to the welcome.

## 2. The player's feeling

- **In:** the Combine is a machine with four parts and the crew has had no friends for a while; a little wary of a
  hole in the ground.
- **Out:** wanted, and given a clear job: three small jobs, then an ally. Tension 4, warm.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Old Mother Tumblesoil | to ask for help without making a fuss of it | she has never asked, in her life | slow, formal, "dear one", a pause before the thing she means | says the unsaid thing: it feels like a draught |
| Nubbin | to bring the post in | the sack is bigger than he is | small tidy sentences, bows | taken in by his own sack |
| The player | to hear what is wanted | nothing | one short line, tips the hat | has been asked, and has said yes by staying |

## 4. Subtext

- "This door has not been shut since you carried him home" is the thanks, the second time, with no ceremony.
- "It feels like a draught" is the Mother's secret: a family that digs where it is asked has been waiting all its life
  to be asked, and does not know what to do with the feeling.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | Ground level at the round door: a squeak, a clatter, Nubbin leaning on a sack that will not go over the step. |
| 2 | 6-18 | Setup | "Eleven days late, and the sack has grown." The door opens on lamplight; Tumblesoil comes out: "Our guest first, and then the post." |
| 3 | 18-28 | Turn | "This door has not been shut since you carried him home." The player: "I heard there were jobs." Three small ones, then the Burrowfolk are yours. |
| 4 | 28-31 | Sincere | "I have never asked anyone for anything. It feels like a draught." |
| 5 | 31-34 | Button | Nubbin takes the sack in first and the sack takes Nubbin; one bass thump through the step. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `door` | 50 | locked, a mole's height | the door and the sack | hook |
| 2 | `NUB_YOU.single('nubbin','mcu')` | 35 | locked | Nubbin | his line |
| 3 | stage camera `step` | 50 | locked, low | the lamp, the step, the doorway | she comes out |
| 4-6 | `OLD_TALK` / `OLD_YOU` singles | 35 | locked | Tumblesoil, the player | the exchange, one side of the line |
| 7 | `OLD_YOU.single('tumblesoil','ms',{height:'low'})` | 40 | locked | Tumblesoil | the sincere line, low: she is the matriarch |
| 8 | `NUB_YOU.single('nubbin','mcu')` | 35 | locked | Nubbin | the sack line |
| 9 | stage camera `wide` | 50 | locked | the door and the step | the button |

Tumblesoil and the player on `coverage('tumblesoil','player',-1)`; Nubbin and Tumblesoil on one side. No crossings.
No camera sits above a mole.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Nubbin | Oh dear. Eleven days late, and the sack has grown. | post is late (his flaw, the side quest's joke) |
| Tumblesoil | Nubbin. Our guest first, dear, and then the post. | |
| Tumblesoil | Dear one. This door has not been shut since you carried him home. | the thanks, again, as a fact |
| Player | I heard there were jobs. | tips the hat |
| Tumblesoil | Three small ones. Roots, lamps, the post. Then the Burrowfolk are yours. | the promise, said plainly |
| Tumblesoil | I have never asked anyone for anything. It feels like a draught. | the sincere line, no gag on top |
| Nubbin | Most kind, Ma'am. I shall take the sack in first. | the gag is the picture |

Names checked: `npm run lore -- find "Tumblesoil"`, `"Burrow Door"`. Tumblesoil and Nubbin have their cards from #24.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `forest` bed, `fescue` music | Mossy Wood folk music; the door is the Wood's neighbour |
| 1 | `squeak`, `clatter` | the sack |
| 8 | `door-creak` | the door opens wide |
| 32 | `thud` and a short `shake` | the Hall's heartbeat, the same one #24 planted |

## 9. Blocking and vehicles

Nubbin at (-987.5, 301.6) on the step with the post sack at his feet; Tumblesoil spawns behind the round door at
(-993.2, 300.3) and walks to (-991.2, 300.4); the player at (-984.6, 299.2), road side, hat in hand. Two lit mole lamps
(`mole-lamp-lit`) on the mound face either side of the doorway are the scene's own dressing (L95): the lit hall.

## 10. The button

A sack the size of a mole disappears through a round door with a mole holding on to it, and the ground thumps once,
affectionately. It is the right last image because the warm beat is already said and the world's own joke should end it.

## 11. Self-check

- [x] Want (to ask), obstacle (never has), turn ("a draught"); not a briefing.
- [x] Hook in 3 s: a squeak and a clatter at ground level; not narration.
- [x] Every line 14 words or fewer; nobody says what the picture shows; no coordinates or waypoint read-outs.
- [x] Voices: Tumblesoil slow, formal, "dear one"; Nubbin tidy; the player one line.
- [x] Speakers MCU or MS, facing the lens; no shot from above.
- [x] One side of the line per conversation.
- [x] One music track, no stingers, one `thud` button.
- [x] The Moleman thread is the heartbeat; unexplained.
- [x] Day scene, no lighting concerns.
- [x] `npm run cutscene-report` OK; line of sight passes in `scenes.test.ts`.
- [x] `direction.notes` points here.
