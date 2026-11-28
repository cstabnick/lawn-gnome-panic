# Director's notes: `drainpipe-court-intro`

| | |
| --- | --- |
| Scene | `drainpipe-court-intro` in `src/cutscene/scenes/story/m14-drainpipe-court.ts` |
| Played by | quest `m14-drainpipe-court` ("Drainpipe Court") as its intro, given by Pip on the old bench |
| Kind and length | `intro`, aim 30-60 s; 43.8 s at Normal text speed |
| Where, when | stage `drainpipe-bench` (the north side of Drainpipe Court); dusk (`sky: 'golden'`) |
| Before / after | before: the diner on Route South (row 13), a laugh. After: the walk out to the east hoop (`drainpipe-court-mid`) |

## 1. Purpose in the story

Pip has lost his toolbox on a bet and is too bruised to pretend otherwise. The scene is funny on purpose (act I is funny
first, sincere once): it sets up the sincere outro by showing Pip small, and it introduces Cardoon "Swish" Trowelly, who
keeps the won box dusted and never explains why. The toolbox with its duster is the court's own vignette
(`court/life.ts`); the scene's only moving piece is Swish coming over to use it.

## 2. The player's feeling

- **In:** a round of errands, then a friend who looks wrong.
- **Out:** amused by Swish, a little protective of Pip, sure of the job (beat Swish to seven for the box).

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to get his toolbox back without admitting he needs help | his own bet; Swish's patter | run-on excuses, then a plain plea | asks, with "Please?" |
| Cardoon | to be seen as the nearest thing the court has to a rule | Pip's indignation | sing-song patter, arithmetic as an alibi | accepts the challenge, "I will go easy" |
| The player | to know what is wrong | Pip's tic | one short question, one word | takes the job: "Seven." |

## 4. Subtext

- Pip's fear is being the family embarrassment: the loss is a joke he tells so he does not have to feel it.
- Swish's dusting is care he will not name; the scene plays it as a gag and lets the outro show the rest.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Pip, mcu, on the bench: "Okay, hear me out. I lost my toolbox at this court." |
| 2 | 5-15 | Setup | The player's "Lost it how?"; "Seven free throws, I said. I hit one."; an insert of the box and its duster |
| 3 | 15-32 | Complication | Swish crosses the court with a feather duster; "Swish. That's me." and the intro card; the lid line; Pip's outrage; "that is arithmetic" |
| 4 | 32-40 | Turn | Pip drops the jokes and asks: "Win it back for me. One game, seven points. Please?"; "Seven." |
| 5 | 40-44 | Button | Swish, ms: "Any time, chief. I will go easy." and a ball thudding as he walks back to the hoop |

## 6. Shot list

| # | Shot | Lens | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1-3 | `PIP_PLAYER` singles mcu (Pip, player, Pip) | 35 | locked | the pair on the bench | the setup, one side of the line |
| 4 | still cut at the box (fov 34) | 34 | locked | toolbox and duster | an insert: the prop is the joke |
| 5 | `PIP_CARDOON.single('pip','mcu')` | 35 | locked | Pip | "He dusts it every hour." |
| 6-8 | `CARDOON_PLAYER` ms, mcu, ms | 35-40 | locked | Swish | his arrival, his card (mcu), then ms for the second line so no shot holds the card plus a line |
| 9-10 | `PIP_CARDOON` singles (Pip, Swish) | 35 | locked | the rivals | outrage and arithmetic |
| 11 | `PIP_PLAYER.single('pip','ms',{height:'high'})` | 40 | locked | Pip | small, asking |
| 12-13 | `CARDOON_PLAYER` singles (player mcu, Swish ms) | 35-40 | locked | the reply and the button | the player's "Seven." on Swish's side of the line |

Sides: Pip and the player on `coverage('pip','player',1)`; Pip and Swish on `coverage('pip','cardoon',-1)`; Swish and the
player on `coverage('cardoon','player',1)`. Every camera is on the court side of the bench.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Okay, hear me out. I lost my toolbox at this court. | his tic, once; the hook |
| Player | Lost it how? | the straight man |
| Pip | A bet. Seven free throws, I said. I hit one. | the joke is the number |
| Pip | He dusts it every hour. Watch. | sets up the duster, no explanation |
| Cardoon | Swish. That's me. That's the whole name. | his voice (characters.md); the intro card follows |
| Cardoon | Chief, mind the lid. Freshly dusted. | "chief" |
| Pip | It is MY toolbox! | the capitals are his |
| Cardoon | Seven free throws, he hit one. Chief, that is arithmetic. | his alibi |
| Pip | Win it back for me. One game, seven points. Please? | the objective, in Pip's voice |
| Player | Seven. | two words |
| Cardoon | Any time, chief. I will go easy. | he does not mean it |

Names checked: `npm run lore -- find Cardoon`, `Drainpipe`, `Potsworth`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton-dusk` music, `street` bed | dusk at the court, a quiet win's theme |
| 4 | a ball `thud` at the hoop (sfx) | the court is in use, off screen |
| 12, 20 | `cloth` rustle at the box and at Swish | foley on the dusting |
| 25 | the `intro` card (stinger from the step) | Swish's first story appearance |
| 40 | a `thud` as he walks off | the ball he went back to |

## 9. Blocking and vehicles

Pip sits at (-95.9, 21.6). The player stands at (-92.6, 24.6). Swish starts at (-80, 33), walks to (-92.2, 23.1) with a
feather duster (`hold`), and walks back to (-85, 30.5) at the end. The player ends where the quest's exit puts them.

## 10. The button

Swish's ms and his promise to go easy. The last sound is the ball hitting the court, and the player has to beat him.

## 11. Self-check

- [x] Want, obstacle, turn: Pip's plea at 32 s; Swish's arithmetic is the obstacle.
- [x] Hook in 3 s on a character; no narration.
- [x] Every line under 16 words; the objective is in Pip's voice, one place name ("this court").
- [x] One side of the line per pair; the report shows no fault.
- [x] Music: one theme, no stinger but the card.
- [x] `direction.notes` points here.
