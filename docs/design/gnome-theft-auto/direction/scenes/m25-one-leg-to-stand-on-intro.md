# Director's notes: `m25-one-leg-to-stand-on-intro`

| | |
| --- | --- |
| Scene | `m25-one-leg-to-stand-on-intro` in `src/cutscene/scenes/story/m25-one-leg-to-stand-on.ts` |
| Played by | quest `m25-one-leg-to-stand-on` (One Leg to Stand On), as the `scene` of its first `visit` objective (arriving at Wader's Rest) |
| Kind and length | `intro`, aim 30-60 s; 35.7 s at Normal text speed |
| Where, when | stage `waders-circle` (the ritual circle, the Standing Lady behind it), dusk (`sky: 'golden'`) |
| Before / after | before: Driftwood's call and the drive out along the loch road; after: stand through the sermon (the hold game) |

## 1. Purpose in the story

First reach of Wader's Rest and the Flock's first face. Funny first: a whole camp on one leg before a barn-sized pink
flamingo, one of them wobbling, a tea debt. It sets the terms (one sermon, one leg, and the raft is yours) for the hold
game. Mother Saxifrage's intro card lands after her first line. Plants the Flock's one leg (batch-3 notes, section 3).

## 2. The player's feeling

- **In:** arrived at an odd place by the loch; here for a favour.
- **Out:** amused, a little cornered, and clear on the task: hold the action button for the whole sermon.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Mother Saxifrage | to have her sermon heard and the raft kept as leverage | a gnome with two feet on the ground | ritual sing-song, "so it is stood" | beckons the player into the circle |
| Brother Godwit | to stay up | his own leg | confessing | wobbles again at the end |
| The player | to get the raft | the sermon | one flat line | agrees by saying nothing |

## 4. Subtext

- Saxifrage keeps the raft as leverage for an audience: she wants someone to stand with her, and she does not say so.
- Her warmth is real; the joke is that nothing she says is optional.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-6 | Hook | The Flock on one leg before the Standing Lady against a gold sky; Godwit wobbles, a cup clinks. |
| 2 | 6-16 | Setup | "Brother Godwit. You have had a thought." Intro card. "I have, Mother. I am holding the cup." "Then it is owed two. So it is stood." (comic stinger) |
| 3 | 16-27 | Turn | She finds the gnome on two legs: "How brave." "I am here for Driftwood's raft." "Stand one sermon on one leg, and the raft is yours." |
| 4 | 27-36 | Button | "How long is a sermon?" "As long as the Lady needs. Come. Find your leg, and do not let go." Godwit clinks again. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | stage camera `lady` (a cut) | 44 | locked, from the south, 2.4 m up | the Flock's backs and the Lady | the picture is the joke |
| 2 | `SAX_GOD.single('saxifrage','mcu')` and `('godwit','mcu')` | 35 | locked | the confession exchange | one cut per line (a `face` pair first) |
| 3 | `SAX.single('saxifrage','mcu', low)` | 35 | locked, low | Saxifrage | authority; she is shot from below |
| 4 | `SAX.single('player','mcu')` | 35 | locked | the player | the two-legged straight man |
| 5 | `SAX.single('saxifrage','ms', low)` | 40 | locked | Saxifrage beckoning | the objective in her voice |

Sides: Saxifrage and Godwit on `coverage('saxifrage','godwit',-1)`; Saxifrage and the player on
`coverage('saxifrage','player',1)`. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Saxifrage | Brother Godwit. You have had a thought. | the Flock's rule: a wobble is "a thought" (lore) |
| Godwit | I have, Mother. I am holding the cup. | he owes tea; he is the one who always does |
| Saxifrage | Then it is owed two. So it is stood. | her tic |
| Saxifrage | A gnome on two legs. Both on the ground. How brave. | |
| Player | I am here for Driftwood's raft. | |
| Saxifrage | Stand one sermon on one leg, and the raft is yours. So it is stood. | the terms |
| Player | How long is a sermon? | |
| Saxifrage | As long as the Lady needs. Come. Find your leg, and do not let go. | the objective, in voice |

Names checked: `npm run lore -- find "Flock"`, `"Standing Lady"`, `"Wader's Rest"`, `"Godwit"` (the camp's people are in `societies/config.ts`).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `water` bed (reeds, the loch), `mystery` music | the camp's hum and the place's strangeness; deadpan under the joke |
| 0.5, 2.5 | `creak` and `clink` at Godwit | the wobble, then the cup |
| 15.0 | `comic` stinger on "owed two" | the one gag landing, once |
| 35.0 | `clink` | Godwit goes again behind her |

## 9. Blocking and vehicles

- Saxifrage at (-1130, -643.6) on one leg, turning to the player; Godwit at (-1134.2, -645.6); the player at (-1126.2, -639).
- The ring of Flock members and the Lady are the world's own (societies/flock); the scene keeps its own actors inside the ring.

## 10. The button

Saxifrage's ms from below, beckoning: "...and do not let go." with Godwit's cup clinking behind her. It hands the player
the hold, and the last sound is still a joke, which is right: the ominous line comes after the sermon, not before.

## 11. Self-check

- [x] Want (an audience), obstacle (the player's two legs), turn (she notices them).
- [x] Hook in 3 s: the Flock and the Lady, a wobble; not narration.
- [x] Every line under 16 words (longest 15); no waypoint read-outs.
- [x] Voices: Saxifrage ritual, "so it is stood"; Godwit contrite; the player short.
- [x] Speakers MCU or MS, facing the lens.
- [x] One side of the line per conversation.
- [x] One track, one stinger.
- [x] Ladders: the Flock's one leg planted (paid off in #51 and #70).
- [x] Dusk scene is lit: gold sky behind a pink Lady, grey Flock in the foreground.
- [x] `npm run cutscene-report` OK; LOS passes in `scenes.test.ts`.
- [x] `direction.notes` points here.
