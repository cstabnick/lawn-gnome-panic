# Director's notes: `kiln-resin-intro`

| | |
| --- | --- |
| Scene | `kiln-resin-intro` in `src/cutscene/scenes/story/ch3b.ts` |
| Played by | quest `ch3-kiln-resin-ice` ("Kiln-Resin & Black Ice") as its intro, given at the Frozen Birdbath Basin |
| Kind and length | `intro`, aim 30-50 s; now 40 s at Normal text speed (was 38.9 s, 5 faults) |
| Where, when | stages `birdbath-basin` (the job), `salt-plow-blockade` (the cutaway) and `kiln-shrine` (not shown: the player drives there); dawn, `sky: 'golden'` |
| Before / after | before: `salvage-raid-outro` (the night at the basin). After: the drive north, the shrine, the blockade, the derby on the ice; then `kiln-resin-outro` at Theo's barrel |

## 1. Purpose in the story

Chapter 3 asks whether the crew can survive losing everything. The cure needs fresh resin, and the way to it is blocked
by the HOA. This scene only sets the job up. The old scene played the whole fetch under narration before the player had
done any of it ("One sensible argument and two plow drivers later, the road is clear"). That is cut: the player does the
arguing, on the road.

## 2. The player's feeling

- **In:** warm for one night, and a bit useless (the crew is waiting on them).
- **Out:** clear on the job (resin from the northern shrine, the blockade is in the way, hold the basin for ninety
  seconds) and a flicker of dread (the HOA is on the highway).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Father Loam | to cure Pip's arm before the resin sets | the empty jar, the HOA on the highway | blessing, gentle pressure, "my child" | hands the player the job |
| Pip | to be useful; to be told he is not a bother | his own arm (armless: a stump, nothing held) | run-on impatience, a joke about hats | gets the nod: the job is taken for him |
| HOA plow driver 1 | to keep the highway shut | the player, the road, his orders | clipboard, the rote order | (silent after the order) |
| HOA plow driver 2 | to hold the line | the shouting driver | arms folded | (silent) |
| The player | to know what is being asked | Loam's indirection | one question, then a nod | takes the job |

## 4. Subtext

- Pip is afraid he is a weight (he has one arm, no bay, a cousin who is regent). "Ninety seconds?" is his bravado on his
  shoulder.
- Loam is kind first and odd second: the jar joke is a way of not saying "I am worried".
- The plows are not evil: they are men "afraid to skid". The HOA is the same fear, with a clipboard.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | Loam close, a `knock` as the empty jar goes over; he leans over the stove. |
| 2 | 3-8 | Pip | Pip on the bench, armless: "How empty? A-little-bit empty?" |
| 3 | 8-14 | Loam turns the jar | A second `knock`, a held pause; Pip: "Okay. Very empty." |
| 4 | 14-21 | The way | Loam to the player: "The northern shrine weeps fresh resin. Up the highway, past the bend." The player's reaction. |
| 5 | 21-34 | Turn: the blockade | Tension music. A 2-second wide of the two HOA plow vans across the road, `engine-rev`. A low MS of driver 1: "Highway's closed. Salt in progress. HOA orders." Driver 2 folds his arms. |
| 6 | 34-42 | Back at the basin | Frost returns. Pip: "They are salting the ice. Who salts ice?" Loam: "Men who are afraid to skid." |
| 7 | 42-50 | The job and the button | Loam: "Bring me the resin. Then hold the basin while it sets." Pip: "Ninety seconds? I've glued a hat in less." The player's nod. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `L.single('loam','mcu')` | 35 | locked | Loam | the hook, close and warm |
| 2 | `L.single('pip','mcu')` | 35 | locked | Pip | his line, on the bench |
| 3 | `L.single('loam','mcu')` (knock, lean) | 35 | locked | Loam | the second knock is the picture |
| 4 | `L.single('pip','mcu')` | 35 | locked | Pip | "Okay. Very empty." |
| 5 | `shot('loam','mcu',{toward:'player'})` | 35 | locked | Loam | the directions, eyeline to the player |
| 6 | `reaction('player', {toward:'loam'})` | 35 | locked | the player | a held beat (1.2 s) |
| 7 | `spot('salt-plow-blockade','wide')` | 52 | locked | the plows | the establishing: the road is shut |
| 8 | `P.single('plow1','ms',{height:'low'})` | 40 | locked | driver 1 | low: the petty power is shot from below |
| 9 | `reaction('plow2', {toward:'plow1', gesture:'crossArms', side:-25})` | 35 | locked | driver 2 | the arms fold; a 1.2 s hold |
| 10 | `spot('birdbath-basin','wide')` | 46 | locked | the basin | back home |
| 11 | `L.single('pip','mcu')` | 35 | locked | Pip | "Who salts ice?" |
| 12 | `L.single('loam','mcu')` | 35 | locked | Loam | "Men who are afraid to skid." |
| 13 | `shot('loam','mcu',{toward:'player'})` | 35 | locked | Loam | the job |
| 14 | `L.single('pip','mcu')` | 35 | locked | Pip | the button |
| 15 | `reaction('player', {toward:'pip', gesture:'nod'})` | 35 | locked | the player | the nod: the job is taken |

Sides: Loam and Pip on `coverage('loam','pip', 1)`. The plows on `coverage('plow1','plow2', 1)`. The player's shots are
on the Loam side (`toward: 'player'`, default swing), which the checker accepts: no crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Loam | The jar is empty, and the Kiln is not a patient god. | the hook: a line in a picture (the jar) |
| Pip | How empty? A-little-bit empty? | Pip's rhythm: a question that answers itself |
| Pip | Okay. Very empty. | the comic beat of the jar, after the knock |
| Loam | The northern shrine weeps fresh resin. Up the highway, past the bend. | the directions, kept to landmarks; no grid coordinates |
| Plow 1 | Highway's closed. Salt in progress. HOA orders. | the blockade; "HOA orders" is the Vance line's cousin, not repeated elsewhere |
| Pip | They are salting the ice. Who salts ice? | Pip's question nobody asked |
| Loam | Men who are afraid to skid. | Loam's wit: the plows, and the HOA by implication |
| Loam | Bring me the resin. Then hold the basin while it sets. | the job, in two clauses |
| Pip | Ninety seconds? I've glued a hat in less. | the button; Pip's bravado |
| ~~Loam~~ | ~~Hold the basin for ninety seconds while I cure your arm.~~ | cut: folded into "hold the basin while it sets" |
| ~~Loam~~ | ~~No Kiln-Resin past the blockade, pal. HOA orders. Turn around.~~ | replaced by the plow driver's shorter line; "pal" is the driver's voice |
| ~~Narrator~~ | ~~The northern shrine. Resin still drips from the ceiling, warm as a stove.~~ | cut: describes the picture, and the shrine is the player's to see |
| ~~Narrator~~ | ~~One sensible argument and two plow drivers later, the road is clear.~~ | cut: narrates the gameplay the player has not done yet |
| ~~Narrator~~ | ~~Ninety seconds later.~~ and the fade | cut: the derby is played by the player; the fade makes the scene end on the job |

Names checked: `npm run lore -- find "Kiln-Resin"`, `"salt plow"`, `"Men who are afraid"` (no prior use).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `wind`; `knock` on the empty jar | the hook is a sound |
| 0 | `frost` | the basin's theme |
| 21 | `tension` (fade 0.3); `engine-rev` at the plow van | the blockade is threat, not comedy |
| 34 | `frost` back (fade 0.5) | home, cold, and the joke about the ice |

No stinger. No held silence. The scene is a job, so it keeps the rhythm up.

## 9. Blocking and vehicles

- Loam at the rim (-4,-342), holding the `clay-jar`. Pip seated on the bench (14,-348), armless, nothing held. The player at
  the rim (4,-332), facing the basin.
- The two HOA vans parked across the highway at `carMark('salt-plow-blockade','salt-plow-1')` and `'salt-plow-2'` (the
  vans are not moved). Plow driver 1 at (-12,-390), driver 2 at (12,-390); both on their marks.
- The player ends on foot at (1,-336), by the basin, after the nod.

## 10. The button

Pip's line ("Ninety seconds? I've glued a hat in less.") and the player's nod: the job is taken, and the joke is Pip's
brave face over a fear the audience can see. The scene ends on the player walking to the stove.

## 11. Self-check

- [x] The scene has a want (the resin), an obstacle (the HOA, the ice) and a turn (the job is given to the player).
- [x] The hook lands in 3 s (a `knock`, Loam close).
- [x] Every line under 16 words; the picture is not narrated; no coordinates; no narration left (the caption is cut).
- [x] Pip and Loam sound like their bible entries; the player's lines are short.
- [x] Every speaker framed MCU, eyeline to the other, facing the camera.
- [x] One side per conversation (Loam/Pip; the plows).
- [x] Music has a reason at each change; no stinger; no held silence.
- [x] Running jokes: "Very empty" and the hat are new; "a hat" is Pip's, planted for the finale's hat ladder.
- [x] Dawn with `sky: 'golden'`: lit faces.
- [x] `npm run cutscene-report` shows the scene OK; it is out of `pacing.baseline.ts` after the planner removes it.
- [x] Watched at 960x600 and 390x844: the hook, the jar, the plow vans and the job read. A clay jar at the rim sits in front
      of Loam's lower body for part of the directions line (dressing, not moved; accepted).
- [x] `direction.notes` points here.
