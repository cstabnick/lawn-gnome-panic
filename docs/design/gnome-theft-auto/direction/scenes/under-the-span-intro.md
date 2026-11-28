# Director's notes: `under-the-span-intro`

Watch it at `http://localhost:5310/?no-intro&cutscene=under-the-span-intro`.

| | |
| --- | --- |
| Scene | `under-the-span-intro` in `src/cutscene/scenes/story/m10-under-the-span.ts` |
| Played by | quest `m10-under-the-span` ("Under the Span") as its intro, given at Side-Valve Salvage |
| Kind and length | `intro`, aim 30-60 s; 30.4 s at Normal text speed, no faults |
| Where, when | stage `side-valve-bay` (the bay apron and the workbench); day |
| Before / after | before: Bodega is happy and Asphalt is home (row 9). After: a search of three scrap bins downtown, then Hogweed's yard |

## 1. Purpose in the story

Act I's light-relief run (rows 9-11). Pip wants a radio jammer and will not say why, and this scene is where the player
learns that he will not say. It sets up row 10's chain (Hogweed's trade, the Dewdrop, the citation) and plants Pip's
Fescue dodge: he answers a plain question with "Birds." The player's "What is it really for?" is the question the whole
row keeps asking and never gets answered.

## 2. The player's feeling

- **In:** the bank and the debt are behind them; Pip is the crew's loud one, and this is a Tuesday.
- **Out:** amused by Pip's obvious lie, sure of the job (three bins, then Hogweed), and a little curious about the jammer.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Pip | to get a jammer without saying what it is for | the player's plain questions | circles the bench, deflects, a lie that undoes itself | sends the player off, still lapping |
| The player | to know what they are being sent to do | Pip's deflection | the flat question, twice | takes the job anyway |
| Cam (background) | none; sweeps the apron | n/a | watches the bay | stops sweeping on the last beat |

## 4. Subtext

- Pip's "Birds" is a joke he knows is bad. Under it: the jammer is for something he cannot say in front of Tansy.
- Cam's stare plants the sweeper's interest in the crew's business (rows 5 and 8).

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-5 | Hook | Pip laps the workbench at a walk, a radio hisses on the bench, "Radio jammer, radio jammer..." |
| 2 | 5-11 | Setup | He stops dead; "What are you jamming?" "Nothing! Birds. It is totally legal. Do not tell Tansy." |
| 3 | 11-14 | Reaction | The player's stillness |
| 4 | 14-24 | Turn | The job: Hogweed under the Unfinished Span, three bins downtown: spring, bolt, panel |
| 5 | 24-30 | Button | "What is it really for?" "...Birds." and he laps the bench at a run; Cam stops sweeping |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `SV_TALK.single('pip','ms')` | 40 | follows his lap | Pip | the hook is the motion and the line |
| 2 | `SV_TALK.single('player','mcu')` | 35 | locked | the player | the flat question |
| 3 | `SV_TALK.single('pip','mcu')` | 35 | locked | Pip | the lie |
| 4 | `reaction('player','mcu')` | 35 | locked | the player | the stillness |
| 5 | `SV_TALK.single('pip','ms')` | 40 | locked; point gesture | Pip | the job |
| 6 | `SV_TALK.single('player','mcu')` | 35 | locked | the player | the question that is not answered |
| 7 | `SV_TALK.single('pip','mcu')` | 35 | locked | Pip | "...Birds." |
| 8 | `track` Pip's lap | 50 | tracks | Pip | the button: he runs; Cam turns to watch |

All singles of Pip and the player share `coverage('pip','player',1)`. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Pip | Radio jammer, radio jammer. Where does a gnome even get a radio jammer? | the hook; run-on, the need |
| Player | What are you jamming? | the straight man |
| Pip | Nothing! Birds. It is totally legal. Do not tell Tansy. | the lie that undoes itself (bible: Pip's second sentence) |
| Pip | Hogweed Sprocket, under the Unfinished Span, builds anything for scrap! | the turn: who and where, one place |
| Pip | Three scrap bins downtown. Spring, bolt, panel. Bring him those. | the objective |
| Player | What is it really for? | the question the row never answers |
| Pip | ...Birds. | the button |

"Okay, hear me out" is not used (once an act; row 15). Names checked: `npm run lore -- find "Hogweed"`, `"Underspan"`.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `turfton` music, `street` bed | the crew's world, a light day |
| 0-2 | `static` at the bench | the radio he is fighting |
| 9 | `keys` at Pip | he jingles his keys when lying |
| 25 | `clatter` | the lap restarts |

No stingers: a comedy beat with no reveal.

## 9. Blocking and vehicles

- The player at the stage mark (-156, 70). Pip starts at (-158.6, 73.2) and walks a lap of the bench (the bench is at
  (-158, 76)), ending by the bench at (-157.4, 73.6) to face the player. Cam stands at his mark (-156, 68), turns to watch on the last beat.
- No vehicles. The player ends where they started: the quest's exit is the bay.

## 10. The button

Pip's "...Birds." and the sound of him lapping the bench at a run, Cam's head turning. The last image is the one thing he
will not say, in motion.

## 11. Self-check

- [x] Want, obstacle, turn: the jammer against the question; the job as the turn.
- [x] Hook in 3 s on a character and a sound; no narration.
- [x] Every line under 16 words; nobody says what the picture shows; one place name per line.
- [x] Pip in his own voice; the player short.
- [x] Every speaker MS or closer, facing the camera.
- [x] One side of the line (`coverage('pip','player',1)`).
- [x] Music `turfton`, no stinger.
- [x] Running jokes: the "Okay, hear me out" ladder is not spent; Cam's broom planted; Pip's Fescue dodge begins (row 14, row 26).
- [x] Day scene.
- [x] `npm run cutscene-report` shows the scene OK.
- [x] `direction.notes` points here.
