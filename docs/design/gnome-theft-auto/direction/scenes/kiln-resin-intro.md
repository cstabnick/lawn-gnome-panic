# Director's notes: `kiln-resin-intro`

| | |
| --- | --- |
| Scene | `kiln-resin-intro` in `src/cutscene/scenes/story/ch3b.ts` |
| Played by | quest `ch3-kiln-resin-ice` ("Kiln-Resin & Black Ice", story row 36) as its intro, given at the Frozen Birdbath Basin |
| Kind and length | `intro`, aim 30-60 s; 52.6 s at Normal text speed, no faults |
| Where, when | stages `birdbath-basin` (the job) and `salt-plow-blockade` (the cutaway); dusk, `sky: 'golden'` |
| Before / after | before: `salvage-raid-outro` (the night at the basin). After: the drive north to the shrine, the plows, the derby on the ice; then `kiln-resin-outro` at Theo's barrel |

## 1. Purpose in the story

Act III asks whether a broken crew can find friends at the edges of the map. This scene carries the Previously in
Loam's first line (the raid took the shop, the Acorn and the arm) and sets the job: resin from the northern shrine, the
HOA on the road, ninety seconds to hold the basin. Father Loam gets his intro card here. Pip, cracked and shivering,
is the start of his act III thaw: he is still the joker, but the joke is chattering.

## 2. The player's feeling

- **In:** a night's rest at the basin and the weight of what was lost.
- **Out:** clear on the job and a little braver. The crew is cold and small, but somebody has a plan.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Father Loam | to cure Pip's arm before the cold sets it wrong | the empty jar, the HOA on the road | plain grief, then the job, "my child" | hands the player the job |
| Pip | to be useful and to hide how cold and scared he is | his own arm, the cold | chattering jokes, a hat joke | gets the nod and the job is taken for him |
| HOA plow drivers (cutaway) | to keep pilgrims off the road | none yet | clipboards, "HOA orders" | none |

## 4. Subtext

- "The Kiln takes in threes" is Loam grieving without saying so. Nobody answers it.
- "These are my regular teeth" is Pip pretending the cold is a personality.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | The basin at dusk, wide: Pip on the bench shivering, one sleeve empty |
| 2 | 3-14 | Previously | Loam: the shop, the Acorn, the arm. His card. Pip flinches |
| 3 | 14-24 | Setup | The jar is upended over the stove: "very empty". Pip's regular teeth |
| 4 | 24-38 | Turn | The northern shrine, the blockade cutaway, the plow driver, "Men who are afraid to skid" |
| 5 | 38-52 | Button | The job to the player; Pip: "I've glued a hat in less. Warmer, though." The player nods and walks off |

## 6. Shot list

Wide establishing from the stage `wide` spot; Loam and Pip in `coverage('loam', 'pip', 1)` mcu singles (one side of
the line); a reaction mcu on Pip (flinch, held a pause) after the card; low ms on the plow driver, crossed-arms
reaction on his mate; the blockade wide from `salt-plow-blockade`; the player's nod as a reaction mcu.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Loam | The shop, the Acorn, the arm. The Kiln takes in threes. | the Previously, in voice |
| Loam | And the jar is empty. The Kiln is not a patient god. | existing joke, kept |
| Pip | How empty? A-little-bit empty? | |
| Pip | Okay. Very empty. I'm not shivering. These are my regular teeth. | the cold, played as bravado |
| Loam | The northern shrine weeps fresh resin. Up the highway, past the bend. | the where |
| Plow driver | Highway's closed. Salt in progress. HOA orders. | |
| Pip | They are salting the ice. Who salts ice? | |
| Loam | Men who are afraid to skid. | |
| Loam | Bring me the resin. Then hold the basin while it sets. | the job |
| Pip | Ninety seconds? I've glued a hat in less. Warmer, though. | |

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | wind bed, `frost` music | the Fells at dusk |
| 1-3 | cloth rustle on Pip | the shiver, heard before it is explained |
| card | the intro stinger and snap | Loam's first story appearance |
| knocks | `knock` twice on the jar | the empty jar |
| 24 | `tension`, engine-rev at the plows | the HOA on the road |
| 33 | back to `frost` | the basin again |

## 9. Blocking and vehicles

Stage marks of `birdbath-basin`: Loam at the rim with the clay jar, Pip seated on the bench (sit gesture), the player
at the rim. Plow drivers and plows at the `salt-plow-blockade` marks. The player ends one step toward the road.

## 10. The button

Pip's hat joke and the player's nod, then the walk to the road. The right last moment: the job is accepted with a
gesture, not a speech.

## 11. Self-check

- [x] The scene has a want, an obstacle and a turn; the Previously is in one breath.
- [x] The hook lands in 3 s: the shivering Pip, no narration.
- [x] Every line is under 16 words; the cutaway is picture first.
- [x] One side of the line per conversation.
- [x] `npm run cutscene-report` shows the scene OK.
- [x] `direction.notes` in the scene points at this file.
