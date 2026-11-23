# Director's notes: `sq-snail-rigging-intro`

A spy thriller at snail height. Re-directed against [../bible.md](../bible.md); the template is [../TEMPLATE.md](../TEMPLATE.md).
Watch it at `http://localhost:5310/?no-intro&cutscene=sq-snail-rigging-intro`.

| | |
| --- | --- |
| Scene | `sq-snail-rigging-intro` in `src/cutscene/scenes/side/snailRigging.ts` |
| Played by | quest `sq-snail-rigging` ("Snail-Racing Rigging"), given by Shelldon in his alley |
| Kind and length | `intro`, aim 30-60 s; now about 50 s at Normal text speed (was 57.9 s, 16 faults) |
| Where, when | stage `shelldon-alley` (Shelldon's Dumpster Alley), dawn; `sky: 'golden'` |
| Before / after | before: the player is told about the cry for help by the radio bulletin; the alley is the start. After: the drive or walk to the downtown slug paddock (stage `snail-paddock`), then `sq-snail-rigging-swap` |

## 1. Purpose in the story

Turfton's conspiracy fringe is a race, and the player is asked to tip it. This scene introduces Shelldon as the only
operator who runs a network on snails, and plants the Fizz Cup gravel joke (he refuses paving). The job is the espresso
slugs. The reward (the tinfoil brim) is the lure; the bookies are the catch, and the catch goes in the button.

The old scene was a single 44-second dolly with seven lines, with Shelldon's back to the camera, and a caption up front.
It was a briefing with a pretty camera.

## 2. The player's feeling

- **In:** curious and a little suspicious: a snail has come to find them, which is a red flag.
- **Out:** amused and wary. They know the job (swap the bowls at the downtown paddock, walk, do not run), they want the
  brim, and they have a question about the bookies that the button answers.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Shelldon | to get the slugs asleep so his couriers win | the syndicate's espresso; the paving (he will not walk on it) | conspiracy capitals, whispered, the snail's pace | sends the player in, with the catch in his face |
| The player | to know what the job costs | Shelldon's indirection | three short questions | takes the job (no line says so; the nod is in the picture) |

## 4. Subtext

- Shelldon is frightened of the bookies and of being watched; the lid knock is the first time he says it out loud.
- "Walk. Not run." is the player's instruction and Shelldon's fear: running is how they know.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-3 | Hook | A dumpster lid knocks (`knock`) as the camera creeps in low over the grass. |
| 2 | 3-11 | Setup | Shelldon, low, face to the player: "Keep to the grass. The paving is listening." The player: "You sent a snail to find me." |
| 3 | 11-30 | Want and the job | The espresso slugs, the decaf greens, the fence gap. Three player lines, short. A point at the paddock. |
| 4 | 30-38 | Walk, not run | The player's dry instruction, Shelldon's fear. |
| 5 | 38-46 | Turn | The knock again. Shelldon flinches; the music drops out; "Not the wind. The wind does not knock." The player: "What was that?" |
| 6 | 46-50 | Reward | "There is a tinfoil brim in it for you. Conspiracy grade." (`mystery` stinger). The player: "What is the catch?" |
| 7 | 50-53 | Button | Shelldon, low, deadpan: "The bookies. And the slugs. Mostly the bookies." |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `dolly` from (-95, 64) to (-92, 66.5), 0.5 m up, 3 s | 30 | creeps in | Shelldon | snail height, the grass in the foreground |
| 2 | `coverage('shelldon','you',1).single('shelldon','mcu',{height:'low'})` | 35, low | locked | Shelldon | the power is his, shot from below |
| 3 | `TALK.single('you','mcu')` | 35 | locked | the player | the straight man |
| 4 | Shelldon low, then the player, then Shelldon, alternating singles | 35 | locked | whoever speaks | every speaker is in frame for their line |
| 5 | Shelldon low with a `point` gesture | 35, low | locked | Shelldon | the paddock is off to the side |
| 6 | Shelldon, `flinch` and a `knock` sfx | 35, low | locked | Shelldon | the turn lands on his face |
| 7 | Player, then Shelldon, then player, then Shelldon (button) | 35 | locked | alternating | the catch lands on him |

One side of the line for the whole scene: `coverage('shelldon', 'you', 1)`. No crossings.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Shelldon | Keep to the grass. The paving is listening. | the hook line; the paving joke, not a road directive |
| Player | You sent a snail to find me. | the straight man's question as a statement |
| Shelldon | Three snails. Only one was late, and he was late on purpose. | was 11-word line, kept (12 words) |
| Player | Espresso slugs. Lovely. | new: the player's dry reaction, one line in three |
| Shelldon | The downtown slugs are on espresso. My couriers come back jittery. | split from the 24-word line |
| Player | So I swap some bowls. | the job in the player's words |
| Shelldon | Decaf dandelion greens. The favourites sleep at the first bend. | the fix, in two short sentences |
| Player | Where do I go in? | new: the question the player must ask |
| Shelldon | Through the fence gap. Swap the bowl. Walk out. | the instruction, short clauses |
| Player | Walk. Not run. | the player repeats it back, the dry joke |
| Shelldon | Running is how they know. | the fear, which is the scene's tension |
| Shelldon | Not the wind. The wind does not knock. | the turn; not describing the picture |
| Player | What was that? | |
| Shelldon | There is a tinfoil brim in it for you. Conspiracy grade. | the reward, the stinger lands on it |
| Player | What is the catch? | |
| Shelldon | The bookies. And the slugs. Mostly the bookies. | the button |
| ~~Narrator~~ | ~~Dumpster Alley, dawn. The snails are awake. Shelldon is awake. Nobody else is.~~ | cut: the caption described the picture; the snails and the knock do it |
| ~~Shelldon~~ | ~~The snails will tell me when you are done.~~ | moved to the outro's button, where it pays off |

Names and facts checked: `npm run lore -- find shelldon` (Shelldon "No-Trail" Mucilage, Snail-Mail Express, the
grass verges, the tinfoil brim, the bookies). The lore sheet puts the photo finish in the alley and the couriers racing a
decaf slug: that is the outro's picture.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `knock` sfx; `street` ambience; `heist` music | the hook is a sound: a lid nobody touched |
| 38 | music out (fade 0.6), a `pause` beat | the turn: the silence makes the knock land |
| 46 | `mystery` stinger on the reward line | the one sting: the reward is a conspiracy |

Stingers: one. Silence: one `pause` (1.2 s), not a held silence.

## 9. Blocking and vehicles

- Shelldon at his mark (-88, 72), kneeling at the lettuce bed, faces the player (`exchangeLooks`). He does not walk: the
  lid is the move, the point is his gesture.
- The player at (-76, 70), facing Shelldon. Still: the player is never a walker in this scene.
- The coach is parked on the grass (castRide), and the three riding-snail couriers sit where they are.
- The player ends where they started, near Shelldon, which is where the quest expects them after an intro.

## 10. The button

Shelldon's face at snail height, deadpan: "The bookies. And the slugs. Mostly the bookies." Then a pause. It is right
because the catch is the joke, and the joke is his straight face.

## 11. Self-check

- [x] The scene has a want (the job), an obstacle (the espresso, the paving) and a turn (the knock).
- [x] The hook lands in 3 s (the knock sfx); no opening narration; no caption.
- [x] Every line under 16 words (longest 12); nobody says what the picture shows.
- [x] Shelldon sounds like his bible entry (conspiracy capitals, refuses paving); the player's lines are short.
- [x] Every speaker framed MCU, facing the camera, for their line (`coverage` singles, `toward` the listener).
- [x] One side of the line per conversation.
- [x] Music changes have reasons; one stinger; one pause.
- [x] Night and dark: the scene is `sky: 'golden'` (dawn).
- [ ] `npm run cutscene-report` shows the scene OK: see the report line in the issue report.
- [ ] `npm test` (line of sight): see the issue report.
- [x] `direction.notes` points here.
